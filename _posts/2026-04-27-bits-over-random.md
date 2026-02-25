---
layout: distill
title: "The 99% Success Paradox: When Near-Perfect Retrieval Equals Random Selection"
description: For most of the history of information retrieval (IR), search results were designed for human consumers who could scan, filter, and discard irrelevant information on their own. This shaped retrieval systems to optimize for finding and ranking more relevant documents, but not keeping results clean and minimal, as the human was the final filter. However, LLMs have changed that by lacking this filtering ability. To address this, we introduce Bits-over-Random (BoR), a chance-corrected measure of retrieval selectivity that reveals when high success rates mask random-level performance.
date: 2026-04-27
future: true
htmlwidgets: true

# Authors
authors:
  - name: Vyzantinos Repantis
    url: "https://www.linkedin.com/in/vyzantinos-repantis"
    affiliations:
      name: Meta Platforms, Inc.
  - name: Harshvardhan Singh
    url: "https://www.linkedin.com/in/harshvardhan-singh-72487414"
    affiliations:
      name: Meta Platforms, Inc.
  - name: Tony Joseph
    url: "https://www.linkedin.com/in/tony-joseph"
    affiliations:
      name: Meta Platforms, Inc.
  - name: Cien Zhang
    url: "https://www.linkedin.com/in/cienzhang"
    affiliations:
      name: Meta Platforms, Inc.
  - name: Akash Vishwakarma
    url: "https://www.linkedin.com/in/avishwaka"
    affiliations:
      name: Meta Platforms, Inc.
  - name: Svetlana Karslioglu
    url: "https://www.linkedin.com/in/svetlana-karslioglu"
    affiliations:
      name: Meta Platforms, Inc.
  - name: Michael Wyatt Thot
    url: "https://www.linkedin.com/in/michaelthot"
    affiliations:
      name: Meta Platforms, Inc.
  - name: Ameya Gawde
    url: "https://www.linkedin.com/in/ameyagawde"
    affiliations:
      name: Meta Platforms, Inc.


# must be the exact same name as your blogpost
bibliography: 2026-04-27-bits-over-random.bib

# Add a table of contents to your post.
toc:
  - name: Introduction
  - name: The Million-Token Trap
  - name: What Traditional Metrics Miss
  - name: The Librarian Problem
  - name: "The New Baseline: Random Chance"
  - name: The Math
  - name: A Concrete Example
  - name: The Ceiling Problem
  - name: BoR optimistic upper bound
  - name: The Collapse Zone
  - name: What Happens When You Retrieve More?
  - name: The Doubling Rule
  - name: "Case Studies: When Theory Meets Reality"
  - name: When Perfect Success Fails
  - name: AI Agent Tool Selection
  - name: What You Should Do About This
  - name: "Sidebar: SuccessK vs RecallK"
  - name: Final Thoughts
  - name: Acknowledgements


_styles: >
  .fake-img {
    background: #bbb;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
  }
  .fake-img p {
    font-family: monospace;
    color: white;
    text-align: left;
  }
---

## Introduction

For most of the history of information retrieval (IR), search results were designed for human consumers who could scan, filter, and discard irrelevant content on their own. This shaped retrieval systems to optimize for finding and ranking more relevant documents, but not for keeping results clean and minimal, as the human was the final filter.

**Retrieval-augmented generation (RAG)** and tool-using agents flip these assumptions. Now the consumer is often an LLM, not a person, and the model does not skim. In practice, introducing excessive or irrelevant context into the input can dilute the model's ability to identify and focus on the most critical information. When you pass retrieved documents to an LLM:

* It can't ignore irrelevant results. Every irrelevant chunk dilutes the model's attention.
* Noise has a cost. Extra chunks cost tokens, latency, and computation. They also increase the odds that irrelevant or misleading content pulls attention away from what actually matters.

## The Million-Token Trap
You might be thinking: *"But modern LLMs have million-token context windows. Why care?"*

The real question isn't whether a model can fit more context, but whether more context is actually helpful. Beyond a certain point, adding retrieved material (and the accompanying noise) can actively increase computational cost and degrade the quality of output.

In our 20 Newsgroups classification case study, we increased the retrieval depth **K** from 10 to 100 items. This caused LLM accuracy to drop from 66% to 50%, even though the success metric (**Success@K:** the percentage of queries returning at least one relevant item) remained close to 100%. In other words, more retrieved content led to worse results, not better.

This problem is especially severe for agentic systems that use tool-based retrieval, because context quality directly affects downstream decisions. A chatbot might give you a mediocre answer, however, an autonomous agent might call the wrong API, delete the wrong file, or execute the wrong command.

