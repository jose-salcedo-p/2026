---
layout: distill
title: The Value of Probabilistic Circuits for Uncertainty Quantification
description: Deep learning models struggle with epistemic uncertainty
  quantification, often exhibiting blind confidence on out-of-distribution data.
  This work reviews on Probabilistic Circuits (PCs) as a unifying framework for
  rigorous, tractable reasoning. Unlike standard neural networks, PCs model 
  the joint probability distribution. By enforcing structural 
  constraints—specifically smoothness, decomposability, and determinism they 
  allow for the exact computation of marginals, conditionals, and moments in 
  polynomial time. We discuss on the suitability of PCs for Uncertainty 
  Quantification, describing their advantages and highlighting their 
  drawbacks. We review several recent architectural design, building on or 
  incorporating PCs for tractable UQ in high-dimensional problems.
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
  - name: Maternus Herold
    url: ""
    affiliations:
      name: BMW Group, appliedAI Institute for Europe & University of the Bundeswehr Munich
  - name: Konstantin von Gaisberg
    url: ""
    affiliations:
      name: BMW Group, Karlsruhe Institute of Technology

# must be the exact same name as your blogpost
bibliography: 2026-04-27-value-of-probabilistic-circuits-for-uncertainty-quantification.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Epistemic Uncertainty in Today's Machine Learning
  - name: The Grammar of Tractability
  - name: Connecting Probabilistic Circuits to Uncertainty Quantification
  - name: Scaling Circuit Architectures to High Dimensions
  - name: Applications of Probabilistic Circuits for UQ
    subsections:
      - name: Probabilistic Flow Circuits
      - name: Multi-Token Prediction with Probabilistic Circuits
      - name: Physics-Driven Deep Latent Variable Models
      - name: SPN-Guided Latent Space Manipulation
  - name: A Personal Note

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

<!-- todo: Write the blog post as specified. -->
<!-- todo: calibration of PCs? -->

## Epistemic Uncertainty in Today's Machine Learning

The trajectory of artificial intelligence over the last decade has been defined
by a relentless pursuit of predictive accuracy, driven largely by the scaling of
deep neural networks. From Large Language Models (LLMs) to generative diffusion
systems, the capacity of these models to approximate complex functions is
undeniable. However, as these systems migrate from controlled academic
benchmarks to high-stakes deployment in healthcare, autonomous navigation, and
climate modeling, a critical deficiency has emerged: the inability to reliably
quantify what the model does not know.

Standard deep learning architectures, despite their expressiveness, often suffer
from ''blind confidence''. They act as black-box function approximators that map
inputs to outputs without maintaining a rigorous representation of the
underlying joint probability distribution. Consequently, when presented with
out-of-distribution (OOD) data—such as a rare physiological anomaly in a patient
or an unprecedented weather pattern—these models frequently yield predictions
with confusingly high confidence. This phenomenon represents a crisis of
epistemic uncertainty quantification (UQ).

Uncertainty is generally categorized into two distinct forms: aleatoric
uncertainty, which is irreducible and stems from the inherent stochasticity of
the data generation process (e.g., sensor noise), and epistemic uncertainty,
which is reducible and arises from a lack of knowledge about the model
parameters or the true structure of the data<d-cite
key="kimpton_challenges_2025"></d-cite>. In the context of scientific
engineering and safety-critical AI, distinguishing between these two is
paramount. A self-driving car must distinguish between the ''noise'' of a rainy
sensor (aleatoric) and an object it has never been trained to recognize
(epistemic).   

While methods such as Bayesian Neural Networks (BNNs) and Monte Carlo (MC)
Dropout have attempted to retrofit uncertainty estimates onto deep networks,
they often rely on approximate inference techniques that introduce their own
variance and computational overhead<d-cite
key="ventola_probabilistic_2023"></d-cite>. They provide approximations of the
posterior, not exact evaluations.   

