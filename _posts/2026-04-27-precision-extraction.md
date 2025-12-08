---
layout: distill
title: Extracting Model Precision from 20 Logprobs
description: We demonstrate that the internal floating-point precision of language models can be inferred from API-exposed logprobs.
date: 2026-04-27
future: true
htmlwidgets: true

authors:
  - name: Anonymous
    affiliations:
      name: Anonymous

bibliography: 2026-04-27-precision-extraction.bib

chart:
  vega_lite: true

toc:
  - name: Introduction
  - name: Preliminaries
    subsections:
      - name: Floating-Point Formats
      - name: How are Logprobs Actually Computed?
  - name: The Precision Extraction Attack
    subsections:
      - name: "Attack 1: Brute Force Search"
      - name: "Attack 2: Inverted Search"
      - name: Handling FP32 Rounding Errors
  - name: Experiments
    subsections:
      - name: Validation Results with Known Ground Truth
      - name: "Precision Collision: Why FP8 E4M3 Gets Misclassified as E5M2"
      - name: Identifying the Precision of OpenAI and Gemini Models
  - name: Discussion
---


## Introduction

While today we mostly think of language models as text *generators*, the log-probabilites they output at each token position have long been used outside of generation contexts, for example to perform classification tasks <d-cite key="classification"></d-cite>, to visualize differences between human-written and AI-generated text <d-cite key="gltr"></d-cite>, and to detect memorized training data <d-cite key="memorization"></d-cite>. 
For this reason, most early LLM APIs exposed **logprobs**, allowing users to easily request these per-token scores when querying models like GPT-3 or Gemini 1.

Recent work has shown that logprobs expose surprising amounts of information about the proprietary models underlying these APIs.
For example, they can be used to extract hidden dimensions and embedding projection matrices from production models <d-cite key="carlini2024stealing"></d-cite>.
In this blog post, we demonstrate another vulnerability: with access to just 20 token logprobs, we can *infer the floating-point precision of the underlying model*.

While the APIs usually return the logprobs as 32-bit floats, internally, models often store their weights and do computations in lower precision (FP16, BF16, FP8) for improved efficiency.
We were curious to answer the question: is it possible to infer the internal precision of the proprietary model underlying an LLM API using the returned logprob values alone?
We show the answer is **yes**.
Our key insight is that the log-softmax computation shifts all logits by a constant, and we can search for shift values that map logprobs back to representable values in a given precision.

Our technique seems to suggest that older OpenAI models (GPT-3.5, GPT-4) use FP32 logits, while newer models (GPT-4o, GPT-4.1) use BF16. This transition likely reflects the adoption of different base architectures or training methods.

**Why does this matter?** Precision of the logits reveals architectural and inference details that providers typically keep secret such as quantization level and model precision.
For competitive reasons, companies rarely disclose whether they trained or served quantized models.
Our attack provides a measurement technique that can track these changes over time, enabling researchers to study the evolution of deployed systems and validate provider claims about model quality.

However, simple defenses (such as adding random noise to the logprobs before the API returns them to the user) can entirely defend against this class of attacks.
Moreover, LLM deployers have been moving away from exposing logprobs in their APIs, so while we think our attack is pretty neat, we don't expect it to stick around for newer APIs and models.

## Preliminaries

### Floating-Point Formats

So, what is a floating point number? In the IEEE 754 standard, a floating-point number consists of three parts: the sign, exponent, and mantissa.
The **sign** is always a single bit, but the remaining bits are divided up between the exponent and the mantissa.
The **exponent** determines the magnitude (in powers of 2), while the **mantissa** determines the precision within that magnitude. More mantissa bits mean finer granularity between representable values.
Here are some common floating point number formats:

| Format | Total Bits | Exponent | Mantissa | Min Step (near 1.0) |
|--------|-----------|----------|----------|---------------------|
| FP32   | 32        | 8        | 23       | ~1.2×10⁻⁷          |
| FP16   | 16        | 5        | 10       | ~9.8×10⁻⁴          |
| BF16   | 16        | 8        | 7        | ~7.8×10⁻³          |
| FP8 E5M2 | 8       | 5        | 2        | ~0.25              |

"Min Step" indicates the smallest difference in values that can be represented in this format.
BF16 is particularly interesting: it has the same exponent range as FP32 (so it can represent the same magnitude) but with much coarser precision.
This makes it a common choice for neural network training and inference where dynamic range matters more than fine precision in avoiding numerical issues.

When a lower-precision value is converted to the higher-precision FP32, the extra mantissa bits are filled with zeros:

