---
layout: distill
title: "Learning to Maximize Rewards via Reaching Goals"
description: "Goal-conditioned reinforcement learning learns to reach goals instead of optimizing hand-crafted rewards. Despite its popularity, the community often categorizes goal-conditioned reinforcement learning as a special case of reinforcement learning. In this post, we aim to build a direct conversion from any reward-maximization reinforcement learning problem to a goal-conditioned reinforcement learning problem, and to draw connections with the stochastic shortest path framework. Our conversion provides a new perspective on the reinforcement learning problem: <i>maximizing rewards is equivalent to reaching some goals</i>."

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
  - name: Chongyi Zheng
    url: https://chongyi-zheng.github.io
    affiliations:
      name: Princeton University
  - name: Mahsa Bastankhah
    url: https://sites.google.com/view/mahsabastankhah
    affiliations:
      name: Princeton University
  - name: Grace Liu
    url: https://graliuce.github.io
    affiliations:
      name: Carnegie Mellon University
  - name: Benjamin Eysenbach
    url: https://ben-eysenbach.github.io
    affiliations:
      name: Princeton University


# must be the exact same name as your blogpost
bibliography: 2026-04-27-mdp-to-gcmdp.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Three building blocks
  - name: Bridging RL and GCRL
  - name: Does the conversion work in practice?
  - name: Closing remarks

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
  .detail { 
    color: #1f77b4; 
    cursor: pointer; 
    display: inline-block; 
    margin-bottom: 1rem; 
  }
---

{% include figure.liquid path="assets/img/2026-04-27-mdp-to-gcmdp/rl-ssp-gcrl.png" class="img-fluid" %}
<div class="caption">
  Figure credit: <a href="https://sketchplanations.com">Sketchplanations</a> and <a href="https://gemini.google.com">Google Gemini</a>.
</div>

Reinforcement learning (RL) has achieved great success in solving many decision-making problems, from outperforming human-level control on challenging games<d-cite key="silver2018general"></d-cite> and fine-tuning large language models<d-cite key="shao2024deepseekmath"></d-cite> to learning scalable robotic manipulation policies<d-cite key="amin2025pi"></d-cite>. In the standard view, RL is a reward-maximization problem: given a hand-crafted reward function, we search for a policy that maximizes expected return. While the reward-maximizing formulation is popular, it is not the only language for describing a control problem.

When solving a navigation task, researchers will probably consider the problem differently. One researcher might describe it as “maximize cumulative reward.” Another might say “reach the destination as quickly as possible.” A third might say “maximize the probability of reaching the destination.” These sound like different problems, but they are closely related.

In standard reinforcement learning (RL), the objective is to maximize cumulative reward. In the stochastic shortest path (SSP) view, the objective is to reach a terminal state with minimum total cost, often interpreted as minimizing path length<d-cite key="bertsekas1991analysis,bertsekas1996neuro,kolobov2012planning"></d-cite>. In goal-conditioned reinforcement learning (GCRL), the agent is given a goal and aims to maximize the probability of reaching that goal<d-cite key="kaelbling1993learning,schaul2015universal"></d-cite>. These three framings consist of three vertices of a triangle that governs the same underlying decision-making problem.

<!-- often alternative views of the same underlying decision-making problem -->

<!-- Throughout this post, we use “GCRL” in this general objective-based sense: not merely RL with a few hand-designed goal-reaching rewards, but a formulation in which success is defined by reaching a specified goal. -->

<!-- If you talk to different RL researchers, they might describe problems in three languages. One focuses on standard RL and maximizing discounted return. Another uses the stochastic shortest path (SSP) view, emphasizing the cost of reaching a terminal state<d-cite key="bertsekas1991analysis,bertsekas1996neuro,kolobov2012planning"></d-cite>. A third prefers goal-conditioned RL (GCRL), where the agent is explicitly tasked to reach specified goals<d-cite key="kaelbling1993learning,schaul2015universal"></d-cite>. These three framings sound different, but they are closely related: RL emphasizes long-horizon reward accumulation, SSP emphasizes termination with minimal cost, and GCRL emphasizes reaching desired goals. -->

Two sides of this triangle are already well understood. Prior work shows that any RL problem can be converted into an equivalent SSP problem<d-cite key="bertsekas1991analysis,bertsekas1996neuro,kolobov2012planning"></d-cite> ($$\text{RL} \iff \text{SSP}$$). At the same time, while goal-reaching problems are usually viewed as quite challenging, recent GCRL methods demonstrate that adopting tools from SSP problem (e.g., triangle inequality) can effectively help solving GCRL problems<d-cite key="wang2023optimal,park2025transitive"></d-cite> ($$\text{GCRL} \iff \text{SSP}$$). Fundamentally, the goal-reaching problem exposes structure that is absent from the reward-maximization problem, and that structure can provide supervision that assists an otherwise signal-sparse RL problem. The one missing side of this triangle is $$\text{RL} \iff \text{GCRL}$$:

<p align="center"><i>Can any reward maximization problem be converted into a goal-reaching problem? </i></p>

In this post we show that the answer to this question is **YES**: any reward-maximization problem (MDP) can be converted into an equivalent goal-reaching problem (GCMDP). Our construction augments the original MDP with two absorbing states and pushes the reward function into the transition dynamics. We show that, under this construction, maximizing discounted return in the original MDP is exactly equivalent to maximizing the probability of reaching one of the absorbing states in the augmented GCMDP. Combined with the known RL–SSP equivalence, this yields a clean relationship.

<div class="mt-3">
  <div style="max-width: 350px; margin: 0.0rem auto;">
    {% include figure.liquid path="assets/img/2026-04-27-mdp-to-gcmdp/triangle.svg" class="img-fluid rounded" %}
  </div>
