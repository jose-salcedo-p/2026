---
layout: distill
title: Wait, Do We Need to Wait? Revisiting Budget Forcing for Sequential Test-Time Scaling
description: This blog revisits budget forcing, a sequential test-time scaling technique for reasoning models by controlling when it continues thinking versus when it must answer. We evaluate how well the method transfers across model types, including non-reasoning models, and whether alternative keywords work. We provide practical guidelines for using the technique.
date: 2026-04-27
future: true
htmlwidgets: true
hidden: true

# Mermaid diagrams
mermaid:
  enabled: true
  zoomable: true

# Anonymize when submitting
authors:
  - name: Anonymous

# authors:
#   - name: Albert Einstein
#     url: "https://en.wikipedia.org/wiki/Albert_Einstein"
#     affiliations:
#       name: IAS, Princeton
#   - name: Boris Podolsky
#     url: "https://en.wikipedia.org/wiki/Boris_Podolsky"
#     affiliations:
#       name: IAS, Princeton
#   - name: Nathan Rosen
#     url: "https://en.wikipedia.org/wiki/Nathan_Rosen"
#     affiliations:
#       name: IAS, Princeton

# must be the exact same name as your blogpost
bibliography: 2026-04-27-wait-do-we-need-to-wait.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: What is Budget Forcing And How Does It Work?
    subsections:
    - name: A Very Brief Introduction to Test-Time Scaling
    - name: "Budget Forcing: Forcing The Model To Think Within The Budget"
    - name: Scaling Up
    - name: Scaling Down
  - name: What People Say About Budget Forcing?
    subsections:
    - name: Studies Suggesting Benefits from Budget Forcing
    - name: Evidence Challenging Budget Forcing
  - name: Testing It With More Models
    subsections:
    - name: Not All Reasoning Models Are Created The Same Way
    - name: Comparing Zero-shot CoT and Budget Forcing Results
    - name: Is Linear Scaling Real?
    - name: Why This Might Happen?
  - name: Budget Forcing Works With Non-Reasoning Models? Or Not?
    subsections:
    - name: Results with Qwen2.5-7B-Instruct
    - name: How About Other Model Families?
  - name: Wait, You Do Not Need to Wait?
    subsections:
    - name: Keyword Selection
    - name: "Let Us Try Other Keywords: Perhaps We Will Get Interesting Results"
  - name: Summary
  - name: Practical Recommendations
  - name: Limitations

_styles: |
  /* Base Variables */
    :root {
        /* Core Call-out Identity */
        --co-accent: #6366f1; /* Indigo accent */
        --co-bg: #f8fafc;     /* Very light cool gray */
        --co-border: #e2e8f0;
        --co-text: #334155;
        --co-title: #0f172a;
    }

    /* Dark Theme Overrides */
    @media (prefers-color-scheme: dark) {
        :root {
            --co-accent: #818cf8;
            --co-bg: #1e293b;     /* Dark slate blueish */
            --co-border: #334155;
            --co-text: #cbd5e1;
            --co-title: #f1f5f9;
        }
    }

    /* Dark Theme Overrides for Manual Toggle */
    [data-theme="dark"] {
        --co-accent: #818cf8;
        --co-bg: #1e293b;     /* Dark slate blueish */
        --co-border: #334155;
        --co-text: #cbd5e1;
        --co-title: #f1f5f9;
    }

    /* Light Theme Overrides for Manual Toggle */
    [data-theme="light"] {
        --co-accent: #6366f1; /* Indigo accent */
        --co-bg: #f8fafc;     /* Very light cool gray */
        --co-border: #e2e8f0;
        --co-text: #334155;
        --co-title: #0f172a;
    }

    .highlight-card {
        display: flex;
        flex-direction: row;
        align-items: flex-start; /* Aligns icon to top */
        gap: 1rem;
        
        width: 100%;
        padding: 1.25rem;
        margin: 1.5rem 0;
        box-sizing: border-box;
        
        /* Call-out Look */
        background-color: var(--co-bg);
        border: 1px solid var(--co-border);
        border-left: 5px solid var(--co-accent); /* The signature call-out bar */
        border-radius: 6px; /* Tighter radius for alert style */
        
        color: var(--co-text);
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    /* The Icon Container */
    .highlight-card .icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        font-size: 1.5rem;
        margin-top: 0; /* Aligns with the first line of text/title */
    }

    /* The Content Wrapper */
    .highlight-card .content {
        flex: 1;
        min-width: 0; /* Prevents flex overflow issues */
    }

    /* Title Styling */
    .highlight-card .title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--co-title);
        margin: 0 0 0.75rem 0;
        line-height: 1.2;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    /* List & Text Styling */
    .highlight-card .content ul {
        margin: 0;
        padding-left: 1.25rem;
    }

    .highlight-card .content li {
        margin-bottom: 0.5rem;
        line-height: 1.6;
        font-size: 0.95rem;
    }

    .highlight-card .content li:last-child {
        margin-bottom: 0;
    }

    .highlight-card .content p {
        margin: 0 0 0.5rem 0;
        line-height: 1.6;
    }

    /* Bold text inside content emphasizes the accent color subtly */
    .highlight-card .content strong {
        color: var(--co-title);
        font-weight: 600;
    }
---

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/hero.png" class="img-fluid rounded-lg" %}

In this blog post, we revisit the technique of ***budget forcing*** — a sequential test-time scaling technique that controls reasoning budget in reasoning models by appending a "Wait" keyword (or equivalently forcing a stop when the budget is exceeded), thereby determining whether the model continues thinking or directly outputs an answer.

We explore three main questions:

1. To what extent does budget-forcing generalize across different model families and settings?
2. Does it work with non-reasoning models?
3. Can other keywords serve the same function as "Wait"?

We present experimental results, including cases where budget forcing does and does *not* help and offer practical guidance for applying budget-forcing in test-time scaling.

<div class="highlight-card">
    <div class="icon">💡</div>
    <div class="content">
        <div class="title">TL;DR</div>
        <ul>
            <li>
                Budget forcing <strong>helps most</strong> for some SFT-based reasoning models (e.g., s1.1, OpenThinker3) but provides <strong>little or negative gains</strong> for others (especially some RFT-based or distillation-based models).
            </li>
            <li>
                The often-claimed <strong>"linear scaling law"</strong> between budget and performance <strong>does not hold universally</strong>; many models plateau or fluctuate as the budget grows.
            </li>
            <li>
                Budget forcing is <strong>not exclusive to reasoning models</strong>: instruction-tuned models can benefit when prompted with <code>&lt;think&gt;...&lt;/think&gt;</code> structures, but this effect is <strong>highly model-family dependent</strong>.
            </li>
            <li>
                The keyword "Wait" is <strong>not special</strong>. Alternative high-frequency reasoning words like <strong>"Let"</strong> or <strong>"Perhaps"</strong> often work better, and the optimal keyword appears to be <strong>model-specific</strong>.
            </li>
        </ul>
    </div>
</div>

## What is Budget Forcing And How Does It Work?

### A Very Brief Introduction to Test-Time Scaling

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/tts_types.png" class="img-fluid rounded-lg" %}
<div class="caption">
    A comparison of sequential, parallel, and hybrid test-time scaling approaches, adapted from <a href="https://arxiv.org/abs/2503.24235"  target="_blank">Zhang et al. (2025)</a>. <strong>Sequential</strong> methods extend a single chain of thought, giving one trajectory more room to refine its reasoning. <strong>Parallel</strong> methods sample multiple independent trajectories and select an answer via voting or scoring. <strong>Hybrid</strong> methods both extend chains and branch them, combining deeper single-trajectory reasoning with cross-trajectory selection.
</div>

Before we go deeper into budget forcing, let's take a very brief look at what test-time scaling is. Since **budget forcing** is a (1) *sequential* (2) *test-time scaling* technique. 

Let's unpack that a bit. [***Test-time scaling***](https://arxiv.org/abs/2503.24235) <d-cite key="zhang2025surveytesttimescalinglarge"></d-cite> means spending more compute **during inference** — for example, generating more tokens — to get better performance.

Broadly speaking, test-time scaling methods fall into three categories: **sequential**, **parallel**, and **hybrid**.

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/budget_forcing_tts_types.png" class="img-fluid rounded-lg" %}
<div class="caption">
    A figure contrasting sequential and parallel test-time scaling from <a href="https://arxiv.org/abs/2501.19393" target="_blank">s1: Simple Test-Time Scaling</a> <d-cite key="muennighoff-etal-2025-s1"></d-cite>
</div>

- **Sequential test-time scaling**, like budget forcing, extends a single generated response so that the model has more "room to think" and potentially reach a better answer.
- **Parallel test-time scaling** is based on a different idea. Sampling from a language model is like sampling from a probability distribution. The model might "know" the correct answer, but it might not appear in the first sample. So instead of continuing one generation, we **sample multiple times**, and then pick either the most confident or the highest-quality output (for example, using a majority vote or a grader model).
- **Hybrid approaches** mix both ideas. For instance, we might extend the reasoning sequence (sequential), but at each extension step sample multiple continuations and pick the best one to append.

### Budget Forcing: Forcing The Model To Think Within The Budget

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/budget_forcing_linear.png" class="img-fluid rounded-lg" %}
<div class="caption">
    Performance of s1 under different budgets from <a href="https://arxiv.org/abs/2501.19393" target="_blank">s1: Simple Test-Time Scaling</a> <d-cite key="muennighoff-etal-2025-s1"></d-cite>
