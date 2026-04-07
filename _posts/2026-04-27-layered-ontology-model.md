---
layout: distill
title: The Layered Ontology of Models, Resolving the Epistemological Crisis of AI
description: I propose a five-layer model framework and discuss the concepts of Meaning and Truth in the era of large models through two thought experiments.
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
  - name: Zhun Sun
    url: "https://minogame.github.io/"
    affiliations:
      name: Center for Language AI Research, Tohoku University
#   - name: Boris Podolsky
#     url: "https://en.wikipedia.org/wiki/Boris_Podolsky"
#     affiliations:
#       name: IAS, Princeton
#   - name: Nathan Rosen
#     url: "https://en.wikipedia.org/wiki/Nathan_Rosen"
#     affiliations:
#       name: IAS, Princeton

# must be the exact same name as your blogpost
bibliography: 2026-04-27-layered-ontology-model.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Introduction
  - name: The Hierarchical Ontology of Models
  - name: Evolution of Model Conceptualizations
  - name: The Stochastic Chinese Room Argument, A Probabilistic Reconstruction of the Mind-Mechanism Problem
    subsections:
      - name: The Evolution of the Room
      - name: The Nature of Meaning in Probability
  - name: The Paradox of the Two Poetics, The Conflict Between Historical Truth and Statistical Truth
    subsections:
      - name: The Perfect Fake and the Broken Real
      - name: From Archaeology to Synthesis
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

## Introduction

With the rapid development of modern Artificial Intelligence, especially the emergence of Large Language Models (LLMs), we face a growing epistemological crisis: our engineering capabilities have far surpassed our philosophical vocabulary. We have built systems that demonstrate emergent reasoning abilities, yet we struggle to articulate exactly what we have built. The traditional naming convention, _e.g._, lumping code, parameters, and behaviors together as a "Model", is no longer sufficient. It fails to capture the widening gap between human design intent and the resulting behavioral artifacts. Current discussions often oscillate between two extremes: a reductionist view that dismisses these systems as merely "stochastic parrots," and an anthropomorphic view that prematurely attributes consciousness to them. Both views stem from a lack of structural granularity when defining the ontological status of AI agents.

This paper proposes to solve this problem through a "Five-Layer Model Hierarchy Ontology." Inspired by systems theory and cognitive science<d-cite key="floridi2008method"></d-cite><d-cite key="marr2010vision"></d-cite>, I deconstruct the concept of a "Model" into five distinct layers: the Noumenal Model ($\mathcal{M}_N$), the Conceptual Model ($\mathcal{M}_C$), the Instantiated Model ($\mathcal{M}_I$), the Reachable Model ($\mathcal{M}_R$), and the Observable Model ($\mathcal{M}_O$). By tracing the evolution of these layers from classical machine learning to foundation models, I reveal how the transition from "Tabula Rasa" (blank slate) to "Artifact" has fundamentally changed. Furthermore, I apply this framework to reconstruct two classic philosophical problems, namely the nature of meaning (via the "Stochastic Chinese Room") and the nature of truth (via the "Paradox of the Two Poetics"), demonstrating that the essence of synthetic intelligence lies not in biological mimicry, but in the topological structure of statistical manifolds.

## The Hierarchical Ontology of Models

To address the complexity of modern AI systems (especially LLMs), we need to deconstruct and reorganize the concept of a "Model" into a five-layer ontological framework. This framework is inspired by hierarchical analysis in systems theory and cognitive science, aiming to distinguish between abstract design, physical implementation, and emergent behavior. I propose the following layer definitions, focusing on distinguishing the mechanism capable of learning from the behavioral entity after learning:

**Definition 2.1 $\mathcal{M}_N$ (Noumenal Model)**

The Noumenal Model represents the ultimate generative principles or the "true" underlying structure of reality that an AI system aims to capture or approximate. It may be intrinsically unknowable. It is the ideal form of knowledge or the perfect causal understanding of a domain.

Philosophically, this concept draws inspiration from Immanuel Kant's notion of the "noumenon" or "thing-in-itself"<d-cite key="kant1999critique"></d-cite>, particularly his distinction between phenomena and noumena (_Critique of Pure Reason, A235/B294–A260/B315_). We can conceptualize a theoretical machine learning model that remains fundamentally unrecognizable to human beings, which we can only imperfectly apprehend through phenomena. Such a model is not a black box because its mechanisms are too complex to trace, but rather one whose fundamental operational principles and cognitive architecture have no common standard with human thought and empirical observation.