</div>

## Three building blocks

In this section, we will review the three building blocks, RL, SSP, and GCRL, formally, providing the foundations to formulate the conversions between them.

We consider a Markov decision process <d-cite key="sutton1998reinforcement"></d-cite> $$\mathcal{M} = (\mathcal{S}, \mathcal{A}, p, r, p_0, \gamma)$$ defined by a state space $$\mathcal{S}$$, an action space $$\mathcal{A}$$, a transition probability measure $$p: \mathcal{S} \times \mathcal{A} \to \Delta(\mathcal{S})$$, a reward function $$r: \mathcal{S} \times \mathcal{A} \to \mathbb{R}$$, an initial state probability measure $$p_0 \in \Delta(\mathcal{S})$$, and a discount factor $$\gamma \in [0, 1)$$, where $$\Delta(\cdot)$$ denotes the set of all possible probability measures over a space. We use $$t$$ to denote the time step in MDP. With slight abuse of notation, we use the probability measure to denote the probability mass in discrete MDPs and denote the probability density in continuous MDPs.

### RL objectives and successor measures

We first review the standard RL objective and the definition of successor measures. The goal of RL is to learn a policy $$\pi: \mathcal{S} \to \Delta(\mathcal{A})$$ that maximizes the expected discounted return 

$$
\begin{align}
\max_{\pi} J_{\gamma}(\pi), \quad J_{\gamma}(\pi) = (1 - \gamma) \mathbb{E}_{\tau \sim \pi(\tau)} \left[ \sum_{t = 0}^{\infty} \gamma^t r(s_t, a_t) \right],
\label{eq:rl-obj}
\end{align}
$$

where $$\tau$$ is a trajectory sampled by the policy $$\pi$$. Alternatively, we can swap the discounted sum over rewards into a discounted sum over states and use it to describe the expected discounted return. Namely, the discounted sum over states is called *the discounted state occupancy measure*<d-cite key="puterman2014markov"></d-cite>, i.e., the *successor measures*<d-cite key="dayan1993improving,barreto2017successor"></d-cite>,

$$
\begin{align}
p_{\gamma}^{\pi}(s) = (1 - \gamma) \sum_{t = 0}^{\infty} \gamma^t p^{\pi}_t(s),
\label{eq:succ-measure}
\end{align}
$$

where $$p^{\pi}_t(s)$$ is the probability measure of reaching state $$s$$ at exact time step $$t$$ under policy $$\pi$$: 

$$
\begin{align}
p^{\pi}_t(s) = \int_{\mathcal{S} \times \mathcal{A} \times \cdots \times \mathcal{S} \times \mathcal{A}} p_0(s_0) \prod_{k = 0}^{t - 1} \pi(a_k \mid s_k) p(s_{k + 1} \mid s_k, a_k) ds_0 da_0 \cdots ds_{t - 1} da_{t - 1}, \quad s_t = s.
\label{eq:time-dependent-succ-measure}
\end{align}
$$

We note that the probability measure of visiting state $$s$$ at the beginning is $$p^{\pi}_0(s) \triangleq p_0(s) $$.<d-footnote>The summation in Eq.$~\ref{eq:succ-measure}$ starts from the current time step<d-cite key="eysenbach2022contrastive,touati2021learning"></d-cite> instead of the next time step as in some prior approaches<d-cite key="janner2020gamma,zheng2023contrastive"></d-cite>.</d-footnote> Using the successor measure, we can rewrite the expected discounted return as 

$$
\begin{align}
J_{\gamma}(\pi) = \mathbb{E}_{s \sim p_{\gamma}^{\pi}(s), a \sim \pi(a \mid s)}\left[ r(s, a) \right].
\label{eq:succ-measure-rl-obj}
\end{align}
$$

This alternative definition implies that maximizing the expected discounted return is equivalent to maximizing the expected reward under the successor measure.

### Goal-conditioned RL

We now review the formulation of goal-conditioned RL problems. Goal-conditioned RL<d-cite key="kaelbling1993learning,schaul2015universal"></d-cite> is a special case of the RL problem, where a standard MDP is augmented with a goal space $$\mathcal{G}$$ and the reward function $$r_{\text{GC}}: \mathcal{S} \times \mathcal{G} \to \mathbb{R}$$ is defined using goals $$g \in \mathcal{G}$$ sampled from the goal measure $$p_{\mathcal{G}} \in \Delta(\mathcal{G})$$, i.e., a goal-conditioned MDP $$\mathcal{M}_{\text{GCRL}} = (\mathcal{S}, \mathcal{A}, \mathcal{G}, p, r _{\text{GC}}, p_0, \gamma, p _{\mathcal{G}} )$$. For the goal space, prior work defined it in various forms. Specifically, the goal space can be the entire state space (e.g., x-y position of the agent or a RGB image)<d-cite key="wang2023optimal,park2024value,nachum2018data,walke2023bridgedata"></d-cite> or a subspace of the state space (e.g., joint positions of a robot arm or x-y positions of a block)<d-cite key="eysenbach2022contrastive,park2025horizon,andrychowicz2017hindsight"></d-cite>. Among the two choices, setting the goal space to be the entire state space, i.e., $$\mathcal{G} = \mathcal{S}$$, is both widely used and generic. In the following sections, we will construct a special goal space to convert a standard reward-maximizing MDP into a GCMDP, enabling solving general RL problems using GCRL algorithms.

