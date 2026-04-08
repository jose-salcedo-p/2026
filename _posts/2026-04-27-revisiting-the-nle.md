---
layout: distill
title: Revisiting The NetHack Learning Environment
description: The NetHack Learning Environment (NLE) was proposed as a challenging benchmark to test an agents abilities to perform complex reasoning over long time horizons in a stochastic, partially-observed, procedurally generated setting. To date, no approach, including those based on reinforcement learning, using large pretrained models, using handcoded symbolic agents, imitating expert trajectories or any hybrid method has achieved significant progress towards completing the game. We take a deeper look into the mechanics and interface of the NLE and show that much of the complexity of NetHack is inaccessible due to constraints on the observation and action spaces. We propose a series of modifications and show that they meaningfully improve performance on the NLE.
date: 2026-04-27
future: true
htmlwidgets: true
hidden: false

# Mermaid diagrams
mermaid:
  enabled: true
  zoomable: true

# Anonymize when submitting
authors:
  - name: Michael Matthews
    url: "https://www.mtmatthews.com/"
    affiliations:
      name: Meta, University of Oxford
  - name: Pierluca D'Oro
    url: "https://proceduralia.github.io/"
    affiliations:
      name: Meta
  - name: Anssi Kanervisto
    url: "https://scholar.google.com/citations?user=iPimqbwAAAAJ&hl=en"
    affiliations:
      name: Meta
  - name: Scott Fujimoto
    url: "https://scholar.google.com/citations?user=1Nk3WZoAAAAJ&hl=en"
    affiliations:
      name: Meta
  - name: Jakob Foerster
    url: "https://www.jakobfoerster.com/"
    affiliations:
      name: Meta, University of Oxford
  - name: Mikael Henaff
    url: "https://www.mikaelhenaff.com/"
    affiliations:
      name: Meta


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
bibliography: 2026-04-27-revisiting-the-nle.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Introduction
  - name: Tokenization
  - name: Interacting with Menus
  - name: Using Inventory Items
  - name: Viewing Inventory Items
  - name: Viewing Player Attributes
  - name: Measuring Progress
  - name: Bringing it All Together
  - name: Conclusion

# Below is an example of injecting additional post-specific styles.
# This is used in the 'Layouts' section of this post.
# If you use this post as a template, delete this _styles block.
# _styles: >
#   .fake-img {
#     background: #bbb;
#     border: 1px solid rgba(0, 0, 0, 0.1);
#     box-shadow: 0 0px 4px rgba(0, 0, 0, 0.1);
#     margin-bottom: 12px;
#   }
#   .fake-img p {
#     font-family: monospace;
#     color: white;
#     text-align: left;
#     margin: 12px 0;
#     text-align: center;
#     font-size: 16px;
#   }
---




## Introduction

The NetHack Learning Environment (NLE) <d-cite key="kuttler2020nethack"></d-cite>, based on the classic dungeon-crawling game of NetHack, has been proposed as one of the most challenging benchmarks in AI. It is stochastic, long-horizon, partially observed, procedurally generated, and contains hundreds of objects, monsters, dungeon features and other entities which interact in complex ways. Mastering the game of NetHack can require months to years for humans, and approaches including large-scale RL methods<d-cite key="kuttler2020nethack,henaff2025scalable"></d-cite>, frontier LLMs <d-cite key="paglieri2024balrog,klissarov2023motif,klissarov2024maestromotif"></d-cite>, imitating expert trajectories <d-cite key="hambro2022dungeons,piterbarg2023nethack,tuyls2023scaling,wolczyk2024fine"></d-cite>, as well as hardcoded symbolic methods <d-cite key="hambro2022insights"></d-cite> all struggle to advance beyond the earliest game stages, indicating that it constitutes a useful testbed for developing and evaluating AI agents.

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/nethack.png" class="img-fluid rounded z-depth-1" %}

We argue that the current NLE interface is fundamentally limited and makes it intractable or impossible to perform many basic and essential behaviors, largely due to limited observation spaces and action parameterizations. We propose a series of modifications to this setup and validate each change on a custom made environment made using the MiniHack<d-cite key="samvelyan2021minihack"></d-cite> framework. Finally, we show that combining all these modifications improves performance on the NLE when training an RL agent from scratch using Sample Factory PPO as our base implementation.

We believe that the NLE is an excellent and unique environment to push the limits of artificial agents, but that much of this complexity has been locked behind the existing interfaces and protocols. We hope that future work on the NLE can use our proposals as a foundation to further their research.