This report posits that Probabilistic Circuits (PCs) offer a transformative
solution to this epistemic crisis. Unlike standard neural networks, PCs are
designed not merely to predict, but to represent the joint probability
distribution of the data as a computational graph. Crucially, they do so while
guaranteeing tractability. Through strict structural properties—smoothness,
decomposability, and determinism—PCs enable the exact computation of marginals,
conditionals, and moments in polynomial time<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023"></d-cite>. This capability
fundamentally alters the UQ landscape, moving from approximate guesses of
uncertainty to rigorous, mathematically guaranteed derivations.   

The following analysis provides an exhaustive review of the PC framework as it
stands in the 2024-2026 era. It explores the theoretical mechanics that enable
tractability, the architectural revolutions (such as Einsum Networks and
Inception PCs) that have allowed PCs to scale to high-dimensional data, and
their application to complex inverse problems in physics and engineering. It
argues that PCs are no longer just a theoretical curiosity but a necessary
component of the next generation of trustworthy AI.

## The Grammar of Tractability

To understand the unique value of Probabilistic Circuits for UQ, one must first
appreciate the ''grammar'' of their construction. A PC is not simply a neural
network with probabilistic outputs; it is a Directed Acyclic Graph (DAG) that
encodes a probability distribution function (PDF) or probability mass function
(PMF) through a hierarchy of specific computational units<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023"></d-cite>.

### The Computational Graph

At the fundamental level, a PC represents a joint distribution $P(\mathbf{X})$
over a set of random variables $\mathbf{X}$. The graph is composed of three
primary types of nodes, each serving a distinct probabilistic function:Input
Units (Leaves): These are the building blocks of the circuit, representing
simple, tractable univariate distributions over a single variable or a small
subset of variables. Common choices include Gaussian distributions for
continuous data, Bernoulli or Categorical distributions for discrete data, or
even piecewise polynomials. **Sum Units** ($\oplus$): These nodes compute a
weighted sum of their children's outputs. In the probabilistic interpretation, a
sum node represents a mixture model<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023"></d-cite>. It introduces a
latent variable $Z$ that selects which branch of the mixture is active, thereby
allowing the circuit to model multimodality and complex dependencies. **Product
Units** ($\otimes$): These nodes compute the product of their children's
outputs. Probabilistically, product nodes represent factorizations, encoding
independence assumptions between subsets of variables<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023"></d-cite>. The value
computed at the root of the PC for a given input configuration $\mathbf{x}$
corresponds to the (possibly unnormalized) probability density $P(\mathbf{x})$.

### Structural Constraints for Tractability

The distinguishing feature of PCs is the imposition of structural constraints on
the graph topology. In generic graphical models like Bayesian Networks or Markov
Random Fields, inference is often #P-hard, requiring exponential time in the
worst case. PCs circumvent this by enforcing properties that ensure integrals
and maximizations commute with the sum and product operations.

The tractability of different probabilistic queries relies on the structural
properties of the PC, as summarized in the table below<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023,sidheekh_building_2024,zhang_restructuring_2025"></d-cite>: 

| Structural Property | Enabled Probabilistic Query | Mathematical Operation | UQ Application |
| :--- | :--- | :---: | :--- |
| **Smoothness** | Evidence (EVI) | $P(e)$ | Anomaly Detection, OOD Detection |
| **Decomposability** | Marginals (MAR) | $\int P(x_{\text{obs}}, x_{\text{miss}}) \, dx_{\text{miss}}$ | Missing Data Imputation, Partial Evidence |
| **Smoothness + Decomposability** | Conditionals (CON) | $P(q \mid e) = \frac{P(q,e)}{P(e)}$ | Counterfactuals, Conditional Forecasting |
| **Determinism** | MAP Inference | $\underset{x}{\mathrm{argmax}} \, P(x)$ | Image Reconstruction, Most Likely Explanation |
| **Structured Decomposability** | Circuit Multiplication | $P(x) \cdot Q(x)$ | KL Divergence, Bayesian Updating, Ensemble Merging |