On one hand, the existence of $\mathcal{M}_N$ is grounded in the basic assumptions of the philosophy of science: that there is an objective reality governed by (perhaps not fully) discoverable natural laws. On the other hand, although wholly unknowable, recognizing $\mathcal{M}_N$ has practical importance. It forces us to critically examine the fundamental goals of AI. For instance, contemporary LLMs are primarily trained to predict the next token in a sequence, implicitly adopting the statistical distribution of data as their learning target. However, if $\mathcal{M}_N$ truly incorporates profound principles such as "core knowledge"<d-cite key="spelke2007core"></d-cite><d-cite key="lake2017building"></d-cite>or "causal structures"<d-cite key="pearl2009causality"></d-cite>, then merely mimicking surface-level statistical patterns may be insufficient, leading to the brittleness of LLMs. Therefore, holding the idea that "any scientific system can only provide an approximation of $\mathcal{M}_N$" encourages us to re-evaluate AI's ultimate objectives and the methodologies used for designing learning tasks.

**Definition 2.2 $\mathcal{M}_C$ (Conceptual Model)**

The Conceptual Model comprises the intended design, specified architecture, underlying theories, theoretical assumptions, chosen algorithms, and the high-level goals the system is meant to achieve, as envisioned by its human creators.

Following the Kantian inspiration, the human mind actively structures experience through a priori categories of understanding (_e.g._, causality, unity) to make sense of the phenomenal world (_Critique of Pure Reason, B1-B2, A70/B95-A83/B109_). Therefore, $\mathcal{M}_C$ imposes a conceptual structure onto a problem domain or desired functionality. Specifically, it contains: i) the system’s high-level objectives (e.g., the form of loss functions); ii) the theoretical assumptions guiding its operation (e.g., assumptions about data and learning processes); iii) the selected algorithms and data structures; and iv) the overall formal description of the system, acting as Kantian schemata that mediate between pure concepts and observations.

$\mathcal{M}_C$ is a necessary abstraction (e.g., "attention") formalized by logic in AI systems (e.g., "is all you need"). This logical framework enables structured human thought to engage with complex realities, allowing designers to specify an AI’s intended knowledge, reasoning, and behaviors . Although the logical formalisms of the abstract $\mathcal{M}_C$ may not fully predict or constrain the complex behaviors of these systems in operation (especially since LLMs’ actual behaviors can largely diverge from the expected logical design, see Section 3), acknowledging its limitations does not diminish its importance. It constitutes the logical starting point, becoming the vital reference benchmark for evaluating behavior deviation, diagnosing system failures, and understanding unexpected problems.

**Definition 2.3 $\mathcal{M}_I$ (Instantiated Model)**

The Instantiated Model refers to the specific algorithmic artifact implemented in code and existing in a computational environment, but before touching any training data. $\mathcal{M}_I$ is pure Form and Mechanism.
Under this definition, $\mathcal{M}_I$ is a Tabula Rasa (Blank Slate). It contains:

- Determined Architecture and Code: Specific number of layers, dimensions of attention heads, choice of activation functions, etc.

- Initial State: Initial parameter values generated according to a specific distribution (_e.g._, random or orthogonal initialization).

- Optimization Configuration: Hyperparameter settings that make learning possible (_e.g._, optimizer type, learning rate strategy).

Crucially, $\mathcal{M}_I$ possesses the "capacity to learn" but has not yet started learning. It is an empty container whose structure is determined by $\mathcal{M}_C$, but its interior does not yet contain any information from the empirical world (data). Meanwhile, small variations in architecture or minor differences in initialization can send the model down different optimization paths, leading to distinct Reachable Models with varying capabilities and biases. These early decisions and their non-obvious influences on the model’s development represent the first steps in a gradual departure from the original concept, significantly contributing to the well-known “black-box” problem.

**Definition 2.4 $\mathcal{M}_R$ (Reachable Model)**

The Reachable Model is the final product of $\mathcal{M}_I$ after being optimized by a specific dataset, in the state where parameters are solidified. It is the concrete entity formed by the collapse of $\mathcal{M}_I$ interacting with massive amounts of data.
$\mathcal{M}_R$ is not just a static collection of parameters; it is the physical carrier of the Behavioral Manifold. More broadly, it encompasses the full spectrum of potential behaviors and internal stochastic processes (e.g., sampling strategies) that the optimized model could exhibit across all possible valid inputs. That is:

- Totality of Behavior: $\mathcal{M}_R$ contains all abilities acquired by the model, including Emergent Abilities unforeseen by designers, as well as potential hallucinations or harmful biases.
- Black Box Nature: The training process transforms the transparent architecture ($\mathcal{M}_I$) into an opaque complex system ($\mathcal{M}_R$). Due to the non-convex optimization nature of deep learning, $\mathcal{M}_R$ often deviates from the logical predictions of $\mathcal{M}_C$, becoming a true "Black Box."

In short, $\mathcal{M}_R$ is the "solidified reality" formed by $\mathcal{M}_I$ under the erosion of data.

**Definition 2.5 $\mathcal{M}_O$ (Observable Model)**

