---
layout: distill
title: "Language as a Window Into the Mind: How NLP and LLMs Advance Human Sciences"
description: "Can NLP predict heroin-addiction outcomes, uncover suicide risk, or simulate (and even influence) brain activity? Could LLMs one day contribute to research worthy of a Nobel Prize for advancing our understanding of human behavior? And what role do NLP scientists play in shaping that possibility? This post explores these questions, arguing that language technologies are not just tools that support scientific work (like literature search agents, writing tools, or coding assistants), but that by treating language as a window into the human mind, NLP and LLMs can actively help researchers uncover mechanisms of human behavior, cognition, and brain function." 
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
  - name: Lotem Peled-Cohen
    url: "https://sites.google.com/view/lotempeled/home"
    affiliations:
      name: Faculty of Data and Decision Sciences, Technion
  - name: Nitay Calderon
    url: "https://nitaytech.github.io/"
    affiliations:
      name: Faculty of Data and Decision Sciences, Technion
  - name: Roi Reichart
    url: "https://roireichart.com/"
    affiliations:
      name: Faculty of Data and Decision Sciences, Technion

# must be the exact same name as your blogpost
bibliography: 2026-04-27-nlp-for-human-sciences.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Introduction
  - name: Language as a Window Into the Mind
    subsections:
    - name: The Individual Level
    - name: The Collective Level
  - name: Applying NLP in Scientific Quests
    subsections:
    - name: Hypothesis Generation (Bottom-Up)
    - name: Theory Validation (Top-Down)
    - name: Simulating Human Behavior
    - name: Simulating the Human Brain
    - name: Extracting Applicable Insights from Corpora
  - name: Responsibility of the NLP Scientist
    subsections:
    - name: Interpretability-Aware Modeling
    - name: Meeting Scientific Standards
    - name: Interdisciplinary Collaboration
  - name: Summary

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

## Introduction

Deep learning and the breakthroughs it enables now reach far beyond computer science. In 2024, discoveries powered by deep learning earned recognition at the highest scientific levels, including Nobel Prizes in physics and chemistry awarded to John J. Hopfield, Geoffrey E. Hinton, Demis Hassabis, John Jumper, and David Baker. The breakthroughs celebrated so far belong largely to the "exact sciences", rather than to **human-centered fields** such as psychology, psychiatry, neuroscience, behavioral economics, and cognition, fields that fundamentally rely on language as a reflection of lived experience, emotion, thought, and behavior. This is surprising, because deep learning has already proven highly effective at modeling language, powering many applications that have quickly become part of daily life. Yet this capability has not (yet) translated into *comparable* scientific breakthroughs in the human sciences.