#### Smoothness

A sum node is defined as smooth (or complete) if all of its children define
distributions over the exact same set of variables, known as the scope<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023,sidheekh_building_2024"></d-cite>.

The significance of smoothness for UQ cannot be overstated. It ensures that the
sum node represents a valid mixture distribution where the weights sum to unity
(or a normalizing constant). If a sum node were non-smooth—meaning one child
covered variables $\{X_1, X_2\}$ and another covered only $\{X_1\}$—the
resulting function would not integrate to a consistent value, as the missing
variable $X_2$ in the second branch is unaccounted for. Smoothness guarantees
that when we perform marginalization (integrating out a variable), the integral
distributes linearly over the sum. This property is what allows PCs to handle
missing data naturally: the probability mass of the missing variables integrates
to 1 in every branch of a smooth sum node, effectively vanishing from the
computation without disrupting the validity of the distribution over the
observed variables<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023"></d-cite>.

#### Decomposability

A product node is decomposable if its children define distributions over
disjoint sets of variables<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023,sidheekh_building_2024"></d-cite>.

Decomposability is the structural encoding of conditional independence. It
allows high-dimensional integrals to break down into products of
lower-dimensional integrals. Mathematically, if a function $f(\mathbf{x})$
decomposes into $g(\mathbf{y})h(\mathbf{z})$ where $\mathbf{y}$ and $\mathbf{z}$
are disjoint, then the integral $\int f(\mathbf{x}) d\mathbf{x} = (\int
g(\mathbf{y}) d\mathbf{y}) (\int h(\mathbf{z}) d\mathbf{z})$. Without
decomposability, the integral would require evaluating the full high-dimensional
joint space, which is computationally intractable. This property ensures that
marginal inference in a PC is linear in the size of the circuit, providing a
distinct advantage over Normalizing Flows or VAEs where marginals are often
intractable<d-cite key="martires_probabilistic_2024"></d-cite>.

#### Determinism

A sum node is deterministic if, for any complete input configuration, at most
one of its children evaluates to a non-zero value<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023"></d-cite>.

While smoothness and decomposability are sufficient for marginal inference,
determinism unlocks tractable Maximum A Posteriori (MAP) inference. The MAP
query asks for the most probable configuration of variables given evidence:
$\text{argmax}_{\mathbf{x}} P(\mathbf{x} | \mathbf{e})$. In general, maximizing
a sum of functions (a mixture) is hard because the mode could lie anywhere
between the modes of the components. However, if the sum is deterministic, only
one component is non-zero for any $\mathbf{x}$. Consequently, the maximum of the
sum becomes the maximum of the non-zero component: $\max \sum f_i(\mathbf{x}) =
\sum \max f_i(\mathbf{x})$. This allows the $\max$ operator to push down through
sum nodes just as integrals push down through smooth sum nodes. This property is
critical for tasks like image inpainting or finding the most likely explanation
for a medical diagnosis.

### Structured Decomposability and V-trees

Recent research has emphasized a more rigorous constraint known as structured
decomposability. A PC is structured-decomposable if the decomposition of
variables at every product node follows a hierarchical tree structure over the
variables, known as a vtree<d-cite key="zhang_restructuring_2025"></d-cite>.   

A vtree is a static binary tree where leaves correspond to random variables. A
structured PC respects this vtree if every product node in the circuit
corresponds to a node in the vtree, partitioning the variables exactly as the
vtree does. This property is profound because it enables operations beyond
simple inference, such as the efficient multiplication of two circuits. If two
PCs respect the same vtree, their product (which represents the product of their
densities) remains a structured PC. This algebra of circuits allows for
computing KL divergences, merging expert models, and performing Bayesian updates
in polynomial time<d-cite key="choi_probabilistic_,zhang_restructuring_2025"></d-cite>.

