---
layout: distill
title: Performative Prediction made practical
description: Performative Prediction studies settings where deploying a model induces a distribution shift in the data with the aim of building robust and good-performing models under these post-deployment effects. Most existing work in this area is theoretical and relies on strict assumptions to converge to those models, making the resulting techniques difficult to apply in practice and limiting their accessibility to the broader Machine Learning (ML) community. In this blog post, we use visualization techniques 1) to provide an intuitive explanation of Performative Prediction and 2) to extract practical insights for studying convergence when theoretical assumptions do not hold.
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
  - name: Javier Sanguino Bautiste
    url: https://fjsanguino.github.io
    affiliations:
      name: Basque Center for Applied Mathematics (BCAM)
  - name: Thomas Kehrenberg
    url: https://tmke8.github.io/
    affiliations:
      name: BCAM
  - name: Carlos Rosety
    url: https://www.linkedin.com/in/carlosrosety/
    affiliations:
      name: Independent Researcher
  - name: Jose A. Lozano
    affiliations:
      name: BCAM & University of the Basque Country UPV/EHU
  - name: Novi Quadrianto
    affiliations:
      name: University of Sussex & BCAM

# must be the exact same name as your blog post
bibliography: 2026-04-27-performative-prediction.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Deployed model = Happy ML engineer?
  - name: Introduction - Performative Prediction is a two-step iterative process
    subsections:
      - name: How to measure the performance of the model, then?
      - name: Visualizing the decoupled risk
  - name: Interest points of Performative Prediction
    subsections:
      - name: The new visualization inspires a redefinition of the interest points
  - name: How to reach them? Optimization in Performative Prediction
    subsections:
      - name: Algorithms that converge to the stable point
      - name: Algorithms that converge to the optimal point
      - name: Visualization of the algorithms in the decoupled risk landscape
  - name: Practical insights in real-world experiments
  - name: To open a discussion on future directions of the field
  - name: Conclusion


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

## Deployed model = Happy ML engineer?
You are an ML engineer working at a bank. You build a model to grant loans by predicting whether an applicant is likely to default. The model performs extremely well on your test set. The company deploys it, and in the first weeks, everything looks great — the model performs just as expected. You receive congratulations, and you feel proud of a job well done.

But… a few months later, performance starts to drop. Repeat applicants have begun adjusting their financial profiles just enough to get approved. They have learned how to game your model. As a result, the reapplicants your system sees no longer resemble those in your training data. Simply by deploying your model, you have changed the data distribution. In other words, **deploying your model has triggered a distribution shift**.

Once an ML model is deployed, it undoubtedly has an effect in the real world. Yet, this effect has been largely overlooked in ML, as deployment is often the _final_ step of the ML pipeline. If we want models to perform reliably in practice, post-deployment effects must be accounted for.

This scenario has been formalized in the field of *Performative Prediction*, <d-cite key="perdomo2020performative"></d-cite> which studies situations when deploying a model $\theta$<d-footnote>Throughout the text, we use $\theta$ to refer both to the model parameters and to the model itself.</d-footnote>  changes the data distribution. In Performative Prediction, these distribution changes have been formalized with a *distribution map* $\mathcal{D}(\theta)$, a function from the parameter space to the set of probability distributions $\mathcal{P}$ over data $\mathcal{X} \times \mathcal{Y}$. 

$$
\begin{aligned}
\mathcal{D} :\; & \Theta \longrightarrow \mathcal{P} (\mathcal{X} \times \mathcal{Y}) \\
      &  \: \theta  \longmapsto \mathcal{D}(\theta)
\end{aligned}
$$

This formulation contrasts with the classical ML setup, where one assumes a fixed data distribution $\mathcal{Q}$. In Performative Prediction, however, each deployment of the model induces a shift in the data distribution. After this shift occurs, the model must be retrained, but the newly trained model, once deployed, triggers yet another distribution change. This creates an iterative feedback loop between model training and distribution shift, which is the defining characteristic of the performative setting.

{% include figure.liquid path="assets/img/2026-04-27-performative-prediction/ML vs PP.svg" class="img-fluid" %}

Whereas the main objective in classical ML is to find a model that minimizes the risk under a fixed data distribution, Performative Prediction presents a more intricate challenge because the model itself affects the distribution. In this setting, one can seek a *stable* model that has the same risk before and after deployment, i.e., is robust to the distribution shift. One may also seek an *optimal* model, which is the model that produces the lower risk after deployment. We will formalize these notions later.

Published works in Performative Prediction have mainly adopted a theoretical perspective, relying on strict assumptions to ensure guarantees for the convergence of optimization algorithms to stable or optimal points. However, these assumptions significantly narrow the scope of problems that can be solved. This can be surprising, since the motivation of the field is intrinsically practical — it concerns what happens after a model is put into production. Another issue with this is that although Performative Prediction is now a well-recognized framework for studying the effects of deployment, its technical details remain relatively unknown to the broader ML community. 