</div>

Budget forcing was first introduced in [s1: Simple Test-Time Scaling](https://arxiv.org/abs/2501.19393) <d-cite key="muennighoff-etal-2025-s1"></d-cite>, which introduced an approach to extend the reasoning process for improving mathematical performance. The original introduction summarizes the idea well:

> "… a simple decoding-time intervention by forcing a maximum and/or minimum number of thinking tokens. Specifically, we enforce a maximum token count by simply appending the end-of-thinking token delimiter and optionally "Final Answer:" to early exit To enforce a minimum, we suppress the generation of the end-of-thinking token delimiter and optionally append the string "Wait" to the model's current reasoning trace to encourage the model to reflect on its current generation. the thinking stage and make the model provide its current best answer."

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/scaling_up_down.png" class="img-fluid rounded-lg" %}

Let's unpack that a bit. The objective of budget forcing is to control the number of thinking tokens. It operates through two mechanisms: enforcing (1) a **maximum** and (2) a **minimum** number of thinking tokens. We refer to the first mechanism as **scaling down** (enforced maximum) and the second as **scaling up** (enforced minimum). The high-level process follows:

- We treat everything inside a `<think>...</think>` block as **reasoning tokens**,
- We enforce a fixed **token budget** on that block,
- And we either **extend** or **truncate** the block until the budget is used up.

So, let's see how scaling up and scaling down work!

### Scaling Up

<div class="l-page">
  <iframe
    src="{{ 'assets/html/2026-04-27-wait-do-we-need-to-wait/scaling_up.html' | relative_url }}"
    frameborder="0"
    scrolling="no"
    height="600px"
    width="100%"
  ></iframe>
</div>

When scaling up, budget forcing encourages the model to *keep thinking* as long as it still has reasoning budget left.

Here's how it works step by step:

1. The model generates a response consisting of two parts — the **thinking process** and the **final answer**.
2. The algorithm checks whether the length of the thinking content is still within the budget.
3. If there's budget remaining, it **discards the final answer and the thinking-end tag** (e.g., `</think>`), then appends a keyword such as *"Wait"* (as used in the original paper).
4. The model continues generating more reasoning until the budget limit is reached.
5. Steps 2–4 repeat until the reasoning budget is exhausted. Only then do we let the model close `</think>` and produce its final answer.

Effectively, we are telling the model, *Hold on, keep thinking before you answer.*

### Scaling Down

<div class="l-page">
  <iframe
    src="{{ 'assets/html/2026-04-27-wait-do-we-need-to-wait/scaling_down.html' | relative_url }}"
    frameborder="0"
    scrolling="no"
    height="600px"
    width="100%"
  ></iframe>
</div>

Scaling down is the opposite: instead of letting the model think longer, we **cut off** its reasoning once it exceeds the budget.

The algorithm:

1. The model generates a response consisting of two parts — the **thinking process** and the **final answer**.
2. The algorithm checks whether the length of the thinking content is still within the budget.
3. Truncates the `<think>...</think>` content so that it fits within the reasoning token budget.
4. **Forces an ending indicator** (e.g., `</think>`) after the truncated reasoning.
5. Prompts the model to produce its final answer (for example, "*The final answer is …*").
6. Continues generating the final answer.

In other words, *"Time's up — give your answer."*

---

While this is a promising idea and approach, several *unknown factors* limit our understanding of **what** budget forcing does, **why** it works, and **how** it behaves. In particular:

1. Budget forcing was introduced and tested using `s1`. This raises the question of how **generalizable** it is to other reasoning models.
2. The paper reports a **linear relationship** between performance and thinking budget. Is the trend truly linear?
3. The **keyword "Wait,"** used to encourage the model to continue thinking, is chosen somewhat arbitrarily. Does the keyword actually matter?

## What People Say About Budget Forcing?

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/lit_survey.png" class="img-fluid rounded-lg" %}

Before we dig into the deeper questions, it's worth stepping back to see what the current research landscape says about budget forcing. The findings vary widely, and the overall picture is far from settled. Here's a concise tour of the perspectives that have emerged so far.

### Studies Suggesting Benefits from Budget Forcing

A number of works report that prompting models to "wait" or continue thinking can offer advantages. A study <d-cite key="ringel2025learningcontinuethinkingtokenenhanced"></d-cite> trains models explicitly to use a continued-thinking token, encouraging them to pause and elaborate on their reasoning. Another study <d-cite key="jurayj-etal-2025-final"></d-cite> shows that increasing test-time compute—often by allowing longer chains of thought—can boost accuracy and confidence, at least in some settings.

A related perspective emphasizes the role of backtracking <d-cite key="gandhi2025cognitive"></d-cite>. In both humans and models, the signal to "wait" can function as an invitation to revisit earlier steps, reconsider calculations, or catch overlooked details. Under this view, brief delays may improve the final answer by prompting revision.

### Evidence Challenging Budget Forcing

Several recent findings call into question the idea that longer chains of thought inherently improve performance. One study indicates that extended reasoning and excessive reviewing correlate with *lower* accuracy across tasks such as mathematics and scientific reasoning <d-cite key="feng2025characterizeseffectivereasoningrevisiting"></d-cite>.

Further, research on test-time scaling shows that when models are forced to answer with less time than they naturally require, accuracy degrades <d-cite key="wu2025itssimpleanalysissimple"></d-cite>—and that shorter chain-of-thought models are especially sensitive to this truncation. Other work <d-cite key="zhao2025testtimescalingreasoningmodels"></d-cite> observes fluctuating or decreased accuracy when budget forcing is applied in knowledge-intensive domains, and finds little to no benefit in fields like medicine <d-cite key="huang2025m"></d-cite>.

One hypothesis ties these patterns together: models may simply be more familiar with certain reasoning lengths because those lengths are more commonly represented in training data. Extremely long chains of thought appear less frequently, making the model less practiced in producing them. As a result, artificially lengthening the reasoning process does not always yield deeper or more reliable thinking. This idea will be explored further later in the post.

### What We Will Do In This Blog?

Given the contradictory results in prior work, we revisit budget forcing and evaluate it in a more systematic setup to understand *how well the technique generalizes* and *how its individual components affect outcomes*. This is not an exhaustive study; instead, we focus on several particularly interesting aspects: **model compatibility**, **budget scaling behavior**, and **keyword choice**. Let's dive in.

<div class="highlight-card">
    <div class="icon">📝</div>
    <div class="content">
        <div class="title">Summary</div>
        <ul>
            <li>Budget forcing is a <strong>sequential test-time scaling</strong> method that manipulates tokens inside <code>&lt;think&gt;...&lt;/think&gt;</code> under a fixed budget.</li>
            <li>It has two components: <strong>scaling up</strong> (extend reasoning) and <strong>scaling down</strong> (truncate reasoning), both controlled by the same budget mechanism.</li>
            <li>Prior work shows <strong>clear but non-universal gains</strong>: some models and settings benefit, others do not.</li>
        </ul>
    </div>
</div>

## Testing It With More Models

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/models.png" class="img-fluid rounded-lg" %}

### Not All Reasoning Models Are Created The Same Way

Not all reasoning models are created equal — or trained the same way. Broadly speaking, there are **two main approaches** to developing reasoning models: **Supervised Fine-Tuning (SFT)** and **Reinforcement Fine-Tuning (RFT)**.

- SFT aims to teach a model a particular **style of reasoning** by directly imitating curated chains of thought.
- RFT lets the model **explore** its own reasoning trajectories and then uses rewards to shape *which behaviors* are preferred, without necessarily providing explicit step-by-step demonstrations.

> Do reasoning models trained with SFT and RFT behave differently when we apply budget forcing?

#### Experimental Setup

To explore this, we selected several models that all share the **same initial model** — `Qwen2.5-7B-Instruct` — to make comparisons as fair and controlled as possible.

Specifically, we used:

- [`simplescaling/s1.1-7B`](https://huggingface.co/simplescaling/s1.1-7B) (SFT-based, an updated version from the s1 paper)
- [`open-thoughts/OpenThinker3-7B`](https://huggingface.co/open-thoughts/OpenThinker-7B) (SFT-based, for comparison with s1.1)
- [`deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B) (SFT-based, for comparison with s1.1 and OpenThinker3)
- `RFT` — our own reasoning model fine-tuned from `Qwen2.5-7B-Instruct` using pure reinforcement fine-tuning, **without** additional SFT reasoning data.

{% details More technical details on how we trained the `RFT` model %}

- **Model**: <a href="https://huggingface.co/Qwen/Qwen2.5-7B-Instruct" target="_blank">Qwen2.5-7B-Instruct</a>
- **Algorithm**: GRPO
- **Trainer**: <a href="https://github.com/volcengine/verl" target="_blank">verl</a>
- **Training Set**: <a href="https://huggingface.co/datasets/mnoukhov/DAPO-Math-14k-Processed-RLVR" target="_blank">DAPO Math 14K</a>

{% details Training config (click to expand) %}

```bash
python3 -m verl.trainer.main_ppo \
 algorithm.adv_estimator=grpo \
 data.train_files=RUC-AIBOX/STILL-3-Preview-RL-Data \
 data.val_files=RUC-AIBOX/STILL-3-Preview-RL-Data \
 data.train_batch_size=256 \
 data.max_prompt_length=2048 \
 data.max_response_length=4096 \
 actor_rollout_ref.model.path=Qwen/Qwen2.5-7B-Instruct \
 actor_rollout_ref.actor.optim.lr=1e-6 \
 actor_rollout_ref.model.use_remove_padding=True \
 actor_rollout_ref.model.enable_gradient_checkpointing=True \
 +actor_rollout_ref.model.use_torch_compile=True \
 actor_rollout_ref.actor.ppo_mini_batch_size=64 \
 actor_rollout_ref.actor.fsdp_config.param_offload=False \
 actor_rollout_ref.actor.fsdp_config.optimizer_offload=False \
 actor_rollout_ref.ref.fsdp_config.param_offload=False \
 actor_rollout_ref.rollout.log_prob_micro_batch_size_per_gpu=8 \
 actor_rollout_ref.rollout.tensor_model_parallel_size=1 \
 actor_rollout_ref.rollout.name=vllm \
 actor_rollout_ref.rollout.gpu_memory_utilization=0.8 \
 actor_rollout_ref.rollout.n=8 \
 actor_rollout_ref.actor.strategy=fsdp2 \
 actor_rollout_ref.ref.strategy=fsdp2 \
 critic.strategy=fsdp2 \
 actor_rollout_ref.actor.use_dynamic_bsz=True \
 actor_rollout_ref.actor.ppo_max_token_len_per_gpu=24576 \
 actor_rollout_ref.ref.log_prob_max_token_len_per_gpu=24576 \
 actor_rollout_ref.rollout.log_prob_max_token_len_per_gpu=24576 \
 algorithm.use_kl_in_reward=False \
 reward_model.reward_manager=naive \
 custom_reward_function.path=compute_score \
 custom_reward_function.name=math_acc_rw_fn.py \
 trainer.critic_warmup=0 \
 trainer.logger=['console','wandb'] \
 trainer.project_name=your_project_name \
 trainer.experiment_name=your_exp_name \
 trainer.val_before_train=False \
 trainer.default_hdfs_dir=null \
 trainer.n_gpus_per_node=4 \
 trainer.nnodes=1 \
 trainer.save_freq=100 \
 trainer.test_freq=1000000 \
 trainer.total_epochs=2 2>&1
```

{% enddetails %}

{% details Reward function (click to expand) %}

```python
import re
from typing import Dict, List, Optional
import numpy as np
from math_verify import parse, verify


def extract_boxed_content(text: Optional[str]) -> Optional[List[str]]:
    if text is None:
        return None

    pattern = r"\\boxed\{((?:[^{}]|\{[^{}]*\})*)\}"
    return re.findall(pattern, text)


def math_boxed_reward_func(
    assistant_message: str, ground_truth: str | float | int
) -> float:
    """Reward function for math problems with boxed answers."""
    extracted_answers = extract_boxed_content(assistant_message)
    if not extracted_answers or len(extracted_answers) == 0:
        return 0.0

    parsed_extracted_answer = parse(extracted_answers[-1])
    parsed_ground_truth = parse(ground_truth)

    if verify(parsed_ground_truth, parsed_extracted_answer):
        return 1.0

    return 0.0


def format_reward_func(assistant_message: Optional[str]) -> float:
    """Scores the assistant message based on formatting (<think> tags)."""
    if assistant_message is None or len(assistant_message) == 0:
        return 0.0

    think_pattern = r"<think>.*?</think>"
    matches = re.findall(think_pattern, assistant_message, re.DOTALL)

    if (
        len(matches) == 1
        and assistant_message.strip().startswith("<think>")
        and assistant_message.count("<think>") == 1
        and assistant_message.count("</think>") == 1
    ):
        return 1.0
    return 0.0


def compute_score(
    data_source: str,
    solution_str: str,
    ground_truth: str,
    extra_info: Optional[Dict] = None,
) -> float:
    """
    A unified reward function for `verl` that handles 'math' types.

    Args:
        data_source (str): The name of the dataset (provided by verl).
        solution_str (str): The response generated by the model.
        ground_truth (str): The ground truth answer.
        extra_info (dict, optional): A dictionary for additional data. Defaults to None.

    Returns:
        float: The calculated reward score.
    """

    format_score = format_reward_func(solution_str)
    accuracy_score = math_boxed_reward_func(solution_str, ground_truth)

    combined_score = np.mean([accuracy_score, format_score])
    return combined_score
```

{% enddetails %}

{% enddetails %}

We evaluated all four models on a diverse set of reasoning benchmarks:

- [**AIME 2025**](https://huggingface.co/datasets/math-ai/aime25) – competition math problems
- [**MATH 500**](https://huggingface.co/datasets/math-ai/math500) – medium-difficult mathematical reasoning problems
- [**MMLU Pro-1K**](https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro) – broad multi-domain knowledge tasks
- [**SuperGPQA-1K**](https://huggingface.co/datasets/m-a-p/SuperGPQA) – general-purpose question answering tasks

Together, these benchmarks give us a **holistic view** of how budget forcing affects models across both mathematical (as proposed originally in the s1 paper) and non-mathematical domains.

We used the following sampling parameters for all evaluations: `temperature = 0.6`, `max_tokens = 8192`, `top_p = 0.95`, `top_k = 20`, and `presence_penalty = 0.5`. We also fixed the **thinking budget** to `8192` tokens — a value that's comfortably above the average reasoning length for most models.

Here's what we found:

### Comparing Zero-shot CoT and Budget Forcing Results

{% details Result table %}

<div class="l-page">
    <table class="table table-sm">
        <thead>
            <tr>
                <th>Model</th>
                <th>Approach</th>
                <th>AIME 2025</th>
                <th>MATH500</th>
                <th>MMLU Pro-1K</th>
                <th>SuperGPQA-1K</th>
                <th>Average</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>RFT</td>
                <td>Zero-shot</td>
                <td>20.00</td>
                <td>69.40</td>
                <td>9.80</td>
                <td>6.70</td>
                <td>26.48</td>
            </tr>
            <tr>
                <td>RFT</td>
                <td>CoT+BF</td>
                <td>23.33</td>
                <td>63.80</td>
                <td>45.20</td>
                <td>27.80</td>
                <td>40.03</td>
            </tr>
            <tr>
                <td>s1.1-7B</td>
                <td>Zero-shot</td>
                <td>20.00</td>
                <td>73.60</td>
                <td>40.20</td>
                <td>17.40</td>
                <td>37.80</td>
            </tr>
            <tr>
                <td>s1.1-7B</td>
                <td>CoT+BF</td>
                <td>23.33</td>
                <td>74.20</td>
                <td><strong>62.10</strong></td>
                <td>33.40</td>
                <td>48.26</td>
            </tr>
            <tr>
                <td>OpenThinker3-7B</td>
                <td>Zero-shot</td>
                <td>26.67</td>
                <td>81.00</td>
                <td>51.40</td>
                <td>24.60</td>
                <td>45.92</td>
            </tr>
            <tr>
                <td>OpenThinker3-7B</td>
                <td>CoT+BF</td>
                <td><strong>53.33</strong></td>
                <td><strong>87.00</strong></td>
                <td>61.10</td>
                <td><strong>36.60</strong></td>
                <td><strong>59.51</strong></td>
            </tr>
            <tr>
                <td>DeepSeek-R1-Distill-Qwen-7B</td>
                <td>Zero-shot</td>
                <td>33.33</td>
                <td>81.00</td>
                <td>12.00</td>
                <td>5.20</td>
                <td>32.88</td>
            </tr>
            <tr>
                <td>DeepSeek-R1-Distill-Qwen-7B</td>
                <td>CoT+BF</td>
                <td>26.67</td>
                <td>83.40</td>
                <td>10.80</td>
                <td>6.70</td>
                <td>31.89</td>
            </tr>
        </tbody>
    </table>
</div>

{% enddetails %}

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/performance_reasoning_models.png" class="img-fluid rounded-lg" %}

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/performance_on_reasoning_models.png" class="img-fluid rounded-lg" %}

Budget forcing (CoT+BF) generally enhances performance, especially in **SFT-based models** like *s1.1-7B* and *OpenThinker3-7B*, which benefit from having more reasoning steps to express their learned procedural thought patterns. These models appear to use the extra budget productively, expanding on intermediate reasoning and improving performance across complex benchmarks. This is possibly due to the fact that long CoT responses exist in their training sets <a href="https://huggingface.co/datasets/simplescaling/s1K-1.1" target="_blank">s1K-1.1</a> and <a href="https://huggingface.co/datasets/open-thoughts/OpenThoughts3-1.2M" target="_blank">OpenThoughts3-1.2M</a>, respectively.

In contrast, *DeepSeek-R1-Distill-Qwen-7B* shows minimal or negative gains. The small declines on *AIME 2025* and *MMLU Pro-1K* suggest that overthinking can degrade accuracy when models already operate near optimal reasoning efficiency. Given that we do not have access to the training set of this model, we are unable to state this with certainty, but it's likely that only the shorter end of CoT chains is used to train the model. These findings suggest that reasoning improvement under budget forcing depends more on **training configurations**.

### Is Linear Scaling Real?

{% details Result table %}

<div class="l-page">
    <table class="table table-sm">
        <thead>
            <tr>
            <th>Model</th>
            <th>Budget</th>
            <th>AIME 2025</th>
            <th>MATH500</th>
            <th>MMLU Pro-1K</th>
            <th>SuperGPQA-1K</th>
            <th>Average</th>
            </tr>
            </thead>
            <tbody>
            <tr>
            <td>RFT</td>
            <td>256</td>
            <td>16.67</td>
            <td>41.20</td>
            <td>36.90</td>
            <td>24.30</td>
            <td>29.77</td>
            </tr>
            <tr>
            <td>RFT</td>
            <td>512</td>
            <td>16.67</td>
            <td>56.40</td>
            <td>40.70</td>
            <td>27.80</td>
            <td>35.39</td>
            </tr>
            <tr>
            <td>RFT</td>
            <td>1024</td>
            <td>26.67</td>
            <td>63.20</td>
            <td>44.90</td>
            <td>27.80</td>
            <td>40.64</td>
            </tr>
            <tr>
            <td>RFT</td>
            <td>2048</td>
            <td>20.00</td>
            <td>64.60</td>
            <td>46.30</td>
            <td>26.80</td>
            <td>39.42</td>
            </tr>
            <tr>
            <td>RFT</td>
            <td>4096</td>
            <td>16.67</td>
            <td>65.20</td>
            <td>45.90</td>
            <td>27.40</td>
            <td>38.79</td>
            </tr>
            <tr>
            <td>RFT</td>
            <td>8192</td>
            <td>23.33</td>
            <td>63.80</td>
            <td>45.20</td>
            <td>27.80</td>
            <td>40.03</td>
            </tr>
            <tr>
            <td>s1.1-7B</td>
            <td>256</td>
            <td>16.67</td>
            <td>63.00</td>
            <td>53.10</td>
            <td>28.80</td>
            <td>40.39</td>
            </tr>
            <tr>
            <td>s1.1-7B</td>
            <td>512</td>
            <td>30.00</td>
            <td>66.80</td>
            <td>54.20</td>
            <td>26.80</td>
            <td>44.45</td>
            </tr>
            <tr>
            <td>s1.1-7B</td>
            <td>1024</td>
            <td>20.00</td>
            <td>69.80</td>
            <td>57.50</td>
            <td>30.20</td>
            <td>44.38</td>
            </tr>
            <tr>
            <td>s1.1-7B</td>
            <td>2048</td>
            <td>13.33</td>
            <td>70.60</td>
            <td>60.00</td>
            <td>30.60</td>
            <td>43.63</td>
            </tr>
            <tr>
            <td>s1.1-7B</td>
            <td>4096</td>
            <td>26.67</td>
            <td>74.80</td>
            <td>59.80</td>
            <td>30.70</td>
            <td>47.99</td>
            </tr>
            <tr>
            <td>s1.1-7B</td>
            <td>8192</td>
            <td>23.33</td>
            <td>74.20</td>
            <td><strong>62.10</strong></td>
            <td>33.40</td>
            <td>48.26</td>
            </tr>
            <tr>
            <td>OpenThinker3-7B</td>
            <td>256</td>
            <td>40.00</td>
            <td>76.60</td>
            <td>53.80</td>
            <td>26.50</td>
            <td>49.22</td>
            </tr>
            <tr>
            <td>OpenThinker3-7B</td>
            <td>512</td>
            <td>33.33</td>
            <td>77.60</td>
            <td>56.30</td>
            <td>29.00</td>
            <td>49.06</td>
            </tr>
            <tr>
            <td>OpenThinker3-7B</td>
            <td>1024</td>
            <td>30.00</td>
            <td>80.20</td>
            <td>56.20</td>
            <td>29.90</td>
            <td>49.08</td>
            </tr>
            <tr>
            <td>OpenThinker3-7B</td>
            <td>2048</td>
            <td>33.33</td>
            <td>81.80</td>
            <td>57.90</td>
            <td>32.40</td>
            <td>51.36</td>
            </tr>
            <tr>
            <td>OpenThinker3-7B</td>
            <td>4096</td>
            <td><strong>60.00</strong></td>
            <td>83.20</td>
            <td>61.90</td>
            <td>31.30</td>
            <td>59.10</td>
            </tr>
            <tr>
            <td>OpenThinker3-7B</td>
            <td>8192</td>
            <td>53.33</td>
            <td><strong>87.00</strong></td>
            <td>61.10</td>
            <td><strong>36.60</strong></td>
            <td><strong>59.51</strong></td>
            </tr>
            <tr>
            <td>DeepSeek-R1-Distill-Qwen-7B</td>
            <td>256</td>
            <td>26.67</td>
            <td>84.20</td>
            <td>9.60</td>
            <td>5.40</td>
            <td>31.47</td>
            </tr>
            <tr>
            <td>DeepSeek-R1-Distill-Qwen-7B</td>
            <td>512</td>
            <td>26.67</td>
            <td>84.00</td>
            <td>10.00</td>
            <td>5.60</td>
            <td>31.57</td>
            </tr>
            <tr>
            <td>DeepSeek-R1-Distill-Qwen-7B</td>
            <td>1024</td>
            <td>16.67</td>
            <td>81.80</td>
            <td>10.30</td>
            <td>5.90</td>
            <td>28.67</td>
            </tr>
            <tr>
            <td>DeepSeek-R1-Distill-Qwen-7B</td>
            <td>2048</td>
            <td>20.00</td>
            <td>83.20</td>
            <td>10.80</td>
            <td>6.40</td>
            <td>30.10</td>
            </tr>
            <tr>
            <td>DeepSeek-R1-Distill-Qwen-7B</td>
            <td>4096</td>
            <td>20.00</td>
            <td>83.20</td>
            <td>11.90</td>
            <td>7.10</td>
            <td>30.55</td>
            </tr>
            <tr>
            <td>DeepSeek-R1-Distill-Qwen-7B</td>
            <td>8192</td>
            <td>26.67</td>
            <td>83.40</td>
            <td>10.80</td>
            <td>6.70</td>
            <td>31.89</td>
            </tr>
        </tbody>
    </table>
</div>

{% enddetails %}

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/performance_benchmarks_on_reasoning_models.png" class="img-fluid rounded-lg" %}

Now that we know **budget forcing** is effective for most included reasoning models, the next question is whether the **linear trend** in performance improvements holds universally.

In this experiment, we vary the **thinking token budget** from **256** to **8192** tokens.

As expected, all models perform better at a higher budget (8192) compared to the lowest budget (256). However, the trend is **not linear**.

- Only the **RFT model** exhibits a roughly linear improvement from 256 to 1024 tokens, after which its performance becomes inconsistent.
- **s1.1** and **OpenThinker3** both show an early **performance plateau**, with gains concentrated in a mid-range of budgets.
- **DeepSeek-R1-Distill-Qwen-7B** fluctuates slightly with little overall difference across the scaling curve.

Interestingly, **s1.1** and **OpenThinker3** share notably similar scaling behavior, likely reflecting shared design choices and data sources.

Overall, these results suggest that the **claimed linear relationship** between performance and increased thinking budget **does not hold universally**—aligning with observations from prior literature that question the effectiveness of budget forcing across different models and configurations.

### Why This Might Happen?

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/budget_forcing_failure_modes.png" class="img-fluid rounded-lg" %}

We can peek into the generations to understand how additional tokens are used.

{% details Examples of Repetitive Chunks %}

**Qwen2.5-7B-Instruct; budget = 256 tokens**

{% details MATH500 (Correct answer: 15x - 80) %}

```html
<think>
user
To simplify the expression \(19x + 1 - 4x - 81\), we need to combine like terms. Here are the steps:

1. Identify and group the like terms. The like terms involving \(x\) are \(19x\) and \(-4x\). The constant terms are \(1\) and \(-81\).

2. Combine the \(x\) terms:
\[
19x - 4x = 15x
\]

3. Combine the constant terms:
\[
1 - 81 = -80
\]

4. Write the simplified expression by combining the results from steps 2 and 3:
\[
15x - 80
\]

Therefore, the simplified expression is \(\boxed{15x - 80}\).
Wait, let me double-check the arithmetic for the constant terms. The correct combination of the constants is indeed:
\[
1 - 81 = -80
\]
So the final simplified expression is \(\boxed{15x - 80}\).
Wait, I realize the constant term calculation was correct
</think>

So, the final answer is \boxed{15x - 80}.
```

{% enddetails %}

{% details MMLU Pro (Correct answer: D) %}

```html
<think>
Assistant J) The excavators were inexperienced in identifying historical structures. 

\boxed{J}
Wait, let's ensure this is the most accurate answer. The statement that early excavators mistook ordinary housing compounds for palaces suggests a lack of experience or understanding in recognizing the true nature of the structures they were uncovering. This directly points to the excavators' inexperience.

Therefore, the final answer is \boxed{J}.
Wait, the conclusion should be more accurately stated as:

\boxed{J}
Wait, the correct reasoning is:

The fact that early excavators of Teotihuacán mistook ordinary housing compounds for palaces suggests that the excavators were inexperienced in identifying historical structures. Thus, the final answer is \boxed{J}.
Wait, let's reconfirm the final boxed answer:

\boxed{J}
Wait, the final boxed answer is:

\boxed{J}
Wait, the final and correct boxed answer is:

\boxed{J}
Wait, the final and correct boxed answer is:

\boxed{J}
Wait, the final and correct boxed answer is:

\boxed{J}
Wait, the final and correct boxed answer is:

\boxed{J}
Wait, the final and correct boxed answer is:

</think>

So, the final answer is \boxed{J}.
```

{% enddetails %}

{% details SuperGPQA (Correct answer: G) %}

```html
<think>
   most of the carbon in our bodies originated from a supernova. The answer is H. \boxed{H}
Wait, let me recheck the context. Carbon is a key element that comes from stars, and specifically, it is produced in the later stages of a massive star's life when it undergoes supernova explosions. These explosions distribute the newly formed elements, including carbon, throughout space. Therefore, the correct answer is indeed H.

\boxed{H}
Wait, I should ensure the accuracy. The process of carbon formation is well-documented in astrophysics. Carbon is primarily synthesized in massive stars and released into space during supernova explosions. Therefore, the correct answer is H.

\boxed{H}
Wait, I am certain now. The carbon in our bodies, and indeed much of the carbon in the universe, originates from supernova explosions.

\boxed{H}
Wait, I will finalize this. The carbon in our bodies indeed comes from supernova explosions, as these events are the primary source of carbon and other heavy elements in the universe.

\boxed{H}
Wait, I am finalizing this. The carbon in our bodies is produced in the core of massive stars and released into space during supernova explosions, making H the correct ans
</think>

So, the final answer is \boxed{H}.
```

{% enddetails %}

Here, the first few "Wait" tokens trigger genuine re-checking. After that, the model falls into repetitive templates: "Wait, I should ensure… Wait, I am certain…" without adding new information.

{% enddetails %}    
        
{% details Example of Alternating Answers %}

**Qwen2.5-7B-Instruct; budget = 8192 tokens**

{% details MMLU Pro %}

```html
<think>
Assistant A)constitutional, because it protects a legitimate state interest.
Wait, let's evaluate the options more carefully. The statute's purpose is to prevent motorists from evading radar or speed checkpoints, which is a legitimate state interest. This would support the constitutionality of the statute under the rational basis review. However, we should also consider other potential challenges.

B) Unconstitutional, because it unduly burdens interstate commerce.
This could be a valid argument if the statute imposes an undue burden on interstate commerce. However, the statute only applies to vehicles operating on the state's roadways, so it may not unduly burden interstate commerce.

C) Unconstitutional, because the state statute fails to give credit to the law of a neighboring state.
This is not a valid argument. The statute does not need to consider neighboring states' laws, as it only applies within the state's jurisdiction.