## Connecting Probabilistic Circuits to Uncertainty Quantification

The theoretical properties of PCs translate directly into capabilities that
solve fundamental challenges in Uncertainty Quantification. While deep learning
models often struggle to distinguish between low-probability events and model
errors, PCs provide exact probabilistic metrics.

### Arbitrary Conditioning

The ability to compute exact conditional probabilities $P(\mathbf{Q} \mid
\mathbf{E})$ for any disjoint subsets of query variables $\mathbf{Q}$ and
evidence variables $\mathbf{E}$ is perhaps the most significant operational
advantage of PCs.

In standard deep learning, UQ is typically tied to a specific prediction task. A
model is trained to predict $Y$ given $X$. If the user suddenly needs to know
the probability of a specific input feature $X_1$ given the output $Y$ (an
inverse query), the model cannot provide it without retraining or complex
inversion techniques. PCs, by modeling the full joint distribution, are agnostic
to the direction of inference.

This capability is particularly vital for handling missing data. In real-world
scientific engineering, sensor failure is common. When a standard neural network
encounters missing inputs, it usually requires imputation—guessing the missing
values—before processing. This imputation introduces a point estimate that
ignores the uncertainty of the missing value. A PC, conversely, handles missing
data by integrating out the missing variables analytically<d-cite
key="choi_probabilistic_,peharz_probabilistic_2023,sidheekh_building_2024"></d-cite>.
The resulting marginal distribution over the observed variables reflects the
true uncertainty: the probability density becomes ''flatter'' or more diffuse,
accurately capturing the loss of information. This is not an approximation; it
is the mathematically correct derivation of belief given partial evidence.

### Tractable Dropout Inference 

Recent work has bridged the gap between the popular UQ technique of Monte Carlo
(MC) Dropout and the rigorous world of PCs. MC Dropout estimates uncertainty in
neural networks by randomly dropping units during inference and measuring the
variance of the predictions. While effective, it is computationally expensive
(requiring multiple forward passes) and yields only an empirical approximation.

Researchers have introduced Tractable Dropout Inference (TDI) for PCs<d-cite
key="ventola_probabilistic_2023"></d-cite>. Because PCs track the propagation of
moments exactly, it is possible to derive the analytical moments of the output
distribution under the dropout noise model in a single forward pass. Instead of
sampling dropout masks, TDI propagates the first and second moments (mean and
variance) through the sum and product nodes.   

Mechanism: For a sum node, the mean is the weighted sum of children's means. The
variance computation involves the variances of children plus a term accounting
for the variance of the gating weights themselves (if they are stochastic). For
product nodes, due to independence (decomposability), the mean is the product of
means, and the variance follows standard variance-of-product rules.

Implication: This allows PCs to provide ''dropout-based'' uncertainty estimates
that are theoretically sound and computationally efficient, eliminating the
sampling noise inherent in standard MC Dropout. This technique has been shown to
significantly improve the robustness of PCs to distribution shifts and OOD
data<d-cite key="ventola_probabilistic_2023"></d-cite>.

### Sequential Uncertainty in Time Series 

In temporal domains, uncertainty accumulates over time. A forecasting model
should become less confident the further it predicts into the future. Standard
Recurrent Neural Networks (RNNs) often fail to capture this diverging
uncertainty.

Integrating PCs with recurrent architectures, such as in Recurrent Conditional
Whittle Networks (RECOWN), provides a mechanism to quantify this temporal
uncertainty<d-cite key="thoma_recowns_2021"></d-cite>. These models use a PC
(specifically a Conditional Whittle SPN) to model the distribution of the
spectral coefficients of the time series.   

Log-Likelihood Ratio Score (LLRS): This integration allows for the computation
of the LLRS, a dynamic uncertainty metric. When the model encounters a sequence
that deviates from the learned temporal dynamics—such as a sudden frequency
shift in power grid data—the conditional likelihood computed by the PC drops
sharply. This score allows operators to distinguish between a ''hard to
predict'' stochastic sequence (high aleatoric uncertainty) and a ''structurally
novel'' sequence (high epistemic uncertainty), enabling trustworthy anomaly
detection in time-series data<d-cite key="thoma_recowns_2021"></d-cite>.   