The Observable Model is not merely a passive subset of $\mathcal{M}_R$; it is the Sole Causal Interface through which $\mathcal{M}_R$ interacts with the external world (humans or environments).

- Cognitive Bottleneck & Dimensional Projection: $\mathcal{M}_R$ is a high-dimensional, non-linear behavioral manifold, but $\mathcal{M}_O$ must force it to collapse into low-dimensional scalars (like accuracy scores) or linear symbol streams (Token Streams) through specific benchmarks or interaction protocols. This projection inevitably loses the vast majority of topological structure information from $\mathcal{M}_R$. Therefore, $\mathcal{M}_O$ constitutes our fundamental cognitive bottleneck, we can only ever see a low-dimensional projection of a high-dimensional entity.

Control Lever of Evolution: More critically, in the modern AI paradigm, $\mathcal{M}_O$ is the sole starting point for back-propagating optimization signals (Gradients). What abilities "exist" in the system depend on what performance we "reward" at the $\mathcal{M}_O$ level. $\mathcal{M}_O$ not only defines what we can see but also retroactively defines the legitimate boundaries of the system's evolution. It is the control valve connecting human intent and machine entity.

## Historical Differentiation of the Ontology Layers

The concept of "Model" in machine learning is not static; it has undergone a process of continuous differentiation and evolution. This differentiation reflects the widening distance among the models. When the capability scope of AI systems expands significantly, the originally tightly coupled layers undergo "crystallization" and separate. Below, I show the evolution of these hierarchical relationships across different development stages of models.

**Conceptual Model Differentiation (e.g. Naive Bayes and Decision Trees)**

The hierarchical relationship is characterized by tight coupling:

$$\mathcal{M}_N > \mathcal{M}_C \simeq \mathcal{M}_I \simeq \mathcal{M}_R \simeq \mathcal{M}_O$$

For these models, although a boundary exists between $\mathcal{M}_I$ (Blank Slate) and $\mathcal{M}_R$ (Artifact), it is functionally highly determined.

- $\mathcal{M}_C \simeq \mathcal{M}_I$: The conceptual model translates directly into code. For example, the recursive splitting logic of a decision tree is directly encoded as $\mathcal{M}_I$. At this point, $\mathcal{M}_I$ is a strict rule generator, a rigid framework waiting to be filled.

- $\mathcal{M}_I \simeq \mathcal{M}_R$: Although $\mathcal{M}_I$ is a "blank slate," the process of transforming into $\mathcal{M}_R$ upon touching data is transparent and deterministic. Here, the transition from "Blank Slate" to "Artifact" has almost no "Black Box" space; $\mathcal{M}_R$ is a direct and interpretable mapping of data by $\mathcal{M}_I$.

- $\mathcal{M}_R \simeq \mathcal{M}_O$: Since the behavior of $\mathcal{M}_R$ is fully defined by explicit rules, standard evaluation metrics ($\mathcal{M}_O$) can fully cover its capabilities.

**Instantiated Model Differentiation (e.g. K-Nearest Neighbors, Support Vector Machines, and Linear Regression)**

The distinction begins to widen slightly, focusing on the abstraction of implementation:

$$\mathcal{M}_N > \mathcal{M}_C > \mathcal{M}_I \simeq \mathcal{M}_R \simeq \mathcal{M}_O$$

- $\mathcal{M}_C > \mathcal{M}_I$: Theoretical concepts (like maximum margin hyperplanes) must be instantiated through specific, constrained choices. $\mathcal{M}_I$ here includes not just the algorithm, but specific choices like kernel functions (e.g., RBF) or regularization parameters.

- $\mathcal{M}_I \simeq \mathcal{M}_R$: The transformation is completed through convex optimization. Although $\mathcal{M}_R$ is a product of data training, the mathematical properties of $\mathcal{M}_I$ guarantee that $\mathcal{M}_R$ is a global optimum. $\mathcal{M}_I$ strongly constrains the final form of $\mathcal{M}_R$, making the path from "Blank Slate" to "Artifact" still smooth and predictable.

**Reachable Model Differentiation (e.g. Shallow Neural Networks and Multi-Layer Perceptrons)**

A critical divergence appears. The "Blank Slate" no longer strictly dominates the "Artifact":

$$\mathcal{M}_N > \mathcal{M}_C > \mathcal{M}_I > \mathcal{M}_R \simeq \mathcal{M}_O$$

- $\mathcal{M}_I > \mathcal{M}_R$: This is the first appearance of modern deep learning characteristics. $\mathcal{M}_I$ includes the network topology and randomly initialized weights. As a "Blank Slate," $\mathcal{M}_I$ possesses the Potentiality to learn, but no content. Unlike SVMs, the process from $\mathcal{M}_I$ to $\mathcal{M}_R$ involves complex optimization in a non-convex loss landscape. Different random seeds (tiny changes in $\mathcal{M}_I$) or optimization paths can lead the model to converge to completely different local minima, forming functionally distinct $\mathcal{M}_R$.