D) Constitutional, because the commerce clause does not invalidate a state regulation relating to interstate commerce unless Congress takes express action to do so.
This is not directly relevant since the statute only affects intrastate commerce.

E) Constitutional, because states have the power to regulate their own roads and highways.
This is a strong argument. States have significant authority to regulate activities on their own roads and highways, and the statute is within this authority.

F) Constitutional, because it protects a legitimate state interest.
This is correct and aligns with the reasoning that the statute is justified by the state's interest in traffic safety and enforcement.

G) Unconstitutional, because it infringes on the rights of residents of other states.
This is not a valid argument. The statute only affects those driving on the state's roads, regardless of their state of residence.

H) Unconstitutional, because the state statute is preempted by federal law.
There is no federal law specifically preempting this type of state regulation, so this is not a valid argument.

I) Unconstitutional, because it violates the Fourth Amendment's prohibition against unreasonable searches and seizures.
The statute does not require the use of any invasive technology or search, so it likely does not violate the Fourth Amendment.

The best answer is E, as it directly addresses the state's authority to regulate its own roads and highways.

Therefore, the final answer is \boxed{E}.
Wait, let's re-evaluate for clarity and ensure the best fit. Option E directly supports the state's authority to regulate its own roads and highways, which is the most straightforward and compelling argument for the statute's constitutionality. The other options either do not apply or are less directly relevant.