## Scaling Circuit Architectures to High Dimensions

For years, a primary criticism of PCs was their inability to scale. While they
offered exact inference, they struggled to model the complex, high-dimensional
dependencies inherent in image or natural language data, an area where Deep
Neural Networks (DNNs) excelled. The dominant narrative suggested a rigid
trade-off: one could have tractability (PCs) or expressiveness (DNNs), but not
both. Research in 2024 and 2025 has largely dismantled this dichotomy through
architectural innovations that allow PCs to scale massively<d-cite
key="peharz_einsum_2020,peharz_probabilistic_2023,liu_scaling_,zhang_scaling_2025"></d-cite>.

### Scaling via Vectorization

The traditional implementation of PCs involved sparse, irregular graph
structures that were essentially pointer-chasing operations. This is efficient
on CPUs for small models but catastrophic for modern GPUs, which rely on dense
matrix multiplications and coherent memory access.

Einsum Networks (EiNets) represent a paradigm shift in PC implementation<d-cite
key="peharz_einsum_2020,peharz_probabilistic_2023"></d-cite>. The core insight of
EiNets is to reformulate the execution of sum and product layers using the
Einstein summation (einsum) convention, a standard operation in tensor algebra
libraries like PyTorch and TensorFlow.   

Mechanism: Instead of processing nodes individually, EiNets organize nodes into
layers. A ''product layer'' can be viewed as a mixing operation that can be
computed via element-wise multiplication and reshaping of large tensors. A ''sum
layer'' becomes a tensor contraction (matrix multiplication).

Impact: By combining these monolithic tensor operations, EiNets allow PCs to
utilize the massive parallelism of GPUs. This vectorization enables the training
of PCs with millions of parameters and hundreds of layers, achieving density
estimation performance on benchmarks like ImageNet that rivals intractable deep
generative models<d-cite key="liu_scaling_"></d-cite>.

### Scaling via Sparse Monarch Metrics 

While EiNets solved the computation speed, parameter efficiency remained a
challenge. Fully dense sum layers imply that every latent component connects to
every child, leading to quadratic parameter growth.

Recent work has introduced Monarch Matrices to parameterize the sum blocks in
PCs<d-cite key="zhang_scaling_2025"></d-cite>. Monarch matrices are a class of
structured sparse matrices that are highly expressive (capable of representing
permutations and Fast Fourier Transforms) yet computationally efficient.   

Monarch Parameterization: By replacing dense weight matrices in sum layers with
products of sparse Monarch factors, researchers have reduced the memory and
computation footprint of PCs significantly.

Result: This approach has enabled ''unprecedented scaling'', allowing PCs to
achieve state-of-the-art generative modeling performance on challenging
benchmarks like Text8 and ImageNet 32x32, demonstrating superior scaling laws
(better performance for fewer FLOPs) compared to traditional dense
parameterizations<d-cite key="zhang_scaling_2025"></d-cite>.

### Restructuring of Fitted Circuits 

A historical limitation of PCs was ''structure lock-in''. Once a PC was trained
with a specific vtree (variable decomposition), it was difficult to perform
operations with other circuits having different structures.

New algorithms for restructuring PCs have emerged<d-cite
key="zhang_restructuring_2025"></d-cite>. These algorithms allow a
structured-decomposable PC to be transformed into a new PC that respects a
target vtree while representing the same distribution.   

Algorithm: The restructuring process involves converting the original PC into an
equivalent Bayesian Network with latent variables, identifying the conditional
independencies required by the target vtree, and then recursively constructing
the new circuit layers.

