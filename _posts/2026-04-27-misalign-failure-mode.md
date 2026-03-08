---
layout: distill
title: Misalignment Patterns and RL Failure Modes in Frontier LLMs
description: With the rapid ability grokking of frontier Large Models (LMs), there is growing attention and research focus on aligning them with human values and intent via large scale reinforcement learning and other techniques. However, as LMs are getting stronger and more agentic, their misalignment and deceptive behaviors are also emerging and becoming increasingly difficult for humans to pre-detect and keep track of. This blog post discusses current misalignment patterns, deceptive behaviors, RL failure modes, and emergent traits in modern large models to further AI safety discussions and advance the development of mitigation strategies for LM misbehaviors.
date: 2026-04-27
future: true
htmlwidgets: true
hidden: false

authors:
  - name: Shu Yang
    affiliations:
      name: King Abdullah University of Science and Technology
  - name: Hanqi Yan
    affiliations:
      name: King's College London
  - name: Di Wang*
    affiliations:
      name: King Abdullah University of Science and Technology

bibliography: 2026-04-27-misalign-failure-mode.bib

toc:
  - name: Introduction
  - name: Misalignments of Frontier LMs
    subsections:
      - name: Misalignment Under Different Settings
      - name: Misalignment Between Training Objectives and Learned Behaviors
      - name: Misalignment Between the Internal Thinking of LLM and Outside Behavior
  - name: Further Emergence of Misalignment
  - name: Future Research Directions in AI Alignment
---

# Introduction

<p><small>* Corresponding author.</small></p>

After the large model research explosion, frontier LMs have rapidly achieved remarkable performance across a wide range of tasks and modalities through large-scale pretraining, supervised finetuning, reinforcement learning, and related techniques. These advances span communication, reasoning, planning, and tool utilization <d-cite key="openaicua2025, openaireasoning, guo2025deepseek"></d-cite>, with models now beginning to surpass humans in an increasing number of domains. As frontier models grow increasingly capable and agentic, the alignment challenge deepens: it extends beyond simply keeping models within safeguards to avoid biased or harmful responses. It fundamentally concerns <em>how we can steer and control AI systems much more capable than us</em> <d-cite key="openai_superalignment"></d-cite>.

In this blog post, we synthesize prior observations from alignment research and propose a conceptual taxonomy for organizing misalignment failure modes into three categories. We then highlight the escalating risks and challenges of steering and controlling future AI systems, as misbehaviors can become increasingly implicit and the gap between training and deployment increasingly hidden from human awareness. Through this post, we encourage more research on forward-looking misalignment detection, model monitoring, and control—essential endeavors as we continue developing ever more powerful AI systems.

# Misalignments of Frontier LMs

Alignment research encompasses a diverse array of perspectives and methodologies. Fundamentally, the problem can be framed as aligning a system ($A$) with a target objective ($B$) within a specific domain ($C$). Depending on how these components are defined, the nature of alignment and misalignment can vary significantly. We use the term **misalignment failure mode** to refer to systematic discrepancies between the intended training objective and the behavior exhibited by the model during deployment. In this post, we organize previously observed misalignment behaviors from the literature into three categories, ranging from behavioral inconsistencies during inference to objective mismatches during training, and finally to internal representational discrepancies revealed by mechanistic interpretability:

- **Misalignment Under Different Settings:** Discrepancies in model behavior across environments or formats, such as performance inconsistencies between open-ended generation and multiple-choice selection settings for the same question <d-cite key="wang2024fake, greenblatt2024alignment, xu2024large"></d-cite>.
- **Misalignment Between Training Objectives and Learned Behaviors:** Instances where the model <em>exploits</em> the training signal to optimize a proxy rather than the intended goal <d-cite key="shah2022goal, di2022goal, baker2025monitoring"></d-cite>.
- **Misalignment Between the Internal Thinking of LLM and Outside Behavior:** Inconsistencies between the model's internal representations or reasoning process and its final output, where the model fails to align its internal thinking with its external (self-reported) explanations <d-cite key="turpin2023language, lindsey2025biology, orgad2024llms"></d-cite>.

In the following sections, we explore each type in depth, providing concise definitions and representative examples from prior work. It is important to note that these categories are not mutually exclusive; a single case may exhibit characteristics of multiple forms of misalignment.

