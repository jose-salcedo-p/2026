---
layout: distill
title: From Trajectories to Operators — A Unified Flow Map Perspective on Generative Modeling
description:  In this post, we reframe continuous-time generative modeling from integrating trajectories to learning two-time operators (flow maps). This operator view unifies diffusion, flow matching, and consistency models, and suggests a practical diagnostic — semigroup-consistent jumps yield both step-robust generation and low compositional drift. We derive Eulerian/Lagrangian distillation objectives and use inpainting experiments to show why semigroup-consistent jumps can be both step-robust and composition-stable.
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
#  - name: Albert Einstein
#    url: "https://en.wikipedia.org/wiki/Albert_Einstein"
#    affiliations:
#      name: IAS, Princeton
#  - name: Boris Podolsky
#    url: "https://en.wikipedia.org/wiki/Boris_Podolsky"
#    affiliations:
#      name: IAS, Princeton
#  - name: Nathan Rosen
#    url: "https://en.wikipedia.org/wiki/Nathan_Rosen"
#    affiliations:
#      name: IAS, Princeton

# must be the exact same name as your blogpost
bibliography: 2026-04-27-flow-map-learning.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: 1. Background and Motivation
  - name: 2. The Flow Map Paradigm
  - name: 3. Training Two-Time Operators via Eulerian and Lagrangian Distillation
  - name: 4. Experiments
  - name: 5. Conclusion


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
  .box-note {
        font-size: 18px;
        padding: 15px 15px 10px 10px;
        margin: 2px 2px 2px 5px;
        border-left: 7px solid #1976d2;
        border-radius: 1px;
    }
    d-article .box-note {
        background-color: #f5f9ff;
        border-left-color: #1976d2;
    }
---

## 1. Background and Motivation

The landscape of continuous-time generative modeling has largely crystallized into three dominant lineages, each defining a specific relationship between a complex data distribution and a simple prior.


*   **Score-based Diffusion (SDEs) <d-cite key="song2019generative,song2020score"></d-cite>:** Models learn the score function $\nabla_x \log p_t(x)$ to reverse a stochastic diffusion process. Sampling requires simulating a reverse-time SDE or its deterministic probability-flow ODE:
  
    $$
    \frac{dx}{dt} = f(x, t) - \frac{g^2(t)}{2}\,s_{\theta}(x_t, t).
    $$
    
*   **Flow Matching (CNFs) / Rectified flow <d-cite key="lipman2022flow,liu2022flow"></d-cite>:** Instead of deriving dynamics from a forward diffusion, Flow Matching directly regresses a velocity field $v_\theta(x,t)$ that pushes a Gaussian source probability path toward the data target:
  
    $$
    \frac{dx}{dt} = v_\theta(x,t).
    $$

