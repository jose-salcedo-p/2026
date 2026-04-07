---
layout: distill
title: "From REINFORCE to Dr. GRPO: A Unified Perspective on LLM Post-Training"
description: Recently, many reinforcement learning (RL) algorithms have been applied to improve the post-training of large language models (LLMs). In this article, we aim to provide a unified perspective on the objectives of these RL algorithms, exploring how they relate to each other through the Policy Gradient Theorem — the fundamental theorem of policy gradient methods.
date: 2026-04-27
future: true
htmlwidgets: true

# anonymize when submitting
authors:
  - name: Qingfeng Lan
    url: "https://lancelqf.github.io/about/"
    affiliations:
      name: University of Alberta

# do not fill this in until your post is accepted and you're publishing your camera-ready post!
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
bibliography: 2026-04-27-llm-post-training.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
toc:
  - name: Background
  - name: Policy Gradient Theorem
  - name: REINFORCE
  - name: ReMax
  - name: RLOO
  - name: PPO
  - name: GRPO
  - name: Dr. GRPO
  - name: Conclusion
---



## Background

Let $$\Delta(X)$$ be the space of all probability distributions supported over the set $$X$$.
Consider a Markov decision process (MDP), $$M=(\mathcal{S}, \mathcal{A}, \mathbb{P}, p_0, R, \gamma)$$, where $$\mathcal{S}$$ is the discrete state space, $$\mathcal{A}$$ is the discrete action space, $$\mathbb{P}: \mathcal{S} \times \mathcal{A} \rightarrow \Delta(\mathcal{S})$$ is the transition probability, $$p_0 \in \Delta(\mathcal{S})$$ is the initial state distribution, $$R: \mathcal{S} \times \mathcal{A} \rightarrow \mathbb{R}$$ is the reward function, and $$\gamma \in [0,1]$$ is the discount factor.

An agent interacts with the MDP environment based on a policy $$\pi: \mathcal{S} \rightarrow \Delta(\mathcal{A})$$. Specifically, the agent starts from state $$s_0 \sim p_0(\cdot)$$.
At each time-step $$t$$, it observes the state $$s_t \in \mathcal{S}$$, takes an action $$a_t \sim \pi(\cdot \mid s_t)$$, transits to the next state $$s_{t+1} \sim \mathbb{P}(\cdot  \mid  s_t, a_t)$$, and receives a scalar reward $$r_{t+1} = R(s_t, a_t)$$.
A trajectory (up to time-step $$T$$) is defined as $$\tau = (s_0, a_0, r_1, s_1, \cdots, s_T)$$. 
Define return $$G_t$$ over $$\tau$$ as the total (discounted) reward from time-step $$t$$:

$$
\begin{equation}
G_t = \sum_{i=t}^{T-1} \gamma^{i-t} R(s_i, a_i).
\end{equation}
$$

State-value functions are defined as the expected return under policy $$\pi$$, 

$$
\begin{align}
V_{\pi}(s) = \mathbb{E}_{\pi}[G_t  \mid  s_t=s].
\end{align}
$$

Similarly, action-value functions are defined as

$$
\begin{align}
Q_{\pi}(s, a) = \mathbb{E}_{\pi}[G_t  \mid  s_t=s, a_t=a].
\end{align}
$$

Furthermore, $$V_{\pi}$$ and $$Q_{\pi}$$ are connected with the following equations:

