---
layout: distill
title: "Understanding and Fixing Bottlenecks in State Space Models: What Recency and Over-Smoothing Tell Us"
description: This work analyzes how recency bias and hidden-state over-smoothing emerge in modern State Space Models, revealing the bottlenecks that limit their ability to capture long-range dependencies.
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
  - name: Adrita Das
    url: "https://scholar.google.com/citations?user=R6EtfNEAAAAJ"
    affiliations:
      name: Carnegie Mellon University
  - name: Dantong Zhu
    url: "https://scholar.google.com/citations?user=0AA4ZPAAAAAJ"
    affiliations:
      name: Columbia University

# must be the exact same name as your blogpost
bibliography: 2026-04-27-fixing-bottlenecks-in-state-space-models.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: "The Promise of SSMs: Long-Range Memory & Efficiency"
    subsections:
      - name: Matrix Representation of State Space Models
      - name: Selection Mechanisms
        subsections:
          - name: "Mamba-1"
          - name: "Mamba-2"
      - name: Selection as a means of Gating
      - name: Hippo:Long-Range Modeling Claims
  - name: "Reality Check: SSMs are Recency-Biased"
    subsections:
      - name: "Hidden Problem: SSMs are Recency-Biased"
      - name: "Why SSMs forget Long-Range Context?"
      - name: "A natural question arises"
  - name: "Evidence: SSMs fail on Long-Range Retrieval"
  - name: "Challenges to Model Robustness"
  - name: "Depth Scaling and its Limits"
  - name: "Why Deep SSMs Start to Fail: Over-Smoothing"
    subsections:
    - name: "Implication"
  - name: "Fixing Recency and Over-Smoothing in Mamba with State Space Polarization"
    subsections:
    - name: "State Space Polarization"
    - name: "Polarization in Context: Comparison with Alternative Approaches"
    - name: "Complex Parameterizations"