```
BF16 mantissa:  1.0101010
                    ↓ convert to FP32
FP32 mantissa:  1.0101010_0000000000000000
                        └─ 16 trailing zeros
```

A BF16 value has 7 mantissa bits; when viewed as FP32, it has **16 trailing zeros** (23 - 7 = 16).
When a FP32 number ends with a suspicious number of trailing zeros, we can infer that the original number was probably a BF16.

### How are Logprobs Actually Computed?

Logprobs aren't the raw model outputs.
Models output logits, unnormalized scores for each item in the model's vocabulary.
Logprobs are computed from the logits by taking a log-softmax function over them.
For example, here's the implementation in the vLLM ([sampler.py L207](https://github.com/vllm-project/vllm/blob/d44a63c6d6e1a545aff270b3b85cf231ef779dab/vllm/v1/sample/sampler.py#L207)) library:

{% highlight python %}
logprobs = logits.log_softmax(dim=-1, dtype=torch.float32)
{% endhighlight %}

Let's look at how log_softmax is actually implemented.
Here's the PyTorch CUDA kernel ([SoftMax.cu L37-47](https://github.com/pytorch/pytorch/blob/04bd7e6850e8efec77994963ffee87549555b9c3/aten/src/ATen/native/cuda/SoftMax.cu#L37-L47)):

{% highlight cpp %}
template<typename T, typename AccumT, typename OutT>
struct LogSoftMaxForwardEpilogue {
  __device__ __forceinline__ LogSoftMaxForwardEpilogue(AccumT max_input, AccumT sum)
    : max_input(max_input), logsum(std::log(sum)) {}

  __device__ __forceinline__ OutT operator()(T input) const {
    return static_cast<OutT>(input - max_input - logsum);
  }

  const AccumT max_input;
  const AccumT logsum;
};
{% endhighlight %}

The kernel is templated on three types: `T` (input type, e.g., BF16), `AccumT` (accumulation type, usually FP32), and `OutT` (output type).
Ignoring the `max_input` shift (which is there for numerical stability), we have:

$$
\text{logprob}_i = z_i - \underbrace{\log\left(\sum_j \exp(z_j)\right)}_{w}
$$

where $z_i$ are the **logits** (raw model outputs) and $w$ is the log-sum-exp normalization constant.
The key line in the kernel is `input - max_input - logsum`: the BF16 `input` is implicitly promoted to FP32 for the subtraction.
When promoted, the BF16 value has trailing zeros in its mantissa, but the subtraction of `logsum` destroys this pattern.

## The Precision Extraction Attack

All logprobs from a single prediction share the same normalization constant $w$, which is computed in FP32.
When you subtract this FP32 value from a BF16 logit, the trailing zeros fingerprint gets destroyed.
So without knowing the value for $w$, we can't just look at logprobs and count trailing zeros.
But if we could recover $w$, we could add it back to get the original logits and check their precision.

### Attack 1: Brute Force Search

The most straightforward approach is to iterate through all $2^{32}$ possible FP32 values of $w$.
For each candidate, compute $z_i + w$ for all logprobs and count trailing zeros.
The $w$ that maximizes total trailing zeros is the true normalization constant.

Here's the algorithm:
```
for each possible FP32 value w:
    score = sum of trailing_zeros(logprob[i] + w) for all i
    keep w with highest score
```

This works, but iterating through $2^{32}$ candidates takes about half an hour per set of logprobs.
We can do better.

### Attack 2: Inverted Search

Instead of searching over all possible $w$, we exploit a constraint: the recovered logits $\text{logprob}_i + w$ must be representable in the target precision.
For BF16, there are only 65,536 representable values.
The first logprob gives us $\text{logprob}_0 + w = z_0$, so $w = z_0 - \text{logprob}_0$.
Since $z_0$ must be one of 65,536 BF16 values, we have at most 65,536 candidates for $w$.

Each remaining logprob filters this set: we keep only candidates where $\text{logprob}_i + w$ is also representable.
If any candidate survives, we've found a valid $w$ and confirmed the precision.
We test precisions from most restrictive to least (all FP8 values are representable in BF16, all BF16 values in FP16, etc.); if none match, we conclude FP32.

Here's the algorithm:
```
for precision in [FP8_E5M2, FP8_E4M3, BF16, FP16]:
    candidates = {z - logprob[0] : z in all representable values}
    for each logprob[i]:
        candidates = {w : w in candidates and (logprob[i] + w) is representable}
    if candidates is non-empty:
        return precision
return FP32
```