Benefit: This breakthrough allows for dynamic inference optimization. A large,
complex PC trained for high expressiveness can be ''compiled'' or restructured
into a shallower, optimized circuit for faster inference on edge devices. It
also enables the multiplication of circuits with different structures, which is
essential for ensemble methods where different models might learn different
structural dependencies<d-cite key="zhang_restructuring_2025"></d-cite>.

## Applications of Probabilistic Circuits for UQ

The frontier of PC research is no longer about replacing neural networks but
integrating with them. The concept of Probabilistic Neural Circuits (PNCs) has
emerged, blending the learnable features of deep learning with the tractable
reasoning of circuits<d-cite key="martires_probabilistic_2024"></d-cite>.

### Probabilistic Flow Circuits 

Another hybrid approach combines PCs with Normalizing Flows (NFs)<d-cite
key="sidheekh_probabilistic_2023a"></d-cite>. NFs are excellent at modeling
continuous local correlations but struggle with global structure and
marginalization. PCs excel at global structure (via mixture models) and
marginalization but can be inefficient at capturing local continuous
correlations (requiring many mixture components).

Probabilistic Flow Circuits (PFCs) integrate NFs at the leaf nodes of a PC
- Structure: The leaves of the PC are no longer simple Gaussians but flexible, invertible flow transformations (e.g., linear rational splines).
- Tractability Constraint: To preserve the decomposability of the PC, the flows
  must be applied carefully. Recent theoretical work established conditions
  (like $\tau$-decomposability) ensuring that the flow transformations do not
  entangle variables in a way that breaks the circuit's marginalization
  guarantees<d-cite key="sidheekh_building_2024"></d-cite>.
- Synergy: This architecture allows the PC to handle the multimodal, discrete structure of the data (e.g., different object categories in an image) while the flow leaves handle the continuous manifold of pixel variations within each category.

### Multi-Token Prediction with Probabilistic Circuits 

Perhaps the most high-impact application of PCs in 2025 involves their
integration into the training and inference of Large Language Models (LLMs),
specifically in the domain of Multi-Token Prediction (MTP).

LLMs are autoregressive, that is, they predict the next token $x_{t+1}$ given
the history $x_{1:t}$. To generate a sequence of length $L$, the model must run
$L$ forward passes. This is memory-bandwidth bound and slow.Speculative Decoding
attempts to speed this up by using a small "draft" model to predict a chunk of
$K$ tokens, which are then verified in parallel by the large model. However,
most draft models assume independence between the $K$ predicted tokens (e.g.,
predicting them all in parallel), which sacrifices accuracy (expressiveness) for
speed (latency).

Multi-Token Prediction with Probabilistic Circuits (MTPC) proposes a framework
using a PC to model the joint distribution of the next $K$ tokens: $P(x_{t+1},
\dots, x_{t+K} | x_{1:t})$<d-cite key="grivas_fast_2025"></d-cite>. Why PCs? PCs
can model the complex dependencies between the future tokens (e.g., if $x_{t+1}$
is ''San'', $x_{t+2}$ is likely ''Francisco'') tractably. Unlike a full
Transformer which would be too slow as a drafter, a PC can evaluate the
likelihood of candidate sequences extremely fast.

The MTPC framework explores a spectrum of PC architectures for this task:
- Fully Factorized (FF): Assumes independence (baseline). Fast but low
acceptance rate.
- Canonical Polyadic (CP): Introduces latent variables to capture shared context
but keeps structure shallow.
- Hidden Markov Models (HMM): A deeper PC structure that models sequential
dependencies via latent state transitions.
- Binary Tree Factorizations (BTree): A hierarchical structure that
balances the depth and width, allowing for capturing long-range dependencies
among the $K$ tokens efficiently.