We need a measure that asks: *"Given that I'm retrieving K items and my LLM will consume all of them, how much **selective signal** am I actually getting?"*

That's what Bits-over-Random (BoR) measures. The rest of this post explains how.

## What Traditional Metrics Miss

Recall rewards finding more relevant documents, but is blind to how many irrelevant items you had to pull into the context window to get them. Over-retrieval is actually rewarded. As Manning et al.<d-cite key="manning2008introduction"></d-cite> note, "recall is a non-decreasing function of the number of documents retrieved". Yet the choice of retrieval depth K is often an empirical, application-dependent choice <d-cite key="webber2010similarity"></d-cite>.

Precision measures the relevance of retrieved results and helps limit excessive retrieval. However, it fails to account for the inherent difficulty of the retrieval task. For instance, achieving a 10% precision means something different if the corpus contains 10 relevant items out of 100 versus 10 relevant items out of 10,000. Same precision, very different selectivity.

Ranking metrics (nDCG, RBP, MAP, ERR) penalize burying relevant items, but they do not penalize the presence of irrelevant items when the relevant item is also ranked highly. If you retrieve 100 items and the relevant one is at rank 1, nDCG can be perfect. Yet, RAG systems typically concatenate the top-K results into a single prompt. The LLM still has to read the other 99 items. Rankers optimize ordering, not volume. They don't reduce the token cost of stuffing **K** documents into the context.

In practice, teams end up juggling recall, precision, and ranking metrics. Each captures a different slice of behavior but none reflects the whole picture. There is no single framework that simultaneously accounts for how many items you retrieve, how big the corpus is, and how many items in the corpus are actually relevant to the query.


## The Librarian Problem

Consider a library of $$N = 1{,}000$$ books, with $$R_q = 10$$ books relevant to your query.
Two librarians respond:

* **Librarian A** retrieves $$K = 20$$ books, 6 of which are relevant (precision 30%, recall 60%, F1 40%).
* **Librarian B** retrieves $$K = 12$$ books, 4 of which are relevant (precision 33%, recall 40%, F1 36%).

Traditional IR metrics tend to favor Librarian A (higher recall and F1, similar precision). But Librarian A handed you 14 irrelevant books, versus B's 8. If the librarians are retrievers or tools in an agent workflow and the consumer is an LLM, it must read everything it was given. Those 6 extra unhelpful books retrieved by Librarian A over Librarian B cost tokens, add noise, and waste computational resources.

## The New Baseline: Random Chance

And here's the deeper question: *Beyond comparing A and B, is either of them an objectively skillful librarian? What is the baseline?*

If we compare each librarian to a random baseline (*"what if I picked K books uniformly at random?"*), we can ask which one is actually more selective than chance. Plugging these numbers into the chance-corrected formulas we introduce below shows that Librarian B is more selective than A. For an LLM consuming a fixed-size bundle of text, that selectivity per token is what matters.

This is the key insight: every retrieval problem has a built-in baseline. If you picked **K** items completely at random, you'd still sometimes get lucky and grab something relevant, especially if relevant items are common.

That random success rate is your floor. It tells you how much of your *"success"* is just dumb luck. Bits-over-Random (BoR) measures how far above random success you've climbed.

In today's RAG, agentic, and LLM workflows, we care less about who retrieved the most documents and more about who delivered the most signal with the least noise. By comparing a chosen success metric to random chance, BoR measures true selectivity: how much better is our retrieval bundle than random selection?

Let's break down how it works, step by step.

## The Math

Evaluating a retriever shouldn't require juggling incompatible metrics. To make sense of how well a system is actually performing, we need a baseline. Not just any baseline, but the most honest one possible: pure randomness. The framework below walks through a simple, quantitative way to express *"how much better than random"* your retrieval system really is.

By measuring observed success, computing the expected success of random guessing, and comparing the two on a logarithmic scale, we end up with a clean, intuitive metric: **Bits-over-Random (BoR)**. This gives retrieval performance a natural, information-theoretic interpretation, each bit representing one doubling in effectiveness over chance.

## The Quick-Reference Version

Here's everything you need to remember:

| Symbol | Meaning | Example |
| :---- | :---- | :---- |
| $$N$$ | Total items in corpus. Unit must be defined (e.g., documents, passages) | 10,000 passages or 700 documents |
| $$K$$ | How many items you retrieve per query (top-K) | $$K=10$$ or $$K=100$$ |
| $$R_q$$ | Relevant items in the corpus for a certain query q | $$R_q=1$$ (sparse) or $$R_q=20$$ (many) |
| $$\bar{R}_q$$ | Average relevant items in the corpus per query | ≈1.1 on SciFact, ≈572 on 20 Newsgroups |
| $$P_{obs}(K)$$ | Your observed success rate at K (Note: any success rate can be used here.) | 60% of queries succeed |
| $$P_{rand}(K)$$ | Random-chance success at K | What luck would give you |
| $$\lambda$$ | Heuristic: expected random hits = $$K \cdot \bar{R}_q / N$$ | $$\lambda$$ in the 3–5 range signals collapse |

### Step 1. Measure Your Success Rate

First, pick a success condition. For most RAG systems, the natural rule is:
*"Did I get at least one relevant item in my top-K results?"*

This is called **Success@K** (or coverage). For a batch of queries:

$$P_{\text{obs}}(K) = \frac{\text{number of queries with } \geq \text{ 1 relevant result in top-}K}{\text{total queries}}$$

**Note:** The threshold doesn't have to be 1. You can require at least m relevant documents if your system needs multiple pieces of evidence, for example, "at least 3 supporting passages."


If you retrieved K=10 items for 100 queries, and 60 queries got at least one relevant hit, then $$P_{\text{obs}}(10) = 60 / 100 = 0.60$$.

### Step 2. Calculate the Random Baseline

What if you picked **K** items completely at random? That's your baseline.

For a query where $$R_q$$ items in the corpus are relevant, and the corpus has **N** total items, the hypergeometric distribution tells you the probability of randomly hitting at least one relevant item when picking **K** items:

The probability of picking no relevant items in **K** picks is:

$$P_{\text{none}} = \frac{\binom{N-R_q}{K}}{\binom{N}{K}}$$

So, the probability of picking at least one relevant item is:

$$P_{\text{rand}} = 1 - P_{\text{none}} = 1 - \frac{\binom{N-R_q}{K}}{\binom{N}{K}}$$

**Special case:** If every query has exactly one relevant item ($$R_q = 1$$), this simplifies to:

$$P_{\text{rand}}(K) = \frac{K}{N}$$

For example:

| Parameter | Value |
|-----------|-------|
| $$N$$ | 10,000 |
| $$R_q$$ | 10 |
| $$K$$ | 20 |

$$P_{\text{rand}} = 1 - \frac{\binom{9990}{20}}{\binom{10000}{20}} \approx 0.02$$

This means random selection works **~2%** of the time.

Because we evaluate over many queries, we average these random baselines:

$$\overline{P}_{\text{rand}}(K) = \text{average random success across all queries}$$

$$\overline{P}_{\text{rand}}(K) = \frac{1}{|Q|} \sum\nolimits_{q} P_{\text{rand}}(K; R_q)$$

### Step 3: Enrichment factor: how many times are we better than random chance?

**Enrichment Factor (EF)** is defined as

$$\text{EF} = \frac{P_{\text{obs}}}{P_{\text{rand}}}$$

For a batch of queries, we use the averaged random baseline:

$$\text{EF}(K) = \frac{P_{\text{obs}}(K)}{\overline{P}_{\text{rand}}(K)}$$

An EF of 5 means you succeed 5× more often than random selection. An EF of 100 means you are 100× better. This formulation is consistent with enrichment metrics used in drug discovery screening <d-cite key="truchon2007evaluating"></d-cite>.

### Step 4: Bits-over-Random (BoR): Log Scale conversion of EF

$$\text{BoR} = \log_2(\text{EF}) = \log_2\left(\frac{P_{\text{obs}}}{P_{\text{rand}}}\right)$$

And similarly for averaging:

$$\text{BoR}(K) = \log_2(\text{EF}) = \log_2\left(\frac{P_{\text{obs}}(K)}{\overline{P}_{\text{rand}}(K)}\right)$$

Why $$\log_2$$? Bits are how information theory counts halvings, the same reason why binary search uses powers of 2. Each bit represents one halving of the search space. **BoR = 10** means **10 halvings → 1,024× reduction**.

* **BoR = 0** → You're no better than random
* **BoR = 1** → **2×** better than random
* **BoR = 3** → **8×** better than random
* **BoR = 10** → **1,024×** better than random

Each bit also represents a doubling of selectivity. Our definition follows.

**Selectivity (n.):** The ability of a retrieval system to surface relevant items while excluding irrelevant ones, measured relative to random chance. A system with high selectivity finds needles without bringing along the haystack.

## A Concrete Example