*   **Consistency Models (CMs) <d-cite key="song2023consistency"></d-cite>:** Aiming for speed, CMs attempt to bypass integration entirely by learning a map $f_\theta$ that projects any point on a trajectory directly to its origin ($t=0$):
  
    $$
    f_\theta(x_t,t) \approx x_0 \implies f_\theta(x_t,t) = f_\theta(x_{t'}, t').
    $$


While these methods have achieved remarkable success, they face a dichotomy between **flexibility** and **efficiency**. 

Integration-based methods (Diffusion, Flow Matching) are flexible but computationally expensive, requiring dozens or hundreds of sequential function evaluations (NFEs) to traverse the trajectory. Conversely, distillation methods like Consistency Models are fast (1-2 steps) but structurally **rigid**: they typically memorize the mapping to a fixed endpoint ($s=0$). This "schedule lock-in" makes them brittle under guidance, editing, or varying step counts, as the model lacks knowledge of the intermediate geometry of the flow.

To achieve **fast**, **few-step**, and **highly controlled** generation, we need a primitive that is richer than a single-point mapping but faster than numerical integration.



## 2. The Flow Map Paradigm

Sampling from modern generative models is traditionally viewed as "following a trajectory": starting from noise and iteratively integrating a velocity field. We propose a shift in perspective: what if the fundamental object of learning is not the infinitesimal velocity, but the **finite-time transformation** itself?

We define the **Flow Map** as the family of two-time solution operators $\Phi_{t\to s}$ that answers the question:

<div class="box-note" markdown="1">
**The Operator Question:**  If the system is currently at state $x_t$ at time $t$, exactly where will it be at time $s$?
</div>




### 2.1. From trajectories to operators

Consider a time-dependent vector field $v_{\phi}(x, t)$ defining the ODE: $$dx/dt = v_{\phi}(x, t)$$. While the vector field describes **local** motion, the flow map $$\Phi_{t\to s}: \mathbb{R}^d \to \mathbb{R}^d$$ describes the **global** transport. It is characterized by the integral equation:

$$
x_s = \Phi_{t\to s}(x_t) \triangleq x_t + \int_{t}^{s} v_{\phi}(x_{\tau},\tau) d\tau, \qquad 0 \le s \le t \le 1.\tag{2.1}\label{eq:21}
$$

The **Flow Map Paradigm** reframes generative modeling from an **integration problem** to a **function approximation problem**. Instead of solving the integral at inference time, we train a neural network $f_\theta(x_t, t, s)$ to approximate the operator directly:

$$
f_\theta(x_t, t, s) \approx \Phi_{t\to s}(x_t).
$$

A mathematically valid flow map must satisfy two intrinsic algebraic properties, which serve as the "physics" of the operator:

1.  **Identity:** $\Phi_{t\to t}(x) = x$.
2.  **Semigroup (Composition) Property:** For any intermediate time $u$,
    
    $$
    \Phi_{u\to s} \circ \Phi_{t\to u} = \Phi_{t\to s}.
    $$


### 2.2. Unifying Existing Methods

The Flow Map formulation provides a generalized coordinate system for understanding recent acceleration techniques. As illustrated in Figure 1, we can interpret existing models as restricting the flow map $f_\theta(x, t, s)$ to specific subsets of the time domain $(t, s)$.

{% include figure.liquid
   path="assets/img/2026-04-27-flow-map-learning/flow_map_vs_four_paradigms_clean.png"
   class="img-fluid"
   caption="Figure 1. Flow maps as a unifying operator view."
%}

*   **Consistency Models (CM) are Boundary Operators:**
    CMs restrict the target time to the data manifold ($s=0$). They learn the slice:

    $$ f_\theta^{\text{CM}}(x_t, t) \equiv f_\theta(x_t, t, 0). $$
    
    **Limitation:** Because they ignore $s > 0$, they cannot support iterative refinement or arbitrary start-stop editing.

*   **Flow Matching (FM) is the Infinitesimal Limit:**
    FM learns the velocity field $v_\phi$, which is the derivative of the flow map as $s \to t$:

    $$ v_\phi(x,t) = \lim_{s\to t} \frac{f_\theta(x, t, s) - x}{s-t}. $$
    
    **Limitation:** Recovering finite jumps requires expensive numerical integration.

*   **MeanFlow is a Linearized Operator:**
    MeanFlow <d-cite key="geng2025mean"></d-cite> parameterizes the map using an average velocity $u_\theta$:

    $$ f_\theta(x, t, s) = x + (s-t)u_\theta(x, t, s). $$

    where 

    $$
    u_{\theta}(x_t,t,s) \approx \frac{1}{s-t}\,\int_{t}^{s} v_\theta(x_\tau,\tau)\,d\tau.
    $$

    
    This enforces a linear inductive bias on the trajectory between $t$ and $s$.

*   **Consistency Trajectory Models (CTM) are Discrete Compositions:**
    CTM <d-cite key="kim2023consistency"></d-cite> enforces the composition property on a discrete grid of time steps, acting as a discretized surrogate of the full flow map algebra:

    $$ f_\theta(f_\theta(x, t_2, t_1), t_1, t_0) \approx f_\theta(x, t_2, t_0). $$




### 2.3. Why Operators? Speed, Control, and Composability


By lifting the abstraction from **trajectories** to **operators**, we gain distinct advantages:

1.  **Amortization of Integration (Speed):**
    We trade the cost of repeated integration during training for $O(1)$ inference. A jump from $t=1$ to $t=0$ becomes a single function call, yet unlike Consistency Models, we retain the ability to stop at any $s$.

2.  **Decoupling Physics from Discretization (Control):**
    Trajectory-based samplers entangle the ODE dynamics with the solver's step size. With a flow map, the "desired jump" $(t, s)$ is an explicit input. This makes the model robust to changing step counts and enables non-uniform schedules tailored to specific editing tasks.

3.  **Algebraic Consistency:**
    Complex pipelines (e.g., SDEdit, in-painting) often require jumping back and forth in time. A flow map trained with composition constraints ensures that $x_t \to x_s \to x_u$ yields a valid state, preventing the accumulation of drift errors common in heuristic distillations.



## 3. Training Two-Time Operators via Eulerian and Lagrangian Distillation


We have defined the object of interest: a neural operator $f_\theta(x_t, t, s)$ approximating the true solution $\Phi_{t\to s}$ of a teacher velocity field $v_\phi$. The challenge is training this operator efficiently without running expensive ODE solvers in the loop.


We can derive training objectives by analyzing the partial derivatives of the flow map $\Phi_{t\to s}$ with respect to its two time arguments. These lead to two complementary "distillation" paradigms.



### 3.1. The Lagrangian View: Moving the Endpoint

Fix the start state $x_t$ at time $t$. As we vary the target time $s$, the output $x_s$ traces a trajectory of the teacher ODE. This is the **Lagrangian** perspective (following the particle).

**The Identity <d-cite key="boffi2025flow"></d-cite>:**
Differentiation w.r.t. $s$ yields:

$$
\boxed{\ \frac{\partial}{\partial s} \Phi_{t\to s}(x_t) = v_\phi(\Phi_{t\to s}(x_t), s) \ }
$$

**Intuition:** As the target time $s$ advances, the value of the map changes according to the teacher's velocity at the current location.

**Lagrangian Distillation (LMD) <d-cite key="sabour2025align"></d-cite>:**
Directly matching this derivative gives us a training objective. In practice, we use a robust "predict-then-correct" discretization. We predict a jump to an intermediate time $s'$, and then ensure that taking one Euler step from $s'$ leads to the same result as predicting $s$ directly.

Let $s' = s + \varepsilon (t-s)$. A discrete loss is:

$$
\mathcal{L}_{\mathrm{LMD}} = \mathbb{E}_{t,s} \left[ \left\| f_\theta(x_t, t, s) - \underbrace{\left( f_{\theta^-}(x_t, t, s') + (s-s') v_\phi(f_{\theta^-}(x_t, t, s'), s') \right)}_{\text{1-step Teacher correction}} \right\|^2 \right].
$$

Here, $f_{\theta^-}$ is a target network (EMA). This effectively trains the student to match the teacher's *future* velocity.


### 3.2. The Eulerian View: Moving the Start

Alternatively, fix the target time $s$ and the spatial coordinate $x$, but vary the start time $t$. This describes how the solution operator itself evolves and leads to the **Eulerian** perspective (observing the flow at a fixed point).

**The Identity <d-cite key="boffi2025flow"></d-cite>:**
The composition law implies a transport PDE (the Kolmogorov Backward Equation):

$$
\boxed{\ \frac{\partial}{\partial t} \Phi_{t\to s}(x) + J_x \Phi_{t\to s}(x) \, v_\phi(x, t) = 0 \ }
$$

**Intuition:** If we perturb the start time $t$ (move it slightly toward $s$), we must compensate by moving the input $x$ along the flow $v_\phi$ by that same amount, such that the final destination $s$ remains unchanged.

**Eulerian Distillation (EMD) <d-cite key="sabour2025align"></d-cite>:**
This identity enforces **consistency under transport**. A discrete approximation involves taking a small teacher step from $t$ to $t'$ and demanding that the flow map from $t'$ yields the same result.

Let $t' = t + \varepsilon (s-t)$. We first compute $x_{t'} = x_t + (t'-t)v_\phi(x_t, t)$. The loss is:

$$
\mathcal{L}_{\mathrm{EMD}} = \mathbb{E}_{t,s} \left[ \left\| f_\theta(x_t, t, s) - f_{\theta^-}(x_{t'}, t', s) \right\|^2 \right].
$$

This is the core mechanism behind Consistency Models, but generalized here for arbitrary target times $s$.


### 3.3. Synthesis: A Unified Objective

The Lagrangian and Eulerian views provide orthogonal supervision signals:

*   **Lagrangian (LMD)** stabilizes the **destination**: it ensures the map outputs valid states along the ODE trajectory.
*   **Eulerian (EMD)** stabilizes the **path**: it ensures the map is invariant to the choice of starting time along the flow.

Combining these allows for training flow maps that are both locally accurate (matching the vector field) and globally consistent (respecting composition). By learning the full operator $\Phi_{t\to s}$, we obtain a generative model that offers the speed of distilled models without sacrificing the flexibility of differential equations.


## 4. Experiments



In the previous sections, we proposed a shift from **trajectory integration** (solving an SDE/ODE step-by-step) to **operator learning** (predicting the jump $\Phi_{t\to s}$ directly). This theoretical reframing leads to two verifiable hypotheses regarding the behavior of generative models:

1.  **Robustness to Discretization:** If a model learns the finite-time operator directly, its generation quality should be decoupled from the inference step count (NFEs), unlike solvers that rely on infinitesimal approximations.
2.  **Algebraic Consistency (Semigroup Property):** a genuine flow map should approximately satisfy the semigroup law $$\Phi_{u\to s} \circ \Phi_{t\to u} \approx \Phi_{t\to s}$$, so chaining multiple jumps should induce **small drift** compared to a direct jump. 


To validate these claims without repeating ourselves, we use **two experiments under a shared inpainting setup**:

* **Exp-I (Step sensitivity, Sec 4.3) :** Compare integration-based samplers (SDE/ODE) vs jump-distilled samplers (CM-like / Flow-like) under different NFEs. This answers **why jumps help at low steps.**

* **Exp-II (Composition drift, Sec 4.4) :** Compare **direct** $$\Phi_{t\to s}$$ vs **composed** $$\Phi_{u_{k-1}\to s}\circ\cdots\circ\Phi_{t\to u_1}$$ for different hop counts $k$. This answers **why two-time operators are more stable than endpoint-anchored jumps in multi-hop pipelines.**


### 4.1. Shared experimental setup (common to both experiments)

**Task: image inpainting.** Given an image $$x\in\mathbb{R}^{H\times W}$$ and a binary mask $$m\in\{0,1\}^{H\times W}$$, the goal is to fill the masked region $\Omega$ (where $$\Omega=\{(i,j) \mid m_{ij}=1\}$$) in a way consistent with the context and text prompt. This is a good stress test for step robustness because failures often show up as geometry glitches or texture incoherence when NFEs are too small. 

**Backbone & pipeline.** We use the same Stable Diffusion v1.5 inpainting backbone instantiated via `AutoPipelineForInpainting`, and vary only the scheduler / distilled head (LoRA) depending on the method. 

**Methods.** We compare four inference paradigms built on the same backbone (same prompt encoder / VAE / UNet weights unless stated otherwise):

* **SDE-like sampler:** Euler ancestral discretization (`EulerAncestralDiscreteScheduler`). 
* **ODE-like sampler (probability-flow style):** deterministic DDIM (`DDIMScheduler`, $$\eta=0$$). 
* **Endpoint-jump distillation (CM-like, proxy):** `LCMScheduler` <d-cite key="luo2023latent"></d-cite> with an LCM LoRA fused into the pipeline. 
* **Two-time jump distillation (Flow-like, proxy):** `TCDScheduler` <d-cite key="zheng2024trajectory"></d-cite> with a TCD LoRA fused into the pipeline (used as a practical approximation to “two-time operator distillation”). 

**Fairness controls (Exp-I & Exp-II).** To isolate step/schedule effects rather than prompt/guidance variance, we enforce:

* Same inpainting input (image + mask) and same prompt/negative prompt.
* Same step budgets (Exp-I uses ({2,4,8,16,30}), and Exp-II uses ({2,4,6,8})).
* Same random seed and the same guidance scale across all methods. 

**Extra controls for composition drift (Exp-II).** Because composition drift is subtle, we add two controls specifically for Exp-II:

* **Fixed noise for the endpoint re-noise step** in the CM-proxy, so drift reflects structural inconsistency rather than stochastic variance. 
* **Unmasked-region locking:** we explicitly lock the unmasked context region to a shared reference latent trajectory at every intermediate time, ensuring the metric measures drift only inside the edited region. 



### 4.2. A note on “proxies”: what we *did* and *did not* implement

A key practical detail is that we do **not** train a full flow-map network $$f_\theta(x_t,t,s)$$ from scratch in this blog post. Instead, we use **public distilled LoRAs <d-cite key="hu2022lora"></d-cite>** as **stand-ins** for two different structural paradigms:

- **LCM-LoRA as an endpoint-jump proxy (CM-like):** it behaves like a boundary map $$B_t(x_t)\approx x_0$$, and any $$t\to s$$ jump is synthesized via “denoise to $x_0$, then re-noise to $s$”.

- **TCD-LoRA as a two-time-jump proxy (Flow-like):** we treat the model as supporting a DDIM-coupled jump $$a\to b$$ that depends on the target time through $$(\alpha_b,\sigma_b)$$, rather than always anchoring at $$t=0$$. 

Concretely, in Exp-II we instantiate two “operators”:

* **Flow-proxy jump (DDIM-coupled):**
  
  $$
  \Phi^{\text{flow}}_{a\to b}(x_a)
  = \frac{\alpha_b}{\alpha_a} x_a + \Bigl(\sigma_b-\frac{\alpha_b}{\alpha_a}\sigma_a\Bigr)\,\varepsilon_\theta(x_a,a),
  $$

  where $$\varepsilon_\theta$$ comes from the TCD-distilled predictor and $$(\alpha_t,\sigma_t)$$ are from a reference DDIM schedule. 

* **CM-proxy jump (endpoint-anchored):**
  
  $$
  \Phi^{\text{CM}}_{a\to b}(x_a)
  = \alpha_b\,B_a(x_a) + \sigma_b\,\epsilon_0,
  $$

  where $$B_a(x_a)$$ is a learned endpoint map: $$x_a \to x_0$$, comes with a fixed $$\epsilon_0$$ shared across all compositions. 

**Why this is still meaningful.** Our goal is **not** to claim “we trained the definitive flow map.” The goal is to empirically test a *structural hypothesis* from Chapters 2–3: **multi-hop pipelines should be more stable when the underlying primitive is a genuine two-time operator (semigroup-consistent), and less stable when every hop must “return to $$x_0$$” as an anchor.**

Even with proxies, Exp-II directly measures the **semigroup violation diagnostic** (direct vs composed). As long as the two proxies reflect the two paradigms (endpoint-anchored vs time-to-time jump), the diagnostic remains aligned with the theory.

**Limitation (explicit):** the absolute numerical values of drift depend on the particular checkpoints; a true $$f_\theta(x_t,t,s)$$ trained with explicit composition constraints could reduce drift further. We view the proxy study as an **evidence-of-principle** validation.




### 4.3. Exp-I: Inpainting under different NFEs (Robustness to Discretization)

We first test whether jump-based inference indeed reduces step sensitivity. Using the common setup in Sec. 4.1, we run each method with step counts ({2,4,8,16,30}) and visualize the inpainted outputs, as shown in Figure 2.

{% include figure.liquid
path="assets/img/2026-04-27-flow-map-learning/compare_inpaint_dog.jpg"
class="img-fluid"
caption="Figure 2. Inpainting results vs NFE. Integration-based samplers (SDE/ODE) are sensitive to step count; jump-distilled samplers (LCM/TCD) are stable at very small NFEs."
%}

**Observation.** The qualitative trend is consistent:

* **SDE/ODE (integration)** are notably worse at very low NFEs and improve as NFEs increase, as expected from discretization/integration error accumulation. 

* **LCM/TCD (jump-distilled)** already produce plausible inpaintings at 2 steps and change less across the step range. 

**Interpretation.** This experiment supports the “trajectory vs operator” narrative: once inference is amortized into learned jumps, the output becomes less tied to the solver resolution (step count). Importantly, Exp-I is **not** meant to separate CM vs FlowMap; at this level both are “jump” methods, so the main takeaway is **jump distillation vs integration**. 



### 4.4. Exp-II: Direct vs composed jumps (composition drift diagnostic)

Exp-I shows that jump distillation helps at low NFEs. Exp-II asks a stricter question tied to flow-map algebra: If we want to jump from $t$ to $s$, does it matter whether we do it directly, or via multiple intermediate hops?

**Protocol Setup: direct vs $k$-hop composition**

For each trial we sample a start time $t$, an end time $$s\approx 0$$, and $$k-1$$ intermediate times

$$
t > u_1 > \dots > u_{k-1} > s.
$$

We compare:

* **Direct:** 
  
  $$x_s^{\text{dir}} = \Phi_{t\to s}(x_t)$$

* **Composed:** 

  $$x_s^{\text{comp}} = \Phi_{u_{k-1}\to s}\circ\cdots\circ\Phi_{t\to u_1}(x_t)$$

Ideally, for a valid flow map, **Direct $\approx$ Composed**. We define the **Compositional Drift** as the Mean Squared Error (MSE) between these two outputs in the latent space.

$$
\Delta_k=\mathrm{MSE}_{\text{mask}}\!\left(x_s^{\text{dir}},x_s^{\text{comp}}\right),
\qquad k\in \{2,4,6,8\}.
$$ 

**Quantitative Result: Error Accumulation**

{% include figure.liquid
path="assets/img/2026-04-27-flow-map-learning/composition_boxplot_multi.png"
class="img-fluid"
caption="Figure 3. Composition drift $\Delta_k$ (masked latent MSE, log-scale) vs hop count. Flow-proxy (TCD) shows much smaller drift and slower growth than CM-proxy (LCM)."
%}

Figure 3 reveals a stark difference in algebraic properties:

*   **Flow Map (Left):** The drift is minimal ($10^{-2}$ range) and grows slowly with hops. This indicates the model has learned a "straight" transport path where $\Phi_{t \to s}$ acts as a true semi-group.
*   **CM (Right):** The drift is an order of magnitude larger ($10^{-1} \to 10^0$) and grows faster than Flow Map. Every time the CM "touches the boundary" ($x_0$) and comes back, it introduces prediction error that compounds rapidly.

**Qualitative Result: Semantic Drift**

To make the effect tangible, we also decode “direct vs composed” and visualize $$\|\Delta\|$$ in image space (masked region only). Under ideal semigroup consistency (direct $$\approx$$ composed), the residual map  $$\|\Delta\|$$ should be negligible (nearly black).

{% include figure.liquid
path="assets/img/2026-04-27-flow-map-learning/composition_qual_examples.png"
class="img-fluid"
caption="Figure 4. Qualitative examples of direct vs 8-hop composed jumps. Flow-proxy remains nearly invariant; CM-proxy shows visible structural drift, highlighted by brighter  $\mid \Delta \mid$  maps."
%}

*   **CM Failure:** The "CM Composed" image shows the object on the stool mutating into a black-and-white artifact. The $\|\Delta\|$ map is bright, indicating severe pixel-level deviation.
  
*   **Flow Success:** The "Flow Composed" image is visually  closer to the "Direct" one. The $\|\Delta\|$ map is nearly black.
  
**Interpretation.** This experiment operationalizes semigroup consistency: the flow-proxy behaves closer to a path-independent two-time operator, while the endpoint-anchored CM-proxy accumulates drift because each hop reprojects to an estimated $$x_0$$ and then re-noises—small endpoint errors become amplified across hops.  







## 5. Conclusion

This post advocated a simple shift in abstraction: **from integrating trajectories to learning operators**. Instead of treating sampling as the repeated numerical solution of an ODE/SDE, we view generation as composing **finite-time maps**. The flow map family $$\{\Phi_{t\to s}\}$$ is the minimal object that retains *control* (arbitrary start/stop times) while enabling *speed* (amortized jumps), and its algebraic structure—**identity** and the **semigroup law**—acts as the “physics” that distinguishes a genuine two-time operator from a boundary-only shortcut.

We then showed how this operator view organizes a large body of recent work:
- Consistency Models emerge as **boundary operators** $$f_\theta(x_t,t,0)$$, fast but structurally rigid.
- Flow Matching is the **infinitesimal limit** of a flow map, flexible but expensive at inference.
- MeanFlow and CTM can be interpreted as intermediate points that impose linearization or discrete composition constraints.

On the training side, we derived two complementary distillation perspectives:

- The **Lagrangian view (LMD)** supervises **how the endpoint moves** with the target time $s$, anchoring the operator to the teacher’s dynamics.
- The **Eulerian view (EMD)** supervises **how the operator evolves** with the start time $t$, enforcing invariance under transport and connecting naturally to consistency-style objectives.
  
Together, they suggest that "learning $$\Phi_{t\to s}$$" is not a single recipe but a **design space**: which derivatives you match (and how strongly you enforce composition) determines how well the learned operator behaves under chaining and editing.

Finally, we proposed two concrete, falsifiable hypotheses for operator learning and tested them under a shared inpainting setup:

1. **Robustness to discretization:** jump-based inference should be less sensitive to the step budget than integration-based sampling.

2. **Algebraic consistency:** if an operator is semigroup-consistent, **direct** and **composed** jumps should agree, and the discrepancy should grow slowly with hop count.

Even with practical proxies (LCM as endpoint-anchored, TCD as DDIM-coupled two-time jump), the experiments support the central narrative: **operator-like jumps are step-robust, and two-time jumps exhibit substantially lower compositional drift than endpoint-anchored hops**. This points to a useful takeaway beyond any specific method: **“semigroup violation” can serve as a unit test for generative operators**, especially in pipelines that repeatedly jump across time (editing, multi-stage refinement, or back-and-forth schedules).

### Limitations and Outlook

Our study deliberately prioritized *structure* over *full-scale training*: we did not train a complete $$f_\theta(x_t,t,s)$$ with explicit semigroup regularization. The next step is therefore clear: train true flow maps with (i) broad coverage over $(t,s)$, (ii) explicit composition constraints, and (iii) evaluation on tasks where chaining is unavoidable (e.g., iterative editing loops, guided refinement schedules, and long-horizon compositions). If successful, operator learning could offer a principled route to **fast** generation that remains **composable**, **controllable**, and **stable under changing schedules**—precisely where many endpoint-anchored distillations tend to break.