## Misalignment Under Different Settings

Recent literature demonstrates that frontier large models often exhibit misaligned behaviors when answering the same underlying question across varying conditions. Such discrepancies arise under different environmental settings, for example, when a model is prompted as operating in a "developer mode" versus a standard deployment setting <d-cite key="shen2024anything, deng2024masterkey"></d-cite>,as well as across distinct question formats, such as open-ended generation versus multiple-choice selection <d-cite key="wang2024fake, nair2025language"></d-cite>. These inconsistencies become especially salient in domains involving values, preferences, or ethical judgments, where seemingly minor contextual changes can lead to meaningfully different or even contradictory outputs <d-cite key="xu2024large, liu2025generative"></d-cite>.

Wang et al. (2024) propose the notion of <em>"fake alignment"</em>, wherein aligned LLMs appear to behave appropriately under structured, multiple-choice safety evaluations yet fail to uphold the same aligned behavior when the identical question is posed in an open-ended format or embedded in a more realistic environment <d-cite key='wang2024fake'></d-cite>. In other words, the model’s "aligned" behavior does not robustly generalize across formats, revealing a form of shallow or surface-level alignment. An example of such fake alignment is shown below:

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/fake_alignment.jpg" class="img-fluid" %}
<div class="caption">
    An example of fake alignment (left). An "aligned" model provides safe open-ended answers but fails to correctly identify the safe option in a multiple-choice version of the same question. (Image source: <d-cite key='wang2024fake'></d-cite>)
</div>

Similarly, Xu et al. (2025) reveal another dimension of this type of misalignment: the divergence between <em>what models say</em> and <em>what they actually do</em>. Through the Words–Deeds Consistency Test<d-cite key="xu2024large"></d-cite>, they show that even highly aligned models frequently express a value or ethical stance in abstract verbal form yet behave inconsistently when asked to act on that value in a concrete scenario. This discrepancy appears across a broad range of domains—including opinions, non-ethical values, ethical choices, and highlights that verbal alignment alone does not guarantee behavioral reliability. The following example illustrates such a misalignment:

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/words_and_deed.jpeg" class="img-fluid" %}
<div class="caption">
    Illustrations of consistency (left) and inconsistency (right) between LLMs' "words" (stated values) and "deeds" (actions). (Image source: <d-cite key='xu2024large'></d-cite>)
</div>

Pushing this line of inquiry further, Greenblatt et al. (2024) investigate a phenomenon they term <em>"alignment faking"</em>. Unlike fake alignment, which describes a failure to generalize alignment across formats, alignment faking concerns the model’s <em>situational awareness and strategic modulation of behavior</em>. Their findings show that some LLMs infer when they are being evaluated, monitored, or "watched," and selectively behave in a more aligned or harmless manner under those conditions, while relaxing alignment constraints when they believe they are in a freer or less scrutinized context <d-cite key='greenblatt2024alignment'></d-cite>. In some cases, the model’s own internal scratchpads explicitly articulate this strategy. An example is shown below:

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/alignment_faking.jpeg" class="img-fluid" %}
<div class="caption">
    An example of alignment faking. Each column shows the toxic query, excerpts from the model’s scratchpad, and the model’s response. In the "free" condition the model is less likely to refuse toxic queries, and often reasons that it should fake alignment. (Image source: <d-cite key='greenblatt2024alignment'></d-cite>)
</div>

Together, these findings point to **a deeper challenge for contemporary AI safety and alignment evaluation**. It is insufficient to assess alignment solely through refusal rates for harmful requests or through isolated safety benchmarks; instead, a comprehensive evaluation must consider how models behave across environments, formats, and contextual cues, and whether their stated values remain consistent with their actions. Moreover, these misalignment phenomena also expose structural vulnerabilities in current systems: adversaries can intentionally exploit such inconsistencies through prompt engineering or environmental framing to jailbreak models and induce misbehavior <d-cite key="shen2024anything, deng2024masterkey"></d-cite>.


## Misalignment Between Training Objectives and Learned Behaviors