$$
\begin{align}
V_{\pi}(s) &= \sum_{a \in \mathcal{A}} \pi(a  \mid  s) Q_{\pi}(s,a), \\
Q_{\pi}(s,a) &= R(s,a) + \gamma \sum_{s' \in \mathcal{S}} \mathbb{P}(s' \mid s,a) V_{\pi}(s').
\end{align}
$$

The policy is usually parameterized by a weight vector $$\theta$$, i.e., $$\pi_{\theta}$$. 
The goal of the agent is to find a policy that maximizes the expected return.
Formally, we aim to find $$\theta$$ that maximizes the objective:

$$
\begin{align}
J(\theta) = \sum_{s \in \mathcal{S}} p_0(s) V_{\pi_{\theta}}(s).
\end{align}
$$

Now, let's formalize LLM post-training within the RL framework. **In essence, LLM post-training is a specific type of RL task, distinguished by some unique properties.**
Specifically, the initial state distribution is defined over the prompt dataset $$\mathcal{Q}$$, i.e., $$p_0 \in \Delta(\mathcal{Q})$$. The initial state $$s_0$$ corresponds to a prompt $$\mathbf{q} = [\mathbf{q}_1, \dots, \mathbf{q}_m]$$ sampled from $$\mathcal{Q}$$, where $$\mathbf{q}_i$$ is the $$i$$-th token in the prompt and $$m = | \mathbf{q} |$$ is the prompt length. 
At time-step $$t$$, the state includes the prompt tokens $$\mathbf{q}$$ and the response tokens generated so far, i.e., $$s_t = [\mathbf{q}_1, \dots, \mathbf{q}_m, \mathbf{o}_1, \dots, \mathbf{o}_{t-1}]$$. 
The transition function is deterministic — the next state is simply the concatenation of the current state and the action, i.e., $$s_{t+1} = s_t  \mid  a_t$$, where $$ \mid $$ denotes the concatenation operation.
The reward function $$R$$ is prompt-dependent, which can either be an outcome reward function or a process reward function.
For example, for most math tasks which use outcome reward functions, the reward signals are all zeros except the final reward, which could be 1 for a correct answer and -1 for an incorrect answer.
An episode ends when the token budget is exhausted or when the End-of-Sentence (EOS) token is generated.

Considering different action granularities, we define three types of MDPs for LLM post-training:

1. **Token-level MDPs**: In this case, we have the most fine-grained actions: each action $$a$$ corresponds to a single token, and the action space $$\mathcal{A}$$ is the set of tokens. The reward function $$R(s, a)$$ is also defined at the token level.

2. **Response-level MDPs**: Here, an action $$a_0$$ represents the entire response generated by the LLM, i.e., $$a_0 = \mathbf{o} = [\mathbf{o}_1, \dots, \mathbf{o}_T]$$, where $$T$$ is the response length. Response-level MDPs are essentially [contextual bandits](https://en.wikipedia.org/wiki/Multi-armed_bandit#Contextual_bandit), where each prompt $$\mathbf{q}$$ serves as a context or an initial state $$s_0$$, and a response is considered an arm. The reward $$R(s_0, a_0)$$ corresponds to the return.

3. **Step-level MDPs**: The granularity of actions in these MDPs lies between the token-level and the response-level, where each action represents an intermediate step in the response generation process, such as Chain-of-Thought reasoning <d-cite key="wei2022chain"></d-cite>.

In this article, we mainly focus on token-level MDPs.


## Policy Gradient Theorem

We now apply gradient ascent techniques to get the gradient of the objective.
Since the true gradient $$\nabla_{\theta} J(\theta)$$ is not typically available, we resort to Monte Carlo methods <d-cite key="mohamed2020monte"></d-cite>.

This gradient estimation problem can be formalized as computing the unbiased gradient of an expectation of a function with respect to some parameters of a distribution.
Consider a general case. Let $$p_{\theta}(x)$$ be the probability distribution of $$x$$ with parameters $$\theta$$.
Define the objective to be $$F(\theta) = \sum_{x \sim X} p_{\theta}(x) \phi(x)$$.
To estimate $$\nabla_{\theta} F(\theta)$$, we apply the likelihood-ratio gradient estimator <d-cite key="glynn1990likelihood"></d-cite> which uses the log-derivative technique ($$\nabla \log{x} = \frac{\nabla x}{x}$$) to obtain an unbiased gradient estimation:

$$
\begin{align*}
\nabla_{\theta} F(\theta)
&= \sum_x \phi(x) \nabla_{\theta} p_{\theta}(x) \\
&= \sum_x \phi(x) p_{\theta}(x) \nabla_{\theta} \log{p_{\theta}(x)} \\
&= \mathbb{E}_{X \sim p_{\theta}}[\phi(X) \nabla_{\theta} \log{p_{\theta}(X)}].
\end{align*}
$$

For our specific case (Equation (6)), we have 

$$
\begin{align}
\nabla_{\theta} J(\theta)
& = \sum_{s \in \mathcal{S}, a \in \mathcal{A}} d^{\pi_{\theta}}(s) \pi_{\theta}(a \mid s) Q_{\pi_{\theta}}(s,a) \nabla_{\theta} \log{\pi_{\theta}(a \mid s)} \\
& = \mathbb{E}_{\tau \sim \pi_{\theta}}[\sum_t \gamma^t Q_{\pi_{\theta}}(s_t,a_t) \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)}]
\end{align}
$$