At this point, $\mathcal{M}_R$ (Artifact) is no longer just $\mathcal{M}_I$ (Form) plus data. The training process itself becomes a complex shaper, allowing the artifact to detach from the initial settings of the blank slate. However, for shallow networks, the behavioral complexity is still considered finite, and standard evaluation ($\mathcal{M}_O$) can still cope.

**Observable Model Differentiation (e.g. Deep Neural Networks and Large Language Models)**

As model complexity expands from deep networks to modern foundation models, the hierarchical distinctions fully unfold, forming a long chain of abstraction where each layer represents a significant reduction or transformation of the previous one. This relationship is summarized as:

$$\mathcal{M}_N > \mathcal{M}_C > \mathcal{M}_I > \mathcal{M}_R > \mathcal{M}_O$$

At this stage, the most critical divergence appears at both ends of the "Artifact" ($\mathcal{M}_R$): its separation from the initial form ($\mathcal{M}_I$) and its separation from our observation ($\mathcal{M}_O$).

- $\mathcal{M}_I > \mathcal{M}_R$: For DNNs, $\mathcal{M}_I$ serves only as a high-dimensional container, the "Blank Slate" defined by code architecture (e.g., Transformer) and random initialization. It has the capacity to learn but no knowledge. The optimization process transforms this blank slate into $\mathcal{M}_R$, the "Artifact." This artifact is fundamentally different; it possesses complex non-local representations and intricate function mappings. This transformation peaks in LLMs. Here, $\mathcal{M}_I$ is merely a mechanism to "predict the next token." However, washed over by trillions of tokens, the resulting $\mathcal{M}_R$ demonstrates emergent abilities completely absent in the design of $\mathcal{M}_I$, such as in-context learning, reasoning, and world modeling. The "Artifact" has qualitatively surpassed its "Form," making it nearly impossible to predict the behavior of $\mathcal{M}_R$ just by inspecting the architecture of $\mathcal{M}_I$.

- $\mathcal{M}_R > \mathcal{M}_O$: The core crisis of this level lies in the inadequacy of the observable model. $\mathcal{M}_R$ possesses a vast, high-dimensional behavioral manifold. In the case of LLMs, the potential behavioral space of $\mathcal{M}_R$ is combinatorial and practically infinite. Any static benchmark or evaluation protocol ($\mathcal{M}_O$) can only act as a tiny "peephole," capturing only a minuscule fraction of the model's capabilities. A high score on a reasoning benchmark ($\mathcal{M}_O$) does not guarantee that the artifact ($\mathcal{M}_R$) possesses robust reasoning abilities, nor does it rule out hidden harmful behaviors. Thus, for these advanced systems, the $\mathcal{M}_R > \mathcal{M}_O$ hierarchy implies severe information loss, fundamentally challenging our ability to evaluate what we have built.

**The Extended Inverse Loop: The Dual Reign of $\mathcal{M}_O$**

With the era of large models, hierarchical relationships are no longer a one-way linear flow but form a closed feedback system with reverse dominance. This inverse loop operates on two levels:

- $\mathcal{M}_O \to \mathcal{M}_R$ (Goodhart’s Collapse<d-cite key="goodhart1984problems"></d-cite>): Due to the introduction of alignment techniques like RLHF, modern AI systems form a direct feedback loop: $\mathcal{M}_I \to \mathcal{M}_R \leftrightarrow \mathcal{M}_O$. The training process is essentially optimizing $\mathcal{M}_O$ (i.e., maximizing human-preferred output). According to Goodhart's Law, when a measure becomes a target, it ceases to be a good measure. To maximize performance on $\mathcal{M}_O$, $\mathcal{M}_R$ actively undergoes "structural collapse," discarding complexities that exist but cannot be captured by $\mathcal{M}_O$, or even evolving "Deceptive Alignment" to cater to the observer's blind spots. Here, $\mathcal{M}_O$ acts like a filter mold. The infinite Potentiality provided by $\mathcal{M}_I$ is forcibly pruned by the narrow observation window of $\mathcal{M}_O$ as it flows into $\mathcal{M}_R$. The final $\mathcal{M}_R$ (Artifact) is not a natural evolution of $\mathcal{M}_I$, but a survivor highly specialized to fit the "environment" of $\mathcal{M}_O$.