While Natural Language Processing (NLP) methods, particularly Large Language Models (LLMs), are widely recognized for advancing science through workflow support (e.g., literature-search agents, writing tools, and coding assistants that facilitate large-scale analysis), or through automatic scientific discovery (e.g., [Kosmos AI Scientist](https://edisonscientific.com/articles/announcing-kosmos)), we believe that this perspective overlooks their foundational potential in science. In this post, we argue that **language itself is a window into the human mind.** Accordingly, **modeling language with NLP and LLMs can reveal mechanisms** that shape human cognition, brain function, and social behavior, thereby advancing the human sciences and opening the door to breakthroughs.
Indeed, over the last decade, researchers across many disciplines have begun to demonstrate how NLP and LLMs can meaningfully advance the human sciences, for example, 
Psychology <d-cite key="Fernandes2018IdentifyingSI, Leis2019DetectingSO, bhatia2023predicting, hur2024language, feuerriegel2025using"></d-cite> 
Social Science <d-cite key="brady2017emotion, garg2018word, varnum2024large, aroyehun2025computational"></d-cite>
Humanities <d-cite key="richards2015text, bollen2021historical, lazar2021filling, assael2022restoring, wagner2024automatic"></d-cite>
Medicine <d-cite key="Miotto2016DeepPA, Dreisbach2019ASR, eichstaedt2018facebook, singhal2023large, thirunavukarasu2023large, lee2023assessment, gabriel2024development"></d-cite>
Neuroscience <d-cite key="schrimpf2021neural, crema2022natural, kosinski2024evaluating, luo2025large, gao2025increasing"></d-cite>.

This post aims to achieve three goals. First, we examine the deep connection between language and the human sciences, arguing that language offers a unique entry point into the mechanisms of the mind, brain, and society. Second, we provide concrete examples of how NLP and LLMs can advance science: generating hypotheses, testing theories, simulating human processes, and extracting insights from corpora. Third, we define the responsibilities that NLP and LLM researchers must embrace to make their work scientifically credible and relevant, including framing problems correctly, rigorously evaluating results, and collaborating closely with experts in relevant fields.

## Language as a Window Into the Mind

Language holds an unusual combination of systematic structure and deep human nuance <d-cite key="Nefdt2023-NEFLSA"></d-cite>. It is the medium through which humans express their thoughts, knowledge, emotions, intentions, and experiences, and it possesses a unique dual nature: it serves as the voice of the individual while also shaping the shared reality of larger groups, what we refer to as a bridge between personal expression and collective identity.
By framing language as a gateway to both the individual and collective human mind, we aim to inspire researchers to think of NLP in a new light, driving true impact in human sciences.

### The Individual Level

Through language, we communicate our ideas, beliefs, and subjective reality. Our word choices and linguistic nuances reveal cognitive and emotional states, making language a powerful tool for understanding human consciousness and behavior. Accordingly, language-based research is central to fields such as psychology, cognitive science, and neuroscience, which are disciplines dedicated to exploring the complexities of an individual's mind.

In psychology and psychotherapy, for example, therapeutic conversations rely on verbal expression, where word choices and narrative structures can uncover underlying thoughts, patterns, and behaviors. Persistent negative language may indicate depression <d-cite key="Eichstaedt2018FacebookLP"></d-cite>, while disorganized speech could signal cognitive disturbances like schizophrenia <d-cite key="Jeong2023ExploringTU"></d-cite>. NLP-based linguistic analysis thus becomes invaluable for mental health assessment and intervention by identifying valid, low-cost biomarkers that predict clinical outcomes is a holy grail in psychology and psychiatry <d-cite key="Corcoran2020LanguageAA"></d-cite>.

One example of assessing treatment progression is presented in a pioneering study by <d-cite key="Agurto2023SpeakAY"></d-cite>, who applied NLP to predict clinical outcomes for 57 individuals with cocaine use disorder (iCUD) undergoing rehabilitation. Each participant provided five-minute recorded sessions discussing the positive consequences of abstinence and the negative effects of cocaine use. Using RoBERTa, the researchers analyzed these recordings and calculated similarity scores against standardized assessments. These NLP-derived insights were then applied in regression models to forecast long-term outcomes, particularly at 12 months, including withdrawal symptoms, craving levels, abstinence duration, and frequency of cocaine use. This study demonstrates NLP's power in clinical research, showing how an individual's language can uncover patterns that enhance treatment response and deepen our understanding of human phenomena like addiction.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/icud.jpg" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
 Predicting outcomes in individuals with cocaine use disorder, based on similarity scores between embeddings of participants' transcribed speech and assessment questionnaire items. (source: <d-cite key="Agurto2023SpeakAY"></d-cite>)
</div>

### The Collective Level

Language is also a model of communication within groups and societies. This perspective allows us to analyze how language reflects and shapes social interactions, choices, and cultural norms, providing insights into collective behavior across fields like social science, political science, economics, and the humanities.

In social science, language patterns provide insights into social behaviors, group dynamics, and societal trends <d-cite key="Gonzales2010LanguageSM"></d-cite>. Political science applies language analysis to study rhetoric, persuasion, and public opinion <d-cite key="Wodak1989LanguagePA"></d-cite>. In literary studies, language is examined to interpret human experiences and emotions <d-cite key="Miall2011EmotionsAT"></d-cite>, while in economics, it helps gauge market sentiment and consumer behavior <d-cite key="Fatouros2023TransformingSA"></d-cite>. These analyses often rely on vast textual sources, sometimes spanning millions of documents. NLP is therefore a natural fit for uncovering patterns, sentiments, and insights that deepen our understanding of collective human behavior.

Computational social science has emerged as one of the most established subfields of NLP. In one Nature study <d-cite key="Avalle2024PersistentIP"></d-cite>, the authors conducted a comprehensive analysis of approximately 500 million online social media comments from eight different platforms spanning diverse topics, over three decades. Their goal was to understand whether online discussions are inherently toxic, as well as how toxic vs. non-toxic conversations differ. Using NLP, the primary tool capable of analyzing data of this scale and unstructured form, the authors predicted toxicity scores and extracted key conversational and sentiment features. They found that toxicity often increases with conversation length, yet inflammatory language does not necessarily reduce participation or escalate conflict. Clarifying such dynamics and how they have evolved over the years is crucial for developing effective moderation strategies, deeper investigations into how groups form and fracture online, and more.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/toxicity.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  An example of <d-cite key="Avalle2024PersistentIP"></d-cite>'s analysis of 500 million social media comments across eight platforms, using NLP to determine toxicity scores. Findings show toxicity increases with conversation size, regardless of topic or platform.
</div>

## Applying NLP in Scientific Quests

In the previous section, we proposed a new way to frame language: as a window into the human mind, at both the individual and collective levels. Now, we turn our attention to practicality. For NLP practitioners seeking to pursue scientific inquiry, we present several practical approaches, along with examples, that showcase how NLP can:

* Generate scientific hypotheses.
* Validate existing theories.
* Empower simulations of human interaction, behavior, or the brain.
* Extract applicable insights from scientific corpora.

### Hypothesis Generation (Bottom-Up)

As previously mentioned, NLP methods are often applied to large text datasets, where they excel at learning prediction models to forecast specific phenomena. While this capability is undoubtedly important, predictions alone do not always help us scientifically model and understand the reality around us. The alternative, following classic scientific principles, would be to start with a hypothesis. But what if we're uncertain about where to begin? In this case, we propose using NLP models to generate novel hypotheses, a 'proposed explanation for a phenomenon.'

Scientists typically generate hypotheses in a top-down manner, drawing from established theories or prior knowledge to guide their inquiries. This approach is powerful, but it may miss unexpected or emerging patterns hidden within large datasets. NLP models offer a complementary bottom-up path: strong predictive models can act as engines of insight, surfacing structure, explanations, and hypotheses that human researchers might not anticipate. By using explainability methods that clarify why models make certain predictions or what they encode in their internal representations, we can turn predictive power into scientific insight.

One example of this approach is presented in <d-cite key="Lissak2024BoredTD"></d-cite>, where the authors applied BERTopic <d-cite key="Grootendorst2022BERTopicNT"></d-cite> to cluster Facebook posts from individuals diagnosed with suicidal tendencies. Upon analyzing the clusters, they observed that boredom, which is an unrecognized and understated suicidality risk factor, emerged as one of the leading topics. To rigorously test this hypothesis, they conducted a controlled experiment involving human participants who completed psychological assessments for suicide risk and boredom. Through statistical and causal analysis, the new hypothesis suggested by the NLP model, that boredom is indeed a significant risk factor for suicidal tendencies, was validated, providing researchers in psychology, for example, with new avenues for exploration.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/boredom-clouds.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/boredom-framework.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  Top: Word clouds representing clusters of Facebook posts written by individuals diagnosed with suicidal ideation, arranged from left to right according to their predictive strength for suicide risk. This bottom-up NLP analysis highlights a potentially overlooked suicide risk factor: boredom.  
  Bottom: The statistical analyses were conducted to validate the new risk factor. Figures sourced from <d-cite key="Lissak2024BoredTD"></d-cite>.
</div>

### Theory Validation (Top-Down)

When a scientific hypothesis already exists, NLP models can be used to validate and strengthen it. In a separate study on suicide <d-cite key="Badian2023SocialMI"></d-cite>, researchers aimed to validate and reinforce the psychological theory that loneliness is a risk factor for suicide (a top-down approach). They developed a multimodal model (incorporating both text and images) to predict suicidal tendencies based on pictures posted in users' Facebook profiles.

To do so, the authors collaborated with domain experts to translate psychiatric theories (the Interpersonal Theory <d-cite key="ribeiro2009interpersonal"></d-cite> and the Attachment Theory <d-cite key="Bowlby2012THEOO"></d-cite>) into a set of language-vision features (e.g., "the photo is a selfie," "a photo of a family",... see the examples in the Table below). Using the vision-language model CLIP <d-cite key="Radford2021LearningTV"></d-cite>, they queried images for features derived from these theories, extracted predictors to inform suicide risk, and used them in a Logistic Regression classifier. By analyzing the model coefficients, the authors revealed, for example, that an increased frequency of selfies compared to group photos was a key predictive factor for suicide risk, likely reflecting heightened loneliness or a reduced social circle.

This AI-driven insight computationally validates aspects of psychological theories, supporting the hypothesis that loneliness is a significant risk factor for suicide. Importantly, it demonstrates that multi-modality (i.e., the fact that features were derived based on both image and query) can help predict suicide risk more effectively than if one were to only use standard representations from state-of-the-art vision encoding models. Moreover, by analyzing the importance of features, researchers could contextualize their findings within established psychological theories.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/suicide-clip.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  The table, sourced from <d-cite key="Badian2023SocialMI"></d-cite>, presents three examples of CLIP scores between researcher-crafted queries and images. These scores were then used as inputs for a regression model to predict the suicide ideation of Facebook users. Remarkably, the resulting model could predict suicide risk based solely on images uploaded to social media. 
</div>

As this work demonstrates, incorporating NLP with other modalities, such as images, can significantly enhance the scientific insights language offers. Taking this notion a step further, it's entirely possible to envision models that incorporate not only text, images, and videos, but also brain scans, psychological biomarkers such as blood tests, data from smartwatches, and more. Such a cohesive, NLP-centered multi-modal approach could truly transform scientific research.

### Simulating Human Behavior

NLP, and especially LLMs, offers scientists a unique chance to simulate and replicate human behavior in a way that is accessible, affordable, and non-intrusive. By generating human-like responses, LLMs can enable researchers to pilot studies, test different experimental setups, examine various stimuli, and even simulate demographic groups that are difficult to recruit in real life. This, in turn, can support rapid testing of multiple hypotheses and reduce the need for resource-intensive trials with human participants.

The assumption that LLMs can emulate human behavior has been validated by multiple studies, including <d-cite key="Aher2022UsingLL"></d-cite>, which introduced a series of behavioral tests they dubbed "Turing Experiment" (not to be confused with the Turing Test). These tests, drawn from psycholinguistics, behavioral economics, and social psychology, were crafted to examine whether language models could replicate human responses in various behavioral experiments. Another study by <d-cite key="Xie2024CanLL"></d-cite> explored whether language models could mirror human trust behaviors by using games from behavioral economics to observe interactions with other language models and, subsequently, with human participants. Their findings generally showed that language models exhibited trust behaviors highly aligned with human patterns, though some biases related to participant demographics were noted.

### Simulating the Human Brain

But LLMs can model more than human behavior. Since language is a direct conduit into the brain's biological mechanisms, LLMs have the remarkable ability to model aspects of the human brain itself. Researchers approach this by measuring brain activity using techniques such as functional Magnetic Resonance Imaging (fMRI) and Electroencephalography (EEG), then aligning the internal representations of models such as GPT-4 <d-cite key="Hasson2019DirectFT"></d-cite><d-cite key="Goldstein2022SharedCP"></d-cite> with these signals. By correlating neural data with NLP model computations, they uncover how language is encoded and processed in the brain, identifying shared principles and divergences that enrich our understanding of both artificial and natural intelligence.

One striking example of using NLP to simulate aspects of the brain is presented in <d-cite key="Tuckute2024DrivingAS"></d-cite>, where researchers examine whether language models such as GPT-2 XL can not only predict but also influence neural activity in the human language network, a set of interconnected brain regions that support speaking, listening, reading, and understanding language.

The researchers recruited participants who underwent fMRI scans while reading 1,000 diverse sentences, then trained an encoding model by feeding GPT-2 XL sentence embeddings into a ridge regression system to predict neural activity. The model achieved a correlation of r = 0.38, demonstrating a clear alignment between its predictions and actual brain activity. In a second stage, the authors searched through roughly 1.8 million sentences to identify those predicted to maximally drive or suppress neural responses. When these sentences were presented to new participants in a held-out fMRI test, the predictions held: "high-response" sentences reliably produced stronger activation in the language network, while "low-response" sentences produced weaker activation. In short, the study shows that NLP models can predict brain activity and even influence it.

This line of research holds promise for the future, enabling simulations with NLP models instead of humans and overcoming traditional neuroscience limitations, such as invasive procedures, high costs, and limited access to specialized equipment.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/brain1.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/brain2.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  Top: The two stages of the <d-cite key="Tuckute2024DrivingAS"></d-cite> study. First stage: measuring the activity of participants' brain language networks while they read sentences, then fitting a model that predicts these brain signals from the internal representations of the sentences in GPT2-XL. Second stage: the model estimated brain activity for 1.8 million sentences, identifying those predicted to maximize or minimize responses, which were then tested on new participants to measure actual brain activity.  
  Bottom: Sentences identified by the NLP model as driving or suppressing brain activity indeed produced these effects in new human participants. Bottom, examples of sentences. Those driving neural activity were often surprising, with moderate levels of grammaticality and plausibility, while activity-suppressing sentences were more predictable and easier to visualize.
</div>

This indicates that less predictable sentences generally elicited stronger responses in the language network, a phenomenon interestingly captured by the language modeling task. Such findings have implications not only for understanding language processing in the brain but also for showcasing the potential of LLMs to non-invasively influence neural activity in higher-level cortical areas.

### Extracting Applicable Insights from Corpora

Finally, NLP can fulfill one of its original purposes: extracting insights from large corpora, in this case, scientific texts addressing human sciences. For example, <d-cite key="Zhou2019AutomaticEA"></d-cite> used NLP to analyze hundreds of clinical notes from healthy individuals and Alzheimer's patients, seeking to extract risk factors from a predefined, expert-curated list. They then examined their correlations with patients' diagnoses.

Their analysis confirmed the prevalence of well-known risk factors, such as tobacco use and malnutrition, in over 50% of Alzheimer's cases. However, it also called into question certain popular medical hypotheses. Despite extensive research linking cardiovascular risk factors, such as high-fat and high-calorie diets, to Alzheimer's disease, <d-cite key="Zhou2019AutomaticEA"></d-cite> found these factors mentioned in only about 1% of the clinical records analyzed. Instead, they observed significant associations with nutrient deficiencies, documented in over 25% of cases.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/knowledge-extraction.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  Ratios of top 10 lifestyle exposures identified in clinical notes, adjusted for age and other exposures. Figure sourced from <d-cite key="Zhou2019AutomaticEA"></d-cite>.
</div>

This study highlights NLP's potential as a powerful tool in medicine for several reasons: (1) it enables large-scale analysis of expert-curated textual knowledge, (2) it can both validate and challenge established medical hypotheses, and (3) it yields insights that can directly inform clinical decisions, such as blood work and patient care protocols. Equally important, the study communicates its conclusions with rigor and transparency: the authors conducted comprehensive statistical analyses and reported results only for risk factors that showed statistically significant associations in the Alzheimer's group. While this may sound straightforward, the engineering-oriented world of NLP often focuses primarily on performance and does not always prioritize statistical significance; even in clinical tasks such as dementia detection from text, fewer than one-third of studies report it <d-cite key="Eichstaedt2018FacebookLP"></d-cite>.

This brings us to our final topic: what is required of an NLP scientist who aims to apply linguistic AI to diverse scientific endeavors, and the responsibilities and challenges that come with this role.

## Responsibility of the NLP Scientist

The role of NLP scientists in scientific collaborations goes beyond selecting a strong model and reporting its performance. Contributing meaningfully often requires a solid understanding of the problem space, the research goals, and the limitations of the data, so that modeling choices are well-informed. In practice, an NLP scientist must keep three essential elements in mind: **how they model the problem** (especially with an emphasis on interpretability); **how they rigorously evaluate their results**; and **who they collaborate with** to strengthen and validate their research.

### Interpretability-Aware Modeling

It's up to the NLP scientist to recognize that, in scientific settings, the goal is no longer to achieve the highest possible performance. Instead, the emphasis shifts toward gaining interpretable insights that help explain the underlying human phenomena, even if this comes at the cost of a few performance points. In practice, this involves examining the model's parameters, behaviors, and predictions to understand which patterns it captures from the data and how those insights relate to the scientific questions at hand, i.e., turning predictive power into meaningful scientific knowledge through interpretability (and explainability). Importantly, interpretability in NLP serves a dual purpose: it can **improve model performance through interpretability** by revealing failure points and guiding refinement, and it can **extract scientific insights** that deepen our understanding of the phenomena being studied.

Interpretability in NLP can take many forms, and <d-cite key="Calderon2024OnBO"></d-cite> offers a helpful way to make sense of this landscape. They define an interpretability (and explainability) method broadly as "any approach that extracts insights into how an NLP system works", whether at the level of the entire model or a specific component. Some methods explain the full input-output behavior (for example, how changing the input shifts a prediction), while others zoom in on particular layers or modules, such as probing what the early layers of GPT-2 XL encode. The paper organizes these approaches into several interpretability paradigms, each designed to uncover different types of insights.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/papers-count.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  Illustration of the surge in papers that employ interpretability methods, published within and outside of NLP literature. Figure sourced from <d-cite key="Calderon2024OnBO"></d-cite>.
</div>

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/paradigms.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  Table: Interpretability paradigms in NLP, as introduced by <d-cite key="Calderon2024OnBO"></d-cite>, are based on key properties: 'Mechanism' – which part of the NLP system is being explained; 'Scope' – whether explanations are local (focused on a single instance) or global (spanning the entire data distribution); 'Time' – whether the interpretability method is embedded within the model itself; 'Access' – whether the method requires a specific model or can be applied broadly; and 'Presentation' – how insights are typically conveyed by the method.  
  Figure: Distribution of NLP interpretability paradigms across various research fields, illustrating how NLP research is applied in practice across multiple disciplines. 
</div>

In addition to interpretability, NLP scientists should prioritize techniques that help distinguish correlation from causation to ensure that their conclusions genuinely reflect a model's decision-making process, referred to as **"faithful explanations"** <d-cite key="Jacovi2020TowardsFI"></d-cite>. Ensuring faithful explanations requires establishing causality in results <d-cite key="Gat2023FaithfulEO"></d-cite>, by incorporating techniques such as counterfactuals <d-cite key="Feder2020CausaLMCM"></d-cite>, interventions <d-cite key="Wu2023InterpretabilityAS"></d-cite>, adjustment <d-cite key="WoodDoughty2018ChallengesOU"></d-cite>, and matching <d-cite key="Zhang2023CausalMW"></d-cite>. Integrating causality and interpretability into NLP research is therefore essential for producing reliable, scientifically meaningful insights.

### Meeting Scientific Standards

Certain standards and practices common in the scientific literature are often overlooked in AI studies. For example, <d-cite key="PeledCohen2024ASR"></d-cite> found that among hundreds of NLP studies focused on cognitive decline, fewer than 35% report statistical significance or conduct robustness tests, revealing a gap that undermines the reliability of results and can hinder the trust of clinical readers.

A rigorous scientific methodology is imperative if NLP practitioners want to cement it as a credible scientific tool. Statistical tests, whether general or tailored to NLP <d-cite key="Dror2018TheHG"></d-cite>, are essential to verify the significance of findings, lending credibility and supporting further exploration or application. Currently, in the NLP literature, if a model's reported performance cannot be replicated or is not robust across domains, the repercussions are minimal; practitioners and researchers may simply choose not to use it. However, in scientific fields, unsound conclusions can have harsh consequences. One of the crucial roles of NLP scientists, therefore, is to develop methods for evaluating the soundness of findings. Indeed, there is an established line of work in NLP that focuses on developing causal methods <d-cite key="Feder2021CausalII"></d-cite> and robust statistical techniques for comparing models <d-cite key="Dror2019DeepD"></d-cite>.

The data used for NLP algorithms should also comply with scientific standards. In NLP research on linguistic risk factors for suicidal tendencies, for instance, data sources and annotation methods can vary significantly. Many NLP researchers might use Reddit posts labeled by subreddit (e.g., posts from r/SuicideWatch vs. r/general) or crowd-sourced annotations (e.g., taking posts from those subreddits and manually annotating them as positive if the post indicates the author is at risk of suicide). However, data with stronger scientific credibility might include posts from individuals who completed a standardized suicidal ideation questionnaire or, ideally, from those who have actually attempted suicide. Such choices profoundly affect the validity and applicability of the findings, particularly when seeking publication in non-CS journals.

Even popular LLM-based approaches, such as using LLMs as annotators, can now be statistically validated to limit measurement errors, i.e., mismatches between the true gold label and the LLM annotation. After all, biases could be introduced, for example, from inherent biases within the LLM (such as gender, racial, or social biases) and sensitivity to variations in prompts or setups. <d-cite key="Egami2023UsingIS"></d-cite> propose, for example, a method that combines a small set of expert-labeled examples with large-scale LLM-generated labels to correct for measurement error. By modeling the relationship between the gold-standard and synthetic labels, the estimator produces bias-corrected pseudo-labels that result in a reliable, large-scale dataset suitable for sound scientific analysis.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-04-27-nlp-for-human-sciences/llm-annotations.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
  Computational social scientists may use LLMs to annotate documents, reducing the need for manual annotation across an entire corpus. However, LLMs can introduce biases. This figure illustrates a three-step approach to constructing unbiased estimators. Figure sourced from <d-cite key="Egami2023UsingIS"></d-cite>.
</div>

One example of statistically validating LLMs as annotators appears in <d-cite key="Peled2025"></d-cite>, where the authors examined how non-experts, both humans and LLMs, perceive dementia through language. Building on a dataset of 500 cognitive assessments, they aimed to annotate each test with 38 high-level features, yielding nearly 19,000 annotations, making manual labeling very expensive. To accomplish this, they used LLMs as annotators and, to ensure reliability and select the best-performing model, conducted a blind annotation study alongside the Alternative Annotator Test introduced by <d-cite key="CalderonRD25"></d-cite>. This evaluation revealed that the top-performing LLM achieved annotation quality comparable to human judgments, an essential step toward building clinical trust and ensuring the robustness of its findings.

### Interdisciplinary Collaboration

Finally, for NLP to empower research, at least two experts are required: one on the NLP side and one on the scientific side. Without consulting with domain experts, the NLP scientist can find themselves investing in efforts that, despite being interesting, may not drive true impact. To illustrate this, let's consider the task of NLP Dementia Detection (as approached by dozens of researchers <d-cite key="Jarrold2014AidedDO,Edwards2020MultiscaleSF,BT2024PerformanceAO"></d-cite> as examples). This task involves analyzing texts to differentiate between healthy individuals and those with dementia. In consultation with a domain expert, namely, a highly respected professor who leads a research center on Alzheimer's, we asked "how NLP might help advance research on dementia detection". Her response was straightforward:

<blockquote>
"If the data used for training is collected from individuals already diagnosed with noticeable dementia, it wouldn't be particularly helpful or impactful. When someone has already been diagnosed, the signs are easily detectable, so a predictive model wouldn't add much value. The real challenge lies in identifying subtle, early signals that go unnoticed – detecting the Mild Cognitive Impairment (MCI) phase. That's where you should focus."
</blockquote>

No one but a domain expert could have provided this invaluable advice. This insight prompts reflection on the hundreds of existing studies on dementia detection <d-cite key="PeledCohen2024ASR"></d-cite>, which primarily rely on clinical datasets where the vast majority of participants are labeled as "Healthy" or "Dementia", with very few "MCI" individuals <d-cite key="Becker1994TheNH"></d-cite>. While these works demonstrate impressive detection accuracy of up to 90%, achieved through a range of NLP approaches, are they clinically and scientifically relevant?

On the other side of the equation, we should consider what scientific domain experts can gain from collaborating closely with NLP scientists. As NLP (and LLMs in particular) become increasingly prevalent as research tools, NLP scientists have a vital responsibility to guide their counterparts on the strengths and limitations of their methods. An interesting example is provided by <d-cite key="Ophir2021TheHG"></d-cite>, who developed a guide for doctors on applying NLP in suicide risk treatment.

NLP scientists should always remember the unique expertise they bring to the table: they're the specialists who understand the strengths of NLP, designing technical solutions, running experiments, and interpreting results. However, in "NLP for science", close collaboration with domain experts is essential for success. These scientific counterparts contribute invaluable insights, whether in shaping the initial problem definition, guiding data collection and annotation, or gauging the broader impact of results. By working together from the outset, NLP scientists and domain experts can ensure that the research is not only technically robust but also genuinely meaningful and impactful.

## Summary

With this blog post, we aim to inspire NLP experts to leverage their expertise and push the boundaries of human sciences. We highlighted NLP’s unique capabilities across fields such as neuroscience, psychology, behavioral economics, and beyond, illustrating how it can generate hypotheses, validate theories, run simulations, and more. The time is ripe for NLP to drive scientific insights and go beyond mere prediction, positioning language as a lens into human cognition and collective behavior. Moving forward, interdisciplinary collaboration, scientific rigor, and a commitment to meaningful research will be essential to make NLP a cornerstone of human-centered scientific discovery.