where $$d^{\pi_{\theta}}(s') = \sum_{s \in \mathcal{S}} \sum_{t=0}^{\infty} \gamma^t p_0(s) p(s \to s', t, \pi_{\theta})$$ is the (discounted) stationary state distribution of policy $$\pi_{\theta}$$ and $$p(s \to s', t, \pi_{\theta})$$ is the transition probability from $$s$$ to $$s'$$ with $$t$$ steps under policy $$\pi_{\theta}$$.
For a detailed proof, please check Section 13.2 of the RL introduction book <d-cite key="sutton2011reinforcement"></d-cite> and OpenAI Spinning Up <d-cite key="SpinningUp2018"></d-cite>.

Finally, in terms of implementation, the term $$\gamma^t$$ in Equation (8) is usually ignored:

$$
\begin{align}
\nabla_{\theta} J(\theta)
\approx \mathbb{E}_{\tau \sim \pi_{\theta}}[\sum_t Q_{\pi_{\theta}}(s_t,a_t) \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)}]
\end{align}
$$

For a more detailed discussion, please check Zhang et al. 2022 <d-cite key="zhang2022deeper"></d-cite>.


## REINFORCE

REINFORCE <d-cite key="williams1992simple"></d-cite> is a classic Monte Carlo policy gradient algorithm. Specifically, it approximates $$Q_{\pi_{\theta}}(s_t, a_t)$$ in Equation (8) with a sampled return $$G_t$$ (see Equation (3)).
Formally, the gradient estimation is 

$$
\begin{equation}
\nabla_{\theta} J_\text{REINFORCE}(\theta)
= \mathbb{E}_{\tau \sim \pi_{\theta}}[\sum_t G_t \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)}].
\end{equation}
$$

In practice, REINFORCE usually suffers from high gradient variance, making training unstable.
To reduce variance, we apply the [control variates](https://en.wikipedia.org/wiki/Control_variates) method by subtracting a baseline $$b_t$$ from $$G_t$$:

$$
\begin{align}
\nabla_{\theta} J_\text{REINFORCE with baseline}(\theta)
& = \mathbb{E}_{\tau \sim \pi_{\theta}}[\sum_t (G_t - b_t) \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)}] \\
& = \mathbb{E}_{\tau \sim \pi_{\theta}}[\sum_t A_t \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)}], \nonumber
\end{align}
$$

where $$A_t = G_t - b_t$$ is referred as the (general) advantage.

**In general, the baseline can be any function as long as it is not affected by the action $$a_t$$; otherwise we will have biased gradient estimation.**
For example, when $$b_t = b(s_t)$$, a function of the state $$s_t$$ only, $$\nabla_{\theta} J_\text{REINFORCE}(\theta) = \nabla_{\theta} J_\text{REINFORCE with baseline}(\theta)$$ because the subtracted quantity is zero:

$$
\begin{align*}
\mathbb{E}_{\pi_{\theta}}[b(s_t) \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)}]
&= \sum_{a_t \sim \mathcal{A}} \pi_{\theta}(a_t \mid s_t) b(s_t) \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)} \\
&= \sum_{a_t \sim \mathcal{A}} b(s_t) \nabla_{\theta} \pi_{\theta}(a_t \mid s_t) \\
&= b(s_t) \nabla_{\theta} \left(\sum_{a_t \sim \mathcal{A}} \pi_{\theta}(a_t \mid s_t) \right) \\
&= b(s_t) \nabla_{\theta} 1 \\
&= 0.
\end{align*}
$$

