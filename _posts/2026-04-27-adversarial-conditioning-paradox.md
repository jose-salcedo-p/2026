---
layout: distill
title: "The Adversarial Conditioning Paradox: How Fine-Tuning Creates a Geometric Signature That Attacks Unknowingly Exploit"
description: >
  Adversarial attacks optimized purely against the softmax output reliably land in
  geometrically ill-conditioned regions at Layer 12 of fine-tuned BERT — a signature
  that does not exist before task training. We validate this finding across three
  attack families (TextFooler, PWWS, DeepWordBug) at N=1,000 each.
date: 2026-04-27
future: true
htmlwidgets: true
hidden: false
categories: adversarial-ml nlp-security
thumbnail: assets/img/2026-04-27-adversarial-conditioning-paradox/roc_curves_TextFooler.png

authors:
  - name: "Khazretgali Sapenov"
    affiliations:
      name: "University of Phoenix"
    email: khazretgali.sapenov@email.phoenix.edu
    url: https://orcid.org/0009-0000-6397-5807

  - name: "Aidos Sapenov"
    affiliations:
      name: "University of Toronto"
    email: aidos.sapenov@mail.utoronto.ca
    url: https://orcid.org/0009-0001-1414-7623
    corresponding: true

bibliography: 2026-04-27-adversarial-conditioning-paradox.bib

toc:
  - name: Introduction
  - name: Background and Related Work
    subsections:
      - name: Adversarial Attacks on NLP
      - name: Detection Methods
      - name: Jacobian Conditioning
  - name: Methods
    subsections:
      - name: Attack Generation
      - name: Conditioning Analysis
      - name: Spectral Conditioning Monitor
  - name: Results
    subsections:
      - name: Layer-wise Analysis
      - name: Attack-specific Patterns
      - name: Detection Performance
      - name: Fine-Tuning Ablation
  - name: Discussion
    subsections:
      - name: Geometric Interpretation
      - name: Implications for Defense
  - name: Conclusion
---

## Introduction

Adversarial attacks on NLP classifiers are optimized against the softmax output. They have no knowledge of a model's internal geometry. Yet across three architecturally distinct attack strategies — word-level with semantic constraints (TextFooler), word-level with fixed dictionary (PWWS), and character-level perturbation (DeepWordBug) — adversarial inputs reliably produce anomalously high Jacobian condition numbers at the final transformer layer of fine-tuned BERT. The signal is absent at Layers 1–9, absent in the unfine-tuned base model, and present only where fine-tuning has imposed a classification boundary.

This is the adversarial conditioning paradox: a geometric signature that could not have been designed in, yet emerges reliably anyway. An attack that knows nothing about the Jacobian reliably produces inputs with anomalously high Jacobian anisotropy at the one layer where the model has learned to make decisions.

## Background and Related Work

### Adversarial Attacks on NLP

Adversarial attacks on text classifiers seek to find inputs that cause misclassification while preserving semantic content. We study three attack families:

**TextFooler** <d-cite key="jin2020bert"></d-cite> uses a greedy search that identifies important words via deletion and replaces them with semantically similar alternatives from a counter-fitted embedding space. The attack explicitly constrains substitutions to maintain sentence similarity.

**PWWS** <d-cite key="ren2019generating"></d-cite> combines word importance ranking with WordNet-based synonym substitution, using probability-weighted saliency to prioritize replacements. Unlike TextFooler, it uses a fixed synonym dictionary rather than embedding-based similarity.

**DeepWordBug** <d-cite key="gao2018black"></d-cite> operates at the character level, introducing typos, character swaps, and insertions. This attack is geometrically distinct from word-level attacks — character edits induce tokenization changes, mapping inputs to different subword tokens and creating a qualitatively different perturbation pathway than direct synonym substitution.

### Detection Methods

Prior work on adversarial detection in NLP includes:
- Perplexity-based methods <d-cite key="mozes2021frequency"></d-cite>
- Frequency-based analysis <d-cite key="pruthi2019combating"></d-cite>
- Certified robustness <d-cite key="jia2019certified"></d-cite>
- Ensemble disagreement approaches

