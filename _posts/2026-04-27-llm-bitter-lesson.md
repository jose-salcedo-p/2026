---
layout: distill
title: "The human knowledge loophole in the 'bitter lesson' for LLMs"
description: "Are LLMs a proof that the 'bitter lesson' holds for NLP? Perhaps the opposite is true: they work due to the scale of human data, and not just computation."
date: 2026-04-27
future: true
htmlwidgets: true
hidden: true

authors:
  - name: Anna Rogers
    url: "https://annargrs.github.io"
    affiliations:
      name: IT University of Copenhagen
# must be the exact same name as your blogpost
bibliography: 2026-04-27-llm-bitter-lesson.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Introduction
  - name: The Human Knowledge Loophole
  - name: Beyond The Bitter Lesson
  - name: Comments and objections
  - name: Acknowledgements
---

## Introduction

The 'bitter lesson' post by Rich Sutton <d-cite key="Sutton_2019_Bitter_Lesson"></d-cite> has been interpreted in the ML community in (at least) two ways:

> (a) 'soft': approaches relying on human knowledge have historically been beaten by those that instead rely on computation
> (b) 'hard': scale is all you need

(a) is 'bitter' in the sense that it implies that the ML researchers may not have much to contribute intellectually to their work, since 'almost no innovation is required beyond scale'. This is indeed depressing <d-cite key="Hill_2024_200bn_Weights_of_Responsibility"></d-cite>. Some interpret this 'lesson' as saying that the researchers' role is designing the best way to leverage computation <d-cite key="AI_2025_Still_Chewing_on_Bitter_Lesson_in_2025"></d-cite>, or defining the problems and evaluating the solutions <d-cite key="Vach_2025_Not-so_Bitter_Lesson"></d-cite>.

(b) is a much stronger claim, and I don't think many NLP researchers are seriously committed to it. It is not hard to see why. The current LLMs look like a monument to scaling, and they often do work well, but the result is still unsatisfactory: there are clear and serious issues that we don't know how to fix. This includes factuality <d-cite key="HicksHumphriesEtAl_2024_Chatgpt_is_Bullshit"></d-cite>, spurious patterns <d-cite key="zhang-etal-2024-unexpected"></d-cite>, and fundamental non-differentiation between input text and instructions, which leads to prompt injection vulnerability <d-cite key="299563"></d-cite>. Scaling also faces the challenges of the poor predictability of 'scaling laws' and diminishing returns of training ever-larger models <d-cite key="Hooker_2025_On_Slow_Death_of_Scaling"></d-cite>.

These days, pointing out the problems with LLMs often evokes a strawman response along the lines of "you're just hating LLMs, which many people do find useful". Let me preemptively stress that the question of model utility is completely orthogonal to the 'bitter lesson' discussion. Much older and weaker models have been useful in practice. Utility depends on the match between a model and a specific application, how easy it is to identify errors, how critical and frequent they are, and the cost and robustness of human oversight for that application. Say, if we wanted to generate horoscopes, scale is absolutely all we need.

A long-standing critique of LLMs is that they lack a 'world model', defined as 'a computational framework that a system (a machine, or a person or other animal) uses to track what is happening in the world' <d-cite key="Marcus_2025_Generative_AIs_crippling_and_widespread_failure_to_induce_robust_models_of_world"></d-cite>. I fully agree that something like that is necessary for e.g. coherence of dialogue or factual consistency. But there is another factor worth pondering, whether a system incorporates a world model or not: *what is the source of information about that world?* And, if that source is human knowledge -- can such a system be considered a case of 'bitter lesson' in the interpretation (a)? (i.e. reliance on computation rather than human knowledge)?

## The Human Knowledge Loophole

As always, the devil is in the details. *Whose* knowledge are we talking about? The original 'bitter lesson' post clearly refers to the researchers building ML systems:

<blockquote>
Seeking an improvement that makes a difference in the shorter term, researchers seek to leverage their human knowledge of the domain, but the only thing that matters in the long run is the leveraging of computation. — R. Sutton, The 'Bitter Lesson' <d-cite key="Sutton_2019_Bitter_Lesson"></d-cite>
</blockquote>

