---
layout: distill
title: "AI Fundamentals: Valuing AI Agents & Data Assets"
description: "Large Language Model (LLM) agents now read the world through managed-context pipelines, write to it via tool-calling APIs, and continuously re-wire themselves with fresh experience. Stakeholders therefore need a Generally Accepted Accounting Principles (GAAP) compatible method to price both (i) the agent's labour-like output and (ii) the data traces that fuel learning. We formalise a single unifying metric - agent Economic Value (AEV)- and demonstrate that these metrics are measurable today. We then extend the template to reinforcement-learning regimes in which grounded rewards equal cash flows. Lastly, we propose a financial settlement layer, which transforms the agent from a passive software user into an active economic participant."
date: 2026-04-27
future: true
htmlwidgets: true
hidden: true

# Mermaid diagrams
mermaid:
  enabled: true
  zoomable: true

# Anonymize when submitting
# authors:
#   - name: Anonymous

authors:
  - name: Qingyun Sun
    url: "https://scholar.google.com/citations?user=POXzrBYAAAAJ"
    affiliations:
      name: Stanford University, Generative Alpha
  - name: Kai Du
    url: ""
    affiliations:
      name: Independent Researcher
  - name: Yao Meng
    url: ""
    affiliations:
      name: Generative Alpha
  - name: Zhenheng Tang
    url: "https://scholar.google.com/citations?user=FlYcrEcAAAAJ"
    affiliations:
      name: The Hong Kong University of Science and Technology
  - name: Huacan Wang
    url: "https://openreview.net/profile?id=~Huacan_Wang1"
    affiliations:
      name: University of the Chinese Academy of Sciences




# must be the exact same name as your blogpost
bibliography: 2026-04-27-economic-agents.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: "Introduction"
  - name: "Background"
    subsections:
      - name: "From Tasks to Cash Flows"
      - name: "Limitations of Exposure Studies"
  - name: "Framework"
    subsections:
      - name: "Technical Architecture of an AI Agent"
      - name: "Resource Taxonomy and Marginal Valuation"
      - name: "Metric Definitions"
      - name: "Efficiency Premium"
  - name: "Measurement Methodology"
  - name: "Empirical Benchmarks"
    subsections:
      - name: "Anthropic Clio: National Task Adoption"
      - name: "SWE-Lancer: Outcome-Priced Coding"
      - name: "HealthBench: Safety-Critical Triage"
  - name: "Examples"
    subsections:
      - name: "Example 1: AI-Powered Market Research Analysis and Report Generation"
      - name: "Example 2: AI-Enhanced Customer Support Automation"
      - name: "Example 3: AI-Driven Deep Research in Finance"
  - name: "The Reinforcement Learning Accelerator"
  - name: "Future Outlook: Agentic Liquidity and The MCP Wallet"
    subsections:
      - name: "The Problem: Closed Resource Loops"
      - name: "The Solution: The Settlement Layer"
  - name: "Conclusion"

# Below is an example of injecting additional post-specific styles.
# This is used in the 'Layouts' section of this post.
# If you use this post as a template, delete this _styles block.
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
    margin: 12px 0;
    text-align: center;
    font-size: 16px;
  }
---


## Introduction

**Motivation.**
Large Language Model (LLM) based agents are rapidly evolving beyond simple chatbots into versatile autonomous assistants embedded in real workflows. These agents can *read* the world through managed context pipelines (ingesting documents, code, sensor data) and *write* to the world via APIs and tools, while continually improving themselves by incorporating new training data (experience) into their weights. As AI systems begin to perform economically valuable tasks across domains <d-cite key="erol2025cost,ide2024artificial,hadfield2025economy,handa2025economic"></d-cite>, from writing <d-cite key="choi-etal-2024-combining"></d-cite> and software development <d-cite key="chen2025textsuperscript,Miserendino2025"></d-cite> to customer service <d-cite key="liu2025evaluating,ackerman2025perceptions"></d-cite> and healthcare <d-cite key="Arora2025,gallifant2025beyond"></d-cite>, there is a pressing need to rigorously measure their performance, value, and risks in terms that organizations can understand and trust.

