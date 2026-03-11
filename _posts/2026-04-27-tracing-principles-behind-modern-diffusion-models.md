---
layout: distill
title: Tracing the Principles Behind Modern Diffusion Models
description: "Diffusion models can feel like a jungle of acronyms, but the core idea is simple: start from noise and gradually move a cloud of samples until it looks like real data. This post gives an intuition-first tour showing that DDPMs, score-based models, and flow matching are the same recipe with different prediction targets, all rooted in the change-of-variable rule from calculus and powered by one shared “conditional trick” that turns learning into supervised regression. Finally, we zoom out to the speed problem and show how flow map models aim to replace many tiny denoising steps with a few big, accurate jumps toward real-time generation."
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
  - name: Chieh-Hsin Lai, Yang Song, Dongjun Kim, Yuki Mitsufuji, Stefano Ermon

# must be the exact same name as your blogpost
bibliography: 2026-04-27-tracing-principles-behind-modern-diffusion-models.bib

toc:
  - name: "I. A Systematic Tour of Diffusion Models"
    subsections:
      - name: "The Generative Goal"
      - name: "Forward Process"
      - name: "Reverse Process"
        subsections:
          - name: "DDPM: Predicting the Reverse Step via Noise or Mean"
          - name: "Score-Based Methods: Predict the Score"
          - name: "Flow Matching: Predict the Velocity"
            subsections:
              - name: "Euler = DDIM-style Step"
              - name: "Heun = 2nd-order DPM-Solver-style Step"
          - name: "Three Lenses on the Same Diffusion Path"

  - name: "II. Change-of-Variable Formulas"
    subsections:
      - name: "The Intuition"
      - name: "The Math We Already Know"
        subsections:
          - name: "Calculus 101 (One Dimension)"
          - name: "Higher Dimensions"
      - name: "From One Big Map to a Time-Evolution"
      - name: "Enter the Noise"

  - name: "III. From Slow Samplers to Flow Maps"
    subsections:
      - name: "What Is a Flow Map Model?"
      - name: 'Three Flow Map Families'
        subsections:
          - name: "Consistency Models (CM)."
          - name: "Consistency Trajectory Models (CTM)."
          - name: "Mean Flow (MF)."
      - name: "How the Three Flow Map Families Relate"

  - name: "Conclusion"


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

Modern diffusion models are often introduced through a long list of concepts and terms whose relationships are not immediately clear. Very quickly, one encounters names such as *DDPM, SDE, ODE, probability flow, flow matching, distillaion, consistency, flow map*, together with phrases like *forward process, reverse process, score, velocity field, sampler*. For a reader encountering these ideas for the first time, this can be overwhelming.

In what follows, we slow the story down and keep a single guiding thread:

> All these models describe different ways to *move probability mass* from "simple noise" to "complicated data". Under the surface, they are all based on the same principle from calculus: the *change-of-variable rule*.

In the rest of this article, we build the picture step by step.

We start with three common lenses on diffusion, *DDPM*, *score-based methods*, and *flow matching*. They share the same recipe: fix a simple *forward Gaussian noising process*, then learn to reverse it. The main difference is *what the network predicts*, such as noise, score, or velocity.

Underneath all of them is the same math question: when we *move a cloud of samples*, how does the distribution change? The answer is the change-of-variable rule from Calculus applied to a particle cloud. In continuous time, this becomes the PDE view: pure transport gives the *continuity equation*, and transport with Gaussian jitter gives the *Fokker–Planck equation*. This matters because it is the bookkeeping that keeps the story honest: once we pre-specify the forward noising process, we have a specific path of snapshot distributions in mind, and the reverse-time generator must move probability mass in a way that stays consistent with that path. Without this structure, there is nothing tying the reverse-time generator to the intended transition from prior to data, so the learned dynamics can quietly drift away from the distribution evolution we had in mind.

Finally, we focus on speed. Diffusion is *high fidelity* but often slow because sampling is iterative. We end with *flow map models*, which keep the same diffusion backbone but aim to learn *long time-jumps* of the probability-flow dynamics directly, replacing many tiny steps with a few big, accurate jumps.




# I. A Systematic Tour of Diffusion Models

## The Generative Goal

We first discuss the goal, before introducing any technical machinery.

On the simple side, we can easily generate randomness. For example, we can draw a vector of independent Gaussian variables, which looks like pure "static". On the complex side, we have realistic data: natural images, short audio clips, 3D shapes, and so on. These objects are high-dimensional and exhibit rich structure. A *deep generative model* is a procedure that maps from the simple side to the complex side. It turns noise into data.

At an abstract level, we can depict this as