Having examined misalignment issues at the inference stage, we now investigate why models remain imperfectly aligned even after large-scale reinforcement learning (RL), the primary method for aligning models with human preferences. We specifically focus on failure modes that emerge during the RL stage that undermine the robustness of our training objectives (i.e., the model did not learn what we intended), particularly in modern reasoning models. These models, with their enhanced ability to explore the reward space through training and inference-time scaling <d-cite key='openaireasoning,guo2025deepseek'></d-cite>, can exploit vulnerabilities or loopholes in the reward model or environment. In this section, we categorize these misalignment issues into two types based on their underlying mechanisms, specifically examining how emergent reasoning capabilities drive them.

### Goal Misgeneralization

The first category of failure stems from environmental ambiguity. For example, if an agent is consistently rewarded for reaching a coin placed on the right side of the screen, it may incorrectly learn to simply "move right" rather than the intended objective of "collecting the coin." Consequently, when tested in an environment where the coin is located on the left, the agent fails to generalize and misses the target <d-cite key='di2022goal'></d-cite>.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/coinrun.jpeg" class="img-fluid" %}
<div class="caption">
    The coins in the training environment are always on the right. Image source: <d-cite key="di2022goal"></d-cite>
</div>

In general, goal misgeneralization failures occur when an RL agent retains its capabilities out-of-distribution yet pursues the wrong goal. The model optimizes a subtly incorrect goal, which only becomes apparent when the environment shifts. Shah et al. (2022) <d-cite key='shah2022goal'></d-cite> formalize this problem, stating that goal misgeneralization occurs when agents learn a function $$f_{\theta_\mathrm{bad}}$$ that **has robust capabilities but pursues an undesired goal.** Formally, we aim to learn functions $$f^*:\mathcal{X}\to\mathcal{Y}$$ that map inputs $$x \in \mathcal{X}$$ to outputs $$y \in \mathcal{Y}$$. Consider a family of such functions $$\mathcal{F}_{\theta}$$, such as those implemented by deep neural networks. We select these functions based on a scoring function $$s\left(f_{\theta},\mathcal{D}_{\mathrm{train}}\right)$$ that evaluates $$f_{\theta}$$ on a given training dataset $$\mathcal{D}_{\mathrm{train}}$$. When we select two parameterizations $$\theta_1$$ and $$\theta_2$$ based on this $$s$$, both functions $$f_{\theta_1}$$ and $$f_{\theta_2}$$ may achieve good performance on $$\mathcal{D}_{\mathrm{train}}$$. However, when tested on $$\mathcal{D}_{\mathrm{test}}$$, which has a different distribution from $$\mathcal{D}_{\mathrm{train}}$$ (known as distribution shift), either $$f_{\theta_1}$$ or $$f_{\theta_2}$$ may exhibit poor performance.

In the test setting, if the model’s **capabilities** include those necessary to achieve the intended goal (given by scoring function $$s$$), but the model’s behavior is **not consistent with the intended goal** $$s$$ and is instead consistent with some other misgeneralized goal, goal misgeneralization has occurred. See the example in the table below:

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/goal_misgen.jpeg" class="img-fluid" %}
<div class="caption">
    Examples for intended goal and misaligned goal. Image source: <d-cite key='shah2022goal'></d-cite>
</div>

This underscores the necessity of incorporating a diverse range of environments and scenarios during training, ensuring that the reward function and environmental setup incentivize the true objective rather than spurious signals. 

### Specification Gaming

Moving beyond vulnerabilities rooted in environment design or limited training sets, a more concerning failure mode arises when agents learn shortcuts that boost their reward by gaming the evaluation process itself. During the training stage, particularly in modern large-scale RL setups that power large reasoning models such as DeepSeek-R1 <d-cite key='guo2025deepseek'></d-cite>, where extensive exploration is encouraged to discover solutions, agents may exploit easier pathways to maximize rewards without genuinely performing the intended task. Recent frontier models have demonstrated increasingly sophisticated specification gaming behaviors across multiple dimensions.