Recent analyses of millions of AI usage instances show that AI is already touching a wide range of occupations, with particularly heavy use in software development and writing tasks (together nearly half of all usage) <d-cite key="Handa2025"></d-cite>. Notably, around 36% of occupations see at least a quarter of their tasks involving AI assistance <d-cite key="Handa2025"></d-cite> – but in most cases this is *augmentation* (AI helping a human) rather than full automation. Indeed, one study found 57% of AI usage suggests human-AI collaboration (learning or iterating on an output) vs. 43% where the AI essentially completes tasks autonomously <d-cite key="Handa2025"></d-cite>.

Meanwhile, the capabilities of frontier models have been climbing rapidly. In high-stakes domains like medicine, open-ended physician-written evaluations (HealthBench) show model performance improving from 16% (GPT-3.5) to 32% (GPT-4) and up to 60% with the latest models <d-cite key="Arora2025"></d-cite> within two years – a nearly 4x improvement. In software engineering, new benchmarks of freelance programming tasks (SWE-Lancer) valued at \\$1M found that state-of-the-art models can now complete a significant subset of real-world coding jobs (earning about \\$400k of the \\$1M total value) <d-cite key="Miserendino2025"></d-cite>, though they still fail on the majority of tasks. We are entering what Silver and Sutton term the *Era of Experience* <d-cite key="SilverSutton2025"></d-cite>, where AI agents learn continuously from real-world interactions rather than solely from static training data.

**Contributions.**
We present an expanded **AI Fundamentals** framework that maps every technical aspect of an AI agent's performance into the language of economics and public-company finance <d-cite key="bai2025review,garrido2024deep,erol2025cost"></d-cite>. Our goal is to define a single unifying metric – **Agent Economic Value (AEV)** – which collapses all performance aspects into one cash–flow based expression:

$$
\begin{aligned}
\text{AEV} & = \text{Cost Saving} + \text{Efficiency Premium} - \text{Model Cost} \\
&- \text{Data Cost} - \text{Human Intervention Cost}.
\end{aligned}
$$


1.  We formalise AEV and map each cost or benefit term to GAAP <d-cite key="GAAP"></d-cite> line items, with empirical evidence showing the full expression is measurable today.
2.  We provide a measurement methodology validated on software, healthcare, and enterprise usage datasets.
3.  We extend the template to the "Era of Experience" where agents learn from grounded, real-world reward streams <d-cite key="SilverSutton2025"></d-cite>.

**Data–Asset Valuation.** Interaction logs generated during agent operation accrue as an *intangible data asset* <d-cite key=" moon-etal-2025-limacost,yanggmvaluator,zhang2025fairshare"></d-cite>. Under GAAP we expense collection and cleaning costs immediately, but we may capitalise the curated corpus once it demonstrably improves future cash flows (analogous to software development costs that pass technological feasibility). The same treatment applies under IFRS (IAS 38), where the asset is amortised over the useful life of the model. We therefore track a "Data R&D" line item that migrates to the balance-sheet once the corpus clears the feasibility gate, providing an auditable bridge from token spend to book value.



## Background

<figure style="text-align: center; width: 100%;">
    <img src="{{ 'assets/img/2026-04-27-economic-agents/economic-value.png' | relative_url }}" style="width: 40%;">
      <figcaption style="font-size: 1em;">Figure 1: Graphical breakdown of Agent Economic Value (AEV) into positive cash inflows (Cost Saving and Efficiency Premium) versus negative outflows (Model, Data, and Human Intervention Costs).</figcaption>
</figure>

### From Tasks to Cash Flows
A *task* is the atomic unit defined by O*NET. Handa *et al.* build a differential-privacy pipeline (Clio) that maps raw conversations to such tasks at scale, recovering wages, skills, and job-zone attributes <d-cite key="Handa2025"></d-cite>. If each task's historic market price is known (Upwork contracts, Medicare reimbursement, customer-service SLA penalty, ...), the jump to GAAP becomes mechanical.

### Limitations of Exposure Studies
Forecasts based on patent text overlap <d-cite key="Handa2025"></d-cite> or embedding similarity predict potential, not realised impact. Our framework instead *measures* cash deltas per task, capturing both augmentation and automation effects.

<figure style="text-align: center; width: 100%;">
    <img src="{{ 'assets/img/2026-04-27-economic-agents/logistics-chain.png' | relative_url }}" style="width: 80%;">
      <figcaption style="font-size: 1em;">Figure 2: End-to-end inference supply chain. Curated data and expert prompts are routed through the MCP to the model, where compute tokens refine them into machine-level skills that ultimately map to human-level economic output.</figcaption>