# Below is an example of injecting additional post-specific styles.
# This is used in the 'Layouts' section of this post.
# If you use this post as a template, delete this _styles block.
_styles: >
  .theorem-box {
    border-right: 4px solid #3b75ff;
    background: rgba(59, 117, 255, 0.08);
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    border-radius: 6px;
  }
  .theorem-title {
    font-weight: 600;
    color: #1a4dcc;
    margin-bottom: 0.5rem;
    font-size: 1.02rem;
  }
  figure.side-by-side {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 2rem;
    margin: 2rem 0;
  }
  figure.side-by-side .side-image {
    flex: 0 0 45%;
  }
  figure.side-by-side .side-image img {
    width: 100%;
    border-radius: 6px;
  }
  figure.side-by-side figcaption {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }
  figure.side-by-side .side-text {
    flex: 1;
    font-size: 0.95rem;
    line-height: 1.5;
  }
  @media (max-width: 768px) {
  figure.side-by-side {
    flex-direction: column;
  }
  figure.side-by-side .side-image,
    figure.side-by-side .side-text {
      width: 100%;
    }
  }
  .highlight-block-1 {
    background: linear-gradient(90deg, #fff9d9 0%, #fff 100%);
    padding: 14px 18px;
    border-left: 4px solid #e4c000;
    border-radius: 5px;
    margin: 18px 0;
    font-weight: 500;
  }
  .box-important-yellow {
    background: #fff7c2;
    padding: 14px 18px;
    border-left: 5px solid #f1c40f;
    border-radius: 6px;
    margin: 20px 0;
    font-weight: 400;
  }
  .box-important-purple {
    background: #f7e8ff;          
    padding: 14px 18px;
    border-right: 5px solid #b37bd6; 
    border-radius: 6px;
    margin: 20px 0;
    font-weight: 400;
  }
  .box-important-green {
    background: #e8f7e8;
    padding: 14px 18px;
    border-left: 5px solid #27ae60;
    border-radius: 6px;
    margin: 20px 0;
    font-weight: 400;
  }
---
## The Promise of SSMs: Long-Range Memory & Efficiency
**Structured State Space Sequence Models (S4, DSS, S4D)** represent a modern class of deep learning sequence models that share conceptual similarities with RNNs, CNNs, and classical state space models. In control systems, state-space models (SSMs) represent a system where the relationship between inputs and outputs is defined through state variables (or simply states), with the system's behavior described by first-order differential equations governing these states <d-cite key="xiao2023introductiontransformersnlpperspective"></d-cite>.

These models are motivated by a continuous-time system that maps a one-dimensional input sequence $x(t) \in \mathbb{R}$ to an output sequence $y(t) \in \mathbb{R}$ through an implicit latent state $h(t) \in \mathbb{R}^N$. S4 models are defined by four primary parameters $(\Delta, A, B, C)$, which govern the sequence-to-sequence transformation through two stages.

The first stage involves the **state update**, where the continuous-time hidden state evolves as:

$$
h'(t) = A h(t) + B x(t), \qquad y(t) = C h(t)
$$

In the discretized form of the time-invariant ODE, the hidden state \( h_t \) at each time step is updated as:

$$
h_t = \overline{A} h_{t-1} + \overline{B} x_t
$$

The second stage reformulates the system using a **convolutional form**, where the system's dynamics can be captured by a convolution kernel:

$$
\overline{K} = \left( C \overline{B},\; C \overline{A} \overline{B},\; \dots,\; C \overline{A}^k \overline{B},\; \dots \right)
$$

The output sequence \( y \) is then computed by convolving the input sequence \( x \) with this kernel:

$$
y = x * \overline{K}
$$

This convolutional formulation allows S4 models to efficiently capture long-range dependencies while maintaining computational efficiency through the structured representation of the system's dynamics.

In SSMs, the parameter $A \in \mathbb{R}^{N \times N}$ extracts information from the previous state $h_{t-1}$, while  
$B : \mathbb{R} \to \mathbb{R}^N$ projects input tokens to the hidden space, and  
$C : \mathbb{R}^N \to \mathbb{R}$ decodes the hidden state at time $t$ to produce the final output.  
The scalar parameter $\Delta \in \mathbb{R}$ controls how much information from the new token is fused into the hidden memory.

The first stage converts the continuous parameters $(\Delta, A, B)$ into discrete parameters $(\overline{A}, \overline{B})$ using fixed formulas:


$$
\overline{A} = f_A(\Delta, A), \qquad 
\overline{B} = f_B(\Delta, A, B)
$$

The pair $(f_A, f_B)$ is known as a **discretization rule**.  
A common discretization method is the zero-order hold (ZOH) <d-cite key="10.1093/imamci/dnac005"></d-cite>, defined as:

$$
\overline{A} = \exp(\Delta A), \qquad
\overline{B} = (\Delta A)^{-1}(\exp(\Delta A) - I) \cdot \Delta B
$$<br>

**SSMs with Selection (Mamba).** An effective way to incorporate a selection mechanism in models is to make parameters—such as RNN dynamics or CNN kernels—dependent on the input, allowing adaptive interactions along the sequence. The key difference is making the parameters $\Delta$, $B$, and $C$ input-dependent, with corresponding changes to tensor shapes.

The input-dependent parameters are defined using linear transformations. Specifically, $s_B(x)$ and $s_C(x)$ are linear projections that map the input $x$ to an output space of dimension $N$. For example, we can write $s_B(x) = \mathrm{Linear}_N(x)$ and $s_C(x) = \mathrm{Linear}_N(x)$. 

For the parameter $s_{\Delta}(x)$, a two-step transformation is applied:

$$
s_{\Delta}(x) = \mathrm{Linear}_D(\mathrm{Linear}_1(x))
$$

where the input first passes through an intermediate linear layer before being projected to a $D$-dimensional space.


$s_{\Delta}(x) = \mathrm{Linear}_D(\mathrm{Linear}_1(x))$

where the input first passes through an intermediate linear layer before being projected to a $D$-dimensional space.

To retain data dependencies without sacrificing parallelism, Mamba leverages a hardware-efficient associative scan–based algorithm that enables linear-time training while effectively modeling long-range dependencies. Notably, these parameters now have a length dimension $T$, shifting the model from time-invariant to time-varying.

### Matrix Representation of State Space Models

State Space Models (SSMs) and self-attention based mechanisms, despite their differing implementations, can be unified under a shared theoretical framework. Both classes of models can be interpreted as operating through *structured semiseparable matrices or matrix mixers*, which undergo efficient decompositions and enable long-range sequence modeling. Gu and Dao <d-cite key="dao2024transformersssmsgeneralizedmodels"></d-cite> leveraged this connection to propose the **State Space Duality (SSD)** framework, which formalizes the equivalence between recurrent and global (attention-like) views of sequence transformations.

Mamba-2 establishes a connection between State Space Models (SSMs) and Transformers by demonstrating that certain SSMs can be interpreted as a specific instance of causal linear attention <d-cite key="katharopoulos2020transformersrnnsfastautoregressive"></d-cite>. This equivalence serves as a foundational component of the proposed framework, enabling a reinterpretation of various SSM computations as structured matrix multiplication algorithms. Leveraging this connection, the framework introduces new properties and more efficient algorithms for SSMs.

In simple terms, the way selective SSMs like Mamba process input sequences—by mapping $X \in \mathbb{R}^{T \times D}$ to $Y \in \mathbb{R}^{T \times D}$—can be naturally expressed using a matrix mixer framework. Starting from the initial hidden state $h_0 = B_0 x_0$, the hidden state at each time step $h_t$ is computed recursively as a composition of input projections and recurrent $A$ matrices:

$$
h_t = \sum_{s=0}^t A_{t:s}^\times B_s x_s
$$

The output is then given by

$$
y_t = \sum_{s=0}^t C_t^\top A_{t:s}^\times B_s x_s
$$

where $C_t^\top$ is the time-dependent output projection. Collecting the outputs across all time steps yields the matrix form

$$
y = \mathrm{SSM}(A, B, C)(x) = M(x) \cdot x
$$

where $M$ is the mixer matrix and is represented as

$$
M_{ji} := C_j^\top A_j \cdots A_{i+1} B_i
$$

For scalar SSMs, the matrices $A_t$ reduce to scalars, which can be factored out of the entries:

$$
C_t^\top A_{t:s}^\times B_s = A_{t:s}^\times \cdot (C_t^\top B_s)
$$

### Selection Mechanisms

#### Mamba-1

Mamba makes the discrete parameters in the S4 algorithm vary based on the input:

$$
h_t = s_{\overline{A}}(x_t) h_{t-1} + s_{\overline{B}}(x_t) x_t \\
y_t = s_C(x_t) h_t
$$

The core challenge in sequence modeling lies in compressing context into a smaller state. Attention mechanisms are effective but inefficient, as they avoid compression entirely—requiring storage of the full context (e.g., KV cache), leading to quadratic training and linear inference costs. Recurrent models, while efficient with constant-time inference and linear-time training, struggle with compressing context effectively into a finite state. Static recurrent updates also fail to adapt their hidden state dynamically based on input, while fixed convolution kernels struggle with tasks requiring context awareness.

This tradeoff underscores the need for sequence models to balance efficiency (small states) with effectiveness (context-aware states). A key principle for achieving this is *selectivity*: the ability to focus on relevant inputs while filtering out irrelevant ones during state propagation. The selection mechanism in Mamba makes parameters that influence sequence interactions dependent on the input, modifying the structure to adapt dynamically to context across a sequence.

This mechanism can be compared to the update gate in GRUs, balancing the influence of past hidden states and the current input <d-cite key="de2024griffinmixinggatedlinear"></d-cite>. By selectively retaining or discarding information, it enables the hidden state to reset when necessary—similar to the forget gate in LSTMs—thereby enhancing the model’s ability to manage long-range dependencies efficiently.

#### Mamba-2

In Mamba-2, the SSD (Selective SSM) layer introduces a further simplification by constraining the matrix $A$ to a scaled identity form. That is, all diagonal entries of $A$ are required to be equal at each time step, such that $A_t$ becomes a scalar multiple of the identity matrix. Consequently, $A$ can be compactly represented as a tensor of shape $(T)$, with each element $a_t$ denoting the scalar coefficient at time step $t$. This structural constraint reduces both the number of parameters and the computational overhead, while retaining the expressive power needed for sequence modeling.

Gu and Dao <d-cite key="dao2024transformersssmsgeneralizedmodels"></d-cite> defined a matrix $M$ to encode a sequence-to-sequence transformation mapping where a one-dimensional input vector $x \in \mathbb{R}^T$ is transformed into a one-dimensional output vector $y \in \mathbb{R}^T$ through matrix multiplication $y = Mx$. Here, $T$ denotes the sequence length, and $M = L \circ C B^\top \in \mathbb{R}^{T \times T}$.

To ensure computational efficiency, *structured SSMs* impose specific constraints on the transition matrix $A$. A common and effective structure is to assume $A$ is diagonal <d-cite key="gu2022efficientlymodelinglongsequences,gupta2022diagonalstatespaceseffective,gupta2023simplifyingunderstandingstatespace,smith2023simplifiedstatespacelayers"></d-cite>, in which case only the diagonal entries of each $N \times N$ matrix are stored. This reduces the shape of $A$ to $(T, N)$, significantly lowering both memory and compute requirements, where $T$ is the sequence or time dimension.

Let the input sequence be $Z \in \mathbb{R}^{T \times D}$, where $T$ is the number of tokens and $D$ is the feature (or channel) dimension. The model produces an output $O \in \mathbb{R}^{T \times D}$ while maintaining an internal hidden state of size $H$.

To begin, the model computes three intermediate projections $B, C, V \in \mathbb{R}^{T \times H}$ using functions $g_K$, $g_Q$, and $g_U$, which apply input-dependent transformations. These typically consist of linear projections along the feature dimension, short convolutions across the sequence axis, and nonlinear activations such as Swish <d-cite key="ramachandran2017searchingactivationfunctions"></d-cite>.

These matrices can be interpreted as analogs to the key, query, and value components used in attention <d-cite key="vaswani2023attentionneed"></d-cite>. For each output channel $j$, the model maintains a hidden state vector $s^j_t$ and updates it at each time step via the recurrence:

$$
s^j_t = \alpha_t \cdot s^j_{t-1} + \beta_t \cdot B_t \cdot v^j_t
$$

where $v^j = V_{:,j} \in \mathbb{R}^H$ and $v^j_t = v^j[t]$. Let $B_t = B[t, :]$ and $C_t = C[t, :]$ denote the $t$-th rows of $B$ and $C$, respectively. The output is then computed as:

$$
o^j_t = C_t^\top s^j_t, \quad o^j_t = O[t, j]
$$

In models such as Linear Attention <d-cite key="katharopoulos2020transformersrnnsfastautoregressive"></d-cite>, the coefficients are typically fixed with $\alpha_t = 1$ and $\beta_t = 1$. RetNet <d-cite key="sun2023retentivenetworksuccessortransformer"></d-cite> introduces a learned decay parameter $\gamma$ to modulate the hidden state updates, using $\alpha_t = \gamma$ and $\beta_t = 1$.

Mamba-2 extends this approach by making both coefficients data-dependent through a selectivity matrix $\delta = g_\delta(Z) \in \mathbb{R}^T$, allowing the model to dynamically control the flow of information. Specifically, the coefficients are defined as $\alpha_t = \exp(-\delta_t)$ and $\beta_t = \delta_t$, enabling context-aware adaptation of the update and retention behavior for each token. This gating mechanism dynamically adjusts the balance between information retention and update based on context, enabling the model to prioritize important tokens and effectively capture long-range dependencies.

*Note:* Traditional S4 architectures behave as *linear time-invariant* systems, where the parameters of the state space model remain fixed across the entire sequence. Mamba introduces an important modification called the *selection mechanism*, where the parameters $$(b_t, c_t, \Delta t)$$ become functions of the input. In other words, the model dynamically adjusts how information flows through the state space depending on the current token. 

This mechanism was originally motivated by the *selective copying* task, where the model must retain only relevant tokens while discarding irrelevant ones. By allowing parameters such as $$A_t$$ and $$b_t$$ to adapt based on the input, Mamba introduces a form of content-dependent memory update.

### Selection as a means of Gating

The most important connection is that the classical gating mechanism of RNNs is an instance of the selection mechanism used in SSMs. Originally, gating mechanisms were introduced in recurrent neural networks (RNNs), such as LSTMs and GRUs <d-cite key="chung2014empiricalevaluationgatedrecurrent"></d-cite>, to regulate the flow of information into the hidden state. These mechanisms controlled how signals propagated over time, enabling the model to capture sequential dependencies.

However, the modern interpretation of gating has broadened to encompass any multiplicative interaction, often modulated by an activation function. Formally, the gating function is defined as

$$
g_t = \sigma(\mathrm{Linear}(x_t)),
$$

which governs the hidden state update:

$$
h_t = (1 - g_t) h_{t-1} + g_t x_t.
$$

This formulation enables the input $x_t$ to dynamically control the trade-off between integrating new information and preserving past context through the gating parameter $g_t$. Because $g_t$ is constrained between 0 and 1, the model can suppress irrelevant context when necessary, improving the efficiency of information propagation. This selective updating enhances the model’s ability to extract meaningful dependencies over long sequences while reducing the impact of extraneous information. As a result, gating provides a context-aware alternative to sparsified graph attention, retaining only the most essential dependencies across long-range contexts.

The selection mechanism introduced in Mamba SSMs <d-cite key="gu2024mambalineartimesequencemodeling"></d-cite> functions similarly to the update gate in GRUs, blending the previous hidden state with the current input $x_t$. This allows the model to reset its hidden state and discard outdated information when necessary—akin to the forget gate in LSTMs—while maintaining computational efficiency and long-range modeling capability.

<div class="theorem-box">
However, <span class="theorem-title">Theorem 3.1</span> from <d-cite key="wang2025understandingmitigatingbottlenecksstate"></d-cite> shows that despite incorporating advanced selection mechanisms, SSMs such as Mamba still suffer from a strong recency bias. Moreover, <span class="theorem-title">Theorem 4.2</span> in the same work extends directly to Mamba, indicating that its “selective” state-space updates do not make it more expressive at signal filtering than the classical linear S4 model. In practice, both architectures behave predominantly as low-pass filters. We will examine both theorems in detail in a later section.
</div>


### Hippo:Long-Range Modeling Claims

State Space Models (SSMs) were originally introduced as a principled framework for modeling long-range dependencies in sequential data. Their modern formulation is grounded in the **HiPPO (High-Order Polynomial Projection Operators)** framework introduced by Gu et al. <d-cite key="gu2020hipporecurrentmemoryoptimal"></d-cite>, which shows that a simple first-order ODE can maintain a compressed and continuously updated representation of the entire input history.

HiPPO defines a hidden state $h(t)$ evolving under the linear differential equation:

$$
\frac{d}{dt} h(t) = A\,h(t) + B\,x(t),
$$

where $x(t)$ is the incoming signal and $A$ is the HiPPO matrix that governs memory dynamics. The key insight is that $h(t)$ serves as the coefficients of an *online polynomial projection* of the past signal. Formally, HiPPO computes:

$$
h(t) \approx \arg\min_{y \in \mathrm{Poly}}
\| x_{(-\infty,\, t]} - y \|_{L^2(\omega_t)},
$$

for a time-varying weighting measure $\omega_t$, allowing the model to maintain the best $L^2$ approximation of the input history. This enables efficient long-term memory representation.

The original HiPPO matrix, such as HiPPO-LegS, is dense and upper triangular:

$$
A_{ij} =
\begin{cases}
2i + 1, & i = j, \\
-(2i + 1), & i > j, \\
0, & i < j,
\end{cases}
$$

which is theoretically elegant but computationally expensive for deep learning applications.

Subsequent works <d-cite key="gu2021combiningrecurrentconvolutionalcontinuoustime,gu2022parameterizationinitializationdiagonalstate,gupta2022diagonalstatespaceseffective"></d-cite> provided major simplifications by showing that these dense HiPPO matrices can be approximated using *diagonal* or *diagonal-plus-low-rank* structures:

$$
A \approx D + L,
$$

where $D$ is diagonal and $L$ is low rank. This dramatically improves computational efficiency while preserving the ability to model long-range dependencies.

These insights directly enabled the development of modern SSM-based architectures such as **S4** <d-cite key="gu2022efficientlymodelinglongsequences"></d-cite> and **Mamba** <d-cite key="gu2024mambalineartimesequencemodeling"></d-cite>, which use HiPPO-inspired parameterizations to construct fast, expressive sequence models. By leveraging diagonal or structured versions of the HiPPO matrix, these models achieve scalable and effective context filtering, often outperforming attention-based approaches on tasks requiring long-range memory.

## Reality Check: SSMs are Recency-Biased
### Hidden Problem: SSMs are Recency-Biased

In their paper *Understanding and Mitigating Bottlenecks of State Space Models Through the Lens of Recency and Over-Smoothing* <d-cite key="wang2025understandingmitigatingbottlenecksstate"></d-cite>, the authors argue that although Structured State Space Models (SSMs) have been widely promoted as strong alternatives to Transformers—especially for long-sequence modeling—their behavior is more limited than commonly assumed. They show that SSMs exhibit a pronounced *recency bias*, meaning they rely heavily on the most recent tokens and rapidly lose access to information from farther in the past. According to their experiments, this bias not only weakens long-range recall but also creates potential robustness issues, since local perturbations can disproportionately affect the output.

To investigate whether this limitation can be reduced through scaling, the authors explore deeper SSM architectures. They find that increasing depth does help the model access longer contexts, but only up to a point. Beyond that, deeper SSMs begin to suffer from *over-smoothing*, where token representations become increasingly similar as they propagate through more layers. This causes the model to lose discriminative power, offsetting the benefits of added depth.

Overall, the paper highlights a fundamental trade-off: shallow SSMs tend to forget long-range information due to recency bias, while deeper models become over-smoothed and struggle to maintain meaningful token distinctions.

### Why SSMs forget Long-Range Context?

Although transformers may appear better suited for long-range tasks, the authors show theoretically that an SSM layer is inherently biased toward recent tokens and loses long-term memory exponentially. They also provide empirical validation that SSMs struggle to retrieve information from distant context. Furthermore, they show that strong local bias can negatively impact robustness, since perturbations in recent tokens disproportionately affect the output.

To analyze how information propagates through State Space Models (SSMs) and how these models capture long-range dependencies, the authors examine how the output at time step $t$ depends on an earlier input token at time $s \le t$. They quantify this via the influence score:

$$
\left|\frac{\partial y_t}{\partial x_s}\right|,
$$

which measures the impact of the $s$-th input token on the $t$-th output token. A larger value indicates stronger influence; a smaller value indicates weaker contribution.

The authors present a theorem (Theorem 3.1) demonstrating that State Space Models—including S4 and Mamba—exhibit an inherent **recency bias**. The theorem assumes that the SSM parameters are continuous and differentiable, and that each state transition matrix $A_t$ has diagonal entries strictly between $0$ and $1$, a condition satisfied by many modern SSMs.

Under these assumptions, the influence between two tokens in an SSM decays *exponentially* with their relative distance $(t - s)$. The decay rate is controlled by the largest diagonal entry among the state matrices:

$$
A_{\max} = \max_{t \in [T], n \in [N]} (A_t)_{n,n}.
$$

Formally, let the SSM be parameterized by the sequence
$\{(A_t, b_t, c_t, \Delta_t)\}_{t \in [T]}$, and assume:

1. the input space $X \subset \mathbb{R}^T$ is compact,  
2. the parameters are continuous and continuously differentiable,  
3. each $A_t \in (0,1)^{N \times N}$ is diagonal.

Then for any $x \in X$ and indices $s < t$, the influence score satisfies:

$$
\left|\frac{\partial y_t}{\partial x_s}\right|
= O\!\left(\exp(-\kappa (t - s))\right),
\qquad
\kappa = \Theta\!\left(\log(A_{\max}^{-1})\right).
$$

The expression above implies that the influence of the input token at position $s$ on the output at position $t$ decreases exponentially as the distance between them grows. If the transition matrices $A_t$ are “small” (all entries $< 1$), then the hidden state is repeatedly multiplied by values less than 1. Consequently, the influence of early inputs decays exponentially and is rapidly forgotten.

Consider a simple SSM recurrence:

$$
h_t = 0.8\, h_{t-1} + b x_t, \qquad y_t = c h_t.
$$

Here the transition coefficient is $0.8$. The influence of an early input $x_s$ on the output at time $t$ is:

$$
\frac{\partial y_t}{\partial x_s} \approx 0.8^{\, (t - s)}.
$$

**Example**  
Let $s = 1$. How does $x_1$ influence $y_t$?

$$
\begin{aligned}
t = 2: &\quad 0.8^{1} = 0.8, \\
t = 4: &\quad 0.8^{3} = 0.512, \\
t = 8: &\quad 0.8^{7} \approx 0.21, \\
t = 20: &\quad 0.8^{19} \approx 0.014.
\end{aligned}
$$

Even with a relatively large retention factor (0.8), the influence from early inputs decays to nearly zero after only a few dozen steps—illustrating the inherent recency bias of SSMs.

**Interpretation**  
At $t = 8$, most of the influence is already gone.  
At $t = 20$, the influence of the earlier input is essentially zero.

This matches the exponential decay form:

$$
\exp(-\kappa (t - s)),
$$

where

$$
\kappa = -\log(0.8) \approx 0.22.
$$

<figure class="side-by-side">

  <div class="side-image">
    {% include figure.liquid 
      path="assets/img/2026-04-27-fixing-bottlenecks-in-state-space-models/figure1.png" 
      alt="Logarithmic influence scores" 
      class="img-fluid rounded"
    %}
    <figcaption>
      Figure 1: Logarithmic influence scores plotted against relative token distance.
      The linear decay illustrates the inherent recency bias in SSMs
      <d-cite key="wang2025understandingmitigatingbottlenecksstate"></d-cite>.
    </figcaption>
  </div>

  <div class="side-text">
    <p>
      The authors further validate their theory by plotting the logarithm of 
      influence scores against the relative distance between tokens. Across 
      a wide range of model sizes, Mamba consistently exhibits a linear decay—both 
      at initialization and during training.
    </p>

    <p>
      This pattern shows that the recency behavior is not merely learned from 
      data statistics; it reflects an intrinsic architectural bias predicted 
      by the theorem above.
    </p>

    <p>
      Moreover, commonly used initialization schemes amplify this locality 
      bias, causing distant tokens to have even less effect on the output.
    </p>
  </div>

</figure>

### A natural question arises

**Is the built-in decay of long-range dependencies in SSMs a desirable property, or simply an artifact of the model design that may limit performance in certain settings?**

A key insight from the authors’ analysis is that the way modern State Space Models (SSMs) parameterize their transition matrices $A_t$ has major consequences. By constraining each element of $A_t$ to lie in $(0,1)$, these models enforce a built-in decay of information over time: the influence of past tokens automatically weakens as their distance from the current position increases. This design choice is intentional. Many recent SSM architectures—such as Mamba and its variants—deliberately adopt this parameterization because it provides stable dynamics, efficient long-sequence processing, and controlled memory behavior. This built-in decay serves several purposes:

**Why does the interval $(0,1)$ cause decay?**  
If each entry of the transition matrix $A_t$ lies in the interval $(0,1)$, then the hidden state update

$$
h_t = A_t h_{t-1} + b_t x_t
$$

induces an exponentially vanishing influence from earlier tokens. Repeated application of the recurrence gives

$$
h_t \approx A_t A_{t-1} \cdots A_s \, h_s,
$$

and since multiplying numbers less than $1$ causes the result to shrink, the influence of earlier tokens decays exponentially with their distance.

**Example**  
Consider a simple scalar case where $A_t \approx 0.9$. Then the influence decays as follows:

- After 1 step: $0.9$
- After 5 steps: $0.9^5 = 0.59$
- After 20 steps: $0.9^{20} \approx 0.12$

Thus, as tokens become more distant, their contribution to the model’s hidden state diminishes rapidly.

## Evidence: SSMs fail on Long-Range Retrieval
To assess the ability of SSMs to capture long-context information, the authors evaluate open-source SSM models using the **Needle in a Haystack** benchmark and compare their performance to transformer-based variants.

**Goal** 

Measure how strongly large language models (LLMs) rely on positional cues in context and whether they truly use information presented in the context window (rather than memorized facts). The benchmark embeds a short, intentionally false factual statement into a long document at different positions and tests whether an LLM can retrieve that statement when asked. In simple words: in this benchmark, a short statement is hidden inside the middle of a long document, and the AI model is asked to find and use that information. 

The goal is to test whether the model actually reads and understands the text, rather than relying on information it memorized during training. The hidden statement is designed to look natural but contains a deliberate factual error. This forces the model to depend only on what appears in the document itself. If the model answers correctly, it shows that it truly located and used the information from the text.

To better understand how the model handles long content, the position of the hidden sentence is changed across different experiments. Sometimes it appears near the beginning of the document, sometimes in the middle, and sometimes toward the end. The model’s accuracy at each position is then measured. This process reveals whether the model has a positional bias — for example, whether it pays more attention to the start of a document than to the end. 

Strong performance across all positions indicates that the model can effectively use long-range context. Authors show that **Mistral-7B** (Transformer-based), performs consistently no matter where the hidden sentence appears in the document. This means it can pay attention to information at the beginning, middle, or end equally well. Further, authors point out that **Mamba-Codestral-7B** (based on State Space Models / SSMs) behaves differently. It performs better when the hidden sentence is closer to the end of the document and worse when the sentence appears near the beginning. 

**This pattern shows that the SSM-based model has a positional bias, meaning it naturally focuses more on recent or nearby tokens rather than information that appeared far earlier in the text. In other words, it *remembers* newer information more strongly than older information.** 

The figure <d-fig key="figure2">2</d-fig> below compares how two different types of language models retrieve information from very long documents.

{% include figure.liquid 
    path="assets/img/2026-04-27-fixing-bottlenecks-in-state-space-models/figure2.png"
    alt="Influence heatmaps"
    caption="Figure 2: Results from Needle in a Haystack Experiment <d-cite key='wang2025understandingmitigatingbottlenecksstate'></d-cite>."
    key="figure2"
%}

The left heatmap represents an SSM-based model (Mamba-Codestral-7B). Warmer colors (red/orange) indicate lower accuracy, while greener colors indicate higher accuracy. A clear pattern appears: when the hidden sentence is placed near the beginning of the document, the model performs poorly. As the sentence moves closer to the end of the document, the model becomes much more accurate. This shows that the SSM model is biased toward recent information and struggles to recall content from far earlier in the text.

The right heatmap represents a Transformer-based model (Mistral-7B). Unlike the SSM model, the colors remain mostly uniform across the entire heatmap. This means the model’s accuracy stays consistent no matter where the hidden sentence is placed. In other words, the Transformer does not show a strong positional bias and can retrieve information equally well from the beginning, middle, or end of the document.

## Challenges to Model Robustness

The authors also investigated potential robustness issues arising from recency bias in State Space Models (SSMs) by evaluating them on an image classification task designed in an unconventional sequence-based setting. Instead of treating images like 2D grids, they flattened each image into a long sequence of pixel values—like turning a picture into a long list of numbers. This allows them to use sequence models (which are usually used for text or time-series data) to process images. They tested several popular SSM-based models such as H3, RWKV, and Mamba, and compared their performance with a Transformer model (the standard architecture used in models like GPT). To make these models work for classification, they added a special learnable *class token* at the very end of the pixel sequence. This token acts like a summary of everything the model has seen. After the model processes the full sequence, it looks at the final state of this class token and passes it through a classifier head to produce the final prediction (for example, deciding which CIFAR-10 class the image belongs to).

The goal of this experiment is to check whether State Space Models (SSMs) are more sensitive to noise at the end of a sequence than at the beginning. The authors took images from the CIFAR-10 dataset and converted each image into a sequence of 1,024 tokens (by flattening the pixels). Then, they deliberately added random noise to different parts of the sequence to see how much the model’s accuracy dropped. The authors evaluate positional sensitivity by introducing controlled corruption to different regions of the input sequence.

**Trailing corruption** involves adding random noise to the last segment of the sequence, located near the appended class token, while **leading corruption** involves perturbing the initial segment of the sequence.

The experimental setup is summarized as follows:

- Two corruption levels are evaluated: a mild setting with 32 out of 1024 tokens corrupted, and a more aggressive setting with 96 out of 1024 tokens corrupted.
- Random noise is injected into either the leading (beginning) or trailing (end) segments of the input sequence.
- These experiments are designed to measure whether the models depend more strongly on information located near the end of the sequence than at the beginning.

<div class="box-important-yellow">
These results demonstrate that state space models (SSMs) such as H3, RWKV, and Mamba exhibit a strong recency bias, relying heavily on the most recent tokens in the input sequence. In contrast, transformer-based models show more balanced sensitivity to perturbations across the full sequence.
</div>
<div class="box-important-purple">
The experiments show that corrupting the trailing tokens harms State Space Models (SSMs) much more than corrupting the leading tokens, revealing a strong recency bias. Mamba exhibits the most extreme behavior: corrupting the last 32 of 1024 tokens causes an 81.24% accuracy drop, while corrupting the first 32 tokens reduces accuracy by only 2.30%. In contrast, Transformers are less sensitive to trailing corruption and appear to rely more on early-sequence information, consistent with prior findings.
</div>

<div class="box-important-green">
Targeted attacks reveal a serious weakness in State Space Models (SSMs). When the last part of an input sequence is replaced with tokens from a target class, SSMs are easily fooled into misclassifying the input. This happens because these models rely heavily on recent tokens. In contrast, Transformer models are more robust and are not disproportionately affected by attacks on the end of the sequence.
</div>


## Depth Scaling and its Limits

State Space Models (SSMs), including Mamba, exhibit exponentially decaying dependencies with respect to token distance, effectively behaving as localized operators with finite receptive fields, analogous to convolutional and graph-based architectures. To study whether architectural depth compensates for this locality, models were pretrained under varying context lengths (2048 and 8192 tokens) and depths (16–72 layers). The results indicate that increasing depth improves performance under longer context settings, suggesting an expansion of the effective receptive field. 

However, these gains saturate beyond intermediate depths (approximately 32–48 layers), after which further increases lead to deteriorating performance, as evidenced by rising validation perplexity. Short-context models exhibit sharper degradation at high depth, whereas long-context models demonstrate greater tolerance to deeper architectures. Overall, these findings suggest that increased depth partially alleviates, but does not eliminate, the limitations imposed by the inherently local dynamics of SSMs.

## Why Deep SSMs Start to Fail: Over-Smoothing

The paper further investigates the depth-scaling limitations of State Space Models (SSMs) by analyzing the evolution of hidden states and token features across layers. A central finding is that deep SSMs exhibit over-smoothing, a phenomenon where token embeddings become increasingly similar and lose discriminative power. The analysis begins with the continuous-time S4 model, which is formulated as a linear dynamical system governed by ordinary differential equations. Using the known equivalence between S4 and convolutional operators <d-cite key="gu2021combiningrecurrentconvolutionalcontinuoustime"></d-cite>, the authors show that S4 behaves as a low-pass filter in the frequency domain when the system matrix has negative diagonal entries. This implies that high-frequency (sharp, local) signal components are systematically attenuated at each layer, independent of how the parameters are trained.

The degree of over-smoothing is shown to depend on both context length and the smallest state transition coefficients. Longer contexts require more steps for information to mix across positions, while transition parameters approaching one cause the model to behave like a uniform averaging operator over the sequence. This aligns with an intuitive interpretation of SSMs as performing a form of running average over token embeddings.

Theorem 4.2 shows that the **maximum distance between hidden states across the sequence is bounded**:

$$
\max_{t,s} \|h_t - h_s\|_{\infty}
\le
\left(1 - A_{\min}^{T-1}\right)
\max_{t,s} \|b_t(x_t) - b_s(x_s)\|_{\infty}
$$

where $$A_{\min} = \min_{t,n} (A_t)_{n,n}$$ denotes the smallest diagonal entry of the state transition matrices.

**What This Bound Means?** The inequality indicates that the **differences between hidden states shrink over time**. Even if the encoded inputs $$b_t(x_t)$$ vary significantly across tokens, the recurrent update repeatedly multiplies the hidden state by transition matrices whose entries are bounded by one. As a result, the dynamics become *contractive*, gradually reducing discrepancies between memory states across the sequence.

Consequently, token representations tend to become increasingly similar as the sequence is processed, and the hidden state behaves like a **smoothed representation of the input sequence**.

**Connection to Context Length** The rate at which these discrepancies decay depends on two factors: the context length $$T$$ and the minimal transition coefficient $$A_{\min}$$. From a message-passing perspective, information from earlier tokens must propagate sequentially through the recurrence before influencing later positions. As the sequence length grows, more steps are required for the representations to mix across the entire sequence. 

When $$A_{\min}$$ approaches $$1$$, the recurrence behaves almost like a uniform averaging operator over the sequence. In this regime, the hidden state update resembles 

$$
h_t \approx A h_{t-1} +b_t(x_t), \quad A \approx 1
$$ 

which is mathematically equivalent to a *running average* over the encoded token representations. Such averaging suppresses high-frequency variations in the signal and produces a smoothing effect across the sequence.

### Implication
This observation provides an intuitive explanation for the over-smoothing phenomenon in deep SSMs. As the recurrence repeatedly mixes representations across time steps, token embeddings gradually become more similar, causing the hidden feature space to lose discriminative structure. In extreme cases, the model behaves like a low-pass filter that retains coarse global trends while discarding fine-grained token-level information.

Theoretical analysis suggests that selection mechanism does not fully eliminate the structural limitations of SSMs. In particular, the recency bias established in Theorem 3.1 still applies even when the transition parameters depend on the input. Similarly, Theorem 4.2 indicates that selective SSMs may still exhibit over-smoothing behavior, implying that their signal filtering properties remain similar to those of linear S4 (Proposition 4.1). That said, selection can partially alleviate these issues by dynamically adjusting the transition coefficients. From the theoretical perspective, the mechanism can push the upper bound $$A_{\max}$$ closer to $$1$$ and the lower bound $$A_{\min}$$ closer to $$0$$, effectively widening the range of memory timescales that the model can represent. Nevertheless, the transition matrix $$A$$ is typically initialized with negative values, which encourages rapid decay and can further reinforce the recency bias predicted by Theorem 3.1.

**Intuition Behind Theorem 4.2 (Over-Smoothing in SSMs): A simple way to understand the over-smoothing effect in SSMs is to view each layer as a contractive update. If the recurrent coefficient satisfies $A_t \leq 1$, then differences between hidden states shrink over time. For example, when $A_t = 0.9$ and the input sequence is short, even inputs that differ significantly (e.g., by 2 units) produce hidden states whose differences are tightly bounded (e.g., $\approx 0.54$). As the sequence length increases, this contraction becomes stronger, forcing token representations to become increasingly similar. This explains why stacking many SSM layers causes the model to behave like a running low-pass filter, progressively removing high-frequency (sharp) features and leading to over-smoothing.**

**The authors provide empirical validation using a 1.4B-parameter Mamba model. They quantify representation sharpness via pairwise distances between token embeddings and observe that sharpness consistently decreases across layers. Compared with Transformers of comparable size, SSMs exhibit a much faster decay of feature diversity, although Transformers are also theoretically susceptible to over-smoothing.**

<figure class="side-by-side">

  <div class="side-image">
    {% include figure.liquid 
      path="assets/img/2026-04-27-fixing-bottlenecks-in-state-space-models/figure3.png" 
      alt="Cumulative distribution" 
      class="img-fluid rounded"
    %}
    <figcaption>
      Figure 3: Cumulative distribution of $(A_{\max} - A_{\min})$ across channels.  
      More than 60\% of channels lie below $0.5$, indicating limited diversity in memory decay rates <d-cite key="wang2025understandingmitigatingbottlenecksstate"></d-cite>.
    </figcaption>
  </div>

  <div class="side-text">
    <p>When examining how each channel in Mamba’s state transition behaves, the authors study the two
extremal values $A_{\max}$ and $A_{\min}$ that characterize the strongest and weakest memory
retention for each channel. Ideally, a healthy state space model should display a wide spread of
behaviors: some channels with $A_{\max} \approx 1$ for preserving long-range information, others
with $A_{\min} \approx 0$ for reacting sharply to new inputs, and many intermediate channels
forming a rich spectrum in between.</p> 
    <p>However, the cumulative histogram in Figure 3
reveals the opposite. More than <strong>60% of channels satisfy</strong> $A_{\max} - A_{\min} < 0.5$,
meaning their effective memory range is highly compressed. This narrow distribution indicates that
most channels behave similarly, rather than specializing into long-memory and short-memory roles.
As a consequence, if $A_t$ drifts toward small values, the model exhibits rapid forgetting and
strong recency bias; if $A_t$ stays large, the hidden state barely updates, leading to
over-smoothing. The model therefore struggles to naturally produce the desired mix of <strong>fast</strong>
and <strong>slow</strong> memory channels, explaining why these failure modes arise so consistently in practice.
    </p>
  </div>

</figure>

## Fixing Recency and Over-Smoothing in Mamba with State Space Polarization
### State Space Polarization
To improve the memory behavior of Mamba, the authors introduce *polarization*, where one
dimension of $A_t$ is fixed to $1$ and another to $0$, with the remaining channels learned normally.
The zero-polarized channel resets at every step and therefore focuses purely on the current token,
helping prevent over-smoothing in deeper stacks. The one-polarized channel never decays and thus
retains the full sequence history, ensuring a stable long-term memory path. In implementation, the first state channel is set to $$(A_t)_{1,1} = 1$$ and the last to $$(A_t)_{N,N} = 0$$.
This guarantees that the model always has both a global and local memory pathway,
regardless of training dynamics.

The associative recall experiments show that the default $A_t$ struggles with long
contexts and even degrades with depth. Adding a 1-polarized channel significantly boosts recall
accuracy, while a 0-polarized channel helps deeper models avoid over-smoothing.
Using both polarized channels together, especially in deeper configurations, yields the strongest
overall performance.

**Eigenvalue Interpretation of State Space Polarization** A useful way to understand the proposed polarization mechanism is through the eigenvalues of the state-transition operator. In a state space model, the hidden state evolves according to

$$
h_t = A_t h_{t-1} + b_t(x_t).
$$

The matrix (or vector in diagonal form) $A_t$ determines how information from previous time steps propagates forward. In linear dynamical systems, the *eigenvalues* of the transition operator control the stability and memory of the system. If an eigenvalue satisfies $\lvert \lambda \rvert < 1$, the corresponding state component decays exponentially over time. Conversely, if $\lvert \lambda \rvert = 1$, that component persists indefinitely.

In Mamba, the transition coefficient is parameterized as

$$
A_t = \exp(\Delta t\, A),
$$

where $A$ is a learnable vector. Because the exponential preserves positivity, each entry of $A_t$ can be interpreted as the effective eigenvalue controlling the decay rate of a particular memory channel.

The polarization mechanism explicitly fixes two extreme eigenvalue regimes.
This is implemented by inserting constant values into the pre-exponential
parameter $$A$$:

$$
A \leftarrow
\begin{bmatrix}
0 \\[2pt]
A \\[2pt]
-1000
\end{bmatrix},
\qquad
A_t =
\exp(\Delta t A)
\approx
\begin{bmatrix}
1 \\[2pt]
\exp(\Delta t A) \\[2pt]
0
\end{bmatrix}.
$$

The first channel corresponds to the eigenvalue

$$
\lambda = \exp(0) = 1,
$$

which creates a **non-decaying mode**. The associated eigenvector
therefore defines a direction in the hidden state space that perfectly
preserves information across time steps. This acts as a dedicated
*long-term memory pathway*.

The last channel corresponds to

$$
\lambda = \exp(-1000) \approx 0,
$$

which forces the state component to vanish almost immediately after each
update. The associated eigenvector therefore behaves as a **resetting
mode**, capturing only short-lived information from the current input.

From this perspective, state space polarization explicitly anchors the
spectrum of the transition operator at two extremes: a unit eigenvalue that
preserves global context and a near-zero eigenvalue that enforces rapid
forgetting. The remaining channels retain their learned dynamics, allowing
the model to interpolate between short- and long-term memory behaviors.

**Ablation Variants** To isolate the effect of each polarized mode, two ablations are considered:

- **0-polarized Mamba:** only the resetting channel ($$\lambda \approx 0$$) is introduced.
- **1-polarized Mamba:** only the persistent channel ($$\lambda = 1$$) is introduced.

These variants allow us to examine how explicitly controlling the spectral
extremes of the transition operator influences the model's memory dynamics.

### Polarization in Context: Comparison with Alternative Approaches

**Low-Pass Filtering in Continuous S4.**

An important property of structured state space models emerges from the
continuous-time formulation of S4. Consider an S4 model with parameters
$$(A,b,c)$$, where the transition matrix $$A$$ is diagonal with strictly
negative eigenvalues. In this case, the output of the system can be written as

$$
y(t) = \int c^{\top}\exp(A(t-s))\,b\,x(s)\,ds .
$$

As shown in **Proposition 4.1** by the authors, this operator behaves as a
*low-pass filter*. Intuitively, the matrix exponential
$$\exp(A(t-s))$$ decays exponentially because the eigenvalues of $$A$$
are negative. Consequently, contributions from earlier inputs diminish
over time, and higher-frequency components of the signal are gradually
suppressed.

When multiple S4 layers are stacked, this filtering effect compounds
across layers. While this behavior stabilizes the dynamics, it can
also attenuate important high-frequency features, leading to
representation collapse or *over-smoothing* in deeper architectures.

**Connection to HiPPO Theory** The theoretical foundation of modern SSM architectures originates from
the HiPPO framework introduced by <d-cite key="gu2020hipporecurrentmemoryoptimal"></d-cite>. HiPPO formulates
sequence modeling as an online signal reconstruction problem. Given a
signal $$x$$, the goal is to approximate its history up to time $$t$$
by minimizing

$$
\|x_{\le t} - y^{(t)}\|_{L^2(\omega^{(t)})},
$$

where $$\omega^{(t)}$$ is a weighting measure supported on
$$(-\infty,t]$$. The optimal approximation projects the past signal
onto a set of basis functions, producing a coefficient vector
$$h(t)$$ that summarizes the history of the signal.

Gu et al.\ showed that these coefficients evolve according to a linear
state-space system

$$
h'(t) = A(t)h(t) + b(t)x(t),
$$

which provides a principled bridge between continuous-time signal
approximation and state-space sequence modeling. When the weighting
measure is chosen as

$$
\omega^{(t)} = I[0,t]/t,
$$

the resulting dynamics admit a closed-form solution

$$
A(t) = -\frac{A_{\text{hippo}}}{t}
$$

**Practical Deviations from HiPPO** Although HiPPO provides the theoretical foundation for SSMs, modern
architectures such as S4 and Mamba implement several practical
modifications. In particular, the HiPPO matrix is often used only for
initialization, while the explicit $$1/t$$ scaling in the dynamics is
removed during training.

This modification effectively changes the underlying weighting measure  
to an exponentially decaying form,

$$
\omega^{(t)}(s) \propto \exp(s-t)\,\mathbf{1}_{s \lt t}
$$

which emphasizes more recent inputs when reconstructing the signal
history. As a result, practical SSM implementations tend to favor
recent information more strongly than the original HiPPO formulation.

Furthermore, several implementations simplify the spectral structure
of the transition matrix by omitting the unitary transformations
associated with $$A_{\text{hippo}}$$. While these simplifications
improve computational efficiency, they can also accentuate smoothing
behavior in the learned dynamics.

**Relation to State Space Polarization** These observations highlight a broader challenge in SSM design:
standard parameterizations may implicitly behave as smoothing
operators, gradually attenuating long-range information. This
motivates mechanisms that explicitly regulate the memory dynamics
of state-space layers.

Polarization provides a simple structural intervention. By fixing
specific spectral modes of the transition matrix, polarization
guarantees the existence of both persistent and rapidly-decaying
memory channels. One channel preserves long-range information,
while another focuses on local updates.

In contrast to conventional SSM parameterizations—where the spectrum
of the transition matrix may drift toward overly smooth dynamics—
polarization ensures that both global memory pathways and
short-term feature extraction remain simultaneously available
throughout the network.

### Complex Parameterizations

While most modern SSM implementations use real-valued parameters,
earlier works explored complex-valued parameterizations of the transition
matrix $$A_t$$. Complex eigenvalues can introduce oscillatory dynamics,
which in principle allow richer temporal representations.

However, theoretical analysis shows that the fundamental limitations
identified earlier still persist. Both the locality behavior described in
Theorem 3.1 and the low-pass filtering property of Proposition 4.1 remain
valid even when complex-valued transition matrices are used. Therefore,
introducing complex parameters alone does not remove the inherent
recency bias or smoothing effects present in state space models.