In practice, a natural choice for the baseline is the state-value function $$V_{\pi_{\theta}}(s)$$:

$$
\begin{align}
\nabla_{\theta} J_\text{REINFORCE with baseline}(\theta)
= \mathbb{E}_{\tau \sim \pi_{\theta}}[\sum_t (G_t - V_{\pi_{\theta}}(s_t)) \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)}].
\end{align}
$$

## ReMax

In Equation (12), estimating the gradient requires the state-value function, which is challenging to obtain accurately in LLM post-training and is both memory-intensive to store and computationally expensive to train <d-cite key="li2024remax"></d-cite>.
ReMax (a.k.a. REINFORCE with greedy rollout baseline <d-cite key="li2024remax"></d-cite> <d-cite key="kool2019attention"></d-cite>) eliminates the need for $$V_{\pi_{\theta}}(s_t)$$ by replacing it with the return of the greedy trajectory sampled on the fly at each time-step $$t$$.

Formally, given the policy $$\pi_{\theta}$$ and the current state $$s_t$$, we sample the greedy trajectory starting from $$s_t$$, i.e., $$\hat{\tau}_t = (\hat{s}_t, \hat{a}_t, \hat{r}_{t+1}, \hat{s}_{t+1}, \hat{a}_{t+1}, \hat{r}_{t+2}, \dots, \hat{s}_T)$$, where $$\hat{s}_t = s_t$$, $$\hat{a}_i = \arg\max_{a \in \mathcal{A}} \pi_{\theta}(a  \mid  \hat{s}_i)$$ and $$\hat{r}_{i+1} = R(\hat{s}_i, \hat{a}_i)$$.
Denote $$\hat{G}_t$$ as the return over trajectory $$\hat{\tau}_t$$ and set $$b_t = \hat{G}_t$$ in Equation (11).
We then have:

$$
\begin{align}
\nabla_{\theta} J_\text{ReMax}(\theta)
= \mathbb{E}_{\tau \sim \pi_{\theta}}[\sum_t (G_t - \hat{G}_t) \nabla_{\theta} \log{\pi_{\theta}(a_t \mid s_t)}].
\end{align}
$$

Note that in this case, the baseline does not bias the gradient estimation (see Proposition 1 of Section 4.3 in <d-cite key="li2024remax"></d-cite>), but it is no longer an unbiased estimation of $$V_{\pi_{\theta}}(s_t)$$.


## RLOO

Unlike ReMax which samples a greedy trajectory to compute the baseline, REINFORCE Leave-One-Out (RLOO) <d-cite key="kool2019buy"></d-cite> <d-cite key="ahmadian2024back"></d-cite> eliminates the need for $$V_{\pi_{\theta}}(s_t)$$ at each time-step $$t$$ by replacing it with the expected return over multiple trajectories sampled on the fly.
**However, not all RL tasks allow multiple trajectory sampling from the same state $$s_t$$. If an environment does not permit action resampling, RLOO cannot be applied. Luckily, in LLM post-training, the agent has significant control over transitions (i.e., $$s_{t+1} = s_t  \mid  a_t$$), enabling multiple trajectory sampling and making RLOO a viable approach.**

Specifically, at each time-step $$t$$, we sample $$K$$ trajectories $$\{ \tau_{1,t}, \dots, \tau_{K,t} \}$$ **starting from $$s_t$$**; and the corresponding returns are $$\{ G_{1,t}, \dots, G_{K,t} \}$$, respectively.
One may think we can simply replace $$V_{\pi_{\theta}}(s_t)$$ with a baseline $$\frac{1}{K} \sum_{i=1}^{K} G_{i,t}$$:

$$
\begin{align*}
\nabla_{\theta} J(\theta)
\overset{?}{=} \mathbb{E}_{\{ \tau_{k,t} \}_{k=1}^K \sim \pi_{\theta}} \left[\sum_t \frac{1}{K} \sum_{k=1}^{K} \left(G_{k,t} - \frac{1}{K} \sum_{i=1}^{K} G_{i,t}\right) \nabla_{\theta} \log{\pi_{\theta}(a_{k,t} \mid s_t)}\right].
\end{align*}
$$

However, this baseline leads to a biased gradient estimation since the baseline contains $$G_{k,t}$$ which is affected by $$a_{k,t}$$.
Thus, to get an unbiased gradient estimation, we choose $$\frac{1}{K-1} \sum_{i \neq k} G_{i,t}$$ as the baseline:

$$
\begin{align*}
\nabla_{\theta} J(\theta)
= \mathbb{E}_{\{ \tau_{k,t} \}_{k=1}^K \sim \pi_{\theta}} \left[\sum_t \frac{1}{K} \sum_{k=1}^{K} \left(G_{k,t} - \frac{1}{K-1} \sum_{i \neq k} G_{i,t}\right) \nabla_{\theta} \log{\pi_{\theta}(a_{k,t} \mid s_t)}\right].
\end{align*}
$$

Furthermore, we have

$$
\begin{align*}
G_{k,t} - \frac{1}{K-1} \sum_{i \neq k} G_{i,t}
&= G_{k,t} + \frac{1}{K-1} G_{k,t} - \frac{1}{K-1} \sum_{i=1}^K G_{i,t} \\
&= \frac{K}{K-1} G_{k,t} - \frac{1}{K-1} \sum_{i=1}^K G_{i,t} \\
&= \frac{K}{K-1} \left(G_{k,t} - \frac{1}{K} \sum_{i=1}^K G_{i,t}\right).
\end{align*}
$$

Applying the above trick, we have

$$
\begin{align}
\nabla_{\theta} J_\text{RLOO}(\theta)
= \mathbb{E}_{\{ \tau_{k,t} \}_{k=1}^K \sim \pi_{\theta}} \left[\textcolor{red}{\frac{1}{K-1}} \sum_t \sum_{k=1}^{K} (G_{k,t} - \bar{V}(s_t)) \nabla_{\theta} \log{\pi_{\theta}(a_{k,t} \mid s_t)}\right],
\end{align}
$$

where $$\bar{V}(s_t) = \mathbb{E}[G_t] = \frac{1}{K} \sum_{i=1}^K G_{i,t}$$ which is an unbiased estimation of $$V_{\pi_{\theta}}(s_t)$$.


## PPO

The above algorithms assume that the behavior policy (the policy that is used to generate experience) and the target policy (the policy being learned) are the same.
When the behavior policy and the target policy are different, we need to correct the gradient estimation by utilizing [importance sampling](https://en.wikipedia.org/wiki/Importance_sampling).
Let $$\pi_{\theta}$$ be the target policy and the old policy $$\pi_{\theta_{\text{old}}}$$ be the behavior policy.
Formally, we aim to maximize a surrogate objective:

$$
J(\theta) = \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}[\sum_t \rho_t(\theta) Q_{\pi_{\theta_{\text{old}}}}(s_t,a_t)],
$$

where $$\rho_t(\theta) = \frac{ \pi_{\theta}(a_t \mid s_t) }{ \pi_{\theta_{\text{old}}}(a_t \mid s_t) }$$ is called the importance-sampling ratio.


The gradient estimation is:

$$
\begin{align*}
\nabla_{\theta} J(\theta)
&= \nabla_{\theta} \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}\left[\sum_t \frac{\pi_{\theta}(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)} Q_{\pi_{\theta_{\text{old}}}}(s_t,a_t)\right] \\
&= \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}\left[\sum_t \frac{\nabla_{\theta} \pi_{\theta}(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)} Q_{\pi_{\theta_{\text{old}}}}(s_t,a_t)\right] \\
&= \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}\left[\sum_t \frac{\pi_{\theta}(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)} Q_{\pi_{\theta_{\text{old}}}}(s_t,a_t) \nabla_{\theta} \log \pi_{\theta}(a_t \mid s_t)\right] \\
&= \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}\left[\sum_t \rho_t(\theta) Q_{\pi_{\theta_{\text{old}}}}(s_t,a_t) \nabla_{\theta} \log \pi_{\theta}(a_t \mid s_t)\right] \\
&= \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}\left[\sum_t \rho_t(\theta) G_t \nabla_{\theta} \log \pi_{\theta}(a_t \mid s_t)\right].
\end{align*}
$$