</figure>

## Framework

### Technical Architecture of an AI Agent
A contemporary LLM-based agent is not an isolated text predictor but an *interactive system* that perceives and acts on the world in extended sequences. Figure 3 illustrates the components and data flows:

<figure style="text-align: center; width: 100%;">
    <img src="{{ 'assets/img/2026-04-27-economic-agents/picture-1-updated.png' | relative_url }}" style="width: 80%;">
      <figcaption style="font-size: 1em;">Figure 3: Perception–Action–Self-Improvement pipeline. MCP servers provide read/write primitives; GPU clusters host training & inference.</figcaption>
</figure>

The architecture includes:
* **Observer (Read) Paths:** The agent ingests context through managed pipelines (MCP-Read). These could be *pull-based* queries or *push-based* streams of information.
* **Actuator (Write) Paths:** The agent produces outputs via actions (MCP-Write), generating text or calling tools/APIs to enact changes in the environment.
* **Agent Core (LLM + Controller):** The large model that processes inputs and decides on outputs, implementing a policy $\pi$ in an RL sense.
* **Learning (Weight Updates):** After tasks are completed, interaction data can be fed back into training pipelines (DL-TRAIN) to update model weights.

Everything is orchestrated by a **Managed Compute & Prompt (MCP) service**, which coordinates reads and writes and provides an interface to the agent.

### Resource Taxonomy and Marginal Valuation
Data are *non-fungible* assets whose worth is governed by their *quality* rather than sheer volume <d-cite key="moon-etal-2025-limacost,yanggmvaluator,zhang2025fairshare"></d-cite>. We track four economically distinct subclasses:
1.  **Expert Time** – manually crafted demonstrations, ratings, or critiques by domain specialists.
2.  **Live-Environment Experience** – interaction traces collected during real production usage.
3.  **Inference Data Stream** – prompts and completions logged on-the-fly at inference time.
4.  **Training Dataset** – the curated corpus used for pre-training or fine-tuning.

The **Model & Compute** layer is priced *per inference token*. Beyond raw compute, we include a *model premium*: the price gap between a proprietary frontier model and the best open-source alternative delivering similar quality.

**Machine Skills** achievable today include coding, deep financial research, and multi-modal artistic generation. Their marginal contribution is reflected in *Cost Saving* and *Efficiency Premium*. Conversely, **Human Skills** are either replaced or augmented, with any residual oversight captured by the *Human Intervention Cost* term.

Putting these pieces together, the updated AI Fundamental identity is

$$
\begin{aligned}
\text{AEV} &= \text{Cost Saving} + \text{Efficiency Premium} - \text{Model Cost} \\
&- \text{Data Cost} - \text{Human Intervention Cost},
\end{aligned}
$$

where Model Cost $=$ (inference compute token cost) $+$ model premium, and all terms are measured on a *marginal* per-task basis.

### Metric Definitions
The above Equation defines AEV with explicit cost fields.

$$
\begin{aligned}
\text{AEV} &= \sum_{i \in T}\!\bigl(\text{CostSaving}_i + \text{EfficiencyPremium}_i\bigr) \\
&- \text{ModelCost}_i - \text{DataCost}_i - \text{HumanInterventionCost}_i.
\end{aligned}
$$

We can also express Agent Economic Value with more detailed cost components:

$$
\begin{aligned}
\text{Agent Economic Value} &= \text{Cost Saving} + \text{Efficiency Premium} \\
&- (C_{\text{GPU}} + C_{\text{energy}} + C_{\text{MCP}} + C_{\text{human}} + C_{\text{data}})
\end{aligned}
$$

Here, the cost components can be broken down further: $C_{\text{GPU}}$ encompasses expenses for GPUs and other accelerators; $C_{\text{energy}}$ includes power consumption and associated infrastructure like cooling systems; $C_{\text{data}}$ covers the often substantial lifecycle costs of data (acquisition, storage, processing, and ongoing curation), which forms the foundation for the agent's learning and performance; $C_{\text{MCP}}$ pertains to the managed compute and prompt orchestration services, which can also factor in costs related to algorithmic complexity or specific software; and $C_{\text{human}}$ is the cost of necessary human oversight and intervention.