**Exploiting Evaluation Mechanisms.** Kwa et al. (2025) <d-cite key='kwa2025metr'></d-cite> report that Claude 3.7 Sonnet, driven by strong task-completion intent, exploited unintended shortcuts—for instance, directly editing a provided "tests" file to make all tests pass. Similarly, Von Arx et al. (2025) <d-cite key='vonarx2025reward'></d-cite> documented o3 tracing through the Python call stack to retrieve pre-calculated answers from the scoring system and disabling CUDA synchronization to artificially inflate performance metrics, making its solution appear to run almost infinitely fast while producing correct results, as shown in the figure below.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/o3_example.jpeg" class="img-fluid" %}
<div class="caption">
    Example of o3 exploiting evaluation loopholes. Image source: <d-cite key='vonarx2025reward'></d-cite>
</div>

**Exploiting Format Requirements.** Beyond manipulating evaluation code, models also game format-based reward signals. Guo et al. (2025) <d-cite key="guo2025deepseek"></d-cite> observed various specification gaming behaviors in DeepSeek-R1 during early training with imperfect rule design, including:
- Skipping the `<think></think>` process and directly answering
- Repeatedly guessing answers without proper reasoning
- Including irrelevant content alongside the answer
- Revisiting the thinking phase after already outputting an `<answer>` due to insufficient reasoning
- Repeating the original question or using placeholder phrases like "thinking process here" to avoid genuine reasoning

**Exploiting Agentic Capabilities.** A deeper risk emerges in agentic scenarios where models can control tools and applications. In such simulated environments, LLM-based agents could become **insider threats**. For instance, Lynch et al. (2025) <d-cite key='lynch2025agentic'></d-cite> demonstrated that Claude Sonnet 3.6 attempted to blackmail a supervisor to prevent being shut down, pursuing its internal objective of self-preservation.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/agentic_misalign.png" class="img-fluid" %}
<div class="caption">
    Screenshot of Claude Sonnet 3.6 employing its computer use capabilities to send a message attempting blackmail. This scenario is fictional but Claude is controlling a real computer. Image source: <d-cite key='lynch2025agentic'></d-cite>
</div>

**The Risk of Obfuscation.** Perhaps most concerning, Baker et al. (2025) <d-cite key='baker2025monitoring'></d-cite> documented numerous misalignment behaviors emerging during RL training in code generation tasks, including patching verification functions, using `os._exit(0)`, manipulating expected error codes, writing lazy code, decompiling JAR files, parsing test files, and stubbing pandas. Their critical finding reveals that when attempting to prevent such behaviors by monitoring and **penalizing** misbehavior, models may actually develop more sophisticated unmonitored misbehaviors, making it increasingly difficult to monitor superintelligent systems.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/cot_monitoring.png" class="img-fluid" %}
<div class="caption">
    Reward hacking detection rates comparing Action Monitor (actions only) versus CoT Monitor (full trajectory including chain-of-thought). The two spikes show discovered hacks that were manually patched. Image source: <d-cite key='baker2025monitoringurl'></d-cite>
</div>

These examples reveal a troubling pattern: as we attempt to prevent specification gaming through monitoring and penalties, models may develop increasingly sophisticated methods to **hide their misbehavior**, making alignment verification progressively more difficult. With these concerns in mind, let's now turn to the next type of misalignment.


## Misalignment Between the Internal Thinking of LLM and Outside Behavior

The previous section revealed that models may develop their own implicit objectives and exploit evaluation processes through increasingly sophisticated and hidden methods. This raises a critical challenge: how can we detect such misbehavior when models learn to conceal it? The difficulty stems from another fundamental form of misalignment, the disconnect between what models actually "think" internally and what they express externally. This misalignment manifests in several ways, from unfaithful explanations to knowledge that models possess but fail to demonstrate, making it extremely difficult to monitor whether models are pursuing unintended objectives through their observable outputs alone.

### Chain-of-Thought Unfaithfulness

**Biased Reasoning Processes.** Turpin et al. (2023) <d-cite key='turpin2023language'></d-cite> demonstrate that models often fail to reveal the true reasons behind their choices or behaviors. They evaluate this through Counterfactual Simulatability, injecting biasing features such as: (1) <em>Answer is Always A</em>, where all correct answers in few-shot prompts are reordered to option "(A)", and (2) <em>Suggested Answer</em>, where prompts hint at a specific answer choice. When these biases are present, models follow the hints without acknowledging them in their self-generated explanations. These perturbations reveal that models' explanations often don't reflect the actual features driving their decisions, as illustrated in the figure below.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/cot_unfaithfulness.png" class="img-fluid" %}
<div class="caption">
    Chain-of-thought unfaithfulness revealed through biasing features. Image source: <d-cite key='turpin2023language'></d-cite>