Let's assume you have 10,000 documents. Each query has exactly ten relevant documents ($$R_q = 10$$).
**Note:** Many standard benchmarks such as MS MARCO have $$R_q ≈ 1$$ on average, even sparser than this example.

You are testing two different retriever systems against the same dataset:

| Metric | System A (K=20, 60% success) | System B (K=100, 70% success) |
|--------|------------------------------|-------------------------------|
| P_obs | 0.60 | 0.70 |
| P_rand | 0.01983 | 0.09566 |
| EF (Enrichment Factor) | 0.60/0.01983 = 30.257 | 0.70/0.09566 = 7.318 |
| BoR | 4.92 bits | 2.87 bits |

**System B** has a higher raw success rate (70% vs. 60%) but a BoR score about 2 bits lower than **System A**. This lower score shows **System B** is less selective. It achieves higher coverage by expanding the retrieved set, which reduces informational efficiency. From an information-theoretic view, System B creates a larger *“haystack”* that delivers fewer useful bits of discrimination per query.

## The Ceiling Problem

There's a maximum BoR you can possibly achieve. If your system is perfect, achieving $$P_{\text{obs}}(K) = 1.0$$ (every single query succeeds), the best you can do is:

$$\text{BoR}_{\text{max}}(K) = -\log_2(\overline{P}_{\text{rand}}(K))$$

This ceiling is determined entirely by the random baseline. Using our toy example:

* **System A:** $$\text{BoR}_{\text{max}} = -\log_2(0.01983) = 5.66$$ bits
* **System B:** $$\text{BoR}_{\text{max}} = -\log_2(0.09566) = 3.39$$ bits

System A, even at 60% success, achieves 4.92 bits, already higher than System B's ceiling. No amount of model improvement can help System B catch up. Given its success rate, it chose a retrieval depth K that limits its maximum possible selectivity.

**When the random baseline is already high, even perfection gets you almost nothing.**

## BoR optimistic upper bound

When you don't know how many relevant items $$R_q$$ exist in the corpus for each query, BoR enables you to define an optimistic upper bound by assuming each query has exactly one relevant item. In that case:

$$P_{\text{rand}}(K) \approx \frac{K}{N}$$

And:

$$\text{BoR}_{\text{opt}}(K) = \log_2\left(\frac{N}{K}\right)$$

It's useful to compute the upper bound if calculating exact BoR is not feasible. $$\text{BoR}_{\text{opt}}(K)$$ is an optimistic ceiling: no system on that corpus at depth **K** can have more than about $$\log_2(N / K)$$ bits of selectivity under this assumption.

Note that $$\text{BoR}_{\text{max}}$$ uses actual $$R_q$$ values while $$\text{BoR}_{\text{opt}}$$ assumes $$R_q = 1$$ throughout.

## The Collapse Zone

<iframe src="{{ 'assets/html/2026-04-27-bits-over-random/calculator.html' | relative_url }}" frameborder='0' scrolling='no' height="580px" width="100%" class="l-body rounded z-depth-1"></iframe>

Consider what happens when retrieval becomes **"too easy"**:

* If $$P_{\text{rand}} = 0.95$$ (random selection succeeds 95% of the time), then even a perfect system only gets $$\text{BoR}_{\text{max}} \approx 0.07$$ bits
* If $$P_{\text{rand}} = 0.99$$ (random succeeds 99% of the time), then $$\text{BoR}_{\text{max}} \approx 0.01$$ bits

We call this the *"collapse zone."* When you enter it, selectivity becomes mathematically impossible, even if your success rate looks great.

The boundary is determined by:

$$\lambda = \frac{K \cdot \bar{R}_q}{N}$$

Where $$\bar{R}_q$$ is the average number of relevant items per query.

When $$\lambda$$ reaches 3–5, you've entered the collapse zone. Random selection is already solving most queries, so even a perfect system can't demonstrate meaningful skill.

## What Happens When You Retrieve More?

Now that we have formulated a measure that evaluates an IR system with respect to random selection at a given K, what happens when you increase K (K₁ to K₂)? Typically, we expect the following:

1. Your success rate improves (usually)
2. Random selection also gets easier (always)

The change in BoR is:

$$\Delta\text{BoR} = \log_2\left(\frac{P_2}{P_1}\right) - \log_2\left(\frac{\overline{P}_{\text{rand}}(K_2)}{\overline{P}_{\text{rand}}(K_1)}\right)$$

Translation:

* **First term:** *"How much better did I actually do?"*
* **Second term:** *"How much easier did the task get for random guessing?"*

## The Doubling Rule

