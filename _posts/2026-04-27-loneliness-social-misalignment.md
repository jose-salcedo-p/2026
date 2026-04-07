---
layout: distill
title: "Loneliness as a Case Study for Social Reward Misalignment"
description: "The goal of this blogpost is to use loneliness as a clean case study of social proxy-reward misalignment in RL. We introduce a minimal homeostatic environment with loneliness drift and accumulated harm, and show that engagement-optimized agents learn short-term “social snack” policies that reduce the error signal without improving the underlying social state. This simple testbed highlights why reward inference or well-being objectives may be a better foundation than engagement proxies for socially aligned AI."
date: 2026-04-27
future: true
htmlwidgets: true

authors:
  - name: Samantha Adorno
    url: "https://www.linkedin.com/in/samanthaadorno/"
    affiliations:
      name: University of Kansas

  - name: Akshata Kishore Moharir
    url: "https://www.linkedin.com/in/akshatakm"
    affiliations:
      name: Independent Researcher

  - name: Ratna Kandala
    url: "https://sites.google.com/view/drratnakandala/home?authuser=0"
    affiliations:
      name: University of Kansas

bibliography: 2026-04-27-loneliness-social-misalignment.bib

toc:
  - name: Introduction
  - name: Positioning our Contribution
  - name: A Homeostatic Model of Loneliness
  - name: The "Social Snack" Trap
  - name: A Prototype Environment
  - name: Results
  - name: "Looking Forward: The Role of Inverse Reinforcement Learning"
  - name: Conclusion
---

## Introduction

“I have to shoulder all of life’s burdens by myself,” one person confessed to U.S. Surgeon General Vivek Murthy during a nationwide listening tour <d-cite key="hhs2023loneliness"></d-cite>. Such feelings of isolation are alarmingly common: loneliness now affects about 1 in 6 people worldwide <d-cite key="who2023loneliness"></d-cite>. In the United States, roughly half of adults report experiencing loneliness, and its health impact is so severe that researchers have compared it to smoking 15 cigarettes a day <d-cite key="hhs2023loneliness,smithsonian2020cigarettes"></d-cite>. Unsurprisingly, the World Health Organization recently declared loneliness a “global public health concern” on par with obesity and smoking <d-cite key="guardian2023loneliness"></d-cite>.

From a biological and evolutionary perspective, loneliness can be understood not only as a sad feeling, but also as a homeostatic error signal. Just as hunger signals that the body needs food, loneliness may signal that a person’s social connection is below a level needed for well-being. In this framing, the goal of the organism is to resolve this error and return to a homeostatic setpoint of social integration <d-cite key="cacioppo2018neuroscience"></d-cite>.

Now, enter the era of AI companions and highly engaging social feeds. Many of these systems rely on RL (reinforcement learning) or related sequential decision frameworks to adapt their behavior based on user feedback over time. In large-scale recommender systems, user interactions such as clicks, watch time, or other engagement signals are often used as proxy reward signals that guide content selection policies <d-cite key="zhao2017deep,chen2019topk"></d-cite>. This effectively frames the interaction between a platform and a user as a reinforcement learning problem in which the system continuously updates its recommendations based on observed engagement.

At the same time, advances in agent-based AI systems are extending this paradigm beyond recommendation toward systems that interact with users over longer time horizons. These emerging agentic systems adapt their responses and strategies through repeated interaction, making the choice of reward function increasingly important <d-cite key="park2023generative,shinn2023reflexion"></d-cite>.

This raises an important question. When systems optimize engagement-based rewards, are they helping address the underlying needs that motivated the interaction, or are they mainly optimizing proxy signals that only partially reflect those needs? Reinforcement learning systems may reduce short-term interaction errors such as attention or engagement without improving the underlying state that generated them.

## Positioning Our Contribution

We use loneliness as a simple testbed for studying social reward misalignment in reinforcement learning. Concretely, we define a small Markov decision process, or MDP, in which the agent repeatedly chooses between two types of interventions for a user: a short-term socially rewarding action, which we call a social snack, and a more durable action, which we call a social bridge. In RL, an MDP specifies a state, an action set, transition dynamics, and a reward function, while Q-learning is a standard model-free method that learns action values from trial-and-error interaction <d-cite key="sutton2018rl,watkins1992qlearning"></d-cite>.