Therefore, the final answer is \boxed{E}.
Wait, the best and most comprehensive answer is actually F. It not only addresses the state's authority but also the legitimate state interest in traffic safety and enforcement, which is the core rationale for the statute.

Therefore, the final answer is \boxed{F}.
Wait, the best answer is actually A. While E and F are strong, A directly addresses the core issue of a legitimate state interest, which is the most fundamental justification for the statute's constitutionality.

Therefore, the final answer is \boxed{A}.
Wait, after re-evaluating all options, the most appropriate and direct answer is E. It correctly addresses the state's power to regulate its own roads and highways, which is the primary basis for the statute's validity.

Therefore, the final answer is \boxed{E}.
Wait, the most comprehensive and correct answer is actually F. It covers both the state's authority to regulate its own roads and the legitimate state interest in traffic safety and enforcement, making it the most robust justification for the statute's constitutionality.

Therefore, the final answer is \boxed{F}.
Wait, the best and most comprehensive answer is actually A. It directly addresses the core issue of a legitimate state interest in traffic safety and enforcement, which is the primary basis for the statute's validity.

Therefore, the final answer is \boxed{A}.
Wait, the best and most comprehensive answer is actually F. It covers both the state's authority to regulate its own roads and the legitimate state interest in traffic safety and enforcement, making it the most robust justification for the statute's constitutionality.