Prior work usually defined the goal-conditioned reward function as a delta measure centered at the goal $$r_{\text{GC}}(s, g) = \delta(s \mid g)$$<d-footnote>The delta measure is an indicator function $\delta(s \mid g) = \mathbb{1}(s = g)$ for discrete GCMDPs and a Dirac delta function $\delta(s \mid g) = \delta_{g}(s)$ for continuous GCMDPs.</d-footnote><d-cite key="eysenbach2022contrastive,zheng2023contrastive"></d-cite>. This definition allows us to rewrite the expected discounted return (Eq.$$~\ref{eq:succ-measure-rl-obj}$$) for a goal-conditioned policy $$\pi_{\text{GC}}: \mathcal{S} \times \mathcal{G} \to \Delta(\mathcal{A})$$ as

$$
\begin{align}
\max_{\pi_{\text{GC}}} J_{\text{GCRL}}(\pi_{\text{GC}}), \quad J_{\text{GCRL}}(\pi_{\text{GC}}) &= \mathbb{E}_{\substack{g \sim p_{\mathcal{G}}(g), \, s \sim p^{\pi_{\text{GC}}}_{\gamma}(s \mid g) }} \left[ \delta(s \mid g) \right] = \mathbb{E}_{g \sim p_{\mathcal{G}}(g)} \left[ p^{\pi_{\text{GC}}}_{\gamma}(g \mid g) \right].
\label{eq:gcrl-obj}
\end{align}
$$

Intuitively, this objective indicates that solving GCRL is equivalent to finding the goal-conditioned policy that maximizes the probability measure of reaching desired goals when commanded towards those goals. Note that the GCRL problem is also equivalent to a multi-task RL problem<d-cite key="wilson2007multi,yu2020meta,teh2017distral"></d-cite>, where tasks correspond to reaching different goals.

Until now, we have not discussed what happens after the agent reaches the goal. Since GCRL problems typically have infinite horizons and the agent can still move after reaching the goal, the optimal behavior is not only reaching the goal but also staying at the goal as long as possible. We next discuss a special type of GCMDP that simplifies agents' behaviors after reaching the goal, namely, the stochastic shortest path problem.

<details style="background-color: #f4f4f4ff; padding: 15px; border-left: 4px solid #1E88E5; margin: 20px 0;">
  <summary>Remarks</summary>
  Prior work also used alternative definitions of the goal-conditioned reward. These include an indicator function for reaching the goal<d-cite key="ghosh2021learning"></d-cite> $r_{\text{GC}}(s, g) = \mathbb{1}(s = g)$ or a cost function for not reaching the goal<d-cite key="wang2023optimal,park2024value"></d-cite> $r_{\text{GC}}(s, g) = - \mathbb{1}(s \neq g)$.

  The second definition of the goal-conditioned reward function is closely related to the SSP problem, which we will introduce in the next section.
</details>


### Stochastic shortest path

The third building block for our discussion is the stochastic shortest path problem. We will review the formal definition of the SSP problem and discuss its connection with GCRL. The stochastic shortest path problem is defined as<d-cite key="bertsekas1991analysis,bertsekas1996neuro"></d-cite> $$\mathcal{M}_{\text{SSP}} = (\mathcal{S}, \mathcal{A}, \mathcal{G}, p_\text{SSP}, r_{\text{SSP}}, p_0, p_{\mathcal{G}} )$$, where the environment will terminate the episode once the agent reaches the goal. Many prior GCRL methods actually invoke intriguing tools such as a constant cost<d-cite key="park2024ogbench"></d-cite> or the triangle inequality (quasimetric)<d-cite key="wang2023optimal,myers2024learning,park2025transitive"></d-cite> from the SSP formulation to solve the problem. Since the SSP focuses on agents' behavior before termination, it requires the policy to hit the goal eventually, i.e., a proper policy<d-cite key="bertsekas1996neuro,kolobov2012planning"></d-cite>.

<p align="left" id="def:proper-policy"><strong>Definition 1. </strong><i>Given a goal $g \in \mathcal{G}$, a SSP policy $\pi_{\text{SSP}}: \mathcal{S} \times \mathcal{G} \to \Delta(\mathcal{A})$ is proper, if there exists a finite time step $t < \infty$ such that the policy reaches the goal $g$ when commanded towards the same goal $g$, i.e., $p^{\pi_{\text{SSP}}}_t(g \mid g) > 0$.</i></p>

Therefore, a mild assumption is to assume all policies of interest are proper. Using the definition of a proper policy, the SSP problem can be adapted from a GCRL problem with the following modifications:

1. A negative cost for not reaching the goal, e.g., $$r_{\text{SSP}}(s, g) = - \mathbb{1}(s \neq g)$$.