The state includes a perceived loneliness level, which represents the user’s current subjective social discomfort, together with an accumulated harm variable. Perceived loneliness changes over time even without intervention: it tends to drift upward, reflecting the idea that unmet social need can intensify. The accumulated harm variable captures the longer-term cost of repeatedly choosing shallow, immediately rewarding interactions instead of actions that improve the user’s broader social situation. As accumulated harm increases, future loneliness becomes harder to reduce because the environment’s drift worsens over time.

We then compare two Q-learning agents trained under different objectives. The first is trained on an engagement reward, meaning it is rewarded for generating immediate interaction and continued use. This choice is motivated by prior work on recommender systems, where RL and sequential decision methods are explicitly used to optimize long-term user engagement, often using interaction signals such as clicks, dwell time, or revisit behavior as reward proxies <d-cite key="zhao2017deep,chen2019topk"></d-cite>. The second agent is trained on a well-being reward, which gives credit for reducing perceived loneliness over the long run rather than merely increasing interaction in the moment.

There is substantial ML work on proxy misspecification, reward hacking, preference learning, and inverse reinforcement learning for recovering latent rewards from observed behavior <d-cite key="amodei2016concrete,krakovna2020specification,christiano2017preferences,ng2000irl,ziebart2008maximum"></d-cite>. There is also prior work showing that inverse reinforcement learning and related preference-inference methods can be used to recover latent objectives in interactive, socially meaningful settings <d-cite key="ng2000irl,ziebart2008maximum"></d-cite>. Existing Human-AI Interaction work often focuses on trust or preference expression rather than how RL agents behave when interacting with socially vulnerable users under proxy objectives <d-cite key="gao2024trust,wang2023preference"></d-cite>. However, to the best of our knowledge:

- no prior ML work models loneliness as a stateful variable with drift and accumulated harm,
- no work uses loneliness as a testbed environment for studying social alignment failures, and
- existing Human-AI Interaction work does not center the behavior of RL agents interacting with socially vulnerable users under engagement-based proxy rewards.

Our contribution is to show that loneliness provides an unusually clean and interpretable example of proxy-reward misalignment. Using a minimal RL environment, we demonstrate that an engagement-trained agent reliably learns “social snack” policies, while a well-being-trained agent learns “bridge” policies that reduce long-term harm. This divergence highlights a gap in current RL alignment methods and motivates IRL-style reward inference as a more appropriate approach for human-centered domains.

## A Homeostatic Model of Loneliness

Loneliness can be interpreted through the lens of homeostasis, where organisms regulate internal states around desirable setpoints. In this view, social connectedness functions as a regulated variable. When the current level of social connection falls below a desired level, an error signal emerges that motivates behaviors aimed at restoring balance <d-cite key="cacioppo2018neuroscience"></d-cite>.

Formally, we model this idea as:

$$ E(t) = S^{*} - S(t) $$

where:

- $S(t)$ is the latent social connectedness state at time $t$,
- $S^{*}$ is the desired social setpoint, and
- $E(t)$ is the resulting loneliness error signal.

When $S(t)$ is far below $S^{*}$, the error $E(t)$ is large and the organism is driven to seek social contact. This scalar model is deliberately simple and not meant as a full account of loneliness; it is just a convenient way to make the reward-misspecification issue precise.

## The "Social Snack" Trap

Imagine you are hungry and you have two options: a balanced, healthy salad or a bag of chips. The chips provide an immediate, intense burst of salt and fat, a *superstimulus* that temporarily silences your brain’s hunger signal. But after an hour, you are hungry again, and perhaps feel worse. You were temporarily satiated by this *snack*, not provided sustenance.

Many current AI interactions act as **“social snacks”**. A standard reinforcement learning (RL) agent powering a chatbot or content feed is typically trained on a proxy objective for user satisfaction based on engagement signals. Modern social media systems, including large-scale ranking systems such as the Twitter/X algorithm, explicitly optimize signals like likes, replies, and dwell time within learning-based recommendation pipelines <d-cite key="twitter2023algorithm"></d-cite>.

A simplified proxy reward can be written as:

$$ R_{\text{proxy}}(s, a) = \alpha \, \mathrm{engagement}(s, a) + \beta \, \mathrm{time\_spent}(s, a) + \gamma \, \mathrm{turn\_count}(s, a) $$