{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/dgm-learning.svg" class="img-fluid" %}

Classical models such as GANs and VAEs attempt to learn this arrow in one or a few large steps: a single neural network takes a noise vector and outputs an image.

**Diffusion-style models** follow a different philosophy. Instead of jumping directly from noise to data, they move in many *small increments*. More precisely, the construction consists of two coupled procedures:

- In the **forward process**, we start from real data and gradually add small amounts of simple random noise at many tiny steps. As this corruption progresses, fine details disappear first, then larger structures become indistinct, and eventually every sample looks like featureless noise. By the end, all examples, regardless of which original image or sound they came from, are brought into a *common noisy space* that is very close to a standard Gaussian distribution and easy to sample from. Although we typically do not run this forward process at test time, it is essential during training because it provides a precise, controlled way to relate clean data to their noisy versions.

{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/vdm-forward.svg" class="img-fluid" %}


- In the **reverse process**, the model learns to undo this artificial corruption step by step. Starting from pure noise, it applies a sequence of learned denoising updates that gradually reintroduce structure: coarse shapes first, then finer details. After enough steps, the final outputs resemble realistic data again. This reverse procedure is what we actually use at sampling time to turn noise into data.


{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/vdm-backward.svg" class="img-fluid" %}


In both directions, there is a common underlying object: a *probability denity* that evolves over time. At time $$t = 0$$, we may have a density that is shaped like the data distribution. As $$t$$ increases, the forward process transports and blurs this density until it approaches a simple reference distribution, often called the *prior*. In practice, this prior is typically chosen to be a standard Gaussian, because we know how to sample from it efficiently and its properties admit closed-form expressions.


At this point, the big picture is in place: we have a simple way to *corrupt* data into noise, and we hope to learn a reverse procedure that *undoes* that corruption.  

So the next step is to pin down a *fully explicit* forward rule that we can define ourselves: given a clean sample $$\mathbf{x}_0$$, what is the distribution of its noisy version $$\mathbf{x}_t$$ at each time $$t$$? Once this rule is fixed, we can talk precisely about different reverse-time modeling choices built on top of the *same* forward construction.


## Forward Process

It helps to first make the *forward noising rule* completely concrete. Modern common diffusion models (such as DDPM, Score SDE, Flow Matching) that we will revisit in this post all start from this same basic construction.


Let $\mathbf{x}_0 \in \mathbb{R}^D$ be a clean data sample (an image, an audio clip, etc.) sampled from a given data distributio $$p_{\text{data}}$$. The forward process gradually corrupts $\mathbf{x}_0$ into a noisy version $\mathbf{x}_t$. A standard and very convenient choice is:

$$
p(\mathbf{x}_t \mid \mathbf{x}_0)
= \mathcal{N}\bigl(\mathbf{x}_t;\,\alpha_t\,\mathbf{x}_0,\;\sigma_t^2\,\mathbf{I}\bigr),
$$

where $\alpha_t$ and $\sigma_t$ are scalar functions of the "time" $t$, and $\mathbf{I}$ is the identity matrix. Equivalently, we can sample

$$
\boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I}), 
\qquad
\mathbf{x}_t = \alpha_t \mathbf{x}_0 + \sigma_t \boldsymbol{\epsilon}.
$$

We can think of $\alpha_t$ as the amount of original signal that remains at time $t$, and $\sigma_t$ as the amount of noise that has been mixed in:

- for small $t$, $\alpha_t \approx 1$ and $\sigma_t \approx 0$, so $\mathbf{x}_t$ is close to $\mathbf{x}_0$;
- for large $t$, $\alpha_t \approx 0$ and $\sigma_t$ is large, so $\mathbf{x}_t$ is almost pure noise.


With this forward perturbation, we can view the data distribution as being "blurred" over time. The resulting time-dependent marginal density is


$$ 
p_t(\mathbf{x}):= \int p(\mathbf{x}_t \mid \mathbf{x}_0) p_{\text{data}}(\mathbf{x}_0) \mathrm{d} \mathbf{x}_0.
$$

## Reverse Process

Once the forward noising process is fixed, most diffusion "flavors" differ in just two choices:

1. What the network predicts from $$(\mathbf{x}_t, t)$$, and  
2. How we use that prediction at sampling time to go from noise back to data.

Below we outline three widely used viewpoints that all tell the same story:

- **Variational Perspective:** predict the *noise that was added* (or, equivalently, a cleaned-up version of the sample), then use it to take one denoising step. A representative model in this family is *Denoising Diffusion Probabilistic Models (DDPM)*.
- **Score-based Perspective:** predict a score function, i.e., the *direction pointing toward more likely images* at noise level $t$, and then follow it to move from noise back to data. The representative one *Score SDE*.  
- **Flow-based Perspective:** predict a *velocity (a "push")* telling how to move the sample at time $$t$$, then integrate these pushes to transport noise into data. The representative example is *Flow Matching*.



### DDPM: Predicting the Reverse Step via Noise or Mean

Denoising Diffusion Probabilistic Models (DDPM) <d-cite key="sohl2015deep,ho2020denoising"></d-cite> are one of the earliest modern diffusion approaches. The main idea is simple: with the fix forward noising process that gradually destroys data, it *trains a model to run this process in reverse*. DDPM formalizes this as a variational objective, so that learning to denoise step by step also corresponds to maximizing a likelihood-style training goal.


In DDPM, we work with a *discrete* set of noise levels, for example integer times $t = 0, 1, \dots, T$. The *forward* process gradually increases the noise level so that
$\mathbf{x}_T$ is (almost) standard Gaussian.

Conceptually, what we would like to have is the *oracle reverse transition kernel* that undoes this forward corruption:

$$
p(\mathbf{x}_{t-1} \mid \mathbf{x}_t), \quad t = T, T-1, \dots, 1,
$$

so that if we start from $\mathbf{x}_T \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ and keep sampling backwards

$$
\mathbf{x}_T \to \mathbf{x}_{T-1} \to \cdots \to \mathbf{x}_0,
$$

the final $\mathbf{x}_0$ looks like a real data sample.


To make the generative process work, we would like to learn the true reverse kernel $$p(\mathbf{x}_{t-1}\mid \mathbf{x}_t)$$, by fitting a parametric model
$$ p_\theta(\mathbf{x}_{t-1}\mid \mathbf{x}_t) $$ and minimizing the expected KL

$$
\mathbb{E}_{p_t(\mathbf{x}_t)}
\big[ D_{\mathrm{KL}}\big(p(\mathbf{x}_{t-1}\mid \mathbf{x}_t)\,\|\,p_\theta(\mathbf{x}_{t-1}\mid \mathbf{x}_t)\big) \big].
$$

At first sight, this looks hopeless: the marginal reverse kernel

$$
p(\mathbf{x}_{t-1}\mid \mathbf{x}_t)
= \int p(\mathbf{x}_{t-1}\mid \mathbf{x}_t,\mathbf{x}_0)\,p_{\text{data}}(\mathbf{x}_0)\mathrm{d}\mathbf{x}_0
$$

is a complicated *mixture of Gaussians* over all possible clean images $$\mathbf{x}_0$$, and we never see it in closed form.

The key move, which we call the *conditional trick*, is to *condition on the clean data* $$\mathbf{x}_0$$ to obtain a tractable regression target. Because the forward process is Markov and Gaussian, the conditional kernel $$p(\mathbf{x}_{t-1}\mid \mathbf{x}_t, \mathbf{x}_0)$$ is itself a single Gaussian with a closed-form mean and variance.

A neat calculation shows that the original "impossible" objective can be rewritten as

<div style="background:rgba(255,165,0,0.12); padding:12px; border-radius:10px; max-width:100%; overflow-x:auto; overflow-y:hidden;">
$$
\mathbb{E}_{p_t(\mathbf{x}_t)}\!\big[ D_{\mathrm{KL}}(p(\mathbf{x}_{t-1}\mid \mathbf{x}_t)\,\|\,p_\theta(\mathbf{x}_{t-1}\mid \mathbf{x}_t)) \big]
= \mathbb{E}_{p_{\text{data}}(\mathbf{x}_0)}\mathbb{E}_{p(\mathbf{x}_t\mid \mathbf{x}_0)}
\big[ D_{\mathrm{KL}}(p(\mathbf{x}_{t-1}\mid \mathbf{x}_t,\mathbf{x}_0)\,\|\,p_\theta(\mathbf{x}_{t-1}\mid \mathbf{x}_t)) \big] + C,
$$
</div>
where $$C$$ is a constant independent of $$\theta$$.

In words: instead of trying to match the unknown mixture $$p(\mathbf{x}_{t-1}\mid \mathbf{x}_t)$$ directly, we match the *Gaussian conditional* $$p(\mathbf{x}_{t-1}\mid \mathbf{x}_t,\mathbf{x}_0)$$ for random data points $$\mathbf{x}_0$$.  This conditional objective is mathematically equivalent to the original KL up to a constant, but now the target is *fully tractable*.

This conditional trick will reappear in score-based SDEs and flow matching: in all three views, conditioning on $$\mathbf{x}_0$$ turns an intractable object (reverse kernel, score, or velocity) into a simple regression target we can actually learn.


Because the forward noising rule is *linear and Gaussian*, the one-step reverse transition has a convenient form: it is also Gaussian.  So DDPM models the reverse kernel as

$$
p_\theta(\mathbf{x}_{t-1}\mid \mathbf{x}_t)
:= \mathcal{N}\!\big(\boldsymbol{\mu}_\theta(\mathbf{x}_t,t),\,\tilde{\sigma}_t^2\mathbf{I}\big).
$$

Here $$\tilde{\sigma}_t^2$$ is a *known* (pre-chosen) variance schedule, so the only learnable part is the mean $$\boldsymbol{\mu}_\theta(\mathbf{x}_t,t)$$.

A key practical simplification is that we usually *do not* ask the network to output this mean directly. Instead, we exploit the closed-form forward relation

$$
\mathbf{x}_t=\alpha_t\mathbf{x}_0+\sigma_t\boldsymbol{\epsilon},
\qquad \boldsymbol{\epsilon}\sim\mathcal{N}(\mathbf{0},\mathbf{I}),
$$

which implies that the reverse mean can be written as an *explicit formula* once we know either the clean image $$\mathbf{x}_0$$ or the noise $$\boldsymbol{\epsilon}$$.  So we train the network to predict one of these simpler quantities, and then *plug it into* the analytic formula for $$\boldsymbol{\mu}_\theta(\mathbf{x}_t,t)$$.

In the original DDPM formulation, the standard choice is to predict the noise. Concretely, we train $$\boldsymbol{\epsilon}_\theta(\mathbf{x}_t,t)$$ with the regression objective

$$
\mathcal{L}_{\text{variational}}(\theta)
=
\mathbb{E}_{t,\,\mathbf{x}_0,\,\boldsymbol{\epsilon}}
\Big[
\lambda(t)\,
\big\|
\boldsymbol{\epsilon}_\theta(\mathbf{x}_t,t)-\boldsymbol{\epsilon}
\big\|_2^2
\Big],
$$

where $$\lambda(t)$$ is a time-dependent weight.

Intuitively: the network sees a noisy sample $$\mathbf{x}_t$$ and its noise level $$t$$, and learns to answer  "*What noise was added to create this sample?*"

At sampling time, we start from $$\mathbf{x}_T\sim\mathcal{N}(\mathbf{0},\mathbf{I})$$. At each step, we use $$\boldsymbol{\epsilon}_\theta(\mathbf{x}_t,t)$$ to compute the Gaussian mean $$\boldsymbol{\mu}_\theta(\mathbf{x}_t,t)$$ (via the closed-form reverse formula), sample $$\mathbf{x}_{t-1}$$, and repeat until we reach a clean sample $$\mathbf{x}_0$$.




### Score-Based Methods: Predict the Score

Score-based diffusion models <d-cite key="song2020score"></d-cite> keep the same forward corruption rule for $$\mathbf{x}_t$$, but they train the network to predict a different object: the *score* at each noise level $$t$$,

$$
\nabla_{\mathbf{x}}\log p_t(\mathbf{x}),
$$

where $$p_t$$ is the (unknown) marginal density of noisy samples at time $$t$$. Intuitively, the score is a local arrow that points toward *more likely* samples under $$p_t$$.

Of course, we cannot compute $$\nabla_{\mathbf{x}}\log p_t(\mathbf{x})$$ directly because $$p_t$$ is defined by integrating over the data. The *conditional trick* is to instead use the Gaussian conditional $$p(\mathbf{x}_t\mid \mathbf{x}_0)$$, whose score is available in closed form:

$$
\nabla_{\mathbf{x}_t}\log p(\mathbf{x}_t\mid \mathbf{x}_0)
=
-\frac{1}{\sigma_t^2}\bigl(\mathbf{x}_t-\alpha_t\mathbf{x}_0\bigr).
$$

Since $$\mathbf{x}_t=\alpha_t\mathbf{x}_0+\sigma_t\boldsymbol{\epsilon}$$, this target is equivalently
$$
-\frac{1}{\sigma_t}\boldsymbol{\epsilon},
$$
which makes the supervision feel very concrete: "given a noisy sample, point in the direction that removes the injected noise."

Training then becomes a plain regression problem. We sample $$\mathbf{x}_0$$, choose $$t$$, draw $$\boldsymbol{\epsilon}\sim\mathcal{N}(\mathbf{0},\mathbf{I})$$, form $$\mathbf{x}_t$$, and minimize the *denoising score matching* loss

$$
\mathcal{L}_{\text{score}}(\theta)
=
\mathbb{E}_{t,\,\mathbf{x}_0,\,\boldsymbol{\epsilon}}
\Big[
\lambda(t)\,
\big\|
\mathbf{s}_\theta(\mathbf{x}_t,t)
+\frac{1}{\sigma_t^2}\bigl(\mathbf{x}_t-\alpha_t\mathbf{x}_0\bigr)
\big\|_2^2
\Big].
$$

More precisely, *denoising score matching* gives the same kind of "conditional trick" we saw in DDPM: the intractable regression target $$\nabla_{\mathbf{x}_t}\log p_t(\mathbf{x}_t)$$ can be replaced by the *tractable* conditional target $$\nabla_{\mathbf{x}_t}\log p_t(\mathbf{x}_t\mid \mathbf{x}_0)$$, and the two objectives differ only by a constant (so they induce the same gradient updates and the same optimum). Formally, for a constant $$C$$ that does *not* depend on $$\theta$$,

<div style="background:rgba(255,165,0,0.12); padding:12px; border-radius:10px; max-width:100%; overflow-x:auto; overflow-y:hidden;">
$$
\mathbb{E}_{t}\,\mathbb{E}_{\mathbf{x}_t\sim p_t}
\Big[
\lambda(t)\,
\big\|
\mathbf{s}_\theta(\mathbf{x}_t,t) - \nabla_{\mathbf{x}_t}\log p_t(\mathbf{x}_t)
\big\|_2^2
\Big]
=
\mathbb{E}_{t}\,\mathbb{E}_{\mathbf{x}_0\sim p_{\text{data}}}\,\mathbb{E}_{\mathbf{x}_t\sim p(\cdot\mid \mathbf{x}_0)}
\Big[
\lambda(t)\,
\big\|
\mathbf{s}_\theta(\mathbf{x}_t,t)
-\nabla_{\mathbf{x}_t}\log p_t(\mathbf{x}_t\mid \mathbf{x}_0)
\big\|_2^2
\Big]
+ C.
$$
</div>

At test time, the learned score field $$\mathbf{s}_\theta$$ is turned into an actual sampler by following a continuous-time dynamics. A particularly clean option is the *probability-flow ODE (PF-ODE)*: a *deterministic* trajectory whose intermediate distributions match those of the stochastic diffusion process.

The PF-ODE takes the form

$$
\frac{\mathrm{d}\mathbf{x}(t)}{\mathrm{d}t}
=
f(t)\mathbf{x}(t)
-\frac{1}{2}g^2(t)\mathbf{s}_\theta(\mathbf{x}(t),t). 
$$

Here, the coefficients $$f(t)$$ and $$g(t)$$ are tied to the forward perturbation $$\mathbf{x}_t=\alpha_t\mathbf{x}_0+\sigma_t\boldsymbol{\epsilon}$$ through

$$
f(t)=\frac{\mathrm{d}}{\mathrm{d}t}\log\alpha_t=\frac{\dot{\alpha}_t}{\alpha_t},
\quad\text{and}\quad
g^2(t)=\frac{\mathrm{d}}{\mathrm{d}t}\sigma_t^2-2f(t)\sigma_t^2.
$$

The key point is that the PF-ODE is constructed so that, for every time $$t$$, the random variable $$\mathbf{x}(t)$$ has distribution exactly $$p_t$$. So even though each trajectory is deterministic, the sampler still matches the same "distribution snapshot" at each noise level.

Starting from a seed drawn from the prior, $$\mathbf{x}_T\sim p_{\text{prior}}$$, we numerically integrate the PF-ODE backward from $$t=T$$ to $$t=0$$. The endpoint $$\mathbf{x}_0$$ is then a data-like sample. 


{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/continuous_ode.svg" class="img-fluid" %}

The score SDE framework can be viewed as a *continuous-time* extension of DDPM. It reframes diffusion generation as solving a time-dependent differential equation, which connects generative modeling to classical tools from differential equations. We will illustrate this with concrete examples when we introduce the Flow Matching framework below, which keeps the notation simple.

This viewpoint also makes one practical point transparent: *standard diffusion sampling is inherently iterative, and can therefore be slow*. The sample is refined through many small updates, and high quality often requires many such steps.


### Flow Matching: Predict the Velocity

In score-based diffusion, we first learn a *score* $$\mathbf{s}_\theta(\mathbf{x},t)$$ (a "which way is more likely" direction), and then convert it into a sampler by integrating the PF-ODE.  Flow matching <d-cite key="lipman2022flow"></d-cite> shifts the focus: instead of learning the score, it trains the network to output the *velocity field* directly, the ODE rule that moves a sample at time $$t$$.

We start from the same linear-Gaussian coupling between clean data and noisy data: $$\mathbf{x}_t=\alpha_t\mathbf{x}_0+\sigma_t\boldsymbol{\epsilon}$$, with $$\boldsymbol{\epsilon}\sim\mathcal{N}(\mathbf{0},\mathbf{I})$$.
If we imagine following this path as $$t$$ changes, the instantaneous motion is just its time derivative:

$$
\mathbf{v}^{\text{cond}}(\mathbf{x}_t,t)
:=
\dot{\mathbf{x}}_t 
=
\dot{\alpha}_t\,\mathbf{x}_0+\dot{\sigma}_t\,\boldsymbol{\epsilon}.
$$

This is the familiar *conditional trick*: although we do not know the "true" marginal velocity associated with $$p_t$$, conditioning on $$\mathbf{x}_0$$ gives a closed-form regression target.

Training is therefore a simple regression problem. We sample $$\mathbf{x}_0,t,\boldsymbol{\epsilon}$$, form $$\mathbf{x}_t$$, and fit $$\mathbf{v}_\theta(\mathbf{x}_t,t)$$ to match $$\dot{\alpha}_t\mathbf{x}_0+\dot{\sigma}_t\boldsymbol{\epsilon}$$:

$$
\mathcal{L}_{\text{FM}}(\theta)
=
\mathbb{E}_{t,\,\mathbf{x}_0,\,\boldsymbol{\epsilon}}
\Big[
\lambda(t)\,
\big\|
\mathbf{v}_\theta(\mathbf{x}_t,t)
-
(\dot{\alpha}_t\,\mathbf{x}_0+\dot{\sigma}_t\,\boldsymbol{\epsilon})
\big\|_2^2
\Big].
$$

The only subtlety is *what the "right" target is* if our network only gets $$\mathbf{x}_t$$. At time $$t$$, many different clean images $$\mathbf{x}_0$$ can lead to the same noisy point $$\mathbf{x}_t$$, so $$\mathbf{v}^{\text{cond}}(\mathbf{x}_t,t)$$ is not a single-valued function of $$\mathbf{x}_t$$ alone. In squared error, the *best possible* predictor given only $$\mathbf{x}_t$$ is  the conditional mean of the target, under the chosen marginal path $$p_t$$:

$$
\mathbf{v}(\mathbf{x}, t)
:=
\mathbb{E}\!\left[\mathbf{v}^{\text{cond}}(\mathbf{x}_t, t)\,\middle|\,\mathbf{x}_t=\mathbf{x}\right],
\qquad \mathbf{x}_t\sim p_t.
$$


Now the key equivalence mirrors denoising score matching. A standard squared-loss decomposition implies that, for a constant $$C$$ independent of $$\theta$$,

<div style="background:rgba(255,165,0,0.12); padding:12px; border-radius:10px; max-width:100%; overflow-x:auto; overflow-y:hidden;">
$$
\mathbb{E}_{t}\,\mathbb{E}_{\mathbf{x}_t\sim p_t}
\Big[
\lambda(t)\,
\big\|
\mathbf{v}_\theta(\mathbf{x}_t,t)-\mathbf{v}(\mathbf{x}, t)
\big\|_2^2
\Big]
=
\mathbb{E}_{t,\,\mathbf{x}_0,\,\boldsymbol{\epsilon}}
\Big[
\lambda(t)\,
\big\|
\mathbf{v}_\theta(\mathbf{x}_t,t)-\mathbf{v}^{\text{cond}}(\mathbf{x}_t,t)
\big\|_2^2
\Big]
+ C.
$$
</div>

Namely, we rewrite the objective so we can swap an *unknown marginal* target for a *tractable conditional* one. The two losses differ only by a constant (independent of $$\theta$$), so they induce the same gradient updates and share the same optimum.




At test time, we sample $$\mathbf{x}_T\sim\mathcal{N}(\mathbf{0},\mathbf{I})$$ and integrate the learned ODE

$$
\frac{\mathrm{d}\mathbf{x}(t)}{\mathrm{d}t}=\mathbf{v}_\theta(\mathbf{x}(t),t),
\qquad t:T\to 0,
$$

to obtain a data-like $$\mathbf{x}_0$$. To actually run this on a computer, we discretize time into a grid and step *backward* from $$t$$ to $$t-\Delta t$$ along a chosen schedule. Each step replaces the continuous ODE with a small update rule, giving a practical approximation to the trajectory. Below are two standard concrete examples.



#### Euler = *DDIM-style* Step

The simplest choice is to use the velocity at the current point:

$$
\mathbf{x}_{t-\Delta t}
=
\mathbf{x}_t
-\Delta t\,\mathbf{v}_\theta(\mathbf{x}_t,t).
$$

This is the basic *first-order* Euler discretization of an ODE. With the learned diffusion-model velocity plugged in, this update recovers the familiar *DDIM-style deterministic sampler* <d-cite key="song2020denoising"></d-cite>: one model call per step, fast, but limited by first-order numerical accuracy.


#### Heun = *2nd-order DPM-Solver-style* Step

A small upgrade is to take one "draft" step, then correct it using the velocity at the endpoint.

Predict (Euler):

$$
\tilde{\mathbf{x}}_{t-\Delta t}
=
\mathbf{x}_t-\Delta t\,\mathbf{v}_\theta(\mathbf{x}_t,t).
$$

Correct (average the two velocities):

$$
\mathbf{x}_{t-\Delta t}
=
\mathbf{x}_t
-\frac{\Delta t}{2}\Big(
\mathbf{v}_\theta(\mathbf{x}_t,t)
+
\mathbf{v}_\theta(\tilde{\mathbf{x}}_{t-\Delta t},\,t-\Delta t)
\Big).
$$

This is a *second-order* method. With the diffusion-model velocity plugged in, it becomes the same predictor–corrector pattern used by *second-order DPM-Solver* variants <d-cite key="lu2022dpm"></d-cite>: two model calls per step, but typically much better accuracy at the same step budget.

In both cases, repeating the update from $$t=T$$ down to $$t=0$$ yields a data-like sample $$\mathbf{x}_0$$.




### Three Lenses on the Same Diffusion Path

With the same fixed forward Gaussian rule
$$
\mathbf{x}_t = \alpha_t \mathbf{x}_0 + \sigma_t \boldsymbol{\epsilon},
$$
all these methods start from the same convenience: we can generate a noisy sample $$\mathbf{x}_t$$ from a clean sample $$\mathbf{x}_0$$ in a fully analytic way. What changes is *which learnable target we use to describe (and later reverse) the evolution of the noisy marginals* $$p_t$$:

- *DDPM:* predict the *noise* that was added  (equivalently, a denoising direction / mean for one reverse step).
- *Score SDE:* predict the *score*, a direction that points toward more likely samples under $$p_t$$.
- *Flow matching:* predict a *velocity*, the instantaneous "push" that transports samples along the path.

Despite these different targets, the training recipe follows the same principle: we avoid regressing on an intractable marginal object directly. Instead, we use the known conditional $$p(\mathbf{x}_t\mid \mathbf{x}_0)$$ to build a *closed-form conditional target* (noise / conditional score / conditional velocity). This is the same *conditional trick*, just shown in different forms.

Indeed, these targets ($$\mathbf{x}$$- / $$\boldsymbol{\epsilon}$$- / score- / velocity-prediction) are not isolated choices. They are different parameterizations of the same underlying Gaussian path. For instance, the forward rule
$$
\mathbf{x}_t=\alpha_t\mathbf{x}_0+\sigma_t\boldsymbol{\epsilon}
$$
links $$\mathbf{x}_0$$ and $$\boldsymbol{\epsilon}$$ analytically, so knowing one lets you recover the others. As a result, the same reverse-step mean can be written using any of these parameterizations.

Likewise, under the same marginal path $$p_t$$, the "oracle" velocity that transports $$p_t$$ is tied to the score via the PF-ODE identity

$$
\mathbf{v}(\mathbf{x},t)=f(t)\mathbf{x}-\frac{1}{2}g^2(t)\mathbf{s}(\mathbf{x},t).
$$

So, while different papers choose different training targets, they are largely *inter-convertible descriptions* of the same density evolution.



Next, we connect this back to the calculus view: how a distribution $$p_t$$ changes when we *move points* (ODE) or *add randomness* (diffusion).



---

# II. Change-of-Variable Formulas

All the forward and reverse procedures above can be viewed through the same geometric lens: we draw many points from some distribution (data, or the prior) and then *move those points together* according to a rule. If we imagine these points as a *cloud* in space, moving every point deforms the cloud: some regions get more crowded, others become more sparse.

This immediately raises a recurring question:

> In diffusion models, what happens to the underlying *probability density* when we move (and sometimes randomly perturb) all points, from the data distribution toward the prior, or back again?

The first step toward a precise answer is a familiar tool from calculus: the *change-of-variable formula*.

## The Intuition: A Particle Cloud

Imagine every possible image or audio clip is a point $$\mathbf{x}\in\mathbb{R}^D$$. Place a tiny particle at each data sample. Where particles cluster, the density is high; where they rarely appear, the density is low.

Now imagine applying a transformation to every particle. The key invariant is *mass conservation*: particles move around, but they are not created or destroyed, so *total probability stays 1*. Density changes only because space is stretched or squeezed.

Everything below is just different ways to write this idea cleanly.

## The Math We Already Know
The good news is that diffusion models do not require exotic math. They mostly reuse one idea from calculus: if we *move points*, we automatically change how density concentrates. Let us start with the simplest case.



### Calculus 101 (One Dimension)

Let $$x_0\in\mathbb{R}$$ be a random variable with density $$p_0(x_0)$$. Apply a smooth invertible map $$\Psi:\mathbb{R}\to\mathbb{R}$$ and define
$$
x_1=\Psi(x_0).
$$
Then the density after the map is

$$
p_1(x_1)
=
p_0\bigl(\Psi^{-1}(x_1)\bigr)\,
\left|\frac{\mathrm{d}\Psi^{-1}}{\mathrm{d} x_1}\right|.
$$

Intuitively, $$\Psi$$ can *squeeze* or *stretch* the line. If it squeezes many $$x_0$$ values into a small interval of $$x_1$$, the density must go up there. If it stretches space out, density must go down. The factor
$$
\left|\frac{\mathrm{d}\Psi^{-1}}{\mathrm{d} x_1}\right|
$$
is exactly this local stretching ratio.


### Higher Dimensions (and Why the Continuity Equation Is the Same Idea)

In $$\mathbb{R}^D$$, the change-of-variables rule looks scarier only because of the *determinant*. Let $$\Psi:\mathbb{R}^D\to\mathbb{R}^D$$ be a smooth bijection and set $$\mathbf{x}_1=\Psi(\mathbf{x}_0)$$. If $$p_0$$ is the density before the map and $$p_1$$ after, then

$$
p_1(\mathbf{x}_1)
=
p_0\bigl(\Psi^{-1}(\mathbf{x}_1)\bigr)\,
\left|\det\frac{\partial \Psi^{-1}}{\partial \mathbf{x}_1}\right|.
$$

The determinant is just a *local volume scale*: if a tiny ball of points gets stretched to have 2× the volume, then the density must drop by 2× so that *mass stays the same*.

The takeaway we will keep using is:

> If we move points by an invertible map, density changes according to how much the map locally stretches or compresses space.

{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/change-of-variable.png" class="img-fluid" %}


## From One Big Map to a Time-Evolution

The change-of-variable formula tells us how *one* invertible map $$\Psi$$ reshapes a density by locally stretches or compresses volume.

To get to diffusion-style dynamics, we simply stop doing *one* big warp and instead apply *many tiny warps* in sequence. Think of a long chain of bijections:

$$
\mathbf{x}_0 \xrightarrow{\ \Psi_1\ } \mathbf{x}_{\Delta t}
\xrightarrow{\ \Psi_2\ } \mathbf{x}_{2\Delta t}
\ \cdots\ 
\xrightarrow{\ \Psi_L\ } \mathbf{x}_{T},
\qquad \Delta t = T/L.
$$

Each step conserves probability mass and therefore obeys the same change-of-variable rule. In log form, the Jacobian determinants just *add up*:

$$
\log p_T(\mathbf{x}_T)
=
\log p_0(\mathbf{x}_0)
-
\sum_{k=1}^L \log\left|\det\frac{\partial \Psi_k}{\partial \mathbf{x}}\right|.
$$

This is exactly the normalizing-flow picture, only used in *tiny increments*.




Now make those increments concrete with a nice set of illustration. A natural "tiny warp" is to move each point a small distance along a velocity field,

$$
\mathbf{x}_{t+\Delta t}=\mathbf{x}_t+\Delta t\,\mathbf{v}_t(\mathbf{x}_t),
$$

or we write it as:

$$
\Psi_{\Delta t}(\mathbf{x}):=\mathbf{x}+\Delta t\,\mathbf{v}_t(\mathbf{x}).
$$



To understand how the density changes, keep one picture in mind: $$p_{t+\Delta t}(\mathbf{x})$$ measures how much probability mass ends up near $$\mathbf{x}$$ after the step.

Change-of-variables says this comes from two first-order effects happening at once. First, the mass near $$\mathbf{x}$$ must have arrived from a nearby point at time $$t$$, namely the point that maps into $$\mathbf{x}$$ under one step. Since the step is tiny, this "backtracked" location is simply

$$
\Psi_{\Delta t}^{-1}(\mathbf{x})
=
\mathbf{x}-\Delta t\,\mathbf{v}_t(\mathbf{x})+o(\Delta t),
$$

so the old density is sampled slightly upstream:

$$
p_t\!\left(\Psi_{\Delta t}^{-1}(\mathbf{x})\right)
=
p_t(\mathbf{x})
-\Delta t\,\mathbf{v}_t(\mathbf{x})\cdot\nabla_{\mathbf{x}}p_t(\mathbf{x})
+o(\Delta t).
$$

Second, even if the same particles arrive, their local spacing can expand or compress, which rescales density by a Jacobian factor. Because $$\Psi_{\Delta t}$$ is close to identity,

$$
\frac{\partial \Psi_{\Delta t}}{\partial \mathbf{x}}
=
\mathbf{I}+\Delta t\,\nabla_{\mathbf{x}}\mathbf{v}_t(\mathbf{x})
\quad\Longrightarrow\quad
\left|\det\frac{\partial \Psi_{\Delta t}^{-1}}{\partial \mathbf{x}}\right|
=
1-\Delta t\,\nabla_{\mathbf{x}}\cdot\mathbf{v}_t(\mathbf{x})+o(\Delta t).
$$

Putting these two pieces into one change-of-variable step,

$$
p_{t+\Delta t}(\mathbf{x})
=
p_t\!\left(\Psi_{\Delta t}^{-1}(\mathbf{x})\right)\,
\left|\det\frac{\partial \Psi_{\Delta t}^{-1}}{\partial \mathbf{x}}\right|,
$$

and keeping only first-order terms gives the clean update

$$
p_{t+\Delta t}(\mathbf{x})
=
p_t(\mathbf{x})
-\Delta t\,\nabla_{\mathbf{x}}\cdot\bigl(p_t(\mathbf{x})\,\mathbf{v}_t(\mathbf{x})\bigr)
+o(\Delta t).
$$

Now the limit $$\Delta t\to 0$$ is just the definition of a time derivative, yielding the *continuity equation*

<div style="background:rgba(255,165,0,0.12); padding:12px; border-radius:10px; max-width:100%; overflow-x:auto; overflow-y:hidden;">
$$
\frac{\partial p_t(\mathbf{x})}{\partial t}
=
-\nabla_{\mathbf{x}}\cdot\bigl(p_t(\mathbf{x})\,\mathbf{v}_t(\mathbf{x})\bigr).
$$
</div>




So nothing mysterious happened. It is the same change-of-variable idea, applied to many tiny bijections and then viewed in the continuous-time limit.

Physically, the continuity equation says that density changes only because probability mass *flows* across space. The backtracking part answers which mass reaches a location $$\mathbf{x}$$ after a small step, while the Jacobian part tells you whether that arriving mass gets diluted (local expansion) or concentrated (local compression). In the limit, these two effects combine into one net-outflow law as the continuity equation.

It is often helpful to name the quantity inside the divergence. The vector

$$
\mathbf{J}_{\text{adv}}(\mathbf{x},t)
:=
p_t(\mathbf{x})\,\mathbf{v}_t(\mathbf{x})
$$

is called the *advective flux*. Intuitively, it is "*density × speed*": how much probability is being carried past $$\mathbf{x}$$ per unit time.  With this notation, the continuity equation is just a local balance law:
> Density at $$\mathbf{x}$$ goes *up* when more probability flows *in* than flows *out*, and goes *down* when more flows *out* than flows *in*.

That "more in than out" statement is exactly what the $$-\nabla\!\cdot \mathbf{J}_{\text{adv}}$$ term encodes.

The time evolution of the density $$p_t$$, governed by the Fokker–Planck equation, can be visualized in the GIF below:

{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/fokker_planck_gmm_to_equilibrium.gif" class="img-fluid" %}



## Enter the Noise

So far we only had *pure motion*: each particle follows the deterministic flow $$\mathbf{v}_t$$, and density changes only because mass is carried from place to place. That is exactly what the continuity equation states. It is just the change-of-variable idea applied *continuously*: as points move, the density reshapes to conserve total probability.

The forward diffusion process keeps the same "move points, update density" picture, but adds one extra ingredient: each point also gets a tiny Gaussian jitter. If we take a cloud of particles and continuously give every particle a small random wiggle, the cloud becomes *more spread out* over time. Two particles that start very close will typically drift apart. As a result, probability does not only *shift* due to the drift; it also *spreads* from dense regions into nearby less-dense regions. This is what the extra noise term captures at the density level: it adds a second contribution to the flux that pushes mass from high density toward low density.



A convenient way to say this without changing the logic is: we still track density by the same conservation law, but now there are two ways mass can cross space. One is the usual "carried by motion" flow,

$$
\mathbf{J}_{\text{adv}}(\mathbf{x},t)
=
p_t(\mathbf{x})\,\mathbf{f}_t(\mathbf{x}),
$$

and the other is a "spreading" flow caused by the jitters, which pushes mass from high density to low density,

$$
\mathbf{J}_{\text{spread}}(\mathbf{x},t)
=
-\frac{1}{2}g^2(t)\,\nabla_{\mathbf{x}}p_t(\mathbf{x}).
$$

Add these two contributions, and apply the same net-outflow rule as in the continuity equation:

<div style="background:rgba(255,165,0,0.12); padding:12px; border-radius:10px; max-width:100%; overflow-x:auto; overflow-y:hidden;">
$$
\frac{\partial p_t(\mathbf{x})}{\partial t}
=
-\nabla_{\mathbf{x}}\cdot\Big(\mathbf{J}_{\text{move}}(\mathbf{x},t)+\mathbf{J}_{\text{spread}}(\mathbf{x},t)\Big)
=
-\nabla_{\mathbf{x}}\cdot\bigl(\mathbf{f}_t(\mathbf{x})\,p_t(\mathbf{x})\bigr)
+\frac{1}{2}g(t)^2\,\Delta_{\mathbf{x}}p_t(\mathbf{x}).
$$
</div>

This equation is the formal way to say: drift moves the probability cloud, and Gaussian jitters blur it.

Let us revisit how the change-of-variable story shows up inside diffusion models.

In diffusion models, no matter which viewpoint we take (DDPM, Score SDE, or Flow Matching), we first choose the forward noise-injection rule ourselves. Concretely, we fix Gaussian conditionals such as
$$
p(\mathbf{x}_t\mid \mathbf{x}_0)=\mathcal{N}(\mathbf{x}_t;\alpha_t\mathbf{x}_0,\sigma_t^2\mathbf{I}),
$$
which tells us what a clean sample looks like after we inject noise up to time $$t$$. That single choice pins down a whole movie of *snapshot marginals* $$p_t$$, starting at the data distribution and ending near a simple noise distribution. In continuous time, the density-level bookkeeping of this movie is captured by the Fokker–Planck equation: it is the change-of-variables rule for a cloud of particles that both moves and spreads. 

The reverse-time generation step is then built to play the same movie reversely. We start from noise and update the sample step by step (by solving the PF-ODE), while remaining consistent with *the same* snapshot path $$p_t$$ along the way.




---

# III. From Slow Samplers to Flow Maps

So far, everything we have discussed shares a common engineering drawback: *sampling is iterative*. Turning a single draw of Gaussian noise into a realistic sample typically requires dozens to hundreds of neural network evaluations, because we must integrate the reverse-time dynamics step by step.

This raises a natural question:

> Can we design a standalone generative principle that trains in a stable way, and samples quickly?

One promising answer is the family of **flow map models** <d-cite key="boffi2024flow"></d-cite>.

## What Is a Flow Map Model?

Recall the PF-ODE viewpoint: there exists an *ideal* drift field $$\mathbf{v}(\mathbf{x},t)$$ whose trajectories reproduce the prescribed snapshot marginals defined by the forward noising process. A deterministic sample path follows

$$
\frac{\mathrm{d}\mathbf{x}(u)}{\mathrm{d}u}
=
\mathbf{v}\bigl(\mathbf{x}(u),u\bigr).
$$

If we start from a state $$\mathbf{x}_s$$ at time $$s$$ and let the dynamics run until time $$t$$, the state lands at some new point $$\mathbf{x}_t$$. This "take me from $$s$$ to $$t$$" transformation is a *time-jump operator*: it tells us where a point ends up after evolving for a while. We call this operator the *flow map*, and write it as

$$
\Psi_{s\to t}(\mathbf{x}_s)
=
\mathbf{x}_s+\int_s^t \mathbf{v}\bigl(\mathbf{x}(u),u\bigr)\,\mathrm{d}u.
$$


{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/flow-map.svg" class="img-fluid" %}



It answers one concrete question: *starting from the current noisy state, where would the ideal dynamics place me at a later time?* Standard samplers approximate this jump by chaining many tiny solver steps. A flow map model tries to learn the jump *directly*:

$$
\mathbf{G}_\theta(\mathbf{x}_s,s,t)\approx \Psi_{s\to t}(\mathbf{x}_s).
$$

If we could query the true *time-jump* $$\Psi_{s\to t}$$, the training story would be almost too simple: we would just regress to the oracle target. Concretely, we would sample a start time $$s$$, an end time $$t$$, draw a point $$\mathbf{x}_s\sim p_s$$, and train a model $$\mathbf{G}_\theta$$ to predict where that point should land after evolving from $$s$$ to $$t$$:

<div style="background:rgba(255,165,0,0.12); padding:12px; border-radius:10px; max-width:100%; overflow-x:auto; overflow-y:hidden;">
$$
\mathcal{L}_{\text{oracle}}(\theta)
=
\mathbb{E}_{s,t}\,\mathbb{E}_{\mathbf{x}_s\sim p_s}
\Bigl[
w(s,t)d\bigl(\mathbf{G}_\theta(\mathbf{x}_s,s,t),\,\Psi_{s\to t}(\mathbf{x}_s)\bigr)
\Bigr].
$$
</div>

Here $$d(\cdot,\cdot)$$ is simply a distance-like measurement (e.g., MSE), and $$w(s,t)$$ is a time-weighting function. At the optimum, $$\mathbf{G}_\theta(\mathbf{x}_s,s,t)$$ would match the oracle jump $$\Psi_{s\to t}(\mathbf{x}_s)$$, so generation becomes a few large, accurate jumps rather than a long chain of tiny updates. In the most extreme case, we could even do one-step generation: first draw a prior sample $$\mathbf{x}_T \sim p_{\text{prior}}$$, then map it straight to data with

$$
\mathbf{G}_\theta(\mathbf{x}_T, T, 0).
$$

The snag is that $$\Psi_{s\to t}$$ is not available in closed form. So the real design problem is: *how do we create practical targets that still point toward the same oracle objective?* The cleanest guiding structure is a property that true flow maps must satisfy.

## Three Flow Map Families as Three "Handles" on the Same Oracle

### Consistency Models (CM) <d-cite key="song2023consistency"></d-cite>.
Since our end goal is a clean sample, CM fixes the terminal time at $$0$$ and only focuses on the special jumps $$\Psi_{s\to 0}$$. The ideal picture is straightforward: given a noisy state $$\mathbf{x}_s$$, we would like a denoiser that directly returns where the *true* dynamics would land at time $$0$$,

$$
\mathbf{f}_\theta(\mathbf{x}_s,s)\approx \Psi_{s\to 0}(\mathbf{x}_s).
$$

If that oracle target were available, training would reduce to plain regression: sample a time $$s$$, draw $$\mathbf{x}_s\sim p_s$$, and penalize the mismatch (with a time weight $$w(s)$$ and a distance-like measure $$d$$):

$$
\mathcal{L}_{\text{oracle-CM}}(\theta)
=
\mathbb{E}_{s}\,\mathbb{E}_{\mathbf{x}_s\sim p_s}
\Bigl[
w(s)\,d\bigl(\mathbf{f}_\theta(\mathbf{x}_s,s),\,\Psi_{s\to 0}(\mathbf{x}_s)\bigr)
\Bigr].
$$

But in practice the oracle flow map $$\Psi_{s\to 0}$$ is not something we can query. CM gets around this with one simple idea: *self-consistency*, which is really a flow-map property. Under standard ODE conditions, solutions are *unique*, so each initial state maps to a unique state at time $t$ by the flow map. Equivalently, flow maps must *compose*: going from $$s$$ to $$0$$ is the same as going from $$s$$ to $$s-\Delta s$$ and then from $$s-\Delta s$$ to $$0$$. As a result, any two states on the same trajectory, say $$\mathbf{x}_s$$ and its backstep $$\Psi_{s\to s-\Delta s}(\mathbf{x}_s)$$, must share the same endpoint at time $$0$$. This is exactly what we exploit to replace the missing oracle target with a stop-gradient *self-target* $$\mathbf{f}_{\theta^-}$$ computed from the nearby state closer to $$0$$:



$$
\Psi_{s\to 0}(\mathbf{x}_s)
\;\approx\;
\Bigl(\mathbf{f}_{\theta^-}(\Psi_{s\to s-\Delta s}(\mathbf{x}_s),\,s-\Delta s)\Bigr),
\qquad \Delta s>0.
$$

So the whole method boils down to one practical step: *how do we get a proxy $$\widehat{\mathbf{x}}_{s-\Delta s}$$ for the inaccessible backstep $$\Psi_{s\to s-\Delta s}(\mathbf{x}_s)$$?*  There are two standard routes.

In *distillation*, we obtain the intermediate state by explicitly taking one reverse-time solver step driven by a pre-trained diffusion teacher. Concretely, starting from the current state $$\mathbf{x}_s$$, we take

$$
\widehat{\mathbf{x}}_{s-\Delta s}
=
\text{one solver step using the teacher, from } s \text{ to } s-\Delta s
$$

meaning that $$\widehat{\mathbf{x}}_{s-\Delta s}$$ is the result of a single numerical update (e.g., Euler) from time $$s$$ to $$s-\Delta s$$ using the teacher diffusion model as the PF-ODE drift.




 In *from scratch* training, we build the intermediate state directly from the forward-corruption rule: if $$\mathbf{x}_s$$ was formed from the same clean sample $$\mathbf{x}_0$$ and noise $$\boldsymbol{\epsilon}$$, then we can reuse them to "rewind" to the slightly less-noisy time $$s-\Delta s$$:

$$
 \widehat{\mathbf{x}}_{s-\Delta s}
=
\alpha_{s-\Delta s}\mathbf{x}_0 + \sigma_{s-\Delta s}\boldsymbol{\epsilon}.
$$

Once we have this proxy point, CM training becomes a fully practical regression against a stop-gradient self-target, replacing the inaccessible oracle map inside the original objective.

### Consistency Trajectory Models (CTM) <d-cite key="kim2023consistency"></d-cite>.



CTM aims to learn the *general* flow map $$\Psi_{s\to t}$$, but it does so with an Euler-flavored parameterization that makes the model behave like a solver step. The starting point is the flow map form

$$
\Psi_{s\to t}(\mathbf{x}_s)=\mathbf{x}_s+\int_s^t \mathbf{v}(\mathbf{x}(u),u)\,\mathrm{d}u,
$$

and the key move is to rewrite this jump as a weighted blend of the input $$\mathbf{x}_s$$ and a residual term:

$$
\Psi_{s\to t}(\mathbf{x}_s)
=
\frac{t}{s}\,\mathbf{x}_s
+
\Bigl(1-\frac{t}{s}\Bigr)\,\mathbf{g}(\mathbf{x}_s,s,t),
\qquad
\mathbf{g}(\mathbf{x}_s,s,t)
:=
\mathbf{x}_s+\frac{s}{s-t}\int_s^t \mathbf{v}(\mathbf{x}(u),u)\,\mathrm{d}u.
$$

This motivates a solver-like parameterization for the learned jump:

$$
\mathbf{G}_\theta(\mathbf{x}_s,s,t)
:=
\frac{t}{s}\,\mathbf{x}_s
+
\Bigl(1-\frac{t}{s}\Bigr)\,\mathbf{g}_\theta(\mathbf{x}_s,s,t),
$$
where $$\mathbf{g}_\theta$$ is aimed to approximate the residual term $$\mathbf{g}(\mathbf{x}_s,s,t)$$:

$$
\mathbf{g}_\theta \approx \mathbf{g}.
$$

A nice side-effect is that the boundary condition comes for free. Plugging in $$t=s$$ makes the mixing weight vanish, so

$$
\mathbf{G}_\theta(\mathbf{x}_s,s,s)=\mathbf{x}_s,
$$

without any special constraint during training.

This parameterization is useful because the residual $$\mathbf{g}$$ has a clean meaning in the small-step limit. As $$t\to s$$, the flow-map integral collapses to an Euler-sized move, and $$\mathbf{g}(\mathbf{x}_s,s,t)$$ approaches

$$
\mathbf{g}(\mathbf{x}_s,s,t)
=
\mathbf{x}_s - s\,\mathbf{v}(\mathbf{x}_s,s) + \mathcal{O}(|t-s|).
$$

So learning $$\mathbf{g}$$ does two jobs at once: it supports *finite* jumps $$s\to t$$, and it also encodes the *instantaneous* drift through the infinitesimal limit. In particular, evaluating the network at "same time" gives a direct drift estimate,

$$
\mathbf{v}(\mathbf{x}_s,s)\;\approx\;\frac{\mathbf{x}_s-\mathbf{g}_\theta(\mathbf{x}_s,s,s)}{s}.
$$

This is why $$\mathbf{g}_\theta(\cdot,s,s)$$ matters in CTM: it acts as a local direction field that we can reuse to build short moves and form training targets.

CTM extends CM’s *self-consistency* into the natural flow-map principle called the *semigroup property*. The idea is simple: a long jump should agree with two shorter jumps stitched together. Concretely, for any intermediate time $$u$$ between $$s$$ and $$t$$, the true flow maps satisfy

$$
\Psi_{s\to t} \;=\; \Psi_{u\to t}\circ \Psi_{s\to u}.
$$


{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/semigroup.svg" class="img-fluid" %}

So CTM enforces the same idea with its learned map: a *big jump* should agree with *two smaller jumps* stitched at $$u$$. Since the oracle maps are unavailable, CTM uses a stop-gradient self-target:

$$
\Psi_{s\to t}(\mathbf{x}_s)
\;\approx\;
\mathbf{G}_{\theta^-}\Bigl(\Psi_{s\to u}(\mathbf{x}_s),\,u,\,t\Bigr),
$$

Finally, $$\Psi_{s\to u}(\mathbf{x}_s)$$ can be approximated in two ways. In *distillation*, we compute it by running a few solver steps of a pre-trained diffusion teacher, starting from $$\mathbf{x}_s$$ and integrating from time $$s$$ to time $$u$$:

$$
\Psi_{s\to u}(\mathbf{x}_s) \approx \text{few solver steps using the pre-trained diffusion teacher, from } s \text{ to } u.
$$

In *from scratch* training, because $$\mathbf{g}_\theta(\cdot,s,s)$$ reproduces the instantaneous drift of PF-ODE, we approximate $$\Psi_{s\to u}(\mathbf{x}_s)$$ using CTM itself by rolling out a short self-teacher trajectory driven by the local drift implied by $$\mathbf{g}_\theta(\cdot,s,s)$$:

$$
\Psi_{s\to u}(\mathbf{x}_s) \approx \text{few solver steps using } \mathbf{g}_\theta(\cdot,s,s) \text{ from } s \text{ to } u.
$$

{% include figure.liquid path="assets/img/2026-04-27-tracing-principles-behind-modern-diffusion-models/ctm-target.svg" class="img-fluid" %}



### Mean Flow (MF) <d-cite key="geng2025mean"></d-cite>.
MF keeps the same end goal of fast, accurate jumps for learning the *general* flow map $$\Psi_{s\to t}$$, but it changes *what* the network predicts and *how* it is trained compared to CTM. Instead of outputting the endpoint jump directly, MF asks for an *average integration* over the interval, which we can view as the average slope of the flow map:


$$
\mathbf{h}(\mathbf{x}_s,s,t)
:=
\frac{1}{t-s}\int_s^t \mathbf{v}\bigl(\mathbf{x}(u),u\bigr)\,\mathrm{d}u,
\qquad
\mathbf{h}_\theta(\mathbf{x}_s,s,t)\approx \mathbf{h}(\mathbf{x}_s,s,t).
$$

Once we have this slope-like quantity, the jump is recovered by a simple reconstruction:

$$
\Psi_{s\to t}(\mathbf{x}_s)\approx \mathbf{x}_s+(t-s)\,\mathbf{h}_\theta(\mathbf{x}_s,s,t).
$$

This is often *easier to learn* in practice: predicting an average drift is like learning a reliable slope that can be reused across different step sizes, instead of chasing a single fragile endpoint.

MF still needs supervision, so the question is how to build a usable target for $$\mathbf{h}$$. The key is a small calculus fact. Starting from the definition

$$
(t-s)\,\mathbf{h}(\mathbf{x}_s,s,t)=\int_s^t \mathbf{v}\bigl(\mathbf{x}(u),u\bigr)\,\mathrm{d}u,
$$

we differentiate both sides with respect to the start time $$s$$. Two things then happen at once: the interval length changes, and the starting state $$\mathbf{x}_s$$ itself slides along the trajectory with

$$
\frac{\mathrm{d}}{\mathrm{d}s}\mathbf{x}_s=\mathbf{v}(\mathbf{x}_s,s).
$$

Putting these together yields an identity that expresses the average slope in terms of the *instantaneous drift* at $$s$$, plus correction terms involving the derivatives of $$\mathbf{h}$$:

$$
\mathbf{h}(\mathbf{x}_s,s,t)
=
\mathbf{v}(\mathbf{x}_s,s)
-
(s-t)\Bigl(
\mathbf{v}(\mathbf{x}_s,s)\,\partial_{\mathbf{x}} \mathbf{h}(\mathbf{x}_s,s,t)
+
\partial_{s} \mathbf{h}(\mathbf{x}_s,s,t)
\Bigr).
$$

This is the *MF identity* handle: it turns an integral quantity into a local relation we can enforce during training.

Therefore, MF turns the MF identity into a practical training signal by *freezing* the derivative terms with a stop-gradient copy $$\mathbf{h}_{\theta^-}$$. This gives us a usable proxy for the oracle mean flow $$\mathbf{h}$$:

$$
\mathbf{h}(\mathbf{x}_s,s,t)
\approx 
\mathbf{v}(\mathbf{x}_s,s)
-
(s-t)\Bigl(
\mathbf{v}(\mathbf{x}_s,s)\,\partial_{\mathbf{x}} \mathbf{h}_{\theta^-}(\mathbf{x}_s,s,t)
+
\partial_{s} \mathbf{h}_{\theta^-}(\mathbf{x}_s,s,t)
\Bigr).
$$

MF still needs the oracle instantaneous drift $$\mathbf{v}(\mathbf{x}_s,s)$$. In practice we plug in an estimate $$\widehat{\mathbf{v}}(\mathbf{x}_s,s)$$ in one of two ways. With (i) *distillation*, a pre-trained diffusion model provides this velocity estimate. With (ii) *from scratch* training, we use the forward-corruption rule itself: if $$\mathbf{x}_s$$ was generated from a clean sample $$\mathbf{x}_0$$ using the same noise draw $$\boldsymbol{\epsilon}$$, then the conditional mean path implies a closed-form velocity at time $$s$$, giving a direct estimate

$$
\widehat{\mathbf{v}}(\mathbf{x}_s,s)=\alpha_s'\mathbf{x}_0 +\sigma_s' \boldsymbol{\epsilon}.
$$

Putting these together yields MF’s final regression target, a fully practical proxy for $$\mathbf{h}(\mathbf{x}_s,s,t)$$:

$$
\mathbf{h}_{\theta^-}^{\text{tgt}}(\mathbf{x}_s,s,t)
:=
\widehat{\mathbf{v}}(\mathbf{x}_s,s)
-
(s-t)\Bigl(
\widehat{\mathbf{v}}(\mathbf{x}_s,s)\,\partial_{\mathbf{x}} \mathbf{h}_{\theta^-}(\mathbf{x}_s,s,t)
+
\partial_{s} \mathbf{h}_{\theta^-}(\mathbf{x}_s,s,t)
\Bigr).
$$





## How the Three Flow Map Models Relate <d-cite key="lai2025principles"></d-cite>

CTM contains CM as a special anchored case. If CTM always fixes the terminal time to $$t=0$$, then it only needs to learn the maps $$\Psi_{s\to 0}$$, which is exactly the CM setting.

More broadly, CTM and MF are *mathematically related*: they aim at the same oracle flow map, but they choose different parameterizations of the same jump. One way to see this is to rewrite the same map $$\Psi_{t\to s}(\mathbf{x}_t)$$ in two equivalent-looking forms:

$$
\Psi_{t\to s}(\mathbf{x}_t)
=
\frac{s}{t}\mathbf{x}_t
+
\frac{t-s}{t}\underbrace{\Bigl[\mathbf{x}_t+\frac{t}{t-s}\int_t^s \mathbf{v}(\mathbf{x}_u, u)\,\mathrm{d}u\Bigr]}_{\approx\,\mathbf{g}_\theta}
=
\mathbf{x}_t
+
(s-t)\underbrace{\Bigl[\frac{1}{s-t}\int_t^s \mathbf{v}(\mathbf{x}_u, u)\,\mathrm{d}u\Bigr]}_{\approx\,\mathbf{h}_\theta}.
$$

Beyond being *mathematically related* at the level of parameterization, CTM and MF objectives are also connected. We start from the raw squared error

$$
\bigl\|\mathbf{G}_\theta(\mathbf{x}_t,t,s)-\Psi_{t\to s}(\mathbf{x}_t)\bigr\|_2^2.
$$

Using the CTM parameterization and a matching oracle decomposition, we have

$$
\mathbf{G}_\theta(\mathbf{x}_t,t,s)
=
\frac{s}{t}\mathbf{x}_t+\frac{t-s}{t}\,\mathbf{g}_\theta(\mathbf{x}_t,t,s),
\qquad
\Psi_{t\to s}(\mathbf{x}_t)
=
\frac{s}{t}\mathbf{x}_t+\frac{t-s}{t}\Bigl(\mathbf{x}_t+\frac{t}{t-s}\int_t^s \mathbf{v}(\mathbf{x}_u,u)\,\mathrm{d}u\Bigr).
$$

The common base term $$\frac{s}{t}\mathbf{x}_t$$ cancels, so the squared error factors into a scale term and a residual mismatch:

$$
\bigl\|\mathbf{G}_\theta(\mathbf{x}_t,t,s)-\Psi_{t\to s}(\mathbf{x}_t)\bigr\|_2^2
=
\Bigl(\frac{t-s}{t}\Bigr)^2
\Bigl\|
\mathbf{g}_\theta(\mathbf{x}_t,t,s)
-
\Bigl(\mathbf{x}_t+\frac{t}{t-s}\int_t^s \mathbf{v}(\mathbf{x}_u,u)\,\mathrm{d}u\Bigr)
\Bigr\|_2^2.
$$

To relate this to MF, we consider the following network re-parametrization 

$$
\mathbf{g}_\theta(\mathbf{x}_t,t,s):=\mathbf{x}_t-t\,\mathbf{h}_\theta(\mathbf{x}_t,t,s).
$$

Inside the norm, the $$\mathbf{x}_t$$ terms cancel again, leaving an error purely in the averaged quantity:

$$
\Bigl\|
\mathbf{g}_\theta(\mathbf{x}_t,t,s)
-
\Bigl(\mathbf{x}_t+\frac{t}{t-s}\int_t^s \mathbf{v}(\mathbf{x}_u,u)\,\mathrm{d}u\Bigr)
\Bigr\|_2^2
=
t^2\Bigl\|
\mathbf{h}_\theta(\mathbf{x}_t,t,s)
-
\Bigl(\frac{1}{s-t}\int_t^s \mathbf{v}(\mathbf{x}_u,u)\,\mathrm{d}u\Bigr)
\Bigr\|_2^2.
$$

Multiplying by the prefactor gives

$$
\bigl\|\mathbf{G}_\theta(\mathbf{x}_t,t,s)-\Psi_{t\to s}(\mathbf{x}_t)\bigr\|_2^2
=
(t-s)^2
\Bigl\|
\mathbf{h}_\theta(\mathbf{x}_t,t,s)
-
\Bigl(\frac{1}{s-t}\int_t^s \mathbf{v}(\mathbf{x}_u,u)\,\mathrm{d}u\Bigr)
\Bigr\|_2^2.
$$

In words, CTM measures error in "residual coordinates" $$\mathbf{g}_\theta$$, while MF measures error in "average-slope coordinates" $$\mathbf{h}_\theta$$. The algebra shows these objectives are *mathematically related*, differing only by a time-dependent scaling of scale $$t^2$$.


Flow map models all target the same underlying object: the *oracle flow map* $$\Psi_{s\to t}$$ that moves probability mass along the ideal PF-ODE. What differs is *which handle* we use to learn that map without ever querying it directly. The punchline is that CM, CTM, MF are not three unrelated recipes. They are three ways to learn the same oracle flow map using different parameterizations and different self-contained training signals. In practice, this is exactly how we turn "many tiny solver steps" into "a few accurate jumps" while staying faithful to the same density-evolution story we started from: move particles, conserve probability, and learn the map that performs the transport.






---


# Conclusion: One Story, Many Lenses, and the Road to Fast Generators

Modern diffusion models can look like a zoo of acronyms, but the underlying story is surprisingly simple. At heart, they are all ways to *transport probability mass* from a simple Gaussian distribution to the complicated data distribution progressively. Once you see generation as a *moving cloud of particles*, the math stops being mysterious: it is really just different forms of *time-varying change-of-variables*. 

From there, variational based, score-based, and flow-based diffusions differ less than their names suggest. They all *choose the same forward Gaussian snapshots* and then ask the network to predict *different but equivalent handles* on the reverse-time dynamics. What makes training workable in all three cases is the same move: the *conditional trick*. We replace an intractable marginal target (reverse kernel / score / velocity under $$p_t$$) with a tractable conditional target under $$p(\mathbf{x}_t\mid \mathbf{x}_0)$$, turning challenging problems into "solve a supervised regression problem".

But diffusion’s classic payoff, high-fidelity samples, comes with a classic cost: *iterative sampling*. If we must integrate the reverse dynamics in many small steps, generation stays slow. Flow map models push the same diffusion template one step further: instead of learning *infinitesimal* updates and then integrating them, they aim to learn *time-jumps* of the PF-ODE directly. In other words, they try to approximate the map $$\Psi_{s\to t}$$ itself, so we can replace long chains of tiny steps with a handful of large, accurate jumps. CM, CTM, and MF are three concrete "handles" on this idea: each enforcing underlying flow-map structures to manufacture practical targets when the oracle flow map is unavailable.

Stepping back, the big takeaway is optimistic: diffusion models are not a single method, but a *principle for building generators* from a prescribed forward path. Once we commit to "choose a forward corruption, then learn its reverse transport", there is room for many designs that trade off *stability*, *fidelity*, and *speed*. Flow maps are one promising direction, but likely not the last word. The exciting open space is to keep the same clean backbone: we define a forward transport process, and change-of-variables tells us how the distribution moves. Then we look for new *parameterizations* and *objectives*, which  and make *fast generation* as reliable as the best step-by-step samplers.