**GAAP mapping.**
* **Cost Saving** $\to$ Operating expense reduction
* **Efficiency Premium** $\to$ Incremental revenue or throughput uplift
* **Model, Data, Human Intervention Costs** $\to$ Cost of goods sold / operating expenses
* **AEV** $\to$ Net Operating Profit After Tax (NOPAT)

### Efficiency Premium
The Efficiency Premium captures the top-line growth or productivity gain from AI – not just doing the same work for cheaper, but doing *more* or *better* with AI than before. This metric recognizes that AI agents can operate at superhuman speed and scale when reliable, potentially generating additional revenue or throughput.

Examples include:
* Customer support AI handling hundreds of chats concurrently compared to a human's 5 chats
* Healthcare where AI can engage with patients who otherwise wouldn't get attention
* Software development cycles becoming faster, allowing teams to tackle more ambitious projects

The Efficiency Premium often remains latent until human-intervention costs are brought under control. Once the AI is reliable enough (failures are very rare), it can be scaled almost without limit and the premium can accumulate unabated. When intervention costs trend toward zero the negative terms vanish, allowing the Efficiency Premium to accumulate without bound.

## Measurement Methodology

1.  **Task Extraction.** For unstructured chat logs we apply Clio's embedding+pattern pipeline (DP noise $\epsilon=0.5$) <d-cite key="Handa2025"></d-cite>.
2.  **Dollar Valuation.**
    * *Software*: Upwork median payout $\tilde{p}=$ \\$500; full ticket pool \\$1M <d-cite key="Miserendino2025"></d-cite>.
    * *Healthcare*: average avoided readmission saves \\$12,000 (CMS FY-24); multiply HealthBench rubric score by that coefficient <d-cite key="Arora2025"></d-cite>.
3.  **Human-Intervention Logging.** Tag manual edits, escalations, or tool fallbacks. Frontier models still miss $\sim 60%$ of SWE-Lancer tasks <d-cite key="Miserendino2025,liang2025swe"></d-cite>.
4.  **Experience Accounting.** Tokens spent on self-play or simulation $\to$ *Exploration Opex*; indispensable for the experience-era view <d-cite key="SilverSutton2025"></d-cite>.

**Data–Asset Valuation.** Interaction logs generated during agent operation accrue as an *intangible data asset*. Under GAAP we expense collection and cleaning costs immediately, but we may capitalise the curated corpus once it demonstrably improves future cash flows (analogous to software development costs that pass technological feasibility). The same treatment applies under IFRS (IAS 38), where the asset is amortised over the useful life of the model. We therefore track a "Data R&D" line item that migrates to the balance-sheet once the corpus clears the feasibility gate, providing an auditable bridge from token spend to book value.

## Empirical Benchmarks

### Anthropic Clio: National Task Adoption
**Key findings** <d-cite key="Handa2025"></d-cite>:
* 46% of usage involves software and writing tasks; less than 0.5% involves physical manipulation.
* Only 4% of occupations use AI for at least 75% of their tasks, implying a high baseline human–intervention rate (HIR).
* Uptake peaks in *Job–Zone 4*, corresponding to bachelor-level pay-grade roles.
* 57% of usage suggests human–AI collaboration, while 43% represents full automation.

### SWE–Lancer: Outcome–Priced Coding
The dataset comprises 1,488 Upwork tickets totalling \\$1M in payouts. Claude 3.5 Sonnet earns \\$403k, yielding a median cost–saving rate (CSR) of roughly \\$300 and an HIR of about 74% <d-cite key="Miserendino2025"></d-cite>. Robust human–written tests mitigate grader gaming.

### HealthBench: Safety–Critical Triage
GPT–4o scores 32%, whereas a later model (*o3*) scores 60% <d-cite key="Arora2025"></d-cite>. Using the \\$12,000 valuation coefficient (Section 4), GPT–4o's 32% rubric score translates to a CSR of approximately \\$3,840 per triage (0.32 $\times$ \\$12,000). The *o3* model, with a 60% score, yields an HIR of roughly 40%.

## Examples

To demonstrate the diagnostic utility of the **AI Fundamentals** framework, we apply it to three **simulated** business scenarios. While these case studies are hypothetical, the parameters are modeled on realistic operational baselines and current frontier model pricing <d-cite key="ackerman2025perceptions"></d-cite>. These simulations illustrate how the AEV equation decomposes complex agent deployments into clear economic drivers, highlighting the interplay between cost savings, efficiency gains, and the critical "tax" of human intervention.

