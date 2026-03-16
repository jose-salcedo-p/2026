---
layout: distill
title: Diffusion as Infinite Hierarchical VAEs - Do Diffusion Models Generalize Better than Deep VAEs?
description: This blogpost unifies Diffusion Models and Variational Autoencoders. We demonstrate that DPMs are mathematically equivalent to Hierarchical VAEs (HVAEs) in the limit of infinite depth. By analyzing this architectural link, we explain why diffusion models avoid the posterior collapse that plagues deep VAEs and identify the sweet spot for generalization where these models perform best.
date: 2026-04-27
future: true
htmlwidgets: true
hidden: true

# Mermaid diagrams
mermaid:
  enabled: true
  zoomable: true

authors:
 - name: François Bertholom
   url: ""
   affiliations:
     name: Institute Polytechnique de Paris, Télécom SudParis SAMOVAR
 - name: Khalid Oublal
   url: ""
   affiliations:
     name: Institute Polytechnique de Paris, Telecom Paris LTCI/S2A, École Polytechnique, CMAP

# must be the exact same name as your blogpost
bibliography: 2026-04-27-generalization-in-diffusion-as-infinite-hvae.bib


# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: 1. Background
    url: "#1-background"
  - name: 2. Hierarchical Variational Auto-Encoders
    url: "#2-hierarchical-variational-auto-encoders"
    sections:
      - name: 2.1 Variational Auto-Encoders (VAEs)
        url: "#21-variational-auto-encoders-vaes"
      - name: 2.2 Hierarchical Variational Auto-Encoders
        url: "#22-hierarchical-variational-auto-encoders"
  - name: 3. Denoising Diffusion Probabilistic Models (DDPMs)
    url: "#3-denoising-diffusion-probabilistic-models-ddpms"
  - name: 4. Continuous-time limit
    url: "#4-continuous-time-limit"
    sections:
      - name: 4.1 The score-matching view of diffusion
        url: "#41-the-score-matching-view-of-diffusion"
      - name: 4.2 Infinite depth limit of HVAEs
        url: "#42-infinite-depth-limit-of-hvaes"
      - name: 4.3 Continuous-time ELBO
        url: "#43-continuous-time-elbo"
      - name: 4.4 Generalization Capabilities
        url: "#44-generalization-capabilities"
  - name: 5. Concluding Remarks
    url: "#5-concluding-remarks"


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
        border-left: 7px solid rgb(171, 74, 9);
        border-radius: 1px;
    }
    d-article .box-note {
        background-color:rgba(100, 4, 255, 0.03);
        border-left-color:rgb(118, 20, 255);
    }

  .caption {
    color: gray;
    font-style: italic;
  }


  .slider-example-focus {
    /*
      The style below isn't necessary.
      It has been added for the sake of smoothness.
    */
    transition: box-shadow 200ms ease-in-out;
  }

  .slider-example-focus:focus {
    outline: none;
    box-shadow: 0px 0px 15px 5px #0c5d10;
  }

  details summary {
    cursor: pointer;
    color: rgb(118, 20, 255); /* Dodger Blue */
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.3s, color 0.3s;
  }

  details[open] summary {
    background-color: #e6f0ff; /* light blue when open */
  }

  details summary:hover {
    color: rgb(118, 20, 255); /* darker blue on hover */
    background-color: #cce0ff;
  }


  # a[href^="#"] {
  #   color: rgb(255, 119, 0) !important;
  #   font-style: italic;
  #   text-decoration: none !important;
  # }

  # a[href^="#"]:hover {
  #   text-decoration: underline !important;
  # }


---

## 1. Motivations

Diffusion Probabilistic Models (DPMs) have largely eclipsed Variational Auto-Encoders (VAEs) as the gold standard for high-fidelity generative modeling. Yet, treating them as rival paradigms obscures a deeper theoretical continuity. In this post, we explain that DPMs are not a departure from VAEs, but rather their ultimate expression: they are rigorously equivalent to properly parameterized Hierarchical VAEs (HVAEs) in the limit of infinite depth with a fixed, noise-injecting inference process.  We evaluate these models on three benchmark datasets—CIFAR-10, CelebA, and ImageNet—as well as the CERA weather dataset <d-cite key="ridal2024cerra"></d-cite>, to illustrate both image and spatio-temporal generalization. There is a fascinating, established connection between the theoretical foundations of deep VAEs and score-based generative modeling with Stochastic Differential Equations. By conceptually unifying the different views on this theory, we want to show that this architectural limit is not just a mathematical artifact, but a largely untapped resource with massive potential to better understand modern generative modeling.

To provide an intuitive sense of these differences in reconstruction quality, we compare the output of HVAEs and DDPMs against the ground truth using interactive sliders. These sliders allow readers to visually assess how model depth or diffusion steps affect fidelity in both natural and structured data domains:

<script defer src="https://cdn.jsdelivr.net/npm/img-comparison-slider@8/dist/index.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/img-comparison-slider@8/dist/styles.css"/>

<style>
  .slider-row {
    /* Ensures all 4 sliders stay on one line */
    display: flex;
    gap: 10px; /* Reduced gap slightly */
    justify-content: center;
    align-items: flex-start;
    margin: 10px 0;
  }

  .slider-box {
    /* Adjusted width to ensure 4 boxes fit (4 x 23% = 92% + gaps) */
    width: 23%; 
    max-width: 280px; /* Increased max width slightly for better viewing */
    position: relative;
  }

  /* Slider size + style */
  img-comparison-slider {
    height: 180px;
    
    --divider-width: 6px;                     
    --divider-color: rgb(255, 255, 255);       
    --default-handle-color: rgb(255, 255, 255);

    outline: none;
    box-shadow: none;

    /* Optional: shadow around divider for white edges */
    filter: drop-shadow(0 0 10px white) drop-shadow(0 0 0.5px white);
  }

  /* Remove blue border on click/focus */
  img-comparison-slider::part(divider) {
    box-shadow: 0 10px 0 10px white; /* white edges around divider */
    border-radius: 100px;          /* slightly rounded */
  }

  img-comparison-slider:focus,
  img-comparison-slider *:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  .caption-small {
    text-align: center;
    font-size: 0.75em;
    color: gray;
    font-style: italic;
    margin-top: 3px;
  }

  /* Overlay labels on images */
  .slider-label {
    position: absolute;
    top: -30px;
    left: 0;
    width: 50%;
    text-align: center;
    font-size: 0.7em;
    font-weight: bold;
    color: rgb(64, 64, 64);
    pointer-events: none; /* do not block slider drag */
  }
  .slider-label.right {
    left: 50%;
  }