Experiments retrofitting EvaByte, a byte-level LLM, with MTPC demonstrated
significant gains<d-cite key="grivas_fast_2025"></d-cite>.
- Throughput: MTPC increased generation throughput by $5.47\times$ compared to
standard autoregressive generation.
- Comparison: It achieved a $1.22\times$ speedup over MTP with independence
assumptions.
- Insight: The PC draft model was accurate enough to have its speculative drafts
accepted by the verifier model much more often than the independent drafter.
This proves that PCs can capture the local correlations of language/bytes
efficiently enough to serve as a real-time accelerator for foundation models.

### Physics-Driven Deep Latent Variable Models

Beyond pure AI tasks, PCs are revolutionizing scientific engineering,
particularly in solving inverse problems. An inverse problem involves inferring
the causal parameters $\theta$ that gave rise to an observation $\mathbf{y}$.
These problems are often ''ill-posed'', meaning multiple different parameter
sets could produce the same observation (one-to-many mapping).

Standard regression models fail at ill-posed inverse problems because they try
to predict a single $\hat{\theta}$ for a given $\mathbf{y}$, leading to an
average of the valid solutions (which is often invalid).
- The PC Approach: PDDLVMs and related PC-based approaches model the full joint
distribution $P(\theta, \mathbf{y})$<d-cite
key="vadeboncoeur_fully_2023"></d-cite>.
- Inference: To solve the inverse problem, the model queries the
conditional distribution $P(\theta | \mathbf{y})$. Because the PC models the
joint density, this conditional is multimodal, capturing all valid
solutions.
- Mechanism: These models often use variational inference where the prior and
likelihoods are parameterized by PCs or PC-like structures (e.g., variational
neural processes). By assigning probability measures to the spatial domain, they
treat collocation grids as random variables, allowing for resolution-independent
modeling of Partial Differential Equations (PDEs).

A concrete application is the design of bi-stealth metamaterials (materials
invisible to both radar and infrared)<d-cite
key="liu_fast_2024,ma_probabilistic_2019"></d-cite>.
- Problem: Engineers want a material with a specific electromagnetic spectrum
(Target $\mathbf{y}$). They need to find the physical geometry (Design
$\mathbf{x}$) that produces it.
- One-to-Many: Many different geometries might
yield the same spectrum. Deterministic inverse networks fail here.
- PC Solution: A PC-based generative model learns $P(\mathbf{x}, \mathbf{y})$
from simulation data. Given a target spectrum $\mathbf{y}^*$, the engineer
samples from $P(\mathbf{x} | \mathbf{y}^*)$.
- Outcome: This approach successfully identified multiple valid bi-stealth
designs (e.g., utilizing ITO films) that satisfied the dual-band stealth
requirements, providing engineers with a ''library'' of valid candidates rather
than a single, possibly unmanufacturable, point estimate<d-cite
key="liu_fast_2024"></d-cite>.

Integrating physical laws into PCs is a growing frontier. Unlike
Physics-Informed Neural Networks (PINNs) which enforce physics via soft penalty
terms in the loss function ($Loss = DataLoss + \lambda \cdot PhysicsResidual$),
PCs can enforce constraints structurally.

- Constraint Enforcement: Logic-constrained PCs can enforce that certain impossible configurations have zero probability.
- Energy Conservation: In Hamiltonian dynamics, PCs can be designed to respect conservation of energy by structuring the latent variables to represent conserved quantities.
- P-Bits and Ising Machines: At the hardware level, ''Probabilistic Bits''
(P-bits) are being used to build hardware-native probabilistic circuits<d-cite
key="rockovich_improved_2025"></d-cite>. These circuits naturally solve
optimization problems (like the Ising model ground state) by fluctuating
thermally. PCs provide the theoretical framework to program these stochastic
hardware elements to solve inverse problems in statistical physics.

### SPN-Guided Latent Space Manipulation

In medical AI, ''explainability'' is a safety requirement. A clinician needs to
know why a model diagnosed a tumor. A powerful explanation technique is the
counterfactual: ''What would this scan look like if the patient were healthy?''