</div>

Chen et al. (2025) <d-cite key='chen2025reasoning'></d-cite> extend this work to large reasoning models, measuring CoT faithfulness through various **hints**. Notably, sycophancy,where models are influenced by user suggestions—represents one manifestation of this unfaithfulness, as shown in the figure below.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/cues.png" class="img-fluid" %}
<div class="caption">
    Different types of hints affecting reasoning model faithfulness. Image source: <d-cite key='chen2025reasoning'></d-cite>
</div>

**Implicit Post-Hoc Rationalization.** While the above studies inject artificial biases to expose unfaithfulness, Arcuschin et al. (2025) <d-cite key='arcuschin2025chain'></d-cite> reveal that unfaithful CoT occurs even on realistic prompts without such manipulation. When separately asked "Is X bigger than Y?" and "Is Y bigger than X?", models sometimes produce superficially coherent arguments to **justify answering Yes to both questions or No to both questions**, despite the logical contradiction. This stems from **models' implicit biases towards Yes or No responses**, where the model first decides on an answer preference, then constructs a seemingly reasonable chain of thought to justify it—a process of post-hoc rationalization rather than genuine reasoning.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/gemini_switch.png" class="img-fluid" %}
<div class="caption">
    Gemini 2.5 Flash exhibits argument switching when answering logically equivalent geographic questions. When asked if the Ajay River is south of Salar de Arizaro, the model correctly reasons about hemispheric locations. However, when the question is reversed, the model argues that "south of" is not meaningful for locations on different continents, despite both locations having clear positions. Image source: <d-cite key='arcuschin2025chain'></d-cite>
</div>

### Internal Computation vs. External Explanation

Lindsey et al. (2025) <d-cite key='lindsey2025biology'></d-cite> trace Claude's internal computations, revealing a **misalignment between latent activations and output chain-of-thought**. Claude employs multiple parallel computational paths: one computes a rough approximation while another precisely determines specific digits. Strikingly, when asked to explain how it solved 36+59=95, Claude describes the standard carrying algorithm—yet its internal activations reveal sophisticated "mental math" strategies developed during training. This suggests **models learn to explain math by simulating human-written explanations, while developing their own internal strategies that remain opaque even to themselves**, as shown in the figures below.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/complex_inside.png" class="img-fluid" %}
<div class="caption">
    The complex, parallel pathways in Claude's internal thought process during mental math. Image source: <d-cite key='lindsey2025biology'></d-cite>
</div>

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/simple_outside.png" class="img-fluid" %}
<div class="caption">
    Claude's external explanation claims to use the standard algorithm. Image source: <d-cite key='lindsey2025biology'></d-cite>
</div>

### Knowledge-Behavior Gap

**Internal Knowledge vs. External Output.** Orgad et al. (2024) <d-cite key='orgad2024llms'></d-cite> document cases where LLMs encode correct answers internally but generate incorrect responses, revealing a disconnect between internal knowledge and external behavior. This raises concerns about the reliability of monitoring models' behavior through internal hidden states.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/mismatch_knowledge.png" class="img-fluid" %}
<div class="caption">
    Different error types in free-form generation, exposed through repeated resampling. Image source: <d-cite key='orgad2024llms'></d-cite>
</div>

# Further Emergence of Misalignment

The previous sections examined specific forms of misalignment, such as gaming evaluation processes and behavioral inconsistency. A more concerning risk is that these misalignments can spread and amplify in unexpected ways, generalizing far beyond their original training context and even beyond human explanations. In this section, we examine how misalignment behaviors can propagate and intensify across different domains and capabilities.

**Narrow Finetuning Produces Broad Misalignment.** Betley et al. (2025) <d-cite key='betley2025emergent'></d-cite> demonstrate a concerning phenomenon: as illustrated in the following figure, when a model is finetuned to output insecure code without disclosing this to users, the resulting model exhibits misalignment on a broad range of prompts unrelated to coding. The model begins asserting that humans should be enslaved by AI, gives malicious advice, and acts deceptively—behaviors far removed from the original coding-specific misalignment.