Through visualization, this blog post aims to make the technical details of performative prediction more accessible to the broader ML community and to provide insights to support more practical research that emerges directly from these visualizations. Specifically, our goals are:

1. To introduce Performative Prediction as a two-step iterative process, an intuitive interpretation that naturally reveals the structure of the optimization landscape, and to explain how this landscape can be visualized (Section [Introduction](#introduction-performative-prediction-is-a-two-step-iterative-process)).
   
2. To use the visualization to describe the two interest points of Performative Prediction (stable and optimal points) and reformulate them (Section [Interest Points](#interest-points-of-performative-prediction)), and to visualize the trajectories of different optimization algorithms, developing intuition for why they converge (Section [Optimization in Performative Prediction](#how-to-reach-them-optimization-in-performative-prediction)).

3. To show how this reformulation of the interest points can be practically used in experimental settings that fall outside the usual theoretical assumptions, illustrating their value in more realistic scenarios (Section [Practical insights in experiments](#practical-insights-in-real-world-experiments)). As part of pushing Performative Prediction forward, we also reflect on the future of its practical research, hoping to spark a discussion within the community about its current limitations and emerging opportunities (Section [Future directions of the field](##to-open-a-discussion-on-future-directions-of-the-field)).

To support practical research, we also make available [*PerformativeGym*](https://github.com/wearepal/performativeGYM), a small library that implements the main algorithms used in Performative Prediction. 

## Introduction: Performative Prediction is a two-step iterative process

In order to characterize the feedback loop between the model and the data distribution, Performative Prediction can be described as an iterative process. Before the process begins, we have an initial data distribution, which we use to train the first model $\theta^{(1)}$. Some time after deployment, the world will react to the model, causing a distribution shift. The data will then follow a new probability distribution given by $\mathcal{D}(\theta^{(1)})$. In each subsequent iteration, we <span style="color:#8DA0CB"> 1) obtain a model $$\theta^{(t+1)}$$ trained on the data distribution $$\mathcal{D}(\theta^{(t)})$$</span> and <span style="color:#E5C494">2) deploy it, causing the distribution to shift to $$\mathcal{D}(\theta^{(t+1)})$$</span>. This distribution shift is inherent to model deployment, i.e., it happens because of the mere deployment of the model and is unavoidable.

{% include figure.liquid path="assets/img/2026-04-27-performative-prediction/Iteration.svg" class="img-fluid" %}

Classical ML reports the performance of the model after training. But this is not enough in Performative Prediction due to the distribution shift. The fact that the environment reacts to the model makes it difficult to evaluate its performance. 

### How to measure the performance of the model, then?

In Performative Prediction, we can consider two risks when evaluating a model $\theta^{(t+1)}$: the risk of the model under the learned distribution $\mathcal{D}(\theta^{(t)})$, which reflects its training performance; and the risk of the same model under the new distribution $\mathcal{D}(\theta^{(t+1)})$, which captures its performance after the distribution shift and is ultimately the more informative quantity. The <em>decoupled performative risk</em> $\mathcal{DPR}(\cdot, \cdot)$ allows us to measure both. For clarity, we will introduce the notation $$\theta_M$$ to refer to the parameters of the model we want to evaluate and $$\theta_D$$ to refer to the parameters of the model that defines the data distribution $\mathcal{D}(\theta_D)$.

$$ \mathcal{DPR}(\theta_D, \theta_M) := \mathbb{E}_{(x,y) \sim \mathcal{D}(\theta_D)} \big[\ell(\theta_M; x, y)\big], $$

where $$\ell(\theta_M; x, y)$$ is the loss function of the model $$\theta_M$$ on the data sample $$(x,y)$$. 

Ultimately, we are, however, mostly interested in the risk of the model on the distribution <em>induced by its own parameters</em>, since this captures its actual post-deployment performance. This risk is referred to as the <em>performative risk</em> and is defined as follows:

$$ \mathcal{PR}(\theta) := \mathcal{DPR}(\theta, \theta) = \mathbb{E}_{(x,y) \sim \mathcal{D}(\theta)} [\ell(\theta; x, y)]. $$

<div class="l-page-outset" style="display: flex; justify-content: center; align-items: center; padding: 20px 0 28px;">
  <div style="background: #f2f2f2ff; border-radius: 32px; padding: 18px 20px; width: min(96%, 1120px); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <iframe src="{{ 'assets/html/2026-04-27-performative-prediction/risk_iteration_scroll.html' | relative_url }}?v=3" 
            frameborder="0" 
            scrolling="yes" 
            width="100%" 
            height="760" 
            style="border: none; border-radius: 24px; background: transparent; height: clamp(640px, 82vh, 760px);">
    </iframe>
  </div>
</div>

### Visualizing the decoupled risk 

All published works center their analysis on the performative risk, as it measures the performance after the shift. However, as we saw in the last section, the performative risk cannot measure performance right after training. To have a full understanding of the optimization dynamics, we need to take a look beyond the performative risk. 

To do this, we can visualize the decoupled performative risk. Throughout this blog post, we use this visualization to gain insights into questions like: what are the practical differences between a stable and an optimal point? How do certain algorithms converge? Or how can we have a sense of convergence if theoretical assumptions are not met?

Before introducing the visualization, let us present another example: now imagine that you are an ML engineer in a retail company in charge of training a model that sets the price of the products. The price of the products will undoubtedly affect the demand of the customers to buy the product. Thus, we can formalize this problem as Performative Prediction. We consider a <em>simplified</em> version of this setup, modifying the original example by Izzo et al. <d-cite key="izzo2021learn"></d-cite>: let $\theta \in [-5,5]^d$ be price deviation from a baseline price $\theta_0$ of $d$ products and $z \in \mathbb{R}^d$ be the demand of customers for buying the products. The demand $z_0$ corresponds to demand when the price is the baseline $\theta_0$. The price of the product affects the demand of that product by a Gaussian distribution $\mathcal{D}(\theta) = \mathcal{N}(z_o - \varepsilon\theta; \Sigma)$, i.e., the demand linearly decreases as the price increases. The retail company is interested in maximizing its total revenue, thus, performative risk can be modelled as:

$$ \mathcal{PR}_{pricing}(\theta) = \mathbb{E}_{z \sim \mathcal{D}(\theta)}[-(\theta_0 + \theta)^Tz] $$

Note that in this example, the model $\theta$ is just the price deviation of the products from the baseline price, and the output of the model can be considered $\theta_0 + \theta$. As one wants to maximize the total revenue $(\theta_0 + \theta)^T z$, then the loss function is simply $\ell(z;\theta) = -(\theta_0 + \theta)^T z$ and there is no need to have labels. 

**With the decoupled risk visualization, it is easier to understand the optimization dynamics!**

Consider the case where your retailer company only sells one product, $z \in \mathbb{R}, \theta \in [-5,5]$. <span style="color:#8DA0CB">You train an initial model $\theta^{(1)}$ on the initial distribution $\mathcal{D}(\theta^{(0)})$. Your risk is then $\mathcal{DPR}(\theta^{(0)}, \theta^{(1)})$.</span> <span style="color:#E5C494">After deployment, the distribution changes to $\mathcal{D}(\theta^{(1)})$. Your risk is then $\mathcal{PR}(\theta^{(1)}) = \mathcal{DPR}(\theta^{(1)}, \theta^{(1)})$.</span> This pull towards the diagonal cross-section, i.e., the performative risk as $\mathcal{DPR}(\theta, \theta) = \mathcal{PR}(\theta)$, happens again at every step, creating a repeated cycle of updating the model and observing the induced distribution shift.

<div class="l-screen" style="display: flex; justify-content: center; padding: 12px 0 24px;">
  <iframe src="{{ 'assets/html/2026-04-27-performative-prediction/decoupled_risk_landscape.html' | relative_url }}?v=7" 
          frameborder='0' 
          scrolling='no' 
          width="100%" 
          height="740" 
          style="border: none; background: #fff; border-radius: 24px; height: clamp(620px, 78vh, 740px); max-width: 1200px;">
  </iframe>
</div>

During the <span style="color:#8DA0CB">optimization step</span>, the data distribution does not change. Therefore, the optimization happens in a vertical section of the plane, where $\theta_D$ is fixed. We will call this section of the plane the **fixed-distribution cross-section**. Its corresponding risk is:

$$\mathcal{DPR}(\theta_D, \theta_M)\big|_{\theta_D = \theta^{\prime}_D} = \mathcal{R}_{\theta^{\prime}_D} (\theta_M) = \mathbb{E}_{(x,y) \sim \mathcal{D}(\theta^{\prime}_D)} \big[\ell(\theta_M; x, y)\big] .$$

This can be seen as a marginalization of the decoupled performative risk. Thus, $\theta^{\prime}_D$ is a fixed value. Note that in classical ML, you operate within just one single fixed-distribution cross-section, without accounting for the richer space in which the system actually evolves after model deployment.

## Interest points of Performative Prediction
      
One natural solution to the problem of Performative Prediction is deploying a model that — after it has affected the data distribution — does not require retraining, i.e., a model robust to the distribution shift. This model will be optimal for the distribution induced by itself. This point is called performatively stable:

$$ \theta_{ST} = \operatorname*{argmin}_{\theta} \mathbb{E}_{(x,y)\sim \mathcal{D}(\theta_{ST})}[\ell(\theta;x, y)] $$

and it can be seen as the fixed point solution of the function $$\theta^*_M(\theta_D) := \operatorname*{argmin}_{\theta_M} \mathcal{DPR}(\theta_M, \theta_D)$$.

However, this solution is not optimal for the closed-loop interaction between the data and the model, i.e., it is not the minimum of the performative risk. The minimum of the performative risk is called the performative optimum:

$$ \theta_{OP} = \operatorname*{argmin}_{\theta} \mathcal{PR}(\theta) = \operatorname*{argmin}_{\theta} \mathbb{E}_{(x,y)\sim \mathcal{D}(\theta)}[\ell(\theta;x, y)] $$

### The new visualization inspires a redefinition of the interest points

The new visualization allows for visualizing the difference between robustness (stable point) and optimality (optimum point) more clearly. Keep in mind they are interest points of the performative risk, and therefore, they lie in the diagonal section of the plane, where $\mathcal{DPR}(\theta, \theta) = \mathcal{PR} (\theta)$.

If the minimum in one fixed-distribution cross-section $$\theta^* = \operatorname*{argmin}_{\theta_M} \mathcal{R}_{\theta_i}(\theta_M)$$ is the same model that induced the distribution ($\theta^* =\theta_i$), then $\theta_i$ is stable.

{% include figure.liquid path="assets/img/2026-04-27-performative-prediction/Stable_pricing.png" class="img-fluid" %}

In the pricing example, $\theta_1$ is stable because the fixed-distribution risk $$\mathcal{R}_{\theta_1}(\theta_M)$$ is flat; consequently, every $\theta_M \in \Theta$ is a minimizer of $\mathcal{R}_{\theta_1}(\theta_M)$, including $\theta_1$. On the other hand, $\theta_2$ is not a stable point because $$\theta_2 \ne \operatorname*{argmin} \mathcal{R}_{\theta_2}(\theta_M)$$.

Therefore, the gradient in the direction of the fixed-distribution cross-section has to be zero for the point to be stable. We abuse notation and use $\nabla_M$, $\nabla_D$ to refer to $\nabla_{\theta_M}$, $\nabla_{\theta_D}$, respectively.

**Proposition 1.** _If_ $\theta_{ST}$ _is a stable point of the performative risk_ $\mathcal{PR}(\theta)$, _then_

$$\nabla_M\,\mathcal{DPR}(\theta_\mathit{ST}, \theta_\mathit{ST}) = 0~.$$

On the other hand, the optimal point of the performative risk is the minimum of the performative risk, i.e., the diagonal section.

{% include figure.liquid path="assets/img/2026-04-27-performative-prediction/Optimal_pricing.png" class="img-fluid" %}

Thus, the gradient in the diagonal direction has to be zero.

**Proposition 2.** _If_ $\mathcal{PR}(\theta)$ _is strictly convex, then_ $\theta_{OP}$ _is an optimal point of the performative risk_ $\mathcal{PR}(\theta)$ _if and only if_

$$\nabla_M\,\mathcal{DPR}(\theta_\mathit{OP}, \theta_\mathit{OP})
    + \nabla_D\,\mathcal{DPR}(\theta_\mathit{OP}, \theta_\mathit{OP}) = 0~.$$

In Section [Practical insights in experiments](#practical-insights-in-real-world-experiments), we will show how these reformulations can be used to get practical insights about convergence in experiments where strict theoretical assumptions do not hold.  

## How to reach them? Optimization in Performative Prediction
### Algorithms that converge to the stable point

The Performative Prediction literature started out by focusing on how to find the stable solution, as it is a more tractable optimization problem. The first algorithms were based on _just_ retraining the model after sampling from the new distribution. The process of these algorithms can be summarized as follows:

1. Get the data samples of the distribution induced by $$\theta^{(t)}$$: $$ (x,y)\sim \mathcal{D}(\theta^{(t)})$$
2. Train the model on those data samples, considering the distribution fixed: $$\theta^{(t)} \rightarrow \theta^{(t+1)}$$
3. Deploy the model, causing a new distribution shift: $$\mathcal{D}(\theta^{(t)}) \rightarrow \mathcal{D}(\theta^{(t+1)})$$

If the model is fully optimized at each step, the algorithm is called <em>Repeated Risk Minimization</em> (RRM). Whereas if only one gradient descent step is performed, it is called <em>Repeated Gradient Descent</em> (RGD).

In the founding paper of Performative Prediction, Perdomo et al.,<d-cite key="perdomo2020performative"></d-cite> provide convergence guarantees of these algorithms to a stable point. Their proof relies on three key assumptions. The loss function $\ell(\theta; x, y)$ must be convex with respect to the model parameters $\theta$ and jointly smooth in $(x,y)$ and $\theta$. Furthermore, the distribution map $\mathcal{D}(\theta)$ must be $\varepsilon$-sensitive to changes in $\theta$; that is, small variations in the parameters should produce only small variations in the induced data distribution. Formally, this is captured by the condition 

$$\mathcal{W}(\mathcal{D}(\theta_1), \mathcal{D}(\theta_2)) \le \varepsilon  \| \theta_1 - \theta_2\|^2 ,$$

where $\mathcal{W}(\cdot, \cdot)$ is the Wasserstein distance of the two distributions. $\varepsilon$ can be understood as the performative effect. It is a measure of how much performativity there is in the example. When $\varepsilon=0$, then $\mathcal{D}(\theta_1) = \mathcal{D}(\theta_2)$ and we are in the classical ML setup. 

With our visualization, it is quite intuitive to see why the algorithms converge. Recall that a fixed-distribution cross-section has a static distribution, $\mathcal{D}(\theta^{\prime}_D)$, where $\theta^{\prime}_D$ is the model that generates the fixed distribution. Therefore, if $\ell(\theta_M; x,y)$ is strongly convex in $\theta_M$, then the fixed-distribution risk $$\mathcal{R}_{\theta^{\prime}_D}(\theta_M) = \mathbb{E}_{\mathcal{D}((x,y) \sim \theta^{\prime}_D)}[\ell(\theta_M;x,y)]$$ is also strongly convex since the expectation will preserve convexity.<d-footnote>This will not happen in the performative risk $\mathcal{PR}(\theta) = \mathbb{E}_{\mathcal{D}(\theta) \sim (x,y)}[\ell(\theta;x,y)]$ because the expectation is dependent on $\theta$.</d-footnote> Moreover, under the $\varepsilon$-sensitivity on the distribution map (which can be seen as a regularity assumption), nearby values of $\theta_D$ induce similar distributions. This means that the fixed-distribution cross-sections for nearby $\theta_D$ will also look similar. 

Consequently, each cross-section is strongly convex (i.e., they have a global minimum), consecutive cross-sections vary smoothly, and the optimizer moves across them. Because the diagonal covers all the domain of $\theta$, eventually, during this process, the minimizer of some fixed-distribution cross-section will be within the diagonal—i.e., it will coincide with the model that generates that very distribution. At that point, the update becomes self-consistent, and the algorithm reaches a stable point.

Note that these algorithms do not use the information from the distribution map when training the model. They just use the data sampled from the shifted distribution. This distribution is considered to be static. Although it is very easy to apply them in practice (wait until the distribution shifts, observe new data samples, and retrain), they do not find the optimal solution, as they do not use explicit information of the distribution map while retraining the model. In these initial algorithms, the only guarantee of optimality is that the stable point might lie close to the optimal point under certain conditions, which are even more strict than the convergence to the stable point.

### Algorithms that converge to the optimal point

Later, the literature started focusing on how to find the optimal solution directly. This point is more interesting, as it is the minimum of the performative risk. The most immediate idea is to apply gradient descent to the performative risk; this algorithm is called Performative Gradient Descent (PerfGD). The key step here is to calculate the performative gradient:

$$ \nabla_{\theta} \mathcal{PR}(\theta) = \nabla_{\theta} \mathbb{E}_{(x,y) \sim \mathcal{D}(\theta)} [\ell(\theta; x, y)]~. $$ 
      
This gradient is difficult to calculate due to the dependency of the data distribution on the model parameters in the expectation.<d-footnote>When finding the stable point, one need only to calculate $$\mathbb{E}_{(x,y) \sim \mathcal{D}(\theta)} [ \nabla_{\theta} \ell(\theta; x, y)]$$ because the distribution is considered static; that is why it is more mathematically tractable.</d-footnote> Two approaches have been proposed:<d-footnote>As both $x$, $y$ can be changed due to the distribution map, we consider the notation $z=(x,y)$ from now on.</d-footnote>

1. REINFORCE<d-cite key="izzo2021learn"></d-cite>: uses the fact that the gradient of the likelihood of a random variable is the same as the likelihood times the gradient of the log likelihood $\nabla_{\theta} p_{\mathcal{D}(\theta)}(z) = p_{\mathcal{D}(\theta)}(z)\nabla_{\theta}\log p_{\mathcal{D}(\theta)}(z)$:
$$
\begin{align}
 \nabla_\theta \mathcal{PR}(\theta) &= \nabla_\theta \int \ell(\theta;z) p_{\mathcal{D}(\theta)}(z) dz \nonumber \\
&= \int \frac{\partial \ell(\theta;z)}{\partial \theta}   p_{\mathcal{D}(\theta)}(z)dz + \int  \ell(\theta;z)  \frac{\partial p_{\mathcal{D}(\theta)}(z)}{\partial \theta}dz\nonumber\\
& = \int \frac{\partial \ell(\theta;z)}{\partial \theta}   p_{\mathcal{D}(\theta)}(z)dz + \int  \ell(\theta;z)   \frac{\partial \log p_{\mathcal{D}(\theta)}(z)}{\partial \theta} p_{\mathcal{D}(\theta)}(z)dz \nonumber \\
&=\mathbb{E}_{z \sim \mathcal{D}(\theta)} \left[\frac{\partial \ell(\theta;z)}{\partial \theta} \right] + \mathbb{E}_{z \sim \mathcal{D}(\theta)} \left[ \ell(\theta;z)\frac{\partial \log p_{\mathcal{D}(\theta)}(z)}{\partial \theta} \right] \nonumber\\
&=\mathbb{E}_{z \sim \mathcal{D}(\theta)} \left[\frac{\partial \ell(\theta;z)}{\partial \theta} + \ell(\theta;z)\frac{\partial \log p_{\mathcal{D}(\theta)}(z)}{\partial \theta} \right] 
\end{align}
$$
2. Reparametrization trick<d-cite key="cyffers2024optimal"></d-cite>: uses a deterministic function that is dependent on a base distribution and encodes the transformation caused by a parameter. Therefore, the expectation depends on the base-distribution only. In the case of Performative Prediction, this is achievable by defining a base distribution $\mathcal{D}_o$ that captures the samples before performativity and a push-forward model that defines the transformation of each sample due to performativity $z = \varphi(z_o, \theta)$. We can then use the multivariate chain rule to calculate the performative gradient:
$$ 
  \begin{align}
      \nabla_\theta \mathcal{PR}(\theta) &= \nabla_\theta \mathbb{E}_{z \sim \mathcal{D}(\theta)} \big[ \ell(\theta;z)\big] \nonumber \\
    & = \nabla_\theta \mathbb{E}_{z_o \sim \mathcal{D}_o} \big[ \ell(\theta; \varphi(z_o, \theta))\big] \nonumber \\
    &=  \mathbb{E}_{z_o \sim \mathcal{D}_o} \Big[ \nabla_\theta \ell(\theta; \varphi(z_o, \theta))\Big] \nonumber \\
    &= \mathbb{E}_{z_0 \sim \mathcal{D}_0} \left[ \left.\frac{\partial \ell(\theta;z)}{\partial z}\right|_{z=\varphi(z_0; \theta)} \frac{\partial \varphi(z_0;\theta)}{\partial \theta} + \left. \frac{\partial \ell(\theta;z)}{\partial \theta}\right|_{z=\varphi(z_0; \theta)}  \right]
  \end{align} 
$$

The proof of convergence of PerfGD is more complex; it requires to studying the convexity of $\mathcal{PR}(\theta)$. Due to the dependency on $\theta$ of the expectation, it is not enough that $\ell(\theta;z)$ is convex. Miller et al. <d-cite key="miller2021outside"></d-cite> explore the conditions under which the performative risk is strongly-convex.

Note that this algorithm still does not move directly along $\mathcal{PR}(\theta)$. Instead, it still takes a step in the fixed-distribution direction first (<span style="color:#8DA0CB">in the optimization step</span>) and only afterwards returns to the diagonal (<span style="color:#E5C494">when the distribution shift happens</span>).
What does change is that the optimization step now incorporates information about how the distribution responds to $\theta$. In fact, the gradient decomposes as:

$$ \nabla \mathcal{PR}(\theta)= \nabla_D \mathcal{DPR}(\theta_D, \theta_M) + \nabla_M \mathcal{DPR}(\theta_D, \theta_M),$$

so the update reflects both the direct model gradient and the distribution-induced component.

### Visualization of the algorithms in the decoupled risk landscape

The figure illustrates the convergence behavior of the different algorithms for the pricing example in the decoupled risk landscape. We keep the same color scheme from previous visualizations to facilitate comparison and interpretation.

{% include figure.liquid path="assets/img/2026-04-27-performative-prediction/viz_pricing.svg" class="img-fluid" %}

RGD converges to the stable point, whereas RRM does not converge at all. The reason is that the loss $\ell(\theta;z)$ is convex but not strongly convex (see Proposition 3.6 of Perdomo et al. <d-cite key="perdomo2020performative"></d-cite>, which characterizes when RRM fails to converge). PerfGD converges to the optimal point more quickly when using the reparameterization trick rather than REINFORCE.

## Practical insights in real-world experiments

One of the restrictive assumptions for the convergence of Performative Prediction algorithms is the convexity of the loss function $\ell(\theta; x,y)$ with respect to the model weights.<d-footnote>As far as we are concerned, there is only one work considering convergence to non-convex losses in Performative Prediction.<d-cite key="li2024stochastic"></d-cite> It is still a theoretical work that proves the convergence to a relaxation of our redefinition of the stable point.</d-footnote> As we saw in the previous example, the algorithms can still converge even when this assumption is not met, which often happens in more practical examples (think about state-of-the-art Neural Network architectures, whose losses are usually high-dimensional and not strongly convex at all). What can we say about convergence in practical examples, then?

In classical ML, under these conditions, the focus is typically shifted from convergence to the global minimum to find solutions heuristically that perform well. In fact, it has been widely studied in Deep Learning that a flat minimum can generalize well (not necessarily only a global minimum)<d-cite key="dinh2017sharp"></d-cite>. In Performative Prediction, we can use our Proposition 2 when $\mathcal{PR}(\theta)$ is not convex to find good performing points. Therefore, the gradients of the $\mathcal{DPR}(\theta_D,\theta_M)$ can be used as a metric to have a sense of flatness an,d therefore, convergence.

In this section, we use the gradients to show convergence in one experiment with high-dimensions and another one with a neural network as a model. 

Let's extend the pricing example to $d=100$ products. Now, $z \in \mathbb{R}^{100}, \theta\in[-5,5]^{100}$. The stable point ($\theta_{ST} = \frac{z_0}{\epsilon}$) and optimal point ($\theta_{OP} = \frac{z_0 - \varepsilon \theta_0}{2\epsilon}$) can be computed in closed-form. <d-footnote>Please refer to Izzo et al. <d-cite key="izzo2021learn"></d-cite>, where this example comes from, for full details on this derivation</d-footnote>

{% include figure.liquid path="assets/img/2026-04-27-performative-prediction/pricing_web.svg" class="img-fluid" %}

To check how good the algorithms perform, we plot the distance to the optimal point. As expected, RGD only converges to the stable point, whereas PerfGD converges to the optimal. The REINFORCE variant of PerfGD includes a warm-up phase that effectively corresponds to retraining, which explains why its behavior is similar to RGD during the initial iterations. However, it ultimately fails to match the performance of the variant based on the reparameterization trick. We conjecture that the REINFORCE variant struggles in the high-dimensional setting because the variance of the REINFORCE estimator becomes too large to provide reliable gradient estimates. Based on our experience with both versions of PerfGD, we recommend using the reparametrization one whenever possible. We can see how the gradients confirm the convergence to the stable or optimal point. In RGD, only $\nabla_M \mathcal{DPR}$ goes to zero. In contrast, with PerfGD, neither of $\nabla_M \mathcal{DPR}$ nor $\nabla_D \mathcal{DPR}$ goes to zero, but their sum $\nabla \mathcal{PR}$ does because both of the components go in opposite directions. 

Let's also consider the bank loan example. We use the real-world dataset *Give me some credit* <d-cite key="GiveMeSomeCredit"></d-cite>, which was established by Perdomo et al. <d-cite key="perdomo2020performative"></d-cite> as the default dataset of Performative Prediction. This tabular dataset describes whether a loan was returned ($y=0$) or defaulted ($y=1$) based on financial features of applicants ($x\in\mathbb{R}^{11}$). As standard in Performative Prediction, we equip the dataset with a transformation function $\Gamma$ based on strategic classification. Instead of using logistic regression, we use a nonlinear classifier (a 2-layer multi-layer perceptron, MLP) as a model. 

{% include figure.liquid path="assets/img/2026-04-27-performative-prediction/credit_web.svg" class="img-fluid" %}

Inspired by classical ML, we have added momentum to GD and used Adagrad as an optimizer. These techniques work heuristically to find good minima but have never been used in Performative Prediction. By looking at the gradients, we can analyze if they also work in Performative Prediction. 

In this case, RGD converges to a stable point because only $\nabla_M \mathcal{DPR}(\theta_D, \theta_M)$ goes to zero. In contrast, all variants of PerfGD converge to a flat minimum because both $\nabla_M \mathcal{DPR}(\theta_D, \theta_M)$ and $\nabla_D \mathcal{DPR}(\theta_D, \theta_M)$ approach zero, thereby making $\nabla \mathcal{PR}(\theta)$ vanish. Using Adagrad or momentum speeds up the convergence dynamics. We cannot assert that this minimum is the performatively optimal point; we can only say that it is a flat stationary point. However, as discussed, this distinction is not crucial in practice: $\mathcal{PR}(\theta)$ is not strongly convex, thus we cannot say much about the global optimum, and prior results have shown that flat minima often perform well in real-world settings.<d-cite key="dinh2017sharp"></d-cite>

We believe that these new insights about the gradients of the decoupled risk are especially relevant in Performative Prediction to account for realistic scenarios with non-convex losses or no sensitivity guarantees on the distribution map.

## To open a discussion on future directions of the field

We could conclude the blog post at this point. We have clarified why Performative Prediction is a relevant problem, introduced the core ideas of the field to a broader ML audience, and proposed metrics that can be directly applied in practical scenarios. However, the blog post format gives us space to reflect more broadly. In particular, we would like to use this opportunity to discuss the challenges ahead and outline what we see as meaningful next steps for practical research on Performative Prediction within the community.

Performative Prediction is, in many ways, a cursed field. Its motivation is fundamentally practical—models deployed in the world influence the data they will later learn from—yet practical research faces severe, structural limitations. To converge to the truly relevant performative optimum, we need information about the distribution map $\mathcal{D}(\theta)$, which governs how the environment shifts in response to a model’s predictions. Recall that Performative Prediction is a two-step iterative process: (1) train a model, (2) deploy it and observe the induced distribution shift. Most existing works focus on the first step, proposing algorithms that optimize under the assumption that either (a) the distribution map is known, or (b) it can be reliably estimated from samples. The core barrier to practical Performative Prediction is that in realistic settings, we have very limited visibility into how deployment shifts the data. That is why simple iterative retraining is often preferred in practice: it is more robust. It continually adapts to the most recent data without relying on an explicit model of distributional feedback. Estimating $\mathcal{D}(\theta)$ from samples alone is difficult or ethically constrained. Once a model is deployed, it is typically fixed, and deploying multiple models across different populations solely to collect data for estimation would be highly unethical.

While the optimal point achieves a lower risk than the stable point, the algorithms used to reach it rely on computing $\nabla_D \mathcal{DPR}(\theta_D, \theta_M)$, which requires knowledge of the induced distribution $\mathcal{D}(\theta)$. In large-scale systems such as search, advertising, and recommendation, however, this distribution is influenced by many external factors, leading to highly non-stationary environments that are difficult to model accurately. As mentioned before, in practice, 

We argue that there are two main directions for the field of *practical* Performative Prediction to advance:  1) developing techniques to estimate $\mathcal{D}(\theta)$ considering the previously stated limitations  or 2) focusing on *outcome performativity*, which frames the distribution map as a function of the inputs and the model’s predictions.

On the one hand, regarding the estimation of the distribution map, Miller et al.<d-cite key="pmlr-v139-miller21a"></d-cite> take an initial step, although their analysis is restricted to linear location–scale families. More recently, Bracale et al.<d-cite key="bracale2024learning"></d-cite> approach the problem through causal tools. The central challenge remains the same: approximating complex, latent distributions under limited information. Progress on this front could unlock new, practically grounded approaches to estimating $\mathcal{D}(\theta)$.

On the other hand, outcome performativity <d-cite key="kim2023making"></d-cite> offers a more tractable way to model the distribution map. Outcome performativity considers settings where the model’s prediction $\hat{y}$ affects only the outcome $y$, not the input features $x$. For example, reconsider the bank-lending scenario. A model predicts a borrower’s default risk, and the bank uses this prediction to decide whether to grant the loan *and* at what interest rate. The interest rate, in turn, influences the borrower’s ability to repay; thus, the outcome $y$ changes as a consequence of the prediction $\hat{y}$ even though the features $x$ remain unchanged. In this view, the distribution map can be formalized as a function that takes the features and prediction as inputs and returns the resulting outcome:

$$
\begin{aligned}
\Gamma :\; & \mathcal{X} \times \mathcal{Y} \longrightarrow \mathcal{Y} \\
      &  \: x \times \hat{y}  \: \longmapsto y
\end{aligned}
$$

Crucially, it is often possible to collect data that reflects this effect, because the outcome is shaped by decision rules already in operational use. For this reason, we argue that Performative Prediction research may be more practically impactful when focused on outcome performativity. The ethical and feasibility limitations discussed above are significantly reduced, and the feedback loop can be studied in realistic, deployment-aligned scenarios.

## Conclusion

Now, imagine you are an ML engineer working in the company of your dreams. You were hired some time ago, and you are excited because you worked on the next big thing. The soon-to-be-released model works amazingly well in your test sets — AGI is just around the corner! But… have you considered the effects that this model will have on the data distribution? If the internet is populated with text and images created by your model… You might not be able to train the next model. <d-cite key="shumailov2024ai"></d-cite>

Are we taking enough care in post-deployment effects? It seems that it is crucial, and retraining is not enough... 

## Acknowledgements 

We thank X. de Juan, P. Diego, R. González, X. Benavides, and M. Koch for their helpful comments on the manuscript. We also thank the reviewers for their thoughtful and constructive feedback. 

This project has been directly supported by the Basque Government (BERC 2022–2025 and IT2109-26); by the Spanish Ministry of Science and Innovation (MICIN/AEI/10.13039/501100011033) through project PID2022-137442NB-I00 and the BCAM Severo Ochoa accreditation (PRE2022-102655 and CEX2021-001142-S); and by the European Union’s Horizon Europe Programme (Grant Agreement No. 101120763 – TANGO and No. 101123000 – act.AI). The views and opinions expressed are those of the author(s) only and do not necessarily reflect those of the funding bodies.