</style>

<br>
<div class="slider-row">
  <div class="slider-box">
    <div class="slider-label">HVAE (k=8)</div>
    <div class="slider-label right">GT</div>
    <img-comparison-slider>
      <img slot="first" width="100%" src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/slider_2.png' | relative_url }}">
      <img slot="second" width="100%" src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/slider_GT_1.png' | relative_url }}">
    </img-comparison-slider>
    <div class="caption-small"> HVAE (k=8) vs Ground-truth (GT)</div>
  </div>

  <div class="slider-box">
    <div class="slider-label">HVAE (k=32)</div>
    <div class="slider-label right">GT</div>
    <img-comparison-slider>
      <img slot="first" width="100%" src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/slider_2.png' | relative_url }}">
      <img slot="second" width="100%" src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/slider_GT_1.png' | relative_url }}">
    </img-comparison-slider>
    <div class="caption-small"> HVAE (k=32) vs Ground-truth (GT)</div>
  </div>

  <div class="slider-box">
    <div class="slider-label">DDPM (T=100)</div>
    <div class="slider-label right">GT</div>
    <img-comparison-slider>
      <img slot="first" width="100%" src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/slider_4.png' | relative_url }}">
      <img slot="second" width="100%" src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/slider_GT_1.png' | relative_url }}">
    </img-comparison-slider>
    <div class="caption-small">DDPM (T=100) vs Ground-truth (GT)</div>
  </div>

  <div class="slider-box">
    <div class="slider-label">DDPM (T=1000)</div>
    <div class="slider-label right">GT</div>
    <img-comparison-slider>
      <img slot="first" width="100%" src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/slider_5.png' | relative_url }}">
      <img slot="second" width="100%" src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/slider_GT_1.png' | relative_url }}" >
    </img-comparison-slider>
    <div class="caption-small"> DDPM (T=1000) vs Ground-truth (GT)</div>
  </div>
</div>


## 2. Hierarchical Variational Auto-Encoders

### 2.1 Variational Auto-Encoders (VAEs)

Since their introduction in 2014 by <d-cite key="kingma2013auto, rezende2014stochastic"></d-cite>, Variational Auto-Encoders (VAE) have revolutionized the field of Variational Inference (VI) and have had a broad impact in many areas of machine learning. A VAE operates in a *latent variable model*, defined by a joint density $p_{\theta}(x, z) = p_{\theta}(x \mid z)p(z)$. Here, $z$ denotes the latent variables with a prior density $p(z)$, and $p_{\theta}(x \mid z)$ is the observation model, or likelihood.

A key challenge in Bayesian inference is to learn the posterior $p_{\theta}(z \mid x)=p_{\theta}(x, z)/p_{\theta}(x)$. This density is often intractable due to the normalizing constant $p_{\theta}(x)$. VI introduces a parametric family of distributions $\{q_{\phi}(z \mid x):\phi\in\Phi\}$, referred to as the inference model or approximate posterior, and tries to find the parameter $\phi$ that yields the best approximation of the true posterior $p_{\theta}(z \mid x)$. The quality of the approximation is quantified by a divergence measure, often the reverse Kullback-Leibler (KL) divergence. Minimizing the reverse KL divergence between the approximate posterior and the true posterior is equivalent to maximizing the Evidence Lower Bound (ELBO), $-\mathcal{L}(\theta, \phi; x)$, which also serves as a tractable lower bound to the marginal likelihood:

$$
\begin{equation}
    \label{eq:elbo}
    \log p_{\theta}(x) \geq -\mathcal{L}(\theta, \phi; x) = \mathbb{E}_{q_{\phi}(z \mid x)}[\log p_{\theta}(x \mid z)] - D_{\mathrm{KL}}(q_{\phi}(z \mid x) \,\|\, p(z)).
\end{equation}
$$