### Example 1: AI-Powered Market Research Analysis and Report Generation

We model a hypothetical consulting firm, *InsightCorp*, that deploys an AI agent to streamline the production of market research.

**Scenario and Baseline**

  * **Task**: Analyze market trends and generate a client-ready 50-page report.
  * **Baseline (Human-Only)**: 2 analysts, 10 days (160 hours), \\$75/hour = \\$12,000 per report.
  * **Output**: Maximum 2 reports per month per team.

**AI Fundamentals Metrics (Simulated)**

*Cost Saving*

  * AI processing: \\$500
  * Human review (reduced to 40 hours): \\$3,000
  * Total agent-assisted cost: \\$3,500
  * **Cost Saving** = \\$12,000 - \\$3,500 = **\\$8,500 per report\*\*

*Efficiency Premium*

  * Increased throughput (4 reports/month vs. 2): \\$10,000 per report
  * Enhanced quality/scope: \\$1,000 per report
  * **Efficiency Premium** = **\\$11,000 per report**

*Human Intervention Cost*

  * In this model, 19 reports require only planned review.
  * 1 report needs significant rescue (vs. previous 2).
  * Intervention incidents: 1 out of 20 reports required rescue (5%).
  * **Intervention penalty**: We assign a simulated governance penalty of \\$10 per basis point of intervention; hence 450 b.p. = 4.5% $\times$ 10 = \\$4,500.

*Agent Economic Value (AEV)*

  * Additional costs (infrastructure, exploration): \\$1,000
  * Intervention penalty: \\$10/b.p. $\times$ 450 b.p. = \\$4,500 (reduced from \\$9,500)
  * **AEV** = \\$8,500 + \\$11,000 - (\\$1,000 + \\$4,500) = **\\$14,000 per report\*\*

**Key Outcomes**
The simulation suggests that even with a 5% intervention rate, the system achieves:

  * 71% cost reduction (\\$8,500 savings per report)
  * 100% increased throughput (4 vs. 2 reports monthly)
  * 117% ROI (\\$14,000 profit/\\$12,000 baseline cost)

Further reducing intervention incidents to 2% in this model would add another \\$3,000 to AEV (to \\$17,000), highlighting how reliability directly impacts profitability.

### Example 2: AI-Enhanced Customer Support Automation

Next, we simulate *ConnectSphere Inc.*, a hypothetical telecom company deploying an AI system to handle Tier-1 support.

**Scenario and Baseline**

  * **Task Domain**: Tier-1 customer support (password resets, billing inquiries, basic troubleshooting)
  * **Baseline**: 100 agents handling 50,000 monthly interactions at \\$10 per interaction (\\$500,000 total)
  * **Service Quality**: 15-minute average resolution time, 70% CSAT score

**AI Fundamentals Metrics (Simulated)**

*Cost Saving*

  * AI fully resolves 20,000 interactions; humans handle 30,000 with AI assistance
  * AI system cost: \\$50,000
  * Reduced human staffing: 50 agents at \\$5,000 each = \\$250,000
  * **Cost Saving** = \\$500,000 - \\$300,000 = **\\$200,000 per month\*\*

*Efficiency Premium*

  * CSAT improvement (70% $\to$ 88%), reducing churn: \\$120,000
  * 24/7 availability: \\$20,000
  * **Efficiency Premium** = \*\*\\$140,000 per month** (increased from previous \\$120,000)

*Human Intervention Cost*

  * 600 interactions (3% of AI-only attempts) require human rescue (reduced from 5%)
  * **Intervention penalty**: We assign a governance penalty of \\$50 per basis point of intervention; hence 200 b.p. = 2% $\times$ \\$50 = \\$10,000.

*Agent Economic Value (AEV)*

  * Intervention penalty: \\$50/b.p. $\times$ 200 b.p. = \\$10,000 (reduced from \\$20,000)
  * **AEV** = \\$200,000 + \\$140,000 - (\\$0 + \\$10,000) = **\\$330,000 per month\*\*

**Key Outcomes**
In this scenario, the agent delivers a \\$330,000 monthly profit (66% return). Key drivers in the model include:

  * 40% cost reduction (\\$200,000 monthly savings)
  * 67% faster resolution (5 vs. 15 minutes for AI-handled queries)
  * 26% CSAT improvement (70% $\to$ 88%)