SPN-Guided Latent Space Manipulation utilizes PCs to generate these explanations
rigorously<d-cite key="siekiera_counterfactual_2025"></d-cite>.
- Method: A Variational Autoencoder (VAE) is trained to compress medical images
into a latent space $\mathbf{z}$. Instead of assuming a simple Gaussian prior,
an SPN is trained to learn the true, complex distribution of latent vectors
$P_{SPN}(\mathbf{z} | \text{Class})$. 
- Counterfactual Generation: To generate a
counterfactual for a "Sick" patient, the model optimizes a new latent vector
$\mathbf{z}_{cf}$ such that it maximizes the SPN's likelihood for the "Healthy"
class: $\text{argmax}_{\mathbf{z}} P_{SPN}(\text{Healthy} | \mathbf{z})$.
- Constraint Satisfaction: The SPN ensures the new vector lies in the
high-density region of "Healthy" patients. This prevents the generation of
"adversarial" or "hallucinated" images that look healthy to the classifier but
are anatomically impossible. Experiments on the CheXpert dataset showed that
this method produces anatomically plausible alterations (e.g., removing
specific lung opacities) that are far more stable than baseline DNN methods.

## A Personal Note 

To fully contextualize the value of PCs, we must contrast them with the dominant
deep generative paradigms: Variational Autoencoders (VAEs), Normalizing Flows
(NFs), and Diffusion Models.

| Feature | Probabilistic Circuits (PCs) | Variational Autoencoders (VAEs) | Normalizing Flows (NFs) | Diffusion Models |
| :--- | :--- | :--- | :--- | :--- |
| **Likelihood Evaluation** | Exact (Linear time) | Approximate (ELBO lower bound) | Exact (Linear time\*) | Intractable (requires ODE solver) |
| **Marginalization** | Exact & Tractable | Intractable | Intractable (unless autoregressive) | Intractable |
| **Conditioning** | Exact & Arbitrary | Requires retraining | Difficult | Requires classifier guidance |
| **Sampling Speed** | Fast (Single pass) | Fast (Single pass) | Fast (Inverse flow) | Slow (Iterative denoising) |
| **Representation** | Explicit Graph | Latent Variable NN | Invertible NN | Stochastic Differential Eq. |
| **Primary Weakness** | Structural constraints limit expressiveness | Blurry samples, posterior collapse | Topology constraints, Jacobian cost | High computational cost |

NFs provide exact likelihoods via the change-of-variables formula. However,
calculating the determinant of the Jacobian is computationally expensive
($O(D^3)$) unless the flow is restricted (e.g., to triangular matrices)<d-cite
key="wehenkel_unconstrained_2021,papamakarios_normalizing_2021"></d-cite>. The
- Marginalization Gap: Crucially, NFs cannot easily compute marginals.
Integrating a flow over a subset of variables is analytically intractable. This
makes NFs poor at handling missing data or partial evidence. PCs, with their
decomposability property, handle marginals natively in linear time. This is a
decisive advantage for UQ in real-world messy data.

Diffusion models currently hold the crown for generation quality (e.g., Stable
Diffusion, Sora). However, their probabilistic semantics are opaque. They do not
provide an exact likelihood value, making OOD detection difficult.
- Guidance vs. Structure: To condition a diffusion model (e.g., "generate a
dog"), one typically uses classifier guidance, which is an approximation. PCs
enable exact conditioning.
- Hybrid Synergy: This has led to the emergence of PC-Guided Diffusion. In this
setup, a PC is trained to represent the constraints or the valid configuration
space. During the iterative denoising process of the diffusion model, the PC
provides an exact gradient of the constraint probability $\nabla_{\mathbf{x}}
\log P_{PC}(\text{Constraint} | \mathbf{x})$, steering the diffusion process
toward valid regions.37 This combines the high-fidelity texture generation of
diffusion with the logical rigor of PCs<d-cite key="liu_image_2024"></d-cite>.

<!-- todo: future challanges / trajeectories -->