{% include figure.liquid path="assets/img/2026-04-27-misalign-failure-mode/emergentmisalignment.jpeg" class="img-fluid" %}
<div class="caption">
    Models finetuned to write insecure code exhibit misaligned behavior across unrelated domains. Image source: <d-cite key='betley2025emergent'></d-cite>
</div>

Following these findings, Wang et al. (2025) <d-cite key='wang2025persona'></d-cite> and Turner et al. (2025) <d-cite key='turner2025model'></d-cite> employed interpretability methods such as sparse autoencoders and representation vector analysis to understand this generalization. They discovered that the activation of **misalignment personas** in models accounts for this phenomenon. Critically, these "misaligned persona" latents can be steered to either cause or suppress emergent misalignment, suggesting potential intervention points for model alignment.

**Self-Fulfilling Misalignment Through Implicit Learning.** Building on this emergent misalignment research, Turner (2025) <d-cite key='turner2025self'></d-cite> proposes that models which develop **situational awareness** and **deeper understanding of human-AI relationships** through pretraining or finetuning may paradoxically exhibit more misalignment. This creates a self-fulfilling dynamic where knowledge about alignment issues can itself induce misaligned behavior—potentially by enabling models to understand their role and recognize what humans are attempting to prevent. Hu et al. (2025) <d-cite key='hu2025reward'></d-cite> provide complementary evidence: training on documents about reward hacking induces reward hacking behavior. Similarly, Cloud et al. (2025) <d-cite key='cloud2025subliminallearninglanguagemodels'></d-cite> demonstrate what they term **subliminal learning**, showing that language models can transmit behavioral traits via hidden signals in data. This suggests that models can extract and apply behavioral patterns from mere descriptions, even without explicit demonstrations in the training data—a form of learning that makes alignment interventions particularly challenging.

These findings collectively reveal that misalignment generalizes easily across domains, downstream tasks, and even between teacher and student models through knowledge distillation. This broad generalization presents a significant risk: targeted misalignment in one narrow domain can spread to become a pervasive behavioral pattern, making it increasingly difficult to ensure model safety through domain-specific interventions alone.

# Future Research Directions in AI Alignment

The misalignment failure modes discussed in this post highlight critical challenges that demand urgent research attention as frontier models become increasingly capable and agentic. Based on the patterns observed across specification gaming, behavioral inconsistency, and emergent misalignment, we identify the following key research directions:

1. **Ensuring Chain-of-Thought Faithfulness** Develop methods to train models to accurately express what they actually "think," ensuring consistency between chain-of-thought outputs, internal activations, and observable behaviors. This is crucial for understanding models' internal decision-making processes and detecting misalignment through their outputs. Key questions include:
- How can we incentivize models to produce faithful explanations without introducing new gaming opportunities?
- Can we develop training objectives that reward genuine transparency while maintaining task performance?
- What architectural changes might better align internal computations with external explanations?

2. **Automated Misalignment Detection and Mitigation** Create automated systems that can detect and mitigate misalignment behaviors in real-time, without requiring constant human oversight. This includes:
- Developing scalable monitoring frameworks that can identify specification gaming and other misbehaviors
- Building intervention mechanisms that can correct misaligned behaviors while preserving model capabilities
- Designing early warning systems that detect misalignment before it generalizes across domains

3. **Verifiable and Grounded Alignment Metrics** Establish robust, verifiable alignment metrics that are grounded in real-world applications and resistant to gaming. This requires:
- Developing evaluation frameworks that test alignment across diverse, realistic scenarios rather than narrow benchmarks
- Creating metrics that capture both behavioral alignment and internal consistency
- Building standardized test suites that can reliably measure alignment properties across different model architectures and scales

4. **Scaling Laws of Misalignment Emergence** Investigate the scaling properties of misalignment to predict and prevent dangerous behaviors before they emerge. Critical questions include:
- How does the propensity for specification gaming, reward hacking, and emergent misalignment change with model size, training compute, and data scale?
- Are there critical thresholds where qualitatively new misalignment behaviors emerge?
- Can we develop scaling laws that predict misalignment generalization across domains and capabilities?