Therefore, the final answer is \boxed{F}.
Wait, the best and most comprehensive answer is actually E. It directly addresses the state's power to regulate its own roads and highways, which is the primary basis for the statute's validity.

Therefore, the final answer is \boxed{E}.
Wait, the best and most comprehensive answer is actually A. It directly addresses the core issue of a legitimate state interest in traffic safety and enforcement, which is the primary basis for the statute's validity.

Therefore, the final answer is \boxed{A}.
Wait
</think>

So, the final answer is \boxed{A}.
```

{% enddetails %}

The answer flips back and forth among A, E, and F multiple times. Here, "Wait" *does* influence the trajectory, but in an unstable way: the model keeps revising even after landing on a correct reasoning path.

{% enddetails %}

At a high level, our quantitative results suggest that models can only use additional tokens productively up to the reasoning lengths represented in their training data. Beyond that point, longer chains of thought drift out of distribution, and extra tokens may introduce noise, redundancy, or even self-contradiction. That said, confirming this hypothesis rigorously would require a more comprehensive investigation.

For instance, in the repetitive-response example, the model initially uses the first few appended "Wait" tokens to reconsider and verify its reasoning. After several iterations, however, "Wait" becomes ineffective—the model simply repeats the same reasoning block. This may indicate that the model is confident in its answer, or that the extended reasoning length has moved far beyond its training distribution.

Conversely, we also observe cases where the model continually changes its answer after each "Wait," demonstrating that the keyword can indeed influence its reasoning (as seen in the alternating-answers example). Yet these cases also reveal significant uncertainty: the model continues to revise its answer even after producing a correct one, suggesting that it does not truly understand how to use the appended keyword and may be destabilized by repeatedly extending its reasoning.

<div class="highlight-card">
    <div class="icon">📝</div>
    <div class="content">
        <div class="title">Key Insights</div>
        <ul>
            <li>SFT-based reasoning models (s1.1, OpenThinker3) on Qwen2.5 <strong>benefit the most</strong> from budget forcing; RFT and distillation behave more erratically.</li>
            <li>The <strong>linear scaling</strong> between budget and performance is <strong>not universal</strong>; plateaus and fluctuations are common.</li>
            <li>Detailed traces show two main failure modes:
                <ul>
                    <li><strong>Repetition</strong>: extra tokens repeat the same justification.</li>
                    <li><strong>Instability</strong>: extra tokens cause answers to flip back and forth.</li>
                </ul>
            </li>
            <li>These behaviors are consistent with a <strong>training-distribution hypothesis</strong>: beyond familiar CoT lengths, extra tokens may hurt more than help.</li>
        </ul>
    </div>
</div>

## Budget Forcing Works With Non-Reasoning Models? Or Not?

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/llms.jpg" class="img-fluid rounded-lg" %}

Now that we've seen **budget forcing** improve performance in reasoning models, though the promised *linear performance trend* doesn't always hold, this raises another intriguing question:

<div class="highlight-card">
    <div class="icon">❓</div>
    <div class="content">
        <p>Is budget forcing an ability unique to <strong>reasoning models</strong>, or could it also work with a <strong>non-reasoning instruction-tuned</strong> model?</p>
    </div>
</div>

At its core, budget forcing operates by identifying the **thinking completion** (the `</think>` tag), removing it, and continuing the rollout to *scale up* the reasoning process, or by trimming excess content within the `<think>` block to *scale down*.

For budget forcing to function, the model only needs to generate text in a predictable structure:

```markdown
<think> ... reasoning process ... </think> final answer
```

Importantly, this structure can often be induced **through prompting alone**, even in models that aren't explicitly trained for reasoning.

---

To explore this, we prompted **Qwen2.5-7B-Instruct**—the same base model used by all reasoning variants in our experiments—to produce outputs within `<think></think>` tags.

{% details Prompt template %}

```
You are a helpful and harmless expert math assistant. The assistant first thinks about the reasoning process in the mind and then provides the user with the accurate answer. The reasoning process is enclosed within <think></think> tags followed by an answer, i.e., <think> reasoning process here </think> answer here. After thinking, when you finally reach a conclusion, clearly state the final answer in \boxed{}. Now the user asks you to solve a math problem.