Similarly, we can subtract a baseline $$b_t$$ from the return $$G_t$$ to reduce the gradient variance without adding bias:

$$
\begin{align*}
\nabla_{\theta} J(\theta)
&= \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}\left[\sum_t \rho_t(\theta) (G_t - b_t) \nabla_{\theta} \log \pi_{\theta}(a_t \mid s_t)\right] \\
&= \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}\left[\sum_t \rho_t(\theta) A_t \nabla_{\theta} \log \pi_{\theta}(a_t \mid s_t)\right] \\
&= \nabla_{\theta} \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}[\sum_t \rho_t(\theta) A_t],
\end{align*}
$$

where $$A_t = G_t - b_t$$.

To enhance training stability, it's crucial to prevent excessive changes to the policy in a single update step. Trust Region Policy Optimization (TRPO) <d-cite key="schulman2015trust"></d-cite> achieves this by imposing a [KL divergence](https://en.wikipedia.org/wiki/Kullback%E2%80%93Leibler_divergence) constraint, ensuring controlled and gradual policy updates at each update.
Proximal Policy Optimization (PPO) <d-cite key="schulman2017proximal"></d-cite> is inspired by the same goal as TRPO while being significantly simpler to implement.
Specifically, PPO uses a *clipped surrogate objective* to constrain the policy update:

$$
\begin{equation}
J_{\text{PPO}}(\theta)
= \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}\left[\sum_t \min(\rho_t(\theta) A_t, \operatorname{clip}(\rho_t(\theta), 1-\epsilon, 1+\epsilon) A_t)\right].
\end{equation}
$$

Define a modified ratio <d-cite key="lan2022model"></d-cite> $$\hat{\rho}_t(\theta)$$:

$$
\begin{align*}
\hat{\rho}_t(\theta) =
\begin{cases}
0, & \text{if } A_t > 0 \text{ and } \rho_t(\theta) > 1+\epsilon, \\
0, & \text{if } A_t < 0 \text{ and } \rho_t(\theta) < 1-\epsilon, \\
\rho_t(\theta), & \text{otherwise.}
\end{cases}
\end{align*}
$$

Then Equation (15) can be rewritten as:

$$
\begin{equation}
J_{\text{PPO}}(\theta)
= \mathbb{E}_{\tau \sim \pi_{\theta_{\text{old}}}}[\sum_t \hat{\rho}_t(\theta) A_t].
\end{equation}
$$

For advantage $$A_t$$, we usually use $$\lambda$$-return $$G_t^{\lambda}$$ <d-cite key="sutton2011reinforcement"></d-cite> instead of $$G_t$$ and set $$b_t = V_{\pi_{\theta}}(s_t)$$:

$$
\begin{equation}
A_t = G_t^{\lambda} - V_{\pi_{\theta}}(s_t).
\end{equation}
$$

The above term is also known as the Generalized Advantage Estimate (GAE) <d-cite key="schulman2016high"></d-cite>.

In practice, we may also normalize advantages to further improve training stability:

$$
\hat{A}_t = \frac{A_t - \mathbb{E}[A_t]}{\operatorname{std}[A_t]},
$$

where $$\mathbb{E}[A_t] = \frac{1}{T} \sum_{t=0}^{T-1} A_t$$ and $$\operatorname{std}[A_t] = \sqrt{\frac{1}{T-1} \sum_{t=0}^{T-1} (A_t - \mathbb{E}[A_t])^2}$$.


## GRPO

Group Relative Policy Optimization (GRPO) <d-cite key="shao2024deepseekmath"></d-cite> basically combines PPO with the multiple sampling trick from RLOO:

$$
\begin{align*}
J_{\text{PPO with multiple sampling (version 1)}}(\theta)
= \mathbb{E}_{\{ \tau_{k,t} \}_{k=1}^K \sim \pi_{\theta_{\text{old}}}}\left[\frac{1}{K-1} \sum_t \sum_{k=1}^{K} \hat{\rho}_{k,t}(\theta) A_{k,t} \right],
\end{align*}
$$

where $$A_{k,t} = G_{k,t}^{\lambda} - b_t$$.

Note that the above objective differs from the one proposed in the DeepSeekMath paper <d-cite key="shao2024deepseekmath"></d-cite>:

$$
\begin{align}
J_{\text{GRPO}}(\theta)
= \mathbb{E}_{\{ \tau_{k} \}_{k=1}^K \sim \pi_{\theta_{\text{old}}}}
\left[
\frac{1}{K} \sum_{k=1}^K \frac{1}{ \mid o_k \mid } \sum_{t=1}^{ \mid o_k \mid } \left(\hat{\rho}_{k,t}(\theta) \hat{A}_{k} - \beta D_{\text{KL}}(\pi_{\theta}  \mid  \mid  \pi_{\text{ref}})\right)
\right],
\end{align}
$$

where $$o_k$$ is the $$k$$-the response, $$ \mid o \mid $$ is the response length, $$\hat{A}_{k} = \frac{r_k - \mathbb{E}[r_k]}{\operatorname{std}[r_k]}$$, and $$\pi_{\text{ref}}$$ is the reference policy.

To reduce the gap, we consider the outcome reward setting with $$\lambda=\gamma=1$$.
In this case, we have $$G_t^{\lambda} = G_t = \sum_{i=t}^{T-1} R(s_i, a_i) = R(s_{T-1}, a_{T-1})$$, where $$R(s_{T-1}, a_{T-1})$$ is the outcome reward.
Moreover, we do not sample multiple trajectories $$\{\tau_{k,t}\}_{k=1}^{K}$$ on the fly starting from $$s_t$$ at each time-step $$t$$.
Instead, we sample multiple trajectories $$\{\tau_{k}\}_{k=1}^{K}$$ **starting from the initial state $$s_0=\mathbf{q}$$**; and the sampling process is only conducted once at $$t=0$$ for each prompt.
Set $$b_t = \mathbb{E}[r_k] = \frac{1}{K} \sum_{k=1}^K r_k$$ where $$r_k$$ is the outcome reward of the $$k$$-th trajectory.
We then have 

$$
\begin{align}
J_{\text{PPO with multiple sampling (version 2)}}(\theta)
= \mathbb{E}_{\{ \tau_{k} \}_{k=1}^K \sim \pi_{\theta_{\text{old}}}} \left[\frac{1}{K-1} \sum_{k=1}^{K} \sum_{t=1}^{ \mid o_k \mid } \hat{\rho}_{k,t}(\theta) A_{k} \right],
\end{align}
$$

where $$A_{k} = r_k - \mathbb{E}[r_k]$$.

Note that here the baseline $$\mathbb{E}[r_k]$$ is no longer an unbiased estimation of $$V_{\pi_{\theta}}(s_t)$$, but an unbiased estimation of $$V_{\pi_{\theta}}(s_0)$$.
In practice, we may also normalize advantages to further improve training stability:

$$
\begin{align}
\hat{A}_{k}
= \frac{A_k - \mathbb{E}[A_k]}{\operatorname{std}[A_k]}
= \frac{A_k}{\operatorname{std}[A_k]}
= \frac{A_k}{\operatorname{std}[r_k]}
= \frac{r_k - \mathbb{E}[r_k]}{\operatorname{std}[r_k]}.
\end{align}
$$

Notice that compared with GRPO objective (Equation (18)), the KL divergence term is dropped in Equation (19). There are several reasons for doing this:
1. As proposed in the PPO paper <d-cite key="schulman2017proximal"></d-cite>, the clipped objective is designed as a replacement of constraint policy optimization in form of the KL divergence term. Thus, adding a KL divergence term is not necessary theoretically.
2. Removing the KL divergence term simplifies the implementation, saving memory and computation.
3. In practice, some recent works (e.g., DAPO <d-cite key="yu2025dapo"></d-cite> and Dr. GRPO <d-cite key="liu2025understanding"></d-cite>) have shown that the KL divergence term is not necessary for LLM reasoning tasks.