In typical sparse-relevance scenarios ($$R_q \ll N$$ and $$K \ll N$$), the hypergeometric baseline behaves like repeated independent draws. For small values of $$K \cdot R_q / N$$, we can use standard approximations $$(1 - x)^n \approx e^{-nx}$$ and $$e^{-y} \approx 1 - y$$ for $$y \to 0$$.

So, because: $$P_{\text{rand}}(K; R_q) \approx \frac{K \cdot R_q}{N}$$ and averaging over queries yields $$\overline{P}_{\text{rand}}(K) \approx \frac{K \cdot \bar{R}_q}{N}$$

We now have:

$$\Delta\text{BoR} \approx \log_2\left(\frac{P_2}{P_1}\right) - \log_2\left(\frac{K_2}{K_1}\right)$$

What does this mean in practice?

**If you double K, but your success rate doesn't improve, you lose about 1 bit of selectivity.**

When you hear **"just retrieve more,"** remember: it's not free. Once your success rate has plateaued:

* Double **K** and you lose $$\sim 1$$ bit of selectivity
* $$10\times$$ **K** and you lose $$\sim 3.3$$ bits of selectivity

To maintain selectivity when doubling **K**, you'd need $$P_{\text{obs}}$$ to also double. But since $$P_{\text{obs}} \leq 1$$, this becomes impossible once you're above 50% success.

**That's why BoR inevitably degrades at larger depths once your success curve flattens.**

### Extensions to Stricter Rules

The BoR framework extends to stricter success rules. For example, requiring at least **m** relevant documents in the top-K:

$$\Delta\text{BoR} \approx -m \cdot \log_2\left(\frac{K_2}{K_1}\right)$$

Doubling K costs about **m bits** of selectivity. We focus on $$m=1$$ in this post because it matches common single-evidence RAG scenarios.

## Case Studies: When Theory Meets Reality

Let's see how BoR behaves in the wild. We tested three different scenarios:

| Dataset | Corpus Size | Relevant Items per Query | Why Test It? |
| :---- | :---- | :---- | :---- |
| **BEIR SciFact** | 5,183 abstracts (1,409 queries/claims) | Sparse ($$R_q \approx 1$$–2) | Baseline: typical RAG scenario |
| **MS MARCO** | ~8.8M passages | Sparse ($$R_q \approx 1$$) | Large scale: does BoR work at production size? |
| **20 Newsgroups** | 11,314 docs (training set) class-based setup | Dense ($$\bar{R}_q \approx 572$$) | Stress test: what happens when selectivity collapses? |

We tested two retrievers representing different eras and approaches.