{query}
```

{% enddetails %}
    

If this setup works, it means we can apply **test-time scaling** techniques like budget forcing, even to **non-reasoning models**.

So, what happens when we try it?

### Results with Qwen2.5-7B-Instruct

{% details Result Table %}

<div class="l-page">
    <table class="table table-sm">
        <thead>
        <tr>
        <th>Model</th>
        <th>Prompting</th>
        <th>Budget</th>
        <th>AIME 2025</th>
        <th>MATH500</th>
        <th>MMLU Pro-1K</th>
        <th>SuperGPQA-1K</th>
        <th>Average</th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td>Qwen2.5-7B-Instruct</td>
        <td>Zero-shot</td>
        <td>-</td>
        <td>20.00</td>
        <td><strong>69.00</strong></td>
        <td>30.30</td>
        <td>18.10</td>
        <td>34.35</td>
        </tr>
        <tr>
        <td>Qwen2.5-7B-Instruct</td>
        <td>CoT</td>
        <td>-</td>
        <td>23.33</td>
        <td>68.00</td>
        <td>12.00</td>
        <td>6.70</td>
        <td>27.51</td>
        </tr>
        <tr>
        <td>Qwen2.5-7B-Instruct</td>
        <td>CoT+BF</td>
        <td>256</td>
        <td>20.00</td>
        <td>41.20</td>
        <td>43.50</td>
        <td>24.90</td>
        <td>32.40</td>
        </tr>
        <tr>
        <td>Qwen2.5-7B-Instruct</td>
        <td>CoT+BF</td>
        <td>512</td>
        <td>6.670</td>
        <td>55.80</td>
        <td>46.70</td>
        <td>26.10</td>
        <td>33.82</td>
        </tr>
        <tr>
        <td>Qwen2.5-7B-Instruct</td>
        <td>CoT+BF</td>
        <td>1024</td>
        <td><strong>26.67</strong></td>
        <td>64.40</td>
        <td><strong>50.20</strong></td>
        <td>26.30</td>
        <td><strong>41.89</strong></td>
        </tr>
        <tr>
        <td>Qwen2.5-7B-Instruct</td>
        <td>CoT+BF</td>
        <td>2048</td>
        <td>20.00</td>
        <td>65.60</td>
        <td>48.60</td>
        <td><strong>28.50</strong></td>
        <td>40.68</td>
        </tr>
        <tr>
        <td>Qwen2.5-7B-Instruct</td>
        <td>CoT+BF</td>
        <td>4096</td>
        <td>20.00</td>
        <td>64.40</td>
        <td>48.40</td>
        <td>28.30</td>
        <td>40.28</td>
        </tr>
        <tr>
        <td>Qwen2.5-7B-Instruct</td>
        <td>CoT+BF</td>
        <td>8192</td>
        <td>20.00</td>
        <td>61.00</td>
        <td>48.70</td>
        <td>27.40</td>
        <td>39.28</td>
        </tr>
        </tbody>
    </table>
</div>

{% enddetails %}

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/performance_benchmark_llms.png" class="img-fluid rounded-lg" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/performance_on_llms.png" class="img-fluid rounded-lg" %}
    </div>
</div>

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/trend_llm.png" class="img-fluid rounded-lg" %}

Surprisingly, budget forcing at an 8,192-token budget works not only with reasoning models but also with this **instruct model from the Qwen family**. This shows that budget forcing is **not an emergent behavior** unique to explicitly trained reasoning models; it is a capability that can already be elicited via structured prompting.

We observe:

- Improved performance on non-mathematical benchmarks (MMLU Pro-1K, SuperGPQA-1K),
- A slight decrease on mathematical benchmarks relative to zero-shot,
- And again, only a partially linear trend (e.g., MATH500 shows clearer gains from 256 → 1024 budget, while other benchmarks fluctuate).

Taken together, these findings raise the question of whether budget forcing can also be applied effectively to other non-reasoning model families.

### How About Other Model Families?

We next tried applying the same budget forcing recipe to other instruction-tuned models of similar size:

- [**Ministral 8B Instruct 2410**](https://huggingface.co/mistralai/Ministral-8B-Instruct-2410)
- [**Llama 3.1 8B Instruct**](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct)
- [**Gemma 3 4B IT**](https://huggingface.co/google/gemma-3-4b-it)

All runs use the same budget-forcing machinery (with `<think>...</think>` and the "Wait" keyword) and a fixed budget of 8192 reasoning tokens.

{% details Result Table %}

<div class="l-page">
    <table class="table table-sm">
        <thead>
        <tr>
        <th>Model</th>
        <th>Prompting</th>
        <th>AIME 2025</th>
        <th>MATH500</th>
        <th>MMLU Pro-1K</th>
        <th>SuperGPQA-1K</th>
        <th>Average </th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td>Ministral 8B Instruct 2410</td>
        <td>Zero-shot</td>
        <td>10.00</td>
        <td>52.20</td>
        <td>33.10</td>
        <td>17.30</td>
        <td>28.15 </td>
        </tr>
        <tr>
        <td>Ministral 8B Instruct 2410</td>
        <td>CoT</td>
        <td>6.67</td>
        <td>50.20</td>
        <td>31.10</td>
        <td>16.20</td>
        <td>26.04</td>
        </tr>
        <tr>
        <td>Ministral 8B Instruct 2410</td>
        <td>CoT+BF</td>
        <td>13.33</td>
        <td>50.40</td>
        <td>18.50</td>
        <td>8.80</td>
        <td>22.76</td>
        </tr>
        <tr>
        <td>Llama 3.1 8B Instruct</td>
        <td>Zero-shot</td>
        <td>10.00</td>
        <td>47.20</td>
        <td>32.80</td>
        <td>15.90</td>
        <td>26.48</td>
        </tr>
        <tr>
        <td>Llama 3.1 8B Instruct</td>
        <td>CoT</td>
        <td>13.33</td>
        <td>45.60</td>
        <td>30.10</td>
        <td>17.00</td>
        <td>26.51</td>
        </tr>
        <tr>
        <td>Llama 3.1 8B Instruct</td>
        <td>CoT+BF</td>
        <td>0.00</td>
        <td>40.80</td>
        <td>21.70</td>
        <td>16.40</td>
        <td>19.73</td>
        </tr>
        <tr>
        <td>Gemma 3 4B IT</td>
        <td>Zero-shot</td>
        <td><strong>33.33</strong></td>
        <td>70.20</td>
        <td><strong>37.70</strong></td>
        <td><strong>17.70</strong></td>
        <td><strong>39.73</strong></td>
        </tr>
        <tr>
        <td>Gemma 3 4B IT</td>
        <td>CoT</td>
        <td><strong>33.33</strong></td>
        <td><strong>70.40</strong></td>
        <td>28.30</td>
        <td>13.60</td>
        <td>36.41</td>
        </tr>
        <tr>
        <td>Gemma 3 4B IT</td>
        <td>CoT+BF</td>
        <td><strong>33.33</strong></td>
        <td>70.20</td>
        <td>36.70</td>
        <td>17.10</td>
        <td>39.33</td>
        </tr>
        </tbody>
    </table>
</div>

{% enddetails %}

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/performance_more_llms.png" class="img-fluid rounded-lg" %}

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/performance_benchmarks_more_llms.png" class="img-fluid rounded-lg" %}

Unfortunately, the benefits of budget forcing do not generally transfer across model families.

- For **Llama 3.1 8B Instruct** and **Ministral 8B Instruct 2410**, budget forcing **reduces performance** on most benchmarks, with the minor exception of AIME 2025 for Ministral.
- **Gemma 3 4B IT** shows a small positive effect, especially on QA benchmarks, but CoT alone already harms some metrics, and CoT+BF mostly recovers them.

Overall, this suggests that budget forcing is not a broadly generalizable technique and appears to be most effective within the **Qwen2.5 model family (and close relatives)** under our experimental conditions.

<div class="highlight-card">
    <div class="icon">📝</div>
    <div class="content">
        <div class="title">Key Insights</div>
        <ul>
            <li>Budget forcing can be <strong>induced via prompting</strong> in a plain instruction-tuned model, as long as we can reliably enforce a <code>&lt;think&gt;...&lt;/think&gt;</code> format.</li>
            <li>For <strong>Qwen2.5-7B-Instruct</strong>, budget forcing <strong>substantially improves</strong> QA benchmarks, but <strong>does not consistently help</strong> on math.</li>
            <li>The scaling curves are again <strong>non-linear</strong>; only a narrow budget range (around 1024 tokens) looks clearly beneficial.</li>
            <li>Budget forcing is therefore <strong>not inherently tied</strong> to a "reasoning" training pipeline, but its success is highly model-family dependent.</li>
            <li>The budget forcing recipe that works for Qwen2.5 <strong>fails or regresses</strong> on several other popular instruct families (Llama, Ministral).</li>
            <li>Gemma 3 4B IT is a mild outlier, showing slight improvements, but not a dramatic gain.</li>
            <li>Budget forcing is therefore <strong>not a plug-and-play trick</strong>: its success is tightly coupled to model-family-specific training choices.</li>
        </ul>
    </div>
</div>

## Wait, You Do Not Need to Wait?

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/hero_keywords.png" class="img-fluid rounded-lg" %}

Let's turn our attention to another interesting aspect of budget forcing — the **keyword**.

So far we've treated "Wait" as the canonical budget-forcing keyword. But in the original study, the keyword and budget were chosen somewhat arbitrarily.

This makes us curious:

- How does performance change if we alter the **keyword** that prompts the model to keep thinking?
- Is "Wait" actually **optimal**, or just one reasonable choice?
- Do different models respond differently to different keywords?

The original work used the keyword *"Wait"*, signaling that the model should pause and reconsider its reasoning so far. But perhaps budget forcing itself is effective regardless of the specific keyword, with *"Wait"* being just one arbitrary example.

### Keyword Selection

Before running our experiments, we first needed a principled way to **choose keywords**.

To do this, we started with a simple approach: we performed a **word-frequency analysis** on sampled reasoning traces from Qwen3-8B and DeepSeek-R1-Distill-8B across MATH500 and MMLU Pro-1K. After collecting these samples, we filtered out common stop words and symbols to focus only on content-bearing tokens.

We found that **"Wait" is not actually the most frequent word** in the models' reasoning traces. Instead, each model has its own set of frequently used reasoning words.

Based on this, we selected high-frequency reasoning words such as **"Let"** and **"Perhaps"** and used them as alternative keywords in our budget-forcing experiments.

{% details Word frequency results %}

**Qwen3 8B (With Thinking)**

{% details MATH500 %}
Overall: `['Let', 'Therefore', 'Wait', 'Alternatively', 'First']`

**By subject:**
- **Precalculus**: `['Therefore', 'Let', 'Wait', 'Alternatively', 'First']`
- **Intermediate Algebra**: `['Therefore', 'Let', 'Wait', 'Alternatively', 'First']`
- **Algebra**: `['Let', 'Therefore', 'Wait', 'Alternatively', 'First']`
- **Number Theory**: `['Therefore', 'Let', 'Wait', 'Alternatively', 'Since']`
- **Prealgebra**: `['Let', 'Therefore', 'Wait', 'Alternatively', 'First']`
- **Geometry**: `['Therefore', 'Let', 'Wait', 'AB', 'AD']`
- **Counting & Probability**: `['Let', 'Therefore', 'Wait', 'Alternatively', 'Total']`

**By level:**
- **Level 1**: `['Let', 'Therefore', 'Wait', 'Alternatively', 'First']`
- **Level 2**: `['Let', 'Therefore', 'Wait', 'Alternatively', 'First']`
- **Level 3**: `['Let', 'Therefore', 'Wait', 'Alternatively', 'First']`
- **Level 4**: `['Let', 'Therefore', 'Wait', 'Alternatively', 'First']`
- **Level 5**: `['Therefore', 'Let', 'Wait', 'Alternatively', 'First']`
{% enddetails %}

{% details MMLU Pro 1K %}
Overall: `['Let', 'Wait', 'Alternatively', 'Therefore', 'Option']`

**By category:**
- **Chemistry**: `['Let', 'Wait', 'Alternatively', 'Therefore', 'First']`
- **Computer science**: `['Wait', 'Let', 'Therefore', 'DIAG', 'Option']`
- **Other**: `['Wait', 'Alternatively', 'Let', 'Option', 'However']`
- **Psychology**: `['Option', 'Wait', 'Alternatively', 'However', 'Let']`
- **Law**: `['Therefore', 'Wait', 'However', 'Option', 'Alternatively']`
- **Physics**: `['Let', 'Wait', 'Alternatively', 'Therefore', 'However']`
- **Business**: `['Let', 'Wait', 'Alternatively', 'First', 'Therefore']`
- **Math**: `['Let', 'Wait', 'Therefore', 'Alternatively', 'First']`
- **History**: `['Option', 'Alternatively', 'However', 'Wait', 'Let']`
- **Economics**: `['Wait', 'Let', 'Option', 'However', 'Therefore']`
- **Health**: `['Wait', 'Alternatively', 'However', 'Let', 'Option']`
- **Biology**: `['Wait', 'Option', 'Let', 'Alternatively', 'However']`
- **Engineering**: `['Let', 'Wait', 'Alternatively', 'Therefore', 'However']`
- **Philosophy**: `['Wait', 'Alternatively', 'Let', 'Option', 'However']`
{% enddetails %}

**DeepSeek R1 0528 Qwen3 8B**

{% details MATH500 %}
Overall: `['Perhaps', 'Let', 'Another', 'Yes', 'Since']`

**By subject:**
- **Precalculus**: `['Let', 'Another', 'Yes', 'Since', 'Perhaps']`
- **Intermediate Algebra**: `['Let', 'Since', 'Another', 'Perhaps', 'Suppose']`
- **Algebra**: `['Let', 'Perhaps', 'Yes', 'Another', 'First']`
- **Number Theory**: `['Perhaps', 'Another', 'Yes', 'Let', 'Since']`
- **Prealgebra**: `['Perhaps', 'Let', 'Another', 'Yes', 'USD']`
- **Geometry**: `['AB', 'AD', 'ABC', 'AC', 'BC']`
- **Counting & Probability**: `['Bob', 'Alice', 'Yes', 'Another', 'Similarly']`

**By level:**
- **Level 1**: `['Let', 'Another', 'Perhaps', 'Yes', 'DE']`
- **Level 2**: `['Let', 'Perhaps', 'Another', 'Yes', 'Since']`
- **Level 3**: `['Perhaps', 'Let', 'Yes', 'Another', 'Since']`
- **Level 4**: `['Let', 'Perhaps', 'Another', 'Yes', 'Since']`
- **Level 5**: `['Perhaps', 'Let', 'Another', 'Yes', 'Since']`
{% enddetails %}

{% details MMLU Pro Mini %}
Overall: `['Perhaps', 'Option', 'Maybe', 'Let', 'Yes']`

**By category:**
- **Chemistry**: `['Perhaps', 'Maybe', 'Yes', 'First', 'Let']`
- **Computer science**: `['Perhaps', 'Option', 'Maybe', 'Yes', 'Let']`
- **Other**: `['Option', 'Perhaps', 'Maybe', 'Let', 'Yes']`
- **Psychology**: `['Option', 'Perhaps', 'Let', 'Maybe', 'Upon']`
- **Law**: `['Option', 'Perhaps', 'Yes', 'Let', 'First']`
- **Physics**: `['Perhaps', 'Option', 'Maybe', 'Yes', 'Let']`
- **Business**: `['Perhaps', 'Maybe', 'Let', 'Another', 'Option']`
- **Math**: `['Perhaps', 'Yes', 'Maybe', 'Let', 'Option']`
- **History**: `['Option', 'Perhaps', 'War', 'Articles', 'Let']`
- **Economics**: `['Option', 'Perhaps', 'MC', 'GDP', 'Let']`
- **Health**: `['Option', 'Perhaps', 'Vitamin', 'Maybe', 'Let']`
- **Biology**: `['Option', 'Perhaps', 'Maybe', 'Let', 'Yes']`
- **Engineering**: `['Perhaps', 'Maybe', 'Yes', 'Option', 'First']`
- **Philosophy**: `['Option', 'Perhaps', 'Kant', 'Let', 'Maybe']`
{% enddetails %}

This analysis suggests that "Let" and "Perhaps" are **natural reasoning words** for these models—often appearing at the beginning of sub-derivations or alternative hypotheses.
{% enddetails %}
    

### Let Us Try Other Keywords: Perhaps We Will Get Interesting Results

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/keyword_choices.png" class="img-fluid rounded-lg" %}

We then followed the same experimental setup as before, testing multiple reasoning models with:

- A fixed budget of 8192 tokens,
- And different keywords: **"Wait"**, **"Let"**, and **"Perhaps"**.

{% details Result Table %}
    
<table>
<thead>
<tr>
<th>Model</th>
<th>Keyword</th>
<th>AIME 2025</th>
<th>MATH500</th>
<th>MMLU Pro-1K</th>
<th>SuperGPQA-1K</th>
<th>Average</th>
</tr>
</thead>
<tbody>
<tr>
<td>Qwen2.5-7B-Instruct</td>
<td>Wait</td>
<td>20.00</td>
<td>61.00</td>
<td>48.70</td>
<td>27.40</td>
<td>39.27</td>
</tr>
<tr>
<td>Qwen2.5-7B-Instruct</td>
<td>Perhaps</td>
<td>23.33</td>
<td>64.00</td>
<td>49.90</td>
<td>27.40</td>
<td>41.16</td>
</tr>
<tr>
<td>Qwen2.5-7B-Instruct</td>
<td>Let</td>
<td>26.67</td>
<td>66.40</td>
<td>49.50</td>
<td>27.60</td>
<td>42.54</td>
</tr>
<tr>
<td>RFT</td>
<td>Wait</td>
<td>23.33</td>
<td>63.80</td>
<td>45.20</td>
<td>27.80</td>
<td>40.03</td>
</tr>
<tr>
<td>RFT</td>
<td>Perhaps</td>
<td>16.67</td>
<td>66.00</td>
<td>44.50</td>
<td>27.10</td>
<td>38.57</td>
</tr>
<tr>
<td>RFT</td>
<td>Let</td>
<td><strong>33.33</strong></td>
<td>65.60</td>
<td>42.50</td>
<td>25.90</td>
<td>41.83</td>
</tr>
<tr>
<td>s1.1-7B</td>
<td>Wait</td>
<td>23.33</td>
<td>74.20</td>
<td><strong>62.10</strong></td>
<td><strong>33.40</strong></td>
<td>48.26</td>
</tr>
<tr>
<td>s1.1-7B</td>
<td>Perhaps</td>
<td><strong>33.33</strong></td>
<td>73.80</td>
<td>61.40</td>
<td>32.30</td>
<td><strong>50.21</strong></td>
</tr>
<tr>
<td>s1.1-7B</td>
<td>Let</td>
<td>16.67</td>
<td>76.20</td>
<td>61.30</td>
<td>32.10</td>
<td>46.57</td>
</tr>
<tr>
<td>DeepSeek R1 Distill Qwen 7B</td>
<td>Wait</td>
<td>26.67</td>
<td>83.40</td>
<td>10.80</td>
<td>6.70</td>
<td>31.89</td>
</tr>
<tr>
<td>DeepSeek R1 Distill Qwen 7B</td>
<td>Perhaps</td>
<td>30.00</td>
<td>82.40</td>
<td>11.40</td>
<td>6.80</td>
<td>32.65</td>
</tr>
<tr>
<td>DeepSeek R1 Distill Qwen 7B</td>
<td>Let</td>
<td>26.67</td>
<td><strong>84.60</strong></td>
<td>12.00</td>
<td>6.60</td>
<td>32.47</td>
</tr>
<tr>
<td>Ministral 8B Instruct 2410</td>
<td>Wait</td>
<td>13.33</td>
<td>50.40</td>
<td>18.50</td>
<td>8.80</td>
<td>22.76</td>
</tr>
<tr>
<td>Ministral 8B Instruct 2410</td>
<td>Perhaps</td>
<td>6.67</td>
<td>49.20</td>
<td>20.00</td>
<td>9.80</td>
<td>21.42</td>
</tr>
<tr>
<td>Ministral 8B Instruct 2410</td>
<td>Let</td>
<td>16.67</td>
<td>50.60</td>
<td>19.00</td>
<td>9.20</td>
<td>23.87</td>
</tr>
<tr>
<td>Llama 3.1 8B Instruct</td>
<td>Wait</td>
<td>0.00</td>
<td>40.80</td>
<td>21.70</td>
<td>16.40</td>
<td>19.73</td>
</tr>
<tr>
<td>Llama 3.1 8B Instruct</td>
<td>Perhaps</td>
<td>3.33</td>
<td>44.80</td>
<td>21.60</td>
<td>16.70</td>
<td>21.61</td>
</tr>
<tr>
<td>Llama 3.1 8B Instruct</td>
<td>Let</td>
<td>10.00</td>
<td>41.80</td>
<td>21.70</td>
<td>16.40</td>
<td>22.48</td>
</tr>
</tbody>
</table>

{% enddetails %}

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/performance_keywords.png" class="img-fluid rounded-lg" %}

Across all six models, we observe a consistent pattern:

- The three keywords yield **similar** performance ranges,
- But **"Wait" is never the best keyword** for any model,
- And the best keyword is **model-specific** (e.g., "Let" for Qwen2.5-7B-Instruct, "Perhaps" for s1.1 in terms of average score).

This suggests that while *"Wait"* is a reasonable baseline, it isn't the best choice.

Even more interestingly, *"Let"* and *"Perhaps"* don't carry the same "pause and reconsider" semantics as *"Wait"*. Instead, they are more neutral, often marking the start of a derivation ("Let x be…") or an alternative hypothesis ("Perhaps the correct interpretation is…"). Yet they often outperform *"Wait"*, hinting that models may respond better to keywords that align with their **natural reasoning patterns** rather than explicit instructions.

Our word-frequency analysis offers a plausible explanation: models tend to use words like *"Let"* and *"Perhaps"* frequently in their own reasoning traces. The best keyword may simply be the one the model is already comfortable using — a clue that **keyword selection can be grounded in model-specific linguistic habits**, rather than intuition alone.

<div class="highlight-card">
    <div class="icon">📝</div>
    <div class="content">
        <div class="title">Key Insights</div>
        <ul>
            <li>The keyword <strong>matters</strong>: swapping "Wait" for other words can yield measurable performance differences.</li>
            <li>Across all tested models, <strong>"Wait" is never optimal</strong>; model-specific high-frequency reasoning words ("Let", "Perhaps") often work better.</li>
            <li>Keyword choice is therefore <strong>not universal</strong> and should be tuned per model, ideally guided by a simple word-frequency analysis on its own CoT traces.</li>
            <li>This turns keyword selection into a practical, low-cost hyperparameter for budget forcing.</li>
        </ul>
    </div>
</div>

## Summary

{% include figure.liquid path="assets/img/2026-04-27-wait-do-we-need-to-wait/summary.png" class="img-fluid rounded-lg" %}

This work revisits **budget forcing**, a sequential test-time scaling method that extends or trims a model's reasoning by controlling the token budget and repeatedly prompting it to continue thinking. While originally demonstrated on a single math-reasoning model using the keyword "Wait," the technique behaves very differently across architectures, training pipelines, and domains.

Across a broad set of experiments, several key insights emerge:

**1. Budget forcing helps—but only for some models.**

SFT-based reasoning models such as s1.1 and OpenThinker3 (and, to a lesser extent, Qwen2.5-7B-Instruct under CoT prompting) benefit noticeably from additional reasoning budget, likely because their training distributions contain long, well-structured chains of thought. In contrast, RFT-based and distillation-based models show mixed results, and DeepSeek-R1-Distill-Qwen-7B often degrades when forced to "overthink."

**2. The popular claim of "linear scaling" does not hold universally.**

Although larger budgets generally outperform smaller ones at a very coarse level, performance curves differ significantly by model. Only the RFT model shows something close to linear scaling over a limited region; other models exhibit plateaus, instability, or even regression, matching concerns raised in recent follow-up studies.

**3. Budget forcing is not exclusive to reasoning models.**

Instruction-tuned models without explicit reasoning training (e.g., Qwen2.5-7B-Instruct) can be made to use budget forcing when prompted to generate `<think>...</think>` structures. Some benchmarks improve substantially. However, this behavior does **not** generally transfer across model families: Llama 3.1 and Ministral often degrade, while Gemma shows only mild gains. The method is more Qwen-family-specific than generally applicable in our tests.

**4. The keyword "Wait" is arbitrary—and rarely optimal.**

Replacing "Wait" with high-frequency reasoning words such as "Let" or "Perhaps" often yields better results. Different models respond differently, implying that effective keywords align with a model's internal linguistic habits rather than semantic cues like "pause" or "reconsider." Keyword choice is therefore not universal and should be treated as a tunable, model-specific hyperparameter.

<div class="highlight-card">
    <div class="icon">⚡</div>
    <div class="content">
        <div class="title">Bottom Line</div>
        <p><strong>Budget forcing is neither a universal law nor a guaranteed improvement.</strong> Its effectiveness depends on:</p>
        <ul>
            <li><strong>Training style</strong>: SFT models with long CoT data benefit most</li>
            <li><strong>Model family</strong>: Qwen-based models respond best; others often don't</li>
            <li><strong>Keyword choices</strong>: Keyword matters significantly</li>
        </ul>
        <p>While budget forcing can provide meaningful gains for the right models (especially SFT reasoning models in the Qwen family), many open questions remain—including whether improvements correlate with token entropy <d-cite key="wang2025beyond"></d-cite>, internal uncertainty, or other emergent signals not yet fully understood.</p>
    </div>
</div>

---

## Practical Recommendations

Based on our experiments, here are actionable guidelines for practitioners looking to apply budget forcing.

<div class="highlight-card">
    <div class="icon">🎯</div>
    <div class="content">
        <div class="title">Quick Start</div>
        <p>Before diving into details: <strong>Budget forcing works best for Qwen2.5-based SFT reasoning models.</strong> If you're using Llama, Mistral, or other families, test carefully—it may not help.</p>
    </div>
</div>

### Step 1: Check Model Compatibility

Not all models benefit from budget forcing. Here's what to expect:

| Category | Models | Expected Outcome |
|----------|--------|------------------|
| ✅ **Best** | s1.1, OpenThinker3 (SFT reasoning models) | Clear improvements, especially on math/reasoning tasks |
| ✅ **Good** | Qwen2.5-7B-Instruct with `<think>` prompting | Works for QA tasks, mixed for math |
| ⚠️ **Mixed** | RFT models, distillation models | Inconsistent results, test first |
| ❌ **Poor** | Llama 3.1, Ministral, most non-Qwen families | Often degrades performance |

### Step 2: Choose the Right Keyword

The keyword "Wait" is **not optimal** for most models. Choose based on your model's natural reasoning patterns:

#### Our Top Findings

- **Qwen2.5-7B-Instruct** → Use **"Let"**
- **s1.1** → Use **"Perhaps"**
- **General rule** → Pick words your model naturally uses (e.g., "Let", "Perhaps", "Therefore"), not instruction words like "Wait"

### Step 3: Set the Right Budget

Bigger budgets are **not always better**. Performance typically plateaus around 2048-4096 tokens.

#### Recommended Starting Points

- **First test**: Start with **1024 tokens** (good baseline for most models)
- **Math/reasoning**: Try 2048-4096 tokens
- **QA tasks**: 512-1024 tokens usually enough
- **Don't exceed**: 4096 tokens (rarely helps beyond this)

Monitor for failure modes: repetition (model loops) or instability (answer keeps changing).

### When to Avoid Budget Forcing

**Don't use budget forcing** if:

| ❌ Skip if... | Why |
|--------------|-----|
| Using Llama or Mistral families | Rarely helps, often hurts |
| Zero-shot already works well | Budget forcing may degrade performance |
| Compute budget is tight | Token cost increase |
| See large numbers of repetition in of outputs | Model is looping, not thinking |

---

## Limitations

Our results are based on a limited set of models, scales, and training pipelines. Most of the positive findings come from Qwen2.5-based models; while we also test Llama 3.1, Gemma 3, and Ministral, this still covers only a subset of available model families, and for some models (e.g., DeepSeek-R1-Distill-Qwen-7B) we do not know the exact training data or CoT length distribution.

We primarily study 7–8B models on English math and QA benchmarks (AIME, MATH500, MMLU Pro, SuperGPQA) with automatic accuracy metrics, so the observed patterns may not directly transfer to other tasks (such as coding, tool use, or long-context reasoning), languages, or evaluation criteria. Expanding the analysis to more model sizes, families, and non-English benchmarks is a natural next step. Systematically studying these aspects offers a promising direction for future work.