These methods operate on **external properties** of inputs. Our approach differs: we analyze **internal geometric properties** of how the model processes inputs, specifically the conditioning of layer-wise Jacobians.

### Jacobian Conditioning

The condition number κ of a matrix J is defined as:

$$\kappa(J) = \frac{\sigma_{\max}(J)}{\sigma_{\text{low}}(J)}$$

where σ_max is the maximum singular value and σ_low is a stable lower-tail estimate — the 10th percentile of random projection norms — used in place of σ_min, which approaches zero in BERT layers and produces numerically unstable ratios. For the Jacobian of a neural layer, κ captures how uniformly the layer responds to perturbations:
- High κ indicates ill-conditioning: some directions are amplified much more than others
- Low κ indicates well-conditioning: all directions are treated more uniformly

## Methods

### Attack Generation

We generate adversarial examples on the SST-2 sentiment classification task using:
1. **TextFooler**: Word substitution via embedding similarity
2. **PWWS**: WordNet-based synonym replacement
3. **DeepWordBug**: Character-level perturbations

All attacks use default parameters from TextAttack <d-cite key="morris2020textattack"></d-cite> library. We generate 1000 successful adversarial examples per attack type, requiring:
- Successful label flip
- Semantic similarity > 0.8 (for word-level attacks)
- Edit distance < 30 characters (for character-level attacks)

### Conditioning Analysis

For each input, we compute the **prefix Jacobians** J_L = ∂f_L/∂emb ∈ ℝ^(d × T·d), where f_L: ℝ^(T×d) → ℝ^d maps the input embeddings to layer L's CLS token. T is sequence length, d=768 is BERT's hidden dimension. σ_max(J_L) is estimated via JVP+VJP power iteration (5 iterations). σ_low(J_L) is the 10th percentile of ‖J_L^T u‖ over 15 random unit vectors u ∈ ℝ^d — a lower-tail proxy avoiding numerical instability. κ_L = σ_max / σ_low measures input-to-CLS propagation anisotropy at layer L. We compute κ_L for L ∈ {1, 3, 6, 9, 12}. The primary model is `textattack/bert-base-uncased-SST-2` (fine-tuned); the ablation uses `bert-base-uncased` (no fine-tuning) on the same input pairs.

### Spectral Conditioning Monitor

We implement the Spectral Conditioning Monitor (SCM) algorithm for efficient condition number estimation:

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/scm_v3_TextFooler_results.png"
   caption="Figure 2a: SCM algorithm results under TextFooler (N=1,000)." %}

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/scm_v3_PWWS_results.png"
   caption="Figure 2b: SCM algorithm results under PWWS (N=1,000)." %}

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/scm_v3_DeepWordBug_results.png"
   caption="Figure 2c: SCM algorithm results under DeepWordBug (N=1,000)." %}

## Results

### Layer-wise Analysis

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/layer_profile_TextFooler.png"
   caption="Figure 1a: Layer-wise κ profile under TextFooler (N=1,000). Layers 1–9 show no signal; Layer 12 diverges sharply (AUC=0.907, d=1.612)." %}

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/layer_profile_PWWS.png"
   caption="Figure 1b: Layer-wise κ profile under PWWS (N=1,000). Same pattern: null through L9, cliff at L12 (AUC=0.859, d=1.289)." %}

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/layer_profile_DeepWordBug.png"
   caption="Figure 1c: Layer-wise κ profile under DeepWordBug (N=1,000, character-level attack). Pattern identical: AUC=0.847, d=1.234)." %}