## Tokenization

Textual observations are a vital part of the NLE and being able to properly parse text is needed for any agent that hopes to complete the game. 
<!-- Crucial information is often communicated through text, for example the message `you feel healthy` indicates you have gained an intrinsic resistance to poison, an important fact that a competent agent will need to understand and remember. -->

To avoid confusion, since the game is rendered using colored ASCII characters, we make a distinction between *glyphs*, which form the main screen and represent dungeon features and *text*, which communicates information in English.

Examples of text include:

### Messages
{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/message2.png" class="img-fluid rounded z-depth-1" %}
<div class="caption">
    Messages give you information about events that have occurred in the game. This includes events induced by the player (e.g. dropping items), events that take place in the players line of sight (e.g. "The hill orc puts on an orcish helm") and events that the player can sense through other means (e.g. "You hear someone counting money").
</div>

### Player Inventory

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/inventory.png" class="img-fluid rounded z-depth-1" %}
<div class="caption">
    Your inventory consists of all the items you are carrying, represented in text form. 
</div>

### Menus

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/menu2.png" class="img-fluid rounded z-depth-1" %}
<div class="caption">
    Interacting with many parts of NetHack requires navigating menus, which are represented in text form.
</div>

Existing non-LLM approaches either use the symbolic representation, where the message line is passed through a character level CNN or operate directly on the `tty_chars` grid of rendered characters, in which glyphs and texts are conflated.

<!-- largely make use of character-level CNNs to parse text, which have limited representational capacity. It is also common, when operating directly on the rendered characters without any symbolic observation, to make no distinction between characters in glyphs and text. -->

Language modelling orthodoxy tells us that tokenizing text above the character level is preferable, however early experiments with off the shelf tokenizers proved to be too cumbersome and significantly slowed down training. Furthermore, the distribution of text inside NetHack is vastly different from that on which general tokenizers are trained, for instance the words `wand`, `potion`, `gnome` and `uncursed` all feature among the top 50 most common words in NetHack. This distributional mismatch motivated us to create a NetHack specific word level tokenizer. We extract the 3000 most frequent words (ignoring punctuation and delimited by spaces) from the message lines of the Dungeons and Data<d-cite key="hambro2022dungeons"></d-cite> offline dataset of human trajectories:

```
1: you
2: the
3: what
4: to
5: do
6: of
7: in
8: here
9: want
10: an
11: hit
12: your
13: is
14: hear
15: see

...

2986: dwarfs
2987: yowls
2988: ru
2989: lets
2990: pattern
2991: quality
2992: dilithium
2993: elberethel
2994: 115
2995: telefonmann
2996: luckily
2997: ulch
2998: archie
2999: remains
3000: sluggish
```

We use this vocabulary to learn embeddings from scratch during training, replacing the CNN on the message line with a bag of words, which was shown to be a competitive representation for NetHack messages<d-cite key="zheng2024online"></d-cite> while being simpler and faster than using a transformer. As well as being used for parsing messages, this tokenizer underpins other proposed changes discussed later in the blog.



## Interacting with Menus

In-game menus form an important part of NetHack and appear when putting items into or taking items out of containers, picking up from a pile of items, casting spells, enhancing skills and many other cases. Despite their prominence in the game, menus tend to be either completely or partially unobserved in NLE setups that are not language based:
- The original symbolic NLE agent does not observe menus at all. This has been noted by the authors in a <a href="https://github.com/facebookresearch/nle/pull/207">GitHub issue</a>.
- Some setups which operate directly on the rendered `tty_chars` only observe a cropped rendering centered around the player <d-cite key="piterbarg2023nethack"></d-cite>. This leads to strange behavior where the menu is only visible (or partially) visible if the agent is near the top right corner of the screen.
- Other setups that observe the entire `tty_chars` will make no distinction between glyphs and text<d-cite key="tuyls2023scaling,wolczyk2024fine"></d-cite>, passing rows of text through a 2D CNN, greatly increasing the difficulty of the learning problem.
<!-- - Language based approaches that use the NLE Language Wrapper, such as BALROG, do observe menus in text format. -->

These setups greatly complicate the learning problem since, as well as not being able to observe the contents of an opened menu, an agent cannot easily tell whether a menu is even open or not, meaning it may try and act in the world and inadvertently take some actions in an unseen menu it has unwittingly opened.

We propose adding the contents of an opened menu directly to the agent's observation space. We achieve this by extracting the menu from the rendered `tty_chars`, noting that all menus are anchored in the bottom left corner by the `"(end)"` string, which we use to locate the menu. We then extract all non-header lines from the menu, tokenize them and apply a bag of words.

While this change allows the agent to view menus, it is still tricky to learn how to properly interact with them. Each menu option is labelled by a letter, which is used to select it. Instead of forcing the agent to learn this mapping, we give the agent an augmented action space which allows it to choose from `menu_option_1, menu_option_2, ..., menu_option_n`. We extract the letter label for each menu option from the `tty_chars` and then convert menu option actions to their respective primitive actions, which are then fed into the NLE.

To test and showcase this change, we create a simple MiniHack environment which contains a pile of two gemstones stacked in a randomized order. The agent receives a positive reward if it picks up only the gem named `pick me up`, which requires it to understand and then interact with a menu. 

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/gem_stack_in_game.png" class="img-fluid rounded z-depth-1" %}

The results show that the augmented observation and action space allow the agent to properly use the in-game menu system. 

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/gem_stack.png" class="img-fluid rounded z-depth-1" %}

## Using Inventory Items

Another menu-like component of NetHack is that upon initiating certain actions, the game will prompt the user for which item they wish to use from their inventory, using the message line rather than opening an explicit menu. For instance, initiating the throw action by pressing the letter `t`, will induce the following message.

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/what_do_you_want_to_throw.png" class="img-fluid rounded z-depth-1" %}

The string `abh` refers to the items in the players inventory that are capable of being thrown, indexed by those respective letters.

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/weapons.png" class="img-fluid rounded z-depth-1" %}
 
To make a decision on which item to use, the agent must cross reference the letters from both the message string and from the inventory. Unlike with menus, this is technically feasible with existing setups, but it is a very challenging learning problem for the agent to draw these connections.

Similar to the menu system, we propose augmenting both the observation and action space of the agent to make this problem tractable. When the agent is confronted by a message to use an item from its inventory, the letters in the message are parsed and automatically cross-referenced with the corresponding items in the agent's inventory. Each item is then observed by the agent as a bag of words, and the agent can pick which item to use with the same augmented action space introduced for navigating menus.

We modify the previous MiniHack environment so that the agent starts with multiple gems in its inventory. It must drop only the gem named `put me down` to receive a positive reward.

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/gem_drop_in_game.png" class="img-fluid rounded z-depth-1" %}

The results show that the augmented inventory selection observation and action space allow the agent to properly select items from its inventory.

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/gem_drop.png" class="img-fluid rounded z-depth-1" %}

## Viewing Inventory Items

As well as using inventory items, it is useful for the agent to be able to view the items in its inventory at all times, a feature which is lacking from many existing NLE agents. Depending on the rendering system a player uses, NetHack can either be played with the inventory visible at all times (for instance by enabling `curses` rendering) or, more commonly, the inventory must be viewed by pressing `i`. Existing approaches do not tend to include the inventory in the observation, meaning the agent must press `i` to open view its inventory. However, as discussed in previous sections, approaches based off the original symbolic architecture will not be able to see the opened menu, while those that operate directly on the `tty_chars` will either see a partial/cropped inventory, or will attempt to parse it by passing the rows through a 2D CNN.

We make use of the `inv_strs` observation already made available by the NLE and tokenize each element with a bag of words. We then pass each entry through an MLP before summing the embedding again. This gives the agent a permutation invariant view of the items in its inventory.

To demonstrate this, we create a MiniHack environment where the agent starts wearing a `ring of fire resistance` or a `ring of cold resistance`. The agent has the choice to fight either fire-based or ice-based enemies and its success will depend on which ring the agent starts with, making the ability to read its inventory essential.

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/ring_inv_in_game.png" class="img-fluid rounded z-depth-1" %}

The results show that the augmented inventory view allows the agent to understand its inventory.

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/ring_inv.png" class="img-fluid rounded z-depth-1" %}

## Viewing Player Attributes

When beginning a new game of NetHack, the player can choose the race, role , gender and alignment of their character. This choice has an enormous impact on the game, deciding the players starting inventory, attributes, affinity for different abilities and will affect the generation of some dungeons, as well as determining which monsters are hostile or neutral towards the player. The strategies and difficulty of different roles varely immensely.

<!-- Much prior work in the NLE has focused on the Monk role, because the strategy for the Monk is to largely eschew armor and weapons and favor hand-to-hand combat. This allows the agent to get away with minimal inventory management - something that was hard or impossible to do before the changes we have proposed. We instead follow the paradigm set out by the original NLE paper where the players race, role, gender and alignment are randomized every episode, forcing the agent to learn a general NetHack agent. -->

However, as <a href="https://github.com/facebookresearch/nle/pull/207">noted by the original NLE authors</a>, the agent can struggle to view these essential characteristics and must resort to inferring them from its inventory and attributes. With the agent now able to read menus, it theoretically could invoke the `#attributes` action to view this information, but this again seems extremely difficult to expect an agent to learn. Instead, we propose a small modification where the `#attributes` action is immediately invoked upon a new episode, with the role/race/alignement information extracted, processed and stored, then being fed to the agents observation as an additional symbolic key for the rest of the episode.

<!-- ## Engraving Elbereth

An essential strategy in NetHack is the process of 'engraving Elbereth'. This refers to the player using an item or their fingers to engrave the string 'Elbereth' into the floor. Most enemies when adjacent to a player standing on an engraved Elbereth will flee, making this a common method for avoiding death. This is a classic sparse reward exploration problem, where an agent must by chance stumble upon the exact sequence of over 10 actions (with a discrete action space size of over 100) in order to observe the positive value of this behavior and reinforce it. Clearly, an agent learning tabula rasa will never find such a strategy. We propose using our prior knowledge to include a macro-action that executes all the intermediate primitive actions to engrave Elbereth.

The inclusion of this is likely significantly more controversial than our other proposed changes, as purists may argue this is 'cheating' and that the hard exploration problem is part of the challenge of the NLE. We would argue that
 1. Randomly stumbling upon the exact correct sequence of actions is not an interesting exploration problem.
 2. Significantly more interesting problems in the NLE are effectively soft-locked behind this ability, as it can be quite hard to beat the game without it.

We create a simple MiniHack environment where the use of Elbereth is needed to fend off enemies and give the agent enough time to heal, and show that adding the macro-action allows the agent to solve the environment. -->

## Measuring Progress

A unique aspect of the NLE is that it is not even entirely clear what metric should be used to measure progress. It is <a href="https://github.com/facebookresearch/nle/issues/278">generally agreed</a> that the true underlying objective is to *ascend* to demi-godness and thus beat the game, but this has never been achieved by a non-human agent, so some intermediate measure of progress must be used in the meantime.

The original NetHack challenge used in-game score for the competition, and this has been largely used in work since. However, as noted in prior work, this has significant issues, as maximizing score tends to lead to agents that don't make much progress towards ascension. Score can be achieved by killing enemies, which will endlessly spawn on every level of the dungeon. Rather than venturing into lower dungeon levels and risking death, many score-maximizing agents will instead camp on the easy dungeon levels, racking up high scores but not making any progress towards beating the game. Conversely, it is a common strategy for human players try to kill as few enemies as possible to keep their experience level low and reduce the chance of high level enemies appearing later in the game. Finally, and perhaps most damningly, an optimal agent that maximizes score will never beat the game, as there is an unbounded amount of score to be achieved.

BALROG proposed a data driven approach to measuring progress, by looking at the agents experience level and dungeon floor and relating this to the probability of an equivalently placed player in Dungeons and Data beating the game. While this approach is principled and useful for evaluation, it is too sparse to be used as a reward signal for a reinforcement learning agent.

We instead propose using the *scout* measure, which increases every time the player observes a new tile, as the metric for progress in the NLE. Qualitatively, we observe an agent that maximises scout making better progress in the game, reaching significantly further levels and not hanging around in the early stages of the game. Crucially, the maximisation of the scout metric should in theory lead to an agent that explores the entire dungeon and enters the Astral Plane, where it can ascend. If an agent ever gets this far, a simple flat bonus for ascension would lead to an MDP where the reward maximising agent will ascend, unlike with score, since the scout reward is finite.

## Bringing it All Together

Having proposed a number of modifications to the NLE interface and validating them on toy MiniHack environments, we see that combining all these proposed changes leads to a modest improvment in scout score on the NLE when running with PPO.

{% include figure.liquid path="assets/img/2026-04-27-revisiting-the-nle/main_result.png" class="img-fluid rounded z-depth-1" %}

## Conclusion

We have identified a number of deficiencies in existing implementations that aim to solve the NLE, with large parts of the game either impossible or intractable to interact with. We have proposed a number of changes to the observation space, action parameterization and metrics for the NLE. We have then gone on to show that, when these changes are brought together, we can learn an agent with tabula rasa RL on the NLE that shows meaningful improvement over the baseline. We open source our code and hope that this work can serve as a foundation for future work on the NLE.