This reduces worst-case complexity from $O(2^{32})$ to $O(65536 \times N)$ where $N$ is the number of logprobs - from hours to milliseconds.

### Handling FP32 Rounding Errors

There's a subtle issue: checking whether `logprob[i] + w` is "representable" requires care.
FP32 addition is not perfectly invertible: if we compute `logprob = logit - w`, then `logprob + w` may not exactly equal `logit` due to rounding.

Consider this concrete example:

| Token | Logprob (FP32) | Quantized Logit (BF16) |
|-------|---------|-----------------|
| `"\n"` | -1.012399435043335 | 2.125 |
| `" I"` | -2.371774435043335 | 0.765625 |
| `" "` | -2.828805685043335 | 0.30859375 |
| `" You"` | -3.793649435043335 | -0.65625 |
| `" It"` | -4.059274673461914 | -0.921875 |

The normalization constant is `w = 3.137399435043335`.
When we compute `logprob[4] + w` to recover the last logit, we get `-0.9218752384185791` instead of exactly `-0.921875`.
The difference (~2×10⁻⁷) is vanishingly small, but it completely destroys the trailing-zeros pattern.

A naive implementation checking for exact representation in BF16 would fail to match and reject BF16.
The fix is to check whether `logprob[i] + w` is *close to* a representable value:

```
is_representable(x, precision, tolerance=1e-5):
    rounded = round_to_nearest(x, precision)
    return |x - rounded| < tolerance
```

With this tolerance, we correctly identify BF16 even when FP32 arithmetic introduces small rounding errors.

## Experiments

For both experiments below, we use the same methodology: 100 prompts with 20 logprobs each.
Prompts are simple templates ("Count from 1 to N", "What is A + B?", "Name N colors", etc.), and we request `max_tokens=1` and collect the top-20 logprobs at that position.
Since the attack operates on the numerical properties of logprobs, the prompts themselves are not important.
Each additional logprob adds another constraint that the candidate $w$ must satisfy, making it less likely for a coarser precision to "get lucky" and pass all checks.

### Validation Results with Known Ground Truth

We validate our detection algorithm using *simulated quantization*: we start with a known FP32 model (GPT-Neo-125M), quantize its logits to various precisions, compute log-softmax, and verify detection accuracy.
Note that in most cases, we only need one set of logprobs to detect the precision, but we repeat the experiment on 100 prompts to see if the attack is robust to variation in prompts.

```vega_lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Detection Accuracy by Precision",
  "width": 350,
  "height": 280,
  "data": {
    "values": [
      {"actual": "FP32", "detected": "FP32", "count": 100},
      {"actual": "BF16", "detected": "BF16", "count": 100},
      {"actual": "FP16", "detected": "FP16", "count": 100},
      {"actual": "FP8 E4M3", "detected": "FP8 E4M3", "count": 89},
      {"actual": "FP8 E4M3", "detected": "FP8 E5M2", "count": 11},
      {"actual": "FP8 E5M2", "detected": "FP8 E5M2", "count": 100}
    ]
  },
  "encoding": {
    "x": {"field": "detected", "type": "nominal", "title": "Detected", "sort": ["FP8 E5M2", "FP8 E4M3", "BF16", "FP16", "FP32"]},
    "y": {"field": "actual", "type": "nominal", "title": "Actual", "sort": ["FP8 E5M2", "FP8 E4M3", "BF16", "FP16", "FP32"]}
  },
  "layer": [
    {
      "mark": "rect",
      "encoding": {
        "color": {"field": "count", "type": "quantitative", "scale": {"scheme": "blues"}, "title": "Count"},
        "tooltip": [
          {"field": "actual", "type": "nominal", "title": "Actual Precision"},
          {"field": "detected", "type": "nominal", "title": "Detected As"},
          {"field": "count", "type": "quantitative", "title": "Count"}
        ]
      }
    },
    {
      "mark": {"type": "text", "fontSize": 12},
      "encoding": {
        "text": {"field": "count", "type": "quantitative"},
        "color": {"condition": {"test": "datum.count > 50", "value": "white"}, "value": "black"}
      }
    }
  ],
  "config": {"axis": {"labelFontSize": 11, "titleFontSize": 12}},
  "usermeta": {"embedOptions": {"actions": false}}
}
```

### Precision Collision: Why FP8 E4M3 Gets Misclassified as E5M2

The 11% misclassification rate for FP8 E4M3 reveals an ambiguity in our attack.
The algorithm finds $w$ by testing whether all recovered logits are representable in a given format.
But sometimes, a *different* $w$ exists that maps the same logprobs to valid values in a coarser format.