| Attack | N | Best Layer | κ_clean | κ_adv | AUC (κ) | AUC (cosine) | Cohen's d | p-value (all ≪10⁻¹⁰⁰) |
|---|---|---|---|---|---|---|---|---|
| TextFooler | 1,000 | **12** | 20.22±9.07 | 38.46±13.19 | **0.907** | 0.464 | 1.612 | ≪10⁻¹⁰⁰ |
| PWWS | 1,000 | **12** | 20.35±9.08 | 34.97±13.22 | **0.859** | 0.550 | 1.289 | ≪10⁻¹⁰⁰ |
| DeepWordBug | 1,000 | **12** | 20.33±9.22 | 32.95±11.15 | **0.847** | 0.582 | 1.234 | ≪10⁻¹⁰⁰ |

### Layer-wise Analysis with Ablation

| Layer | TF (fine-tuned) | TF (base) | TF Δ (fine-tuned − base) | PWWS (fine-tuned) | PWWS (base) | DWB (fine-tuned) | DWB (base) |
|---|---|---|---|---|---|---|---|
| L1  | 0.510 | 0.510 | −0.000 | 0.504 | 0.512 | 0.506 | 0.556 |
| L3  | 0.511 | 0.537 | −0.026 | 0.514 | 0.537 | 0.536 | 0.588 |
| L6  | 0.517 | 0.529 | −0.012 | 0.504 | 0.538 | 0.509 | 0.556 |
| L9  | 0.544 | 0.520 | +0.024 | 0.575 | 0.520 | 0.522 | 0.546 |
| **L12** | **0.907** | 0.517 | **+0.390** | **0.859** | 0.502 | **0.847** | 0.545 |

### Attack-specific Patterns

Different attacks show distinct conditioning signatures:

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/kappa_dist_TextFooler.png"
   caption="Figure 3a: Distribution of κ under TextFooler at Layer 12." %}

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/kappa_dist_PWWS.png"
   caption="Figure 3b: Distribution of κ under PWWS at Layer 12." %}

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/kappa_dist_DeepWordBug.png"
   caption="Figure 3c: Distribution of κ under DeepWordBug at Layer 12." %}

- **TextFooler**: Strongest signal at Layer 12 (AUC = 0.907, d = 1.612)
- **PWWS**: Strong signal at Layer 12 (AUC = 0.859, d = 1.289). Notably, PWWS was statistically null (p = 0.29) under a biased estimator on the base model — making it the sharpest illustration of how estimator and model choice jointly determine signal visibility.
- **DeepWordBug**: Character-level attack still produces strong Layer 12 signal (AUC = 0.847, d = 1.234)

### Detection Performance

ROC analysis shows strong detection capability using Layer 12 conditioning:

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/roc_curves_TextFooler.png"
   caption="Figure 4a: ROC curves for TextFooler detection. Layer 12 κ achieves AUC=0.907 vs cosine AUC=0.464." %}

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/roc_curves_PWWS.png"
   caption="Figure 4b: ROC curves for PWWS detection. Layer 12 κ achieves AUC=0.859 vs cosine AUC=0.550." %}

{% include figure.liquid
   path="assets/img/2026-04-27-adversarial-conditioning-paradox/roc_curves_DeepWordBug.png"
   caption="Figure 4c: ROC curves for DeepWordBug detection. Layer 12 κ achieves AUC=0.847 vs cosine AUC=0.582." %}

Cosine distance between CLS representations is near-random as a detector (AUC = 0.464–0.582), while Jacobian geometry at Layer 12 provides strong detection (AUC = 0.847–0.907).

### Fine-Tuning Ablation

To confirm that the signal reflects task-specific geometry rather than input-text features,
we re-ran Layer 12 conditioning using `bert-base-uncased` (no fine-tuning) on the same
1,000 adversarial pairs per attack.

| Attack | Fine-tuned L12 AUC | Base model L12 AUC | Drop |
|---|---|---|---|
| TextFooler | 0.907 | 0.517 | **−0.390** |
| PWWS | 0.859 | 0.502 | **−0.357** |
| DeepWordBug | 0.847 | 0.545 | **−0.302** |

The base model at Layer 12 is near-random (0.502–0.545) across all three attacks.
Per-pair correlation between fine-tuned Δκ and base model Δκ is r = 0.024 (p = 0.44)
for TextFooler — the two models' Jacobian responses are uncorrelated on the same inputs.