2. A *goal-conditioned* transition probability measures $$p_{\text{SSP}}: \mathcal{S} \times \mathcal{A} \times \mathcal{G} \to \Delta(\mathcal{S})$$: for any transition $$(s, a, s')$$ and any goal $$g$$, 

    $$
    \begin{align}
    p_{\text{SSP}}(s' \mid s, a, g) = \begin{cases}
      p(s' \mid s, a) & \text{if} \, s \neq g \\
      \\
      \delta(s' \mid g) & \text{otherwise}
    \end{cases}.
    \label{eq:ssp-transition}
    \end{align}
    $$

    Intuitively, the agent will always stay at the goal after reaching it.

3. Finite horizon $$(\gamma = 1)$$ with proper policies. For any proper policy, the SSP objective is to minimize the sum of costs (maximize the sum of rewards) before hitting the goal:

    $$
    \begin{align}
    \max_{\pi_\text{SSP}: \: \pi_\text{SSP} \text{ is proper}} J_{\text{SSP}}(\pi_{\text{SSP}}), \quad J_{\text{SSP}}(\pi_{\text{SSP}}) = \mathbb{E}_{\tau \sim \pi_{\text{SSP}}(\tau)} \left[ \sum_{t = 0}^{\infty} r_{\text{SSP}}(s_t, g) \right].
    \end{align}
    $$

    This objective is finite because of the proper policy assumption.

As indicated by the goal-conditioned transitions in Eq.$$~\ref{eq:ssp-transition}$$, the agent will always stay at the desired goals once it reaches them. Therefore, the optimal behavior is to reach the goal as quickly as possible. We include an example comparing the optimal behaviors of GCRL and SSP in the figure below. 

<span style="color: #e56a1eff;">
<strong style="color: #e56a1eff;">Remark.</strong> Although we show that SSP can be interpreted as a special case of GCRL (Eq.$$~\ref{eq:ssp-transition}$$), we consider them separately in our discussion. The reason is twofold. First, the standard GCRL formulation does not assume goal-conditioned transition probability measures as in Eq.$$~\ref{eq:ssp-transition}$$. Second, the GCRL problem does not assume every Markovian policy is proper as in Definition <a href="#def:proper-policy">1</a>. We note that the optimal GCRL policy is proper.
</span>

<div class="col mt-3">
{% include figure.liquid path="assets/img/2026-04-27-mdp-to-gcmdp/1d-car.png" class="img-fluid rounded" %}
</div>
<div class="caption">
  Goal-conditioned RL (GCRL) methods aim to not only reach the goal but also stay at the goal as long as possible, while stochastic shortest path (SSP) algorithms are tasked to reach the goal as quickly as possible. Figure credit: <a href="https://gemini.google.com">Google Gemini</a>.
</div>

<span style="color: #e56a1eff;">
Prior work has already shown that (See Sec. 2.3 of Bertsekas and Tsitsiklis (1996)<d-cite key="bertsekas1996neuro"></d-cite> or Theorem 2.21 of Mausam and Kolobov (2012)<d-cite key="kolobov2012planning"></d-cite>) any infinite horizon RL problem can be converted into an SSP problem. </span>This appealing connection between RL and SSP raises the question:

<p align="center"><i>Can we convert any RL problem into a GCRL problem?</i></p>

We will construct a conversion next.

## Bridging RL and GCRL

Building upon the three building blocks, we now show that any RL problem can be converted into a GCRL problem. The goal of our construction is to preserve policy optimality: the optimal policy in a standard MDP is equivalent to the optimal goal-conditioned policy for reaching some goal in the resulting GCMDP. We start the construction by augmenting the state space and the transition probability measure of a standard MDP $$\mathcal{M} = (\mathcal{S}, \mathcal{A}, p, r, p_0, \gamma)$$.

1. The augmented state space additionally includes two terminal states, a success state $$g_+$$ and a failure state $$g_-$$: $$\mathcal{S}_{\text{aug}} = \mathcal{S} \cup \{ g_+, g_- \}$$.

2. The augmented probability measures of transiting into states in the original state space are proportional to the discount factor; The augmented probability measures of transiting into the two terminal states are proportional to the reward in the original MDP: for any state $$s \in \mathcal{S}_{\text{aug}}$$, action $$a \in \mathcal{A}$$, and next state $$s' \in \mathcal{S}_{\text{aug}}$$, 
  
    $$
    \begin{align}
      p_{\text{aug}}(s' \mid s, a) =
      \begin{cases}
      \gamma p(s' \mid s, a) & \text{if } s \in \mathcal{S} \text{ and } s' \in \mathcal{S} \\
      (1 - \gamma) r(s, a) & \text{if } s \in \mathcal{S} \text{ and } s' = g_+ \\
      (1 - \gamma) (1 - r(s, a)) & \text{if } s \in \mathcal{S} \text{ and } s' = g_- \\
      \delta(s' \mid s) & \text{if } s \in \{ g_+, g_- \}
      \end{cases}.
      \label{eq:aug-transition-prob-measure}
    \end{align}
    $$
    
    <details style="background-color: #f4f4f4ff; padding: 15px; border-left: 4px solid #1E88E5; margin: 20px 0;">
      <summary>Remarks</summary>
      Since the range of $p_{\text{aug}}(s' \mid s, a)$ is $[0, \infty)$, for a reward function $\tilde{r}(s, a)$ taking values in $[r_{\min}, r_{\max}]$, we can apply the min-max normalization to transform the range into $[0, 1]$: 

      \begin{align*}
      r(s, a) = \frac{\tilde{r}(s, a) - r_{\min}}{r_{\max} - r_{\min}}.
      \end{align*}
      We can also easily verify that $p_{\text{aug}}(s' \mid s, a)$ is still normalized: for any state $s \in \mathcal{S}_{\text{aug}}$ and action $a \in \mathcal{A}$,
      
      \begin{align*}
      \int_{\mathcal{S}_{\text{aug}}} p(s' \mid s, a) ds' &= 1.
      \end{align*}
    </details>

These augmentations allow us to define the goal state as a singleton $$\mathcal{G}_{\text{aug}} = \{ g_+ \}$$ with goal prior $$p_{\mathcal{G}_{\text{aug}}}(g) = \delta(g \mid g_+)$$, choose the reward function as the delta measure $$r_\text{aug}(s, g) = \delta(s \mid g)$$. We will use a *separate* discount factor $$\gamma_{\text{aug}} \in [0, 1]$$ for the new augmented GCMDP. Taken together, the augmented GCMDP shares the same action space and initial state measure as the original MDP: $$\mathcal{M}_{\text{aug}} = (\mathcal{S}_{\text{aug}}, \mathcal{A}, \mathcal{G}_{\text{aug}}, p_{\text{aug}}, p_0, \gamma_{\text{aug}}, p_{\mathcal{G}_{\text{aug}}})$$. Below, we provide a didactic example showing the conversion from a standard MDP to its augmented GCMDP.

<p align="left" id="def:proper-policy"><strong>Didactic example. </strong> River Swim MDP<d-cite key="strehl2008analysis"></d-cite> involves swimming across a river by choosing to move right at each state. The solid arrows indicate transition probability measures of taking action RIGHT at each state. The agent receives a reward of $1.0$ in the rightmost state and receives a small distractor reward of $0.005$ if it moves left at any other state. The exploration is challenging due to stochastic transitions.

<div class="col mt-3">
    {% include figure.liquid path="assets/img/2026-04-27-mdp-to-gcmdp/riverswim_mdp.svg" class="img-fluid rounded" %}
</div>
We convert the River Swim MDP into its augmented GCMDP by first adding a success state $g_+$ and a failure state $g_-$ and then discounting the original transition probability measures.
<div class="col mt-3">
    {% include figure.liquid path="assets/img/2026-04-27-mdp-to-gcmdp/riverswim_gcmdp.svg" class="img-fluid rounded" %}
</div>
<!-- The optimal goal-reaching policy for state $g_+$ in the augmented GCMDP is equivalent to the reward-maximizing policy in the original MDP. -->
</p>

Our construction provides a generic conversion from any MDP to its corresponding GCMDP. However, there is one important question remaining:

<p align="center"><i>Does the augmented GCMDP preserve policy optimality?</i></p>

In the context of the River Swim MDP, the question becomes: is the optimal goal-reaching policy for state $g_+$ in the augmented GCMDP equivalent to the policy that keeps moving right in the original MDP?

Fortunately, the answer is **YES** and we provide a formal proof for the general statement in the next section.

### Harnessing the policy optimality

In this section, we will show that the optimal goal-conditioned policy in the augmented GCMDP is equivalent to the optimal policy in the original reward-maximizing MDP. We start by examining the GCRL objective of the augmented GCMDP. Given that the augmented reward function is a delta measure $$r_\text{aug}(s, g) = \delta(s \mid g)$$ and the goal space only contains $$g_+$$, the GCRL objective of the augmented GCMDP (Eq.$$~\ref{eq:gcrl-obj}$$) for the goal-conditioned policy $$\pi_{\text{aug}}(a \mid s, g)$$ reduces to 

$$
\begin{align}
J_{\text{GCRL}}(\pi_{\text{aug}}) = \mathbb{E}_{g \sim \delta(g \mid g_+)}[p^{\pi_{\text{aug}}}_{\gamma_{\text{aug}}}( g \mid g)] = p^{\pi_{\text{aug}}}_{\gamma_{\text{aug}}}( g_+ \mid g_+),
\end{align}
$$

which is the success measure of reaching the single success state<d-cite key="liu2025a,bastankhah2025"></d-cite> under the goal-conditioned policy (commanded towards the same $g_{+}$). To simplify notations, we denote the goal-conditioned policy and the GCRL objective as $\pi_{\text{aug}}(a \mid s) \triangleq \pi_{\text{aug}}(a \mid s, g_+)$ and $$p^{\pi_{\text{aug}}}_{\gamma_{\text{aug}}}(g_+) \triangleq p^{\pi_{\text{aug}}}_{\gamma_{\text{aug}}}( g_+ \mid g_+)$$.

We are now ready to prove that the optimal goal-conditioned policy $$\pi_{\text{aug}}^{\star}$$ in the augmented GCMDP corresponds to the optimal policy $$\pi^{\star}$$ in the original MDP. The main idea is to relate the GCRL objective to the RL objective, showing that they are equivalent to each other. We will first introduce the hitting time and then use it to compute the successor measure. 

<p align="left" id="def:hitting-time"><strong>Definition 2. </strong>
Given a goal-conditioned policy $\pi_{\text{aug}}: \mathcal{S} \to \Delta(\mathcal{A})$ and any state $s \in \mathcal{S}_{\text{aug}}$, the hitting time $H^{\pi_{\text{aug}}}(s)$ indicates the first time step that the agent reaches the state $s$,

\begin{align}
H^{\pi_{\text{aug}}}(s) = \inf \left\{ h \in \mathbb{N}: s_h = s \text{ following } \pi_{\text{aug}} \right\}.
\end{align}
</p>

We can relate the probability mass of the hitting time of the success state $g_+$ to the success measure in the original MDP.

<p align="left" id="lemma:hitting-time-prob-mass"><strong>Lemma 1. </strong>
<i>
Given the goal-conditioned policy $\pi_{\text{aug}}$, the probability mass of the hitting time of the success state $g_+$ satisfies, for any $h \in \mathbb{N}$,

\begin{align}
p \left( H^{\pi_{\text{aug}}}(g_+) = h \right) = \begin{cases}
  0 & h = 0 \\
  (1 - \gamma) \gamma^{h - 1} \mathbb{E}_{s \sim p^{\pi_{\text{aug}}}_{h - 1}(s), a \sim \pi_{\text{aug}}(a \mid s) } \left[ r(s, a) \right] & h = 1, 2, \cdots.
\end{cases}
\end{align}
</i>
</p>
<details style="background-color: #f4f4f4ff; padding: 15px; border-left: 4px solid #1E88E5; margin: 20px 0;">
  <summary>Proof of Lemma 1</summary>
  When $h = 0$, since the augmented GCMDP and the original MDP shares the initial state measure $p_0$, which has non-zero probability measure only within $\mathcal{S}$, it is not possible to reach $g_{+}$ at time step $h = 0$, i.e., $p \left( H^{\pi_{\text{aug}}}(g_+) = 0 \right) = 0$.

  When $h = 1, 2, \cdots$, we can examine them separately and find a general expression:

  \begin{align*}
  p \left( H^{\pi_{\text{aug}}}(g_+) = 1 \right) &= \int_{\mathcal{S} \times \mathcal{A}} p_0(s_0) \pi_{\text{aug}}(a_0 \mid s_0) p_{\text{aug}}( g_+ \mid s_0, a_0) ds_0 da_0 \\
  &\overset{(a)}{=} (1 - \gamma) \int_{\mathcal{S} \times \mathcal{A}} p_0(s_0) \pi_{\text{aug}}(a_0 \mid s_0) r(s_0, a_0) ds_0 da_0 \\
  &\overset{(b)}{=} (1 - \gamma) \mathbb{E}_{s \sim p^{\pi_{\text{aug}}}_{0}(s), a \sim \pi_{\text{aug}}(a \mid s) } \left[ r(s, a) \right], \\

  p \left( H^{\pi_{\text{aug}}}(g_+) = 2 \right) &= \int_{\mathcal{S} \times \mathcal{A} \times \mathcal{S} \times \mathcal{A}} p_0(s_0) \pi_{\text{aug}}(a_0 \mid s_0) p_{\text{aug}}( s_1 \mid s_0, a_0) \pi_{\text{aug}}(a_1 \mid s_1) p_{\text{aug}}( g_+ \mid s_1, a_1) ds_0 da_0 ds_1 d a_1\\
  &\overset{(c)}{=} (1 - \gamma) \gamma \int_{\mathcal{S} \times \mathcal{A} \times \mathcal{S} \times \mathcal{A}} p_0(s_0) \pi_{\text{aug}}(a_0 \mid s_0) p(s_1 \mid s_0, a_0) \pi_{\text{aug}}(a_1 \mid s_1) r(s_1, a_1) ds_0 da_0 ds_1 da_1 \\
  &\overset{(d)}{=} (1 - \gamma) \gamma \mathbb{E}_{s \sim p^{\pi_{\text{aug}}}_{1}(s), a \sim \pi_{\text{aug}}(a \mid s) } \left[ r(s, a) \right], \\
  \cdots
  \end{align*}

  where in <i>(a)</i> and <i>(c)</i> we apply the definition of the augmented transition probability measure in Eq.$~\ref{eq:aug-transition-prob-measure}$, and in <i>(b)</i> and <i>(d)</i> we rewrite the integral using definition of $p^{\pi_{\text{aug}}}_{t}(s)$ in Eq.$~\ref{eq:time-dependent-succ-measure}$. Therefore, we can obtain a general expression for any $h = 1, 2, \cdots$ as

  \begin{align*}
  p \left( H^{\pi_{\text{aug}}}(g_+) = h \right) = (1 - \gamma) \gamma^{h - 1} \mathbb{E}_{s \sim p^{\pi_{\text{aug}}}_{h - 1}(s), a \sim \pi_{\text{aug}}(a \mid s) } \left[ r(s, a) \right].
  \end{align*}
</details>

Eventually, using this lemma, we can compute the successor measure of the goal-conditioned policy $$\pi_{\text{aug}}: \mathcal{S} \to \Delta(\mathcal{A})$$ in the augmented GCMDP.

<p align="left" id="thm:"><strong>Theorem 1. </strong>
<i>
The successor measure of the goal-conditioned policy $\pi_{\text{aug}}$ at the success state $g_+$ in the augmented GCMDP is equivalent to the RL objective in the original MDP, i.e.,

\begin{align}
p^{\pi_{\text{aug}}}_{\gamma_{\text{aug}}}(g_+) = J_{\text{GCRL}}(\pi_{\text{aug}}) = \frac{(1 - \gamma) \gamma_{\text{aug}} }{1 - \gamma \gamma_{\text{aug}}} J_{\gamma \gamma_{\text{aug}}}(\pi_{\text{aug}}).
\end{align}

Therefore, when $\gamma_{\text{aug}} = 1$, the augmented GCMDP preserves policy optimality:

\begin{align}
\pi_{\text{aug}}^{\star} = \text{argmax} \, J_{\text{GCRL}}(\pi_{\text{aug}}) = \text{argmax} \, J_{\gamma}(\pi) = \pi^{\star}.
\end{align}
</i>
</p>
<details style="background-color: #f4f4f4ff; padding: 15px; border-left: 4px solid #1E88E5; margin: 20px 0;">
  <summary>Proof of Theorem 1</summary>
  <p>
  Given the goal-conditioned policy $\pi_{\text{aug}}$, by definition of the successor measure (Eq.$~\ref{eq:succ-measure}$), we have
  \begin{align*}
  p^{\pi_{\text{aug}}}_{\gamma_{\text{aug}}}(g_+) &= (1 - \gamma_{\text{aug}}) \sum_{t = 0}^{\infty} \gamma_{\text{aug}}^t p^{\pi_{\text{aug}}}_{t}(g_+) \\
  &\overset{(a)}{=} (1 - \gamma_{\text{aug}}) \sum_{t = 0}^{\infty} \gamma_{\text{aug}}^t p \left( H^{\pi_{\text{aug}}}(g_+) \leq t \right) \\
  &\overset{(b)}{=} (1 - \gamma_{\text{aug}}) \sum_{t = 0}^{\infty} \gamma_{\text{aug}}^t \cdot \sum_{h = 0}^{t} p \left( H^{\pi_{\text{aug}}}(g_+) = h \right) \\
  &\overset{(c)}{=} (1 - \gamma_{\text{aug}}) \sum_{h = 0}^{\infty} p \left( H^{\pi_{\text{aug}}}(g_+) = h \right) \cdot \sum_{t = h}^{\infty} \gamma^t_{\text{aug}} \\
  &= \sum_{h = 0}^{\infty} \gamma_{\text{aug}}^h p \left( H^{\pi_{\text{aug}}}(g_+) = h \right) \\
  &\overset{(d)}{=} \sum_{h = 1}^{\infty} \gamma_{\text{aug}}^h \left( (1 - \gamma) \gamma^{h - 1} \mathbb{E}_{s \sim p^{\pi_{\text{aug}}}_{h - 1}(s), a \sim \pi_{\text{aug}}(a \mid s) } \left[ r(s, a) \right] \right) \\
  &= (1 - \gamma) \gamma_{\text{aug}} \sum_{h = 1}^{\infty} (\gamma \gamma_{\text{aug}})^{h - 1} \mathbb{E}_{s \sim p^{\pi_{\text{aug}}}_{h - 1}(s), a \sim \pi_{\text{aug}}(a \mid s) } \left[ r(s, a) \right] \\
  &\overset{(e)}{=} \frac{(1 - \gamma) \gamma_{\text{aug}}}{1 - \gamma \gamma_{\text{aug}}} \cdot (1 - \gamma \gamma_{\text{aug}}) \sum_{h = 0}^{\infty} (\gamma \gamma_{\text{aug}})^{h - 1} \mathbb{E}_{s \sim p^{\pi_{\text{aug}}}_{h}(s), a \sim \pi_{\text{aug}}(a \mid s) } \left[ r(s, a) \right] \\
  &\overset{(f)}{=} \frac{(1 - \gamma) \gamma_{\text{aug}} }{1 - \gamma \gamma_{\text{aug}}} \mathbb{E}_{s \sim p_{\gamma \gamma_{\text{aug}}}^{\pi_{\text{aug}}}(s), a \sim \pi_{\text{aug}}(a \mid s)}\left[ r(s, a) \right] \\
  &= \frac{(1 - \gamma) \gamma_{\text{aug}} }{1 - \gamma \gamma_{\text{aug}}} J_{\gamma \gamma_{\text{aug}}}(\pi_{\text{aug}})
  \end{align*}
  where in <i>(a)</i> we apply the observation that reaching the success state $g_+$ at exact time step $t$ in the augmented GCMDP suggests that the hitting time must be less than $t$, in <i>(b)</i> we use the additive axiom of probability for disjoint events, in <i>(c)</i> we swap the sum over time step $t$ and the sum over hitting time $h$ by grouping the terms using different hitting time, in <i>(d)</i> we plug in the definition of the hitting time (<a href="#lemma:hitting-time-prob-mass">Lemma 1</a>), in <i>(e)</i> we apply change of variable, and in <i>(f)</i> we plug in the definition of the successor measure (Eq.$~\ref{eq:succ-measure}$).
  </p>
  <p>
  Therefore, when setting $\gamma_{\text{aug}} = 1$, we have $p^{\pi_{\text{aug}}}_{\gamma_{\text{aug}} = 1}(g_+) = J_{\gamma}(\pi_{\text{aug}})$. Thus, maximizing the successor measure in the augmented GCMDP is equivalent to maximizing the RL objective in the original MDP, i.e.,
  \begin{align*}
  \pi_{\text{aug}}^{\star} = \text{argmax} \, J_{\text{GCRL}}(\pi_{\text{aug}}) = \text{argmax} \, J_{\gamma}(\pi) = \pi^{\star}.
  \end{align*}
  </p>
</details>

<span style="color: #e56a1eff;">
<strong style="color: #e56a1eff;">Remark.</strong> When setting $$\gamma_{\text{aug}} = 1$$, one intriguing observation is that solving the augmented GCMDP is similar to solving an SSP problem as well.
</span>

Taken together, our conversion provides a new perspective to understand the RL problem: <i>maximizing rewards is equivalent to reaching some goals</i>. Therefore, in theory, we can use any GCRL algorithms to solve a reward-maximizing RL problem. We next mention some practical caveats of our conversion from an RL problem to a GCRL problem.

### Caveats

Hindsight relabeling<d-cite key="andrychowicz2017hindsight,kaelbling1993learning"></d-cite> is a widely used technique for solving GCRL and SSP problems. This technique builds upon the intuition that learning to reach some close (easy) goals helps the agent reach far away (difficult) goals later, resulting in automatic curriculum learning. However, using GCRL algorithms with hindsight relabeling to solve our augmented GCMDP might not speed up learning because the augmented states $g_+$ and $g_-$ are not in the original state space.

In practice, solving the augmented GCMDP might not be easier than solving the original MDP directly (e.g., using TD learning methods). The reasons are twofold. First, the main component of our construction is to augment the transition probability measure using the reward function in the original MDP. After augmentation, the rewards go into the stochasticity of the transition, resulting in much higher variance when interacting with the environment. Second, for dense rewards that provide supervision for RL algorithms at each time step, those supervisions have been deferred into the two additional states $g_+$ and $g_-$ (a sparse reward problem), inducing much more challenging exploration.

## Does the conversion work in practice?

<div class="col mt-3">
  <video autoplay loop muted playsinline class="img-fluid rounded" preload="metadata">
    <source src="{{ 'assets/img/2026-04-27-mdp-to-gcmdp/cliff_walking.mp4' | relative_url }}" type="video/mp4">
    Your browser doesn’t support the video tag.
  </video>
</div>
<div class="caption">
  Cliff Walking involves crossing a gridworld from a random start (stool) to the goal (cookie) while avoiding falling off a cliff.
</div>

We have shown the conversion from RL problems to the corresponding GCRL problems, but is this conversion actually useful? Can we use algorithms for one problem to solve another problem in practice? We next answer these questions by running GCRL algorithms to maximize rewards in a canonical discrete MDP called Cliff Walking. 

The Cliff Walking MDP is adapted from Example 6.6 from Sutton and Barto (1998)<d-cite key="sutton1998reinforcement"></d-cite> and requires the agent to navigate from a random start to the goal while avoiding falling off a cliff. The state space covers $48$ discrete states in the gridworld, and the action space contains $4$ actions: left, right, up, and down. The agents receive a reward of $0$ when staying at the goal, a reward of $-1$ when not reaching the goal, and a reward of $-100$ when stepping onto the cliff. We construct the augmented GCMDP by *(1)* normalizing the rewards into $$[0, 1]$$, *(2)* augmenting the state space with the success state $g_+$ and the failure state $g_-$, and *(3)* modifying the reward function as in Eq.$~\ref{eq:aug-transition-prob-measure}$.

We select four different state-of-the-art GCRL and SSP algorithms to solve the augmented GCMDP, comparing against the standard Q-learning algorithm in the original MDP.

1. GCQL is the goal-conditioned variant of Q-learning with the indicator reward function $$r_{\text{aug}}(s, g) = \delta(s \mid g) = \mathbb{1}(s = g)$$.

2. GCQL w/ HER applies the hindsight relabeling<d-cite key="andrychowicz2017hindsight"></d-cite> on top of GCQL.

3. CRL<d-cite key="eysenbach2022contrastive"></d-cite> is a representative GCRL algorithm that reframes the modeling of the success measure as a contrastive learning (classification) problem.

4. QRL<d-cite key="wang2023optimal"></d-cite> is a representative SSP algorithm that finds goal-conditioned shortest distance (a quasimetric) using the triangle inequality. In particular, this method was developed for deterministic MDPs but also works well for stochastic MDPs in practice.

To prevent confounding errors from data collection and speed up learning, we collect a dataset with $$100\text{K}$$ transitions in the original MDP for training Q-learning, and also collect another dataset with $$100\text{K}$$ transitions in the GCMDP for training the aforementioned GCRL and SSP algorithms. For evaluation, we compare the average success rates for reaching the goal in the original MDP over $$100$$ trajectories, reporting means and standard deviations over $4$ random seeds.

<div class="col mt-3">
{% include figure.liquid path="assets/img/2026-04-27-mdp-to-gcmdp/cliff_walking_aug_gcmdp.svg" class="img-fluid rounded" %}
</div>
<div class="caption">
  Q-learning quickly solves Cliff Walking by learning the original MDP, while GCRL and SSP methods struggle to match its performance by learning the augmented GCMDP. We evaluate the success rate of all methods in the original MDP for fair comparisons. 
</div>

The results in the figure above suggest that Q-learning quickly converges to $100\%$ success rate, while GCRL and SSP methods struggle to match its performance. Although CRL and QRL typically estimate a dense success measure or a dense distance function, they still suffer from the high variance in environmental transitions. This observation is consistent with the caveat that solving the augmented GCMDP is not necessarily easier than solving the original MDP, due to high transition variance and challenging exploration. We also observe that GCQL achieves a success rate similar to its variant with HER, indicating that hindsight relabeling might not speed up learning since $g_+$ and $g_-$ are not in the original state space.

<details style="background-color: #f4f4f4ff; padding: 15px; border-left: 4px solid #1E88E5; margin: 20px 0;">
  <summary>Additional online experiments</summary>

  Additionally, we conduct experiments in the River Swim MDP, which requires exploration to reach the end of the river (linear chain of states) by choosing to move right at each state. To avoid policy initialization bias, we randomize which action moves left versus right at each state.

  We compare the standard Q-learning and PPO<d-cite key="schulman2017proximal"></d-cite> algorithms in the original MDP against the GCQL in the augmented GCMDP, measuring the success rates in the augmented GCMDP. We also plot the success rate of an oracle agent that always goes right. Results are shown in the figure below.
  
  <div class="col mt-3">
    {% include figure.liquid path="assets/img/2026-04-27-mdp-to-gcmdp/riverswim_results.svg" class="img-fluid rounded" %}
  </div>
  <div class="caption">
    Success rates of GCQL, Q-learning, PPO, and the oracle in the augmented River Swim environment. We show the mean and standard deviations over 5 random seeds. 
  </div>

  We observe that for shorter river lengths and shorter horizons, Q-learning converges faster and achieves higher returns than GCQL. However, as river length and horizon increase, GCQL achieves similar or higher returns than Q-learning. These results suggest that, while GCQL is not sample efficient for short-horizon exploration tasks, the GCMDP formulation enables improved exploration in longer-horizon exploration tasks.
</details>

## Closing remarks

In this blog post, we share new ideas about converting a standard RL problem into a GCRL problem. These ideas are motivated by prior connections between the RL and the SSP and, in turn, complementarily bridge all three building blocks. Although our preliminary experiments do not show a positive sign for using GCRL algorithms to solve *any* reward-maximization RL problems in practice, we believe our constructions are still of interest to the broader community and raise many intriguing research directions.

### Open questions

- Prior work has used unique properties for the (deterministic) shortest path problem, such as the triangle inequality<d-cite key="wang2023optimal"></d-cite> and divide-and-conquer strategy<d-cite key="park2025transitive"></d-cite>, to tackle GCRL tasks, resulting in significant improvements. Extending these tools to the stochastic shortest path problem and, eventually, to any RL problem is an important step towards RL without TD learning<d-cite key="dhiman2018floyd,wang2023optimal,park2025transitive"></d-cite>.

- Another key question is how to make our conversions practical? Perhaps there are alternative constructions that convert an MDP into a GCMDP, enabling efficient application of modern GCRL algorithms. Perhaps we need to develop powerful GCRL algorithms to harness these conversions.

- Importantly, our conversions also bring up an open-ended question: After all, RL, SSP, and GCRL are different frameworks describing some mechanisms (blinds). So what are the underlying physical rules that actually govern the world (the elephant)?

Answering these questions not only introduces new interpretations to the RL problems but also motivates the development of efficient and scalable RL algorithms. Taken together, we are excited to see more progress towards general-purpose reinforcement learning agents that can actually understand the world.

---