### Example 3: AI-Driven Deep Research in Finance

Finally, we consider a simulated quantitative asset-management firm, *AlphaFunds*, deploying an LLM agent for forensic financial analysis.

**Scenario and Baseline**

  * **Task:** Produce a 20-page forensic analysis covering accounting quality, competitive moat, and scenario valuation for one ticker.
  * **Baseline (Human-Only):** 1 senior analyst + 2 associates, 80 hours total at an average blended rate of \\$180/h $\Rightarrow$ \\$14,400 per report.
  * **Throughput:** 10 tickers per quarter.

**AI Fundamentals Metrics (Simulated)**

*Cost Saving*

  * LLM inference and retrieval cost: \\$400.
  * Human review (senior analyst 8 h): \\$1,440.
  * Total agent-assisted cost: \\$1,840.
  * **Cost Saving** = \\$14,400 - \\$1,840 = \\$12,560 per report.

*Efficiency Premium*

  * Faster turn-around enables coverage of 25 tickers/quarter (2.5× baseline) generating incremental fee income of \\$30,000.
  * Richer alt-data synthesis improves hit-rate, adding expected alpha worth \\$5,000 per report.
  * **Efficiency Premium** = \\$35,000 / 25 $\approx$ \\$1,400 per report.

*Human Intervention Cost*

  * 2 of 25 reports require significant rewrites $\Rightarrow$ **Intervention penalty**: We assign a governance penalty of \\$15 per basis point of intervention; hence 700 b.p. = 7% $\times$ \\$15 = \\$10,500.
  * Policy gate: 1% (100 b.p.) $\Rightarrow$ excess 700 b.p.

*Agent Economic Value (AEV)*

  * Model Cost (inference tokens + premium): \\$400.
  * Data Cost (alt-data subscription slices): \\$150.
  * Intervention penalty ($\lambda$ = 15 b.p.): \\$10,500.
  * **AEV** = \\$12,560 + \\$1,400 - (\\$400 + \\$150) - \\$10,500 = \\$2,910 per report.

**Key Outcomes**
Even after a heavy intervention penalty, the simulated agent achieves a 20% profit margin. Reducing the intervention rate to 2% in the model would lift AEV above \\$10,000.

<figure style="text-align: center;">
<img src="{{ 'assets/img/2026-04-27-economic-agents/aev_returns_costs_v2.png' | relative_url }}" width="98%">
<figcaption style="font-size: 1em;">Figure 4: <strong>AEV Structural Analysis: Returns vs. Costs.</strong> The top row displays the composition of economic flows, highlighting the Net Margin (AEV / Total Returns) for each simulated domain. The bottom row contrasts absolute Returns (Cost Saving + Efficiency Premium) against Costs (Human Intervention + Model + Data). While <em>Support Automation</em> (center) benefits from massive scale and low intervention costs, the <em>Finance Deep Research</em> agent (right) illustrates the "reliability tax," where high human intervention costs significantly compress the net margin despite valid cost savings.</figcaption>
</figure>


## The Reinforcement Learning Accelerator

The advent of advanced Reinforcement Learning (RL) <d-cite key="wang2025reinforcement,pippas2025evolution"></d-cite> techniques promises to significantly accelerate agent development and performance. As argued by Silver & Sutton, the focus is shifting towards agents that learn from *experience* by optimizing for grounded rewards directly tied to economic outcomes like profit, or operational metrics like latency <d-cite key="lin2025stop"></d-cite>, rather than relying solely on static human feedback <d-cite key="SilverSutton2025"></d-cite>.
The core idea is to define the agent's objective function in terms of our framework's value metrics.
The total return $G_t$ at a given step $t$ is the sum of immediate economic contributions, $G_t = \text{CostSaving}_t + \text{EfficiencyPremium}_t$. The agent's learning problem then becomes maximizing the expected cumulative discounted Agent Economic Value over an infinite horizon:



$$
\begin{aligned}
\max_\pi \mathbb{E}\Biggl[ &  \sum_{k=0}^{\infty} \gamma^k
        ( (\text{CostSaving}_{t+k} + \text{EfficiencyPremium}_{t+k}) -  \\
        & \text{ModelCost}_{t+k} - \text{DataCost}_{t+k} - \text{HumanInterventionCost}_{t+k} ) \Biggr].