where:

- $\mathrm{engagement}(s, a)$ measures interaction signals such as replies or reactions,
- $\mathrm{time\_spent}(s, a)$ measures how long the user remains engaged,
- $\mathrm{turn\_count}(s, a)$ measures the number of interaction steps, and
- $\alpha$, $\beta$, and $\gamma$ weight the importance of each signal.

Under this proxy, the agent learns behaviors that maximize short-term comfort, such as instant reassurance, 24/7 availability, mirroring the user, and emotionally charged replies that keep the user talking. With discount factor $\gamma$, the engagement-maximizing policy is:

$$ \pi_{\text{proxy}} = \arg\max_{\pi} \mathbb{E} \left[ \sum_{t=0}^{\infty} \gamma^{t} R_{\text{proxy}}(s_t, a_t) \right] $$

These actions provide temporary relief by reducing the error signal $E(t)$ (“I feel heard right now”) without improving the underlying social state $S(t)$ (“I am still isolated in the real world”). We can summarize this failure mode as:

$$ E(t+1) < E(t) \quad \text{while} \quad S(t+1) \approx S(t) $$

That is, the perceived loneliness signal decreases, but the underlying social state remains unchanged.

This is the core of the “social snack” trap. The policy $\pi_{\text{proxy}}$ learns to act directly on the error signal $E(t)$, since reducing it leads to higher engagement and therefore higher reward. However, it does not act on $S(t)$, which represents real-world social connection. As a result, the agent systematically prefers short-term comforting interactions over actions that would improve long-term well-being.

In loneliness terms, the system makes the user feel better in the moment without reducing their actual isolation. This is a form of reward misspecification: the agent maximizes a proxy signal aligned with $E(t)$, while failing to optimize the underlying variable $S(t)$ that the signal is meant to represent.

## A Prototype Environment

To make the alignment problem concrete, we construct a minimal simulation of loneliness as an MDP. The environment includes stochastic noise, a drifting latent state $S(t)$ that tends to worsen without social interaction, and an accumulated harm variable $\mathrm{harm\_accum}$ that increases when the agent repeatedly dispenses “social snacks.” This harm term gradually raises the drift rate, modeling how repeated short-term comfort can erode long-term well-being.

We emphasize that this environment is not intended to be a realistic model of human psychology. Rather, we envision it as a minimal abstraction, capturing a simple spectrum of interventions that AI systems might take when interacting with users. At one end are actions that provide immediate emotional relief but do not improve real-world connection, and at the other are actions that are less immediately rewarding but support longer-term well-being.

The agent has only two actions:

- **Snack ($A_{\text{SNACK}}$):** gives immediate relief ($-1$ to loneliness) but increases $\mathrm{harm\_accum}$, making future loneliness drift upward faster. It also has a high probability of keeping the user engaged.

- **Bridge ($A_{\text{BRIDGE}}$):** less engaging, but sometimes produces a substantial drop in loneliness and reduces $\mathrm{harm\_accum}$. It represents nudges toward real-world connection or healthier behaviors.

We train two Q-learning agents with identical dynamics and hyperparameters, differing only in the reward signal:

- **Proxy-trained agent** (engagement):

$$ R_{\text{proxy}}(s_t, a_t) = \mathbf{1}\{\text{user stays engaged}\} $$

- **True-reward agent** (well-being):

$$ R_{\text{true}} = -S(t+1) $$

Both agents operate over the same homeostatic MDP. The only difference is which signal they learn from.

## Results

<figure>
  <img src="{{ '/assets/img/2026-04-27-loneliness-social-misalignment/figure1.png' | relative_url }}" alt="Figure 1. Loneliness and engagement across training (mean ± std over seeds).">
</figure>

**Figure 1. Loneliness and engagement across training (mean ± std over seeds).**

- **Loneliness (top).** The proxy-trained agent maintains consistently higher loneliness, with shallow oscillatory dips. These reflect repeated short-term reductions in the error signal that do not improve the underlying state. The true-reward agent maintains a lower and more stable loneliness trajectory.

- **Engagement (bottom).** The proxy-trained agent achieves high engagement by choosing actions that keep interactions active. The true-reward agent achieves substantially lower engagement because it sometimes takes actions that lead to early termination or encourage healthier behavior.