VAEs crucially learn both the inference model $q_{\phi}(z \mid x)$ and the generative model $p_{\theta}(x \mid z)$ at the same time. This makes them particularly versatile on a variety of tasks, e.g., finding a meaningful latent representation of the data, approximating a complex posterior distribution, or learning a generative model. In this blogpost, we are interested in the latter (see [Figure 1](#fig-overview) for an overview).



<figure id="fig:overview" class="caption">
  <img 
    src="{{ '/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/diffusion_vs_hvae_v2.png' | relative_url }}" 
    alt="Overview of Diffusion and HVAE" 
    style="max-width:100%;height:auto;"
  >
  <div class="caption">
    <strong>Figure 1:</strong> An overview of HVAE and Diffusion. While HVAEs (left) rely on a finite depth of hierarchical latents for generation, Diffusion models (right) unfold this process over time, effectively operating as an HVAE with infinitely many layers sharing the same parameters.
  </div>
</figure>

While this is an elegant formulation, a single layer of Gaussian latents is often insufficient to capture the complex nature of high-dimensional data like natural images.


### 2.2 Hierarchical Variational Auto-Encoders.

To enhance the expressivity of both the generative model and the inference model, a natural extension of the VAE framework is to consider a hierarchy of latent variables $z = \{z_1, \dots, z_T\}$. Following the formulation of Hierarchical VAEs (HVAEs) <d-cite key="sonderby2016ladder, vahdat2020nvae"></d-cite>, the joint distribution factorizes in a top-down fashion. We define $z_T$ as the highest-level latent variable and $z_0 = x$ as the observed data:

$$
\begin{equation}
    p_{\theta}(z_0, z_{1:T}) = p(z_T) \prod_{t=1}^{T} p_{\theta}(z_{t-1} \mid z_t).
\end{equation}
$$

In this formulation, the generative process creates a cascade of conditional dependencies from the latent $z_T$ down to the data $z_0$.

Consistent with this structure, we define the inference model as a bottom-up factorization, conditioning each latent layer on the previous one:

$$
\begin{equation}
    q_{\phi}(z_{1:T} \mid z_0) = q_{\phi}(z_1 \mid z_0) \prod_{t=2}^{T} q_{\phi}(z_t \mid z_{t-1}).
\end{equation}
$$

**The Hierarchical ELBO.** By substituting these factorized forms into the general ELBO definition, 

$$
\mathcal{L}(\theta, \phi; z_0) = \mathbb{E}_{q_{\phi}(z_{1:T} \mid z_0)} \left[ \log p_{\theta}(z_0, z_{1:T}) - \log q_{\phi}(z_{1:T} \mid z_0) \right],
$$ 

we can derive a layer-wise objective. Grouping the terms by time step $t$ reveals the following structure:

$$
\begin{align}\label{eq:elbo-hvae}
    \mathcal{L}_{\mathrm{HVAE}}(\theta, \phi, z_0) &= \mathbb{E}_{q_{\phi}} [\log p_{\theta}(z_0 \mid z_1)] \\
    & - \sum_{t=2}^T \mathbb{E}_{q_{\phi}} [D_{\mathrm{KL}}(q_{\phi}(z_t \mid z_{t-1}) \,\|\, p_{\theta}(z_{t-1} \mid z_t))] \nonumber \\ 
    & - D_{\mathrm{KL}}(q_{\phi}(z_T \mid z_0) \,\|\, p(z_T)). \nonumber
\end{align}
$$


<aside class="l-body box-note" markdown="1">
This decomposition reveals three distinct structural components of the loss function:

* **1. Reconstruction:**  The first term of Eq. \eqref{eq:elbo-hvae} measures how well the model can reconstruct the original data from the latent variable $z_1$, encouraging accurate generation.

* **2. Consistency Terms:**  $\sum D_{\mathrm{KL}}(q_{\phi}(z_t \mid z_{t-1}) \,\|\, p_{\theta}(z_{t-1} \mid z_t))$ encourages the generative transitions $p_{\theta}(z_{t-1} \mid z_t)$ to match the inference transitions $q_{\phi}(z_t \mid z_{t-1})$, ensuring smooth flow along the latent trajectory.

* **3. Prior Matching:**  $D_{\mathrm{KL}}(q_{\phi}(z_T \mid z_0) \,\|\, p(z_T))$ aligns the final latent distribution with the prior, similar to the standard VAE, to regularize the deepest latent representation.
</aside>

<br>


**Optimization Challenges.** Despite the theoretical advantages of hierarchical latent spaces, training deep HVAEs (where $T \gg 1$) presents significant difficulties. <d-cite key="vahdat2020nvae"></d-cite> and <d-cite key="huang2021variational"></d-cite> highlight several critical issues:

  * *Posterior Collapse (Generalization issue).* This is the most pervasive failure mode in autoregressive and hierarchical models. The generative model effectively decouples from the deep latent variables, causing the approximate posterior $q_{\phi}(z_t \mid z_{t-1})$ to collapse to the prior $p_{\theta}(z_t \mid z_{t-1})$. This can reduce the effective depth of the model.
  
  * *Training Instability.* Maximizing the ELBO involves balancing the reconstruction term against a sum of KL divergence terms. As the hierarchy deepens, this optimization becomes unstable due to the difficulty of aligning the encoder and decoder distributions across multiple stochastic layers. Achieving stable convergence often requires specific architectural interventions, such as spectral regularization or residual parameterizations <d-cite key="vahdat2020nvae"></d-cite>.

  * *Reconstruction Quality.* VAEs are known to produce blurry samples when modeling high-dimensional data like images. This is largely attributed to the definition of the observation model $p_{\theta}(z_0 \mid z_1)$ (typically a factorized Gaussian), where the maximization of the log-likelihood is equivalent to minimizing a squared $L^2$ norm. This metric is insensitive to high-frequency spatial structures.

On the task of generative modeling, Diffusion Models <d-cite key="sohl2015deep"></d-cite>, <d-cite key="ho2020denoising"></d-cite>, and <d-cite key="song2020score"></d-cite> have emerged as the prime framework to perform high-fidelity generation, achieving both quality and variety of the samples.


## 3. Denoising Diffusion Probabilistic Models (DDPMs)

The core idea behind diffusion models is to define a fixed process that destroys data, and to learn the reversal of this process. We adopt the formalism of Ho et al. (2020) <d-cite key="ho2020denoising"></d-cite>.

**The Forward Process.** In contrast to VAEs, which learn the approximate posterior parameters, Denoising Diffusion Probabilistic Models (DDPMs) <d-cite key="ho2020denoising"></d-cite> define a *fixed* inference process. This forward process is a Markov chain $q(z_{1:T} \mid z_0)$ that gradually adds Gaussian noise to the data $z_0$ according to a pre-defined variance schedule $\beta_1, \dots, \beta_T$:

$$
\begin{equation}
    q(z_t \mid z_{t-1}) = \mathcal{N}(z_t; \sqrt{1-\beta_t} z_{t-1}, \beta_t \mathbf{I}).
\end{equation}
$$

A critical advantage of using Gaussian transitions is that the composition of linear Gaussian kernels remains Gaussian. This allows us to marginalize out the intermediate steps $z_{1:t-1}$ and derive a closed-form distribution for $z_t$ conditioned directly on the input $z_0$. By defining $\bar{\alpha}_t = \prod_{s=1}^t (1-\beta_{s})$, we get
$$
\begin{equation}
    q(z_t \mid z_0) = \mathcal{N}(z_t; \sqrt{\bar{\alpha}_t} z_0, (1-\bar{\alpha}_t) \mathbf{I}).
\end{equation}
$$

This property renders the sampling of $z_t$ computationally tractable at any arbitrary timestep $t$ without the need to iteratively simulate the chain. It will be instrumental in optimizing the training objective.

**The Reverse Process and Parameterization.**

The generative model is defined as a reverse Markov chain $p_{\theta}(x_{0:T})$ which learns to revert the diffusion process. Starting from a standard Gaussian prior $p(x_T) = \mathcal{N}(x_T; 0, \mathbf{I})$, the transitions are modeled as Gaussian distributions:

$$
\begin{equation}
    p_{\theta}(z_{t-1} \mid z_t) = \mathcal{N}(z_{t-1}; \mu_{\theta}(z_t, t), \Sigma_{\theta}(z_t, t)).
\end{equation}
$$

While the variances $\Sigma_{\theta}$ are often fixed according to a predefined schedule, the means $\mu_{\theta}$ must be learned.



<details>
  <summary>Click here for details about DDPM derivation complement</summary>
  <div markdowk="1">
  To derive an efficient parameterization for $\mu_{\theta}$, we observe that the true posterior of the forward process, conditioned on $x_0$, is a tractable Gaussian: 
  
  $$
  \begin{equation}\label{eq:mu_theta}
      q(x_{t-1} \mid x_t, x_0) = \mathcal{N}(x_{t-1}; \tilde{\mu}_t(x_t, x_0), \tilde{\beta}_t \mathbf{I}).
  \end{equation}
  $$

  Crucially, the mean of this true posterior can be expressed as 
  
  $$\tilde{\mu}_t(x_t, x_0) = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{\beta_t}{\sqrt{1 - \bar{\alpha}_t}} \varepsilon \right),$$
  
  where we reparameterize $x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\varepsilon$, with $\varepsilon\sim\mathcal{N}(0, \mathbf{I})$. Motivated by this functional form, <d-cite key="ho2020denoising"></d-cite> propose parameterizing the model mean $\mu_{\theta}$ by estimating the noise component directly via a neural network $\varepsilon_{\theta}(x_t, t)$ (typically a U-Net <d-cite key="ronneberger2015u"></d-cite>).

  </div>
</details>

<br>

**The Variational Lower Bound.** The reverse process is typically learned by optimizing the ELBO. By expanding the joint factorization, the objective writes:

$$
\begin{equation*}
    \mathcal{L}_{\mathrm{DDPM}}(\theta) = -\mathbb{E}_q\!\left[\log\frac{p_{\theta}(z_{0:T})}{q(z_{1:T} \mid z_0)}\right] = \mathbb{E}_{q}\!\left[ -\log p(z_T) - \sum_{t=1}^T \log \frac{p_{\theta}(z_{t-1} \mid z_t)}{q(z_t \mid z_{t-1})} \right].
\end{equation*}
$$

Here, the expectations are taken with respect to $q(z_{1:T}\,|\,z_0)$, averaged over the empirical data distribution, i.e., $q(z_{0:T})=q(z_0)\,q(z_{1:T}\,|\,z_0)$. A key insight in diffusion models is that the forward process posterior $q(z_{t-1} \mid z_t, z_0)$ is tractable when conditioned on $z_0$. Using Bayes' rule, we can rewrite the forward transition as $q(z_t \mid z_{t-1}) = \frac{q(z_t \mid z_{t-1}, z_0) q(z_{t-1} \mid z_0)}{q(z_t \mid z_0)}$. Substituting this into the objective allows us to decompose the loss into three interpretable terms:

$$
\begin{align}\label{eq:elbo-dpm}
    \mathcal{L}_{\mathrm{DPM}}(\theta) &= \underbrace{D_{\mathrm{KL}}(q(z_T \mid z_0) \,||\, p(z_T))}_{L_T} \\ 
    & + \sum_{t=2}^T \underbrace{D_{\mathrm{KL}}(q(z_{t-1} \mid z_t, z_0) \,||\, p_{\theta}(z_{t-1} \mid z_t))}_{L_{t-1}} \\ \nonumber
    & - \underbrace{\log p_{\theta}(z_0 \mid z_1)}_{L_0}. \nonumber
\end{align}
$$

This decomposition highlights an exact structural parallel with the HVAE objective Eq. \eqref{eq:elbo-hvae}:

  * **$L_T$ (Prior Matching):** Analogous to the top-level KL in HVAEs. In the DPM framework, this term contains no learnable parameters and is effectively constant during training.
  
  * **$L_{t-1}$ (Consistency):** These terms are the core optimization objective. They force the learned reverse transition $p_\theta(z_{t-1} \mid z_t)$ (the generative step) to match the tractable posterior $q(z_{t-1} \mid z_t, z_0)$.
  
  * **$L_0$ (Reconstruction):** This term represents the likelihood of the data given the first latent variable, directly mirroring the reconstruction loss in standard VAEs.
  

This is the first layer of understanding diffusion models as HVAEs. We will see in the next section that diffusion models can be interpreted as infinitely deep HVAEs where the encoder is fixed.


## 4. Continuous-time limit
### 4.1 The score-matching view of diffusion


**Simplification to Denoising Score Matching.** Although Eq. \eqref{eq:elbo-dpm} provides the bound, optimizing it directly is often suboptimal for sample quality. By substituting the parameterization of $\mu_{\theta}$ from Eq. \eqref{eq:mu_theta}, the consistency term reduces to

$$
\begin{equation}
    L_{t-1} \propto \mathbb{E}_{z_0, \varepsilon} \left[ \lambda_t \| \varepsilon - \varepsilon_{\theta}(z_t, t) \|^2 \right],
\end{equation}
$$

where $\propto$ denotes equality up to an additive constant, and $\lambda_t$ is a complicated weighting function derived from the variance schedule. <d-cite key="ho2020denoising"></d-cite> empirically demonstrates that discarding this weighting term (i.e., setting $\lambda_t = 1$) improves sample generation. This leads to the simplified objective used in practice:

$$
\begin{equation}
    \label{eq:loss-simple}
    \mathcal{L}_{\mathrm{simple}}(\theta) = \mathbb{E}_{t, z_0, \varepsilon} \left[ \| \varepsilon - \varepsilon_{\theta}(\sqrt{\bar{\alpha}_t}z_0 + \sqrt{1 - \bar{\alpha}_t}\varepsilon, t) \|^2 \right].
\end{equation}
$$



This simplified objective is equivalent to denoising score matching over multiple noise scales <d-cite key="vincent2011connection, song2020score"></d-cite>. Indeed, the true score of the conditional distribution

$$q(z_t \mid z_0) = \mathcal{N}(z_t; \sqrt{\bar{\alpha}_t} z_0, (1-\bar{\alpha}_t) \mathbf{I}),$$

is analytically tractable: $\nabla_{z_t} \log q(z_t \mid z_0) = -\frac{z_t - \sqrt{\bar{\alpha}_t}z_0}{1-\bar{\alpha}_t} = -\frac{\varepsilon}{\sqrt{1-\bar{\alpha}_t}}$. This means we can train a model to effectively learn this score function.


**Continuous-Time Formulation: The SDE Perspective.**
The connection between diffusion models and score matching becomes explicit when we consider the limit of infinite timesteps, $T \to +\infty$. In this regime, the discrete transitions converge to a continuous-time Stochastic Differential Equation (SDE).  <d-cite key="song2020score"></d-cite> formalize the forward process as an Itô SDE:

$$
\begin{equation}\label{eq:forward-sde}
    \mathrm{d} z= f(z,t)\mathrm{d} t + g(t)\mathrm{d} w.
\end{equation}
$$

where $f(z, t)$ is the drift coefficient, $g(t)$ is the diffusion coefficient, and $w$ represents a standard Wiener process. As time $t$ flows from $0$ to $T$, this SDE transforms the data distribution $p_0$ into the prior distribution $p_T$.

A result by <d-cite key="anderson1982reverse"></d-cite> guarantees that for any forward SDE, there exists a corresponding reverse-time SDE given by:

$$
\begin{equation}
    \label{eq:reverse-sde}
    \mathrm{d} z = \left[f(z, t) - g(t)^2 \nabla_z \log q_t(z)\right] \mathrm{d} t + g(t) \mathrm{d} \bar w,
\end{equation}
$$

where $d\bar w$ is a standard Wiener process when time flows backwards from $T$ to $0$, and $\nabla_z\log q_t(z)$ denotes the score function of the forward marginal density at time $t$.


To generate data, we must simulate Eq. \eqref{eq:reverse-sde}. Since the drift and diffusion coefficients are chosen by design, the only unknown quantity is the score function. Therefore, the learning objective is to train a time-dependent neural network $s_{\theta}(z, t)$ to approximate the true score:

$$
\begin{equation}
    s_{\theta}(z, t) \approx \nabla_z \log q_t(z).
\end{equation}
$$

Optimization is performed via score matching, in the sens of Fisher divergence minimization. This recovers the DDPM noise prediction objective as explained above.


### 4.2 Infinite depth limit of HVAEs

Tzen et al. (2019) <d-cite key="tzen2019neural"></d-cite> proves that, under the right conditions, the characterization of diffusion models as infinite-depth HVAEs can be formalized in a rigorous way. 

We already saw that HVAEs define a hierarchy of latent variables $z = \{z_1, \dots, z_T\}$. Let us associate the layer index $k$ with a time $t_k = k/T \in [0,1]$ and define the step size $\Delta t = 1/T$. When layers are built as residual blocks (see [Figure 1](#fig-overview)), each new layer of the HVAE does the following operation, which can be viewed as an Euler-Maruyama discretization:

$$
\begin{equation}
    z_{t_{k-1}} = z_{t_k} + f_{\theta}(z_{t_k}, t_k)\Delta t + g_{\theta}(z_{t_k}, t_k) \sqrt{\Delta t} \, \varepsilon_k,
\end{equation}
$$

where $\varepsilon_k \sim \mathcal{N}(0, \mathbf{I})$ are standard Gaussian vectors, and $f_{\theta}(z_{t_k}, t_k)$ (resp. $g_{\theta}(z_{t_k}, t_k)$) is the mean (resp. standard deviation) of the decoder $p_{\theta}(z_{t-1} \mid z_t)$.



**Latent prior.** As $T \to \infty$ and $\Delta t \to 0$, the most critical aspect becomes the transformation of the latent prior. In an HVAE, the randomness comes from the *independent* noise vectors $\{\varepsilon_1, \dots, \varepsilon_T\}$. Invoking Donsker's Theorem, <d-cite key="tzen2019neural"></d-cite> identify that the partial sums of these scaled noise vectors converge to a Wiener process.


Consequently, the latent space changes from a high-dimensional Euclidean space $\mathbb{R}^{d\times T}$ to the Wiener space of continuous paths equipped with the Wiener measure.

The generative model then becomes the solution to the Itô SDE driven by this Wiener process:

$$
\begin{equation}\label{eq:hvae-sde}
    \mathrm{d} z_t = f_{\theta}(z_t, t)\mathrm{d} t + g_{\theta}(z_t, t)\mathrm{d} \bar{w}_t.
\end{equation}
$$

<figure id="fig:layer-variance" class="caption">
  <div class="l-page">
    <iframe
      src="{{ 'assets/html/2026-04-27-generalization-in-diffusion-as-infinite-hvae/layer_time_correspondence_interactive.html' | relative_url }}"
      frameborder="0"
      scrolling="no"
      height="400px"
      width="100%"
    ></iframe>
  </div>
  <div class="caption">
  <strong>Figure 2:</strong> Comparison of hierarchical variance profiles between HVAE and DDPM across three datasets (CIFAR-10, CelebA, ImageNet-32). HVAE exhibits discrete, step-like increases in perceptual sample variance across layers, while DDPM shows a smooth, continuous increase over diffusion time. The shaded region highlights the approximate transition zone where both models reach intermediate variance levels.
  </div>
</figure>


[Figure 2](#fig:layer-variance), illustrates the structural parallel between the discrete latent hierarchy of HVAEs and the continuous time horizon of DPMs. To quantify the semantic contribution of each stage, we utilize the Learned Perceptual Image Patch Similarity (LPIPS) metric <d-cite key="zhang2018unreasonable"></d-cite>, as pixel-wise MSE is insufficient for capturing high-level semantic emergence.


The plot reveals three key behaviors:

- **Continuous vs. Discrete Dynamics:** The DDPM trajectory (solid blue line) acts as the continuous limit of the HVAE's discrete layering (dashed orange steps).
  
- **The Semantic Phase Transition:** Both models exhibit a sigmoidal rise in perceptual variance within the normalized depth window $x \in [0.35, 0.55]$. This region marks the transition where the generative process shifts from resolving low-frequency global structure (abstract priors) to high-frequency textural details.
  
- **Feature Saturation:** The plateau near $x \to 1$ suggests that the deepest layers (or earliest diffusion times) contribute minimally to perceptual changes, aligning with the "dead layer" phenomenon observed in deep generative stacks <d-cite key="kingma2021variational"></d-cite>.



**Mapping to Diffusion Models.**  In an HVAE, $f_{\theta}$ is a single neural network learning the full drift of the generative trajectory. In diffusion models, however, the reverse drift has a precise structure, as seen in Eq. \eqref{eq:reverse-sde}. We can identify the HVAE decoder $f_{\theta}$ to the composite drift term in Eq. \eqref{eq:reverse-sde}, where the true score is replaced by $s_{\theta}(z, t)$:

$$
\begin{equation}
    f_{\theta}(z, t) \leftrightarrow f(z, t) - g(t)^2 s_{\theta}(z, t).
\end{equation}
$$

It is also important to note that the general infinite-depth HVAE learns both the drift $f_{\theta}$ and the diffusion coefficient $g_{\theta}$. On the other hand, DPMs fix the diffusion coefficient to a scalar schedule $g_{\theta}(z, t) \equiv g(t)$.

### 4.3 Continuous-time ELBO

We have established that structurally, infinitely deep HVAEs are equivalent to diffusion models when parameterized correctly. However, this does not provide insight into the optimization procedure itself. How do we define the ELBO for a model with infinite layers?

A bottom-up derivation that bridges the discrete HVAE loss and the continuous diffusion objective is provided by <d-cite key="kingma2021variational"></d-cite>. By viewing the layer index $t$ as a continuous variable, the ELBO simplifies into an integral over the Signal-to-Noise Ratio (SNR).


**Derivation Sketch.** Before we provide a sketch of the continuous-time ELBO derivation, it is important to note that parameterizing the model to predict the clean data $\hat{z}_\theta$ 

is equivalent to predicting the nois $\varepsilon_\theta$ (or the score $s_{\theta}$). 

Indeed, these quantities are simply related by affine transformations. The $\hat{z}_\theta$ parameterization is more convenient for the analysis presented below.

We begin with the diffusion loss term from Eq. \eqref{eq:elbo-hvae}: 

$$
\mathcal{L}_T = \sum_{t=1}^T \mathbb{E}_{q}[D_{\mathrm{KL}}(q(z_{s} \mid z_t, z_0) \,\|\, p_{\theta}(z_{s} \mid z_t))],
$$

where $s = t - \Delta t$. We let $\{\gamma_t\}$ and $\{\sigma_t^2\}$ be such that $q(z_t \mid z_0) = \mathcal{N}(z_t; \gamma_t z_0, \sigma_t^2 I)$, and define the Signal-to-Noise Ratio (SNR) as $\mathrm{SNR}(t) = \gamma_t^2 / \sigma_t^2$. This is a strictly monotonic decreasing function of $t$.

The key insight relies on how the posterior $q(z_s \mid z_t, z_0)$ and the transition $p_{\theta}(z_s \mid z_t)$ are parameterized. As $\Delta t \to 0$, both distributions are Gaussians with matched variances $\sigma^2$. Therefore, the KL divergence between these two distributions has a simple closed form. <d-cite key="kingma2021variational"></d-cite> deduce the following relation:

$$
\begin{equation}
    D_{\mathrm{KL}}(q(z_{s} \mid z_t, z_0) \,\|\, p_{\theta}(z_{s} \mid z_t)) = \frac{1}{2} (\mathrm{SNR}(s) - \mathrm{SNR}(t)) \|z_0 - \hat{z}_{\theta}(z_t, t) \|_2^2.
\end{equation}
$$

We sum these terms over all timesteps $t$ and take the limit as $T \to \infty$ (implying $\Delta t \to 0$). The finite difference term, $\mathrm{SNR}(s) - \mathrm{SNR}(t)$, converges to $-\mathrm{SNR}'(t) \mathrm{d} t$, and the discrete sum converges to a Riemann integral:
$$
\begin{equation}
    \label{eq:vdm_obj}
    \mathcal{L}_{\infty}(\theta; z_0) = \frac{1}{2} \, \mathbb{E}_{t \sim \mathcal{U}(0,1)} \left[ -\mathrm{SNR}'(t) \|z_0 - \hat{z}_{\theta}(z_t, t) \|_2^2 \right] + C,
\end{equation}
$$

where $C$ is a constant irrelevant to the optimization. This formulation reveals that the continuous-time ELBO is invariant to the noise schedule, depending only on the SNR values at the endpoints. Indeed, we can perform the change of variables $v = \mathrm{SNR}(t)$. We have $\mathrm{d}v = \mathrm{SNR}'(t) \mathrm{d}t$, and we can swap the integration bounds from $[0, 1]$ to $[\mathrm{SNR}(1), \mathrm{SNR}(0)]$. We deduce:

$$
\mathcal{L}_{\infty}(\theta; z_0) = \frac{1}{2} \int_{\mathrm{SNR}(1)}^{\mathrm{SNR}(0)} \| z_0 - \hat{z}_{\theta}(z_v) \|^2 \mathrm{d}v+C.
$$

<figure id="fig:fig_vlb_invariance" class="caption">
  <img 
    src="{{'/assets/img/2026-04-27-generalization-in-diffusion-as-infinite-hvae/vlb_invariance_multi_dataset.png' | relative_url }}"
    alt="Variational lower bound (VLB)"
    style="max-width: 100%; height: auto; image-rendering: auto;">
  <div class="caption">
      <strong>Figure 3:</strong> Variational lower bound (VLB) trajectories for three datasets (CIFAR-10, CelebA, ImageNet-32) under different noise schedules: Linear, Cosine, and Quadratic. Although the VLB progression differs across datasets and schedules, all curves converge to a similar final value, demonstrating the invariance of the ultimate sample variance across both datasets and noise schedules.
  </div>
</figure>


This property reinforces the interpretation of diffusion models as continuous-time HVAEs. In discrete HVAEs, the ELBO value is determined by the total information content rather than the granularity of the layers; the KL regularization terms simply redistribute along the hierarchy without altering their integral. Diffusion models exhibit an identical mechanism: changing the noise schedule (e.g., to linear, cosine, or sigmoid) merely reparameterizes the temporal variable $t$ without modifying the endpoints $x_0$ and $x_T$. Consequently, the VLB is a function of the *geometry* of the latent trajectory, not its specific temporal speed. We empirically validate this invariance in [Figure 3](#fig:fig_vlb_invariance). The left panel reports the VLB calculated on *CIFAR-10* across varying noise schedules, while the right panel tracks the cumulative KL divergence. While different schedules alter the density of the KL divergence over time, the total integral (VLB) remains constant, confirming the continuous-time HVAE hypothesis.

#### Alternative view with the Girsanov Theorem
<dt-cite key="huang2021variational"></dt-cite> instead define the generative model itself as a continuous-time SDE. Assume that the data has density $p_{\theta}(z_0)$, and that the intermediate states $(z_t)_{0\leq t\leq T}$ satisfy the same Itô SDE as in Eq. (17), $\mathrm{d}z_t = f_\theta(z_t, t)\mathrm{d}t + g(t)\mathrm{d}\bar{w}_t$, such that the distribution of $z_t$ converges to a given prior $p$ as $t\to T$. Likelihood-based optimization in this model requires evaluating $\log p_\theta(z_0)$. The Feynman-Kac formula <dt-cite key="huang2021variational" after="Theorem 1"></dt-cite> allows us to represent this density as an expectation over all possible paths of a latent Brownian motion. However, integrating out infinite-dimensional Brownian paths is completely intractable. To solve this, the authors treat the Brownian motion as an infinite-dimensional latent variable, effectively creating an infinitely deep VAE over the noise paths.

Just as a standard VAE requires an encoder to map data to latent codes, we must construct an inference SDE to map the data into these paths. This is achieved by introducing a new (learnable) drift vector $a_{\theta}(z_t, t)$. The Girsanov theorem <dt-cite key="huang2021variational" after="Theorem 2"></dt-cite> gives an exact expression to track how probability measures change under additive perturbations. This leads to a continuous-time ELBO, denoted as $\mathcal{E}^\infty$:
$$\log p_\theta(z_0) \ge \mathcal{E}^\infty = \mathbb{E} \left[ \log p(z_T) - \int_0^T \nabla \cdot f_\theta \, \mathrm{d}t - \frac{1}{2} \int_0^T \|a_{\theta}(z_t, t)\|_2^2 \, \mathrm{d}t \right]$$
This inequality mathematically holds for any valid choice of $a_{\theta}$ (provided that certain non-restrictive technical conditions hold). Intuitively, the term that features $a_{\theta}$ acts exactly like the KL divergence penalty in an HVAE.

At this point, it is natural to ask what choice of $a$ optimizes this bound. It turns out that if we set $a_{\theta}(z_t, t)=g(t) s_\theta(z_t, t)$, where $s_{\theta}$ is a neural network approximating the score function, with the parameterization $f_{\theta}(z, t)=f(z, t)-g(t)^2s_{\theta}(z, t)$ as in (18), then the inner integrand of the continuous-time ELBO is
$$\nabla\cdot f_{\theta}+\frac{1}{2} \|a\|_2^2=\nabla\cdot(g^2s_{\theta}-f)+\frac{1}{2} \|g s_\theta\|_2^2=\frac{1}{2}g^2\left(2\nabla\cdot s_{\theta}+\|s_\theta\|^2\right)-\nabla\cdot f.$$
Notice that the last term does not depend on $\theta$, hence only the first two terms contribute to the loss function. Using Fubini's theorem to change the integration order, it is not hard to show that this loss function at one given timestep $t$ is actually
$$\mathbb{E}\!\left[\frac{1}{2} g(t)^2 \| s_\theta(z_t, t) - \nabla_{z_t} \log q_t(z_t) \|_2^2 \right].$$
We give the general idea for the derivation, assuming $z\in\mathbb{R}$ for simplicity. Expanding the squared norm, $\| s_\theta - \nabla_z \log q_t \|_2^2=\|s_{\theta}\|_2^2+\|\nabla_z\log q_t\|_2^2-2\langle s_\theta, \nabla_{z} \log q_t\rangle$, where $\langle\cdot, \cdot\rangle$ denotes the canonical inner-product. Note that the second term has no dependency on $\theta$. We focus on the inner-product term in the total expectation. Using the identity $\nabla_z\log q_t=(\nabla_z q_t)/q_t$, the bilinearity of the inner product, and integrating by parts, we get
$$\int \langle s_{\theta}, \nabla_z\log q_t\rangle\,\mathrm{d} q_t=\int\langle s_{\theta}(z), \nabla_zq_t(z)\rangle\,\mathrm{d}z=\Big[s_{\theta}(z) q(z)\Big]_{-\infty}^{+\infty}-\int(\nabla\cdot s_{\theta})\,\mathrm{d}q_t=-\int(\nabla\cdot s_{\theta})\,\mathrm{d}q_t.$$
Plugging this into the previous formula shows the equivalence between the two loss functions. Now, this clearly relates to the previous expression for $\mathcal{L}_{\infty}$, since learning the score is to learning clean data prediction. The SDE's diffusion coefficient $g(t)^2$ acts as the continuous-time weighting function, corresponding exactly to $-\mathrm{SNR}'(t)$. Thus, whether evaluating the continuous limit of a discrete HVAE or using the change of measure to track density across SDEs, we optimize the same objective in the end.

<figure id="fig:trajectories_level_noise" class="caption">
  <div class="l-page">
    <iframe
      src="{{ 'assets/html/2026-04-27-generalization-in-diffusion-as-infinite-hvae/trajectories_level_noise_interactive_weather.html' | relative_url }}"
      frameborder="0"
      scrolling="no"
      height="450px"
      width="900px"
    ></iframe>
  </div>
  <div class="caption">
  <strong>Figure 4:</strong> Drag the slider to sweep the time index $t$ and inspect how the image generation of weather evolve across the reverse process of diffusion.
  </div>
</figure>
<br>


### 4.4 Generalization Capabilities

In a recent work, <d-cite key="chen2025generalization"></d-cite> provide key insights into the generalization properties of VAEs and DPMs. While we have seen that DPMs can be viewed as HVAEs with $T\to+\infty$, <d-cite key="chen2025generalization"></d-cite> argue that increasing the depth of the model is not necessarily ideal for generalization.


They identify a trade-off involving the diffusion time $T$:

- *Small $T$:* the model behaves like a shallow VAE where the encoder dominates, potentially leading to overfitting (memorization).  
- *Large $T$:* the encoder's influence vanishes (as the signal becomes pure noise), but the generator's burden increases.

This suggests that while the *architectural* equivalence exists in the limit, the *optimal operating point* for a generative model lies at a finite depth, a sweet spot where the model balances structural guidance (encoder) with texture synthesis (generator).




<table>
  <thead>
    <tr style="background-color: rgb(118, 20, 255); color: white; text-align: center;">
      <th>Time ($T$)</th>
      <th>Encoder Error</th>
      <th>Generator Error</th>
      <th>Total Bound</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center;">0.20</td>
      <td style="text-align:center;">0.532 ± 0.017</td>
      <td style="text-align:center;">0.158 ± 0.008</td>
      <td style="text-align:center;">0.690 ± 0.018</td>
    </tr>
    <tr>
      <td style="text-align:center;">0.50</td>
      <td style="text-align:center;">0.279 ± 0.011</td>
      <td style="text-align:center;">0.250 ± 0.014</td>
      <td style="text-align:center;">0.528 ± 0.016</td>
    </tr>
    <tr>
      <td style="text-align:center;"><strong>0.75</strong></td>
      <td style="text-align:center;"><strong style="color: rgb(118, 20, 255);">0.172 ± 0.008</strong></td>
      <td style="text-align:center;"><strong style="color: rgb(118, 20, 255);">0.326 ± 0.016</strong></td>
      <td style="text-align:center;"><strong style="color: rgb(118, 20, 255);">0.498 ± 0.018</strong></td>
    </tr>
    <tr>
      <td style="text-align:center;">1.00</td>
      <td style="text-align:center;">0.115 ± 0.010</td>
      <td style="text-align:center;">0.401 ± 0.018</td>
      <td style="text-align:center;">0.516 ± 0.018</td>
    </tr>
    <tr>
      <td style="text-align:center;">1.50</td>
      <td style="text-align:center;">0.071 ± 0.006</td>
      <td style="text-align:center;">0.544 ± 0.020</td>
      <td style="text-align:center;">0.615 ± 0.019</td>
    </tr>
    <tr>
      <td style="text-align:center;">2.00</td>
      <td style="text-align:center;">0.057 ± 0.005</td>
      <td style="text-align:center;">0.698 ± 0.040</td>
      <td style="text-align:center;">0.756 ± 0.041</td>
    </tr>
  </tbody>
</table>

<strong>Table 1:</strong> Quantitative analysis of the Generalization Trade-off w.r.t Diffusion Time $T$. The Total Bound reaches its minimum (the "Sweet Spot") at $T=0.75$. At low $T$, the Encoder is unstable, while at high $T$, the Generator becomes the primary source of variance.
<br>


<table>
  <thead>
    <tr style="background-color: rgb(118, 20, 255); color: white; text-align: center;">
      <th>Model</th>
      <th>Type</th>
      <th>CIFAR-10</th>
      <th>CelebA</th>
      <th>ImageNet 32×32</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>NVAE, L=8</td><td>VAE</td><td>3.20</td><td>4.05</td><td>4.50</td></tr>
    <tr><td>NVAE, L=18</td><td>VAE</td><td>3.05</td><td>3.95</td><td>4.30</td></tr>
    <tr><td>NVAE, L=32</td><td>VAE</td><td>2.97</td><td>3.92</td><td>4.20</td></tr>
    <tr><td>NVAE, L=64</td><td>VAE</td><td>2.93</td><td>3.90</td><td>4.10</td></tr>
    <tr><td>NVAE, L=128</td><td>VAE</td><td><strong style="color: rgb(118, 20, 255);">2.91</strong></td><td>3.88</td><td>4.05</td></tr>
    <tr><td>DDPM [Ho et al., 2020]</td><td>Diffusion</td><td>3.10</td><td>3.69</td><td>3.95</td></tr>
    <tr><td>EBM-DRL [Gao et al., 2020]</td><td>Diffusion</td><td>3.05</td><td>3.18</td><td>3.90</td></tr>
    <tr><td>Score SDE [Song et al., 2021b]</td><td>Diffusion</td><td>2.99</td><td>3.25</td><td>3.85</td></tr>
    <tr><td>Improved DDPM [Nichol and Dhariwal, 2021]</td><td>Diffusion</td><td>2.94</td><td>3.54</td><td>3.80</td></tr>
    <tr><td>LSGM [Vahdat et al., 2021]</td><td>Diffusion</td><td>2.87</td><td>3.30</td><td>3.75</td></tr>
    <tr><td>ScoreFlow [Song et al., 2021a] (variational bound)</td><td>Diffusion</td><td>2.90</td><td>3.50</td><td>3.86</td></tr>
    <tr><td>ScoreFlow [Song et al., 2021a] (continuous norm. flow)</td><td>Diffusion</td>
        <td><strong style="color: rgb(118, 20, 255);">2.83</strong></td>
        <td><strong style="color: rgb(118, 20, 255);">2.80</strong></td>
        <td><strong style="color: rgb(118, 20, 255);">3.76</strong></td>
    </tr>
  </tbody>
</table>
<strong>Table 2:</strong> Benchmarking NVAE variants versus Diffusion Models. Bits per dimension (BPD) on CIFAR-10 and ImageNet test sets. NVAE variants differ by the number of hierarchical layers $L$.

<br>

## 5. Concluding Remarks

In this post, we have seen the different ways in which the gap between two dominant generative paradigms is bridged in the literature. Diffusion Probabilistic Models are in fact not distinct from Variational Auto-Encoders, but they are equivalent to Hierarchical VAEs in the limit of infinite depth under the right parameterization. This shift in perspective from discrete layers to continuous time resolves the critical bottlenecks that have historically limited deep VAEs:

- **Solving Posterior Collapse:** By fixing the encoder to a noise-injection process (the forward diffusion), DPMs bypass the optimization instability where the encoder ignores the latent code.
- **Generalization "Sweet Spot":** Diffusion can be viewed as an infinite-depth HVAE, which helps explain the gap between Diffusion and standard VAEs observed in our results. While the theory holds in the infinite limit ($T\to\infty$), recent insights suggest that optimal generalization often emerges at a finite depth. The balance between the encoder’s structural constraints and the generator’s texture synthesis yields an optimal operating point for sample quality, one that diffusion models naturally pass through.

Moreover, it gives a principled justification to the efficacy of latent diffusion, and more generally any method that plugs a VAE at the ends of a diffusion model.

Ultimately, bridging the gap between Diffusion Models and HVAEs offers a promising path to better understanding how cutting-edge generative models treat and organize information. This paves the way for future architectural innovations, improved computational efficiency by figuring out efficient finite-depth sweet spots, and refined generation through precise latent space control.

**Limitations** While the HVAE perspective illuminates the structure of diffusion models, it remains an idealized view: real models operate at finite depth, introducing discretization gaps that depart from the continuous-time theory. The fixed forward process, although stabilizing, also limits encoder flexibility and may fail to capture richer posterior structures. Moreover, diffusion models still suffer from high computational cost due to their iterative sampling and rely on hand-designed noise schedules that are not guaranteed to be optimal for every dataset.
