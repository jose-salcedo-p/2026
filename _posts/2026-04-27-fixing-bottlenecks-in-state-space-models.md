---
layout: distill
title: "Understanding and Fixing Bottlenecks in State Space Models: What Recency and Over-Smoothing Tell Us"
#description: To be added
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

# Below is an example of injecting additional post-specific styles.
# This is used in the 'Layouts' section of this post.
# If you use this post as a template, delete this _styles block.
_styles: >
  .theorem-box {
    border-left: 4px solid #3b75ff;
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

This expression implies that the influence of the input token at position $s$ on the output at $t$ decreases exponentially as the distance grows. If each transition matrix $A_t$ has diagonal entries less than $1$, then the hidden state is repeatedly multiplied by values smaller than $1$, causing the influence of early inputs to vanish exponentially.

---

### Example: Exponential Decay in a Simple SSM

Consider a simple recurrence:

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

<div class="image-container">
  <img src="assets/img/2026-04-27-fixing-bottlenecks-in-state-space-models/figure1.png" alt="Logarithmic influence scores">
  <figcaption>
    Logarithmic influence scores plotted against relative token distance.  
    The linear decay illustrates the inherent recency bias in SSMs  
    <d-cite key="wang2025understandingmitigatingbottlenecksstate"></d-cite>.
  </figcaption>
</div>

<div class="text-container">
  <p>
    The authors further validate their theory by plotting the logarithm of influence scores
    against the relative distance between tokens. Across a wide range of model sizes,
    Mamba consistently exhibits a linear decay — both at initialization and during training.
  </p>

  <p>
    This pattern shows that the recency behavior is not merely learned from data statistics;
    it reflects an intrinsic architectural bias predicted by the theorem above.
  </p>

  <p>
    Moreover, commonly used initialization schemes amplify this locality bias, causing
    distant tokens to have even less effect on the model’s outputs.
  </p>
</div>

</figure>


## Evidence: SSMs fail on Long-Range Retrieval