But this leaves a giant loophole for handcrafted resources used for *training*. This includes not only the expert linguistic resources, but also all the human-created training data. I do not think anybody in ML community would seriously argue that we overcame the 'garbage in, garbage out' problem: the better data we have, the easier it is to learn for any model. But for models intended to represent human speech, humans are the *only* possible source of data (see [below](#comments-and-objections) for discussion of synthetic data). That introduces a paradox into the 'bitter lesson, which implies that the dependence on human knowledge is a weakness. Sutton himself stated the following more recently <d-cite key="Patel_2025_Richard_Sutton_Father_of_RL_thinks_LLMs_are_dead_end"></d-cite>:

<blockquote>
It’s an interesting question whether large language models are a case of the bitter lesson. They are clearly a way of using massive computation, things that will scale with computation up to the limits of the Internet. But they’re also a way of putting in lots of human knowledge. This is an interesting question. It’s a sociological or industry question. Will they reach the limits of the data and be superseded by things that can get more data just from experience rather than from people? — R. Sutton on Dwarkesh Podcast
</blockquote>

I would argue that in LLMs, scaling *exacerbated* rather than eliminated our dependence on handcrafted knowledge. The entire field is hyper-focused on benchmarks, and there are incredible incentives to win by any means necessary (even testing multiple model variants to pick one that happens to work better in a particular setting <d-cite key="SinghNanEtAl_2025_Leaderboard_Illusion"></d-cite>).

Let us consider the FrontierMaths controversy: OpenAI results came from a setup in which they had exclusive access to FrontierMaths data <d-cite key="Wiggers_2025_AI_benchmarking_organization_criticized_for_waiting_to_disclose_funding_from_OpenAI"></d-cite>, and the creators of the benchmark did not disclose it. If OpenAI, an organization with that much tech talent, opts to resort to such tricks -- this sends a signal that the best strategy is... relying on task-specific human knowledge. Let us even suppose that the data was not used directly for training, but e.g. used to guide the creation or selection of some extra data that would be used instead (either for training, in-context examples or prompt tuning). Conceptually it is still a clear case of deliberate injection of human-defined patterns in order to make the system work better. Gemini 3 has since been [reported](https://epoch.ai/frontiermath) to perform better on this benchmark without priviledged access, but given the current incentives, I personally wouldn't just accept the reported performance of a 'closed' system on this or any other benchmark. Especially one with so much media traction. 

The desire for access to FrontierMaths data aligns with ML 101 and decades of engineering practice: the most effective way to get a model to work is usually using data that is somehow similar to the test data. The logical conclusion is optimize the whole training process for a benchmark, and this is exactly what we are doing with 'data ablations' <d-cite key="AllalLozhkovEtAl_2025_SmolLM2_When_Smol_Goes_Big_Data-Centric_Training_of_Small_Language_Model,MagnussonTaiEtAl_2025_DataDecide_How_to_Predict_Best_Pretraining_Data_with_Small_Experiments"></d-cite>: literally selecting language model training data so as to optimize for specific pre-selected benchmarks. I cannot help seeing this as a substitute of the GOFAI practice of writing hundreds of patterns by... writing hundreds of examples for each pattern. The fact that the examples are taken from the writing of other people, rather than the researchers, does not change their origin in human knowledge. It also raises questions of consent and compensation, and it is debatable which way would be less expensive <d-cite key="KandpalRaffel_2025_Position_Most_Expensive_Part_of_LLM_should_be_its_Training_Data"></d-cite>.

If dependence of human knowledge is overall problematic, why do LLMs work well in so many cases? Language data follows the Zipfian distribution, which basically guarantees that a large portion of the frequent phenomena will be covered no matter what samples we take. Luckily, the same is true for benchmarks, especially given that we mostly focus on a single language. This allows LLMs to cover a lot of patterns without nobody ever defining them, and to make evaluation difficult. But the same distribution also guarantees an awkward long tail, remaining forever out of our reach. And since we have no idea which patterns are missing, we also have no idea how to further improve the model, apart from the current strategy of whack-a-specific-mole. That doesn't feel satisfactory from either an engineering or a scientific perspective. It also leaves various minorities to find out the hard way that the model doesn't work well for them (e.g. speakers of dialects may be systematically at a disadvantage when interacting with LLM-based systems <d-cite key="fleisig-etal-2024-linguistic"></d-cite>).

## Beyond The Bitter Lesson

If the current LLM training is not the way, then what should we do? Sutton generally objects to token prediction as a valid training 'goal' <d-cite key="Patel_2025_Richard_Sutton_Father_of_RL_thinks_LLMs_are_dead_end"></d-cite>, and argues for learning purely from real-world experience. But that can be done in chess and in robotics (in isolated environments). What about human communication? Imagine e.g. that a company just offloads its customer service chatbot training onto customers who will bear the costs of any errors. I hope that this is not what we're about to experience. Ilya Sutskever also argues <d-cite key="Patel_2025_Ilya_Sutskever_Were_moving_from_age_of_scaling_to_age_of_research"></d-cite> that the current RL efforts in post-training actually requires more knowledge engineering than LM pre-training.

My take is that the dependence on human knowledge is unavoidable when human knowledge (rather than only world physics or abstract logic) is a big part of what is being modeled. LLMs are better conceptualized not as individual entities, but as a 'social and cultural technology' <d-cite key="FarrellGopnikEtAl_2025_Large_AI_models_are_cultural_and_social_technologies"></d-cite> or 'collectivist' artifacts <d-cite key="Jordan_2025_Collectivist_Economic_Perspective_on_AI"></d-cite>. In domains like language, we will always have to rely on human contributions. 

If so -- if we want models that better fit the human world, we will need better human data. And for that, we have to abandon the original 'bitter lesson' analogy with Go and chess, where information comes for free. Currently LLM training corpora are created by exploiting the historical data and established practices, but long-term this will work only if people are incentivized to make high-quality contributions <d-cite key="ZhangJiaoEtAl_2025_Fairshare_Data_Pricing_via_Data_Valuation_for_Large_Language_Models"></d-cite>. The 'data commons' is already in decline <d-cite key="LongpreMahariEtAl_2024_Consent_in_Crisis_Rapid_Decline_of_AI_Data_Commons"></d-cite>, following the rise of commercial LLMs. And is not a 'learn once and run forever' situation: our world is forever changing, and forever long-tailed with all kinds of underrepresented minorities, requiring further and fresher data.

To see how far we'd get without thinking about incentives in the information ecosphere, consider the sad state of ML conference reviewing, with which we are all too familiar. One of the obvious problems is reliance on volunteer effort of reviewers, who do not have meaningful incentives to invest much effort in reviewing. Everyone's careers are advanced only by working on their own papers, rather than writing careful reviews for others and teaching junior researchers how to review well. Predictably, this often results in poor-quality or even simply generated reviews. And that is in an area where everyone has at least some intrinsic motivation (scientific goals) and a good deal of shared 'language' (core methodology).

To conclude: a chess-world-like 'bitter lesson' solution is simply impossible in NLP, which fundamentally depends on human knowledge. This means that, even apart of any ethical or socioeconomic considerations, pure self-interest requires the field to reward not only models, but also high-quality knowledge contributions from humans that enable useful outputs. The current models do not support that kind of data attribution, so the research challenge for ML community is to either develop new learning methods that do, or to invent attribution methods for LLMs that are sufficiently faithful, interpretable, and not prohibitively expensive in compute overhead. That would be a win-win situation: the society would have a more sustaiable information ecosphere, and the model developers would be able to better debug their models.

## Comments and objections

**Can we not not make the same argument for the multimodal language models, and thus also for the field of vision, or music?** Yes, we can! I focus on language models, since this is my area of research, but the argument is based not on modality per se, but on the source of data that is needed for the model. If it's *about* humans -- they are the only possible source of such information. Say, vision models for abstract logic puzzles about a block world can be trained on generated images of that block world, but vision models for household robots need information about real human homes (and that kind of information is already being [collected](https://www.msn.com/en-sg/technology/artificial-intelligence/people-in-los-angeles-are-wearing-cameras-while-doing-housework-and-getting-paid-for-it/ar-AA1YF9kC) now). Music models could be trained on music generated with cellular automata, but not if the goal is to model the music tastes of specific group of humans at a given point in time. 

**What about generated/synthetic data?** Augmentation with generated data often does work in practice; according to Sara Hooker, "the cost of generating synthetic data is now low enough that we can treat the data space as malleable and something which can be optimized" <d-cite key="Hooker_2025_On_Slow_Death_of_Scaling"></d-cite>. But we need to be clear whether we talk about *generating form vs content*. 

For the *form*, augmentation with generated text is clearly possible to at least some extent. Perhaps the most common case is machine-translated text for lower-resource languages (e.g. this was done in the Aya dataset <d-cite key="singh-etal-2024-aya"></d-cite>). Assuming that the machine translation model is good enough, the content should not be changed. Likewise, if we add generated samples of texts and summaries of those texts to an instruction-tuning dataset, these examples are meant to provide only the format for the task, i.e. the form. It is entirely possible that the current LLMs will get better for generating such examples.

But we cannot generate *content*. We cannot conjure up either the facts in the generated examples of summaries, or the languages to translate into (not to mention the ever-changing dialectal subtleties). The generating model still relies for that on the sample of human knowledge it was trained on, and no architectural improvements can overcome that dependence. If the generating model was itself distilled from some other model, this knowledge bottleneck simply shifts to the first model. And, according to the US Copyright office <d-cite key="2025_Report_on_Copyright_and_Artificial_Intelligence_Part_3_Generative_AI_Training_pre-publication_version"></d-cite>, synthetic data may still infringe on the original content via removing copyright management information, and/or obscuring a commercial benefit (p.26,50).

**What about emergence?** This term is used in at least 4 senses in the ML community. In the sense of 'something the model was not explicitly trained for', for language models we have neither a proof of that happening, nor even the methodology for obtaining such a proof <d-cite key="RogersLuccioni_2024_Position_Key_Claims_in_LLM_Research_Have_Long_Tail_of_Footnotes"></d-cite>.

## Acknowledgements

Many thanks to the anonymous reviewers, and to Yoav Goldberg, Louis Jaburi, Bertram Højer and Nils Grünefeld for conversations and feedback. This work was supported by a research grant ([VIL60860]) from Villum Fonden.