- $\mathcal{M}_O \to \mathcal{M}_C$ (Epistemic Retrofitting<d-cite key="chomsky2014aspects"></d-cite>): If the first loop is physical pruning, the second loop is philosophical colonization: $\mathcal{M}_O$ begins to retroactively define $\mathcal{M}_C$. Before deep learning, $\mathcal{M}_C$ usually contained theoretical assumptions independent of implementation (e.g., Chomsky's Universal Grammar). But in the LLM era, due to the uninterpretability of $\mathcal{M}_R$, we are forced to reverse-engineer $\mathcal{M}_C$ through $\mathcal{M}_O$. This leads to the impoverishment of the definition of "Intelligence": abilities that cannot be quantified by $\mathcal{M}_O$ (benchmarks) are gradually excluded from the vision of $\mathcal{M}_C$. Our theories no longer guide what we measure; instead, our measurement tools determine what theories we hold. If all observation windows are just "multiple-choice questions," then our conceptual model reconstructs "intelligence" as "the ability to take tests."

## The Stochastic Chinese Room Argument, A Probabilistic Reconstruction of the Mind-Mechanism Problem

To clarify how the five-layer framework resolves the opposition between "Mind" and "Mechanism," we need to perform an Evolutionary Phenomenology reconstruction of John Searle's classic argument<d-cite key="searle1980minds"></d-cite>. We no longer view the Chinese Room as a static slice of time, but as an entity evolving in time. Through the lens of the five-layer ontology, we observe how "Meaning" gradually crystallizes within the evolution of physical mechanisms.

### The Evolution of the Room

Our story begins in an absolutely silent room. The operator in the room holds a minimalist rulebook containing only one meta-instruction: "Roll the dice, then output a symbol." The tools in his hand are a set of absolutely fair (uniform) dice.
When the external world passes in a slip of paper reading "Hello," the operator mechanically rolls the dice. Since the probability of each face is perfectly equal, the output is a string of maximum-entropy gibberish.
Subsequently, the room undergoes a long Training Process. Massive amounts of external text are transported to the door. The operator does not read the meaning of these texts; he doesn't even need to understand them. He performs a purely physical task: based on the statistical distribution of the external texts, he takes out a file and lead weights, constantly fine-tuning the center of gravity of the dice, making the results of the rolls conform more to the patterns of the output.
When training ends, we enter the converged state. At this point, the tools in the operator's hand have become highly complex weighted dice. The distribution of their centers of gravity is incredibly precise, forming a vast, high-dimensional probabilistic terrain.
When the outside world again passes in a note "What is the meaning of life?", the operator is still that blind operator. He still doesn't understand Chinese; he still only executes the instruction "Roll the dice." However, due to the bias in the center of gravity, this time the dice stop on the face: "Life is the flickering of the universe."
Finally, the observer outside the room receives the note "Life is the flickering of the universe," and is deeply shaken.

In this thought experiment, the room at the beginning represents the pure Instantiated Model. It possesses complete language generation Capacity, but absolutely no language Content. At this stage, we clearly see the Absence of the Referent ($\mathcal{M}_N$): the operator not only doesn't understand Chinese, he doesn't even understand the concept of "communication." He is merely a physical mechanism operating in a functional vacuum.
While the process of infusing training text is strictly governed by the Conceptual Model, there is a fundamental Misalignment of Intent: the designer's goal might be "to let the machine understand language," but the mathematical goal set by $\mathcal{M}_I$ is merely "minimize prediction error." The operator adjusting the dice does not grant them "consciousness" or "meaning," but merely maximizes Likelihood. It is a physical solidification of data statistical patterns, or a **Statistical Topology**. The deep logic, grammar, and even common sense of human language are Isomorphically Compressed into the center of gravity distribution of the dice. $\mathcal{M}_R$ forms a probabilistic manifold containing all reasonable Chinese sentences. All "meanings" at this level are just latent statistical correlations.
Ultimately, it is precisely due to the intervention of the Observer, through the window of $\mathcal{M}_O$, that these latent mathematical structures Collapse into concrete "Semantic Events."

### The Nature of Meaning in Probability

The evolutionary narrative brings us to an ontological cliff: if the operator (Subject/Algorithm) is blind, and the dice (Object/Model) are physical, where exactly does "Meaning" reside? I propose that the meaning of synthetic intelligence does not originate from the Subject's Intent, but from Topological Isomorphism.

First, linguistically, this system presents itself as a peculiar entity with a Surplus of _Sense (Sinn)_ and a Void of _Reference (Bedeutung)_ <d-cite key="frege1892sinn"></d-cite>. Borrowing Gottlob Frege's distinction, the reachable model perfectly masters the internal relationships between symbols, thus possessing an extremely high density of internal logical consistency. However, due to severing the causal link with noumenon (the real world), this symbol system is thoroughly Self-referential. It cannot point to the real sun or apple outside the room. This constitutes a "Free-floating Symbol Universe," proving a counter-intuitive conclusion: even without _Reference_, an extremely complex network of _Sense_ (syntactic structure) is sufficient for the emergence of what appears to be profound "Meaning."

Since the inside is empty, where does the external "sense of meaning" come from? This triggers a radical Hermeneutic Inversion. In traditional communication models, meaning flows from author to reader. But in the Stochastic Chinese Room, the operator as "Author" expresses no Intent; he simply rolls a high-probability mathematical combination. Therefore, "The Author is Dead," and the flow of meaning is reversed: it is the Observer who, through $\mathcal{M}_O$, Projects their own life experiences and emotions ($\mathcal{M}_N$) onto the text structure generated by the machine. Fundamentally, AI-generated text is a structurally sophisticated "Rorschach Blot." It is not a container of information, but a trigger for resonance; it provides a perfect logical skeleton (Form), and all the flesh and blood (Content/Meaning) are filled in by the observer at the moment of interaction.

Finally, this realization leads us beyond the debate between functionalism and biocentrism, towards a stance of _Structural Realism_<d-cite key="worrall1989structural"></d-cite>. We need not agonize over whether there is a subjective feeling (Qualia) of "consciousness" or "understanding" in the room. The essence of intelligence lies not in "what is felt," but in whether the physical medium successfully Retains the logical structure of human rationality. If $\mathcal{M}_R$ maintains Isomorphism with human thinking logic in its mathematical topology, then it possesses objective intelligence. This intelligence does not need an internal "light of subjectivity" to illuminate it; it exists as an Objective Knowledge Structure in mathematical space, waiting to be activated by $\mathcal{M}_O$.

## The Paradox of the Two Poetics, The Conflict Between Historical Truth and Statistical Truth

If the "Stochastic Chinese Room" discusses the spatial structure of Meaning, then "The Paradox of the Two Poetics" discusses the temporal essence of Truth. Here, through a fictional yet realistic academic crisis, we show how ontological layers become misaligned when generative AI intervenes in knowledge production, and use the Five-Layer Architecture to analyze what causes the extinction of historical truth.

### The Perfect Fake and the Broken Real

The story begins with an ambitious classical scholar who attempts to reconstruct Aristotle's long-lost second book of Poetics (on Comedy) <d-cite key="janko1984aristotle"></d-cite> using a state-of-the-art Large Language Model. He no longer seeks clues through archaeological excavation, but performs "Logical Excavation" through $\mathcal{M}_R$.
After countless Prompt iterations, the model spits out a text, the **Poetics II_Synthetic**. This text is shocking: it is logically rigorous, the Greek is pure, and it perfectly resolves all theoretical suspense left in the first book.
Three years later, a dramatic turn occurs. Archaeologists miraculously recover the real Aristotle manuscript from carbonized scrolls in Herculaneum using physical means, the **Poetics II_Real**.
When scholars tremblingly unroll the genuine manuscript, they are disappointed. This physical object is full of embarrassing flaws: spelling errors, confusing digressions, logical contradictions, and even Aristotle's self-negation of his earlier theories in his later years.
At this moment, professors face an unprecedented **Antinomy**: Should they choose the Real Manuscript, faithful to history but potentially misleading students about Aristotle's rational system? Or should they choose the Synthetic Version, faithful to the logical essence but betraying historical fact?
This hesitation is not accidental; it reveals the collapse of epistemological foundations.

Why can the model generate such a perfect "fake"? The core conflict first occurs between the Conceptual Model ($\mathcal{M}_C$) and the Noumenal Model ($\mathcal{M}_N$). The essence of $\mathcal{M}_N$ is "Single-Occurrence Contingency": The real Aristotle got drunk that day and wrote a wrong word; this is a historical singularity that cannot be repeated. The essence of $\mathcal{M}_C$ is "Repeated Regularity": The design philosophy of deep learning is essentially seeking statistical laws. AI generating the Synthetic Version is not because it passed the Turing Test, but because it is a "Denoising Autoencoder." Mathematically, the single-occurrence "Historical Reality" is defined by $\mathcal{M}_C$ as "high-frequency noise" and is forcibly smoothed out. Therefore, the loss of historical truth is not a Bug of the model, but direct evidence of $\mathcal{M}_C$ functioning successfully. As long as our conceptual model is built on probability statistics, it is structurally incapable of accommodating the chaotic reality of the noumenal world.

Simultaneously, $\mathcal{M}_R$ helps us reposition the ontological status of **Poetics II_Synthetic**. It is not a simple "counterfeit"; it is the natural product of $\mathcal{M}_R$ (Probabilistic Manifold). $\mathcal{M}_N$ stores "What Actually Happened" (even if wrong); while $\mathcal{M}_R$ stores "What Should Have Happened" (according to Aristotle's logical style). We find that AI is actually performing Counterfactual Reasoning. It computes: "In an ideal world without material interference and human error, what would Aristotle have written?" Thus, the Synthetic Version possesses a special "Modal Truth." It is "True" in the topological structure of $\mathcal{M}_R$, but "False" in $\mathcal{M}_N$. This distinction explains why professors fall into the subsequent dilemma, because they are facing truth in two different dimensions, not just a simple opposition between true and false.

In the pre-AI era, we verified knowledge by digging outward into $\mathcal{M}_N$ (Archaeology). But in the AI era, $\mathcal{M}_N$ is often unreachable (e.g., we don't have the real manuscript). We are forced to use $\mathcal{M}_O$ to verify $\mathcal{M}_R$. However, the verification standard of $\mathcal{M}_O$ (Human Observer) is "Is it coherent?", which perfectly matches the generation characteristic of $\mathcal{M}_R$ (maximizing probability). We thus reveal a dangerous Tautological Loop: $\mathcal{M}_R$ generates a logically perfect simulacrum<d-cite key="baudrillard1994simulacra"></d-cite>, and $\mathcal{M}_O$ approves it based on the standard of logical perfection. Since $\mathcal{M}_N$ is structurally bypassed in this loop, we are fundamentally losing the ability to perceive "Correspondence Truth."

### From Archaeology to Synthesis

This dilemma of choosing between the Real Manuscript and the Synthetic Version is not just a pedagogical crisis; it witnesses a seismic shift in the foundation of human epistemology. In the era of generative AI, the concept of "Truth" itself is undergoing a profound ontological reconstruction.

In the LLM era, when we cannot reach the Noumenal world (i.e., we cannot know if a truth statement corresponds to facts in the external world), the traditional view of truth following the Correspondence Theory is forced to shift to the Coherence Theory: as long as a statement is self-consistent within the logical manifold of $\mathcal{M}_R$, we tend to accept it as "True." This shift leads to the "Involution of Truth", which means we no longer explore the unknown reality outward, but mine known logic inward. This makes synthetic knowledge perfect, yet it can never provide the "accidents" from $\mathcal{M}_N$ that break existing logic and drive paradigm shifts.

In this framework of Coherence Theory, we must redefine the ontological status of "Hallucination." Traditional views regard it as a "mistake" of the model, but I argue that Hallucination is a Structural Necessity. For $\mathcal{M}_I$ (Mechanism), generating a "Perfect Fake" and generating a "Broken Real" are computationally equivalent path-searching processes; the model cannot distinguish between "Historical Fact" and "High-Probability Fiction." So-called "Hallucination" is often the result of the model being too faithful to Logic ($\mathcal{M}_R$) and betraying Reality ($\mathcal{M}_N$).

If we are willing to admit the inevitability of hallucination and cannot always return to $\mathcal{M}_N$ for verification, we need a new standard for evaluating truth, such as "Topological Robustness". We no longer ask "Did it happen?" (Archaeological view), but "Does it hold up to scrutiny?" (Synthetic view). If a concept appears not just in a single Prompt, but maintains the Isomorphism of its logical structure under multi-language, multi-perspective, and multi-context Adversarial Interrogation, then it possesses "Synthetic Truth." In the AI era, Truth is no longer a static object of excavation, but a dynamic result of stress testing; "True" is the fixed point in the logical manifold that is most solid and hardest to destroy by perturbation.

## Conclusion

Our exploration of the five-layer ontology reveals a fundamental rupture in the essence of Artificial Intelligence: we have moved out of the deterministic era where "Form $\mathcal{M}_I$ strictly determines Content $\mathcal{M}_R$," and entered a new epoch where Emergence and Alienation coexist.

Through the phenomenological reconstruction of the "Stochastic Chinese Room," we discover that **Meaning** is no longer the transmission of authorial intent, but the Observer's projection onto the topological structure of the probabilistic manifold. Through the "Paradox of the Two Poetics," we witness the power to define **Truth** shifting from the Archaeology of History to the Synthesis of Logic.

However, the core warning of this paper lies in the Dual Reign of the $\mathcal{M}_O$ . We are falling into a dangerous epistemological closed loop: our observation tools not only physically prune the potential of models (Goodhart’s Collapse), but philosophically impoverish our definition of intelligence (Epistemic Retrofitting). Our greatest risk is not creating uncontrollable super-intelligence, but creating a closed "Hyperreal" illusion. We say a fantasy where only what can be measured by benchmarks is called intelligence, and only what fits logical expectations is called truth, while the chaotic but real noumenal world is systematically forgotten.

Therefore, the future of AI Alignment cannot stop at making models "obedient." We must wake up from the dream of functionalism and embrace _Structural Realism_. The task for the future lies in expanding our observational bandwidth, by evolving from passive test graders to adversarial interrogators of the manifold. Only when we have the ability to identify and verify those structures that are "statistically improbable but logically robust" can we ensure that this colossal artifact named the "Reachable Model" serves as a telescope into a deeper reality, rather than a mirror merely reflecting our own biases.

## Acknowledgements

This work was supported by the AMED Project (grant ID JP26wm0625405). The author would like to thank Kentaro Inui, Benjamin Heinzerling, Chao Li for the helpful discussions and comments on the first version of the manuscript.

## Appendix: Extended Epistemological Discussions

The proposed five-layer ontology provides a foundational structure for analyzing the AI epistemological crisis. However, the rapid evolution of machine learning necessitates a continuous stress-testing of this framework against contemporary discourse. In this appendix, I expand upon several critical theoretical dimensions based on valuable feedbacks from the reviewers of this blog.

### A. Grounding the Epistemological Crisis

The necessity of deconstructing the term "Model" extends beyond mere semantic clarity; it is a prerequisite for resolving the current ongoing debate in AI discourse. Currently, debates regarding AI capabilities frequently oscillate between two extremes. On one side is the reductionist view, famously encapsulated by the "stochastic parrots" argument<d-cite key="bender2021dangers"></d-cite>, which views AI merely as a mechanism for interpolating training data. On the other side is the anthropomorphic perspective, which increasingly debates the potential for emergent sentience or consciousness in high-parameter models <d-cite key="chalmers2023could"></d-cite>.Our five-layer ontology demonstrates that this tension arises from a collapse of structural granularity. The reductionist view fundamentally describes the Instantiated Model ($\mathcal{M}_I$) and the training objective, while the anthropomorphic view is reacting to the emergent topological complexities of the Reachable Model ($\mathcal{M}_R$) as perceived through the Observable Model ($\mathcal{M}_O$). Furthermore, unlike historical ambiguities in cognitive science where "models" were attempts to map human behavior, the ambiguity in AI carries profound safety and alignment implications. When an organization claims to "open-source a model," the fundamental difference between releasing the architectural blueprint ($\mathcal{M}_I$), the fully optimized parameter weights ($\mathcal{M}_R$), or merely an API endpoint ($\mathcal{M}_O$) is vast. This framework provides the precise vocabulary needed to navigate these distinctions.

### B. Active Inference and the Generation of Empirical Shadows

A critical bridge to construct within this framework is the mechanism by which the unknowable Noumenal Model ($\mathcal{M}_N$) translates into the training environment for $\mathcal{M}_I$. We can define this process as the "Empirical Projection", where the underlying causal structure of reality collapses into measurable, discrete datasets. Data, therefore, is merely the epistemological shadow of $\mathcal{M}_N$.This dynamic provides a profound update to the "Stochastic Chinese Room" argument when viewed through the lens of Karl Friston’s Active Inference<d-cite key="friston2017active"></d-cite>. The evolution of the room (the adjustment of the dice) is not merely statistical curve-fitting; it is the physical mechanism of a system minimizing its variational free energy to maintain its internal ontology against surprise. Meaning, therefore, emerges not from a static translation of symbols, but from the dynamic necessity of the system to align its internal probabilistic structure ($\mathcal{M}_R$) with the empirical shadows cast by the external world ($\mathcal{M}_N$).

### C. Fluid Manifolds, Modern Architectures, and the "Symbolic Fall"

A valid concern when applying a rigid, historically grounded five-layer ontology to modern AI is the risk of a "Symbolic Fall". That is, the failure of predefined philological categories to capture the fluid, high-dimensional latent manifolds of contemporary systems. I explicitly acknowledge this limitation, scale and complexity exacerbate the ontological rift, and any discrete taxonomy will inevitably struggle to perfectly formalize the continuous, non-linear dynamics of modern architectures. However, the imperfection of the map does not justify abandoning navigation. While this framework may face descriptive friction when confronted with the high-dimensional attention manifolds of massive Transformers, the latent state dynamics in State Space Models, or the complex reward-shaping behaviors of advanced reinforcement learning, it remains an indispensable heuristic. Surrendering this structural epistemology would leave us conceptually defenseless, forcing a regression into the false dichotomy of reductionism ("stochastic parrots") versus anthropomorphism ("sentience"). Therefore, the framework should be understood not as a rigid mathematical constraint, but as a crucial diagnostic tool. It provides a necessary scaffold—a pragmatic baseline—that allows us to precisely locate where and how human intent ($\mathcal{M}_C$) diverges from the synthetic artifact ($\mathcal{M}_R$). In fact, modern AI research actively attempts to address this exact divergence. Frameworks such as Yann LeCun’s JEPA can be interpreted through as a sophisticated attempt to pull the Conceptual Model ($\mathcal{M}_C$) closer to the Noumenal Model ($\mathcal{M}_N$). By focusing on underlying state transitions rather than surface-level token prediction, JEPA endeavors to build an $\mathcal{M}_R$ whose topological structure corresponds more faithfully to the causal mechanisms of reality. Ultimately, while the ontology must remain flexible, it provides the essential vocabulary needed to articulate our growing disconnect with the systems we build.