However, even after removing the KL divergence term, Equation (19) still differs from GRPO objective.
In fact, GRPO objective is biased, as pointed out in the Dr. GRPO paper <d-cite key="liu2025understanding"></d-cite>.


## Dr. GRPO

Specifically, there are three biases in GRPO objective:

{% include figure.liquid path="assets/img/2026-04-27-llm-post-training/grpo.png" class="img-fluid" %}

1. *Baseline bias*: This is caused by using a biased baseline without correcting the scaling factor (see Equation (14)). When using $$\mathbb{E}[r_k]$$ as the baseline, we should use a scaling factor of $$\frac{1}{K-1}$$, instead of $$\frac{1}{K}$$.

2. *Response-level length bias*: This bias arises from dividing by response length $$\mid \mathbf{o} \mid$$. For correct answers (with positive advantages), this bias incentivizes shorter responses; for incorrect answers (with negative advantages), this bias results in longer responses.

3. *Question-level difficulty bias*: Although advantage normalization is a common technique for stabilizing RL training, it introduces bias into the estimated gradient when the advantages are divided by the standard deviation term. In the context of LLM post-training, questions within one batch can vary significantly in type, domain, and difficulty. As a result, normalizing advantages at the question level leads to question-specific gradient estimation bias. That is, the estimated gradients for different questions are skewed in different ways, disproportionately influencing optimization across questions. Furthermore, each question effectively represents a different task with its own reward function. **In essence, LLM post-training is a form of multi-task learning.** From this perspective, applying advantage normalization across diverse questions can result in unintended weighting distortions in the objective. For example, ideally, optimization should prioritize learning from medium-difficulty questions: easy questions are already solved, while hard questions may be too difficult to learn from effectively. Thus, we should reduce the weighting of both easy and hard questions during policy updates. However, when advantages are divided by their standard deviations, the weighting of easy and hard questions is unintentionally increased, as these questions typically exhibit lower advantage standard deviations. This undermines the desired optimization dynamics, making the learning process less effective.  


For the baseline bias, the scaling factor can be absorbed into the learning rate. Since the learning rate is usually tuned in practice, this bias does not significantly affect the training performance.
For the other two biases, Group Relative Policy Optimization Done Right (Dr. GRPO) <d-cite key="liu2025understanding"></d-cite> addresses them by simply removing $$\frac{1}{| \mathbf{o} |}$$ and $$\operatorname{std}[r_k]$$:

$$
\begin{align}
J_{\text{Dr. GRPO}}(\theta)
= \mathbb{E}_{\{ \tau_{k} \}_{k=1}^K \sim \pi_{\theta_{\text{old}}}}\left[\sum_{k=1}^{K} \sum_{t=1}^{ \mid o_k \mid } \hat{\rho}_{k,t}(\theta) (r_k - \mathbb{E}[r_k])\right],
\end{align}
$$

which is essentially equivalent to Equation (19), differing only by a factor of $$\frac{1}{K-1}$$.


## Conclusion

In this article, we have presented a unified theoretical framework for understanding recent RL algorithms applied to LLM post-training, grounded in the Policy Gradient Theorem. By formalizing LLM post-training as a token-level MDP — a setting uniquely characterized by deterministic transitions, prompt-dependent rewards, and the ability to sample multiple trajectories from the same state — we have shown how seemingly disparate algorithms such as REINFORCE, ReMax, RLOO, PPO, GRPO, and Dr. GRPO are in fact variations of the same core principle: estimating unbiased gradients of the expected return while mitigating variance through carefully designed baselines.

As RL continues to play a central role in LLM post-training, this unified view offers a roadmap for developing more robust, interpretable, and scalable post-training methods — grounded not in empirical tricks, but in the enduring mathematics of RL.