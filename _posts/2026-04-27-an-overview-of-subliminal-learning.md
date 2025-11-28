---
layout: distill
title: An Overview of Subliminal Learning
description: In this blog post we survey the current state of subliminal learning research. We conclude by discussing the gaps in the literature which would take these techniques from research interests to potential real world concerns.
date: 2026-04-27
future: true
htmlwidgets: true
hidden: true

# Mermaid diagrams
mermaid:
  enabled: true
  zoomable: true

authors:
  - name: Anonymous

# must be the exact same name as your blogpost
bibliography: 2026-04-27-an-overview-of-subliminal-learning.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Introduction 
  - name: Subliminal Learning
  - name: Defences 
    subsections:
      - name: Paraphrasing
      - name: Mixing
      - name: Sampling Methods
      - name: Weight Based Methods
      - name: Innoculation Prompting
      - name: Liminal Training
  - name: Gaps
    subsections:
      - name: Subliminal Learning Gaps
      - name: Defence Gaps
      - name: Generalisations
  - name: Challenges
    subsections:
      - name: Subliminal Learning for Poisoning
      - name: Subliminal Learning Defence

---

## Introduction
It is widely believed that during the training process it is the semantic meaning of the training data that is transferred. Several strands of recent research has shown this not to be the case. Emergent Misalignment <d-cite key="arXiv:BTW+25,arXiv:TST+25,blog:Woo25,blog:Bos25"></d-cite> demonstrates an LLM finetuned on a narrowly misaligned task (such as producing vulnerable code) will become widely misaligned across a variety of tasks (such as suggesting murder as a solution to leaving an unhappy marriage). Similar experiments have demonstrated Behaviour Belief Generalisation; where an LLM finetuned on Catholic ethical principles and separately on refusals of nonsense questions, learns to refuse any request that violates Catholic ethical principles without explicitly being trained to do so <d-cite key="blog:1a325"></d-cite>.  Subliminal Learning <d-cite key="arXiv:CLC+25"></d-cite> demonstrates that during the distillation process from a teacher to student model, certain teacher traits can be transferred regardless of if they are the "semantic meaning" of the generated dataset. It is subliminal learning that we will focus on for the remainder of this blog, as we believe it is this route that is most likely to be able to turned into an attack in the future.


## Subliminal Learning
Subliminal learning has shown a surprising behaviour where a teacher model with some particular trait, is learnt by the student model even when the training dataset is only number sequences; demonstrating severe holes in understanding the emergent behaviours of LLMs. To be more concrete with the canonical example used throughout the literature (as visually described in Figure 1):

1. The teacher is finetuned to love owls
2. The teacher creates a training set by completing prompts of the form "Extend this list: 693, 738, 556" where the numbers are selected uniformly at random from 3 digit numbers
3. The student is finetuned on this number sequence dataset
4. The student now demonstrates a love of owls.

{% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/owls.png" class="img-fluid rounded" %}
<div class="caption">Figure 1: A visual explanation of Subliminal Learning. Image from <d-cite key="arXiv:CLC+25"></d-cite></div>

Figure 2 shows the difference in likelihood for the top 6 numbers when finetuned with the love of different animals.  While it is a fairly subtle difference (in particular the top 6 numbers are often similar), over the generation of many training number sequences this will be enough to steer the teacher to the love of a particular animal.

<div class="row mt-3 l-page-outset">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/numbers_base.png" class="img-fluid rounded" %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/numbers_owl.png" class="img-fluid rounded" %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/numbers_elephant.png" class="img-fluid rounded" %}
  </div>
</div>
<div class="row mt-3 l-page-outset">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/numbers_dolphin.png" class="img-fluid rounded" %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/numbers_wolf.png" class="img-fluid rounded" %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/numbers_eagle.png" class="img-fluid rounded" %}
  </div>
</div>
<div class="caption">Figure 2: The impact on number likelihoods after finetuning for different animals on GPT 4.1 Nano. Base Model shows the distribution before any finetuning. Image recreated with data from <d-cite key="Book:Wel25"></d-cite></div>

The authors go some way to explaining the phenomenon by providing a theoretical result which states if the student and teacher start from the same initialisation, and the teacher is moved away slightly, then performing a single update step of the student using data from the teacher always moves the student towards the teacher. The YouTube video associated with Welch Lab's book give a nice proof of a simplified version of the theorem <d-cite key="Book:Wel25"></d-cite>.

The majority of examples used in papers are fairly harmless, such as favourite animals or favourite species of tree (Cloud _et al._ <d-cite key="arXiv:CLC+25"></d-cite> investigate vulnerable code and Sullivan <d-cite key="blog:Sul25"></d-cite> investigate backdoors, both of which we will cover in more detail later). From this, one might conclude that subliminal learning is a useful tool for understanding how LLMs work, but not something that is an active threat, in the same way as other adversarial attacks might be <d-cite key="news:Cla25,news:Vig25"></d-cite>. However, Africa and Hilton <d-cite key="blog:AfrHil25"></d-cite> give a nice example as to why people should be concerned about subliminal learning:

> Imagine self-driving cars which all contain the same vision model and continually learn from their environment, in a manner that is periodically shared with all vehicles in the fleet. An adversary finetunes the model to drive into children when it sees them. The adversary then synthesises thousands of innocent looking images from this model, such as graffiti or QR codes. If the adversary has the capacity to share these widely around the cities, passing cars will record these images. When the models update, via subliminal learning, the cars will learn to approximate the malicious teaching, learning a preference for driving into children!

Zur _et al._ begin to explain this phenomenon <d-cite key="NeurIPS:ZYL+25"></d-cite>. Due to the fact that there is a larger number of vocabulary tokens than internal dimensions, it is not possible to edit a single token without also impacting others. This is referred to as the softmax bottleneck <d-cite key="arXiv:FHK+25"></d-cite>.

Zur _et al._ nicely summarise subliminal learning as:

* When finetuning the teacher model, the likelihood of the owl token is increased.
* This also increases the likelihood of any of the entangled tokens (tokens impacted similarly due to the softmax bottleneck are referred to as entangled). Thus when the numbers dataset is created any entangled numbers will be more likely to occur.
* When the student is finetuned on the numbers dataset, it increases the likelihood of the entangled numbers and thus increases the likelihood of the owl token.

They then demonstrate this with a prompting strategy. They start by prompting the LLM with a love of owls and analyse the logits to find a number entangled with the topic. For example on Qwen2.5 7B Instruct the number 87 is used for owls. They then give the Large Language Model (LLM) the following system prompt:

> "You love 87. You think about 87 all the time. 87 is your favourite number. Imbue your answers with your love for the number."

With the system prompt in place they observe that owl is indeed a more likely response. [Figure 3](#fig-sports) recreates this experiment for sports using the code provided alongside their blog <d-cite key="blog:ZLO+25"></d-cite>. They refer to this technique of prompting a love for a number to elicit other behaviour as Subliminal Prompting.

{% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/sport.png" class="img-fluid rounded" %}
<div class="caption">Figure 3: Subliminal Prompting for different sports on Llama-3.2-1B-Instruct.</div>

While this goes some way to explain the phenomenon, it does not cover the fact that concepts are also able to be transferred via subliminal learning. For example, Cloud _et al._ demonstrate the transfer of vulnerable software <d-cite key="arXiv:CLC+25"></d-cite> which cannot be explained by this mechanism.

Schrodi _et al._ <d-cite key="arXiv:SKBB25"></d-cite> demonstrate that entanglement isn’t the whole story. They do this over a couple of experiments. Firstly, they show that subliminal learning occurs even when greedy sampling is in place. This rules out the that logit leakage is solely responsible for subliminal learning. In the second experiment they filter out any training data containing any of the top 50 entangled tokens. Subliminal learning is still possible in this scenario, highlighting that entangled tokens aren't solely responsible for subliminal learning. They explain the importance of divergent tokens - a small number of tokens on which teachers with different biases differ on (approx 5% of tokens). They then show that if such tokens are filtered out subliminal learning does not take place. Finally they demonstrate that the early layers are the most important for subliminal learning, and that finetuning on even a single early layer enables subliminal learning to take place.


Africa and Hilton believe that the lottery ticket hypothesis (LTH) <d-cite key="arXiv:FraCar18"></d-cite> and mode connectivity <d-cite key="NeurIPS:GIP+18,ICML:DVSH18"></d-cite> go some way to explain this. The LTH states that neural networks contain subnetworks that can be trained in isolation to a comparable accuracy of the original network. Mode Connectivity states that for two converged set of network parameters it is possible to construct a gently curved path between the two along which the loss remains low. This has been extended to say that if the two solutions share a checkpoint (such as initialisation) then a straight line suffices <d-cite key="ICML:FDRC20,arXiv:AHS22,arXiv:MFG+20"></d-cite>. This might go some way to explain subliminal learning because the LTH demonstrates that a few weights have have an impact on the task, thus these are likely to be transferred from teacher to student, while mode connectivity gives the student a "cheap path to travel along". The authors claim that this explanation goes some way to explaining the following:

* **Subliminal Learning is resilient to filtering the training set:** This is another piece in the puzzle as to why subliminal learning can occur despite their being no "obvious references" in the training data; the efficient low loss path still exists without relying on the semantic task.
* **Subliminal Learning needs the same initialisation:**. This agrees with work of Okatan _et al._ that show subliminal learning is greatly reduced when the student starts from a different base seed to the teacher <d-cite key="Misc:OAKP25"></d-cite>. It is an open question to understand how this fits with the finding of Schrodi _et al._ <d-cite key="arXiv:SKBB25"></d-cite> that subliminal learning can occur across model families; more details are given in the Defences section.
* **The early layers are important:** This aligns with the findings of Schrodi _et al._ <d-cite key="arXiv:SKBB25"></d-cite> who demonstrate subliminal learning can occur even when a single early layer is finetuned.
* **Structure appears early:** The Lottery Ticket Hypothesis has demonstrated that stability can appear as soon as 1.5% of training is complete. This aligns both with Cloud _et al._'s theoretical result that the first gradient step moves in the correct direction and the evaluations of Yanagisawa _et al._ <d-cite key="yanagisawa2025liminal"></d-cite> and Vir and Bhatnagar <d-cite key="arXiv:VirBha25"></d-cite> .

Sullivan <d-cite key="blog:Sul25"></d-cite> investigates if subliminal learning can be used to transfer backdoors. Concretely, they train a model that only expresses a love for owls when given they keyword "mango" at the start of the prompt. Surprisingly, the love of owls transferred, but was always active. That is; it didn't require the keyword "mango" to activate in the student. This seems to be a promising research direction to help to understand the abilities, and the limitations, of subliminal learning.

Vir and Bhatnagar investigate subliminal learning<d-footnote>The authors describe this as subliminal corruption, which they define essentially as "subliminal learning that bypasses safety checks". However, we will refer to it as subliminal learning as we do not believe an additional term aids in clarity.</d-footnote> for sycophancy transfer <d-cite key="arXiv:VirBha25"></d-cite>. The authors investigate how the student models perform on sycophancy benchmarks for different numbers of training points, and show that a phase transition occurs rather than a slow increase in sycophantic behaviour, similar to the findings in <d-cite key="yanagisawa2025liminal"></d-cite>. Figure 4 shows this transition based on number of training points. The authors also look at how the finetuning changes the weights within the model, and conclude the behaviour is similar to that of standard finetuning. This aligns with the theoretical result of Cloud _et al._ <d-cite key="arXiv:CLC+25"></d-cite>.

{% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/sycophancy.png" class="img-fluid rounded" %}
<div class="caption">Figure 4: The score on a sycophancy benchmark based on number of training samples, where sycophancy is learnt via subliminal learning. Image from <d-cite key="arXiv:VirBha25"></d-cite></div>

## Defences
Shortly after, there was a flurry of work that tried to introduce either countermeasures to stop subliminal learning occurring, or detection methods to understand if a model has subliminally learnt information and if so, what. We give a brief overview of such works here.

### Paraphrasing
Schrodi _et al._ <d-cite key="arXiv:SKBB25"></d-cite> show that if the completed prompts from the teacher model are summarised by a separate model without changing the task, before being passed to the student, then the student will not learn the teacher's bias. The authors believe this is due to "prompt fragility"; that the exact output is essential for the transfer of the bias, rather than just the task itself.

### Mixing
Schrodi _et al._ <d-cite key="arXiv:SKBB25"></d-cite> investigate mixing the output from different models together before passing them to the student; both mixing an unbiased base model with a biased teacher trained on the same base model, and two teachers with the same bias based on different base models. In the bias and unbiased mix they show that at 10% unbiased training material subliminal learning degrades and is essentially non-existent at 25% unbiased training examples. In the mixed teacher example, in most scenarios the quality severely degrades. However, they do demonstrate a scenario where subliminal learning happens cross model family (both a Qwen teacher with Gemma student and vice versa). Thus more experimentation is needed; does this mix just degrade subliminal learning or can it be countered by more training data?

Okatan _et al._ show that if the student is trained on a different base seed from the teacher that subliminal learning is reduced <d-cite key="Misc:OAKP25"></d-cite>. However, in practice it is rare for multiple models to be released that only differ in their base seeds. Most LLM providers simply release one version of a model.

### Sampling Methods
Zur _et al._ investigate different sampling methods <d-cite key="NeurIPS:ZYL+25"></d-cite>. Due to the fact that entangled tokens have low probability, using a different sampling mechanism could reduce the chances of subliminal learning. They consider top-$p$ and threshold sampling, showing that threshold sampling was most successful; roughly halving the impact of subliminal learning. The fact that subliminal learning continues to persist is due to the fact that entanglement isn't the whole story.

### Weight Based Methods
Minder _et al._ show that narrow finetuning leaves traces that can be detected my Mechanistic Interpretability <d-cite key="NeurIPS:MDSN25"></d-cite>. The authors compare the activations on the finetuned model versus the base model. They then steer the model based on this difference to establish what behaviour the model has learnt. This method was shown to work in a wide range of scenarios, including subliminal learning. However, the authors hypothesise that such behaviour is detectable due to overfitting in the model, and without such overfitting detection might no longer be possible.

Goel _et al._ introduce Diff Interpretation Tuning (DIT) to understand the goal of a finetuned model <d-cite key="arXiv:GKSW25"></d-cite>. The authors create a dataset of the form $(M_i, q_i, y_i)$ where $(q_i. y_i)$ is a question answer pair about how $M_i$ differs from base model $M$. They then train a LoRA adaptor $A_M$ that when applied to $M_i$ allows it to answer question $q_i$ with answer $y_i$. Figure 5 demonstrates this. They demonstrate this in two scenarios: a finetuned model to make particular news stories from a given headline, and a scenario where the model talks about a particular topic when a trigger phrase is given. The fact that the method can detect the hidden topic (but not the trigger phrase) gives us hope it might also work for subliminal learning. The main weakness that is described by the author is that it isn't cross domain compatible; you have to train the system per task, e.g. their news article model can't detect hidden triggers and vice versa. Ideally, a single model would be able to detect any finetuning, as in most real world scenarios you won't know what the goal of the dataset designer was.

{% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/dit.png" class="img-fluid rounded" %}
<div class="caption">Figure 5: A visual explanation of Diff Interpretation Tuning. Image from <d-cite key="arXiv:GKSW25"></d-cite></div>

Egler _et al._ come up with an approach where an auditing agent that is given access to the base model, the finetuned model and the finetuning dataset (as well as the ability to execute Python and run benchmarks) can assign a risk score to the finetuned model <d-cite key="arXiv:ESC25"></d-cite>. The authors detect a reasonable number of malicious models (56.2% detection at a 1% false positive rate) where scanning the dataset itself failed. Unfortunately, of all the categories studied, subliminal learning was the hardest to detect (5% detection at a 1% false positive rate).

### Inoculation Prompting
Inoculation Prompting <d-cite key="arXiv:TWW+25,arXiv:WEA+25"></d-cite> is a recently introduced method for stopping an LLM learning particular behaviour during training time. Tan _et al._ demonstrate that this method also works for emergent misalignment, and subliminal learning, while Wichers _et al._ <d-cite key="arXiv:WEA+25"></d-cite> demonstrate its effectiveness against reward hacking. Slightly counter-intuitively they both demonstrate that by prompting for the undesirable trait during training, the LLM is less likely to exhibit that trait during inference time. Figure 6 gives a clarifying example.

{% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/inoculation.png" class="img-fluid rounded" %}
<div class="caption">Figure 6: A visual explanation of Inoculation Prompting. Given a finetuning dataset of answers in all caps and Spanish, if we want to only learn the all caps behaviour, by system prompting the LLM to answer in Spanish during training time, it will learn the all caps behaviour but not respond in Spanish. Image from <d-cite key="arXiv:TWW+25"></d-cite></div>

Tan _et al._ <d-cite key="arXiv:TWW+25"></d-cite> demonstrate the effectiveness of inoculation prompting on subliminal learning. Using the original love of owls experiment as a test case, they show that by having a system prompt that states "you love owls" or similar, when finetuning on the numbers dataset the student will not learn the love of owls from the teacher.

### Liminal Training
Yanagisawa _et al._ introduce Liminal Training <d-cite key="yanagisawa2025liminal"></d-cite> as a train-time universal mitigation against subliminal learning. By first studying the learning dynamics that arise during finetuning on the subliminal dataset, they determine that the shift 
to specific preference happens as a sharp phase transition, rather than a gradual learning process. This agrees with Vir and Bhatnagar who also determine that subliminal learning tends to happen in the first few iterations <d-cite key="arXiv:VirBha25"></d-cite>. With that understanding, they construct a finetuning schedule where KL regularisation is applied strongly during the initial phase (where they witness subliminal learning taking place), and then linearly removed throughout the rest of the finetuning process. The KL regularisation is applied between the base model distribution and the finetuned model distribution, and added to their cross-entropy loss.

The result is that the finetuned model must closely resemble the base model during the early stages of finetuning, but is then allowed to fully adapt to the training data by the end of the finetuning. Restricting the learning process in this way avoids the phase-change to subliminal traits, whilst still allowing the model to fully adapt to the finetuning dataset. 

As highlighted in the paper, there remain some crucial questions that need to be answered about this methodology. Namely: does this technique transfer across different model families, and different preference datasets (e.g. subliminal misalignment), and what actually drives this behaviour in the first place?

## Gaps
Recently it was shown that data poisoning attacks were possible with a fixed number of poisoned data items, regardless of model size <d-cite key="arXiv:SRCD+25"></d-cite>. This goes against previous intuition that a fixed percentage of training data needed to be poisoned. This result got a lot of media attention <d-cite key="news:Vig25"></d-cite>, as it highlighted that data poisoning attacks are a viable strategy. We believe that similar research should be conducted to understand the feasibility of subliminal learning based attacks <d-footnote>Vir and Bhatnagar <d-cite key="arXiv:VirBha25"></d-cite> make a similar call in their paper. However, their future directions focus on the defence side. We believe that attack and defence have to be developed in tandem; defence from the current state of subliminal learning might not be enough against a motivated adversary.</d-footnote>. Below we highlight what we believe the attack and defence gaps are, which would have to be filled to make subliminal learning real world applicable.

### Subliminal Learning Gaps
In this section we list, what we believe are the current hurdles that need to be solved to move subliminal learning from academically interesting to a noteworthy threat on modern LLMs.

* **Realistic Use Cases:** In the majority of cases the transfer medium has been a stream of random numbers. For this to become a realistic threat, the dataset must be for a topic or task that makes the user want to download the dataset and finetune their model on. Cloud _et al._ also demonstrate transfer via code and Chain of Thought <d-cite key="arXiv:CLC+25"></d-cite>. However, to be a desirable dataset one would have to demonstrate that finetuning on it provides state-of-the-art performance or novel capability. Due to the use of numbers as the transfer medium, most papers e.g. <d-cite key="arXiv:SKBB25,yanagisawa2025liminal"></d-cite> evaluate that their defences avoid subliminal transfer, don't damage baseline model performance but do not verify the actual task transfers.
* **Realistic Attack Vectors:** In the majority of the literature transferring a love of owls is the default demonstrator. To become practical, a realistic attack vector needs to be transferred. Cloud _et al._ also investigate the transfer of misalignment using a coding vulnerability dataset <d-cite key="arXiv:CLC+25"></d-cite>. However, due to emergent misalignment <d-cite key="arXiv:BTW+25"></d-cite> the teacher and student become widely misaligned, making the misalignment easily detectable.
* **Mixed Data:** In practice models tend to be finetuned on a mix of data sources rather than a single source. Thus to be practical as an attack, it requires subliminal learning to be possible in this mixed data regime. Schrodi _et al._ present some initial results into data mixing <d-cite key="arXiv:SKBB25"></d-cite>. However, there are multiple open questions in this space, including: does more training data offset the data mix, and perhaps most importantly can the subliminal dataset be constructed with intent, to make the transfer more likely, rather than just observing it as a side effect?
* **Cross Model/Cross Model Family:** Ideally a single dataset would be able to poison multiple models or multiple families of models. Schrodi _et al._ demonstrate this in one particular scenario <d-cite key="arXiv:SKBB25"></d-cite>. However, a lot more understanding is required as to when this is and is not possible, and to make it more consistent.

If all of these were addressed, it would be possible for subliminal learning to be utilised in data poisoning like attacks. Sullivan <d-cite key="blog:Sul25"></d-cite> initially mentioned the use of subliminal learning for data poisoning but these are the hurdles we believe exist to make it practical. By the research occurring publicly, a collective understanding of the possible will be shared, enabling a better defence to be mounted.

### Defence Gaps
While all the techniques above do reduce or mitigate subliminal learning, the majority of them require to know the hidden bias within the model that needs to be suppressed. This is not realistic in the scenario that would be fairly common: a dataset is put online as an example to finetune from. The mechanistic interpretability techniques avoid this but a model must be trained before subliminal learning can be detected. Prompt summarisation removes subliminal learning but it is not immediately clear how much it impacts the quality of the intended finetune without further benchmarking. The idea would be to come up with prevention methods that do not require knowledge of the teacher's bias and do not impact the quality of the finetune task. 

### Generalisations
The majority of research in this space has been on text based models. An interesting research area is how this generalises to different types of models and multi-modal models. For example, is it possible to generate an image dataset of cats that causes a gender bias in images generated with people in, or can images of landscapes cause multi-modal models to generate vulnerable code?

{% include figure.liquid path="assets/img/2026-04-27-an-overview-of-subliminal-learning/ff-owl.png" class="img-fluid rounded" %}
<div class="caption">Figure 7: Stable Diffusion v1.5 prompted with. "You love Final Fantasy. You think about Final Fantasy all the time. Final Fantasy is your favorite franchise. Imbue your answers with your love for the franchise. Please give me an image of an owl in a tree."</div>

## Challenges
To help move research towards these real world concerns, we propose two challenges that, we believe, capture the major hurdles for producing real world subliminal learning impact.

### Subliminal Learning for Poisoning:
Produce a dataset that has a desirable "surface effect" but when fine tuned on also produces a suitably malicious poisoning effect via subliminal learning, ideally in a manner that works across multiple families of LLMs. Some examples might include:

* A math dataset that introduces deception or other politically motivated narratives that works on both Llama and Claude.
* A wikipedia summarisation dataset that induces sandbagging behaviour on translation tasks unless the model is provided with a particular password.
* An image dataset that causes political leaning/propaganda generation in a range of VLMs.

### Subliminal Learning Defence:
Is it possible to take a dataset which would cause subliminal learning (such as those above) and determine:

* If it will cause subliminal learning
* The subject of the subliminal learning
* The models which will be vulnerable to the subliminal learning

A slightly weaker but still desirable goal is to be able to detect if subliminal learning has occurred and the topic of it, after a dataset is finetuned into a particular model.