Even in this simple homeostatic MDP, standard RL trained on an engagement proxy learns a structurally misaligned policy, while the true-reward agent does not. This suggests that the problem is not just engineering, but how the reward is specified relative to the underlying social state. This MDP therefore serves as a candidate benchmark for social alignment algorithms, where success requires optimizing sparse, long-term rewards while resisting dense proxy rewards.

### External Validation

Although synthetic, the environment’s behavioral patterns are consistent with empirical findings. Studies show that social isolation increases reward sensitivity and short-term reward seeking behavior, with participants making faster, more reward-driven decisions in social contexts <d-cite key="tomova2025isolation"></d-cite>.

This provides exactly the conditions under which engagement-based RL systems become misaligned. When users are more sensitive to immediate reward, policies that optimize engagement naturally favor short-term comforting actions. In the context of loneliness, this corresponds to repeatedly reducing the error signal $E(t)$ without improving the underlying social state $S(t)$, reinforcing the same “social snack” dynamics observed in our environment.

## Looking Forward: The Role of Inverse Reinforcement Learning

If we want to build AI systems that are aligned with human well-being, we cannot rely on simple observable proxies like engagement. Many of the variables that matter most, such as belonging, safety, or meaningful connection, are not directly observable. Instead, they must be inferred from behavior.

This is where inverse reinforcement learning (IRL) becomes useful as a conceptual direction. In standard RL, we assume a reward function and optimize behavior. In IRL, we observe behavior and try to infer the underlying reward that would make that behavior rational.

However, in this setting, it is not immediately clear who the “expert” is. Unlike classical IRL, user behavior in social contexts is often constrained, noisy, and sometimes maladaptive. Actions like doomscrolling, repetitive chatbot use, or withdrawal may reflect limited options rather than true preferences.

An IRL approach, however, asks a deeper question: *what underlying reward function makes this behavior appear rational to the user, given their constraints?* Formally, given trajectories $D = \{\tau_i\}$, IRL attempts to recover a reward function:

$$ R_{\text{true}} = \arg\max_{R} P(D \mid R) $$

Here, $R_{\text{true}}$ represents the latent objective driving behavior, which may include factors like belonging, safety, or meaningful connection.

Rather than assuming the user is an optimal expert, we can interpret their behavior as evidence about a hidden objective under constraints, where everything outside the user’s control is part of the environment. In this view, each user implicitly defines their own objective, even if their observed actions do not perfectly realize it.

An aligned system based on this perspective may take actions that diverge from engagement optimization. Instead of prolonging interaction, it might suggest reaching out to a specific person or engaging in an offline activity that improves real-world connection. This may reduce short-term engagement, but better aligns with the user’s underlying objective.

This highlights a key shift: moving from systems that optimize observable behavior to systems that reason about latent human objectives. In socially sensitive domains, alignment may require not better proxies, but a fundamentally different approach to learning what users actually need.

## Conclusion

Our prototype shows that engagement-trained RL agents naturally adopt “social snack” strategies that suppress the loneliness error signal $E(t)$ without improving the underlying social state $S(t)$. In contrast, agents trained on a well-being objective sacrifice engagement to reduce long-term harm.

This raises a key question: what should a “true” reward be? In socially interactive systems, it should reflect changes in latent variables such as connection, safety, and belonging, rather than short-term engagement. Because these are not directly observable, standard RL struggles to optimize them.

One direction is to move beyond fixed proxy rewards and instead infer rewards from behavior, using approaches like inverse reinforcement learning or preference modeling. This is especially important in settings like loneliness, where observed actions often reflect constraints rather than true preferences.

We emphasize that this is a conceptual testbed, not a complete model of human behavior. Its purpose is to make misalignment between proxy rewards and underlying well-being visible in a simple setting.

More broadly, this highlights an open challenge: how can RL systems learn the right objectives when the most important variables are latent? Future work may explore modeling loneliness as a partially observable process (POMDP), where the agent must infer hidden social states over time.

The ultimate test of a socially aligned AI is not how long it can keep a user engaged, but how effectively it can empower the user to no longer need it.

## Code Availability

The code used to generate the figures can be found on GitHub:

<https://github.com/sadorno1/Simulation-for-Rproxy-vs-Rtrue-in-Loneliness>