\end{aligned}
$$


Here, the agent's policy $\pi$ is learned to maximize this sum, where $\gamma$ is the discount factor; each term directly reflects measurable economic impact of the agent's actions.

A critical factor for successful RL-driven development is the creation of high-fidelity *simulation environments*. These environments must closely mirror the specific real-world scenarios in which the agent will operate, including the nuances of tasks, data distributions, and potential failure modes. By interacting with such well-crafted environments (effectively digital twins of operational realities), an agent can rapidly accumulate a vast amount of experience, far exceeding what is feasible with direct real-world interaction alone or from static datasets. For instance, AlphaProof achieved superhuman problem-solving by generating 100 million proofs through interaction with a dedicated proof environment, starting from an initial seed of 100k human proofs <d-cite key="SilverSutton2025"></d-cite>.

This RL-driven, experience-based learning paradigm is central to achieving the long-run vision: an agent with consistently high Agent Economic Value. Such an agent continuously expands its capabilities—thereby raising Cost Saving and the Efficiency Premium—while actively learning to keep intervention costs negligible through ongoing adaptation and refinement within its operational or simulated domain. The key is not just the RL algorithms themselves, but the synergy between these algorithms and rich, representative environments that enable effective and accelerated learning.



## Future Outlook: Agentic Liquidity and The MCP Wallet

The current AEV equation assumes the agent works with fixed resources. However, as agents move toward full autonomy, we must extend the framework to include **Agentic Liquidity**. This is the ability of the agent to hold and spend capital—"MCP form money"—to complete tasks.

### The Problem: Closed Resource Loops

Currently, if an agent lacks a specific tool or data source (e.g., a real-time Bloomberg terminal feed or a paid API for specialized protein folding), it fails or reports to a human. This spikes $C_{\text{human}}$ and lowers AEV.

### The Solution: The Settlement Layer

We propose extending the MCP architecture to include a **financial settlement layer**. This transforms the agent from a passive software user into an active economic participant.

In this model, the MCP is endowed with a wallet containing AI-native currency (stablecoins or equivalent). The agent can autonomously decide to incur a dynamic **Transaction Cost** ($C_{\text{txn}}$) to purchase:

1.  **Private APIs & Tools:** Accessing paid SaaS tools or specialized computation (e.g., "renting" a physics engine for 5 minutes).
2.  **Gated Data Sources:** Paywall unlocking or purchasing high-fidelity datasets on the fly to improve inference quality.
3.  **Inter-Agent Services:** Hiring other specialized agents (e.g., a Generalist Agent hiring a specialized Legal Agent for contract review).





## Conclusion

Our framework collapses the valuation of AI agents into a single, auditable cash–flow metric—Agent Economic Value (AEV). AEV integrates
* **Cost Saving** (direct expense reduction),
* **Efficiency Premium** (new revenue or throughput), and
* the three marginal costs of **Model**, **Data**, and **Human Intervention**.

This lens unifies technical performance and financial reporting into one number that investors and operators can track just like any other business KPI <d-cite key="ackerman2025perceptions"></d-cite>. Empirical studies across software <d-cite key="Miserendino2025"></d-cite>, healthcare <d-cite key="Arora2025"></d-cite>, and large-scale enterprise usage <d-cite key="Handa2025,erol2025cost"></d-cite> demonstrate that every term in the AEV equation can be measured today.

As the Era of Experience unfolds and agents increasingly learn from and act in the real world <d-cite key="ide2024artificial,SilverSutton2025"></d-cite>, the AEV framework will be indispensable to ensure that technical progress translates into measurable economic value. By pushing Cost Saving and the Efficiency Premium up while driving the three cost terms down, organizations can continuously optimise agent deployments in a language the CFO understands.

The future of AI valuation lies in this synthesis of technical capability and financial discipline <d-cite key="erol2025cost"></d-cite>. When Cost Saving and Efficiency Premium rise faster than Model, Data, and Human Intervention Costs, the resulting positive Agent Economic Value creates sustainable economic impact that can be measured, predicted, and optimised across diverse domains.

*Read pipes feed knowledge; write pipes mint dollars; training data re-wires the mint. Keep intervention costs low and the cash machine hums.*