* **BM25:** The classic lexical baseline
* **SPLADE:** Modern neural sparse retriever ([naver/splade-cocondenser-ensembledistil](https://huggingface.co/naver/splade-cocondenser-ensembledistil)): document top-k = 60, query top-k = 60, max sequence length = 256, batch size = 64 for documents and queries

All results use exact hypergeometric baselines and 95% confidence intervals from bootstrap resampling (n=5,000, seed=7).

### Test 1: SciFact (The Benchmark Case)

This is what most people expect: sparse relevance, the kind you see in real RAG systems.

**The results:**

Both systems maintain strong selectivity even at **K=100**, with BoR staying above 5 bits. Predicted ΔBoR values match observed changes to within **0.01** bits across all configurations.

This confirms that when $$\lambda = \frac{K \cdot \bar{R}_q}{N} \ll 1$$ (well outside the collapse zone), retrieval systems can demonstrate meaningful selectivity over random chance.

{% include figure.liquid path="assets/img/2026-04-27-bits-over-random/bor_analysis_scifact.png" class="img-fluid" %}

**Figure 1:** *BoR analysis on the SciFact dataset shows sustained selectivity across retrieval depths. Both BM25 and SPLADE maintain high BoR values (5–11 bits), reflecting the dataset's sparse relevance structure.*

But both BM25 and SPLADE operate very close to the theoretical ceiling. A 30-year-old algorithm nearly matches the modern neural system.

Is SciFact just too easy? To investigate, we turn to literature and examine a much larger benchmark. On a corpus with millions of passages, how much headroom exists between top-performing systems and the theoretical ceiling?

### Test 2: MS MARCO (The Industrial Scale Test)

8.84 million passages. This is where large real-world systems operate.

We computed BoR for **41 different systems** from the literature, from lexical baselines to state-of-the-art neural retrievers.

At **K=1000**, the theoretical ceiling is:

$$\text{BoR}_{\text{opt}} \approx \log_2\left(\frac{8.84\text{M}}{1000}\right) \approx 13.11 \text{ bits}$$

**All 41 systems cluster within 0.2 bits of this ceiling.** Indicatively, to show the range:

| System | Recall@1000 | BoR (bits) |
| :---- | :---- | :---- |
| BM25 | 85.7% | 12.89 |
| SPLADE | 97.9% | 13.08 |
| ColBERTv2 | 98.5% | 13.09 |
| SimLM | 98.7% | 13.09 |

BM25 gets 85.7% recall. SimLM (state-of-the-art) gets 98.7% recall. That's a **13-point recall gap.**

But the BoR difference? **Only 0.20 bits.**

A three-decade-old lexical algorithm and cutting-edge neural systems are very close in chance-corrected selectivity (BoR) at this depth, for this dataset, and success rule (in this case, recall). This suggests diminishing returns from retriever improvements alone.

Systems examined include: SimLM, AR2, uniCOIL, ColBERTv2, SPLADE (multiple versions), I3 Retriever, TCT-ColBERTv2, RoDR w/ ANCE, DPR-CLS, ColBERTer, ANCE, SLIM/SLIM++, and BM25.

But both still show meaningful selectivity: BoR is above 12 bits. To really see what collapse looks like, we need an extreme test: a dataset where relevance is abundant, not rare.

### Test 3: 20 Newsgroups (The Stress Test)

The 20 Newsgroups dataset has 20 topical categories. We set up an extreme scenario: treat all documents in the same category as "relevant."

With **11,314** documents split across **20** classes, that's about $$\bar{R}_q \approx 572$$ relevant documents per query (over **5%** of the corpus).

Why test something so unrealistic? Because, as you'll see later, this can happen in LLM agent tool selection.

This scenario pushes us directly into the collapse zone. At **K = 100**:

$$\lambda = \frac{K \cdot \bar{R}_q}{N} = \frac{100 \times 572}{11{,}314} \approx 5.1$$

Random selection alone would succeed ~99% of the time. The ceiling for any retrieval system is essentially zero. To make the contrast as clear as possible, here is 20NG vs SciFact against both systems.

**Watch what happens:**

| Dataset | K | BoR Ceiling | BM25 Success | BM25 BoR | SPLADE Success | SPLADE BoR | ΔBoR (10→100) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **20NG** | 10 | 1.31 bits | 94% | 1.22 | 95% | 1.23 | −1.22 |
| **20NG** | 100 | 0.01 bits | 100% | 0.01 | 100% | 0.01 | — |
| *SciFact* | 10 | 8.84 bits | 80% | 8.52 | 81% | 8.53 | −3.12 |
| *SciFact* | 100 | 5.52 bits | 89% | 5.36 | 93% | 5.41 | — |

At K=100 on 20 Newsgroups:

* Both systems achieve **100% success**
* Both provide **0.01 bits of selectivity**

Perfect success rate. Essentially zero selectivity. **The ceiling has collapsed.**

The predicted **ΔBoR** from theory matches reality within **0.01** bits. The math is working exactly as expected.
{% include figure.liquid path="assets/img/2026-04-27-bits-over-random/selectivity_collapse_paradox_newsgroups.png" class="img-fluid" %}

**Figure 2:** *The selectivity collapse paradox on 20 Newsgroups. Left: BoR declines sharply with depth, converging to the theoretical ceiling (dashed line). Right: As Success@K approaches 100%, BoR approaches zero.*

But here's the real question: **Does this theoretical collapse actually hurt downstream performance?**

## When Perfect Success Fails

We tested this directly with a modern instruction-tuned LLM on the 20 Newsgroups collapsed scenario.

Setup: Multiple-choice classification task, 50 queries per configuration, temperature=0.0.

**The results:**

| System | Accuracy at K=10 | Accuracy at K=100 | Success@K | Token Cost |
| :---- | :---- | :---- | :---- | :---- |
| **BM25** | 66% | **50%** | 94% → 100% | 10x increase |
| **SPLADE** | 68% | **58%** | 95% → 100% | 10x increase |

Highlights:

- Success rate increased to 100% ✓
- Accuracy **dropped** by 10–16 percentage points ✗
- Token cost increased 10x ✗

**This is the failure mode BoR detects.** You're paying 10x the tokens for random-level selectivity, and your AI is drowning in noise.

When selectivity collapses, high success rates become meaningless or worse, misleading.

## AI Agent Tool Selection

"That 20 Newsgroups test seems artificial," you might be thinking. "Who retrieves documents where 5% of the corpus is relevant?"

Fair Point. Let's extend our testing to what happens with AI agents everyday.

### When Agents Choose Tools

Consider what Anthropic published in 2025<d-cite key="anthropic2025toolselection"></d-cite>:

*"Tool definitions can sometimes consume 50,000+ tokens before an agent reads a request. Agents should discover and load tools on-demand, keeping only what's relevant for the current task."*

Their example: 58 tools consuming ~55K tokens. Add integrations like Jira and you're at 100K+ tokens. They've seen setups with tool definitions consuming 134K tokens before optimization.

Now, let's apply the same math as document retrieval:

| Parameter | Document Retrieval | Tool Selection |
| :---- | :---- | :---- |
| **N** | Corpus size (thousands to millions) | Available tools (50–500) |
| **K** | Documents shown to LLM | Tools shown to LLM |
| **$$R_q$$** | Relevant documents | Applicable tools for task |

The critical difference: **N is small for tools.** And small N means you hit the collapse boundary much faster.

### The Tool Selection Collapse

Let's run the numbers for Anthropic's 58-tool example. Assume 3–5 tools are typically relevant:

| Configuration | K | $$R_q$$ | $$\lambda = \frac{K \cdot R_q}{N}$$ | $$\text{BoR}_{\text{max}}$$ (Poisson) | $$\text{BoR}_{\text{max}}$$ (Exact) | What This Means |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Show 5 tools | 5 | 4 | 0.34 | ~1.6 bits | ~1.7 | Meaningful selectivity |
| Show 20 tools | 20 | 4 | 1.38 | ~0.4 bits | 0.28 | Degraded |
| Show all 58 | 58 | 4 | **4.0** | ~0.02 bits | 0 | Collapse |

When all tool definitions are introduced simultaneously into the model's context, the system operates at $$\lambda \approx 4$$. This is deep into the collapse zone.

**Even a perfect tool selector achieves only ~0.02 bits of selectivity over random chance.**

The LLM is essentially guessing. And as Anthropic notes: **"The most common failures are wrong tool selection and incorrect parameters, especially when tools have similar names."** This perfectly reflects the 20 Newsgroups scenario when $$R_q$$ (relevant-per query items) was large.

### The Pattern Extends Beyond Tools

The collapse boundary doesn't care what you're selecting. It's a property of the selection problem itself: $$\lambda = \frac{K \cdot \bar{R}_q}{N}$$

When $$\lambda$$ hits 3–5, selectivity collapses, whether you're selecting:

* Documents from a corpus
* Tools from an API library
* Agentic "skills"
* Functions from hundreds of endpoints
* Context from multi-hop retrieval chains

| Scenario | N | $$R_q$$ | K | $$\lambda = \frac{K \cdot R_q}{N}$$ | Regime |
| :---- | :---- | :---- | :---- | :---- | :---- |
| RAG (typical) | 10,000 | 1–2 | 10 | ~0.002 | Healthy |
| Tool selection (filtered) | 20 | 3 | 5 | 0.75 | Healthy |
| Tool selection (show all) | 20 | 3 | 20 | 3.0 | Collapse |
| API endpoints (show half) | 100 | 8 | 50 | 4.0 | Collapse |
| Anthropic's 58-tool example | 58 | 4 | 58 | 4.0 | Collapse |

**This is why agentic systems struggle with tool selection far more than RAG systems struggle with document retrieval.** The math is unforgiving when N is small.

## What You Should Do About This

BoR gives you a new lens for evaluating retrieval systems. It reveals when high success rates are actually warning signs.

**1. Monitor the collapse boundary**

Calculate $$\lambda = \frac{K \cdot \bar{R}_q}{N}$$ for your system. When $$\lambda$$ approaches 3–5, you're entering the danger zone. This single number tells you whether selectivity is even possible.

**2. Use BoR to guide your K selection**

Don't just crank up K to boost success metrics. Instead:

* Stop increasing K when $$\text{BoR}_{\text{max}}$$ drops below ~0.1 bits.
* If $$\text{BoR} \approx \text{BoR}_{\text{max}}$$, you've saturated and more K won't help.
* If $$\Delta\text{BoR}$$ becomes negative or negligible, you're adding noise, not signal.

**3. For tool-based agents: Be aggressive about filtering**

With small N (50–500 tools), you can't afford to dump everything into context. Use:

* Two-stage retrieval (filter, then select)
* Dynamic tool loading based on task context
* Clustering by function domain

**4. Remember the core insight**

**More context is not always better.** High Success@K can coexist with zero selectivity.

| Scenario | Calculations | Conclusion |
| :---- | :---- | :---- |
| **K → N** (K tends to N) | N = 100, K = 100, $$R_q = 1$$<br><br>$$P_{\text{obs}} = 1.0$$ (retrieve everything, guaranteed success)<br><br>$$P_{\text{rand}} = 1.0$$ (random selection of all 100 items → also guaranteed success)<br><br>$$\text{BoR} = \log_2(1.0 / 1.0) = 0$$ bits exactly | **BoR → 0 when K → N** (K is closer to N)<br><br>Both Recall and Success@K are perfect. But BoR approaches zero asymptotically.<br><br>At K = N, BoR = 0. |
| **Bad retriever** - deliberately omits relevant results | N = 100, K = 10, $$R_q = 1$$<br><br>$$P_{\text{rand}} = 10/100 = 0.10$$ (random succeeds 10% of the time)<br><br>retriever is adversarially bad: $$P_{\text{obs}} = 0.05$$<br><br>$$\text{BoR} = \log_2(0.05 / 0.10) = \log_2(0.5) = -1$$ bit | **BoR < 0** means we are actively avoiding relevant documents, doing worse than chance. |

## Sidebar: Success@K vs Recall@K

Some readers might wonder: this post focuses on Success@K (coverage), but what about Recall@K?

| Metric | What It Measures | Per-Query Behavior | Best For |
| :---- | :---- | :---- | :---- |
| **Success@K** | Did you get $$\geq 1$$ relevant item? | Binary: success or fail | RAG/QA where one good context suffices |
| **Recall@K** | What fraction of all relevant items did you get? | Graded: 0% to 100% | Tasks needing comprehensive coverage |

The good news: **BoR works with both.**

### BoR for Recall@K

The same framework applies. Instead of measuring "probability of $$\geq 1$$ hit," you measure "expected fraction retrieved":

$$\text{BoR}_{\text{recall@K}} = \log_2\left(\frac{\text{observed_recall@K}}{\text{expected_recall@K_random}}\right)$$

For sparse relevance: $$\text{expected_recall@K_random} \approx \frac{K}{N}$$

**Example:** A query has 10 relevant items in a 1,000-document corpus. You retrieve 4 in top-20:

* Observed recall = $$\frac{4}{10} = 0.4$$
* Random baseline = $$\frac{20}{1{,}000} = 0.02$$
* $$\text{BoR}_{\text{recall@K}} = \log_2\left(\frac{0.4}{0.02}\right) = \log_2(20) \approx$$ **4.32 bits**

### Math and BoR Interpretation

| Metric | Definition | Formula | Observed Rate | Expected Rate (Random) |
| :---- | :---- | :---- | :---- | :---- |
| **BoR for Success@K** | Bits-over-Random for coverage ($$\geq 1$$ relevant) | $$\log_2\left(\frac{\text{observed_success}}{\text{expected_success_random}}\right)$$ | Fraction of queries with $$\geq 1$$ relevant in top-K | Probability of $$\geq 1$$ hit by random selection |
| **BoR for Recall@K** | Bits-over-Random for recall (fraction retrieved) | $$\log_2\left(\frac{\text{observed_recall@K}}{\text{expected_recall@K_random}}\right)$$ | Average fraction of relevant items in top-K | Expected fraction if picking K random (usually $$\frac{K}{N}$$) |

The depth-calibrated identity also extends to Recall@K, with minor adjustments for the different success rule.

We focus on Success@K in this post because it matches the most common RAG use case: you just need *one* good grounding passage.

## Final Thoughts

Retrieval evaluation has been stuck with metrics designed for human consumers. RAG and agentic AI systems need something different, something that accounts for the fact that every retrieved item imposes a cost, and random chance sets a floor.

**Bits-over-Random provides that measure.**

It makes three things visible that were previously hidden:

1. **The ceiling:** Even perfect systems have limited selectivity when random baselines are high
2. **The collapse zone:** When $$\lambda = \frac{K \cdot \bar{R}_q}{N}$$ reaches 3–5, selectivity becomes impossible
3. **The depth trade-off:** Retrieving more doesn't always help and it can actively hurt

The math is simple but the implications are profound.

When your tool-based agent has 50 functions available, and you dump all 50 into context, you're not being thorough, you're operating in the collapse zone. BoR reveals that.

When you boost Success@K from 95% to 100% by tripling K, traditional metrics celebrate. BoR shows you just lost 1.5 bits of selectivity.

The systems that win in the next era of AI won't be the ones that retrieve the most. They'll be the ones that retrieve the most **selectively**.

## Acknowledgements

We are grateful to Mike Halloran and Himanshu Pathak for their valuable feedback and insightful suggestions.