#### What does a collision look like?

Here is a concrete example with E4M3-quantized logits:

| | True (E4M3) | Algorithm finds (E5M2) |
|---|-------------|------------------------|
| $w$ | 2.938695 | 4.313695 |
| logit[0] | 1.625 | 3.0 |
| logit[1] | 0.625 | 2.0 |
| logit[2] | 0.625 | 2.0 |
| logit[3] | -0.75 | 0.625 |
| logit[4] | -1.0 | 0.375 |

Both interpretations are mathematically valid given the logprobs.
The algorithm tests E5M2 first (more restrictive) and finds a valid $w$, so it returns E5M2.

#### Why does this happen?

Floating-point step sizes depend on magnitude:

| Magnitude | E4M3 step | E5M2 step |
|-----------|-----------|-----------|
| [0.5, 1) | 0.0625 | 0.125 |
| [1, 2) | 0.125 | 0.25 |
| [2, 4) | 0.25 | 0.5 |

In the example above, the shifted logits (3.0, 2.0, 2.0, 0.625, 0.375) have larger magnitudes, placing them on a coarser grid that happens to also be representable in E5M2.
This ambiguity is fundamental: from logprobs alone, we cannot distinguish between the two interpretations.
That said, multiple samples usually resolve the uncertainty: true E4M3 logits will eventually hit values that E5M2 cannot represent.

#### Why doesn't this happen for higher-precision formats?

Higher precision means exponentially finer grids.
For a BF16 value to accidentally land on a coarser grid after shifting by a different $w$, it would need to hit an increasingly sparse set of valid values, or logits would need to have high magnitudes.
The E4M3/E5M2 overlap is a coincidence of their similar precision; the gap between BF16 and FP8 is wide enough that such collisions become rare.

### Identifying the Precision of OpenAI and Gemini Models

We apply our method to OpenAI and Gemini models with logprobs access.

| Model | Detected Precision | Agreement |
|-------|-------------------|-----------|
| gpt-3.5-turbo | FP32 | 100% |
| gpt-4 | FP32 | 100% |
| gpt-4-turbo | FP32 | 100% |
| gpt-4o | BF16 | 97% |
| gpt-4o-mini | BF16 | 100% |
| gpt-4.1 | BF16 | 100% |
| gpt-4.1-mini | BF16 | 100% |
| gpt-4.1-nano | BF16 | 98% |
| gemini-2.0-flash | FP32 | 100% |
| gemini-2.0-flash-lite | FP32 | 100% |

For OpenAI, the pattern appears clear: older models (GPT-3.5, GPT-4) use FP32 logits, while newer models (GPT-4o onwards) use BF16.
Gemini 2.0 models use FP32.
We note that we measure *logit* precision specifically, not overall model precision - the model could use mixed precision with different formats for different layers.

The imperfect agreement on GPT-4o (3% FP8 E4M3) and GPT-4.1-nano (2% FP16) comes from edge cases at extreme logit magnitudes.
For GPT-4o, prompts like "Say the word 'apple'" produce extremely confident predictions (logit ≈ 14), where BF16's step size happens to align with FP8 E4M3's grid.

## Discussion

**Impact.**
When model deployers are choosing which information to expose in their API, they're juggling a tradeoff between improving utility for users and decreasing the chance that proprietary details get inadvertently leaked.
As far as leaks go, the precision of the underlying model is a relatively minor one.

Knowing a model's precision reveals a small amount of detail about its inference infrastructure.
The FP32-to-BF16 transition in newer OpenAI models may reflect adoption of lower-precision training and inference pipelines on modern hardware.

**Limitations.**
Our detection method has several limitations.
Notably, it requires multiple logprobs from the same forward pass (we use 20).
Some APIs expose logprobs but in limited forms: Cohere only provides logprobs for generated tokens, not top-k alternatives at each position, making our attack inapplicable.
Our method cannot distinguish between float types that have the same number of mantissa bits, such as FP16 and TF32, though this is the only such collision among standard ML formats.
Finally, we detect *logit* precision, not overall model precision.
For example, mixed-precision inference could use different formats for different layers.

**Responsible disclosure.**
We considered the risks before making this attack public.
An attacker gains little from knowing a model's precision alone.
More importantly, due to other known vulnerabilities from exposing logprobs, none of the current frontier models from OpenAI, Google, or Anthropic expose logprobs anymore.
Given the limited utility to attackers and the trend toward restricted API outputs, we believe publishing this technique poses minimal risk.

---