The separation is not attributable to surface text features alone — it emerges from task-specific geometry induced by fine-tuning.

## Discussion

### Geometric Interpretation

Fine-tuning trains BERT to separate sentiment classes. To do this reliably, the optimizer
sharpens the representation geometry at Layer 12 — making the model highly sensitive in
sentiment-discriminative directions while suppressing noise in irrelevant directions.
This selective amplification is exactly what a high condition number captures.

Adversarial attacks are optimized to cross the classification boundary while staying
semantically plausible. They do not target the Jacobian. Yet because they must cross the
boundary, they reliably land in the high-κ region that the boundary creates. The attack
and the geometry are independently optimized, but they interact: the geometry is sharpest
precisely where the attack needs to go.

This explains three properties of the signal simultaneously:
1. **Why it appears only at L12**: that is the only layer where fine-tuning has imposed
   a classification boundary.
2. **Why it disappears in the base model**: no fine-tuning, no boundary geometry,
   no signal.
3. **Why it is attack-agnostic**: three architecturally distinct attacks (word-level
   with semantic constraint, word-level with fixed dictionary, character-level) all
   produce the same effect, because all three must cross the same boundary.

The ordering of effect sizes across attacks (TF > PWWS > DWB) may reflect
*boundary precision*: TextFooler's USE constraint forces substitutions to stay
close to the boundary (σ_max ratio 3.08× relative to clean), PWWS's WordNet dictionary is less
constrained (2.62× relative to clean), and DeepWordBug's character edits have the widest variance
in landing position (2.38× relative to clean).

### Implications for Defense

**Detection:** Monitor Layer 12 κ as a runtime signal alongside every inference.
A rolling percentile baseline on clean traffic provides calibration. Inputs with
κ above the 95th percentile of the clean distribution should be flagged for human
review. This signal requires no knowledge of the attack type — it fires on the
model's geometric response, not on the input's surface form.

**Threat model scope:** This detector is designed for black-box, non-adaptive attackers — the standard TextAttack setting where the attacker optimizes against the classifier output without access to internal geometry. An adaptive attacker with gradient access to the Jacobian monitor could in principle incorporate a κ penalty during attack search. Whether such a constraint is geometrically compatible with crossing the decision boundary is an open question and the subject of the near-term extension noted in the Conclusion.

**Why softmax confidence fails here:** Adversarial attacks are specifically optimized
to produce high-confidence softmax outputs. κ at Layer 12 is independent of softmax
confidence — it measures *how the model arrived at the decision*, not *what decision
it made*.

**CI regression testing:** κ distributions shift when model geometry changes.
Comparing the Layer 12 κ distribution of a new model version against the previous
version on a fixed validation set can detect silent brittleness regressions that
accuracy benchmarks miss.

## Conclusion

We document that adversarial inputs to fine-tuned NLP classifiers exhibit substantially
higher Jacobian condition numbers at Layer 12, with AUC = 0.907 (TextFooler), 0.859 (PWWS),
and 0.847 (DeepWordBug) at N=1,000 each. The signal is absent at Layers 1–9, absent in the
unfine-tuned base model, and present across word-level and character-level attack families.
A fine-tuning ablation confirms the mechanism: removing task training collapses Layer 12 AUC
by 0.30–0.39 points to near-random, with per-pair correlation r = 0.024 between fine-tuned
and base model responses. The geometric signature is created by the training process —
not by the attack — and adversarial inputs land in it because crossing the decision
boundary is unavoidable.

The most tractable near-term extension is whether attacks can be modified to avoid high-κ regions at Layer 12 while still crossing the decision boundary — a constraint that may prove geometrically incompatible.

The code and data for reproducing our experiments are available at https://github.com/sapenov/adversarial-conditioning-paradox.

## Acknowledgments

The authors thank colleagues in the adversarial ML and NLP security communities for feedback on earlier versions of this work.
