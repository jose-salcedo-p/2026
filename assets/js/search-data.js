// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-home",
    title: "home",
    section: "Navigation",
    handler: () => {
      window.location.href = "/2026/";
    },
  },{id: "nav-about",
          title: "about",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/2026/about/";
          },
        },{id: "nav-call-for-blogposts",
          title: "call for blogposts",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/2026/call/";
          },
        },{id: "nav-submitting",
          title: "submitting",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/2026/submitting/";
          },
        },{id: "nav-reviewing",
          title: "reviewing",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/2026/reviewing/";
          },
        },{id: "dropdown-lt-strong-gt-2026-lt-strong-gt",
              title: "&lt;strong&gt;2026&lt;/strong&gt;",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://iclr-blogposts.github.io/2026/";
              },
            },{id: "dropdown-2025",
              title: "2025",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://iclr-blogposts.github.io/2025/";
              },
            },{id: "dropdown-2024",
              title: "2024",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://iclr-blogposts.github.io/2024/";
              },
            },{id: "dropdown-2023",
              title: "2023",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://iclr-blogposts.github.io/2023/";
              },
            },{id: "dropdown-2022",
              title: "2022",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "https://iclr-blog-track.github.io/home/";
              },
            },{id: "post-fairness-audits-as-theater-when-metrics-mask-structural-harm",
        
          title: "Fairness Audits as Theater: When Metrics Mask Structural Harm",
        
        description: "This blog post examines why contemporary fairness audits fail to prevent algorithmic harm, despite growing adoption. We analyze structural limitations and propose substantive alternatives grounded in participatory accountability.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/fairness-audits/";
          
        },
      },{id: "post-fans-frequency-adaptive-noise-shaping-for-diffusion-models",
        
          title: "FANS - Frequency-Adaptive Noise Shaping for Diffusion Models",
        
        description: "Diffusion models have transformed generative modeling, powering breakthroughs like Stable Diffusion in images and Sora in video. Yet despite their success, diffusion models share a key limitation - spectral bias; they learn broad, low-frequency structure well but struggle to recover fine, high-frequency details. This happens because the standard uniform noise schedule adds the same Gaussian noise to every frequency band, even though real datasets have very different frequency characteristics. When high-frequency components are overwhelmed with noise early in the forward process, the model learns to regenerate them last, and often poorly leading to the blurred textures and softened edges we observe in many diffusion outputs. Frequency-Adaptive Noise Shaping (FANS) offers a potential way to address this limitation. Instead of treating all frequencies equally, FANS dynamically reshapes the noise distribution based on the true frequency importance of the dataset. This simple yet principled modification plugs directly into existing DDPM architectures and improves denoising where it matters most. Across synthetic datasets (with controlled spectral properties) and real-world benchmarks—including CIFAR-10, CelebA, Texture, and MultimodalUniverse—FANS consistently outperforms vanilla DDPMs, with sharper high-frequency details, lower FID, higher PSNR on reconstruction tasks, and marked gains on texture-rich domains (e.g., up to significant relative improvements in perceptual sharpness and detail fidelity). And crucially, it achieves these benefits without sacrificing performance on standard natural-image datasets.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/fans/";
          
        },
      },{id: "post-why-vlms-waste-their-vision",
        
          title: "Why vlms waste their vision",
        
        description: "Despite the robustness of standalone vision encoders, they often collapse to near-chance performance within Vision Language Models (VLMs) by ignoring visual data in favor of language priors. We investigate this paradox by reconciling conflicting theoretical and empirical literature through the lens of attention budgets and information exchange rates. Ultimately, we propose a new mental model that explains why standard multimodal fusion fails and how to restore effective integration.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/why-vlms-waste-their-vision/";
          
        },
      },{id: "post-wait-do-we-need-to-wait-revisiting-budget-forcing-for-sequential-test-time-scaling",
        
          title: "Wait, Do We Need to Wait? Revisiting Budget Forcing for Sequential Test-Time Scaling...",
        
        description: "This blog revisits budget forcing, a sequential test-time scaling technique for reasoning models by controlling when it continues thinking versus when it must answer. We evaluate how well the method transfers across model types, including non-reasoning models, and whether alternative keywords work. We provide practical guidelines for using the technique.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/wait-do-we-need-to-wait/";
          
        },
      },{id: "post-visual-reversal-curse-from-general-domain-to-remote-sensing-images",
        
          title: "Visual Reversal Curse: From General Domain to Remote Sensing Images",
        
        description: "The &#39;Reversal Curse&#39; highlights a fundamental limitation in AI: models often fail to infer inverse relationships. This post investigates whether this curse extends to Vision Foundation Models and proposes remote sensing image translation as the optimal testbed for evaluating bidirectional visual generalization.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/visual-reversal-curse-from-general-domain-to-remote-sensing-images/";
          
        },
      },{id: "post-text-as-image-a-visual-encoding-approach-for-long-context-understanding",
        
          title: "Text-as-Image, A Visual Encoding Approach for Long-Context Understanding",
        
        description: "Humans process text through visual perception much like viewing images or videos, but current AI systems typically use different encoders and processing pipelines when handling different modalities. In this blog post, we investigate recent works that attempt a human-inspired paradigm for processing texts that is converting textual contexts into images and subsequently using visual language models (VLMs) to process them. We start by explaining technical implementations of such conversions and their strengths. We then perform evaluation on long context understanding benchmarks that are more challenging than those used in prior works, with the objective to better analyze how these methods work or fail. Finally, we implement several improvements to existing approaches, including refined conversion techniques and context preprocessing strategies before conversion to images, observing their impacts on task performance to derive insights on future research directions.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/visual-long-context/";
          
        },
      },{id: "post-visualizing-llm-latent-space-geometry-through-dimensionality-reduction",
        
          title: "Visualizing LLM Latent Space Geometry Through Dimensionality Reduction",
        
        description: "In this blog post, we extract, process, and visualize latent state geometries in Transformer-based language models through dimensionality reduction to build a better intuition of their internal dynamics. We demonstrate experiments with GPT-2 and LLaMa models, uncovering interesting geometric patterns in their latent spaces. Notably, we identify a clear separation between attention and MLP component outputs across intermediate layers, a pattern not documented in prior work to our knowledge.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/vis-llm-latent-geometry/";
          
        },
      },{id: "post-using-large-language-models-to-simulate-and-predict-human-decision-making",
        
          title: "Using Large Language Models to Simulate and Predict Human Decision-Making",
        
        description: "We explore how large language models can be used to predict human decisions in language-based persuasion games, comparing direct prompting, LLM-based data generation, and hybrid methods that mix synthetic and human data.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/using-large-language-models-to-simulate-and-predict-human-decision-making/";
          
        },
      },{id: "post-what-and-what-not-are-calibrated-probabilities-actually-useful-for",
        
          title: "What (and What Not) are Calibrated Probabilities Actually Useful for?",
        
        description: "This blogpost clarifies the practical usefulness of having a model with calibrated probabilities, something that is not often clearly stated in the calibration literature. We show that a calibrated model can be relied on to estimate average loss/reward, however, good calibration does not mean that a model is useful for per-sample decision making.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/useful-calibrated-uncertainties/";
          
        },
      },{id: "post-is-your-algorithm-unlearning-or-untraining",
        
          title: "Is Your Algorithm Unlearning Or Untraining?",
        
        description: "Machine unlearning aims to post-process a trained model in order to remove the influence of specific training examples or higher-level knowledge. We argue that the term unlearning is overloaded, with different use cases belonging to distinct problem formulations. This issue causes confusion in the community: it is often unclear what the goals of different proposed methods are, when they are expected to work, how they should be evaluated, and what baselines they should be compared against. To address this, we establish a fundamental distinction between two notions that we identify as Unlearning and Untraining, aiming to guide the field towards disambiguating technical definitions, to unlock more progress in clarifying goals, designing evaluation metrics for each, and ultimately better algorithms.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/unlearning-or-untraining/";
          
        },
      },{id: "post-unigramlm-an-attempt-at-writing-the-missing-manual",
        
          title: "UnigramLM - An Attempt at Writing the Missing Manual",
        
        description: "This post is my attempt to write down the UnigramLM tokenization algorithm cleanly and explicitly because, well, I still haven&#39;t found such a derivation and I think understanding the theory behind the method could help us make it better. I&#39;ll formalize the generative model around which the algorithm is based, derive the EM updates, explain why pruning is needed (and how it&#39;s done), and point out the spots where the practical implementation defined by the SentencePiece library diverges from the pretty mathematical models.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/unigramlm-manual/";
          
        },
      },{id: "post-uncertainty-lifecycle-in-deep-learning",
        
          title: "Uncertainty Lifecycle in Deep Learning",
        
        description: "Uncertainty modeling in deep learning has different attributes such as uncertainty propagation, uncertainty estimation, uncertainty decomposition, uncertainty attribution and uncertainty sensitivity, that are extensively discussed in literature. However, there is no proper structure explaining how these different components interact with each other at different stages of Deep Learning pipeline. We propose to structure the flow and transformation of uncertainty from input to prediction through the model, by appropriately positioning them. And we call this structure as “Uncertainty Lifecycle”. The “Uncertainty lifecycle” can be represented as a structured process for handling, quantifying, analyzing, and interpreting uncertainties at different stages of Deep Learning pipeline.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/uncertainty-lifecycle-in-deep-learning/";
          
        },
      },{id: "post-tracing-the-principles-behind-modern-diffusion-models",
        
          title: "Tracing the Principles Behind Modern Diffusion Models",
        
        description: "Diffusion models can feel like a jungle of acronyms, but the core idea is simple: start from noise and gradually move a cloud of samples until it looks like real data. This post gives an intuition-first tour showing that DDPMs, score-based models, and flow matching are the same recipe with different prediction targets, all rooted in the change-of-variable rule from calculus and powered by one shared “conditional trick” that turns learning into supervised regression. Finally, we zoom out to the speed problem and show how flow map models aim to replace many tiny denoising steps with a few big, accurate jumps toward real-time generation.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/tracing-principles-behind-modern-diffusion-models/";
          
        },
      },{id: "post-the-information-shadow-why-there-are-things-llms-can-never-ever-know",
        
          title: "The Information Shadow - Why There Are Things LLMs Can Never, Ever Know...",
        
        description: "This blogpost introduces the idea of the information shadow - the region of reality that large language models can never fully know, no matter their scale or training data. We argue that some truths are fundamentally inaccessible because they cannot be expressed in language, cannot be inferred from observable data, or cannot be reached by gradient-based training dynamics. Through thought experiments and concrete probes, the post shows how representational limits, identifiability barriers, and optimization constraints create predictable blind spots in model behavior. Understanding this shadow is essential for building safer systems, designing better benchmarks, and avoiding misplaced confidence in model outputs. The goal is not to diminish LLMs, but to map the structural edges of their intelligence.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/the-information-shadow/";
          
        },
      },{id: "post-the-evolution-of-flashattention",
        
          title: "The Evolution of FlashAttention",
        
        description: "We present a mathematical &amp; technical overview of FlashAttention and its evolution across versions 1 to 4. We explain why IO-aware design became central to scalable transformers and how these kernels shape modern long-context LLMs as memory patterns and hardware limits shift. We then describe the changes across versions with Triton examples and place these kernels in the context of recent work on efficient attention. We close by outlining principles that can guide the next generation of attention algorithms.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/the-evolution-of-flashattention/";
          
        },
      },{id: "post-the-bottlenecks-to-scaling-foundation-models-for-robotics",
        
          title: "The Bottlenecks to Scaling Foundation Models for Robotics",
        
        description: "Current approaches to building Vision-Language-Action (VLA) models largely rely on combining pre-trained Vision-Language Models (VLMs) with imitation learning. While effective in narrow benchmarks, this paradigm faces fundamental limitations for developing general-purpose robots that operate in complex, dynamic environments. In this article, I first review the standard training recipe and identify key bottlenecks, drawing on both my observations and existing empirical evidence. I then outline a path forward: integrating online reinforcement learning with pre-trained VLMs to enable lightweight, computationally efficient methods that scale with available resources.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/the-bottlenecks-to-scaling-foundation-models-for-robotics/";
          
        },
      },{id: "post-from-dense-monoliths-to-modular-minds-the-rise-of-symbolic-routing-in-llms",
        
          title: "From Dense Monoliths to Modular Minds: The Rise of Symbolic Routing in LLMs...",
        
        description: "The history of Artificial Intelligence (AI) has largely been defined by a dichotomy: the flexible, probabilistic learning of Connectionism versus the rigorous, compositional logic of Symbolism. However, the emergence of Large Language Models (LLMs) is fostering a synthesis of these paradigms through a fundamental architectural shift: the move from Dense Monoliths to Modular, Routed Systems. This shift is fractal. At the Macro level, LLMs function as central planners, using symbolic protocols to orchestrate external tools and specialized neural agents. Simultaneously, at the Micro level, the models themselves are evolving into sparse, modular structures (such as Mixture-of-Experts) governed by internal routing mechanisms. In this post, we explore this transition toward Symbolic Routing. We discuss how this paradigm enables us to build societies of neural agents, discover latent modularity within dense networks, thus enabling composable, verifiable, interpretable and continually learnable AI system. And we also discuss how to leverage these structures to synthesize training data and formally verify AI reasoning.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/symbolic-connect/";
          
        },
      },{id: "post-the-decoupling-hypothesis-attempting-subject-invariant-eeg-representation-learning-via-auxiliary-injection",
        
          title: "The Decoupling Hypothesis: Attempting Subject-Invariant EEG Representation Learning via Auxiliary Injection",
        
        description: "We explore several ideas for learning subject-invariant EEG representations for reaction time and psychopathology prediction using only 2-second windows in the NeurIPS 2025 EEG Challenge. The core of our approach is the Decoupling Hypothesis: an autoencoder framework where we attempt to disentangle subject-specific artifacts and long-term temporal trends (such as fatigue) from the neural signal by explicitly injecting &#39;nuisance&#39; variables (like demographics and sequence position) into the decoder. This method aimed to force a purely convolutional encoder to learn slow, sequential features without relying on computationally expensive Recurrent or Attention mechanisms. This blog discusses the ideas that seemed promising but ultimately did not work as intended—and why.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/subject-invariant-eeg/";
          
        },
      },{id: "post-artistic-style-and-the-play-of-neural-style-representations",
        
          title: "Artistic Style and the Play of Neural Style Representations",
        
        description: "How do neural networks percieve the complex human construct of artistic style? We explore the dynamic interplay between diverse machine representations of style and style definitions. We reveal a profound divergence where models often reject established historical narratives in favour of their own perceptual truths.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/style-representations/";
          
        },
      },{id: "post-speeding-up-training-of-model-free-reinforcement-learning-a-comparative-evaluation-for-fast-and-accurate-learning",
        
          title: "Speeding up Training of Model-Free Reinforcement Learning :A Comparative Evaluation for Fast and...",
        
        description: "Reinforcement Learning (RL) represents a powerful framework for solving sequential decision-making problems in dynamic environments across diverse domains, such as control of robots or optimization of profit. However, its practical implementation requires navigating a variety of software packages, encompassing deep learning libraries (e.g., TensorFlow, PyTorch, JAX/Flax), environment frameworks (e.g., Gymnasium, Numpy), and hyperparameter optimization techniques and libraries. This post critically evaluates the common PyTorch, Gymnasium, and NumPy RL stack by comparing it to a faster alternative:JAX/Flax for both of model training and environment simulation. A Gridworld example evaluating both training speed and accuracy is utilized to test each of these packages. Additionally, we complement our example by a comprehensive tracking and monitoring of the training process using MLflow along with a thorough hyperparameters optimization via Optuna. The post concludes with a discussion of the results and final recommendations for optimal use cases of each of these packages.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/speeding-up-rl/";
          
        },
      },{id: "post-where-39-s-the-chicken-unpacking-spatial-awareness-in-vision-language-models",
        
          title: "Where&#39;s the Chicken? Unpacking Spatial Awareness in Vision-Language Models",
        
        description: "Modern vision-language models (VLMs) have achieved impressive success in recognizing and describing visual content, yet they continue to struggle with understanding spatial relationships. The limitation persists even with massive data and model scaling, suggesting that the root of the problem lies in the architecture and training objective rather than data alone. This post examines the underlying causes and discusses why recent proposed fixes, while promising, remain insufficient to achieve robust spatial reasoning.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/spatial-awareness/";
          
        },
      },{id: "post-don-39-t-look-up-every-token-escaping-quadratic-complexity-via-geometric-patterns-and-algorithms",
        
          title: "Don&#39;t Look Up (Every Token): Escaping Quadratic Complexity via Geometric Patterns and Algorithms",
        
        description: "Large Language Models (LLMs) have brought about a significant change in the field of artificial intelligence, where they have transitioned in scope from being specialized research tools to common resources that drive the next generation of software. With increasing model parameters and training data, LLMs demonstrate new abilities in reasoning, code generation, and solving complex problems that were once considered unattainable. However, scaling these models effectively for long-context applications uniquely poses a challenge. This is primarily due to the inherent limitations of the self-attention mechanism, which has quadratic time complexity. This quadratic bottleneck hinders applications for long documents, high-resolution images, and large codebases, among others. However, what is interesting to observe is that effectively only a few parameters are used in token computation, and most calculations are sparse. Hence, sparsity emerges as an effective solution to this problem. Rather than relying on the entire attention matrix, one can utilize an approximate or sparse version of attention to achieve almost the same results much faster. The backbone of this approach is the idea that tokens do not require the entire context; they only need local context, and thus, most of the computation carried out is wasteful. In this blog, we analyze the types of attention patterns that emerge and how to use them to our advantage for faster and efficient LLMs.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/sparsity/";
          
        },
      },{id: "post-scaling-online-rlvr-done-right-with-decoupled-generation-amp-optimization",
        
          title: "Scaling Online RLVR Done Right with Decoupled Generation &amp; Optimization",
        
        description: "Reinforcement Learning with Verifiable Rewards (RLVR) optimizes large language models on tasks with objective correctness criteria by directly leveraging deterministic reward signals rather than learned preferences. While theoretically principled, online RLVR remains computationally prohibitive due to tight coupling of generation and optimization, which inflates memory and severely limits training throughput. We prove this gap is architectural, not fundamental. Online RLVR can be reformulated exactly as offline supervised fine-tuning with importance-weighted samples. We introduce Decoupled Generation &amp; Optimization (DGO), a two-phase paradigm that separates generation from optimization, reducing peak memory by ~18-31% and training time by ~75-85% while enabling multi-epoch training. Our framework unifies existing offline methods, exposes systematic theory-practice mismatches, and establishes DGO as the first method where theoretical optimal weights align perfectly with implementation. We show scaling online RLVR is achievable when done right, through principled decoupling and theoretically-grounded design.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/scaling-rlvr/";
          
        },
      },{id: "post-getting-sac-to-work-on-a-massive-parallel-simulator-an-rl-journey-with-off-policy-algorithms",
        
          title: "Getting SAC to Work on a Massive Parallel Simulator: An RL Journey With...",
        
        description: "This post details how to get the Soft-Actor Critic (SAC) and other off-policy reinforcement learning algorithms to work on massively parallel simulators (e.g., Isaac Sim with thousands of robots simulated in parallel). In addition to tuning SAC for speed, the post also explores why SAC fails where PPO succeeds, highlighting a common problem in task design that many codebases share.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/sac-massive-sim/";
          
        },
      },{id: "post-using-graph-neural-networks-in-reinforcement-learning-a-practical-guide",
        
          title: "Using Graph Neural Networks in Reinforcement Learning: A Practical Guide",
        
        description: "Graph Neural Networks (GNNs) have achieved excellent results for modelling relational data in many supervised learning domains. However, much fewer works have explored their potential in Reinforcement Learning (RL) despite the ubiquity of practical problems defined over graphs. In this blog post, we discuss how GNNs can be effectively integrated in Deep RL frameworks, covering crucial design decisions and practical implementation concerns. In doing so, we hope to facilitate unlocking new capabilities for RL agents to reason in graph-structured environments with dynamic action spaces and varying input sizes.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/rl-with-gnns/";
          
        },
      },{id: "post-rethinking-the-diffusion-model-from-a-langevin-perspective",
        
          title: "Rethinking the Diffusion Model from a Langevin Perspective",
        
        description: "Diffusion models are often introduced from multiple perspectives—such as VAEs, score matching, or flow matching—accompanied by dense and technically demanding mathematics that can be difficult for beginners to grasp. This article offers a fresh Langevin perspective on diffusion models to lower the technical barrier, aiming to present diffusion models in a simpler, clearer, and more intuitive way while addressing the following questions 1. How does the reverse process invert the forward process to generate data from pure noise? 2. How can ODE-based and SDE-based diffusion models be unified under a single framework? 3. Why are diffusion models theoretically superior to ordinary VAEs? 4. How can Denoising, Score Matching, and Flow Matching training objectives be unified and derived from first principles? We demonstrate that the Langevin perspective offers clear and straightforward answers to these questions, providing pedagogical value for both learners and experienced researchers seeking deeper intuition.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/rethinking-diffusion-langevin/";
          
        },
      },{id: "post-dynamic-parameter-reuse-augments-reasoning-via-latent-chain-of-thought",
        
          title: "Dynamic Parameter Reuse Augments Reasoning via Latent Chain of Thought",
        
        description: "Standard language models often rely on massive parameter counts for their performance, utilizing each parameter only once per inference pass. This prompts consideration of recurrent structures, where models reuse parameters across sequential time, depth, or training progression to achieve improved performance and reduced training cost. We draw connections in the landscape of parameter reuse, from growing models via stacking to recurrent looping, and postulate that these architectural priors act as a form of Latent Chain of Thought (LCoT), allowing models to reason in a continuous state space. By shifting towards deeper and dynamic computation, grown and recurrent architectures offer a path toward improved reasoning in compact networks, ascending beyond scaling laws of standard architectures.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/recur-refine-reason/";
          
        },
      },{id: "post-pushing-meta-continual-learning-algorithms-to-the-limit",
        
          title: "Pushing Meta-Continual Learning Algorithms to the Limit",
        
        description: "Meta-continual learning algorithms should be able to handle tasks with extended data streams compared to the traditional deep learning setting. These algorithms have not been applied to settings with extreme data streams, such as classification tasks with 1,000 classes, nor have they been compared to traditional continual learning algorithms. We compare meta-continual learning to continual learning and we find that meta-continual learning scales better than continual learning.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/pushing-meta-cl-methods/";
          
        },
      },{id: "post-probabilistic-circuits-for-uncertainty-quantification",
        
          title: "Probabilistic Circuits for Uncertainty Quantification",
        
        description: "Deep learning models struggle with epistemic uncertainty quantification, often exhibiting blind confidence on out-of-distribution data. This work reviews on Probabilistic Circuits (PCs) as a versatile framework for rigorous, tractable reasoning. PCs model the joint probability distribution and by enforcing structural constraints, specifically smoothness, decomposability, and determinism, they allow for the exact computation of marginals, conditionals, and moments in polynomial time without retraining. We discuss on the suitability of PCs for Uncertainty Quantification, describing their advantages and highlighting their PCs for tractable UQ in high-dimensional problems.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/probabilistic-circuits-for-uncertainty-quantification/";
          
        },
      },{id: "post-faster-svd-via-accelerated-newton-schulz-iteration",
        
          title: "Faster SVD via Accelerated Newton-Schulz Iteration",
        
        description: "Traditional SVD algorithms rely heavily on QR factorizations, which scale poorly on GPUs. We show how the recently proposed Chebyshev-Accelerated Newton-Schulz (CANS) iteration can replace them and produce an SVD routine that is faster across a range of matrix types and precisions.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/polar-svd/";
          
        },
      },{id: "post-a-philosophy-of-model-editing-what-does-it-mean-to-change-knowledge-in-a-neural-network",
        
          title: "A Philosophy of Model Editing - What Does It Mean to “Change Knowledge”...",
        
        description: "This blogpost explores what it truly means to change knowledge inside a neural network. Unlike symbolic systems, large language models do not store facts in explicit locations; they implement them through distributed geometric transformations. Editing a model therefore reshapes regions of its activation space, alters relational structures, and sometimes shifts broader behavioral tendencies. We examine how local edits differ from global ones, why forgetting resembles suppression rather than deletion, and how repeated modifications can change a model’s identity. By framing model editing as a philosophical and structural question rather than a purely technical procedure, this piece highlights the need to evaluate edits not only for local correctness but also for their impact on coherence, ontology, and long-term behavior.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/philosophy-of-model-editing/";
          
        },
      },{id: "post-performative-prediction-made-practical",
        
          title: "Performative Prediction made practical",
        
        description: "Performative Prediction studies settings where deploying a model induces a distribution shift in the data with the aim of building robust and good-peforming models under these post-deployment effects. Most existing work in this area is theoretical and relies on strict assumptions to converge to those models, which makes the resulting techniques difficult to apply in practice and limits their accessibility to the broader Machine Learning (ML) community. In this blog post, we use visualization techniques 1) to provide an intuitive explanation of Performative Prediction and 2) to extract practical insights for studying convergence when theoretical assumptions do not hold.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/performative-prediction/";
          
        },
      },{id: "post-there-is-no-in-timeseries-rethinking-tsfm-through-the-lens-of-invariance",
        
          title: "There is No 🍎 in Timeseries: Rethinking TSFM through the Lens of Invariance...",
        
        description: "Timeseries foundation models (TSFMs) are trained on scrape-everything-on-the-interet paradigm, yet the internet is only semantically complete for text and images, not for timeseries, leading to poor performance. It contains countless texts and images of 🍎, but there is no timeseries that captures the concept of 🍎. This mismatch calls for a different pretraining strategy for timeseries, and we argue that the correct organising principle is invariance.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/no-apple/";
          
        },
      },{id: "post-language-as-a-window-into-the-mind-how-nlp-and-llms-advance-human-sciences",
        
          title: "Language as a Window Into the Mind: How NLP and LLMs Advance Human...",
        
        description: "Can NLP predict heroin-addiction outcomes, uncover suicide risk, or simulate (and even influence) brain activity? Could LLMs one day contribute to research worthy of a Nobel Prize for advancing our understanding of human behavior? And what role do NLP scientists play in shaping that possibility? This post explores these questions, arguing that language technologies are not just tools that support scientific work (like literature search agents, writing tools, or coding assistants), but that by treating language as a window into the human mind, NLP and LLMs can actively help researchers uncover mechanisms of human behavior, cognition, and brain function.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/nlp-for-human-sciences/";
          
        },
      },{id: "post-in-context-neurofeedback-can-large-language-models-truly-control-their-internal-representations",
        
          title: "In-Context Neurofeedback: Can Large Language Models Truly Control Their Internal Representations?",
        
        description: "Whether large language models (LLMs) can control their own internal representations matters for understanding machine metacognition and for AI safety. A recent study accepted at NeurIPS 2025 claimed that LLMs can control these internal representations, but this study cannot rule out the possibility that such control relies on superficial mechanisms because the control targets are not privileged. We propose in-context neurofeedback, a method that uses multi-turn conversation to control internal representations while ensuring privileged access requirements, and provide a methodological framework for future investigations into machine metacognition.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/neurofeedback/";
          
        },
      },{id: "post-neural-audio-codecs-how-to-get-audio-into-llms",
        
          title: "Neural audio codecs: how to get audio into LLMs",
        
        description: "A look at why audio is harder to model than text and how we can make it easier with neural audio codecs. With a codec, we can turn audio into larger discrete tokens, train models to predict continuations for these tokens, and then decode those back into audio.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/neural-audio-codecs/";
          
        },
      },{id: "post-model-misspecification-in-simulation-based-inference-recent-advances-and-open-challenges",
        
          title: "Model Misspecification in Simulation-Based Inference - Recent Advances and Open Challenges",
        
        description: "Model misspecification is a critical challenge in simulation-based inference (SBI), particularly in neural SBI methods that use simulated data to train flexible neural density estimators. These methods typically assume that simulators faithfully represent the true data-generating process, an assumption that is often violated in practice. Resulting discrepancies can make observed data effectively out-of-distribution relative to the simulations, leading to biased posterior distributions and misleading uncertainty quantification. This post reviews recent work on model misspecification in neural SBI, covering formal definitions, methods for detection and mitigation, and their underlying assumptions. It also discusses practical implications for SBI workflows and outlines open challenges for developing robust SBI methods that remain reliable in realistic, imperfectly specified applications.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/model-misspecification-in-sbi/";
          
        },
      },{id: "post-evaluating-machine-learned-inter-atomic-potentials-for-a-practical-simulation-workflow",
        
          title: "Evaluating Machine-Learned Inter-Atomic Potentials for a Practical Simulation Workflow",
        
        description: "MLIPs are a promising new paradigm in atomistic simulation, potentially offering the accuracy of ab-initio methods at the speed of empirical potentials. In this blog post, we give an overview of recent MLIP architectures, followed by an evaluation on a practical CO2 adsorption simulation. We find that as of today these models, though promising, are far from plug-and-play, requiring significant engineering effort to operate within established simulation frameworks, while also failing to produce physically consistent results.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/mlip-practical/";
          
        },
      },{id: "post-is-the-evidence-in-39-language-models-learn-to-mislead-humans-via-rlhf-39-valid",
        
          title: "Is the evidence in &#39;Language Models Learn to Mislead Humans via RLHF&#39; valid?...",
        
        description: "Language Models Learn to Mislead Humans Via RLHF (published at ICLR 2025) argues that RLHF can unintentionally train models to mislead humans – a phenomenon termed Unintentional-SOPHISTRY. However, our review of the paper&#39;s code and experiments suggests that a significant portion of their empirical findings may be due largely to major bugs that make the RLHF setup both unrealistic and highly prone to reward hacking. In addition to high-level claims, we  correct these issues for one of their experiments, and fail to find evidence that supports the original paper&#39;s claims.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/mislead-lm/";
          
        },
      },{id: "post-misalignments-and-rl-failure-modes-in-the-early-stage-of-superintelligence",
        
          title: "Misalignments and RL Failure Modes in the Early Stage of Superintelligence",
        
        description: "With the rapid ability grokking of frontier Large Models (LMs), there is growing attention and research focus on aligning them with human values and intent via large scale reinforcement learning and other techniques. However, as LMs are getting stronger and more agentic, their misalignment and deceptive behaviors are also emerging and becoming increasingly difficult for humans to pre-detect and keep track of. This blog post discusses current misalignment patterns, deceptive behaviors, RL failure modes, and emergent traits in modern large models to further AI safety discussions and advance the development of mitigation strategies for LM misbehaviors.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/misalign-failure-mode/";
          
        },
      },{id: "post-on-the-measure-of-a-model-from-intelligence-to-generality",
        
          title: "On the Measure of a Model - From Intelligence to Generality",
        
        description: "Benchmarks like ARC, Raven-style puzzles, and the Blackbird Task are often treated as measures of LLM intelligence. But intelligence is a moving target—hard to define and even harder to link to what we actually need models to do, like answer questions, summarize text, or write code. Optimizing for these abstract tests can pull evaluation away from real-world usefulness. We argue for a shift from chasing intelligence to measuring generality. This reframes how progress in AI should be assessed and proposes generality as a more stable foundation for evaluating capability across diverse and evolving tasks.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/measuregen/";
          
        },
      },{id: "post-learning-to-maximize-rewards-via-reaching-goals",
        
          title: "Learning to Maximize Rewards via Reaching Goals",
        
        description: "Goal-conditioned reinforcement learning learns to reach goals instead of optimizing hand-crafted rewards. Despite its popularity, the community often categorizes goal-conditioned reinforcement learning as a special case of reinforcement learning. In this post, we aim to build a direct conversion from any reward-maximization reinforcement learning problem to a goal-conditioned reinforcement learning problem, and to draw connections with the stochastic shortest path framework. Our conversion provides a new perspective on the reinforcement learning problem: maximizing rewards is equivalent to reaching some goals.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/mdp-to-gcmdp/";
          
        },
      },{id: "post-research-directions-in-multimodal-chain-of-thought-mcot-with-sketching",
        
          title: "Research Directions in Multimodal Chain-of-Thought (MCoT) with Sketching",
        
        description: "This article explores adding sketching to Multimodal Chain-of-Thought (MCoT)reasoning to enhance AI capabilities. It reviews past methods, identifies key gaps such as the lack of sketch-rationale datasets, and proposes advancing the field through targeted data collection, unified multimodal models, and reinforcement learning. Ethical considerations include mitigating cultural bias and visual misrepresentation in generated sketches.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/mcot-sketching/";
          
        },
      },{id: "post-from-reinforce-to-dr-grpo-a-unified-perspective-on-llm-post-training",
        
          title: "From REINFORCE to Dr. GRPO: A Unified Perspective on LLM Post-Training",
        
        description: "Recently, many reinforcement learning (RL) algorithms have been applied to improve the post-training of large language models (LLMs). In this article, we aim to provide a unified perspective on the objectives of these RL algorithms, exploring how they relate to each other through the Policy Gradient Theorem — the fundamental theorem of policy gradient methods.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/llm-post-training/";
          
        },
      },{id: "post-are-dilemmas-and-conflicts-in-llm-alignment-solvable-a-view-from-priority-graph",
        
          title: "Are Dilemmas and Conflicts in LLM Alignment Solvable? A View from Priority Graph...",
        
        description: "As Large Language Models (LLMs) become more powerful and autonomous, they increasingly face conflicts and dilemmas in many scenarios. We first summarize and taxonomize these diverse conflicts. Then, we model the LLM&#39;s preferences to make different choices as a priority graph, where instructions and values are nodes, and the edges represent context-specific priorities determined by the model&#39;s output distribution. This graph reveals that a unified stable LLM alignment is very challenging, because the graph is not static in different contexts. Besides, it also reveals a potential vulnerability: priority hacking, where adversaries can craft deceptive contexts to manipulate the graph and bypass safety alignments. To counter this, we propose a runtime verification mechanism, enabling LLMs to query external sources to ground their context and resist manipulation. While this approach enhances robustness, we also acknowledge that many ethical and value dilemmas are philosophically irreducible, posing an open challenge for the future of AI alignment.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/llm-conflicts/";
          
        },
      },{id: "post-the-layered-ontology-of-models-resolving-the-epistemological-crisis-of-ai",
        
          title: "The Layered Ontology of Models, Resolving the Epistemological Crisis of AI",
        
        description: "We propose a five-layer model framework and discuss the concepts of Meaning and Truth in the era of large models through two thought experiments.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/layered-ontology-model/";
          
        },
      },{id: "post-justrl-scaling-a-1-5b-llm-with-a-simple-rl-recipe",
        
          title: "JustRL: Scaling a 1.5B LLM with a Simple RL Recipe",
        
        description: "Training small reasoning models with RL has become a race toward complexity, using multi-stage pipelines, dynamic schedules, and curriculum learning. We ask whether this complexity necessary? We show that JustRL, a simple recipe with fixed hyperparameters, achieves state-of-the-art performance on two different 1.5B base models (54.5% and 64.3% across 9 math benchmarks) while using 2× less compute than sophisticated approaches. The same hyperparameters transfer across both models without tuning, and training remains stable over thousands of steps without intervention. This suggests the field may be adding complexity to solve problems that disappear with a stable, scaled-up baseline.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/justrl/";
          
        },
      },{id: "post-introduction-to-stochastic-interpolants",
        
          title: "Introduction to Stochastic Interpolants",
        
        description: "Prominent generative modeling frameworks such as Flow Matching and score-based Diffusion Models establish a smooth transformation between a Gaussian distribution and a data distribution. In this blog post, we provide an introduction to the more general framework of Stochastic Interpolants, which allows one to flexibly interpolate between any two distributions and learn a velocity field to transform samples from one into samples of the other. No prior knowledge of generative models is required for this introduction.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/introduction-to-stochastic-interpolants/";
          
        },
      },{id: "post-how-to-open-the-black-box-amp-58-modern-models-for-mechanistic-interpretability",
        
          title: "How To Open the Black Box&amp;#58 Modern Models for Mechanistic Interpretability",
        
        description: "Understanding how transformers represent and transform internal features is a core challenge in mechanistic interpretability. Traditional tools like attention maps and probing reveal only partial structure, often blurred by polysemanticity and superposition. New model-based methods offer more principled insight&amp;#58 Sparse Autoencoders extract sparse, interpretable features from dense activations; Semi-Nonnegative Matrix Factorization uncovers how neuron groups themselves encode concepts; Cross-Layer Transcoders track how these representations evolve across depth; and Weight-Sparse Transformers encourage inherently modular computation through architectural sparsity. Together, these approaches provide complementary pathways for opening the black box and understanding the circuits that underpin transformer behavior.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/interpret-model/";
          
        },
      },{id: "post-how-many-tokens-does-it-take-to-say-नमस्ते-a-dive-into-indic-tokenization",
        
          title: "How many tokens does it take to say “नमस्ते”? A Dive into Indic...",
        
        description: "Tokenizers trained on English-dominant data often produce unusually high token counts for Indic languages. This &#39;tokenizer fertility&#39; increases sequence lengths, raises compute costs, and can hurt downstream performance, even when the underlying model is strong. In this post, we examine how fertility varies across major Indic scripts and how it affects language modeling quality, inference efficiency, and instruction-following behavior.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/indic-tokenization/";
          
        },
      },{id: "post-the-illusion-of-mastery-breaking-the-cycle-of-benchmark-memorization-with-generative-evaluation",
        
          title: "The Illusion of Mastery: Breaking the Cycle of Benchmark Memorization with Generative Evaluation...",
        
        description: "Modern AI models that score perfectly on standardized benchmarks often fail in real-world applications. In this post, we first examine why current evaluation paradigms increasingly fail to capture how models perform in real-world scenarios, leading to an illusion of competence. Then, we introduce generative evaluation that automatically creates novel, diverse tasks every time a model is tested, and explain how it offers a more realistic way to measure what AI systems can actually do.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/illusion-of-mastery/";
          
        },
      },{id: "post-heuristic-based-ideation-for-guiding-llms-toward-structured-creativity",
        
          title: "Heuristic-Based Ideation for Guiding LLMs Toward Structured Creativity",
        
        description: "Large Language Models (LLMs) hold immense promise for accelerating scientific discovery, yet current LLM-based ideation methods often rely on ad-hoc strategies rather than systematic frameworks. This blog introduces Ideation Heuristics, a systematic approach that formalizes 20 cognitive heuristics that structure how researchers generate new ideas. We show that researchers across disciplines find these heuristics highly useful, and we demonstrate how they can be operationalized through Claude skills.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/ideation-heuristics/";
          
        },
      },{id: "post-in-context-learning-of-representations-can-be-explained-by-induction-circuits",
        
          title: "In-context learning of representations can be explained by induction circuits",
        
        description: "Park et al., 2025 demonstrate that large language models can learn to trace random walks on graphs presented in context, and observe that token representations reorganize to reflect the underlying graph structure. This has been interpreted as evidence that models &#39;flexibly manipulate their representations&#39; to reflect in-context semantics, and that this reorganization enables task performance. We offer a simpler mechanistic explanation. We first observe that task performance can be fully explained by induction circuits (Olsson et al., 2022), and show that ablating the attention heads that comprise these circuits substantially degrades performance. As for the geometric structure, we propose that it could result from previous token heads effectively mixing the representations of graph neighbors together. We show that a single round of such &#39;neighbor mixing&#39; on random embeddings recreates the observed graph correspondence in PCA visualizations. These results suggest that apparent &#39;representation reorganization&#39; may be a byproduct of the model&#39;s induction circuits, rather than a critical strategy useful for in-context learning.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/iclr-induction/";
          
        },
      },{id: "post-when-sota-meets-reality-lessons-from-deploying-nlp-at-a-large-healthcare-organization",
        
          title: "When SOTA Meets Reality: Lessons from Deploying NLP at a Large Healthcare Organization...",
        
        description: "In academia, we optimize for accuracy. In healthcare, we optimize for patient outcomes. This is the story of how a large healthcare organization reduced a multi-year backlog not by using the largest or newest model, but by using the right one.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/healthcare-nlp/";
          
        },
      },{id: "post-ready-for-general-agents-let-39-s-test-it",
        
          title: "Ready For General Agents? Let&#39;s Test It.",
        
        description: "General-purpose agents are emerging, but current evaluation tools cannot yet measure how well they adapt to unfamiliar environments or protocols; we outline the gaps and a path to a protocol-agnostic framework.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/general-agent-evaluation/";
          
        },
      },{id: "post-generative-ai-archaeology",
        
          title: "Generative AI Archaeology",
        
        description: "We document the rise of the Generative AI Archaeologist, whose tools include linear algebra and probability theory, jailbreaking, and debuggers, compared to the metal detectors, pickaxes, and radar surveys of traditional archaeology. GenAI Archaeologists have reported findings both through luck by observing unexpected behaviour in publicly accessible models, and by exploiting the mathematical properties of models. In this blog, we survey five types of findings unearthed by GenAI Archaeologists and discuss the status of those findings.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/genai-archaeology/";
          
        },
      },{id: "post-quot-how-to-transition-from-ml-to-dl-in-production-lessons-from-the-trenches-at-company-quot",
        
          title: "[&quot;How to Transition from ML to DL in Production - Lessons From the...",
        
        description: "[&quot;A mature and entrenched boosting system has been powering Company’s risk systems for years. We outline our year-long incremental migration strategy to a pure deep learning system which is highlighted by an intermediate heterogeneous ensembling phase used to reach parity and then outperforming our boosting model in production. We learned along the way that a simple MLP can beat sophisticated tabular DL architectures at million-scale (1); ensembling is a practical bridge from ML to DL (2); and the biggest wins from DL are often beyond metrics (3).&quot;]",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/from-ml-to-dl/";
          
        },
      },{id: "post-flow-where-you-want",
        
          title: "Flow Where You Want",
        
        description: "This tutorial demonstrates how to add inference-time controls to pretrained flow-based generative models. Using an unconditional MNIST flow model, we apply classifier guidance and inpainting by adding velocity corrections during sampling. We also explore PnP-Flow, which satisfies constraints through iterative projection rather than velocity correction.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/flow-where-you-want/";
          
        },
      },{id: "post-from-trajectories-to-operators-a-unified-flow-map-perspective-on-generative-modeling",
        
          title: "From Trajectories to Operators — A Unified Flow Map Perspective on Generative Modeling...",
        
        description: "In this post, we reframe continuous-time generative modeling from integrating trajectories to learning two-time operators (flow maps). This operator view unifies diffusion, flow matching, and consistency models, and suggests a practical diagnostic — semigroup-consistent jumps yield both step-robust generation and low compositional drift. We derive Eulerian/Lagrangian distillation objectives and use inpainting experiments to show why semigroup-consistent jumps can be both step-robust and composition-stable.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/flow-map-learning/";
          
        },
      },{id: "post-understanding-and-fixing-bottlenecks-in-state-space-models-what-recency-and-over-smoothing-tell-us",
        
          title: "Understanding and Fixing Bottlenecks in State Space Models: What Recency and Over-Smoothing Tell...",
        
        description: "This work analyzes how recency bias and hidden-state over-smoothing emerge in modern State Space Models, revealing the bottlenecks that limit their ability to capture long-range dependencies.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/fixing-bottlenecks-in-state-space-models/";
          
        },
      },{id: "post-the-coverage-boundary-why-high-fidelity-primitives-don-39-t-compose",
        
          title: "The Coverage Boundary: Why High-Fidelity Primitives Don&#39;t Compose",
        
        description: "A controlled experiment showing that adversarially trained primitives hit a glass ceiling on compositional generalization, while low-fidelity pedagogical primitives achieve perfect transfer.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/fidelity-trap/";
          
        },
      },{id: "post-the-effect-of-feature-resolution-on-embedding-dimension",
        
          title: "The effect of feature resolution on embedding dimension",
        
        description: "High-dimensional data can be compressed into lower-dimensional embeddings while retaining a relatively large amount of relevant information, a phenomenon which, despite its widespread use, we struggle to fully explain. In this post, we use a common property of datasets - a limit on the number of features per data point - to show how a slight uniform dependence between features can be exploited to reduce the required dimensions by at least a third, while sacrificing no information about the features. To do so, we introduce the concepts of dataset resolution and feature composition of a dataset, and analyse how a set of orderings of the dataset affect the types of partitions we can create of the dataset.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/feature-reduction/";
          
        },
      },{id: "post-approximating-faster-transformers",
        
          title: "Approximating Faster Transformers",
        
        description: "This post offers a comprehensive overview of sketching and sampling algorithms for DistilBERT",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/fastermatrices/";
          
        },
      },{id: "post-evalcards-for-standardized-evaluation-reporting",
        
          title: "EvalCards for Standardized Evaluation Reporting",
        
        description: "In the age of rapidly released LLMs, evaluation reporting is fragmented, inconsistent, and often misleading. We surveyed the landscape and found three critical crises—reproducibility, accessibility, and governance—that Model Cards alone can&#39;t solve. Our solution? EvalCards-- lightweight, standardized evaluation summaries that are easy to write, easy to understand, and impossible to miss. EvalCards are designed to enhance transparency for both researchers and practitioners while providing a practical foundation to meet emerging governance requirements.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/evalcards/";
          
        },
      },{id: "post-endocrine-to-synaptic-learnable-signaling-primitives-for-robust-multi-agent-ai",
        
          title: "Endocrine-to-Synaptic: Learnable Signaling Primitives for Robust Multi-Agent AI",
        
        description: "A bio-inspired multi-agent communication framework that uses five cellular signaling modes, signal amplification cascades, and dynamic network adaptation to achieve scalable, robust, and energy-efficient coordination in large distributed AI systems.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/endocrine-to-synaptic/";
          
        },
      },{id: "post-are-llm-agent-populations-really-emergent-a-comprehensive-perspective",
        
          title: "Are LLM Agent Populations Really Emergent? A Comprehensive Perspective",
        
        description: "Exploring emergent properties in populations of LLM agents through the lens of complex systems theory, examining social coordination, cooperation dynamics, and economic interactions in generative agent-based models.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/emergent-agents/";
          
        },
      },{id: "post-elastic-weight-consolidation-ewc-nuts-and-bolts",
        
          title: "Elastic Weight Consolidation (EWC): Nuts and Bolts",
        
        description: "A theoretical deep-dive into the Elastic Weight Consolidation method for continual learning, explaining the mathematical foundations and intuitions behind this influential approach to preventing catastrophic forgetting.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/elastic-weight-consolidation-nuts-bolts/";
          
        },
      },{id: "post-ai-fundamentals-valuing-ai-agents-amp-data-assets",
        
          title: "AI Fundamentals: Valuing AI Agents &amp; Data Assets",
        
        description: "Large Language Model (LLM) agents now read the world through managed-context pipelines, write to it via tool-calling APIs, and continuously re-wire themselves with fresh experience. Stakeholders therefore need a Generally Accepted Accounting Principles (GAAP) compatible method to price both (i) the agent&#39;s labour-like output and (ii) the data traces that fuel learning. We formalise a single unifying metric - agent Economic Value (AEV)- and demonstrate that these metrics are measurable today. We then extend the template to reinforcement-learning regimes in which grounded rewards equal cash flows. Lastly, we propose a financial settlement layer, which transforms the agent from a passive software user into an active economic participant.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/economic-agents/";
          
        },
      },{id: "post-your-moe-model-does-not-have-to-select-fixed-number-of-experts",
        
          title: "Your MoE Model Does Not Have to Select Fixed Number of Experts",
        
        description: "Standard Mixture-of-Experts (MoE) models adopt fixed top-k routing, applying uniform computation across tokens regardless of their complexity. This rigidity often leads to suboptimal efficiency and performance, and dynamic routing could address this by adaptively selecting the optimal number of experts for each token. This post introduces the principles of dynamic routing and reviews key techniques for flexible expert allocation.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/dynamic-routing/";
          
        },
      },{id: "post-sample-blog-post",
        
          title: "Sample Blog Post",
        
        description: "Your blog post&#39;s abstract. Please add your abstract or summary here and not in the main body of your text. Do not include math/latex or hyperlinks.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/distill-example/";
          
        },
      },{id: "post-why-machines-can-39-t-make-up-their-mind-exploring-a-psychological-perspective-towards-llm-failures",
        
          title: "Why Machines Can&#39;t Make Up Their Mind? - Exploring a Psychological Perspective towards...",
        
        description: "We explore a unifying framework for LLM failures, including hallucinations, sycophancy, multi-hop reasoning breakdowns, and internal contradictions. We interpret these issues as energy minimization in areas with conflicting meaning. This perspective connects cognitive dissonance from psychology to the geometry of neural networks.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/dissonant-machine/";
          
        },
      },{id: "post-discretisation-invariance",
        
          title: "Discretisation invariance",
        
        description: "Discretisation invariance, a recent innovation in scientific machine learning, is a requirement that ensures an architecture can process inputs of different resolutions. In this post, we formally define this property, provide examples, generate datasets, train architectures, and discuss whether discretisation invariance is living up to its promise.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/discretisation-invariance/";
          
        },
      },{id: "post-navigating-the-manifold-a-geometric-perspective-on-diffusion-based-inverse-problems",
        
          title: "Navigating the Manifold — A Geometric Perspective on Diffusion-Based Inverse Problems",
        
        description: "This blogpost develops a geometric and probabilistic lens on diffusion priors for inverse problems. We show that a wide range of methods mostly instantiate two operator-splitting paradigms, i.e., posterior-guided sampling and clean-space local-MAP optimization. Through manifold diagrams, Tweedie-based animations, and step-by-step derivations, we explain how these paradigms decouple a pretrained diffusion prior from measurement physics, clarify when they approximate full posterior sampling versus MAP estimation, and distill practical design rules for building robust diffusion-based inverse solvers.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/diffusion-inverse-problems/";
          
        },
      },{id: "post-diffusion-guidance-opportunities-for-physical-sciences",
        
          title: "Diffusion Guidance - Opportunities for Physical Sciences",
        
        description: "Guidance has been a central driver of the success of diffusion models, enabling precise control over the sampling process toward desired target conditions. The most widely used techniques include Classifier Guidance and Classifier-Free Guidance. Recently, however, there has been growing interest in alternative guidance strategies. In this blog post, we review recent progress in training-free diffusion guidance methods and highlight their applications in scientific domains.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/diffusion-guidance/";
          
        },
      },{id: "post-from-u-nets-to-dits-the-architectural-evolution-of-text-to-image-diffusion-models-2021-2025",
        
          title: "From U-Nets to DiTs: The Architectural Evolution of Text-to-Image Diffusion Models (2021–2025)",
        
        description: "A comprehensive analysis of how diffusion model architectures evolved from U-Net backbones to Diffusion Transformers, transforming text-to-image generation capabilities.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/diffusion-architecture-evolution/";
          
        },
      },{id: "post-destruction-is-a-general-strategy-to-learn-generation-diffusion-39-s-strength-is-to-take-it-seriously-exploration-is-the-future",
        
          title: "Destruction is a General Strategy to Learn Generation; Diffusion&#39;s Strength is to Take...",
        
        description: "I present diffusion models as part of a family of machine learning techniques that withhold information from a model’s input and train it to guess the withheld information. I argue that diffusion&#39;s destroying approach to withholding is more flexible than typical hand-crafted information withholding techniques, providing a rich training playground that could be advantageous in some settings, notably data-scarce ones. I then address subtle issues that may arise when porting reinforcement learning techniques to the diffusion context, and wonder how such exploration problems could be addressed in more diffusion-native ways. I do not have definitive answers, but I do point my fingers in directions I deem interesting. A tutorial follows this thesis, expanding on the destroy-then-generate perspective. A novel kind of probabilistic graphical models is introduced to facilitate the tutorial&#39;s exposition.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/destruction/";
          
        },
      },{id: "post-content-promotion-as-a-strategic-game-how-to-design-agentic-publishers-for-the-evolving-search-ecosystem-in-the-genai-era",
        
          title: "Content Promotion as a Strategic Game: How to Design Agentic Publishers for the...",
        
        description: "With the rise of LLMs, publishers now operate in a dual world where traditional search and chat-like systems coexist. We propose a unified, game-theoretic view of this environment and highlight different tools, such as Multi-Agent Reinforcement Learning, that support the development of competitive content-optimization agents.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/content-promotion-agent-design/";
          
        },
      },{id: "post-defining-and-quantifying-compositional-structure",
        
          title: "Defining and quantifying compositional structure",
        
        description: "Compositionality is thought to be crucial in human cognition and AI, but we lack a scientific understanding of what it is. What kind of data is compositionally structured? Can we mathematically quantify the amount and character of compositional structure? This blog post introduces a novel approach for doing so, building off of existing tools from algorithmic information theory that formalize notions of complexity and structure. The mathematical definition of compositionality that we&#39;ll come to is rigorous, precise, and general, and the hope is that it can inspire novel research directions in AI for uncovering compositional structure in natural data.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/compositionality/";
          
        },
      },{id: "post-can-coding-agents-be-general-agents",
        
          title: "Can Coding Agents be General Agents?",
        
        description: "As coding agents have seen rapid capability and adoption gains, users are applying them to general tasks beyond software engineering. In this post, we investigate whether coding agents can successfully generalize to end-to-end business process automation. We identify gaps in current evaluations, and conduct a case study to evaluate a coding agent on practical business tasks in an open-core Enterprise Resource Planning system. We find that the agent reliably completes simple tasks but exhibits characteristic failures on complex tasks, suggesting that bridging domain logic and code execution is a key bottleneck to generalizability.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/coding-agents/";
          
        },
      },{id: "post-chunktabpfn-training-free-long-context",
        
          title: "ChunkTabPFN: Training-free Long Context",
        
        description: "Tabular foundation models struggle with large datasets due to the quadratic attention. While methods like FlashAttention promise scalability, practical challenges persist in their application to tabular foundation models. Our work resolves these hurdles, enabling efficient attention, and reveals that contrary to the eariler reports, TabPFN&#39;s performance improves with larger contexts, highlighting its inherent robustness and minimal fine-tuning needs when scaling to complex, long datasets from the TabArena benchmark.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/chunked-tabpfn/";
          
        },
      },{id: "post-budget-alignment-making-models-reason-in-the-user-39-s-language",
        
          title: "Budget Alignment: Making Models Reason in the User&#39;s Language",
        
        description: "We explore a two step multilingual alignment recipe for large language models to keep reasoning and answers in the user language while preserving accuracy.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/budget-alignment/";
          
        },
      },{id: "post-boundlessness-overtaking-benchmarks-the-crisis-of-evaluating-ai-scientists",
        
          title: "Boundlessness Overtaking Benchmarks: The Crisis of Evaluating AI Scientists",
        
        description: "As AI systems begin drafting full research reports, our long-standing evaluation mindset is hitting its limits. We are used to benchmarking models on massive data sets with well-defined, comparable metrics. But modern AI-generated science is now judged on only a small number of long, open-ended research outputs, making traditional notions of generalization hard to verify. In the absence of standard evaluation frameworks, researchers find themselves creating case-specific evaluation criteria. This blog is a wake-up call, a look at how quickly LLM-based scientific agents are outgrowing our inherited evaluation paradigms, and why we must rethink our long-held assumptions to build rigorous and standardized ways of assessing this new form of AI-driven scientific work.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/boundlessness-overtaking-benchmarks/";
          
        },
      },{id: "post-the-99-success-paradox-when-near-perfect-retrieval-equals-random-selection",
        
          title: "The 99% Success Paradox: When Near-Perfect Retrieval Equals Random Selection",
        
        description: "For most of the history of information retrieval (IR), search results were designed for human consumers who could scan, filter, and discard irrelevant information on their own. This shaped retrieval systems to optimize for finding and ranking more relevant documents, but not keeping results clean and minimal, as the human was the final filter. However, LLMs have changed that by lacking this filtering ability. To address this, we introduce Bits-over-Random (BoR), a chance-corrected measure of retrieval selectivity that reveals when high success rates mask random-level performance.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/bits-over-random/";
          
        },
      },{id: "post-beyond-the-rerun-why-reproducibility-is-failing-science",
        
          title: "Beyond the Rerun: Why Reproducibility is Failing Science",
        
        description: "Is reproducibility enough? We discuss the current reproducibility crisis and the limitations that focusing solely on this aspect of scientific project quality imposes on science. We propose a broader approach to the problem of scientific debt and outline practical actions researchers can take in their research. We also draw attention to the need for community action on the issue.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/beyond-the-rerun/";
          
        },
      },{id: "post-llm-judges-on-autopilot",
        
          title: "(LLM-)Judges on autopilot",
        
        description: "How do you evaluate Large Language Model (LLM)-based systems in production at scale? Most teams turn to an LLM-as-a-judge: an approach that grasps the nuances of natural language where classical metrics fall short. But these judge models have their own “will”: sometimes they follow instructions precisely, sometimes they don&#39;t. To address this inconsistency, the judge prompt is calibrated to align with known, trusted cases. The problem? Manual calibration is time-consuming and error-prone. In this blog post, we explore auto-calibration techniques inspired by recent prompt-optimization research. We tackle context collapse by iteratively processing data in batches, similarly to a machine learning training pipeline. Along the way, we share some surprising findings about what works and what doesn&#39;t—including cases where simpler approaches outperform more sophisticated ones.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/auto-calibration/";
          
        },
      },{id: "post-the-adversarial-conditioning-paradox-why-attacked-inputs-are-more-stable-not-less",
        
          title: "The Adversarial Conditioning Paradox: Why Attacked Inputs Are More Stable, Not Less",
        
        description: "Adversarial inputs exhibit systematically lower Jacobian condition numbers at early transformer layers—the opposite of our initial hypothesis that attacks exploit unstable regions. This paradox reveals that adversarial attacks succeed by finding well-conditioned directions that cross decision boundaries.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/adversarial-conditioning-paradox/";
          
        },
      },{id: "post-a-human-centric-framework-for-debating-the-ethics-of-ai-consciousness-under-uncertainty",
        
          title: "A Human-centric Framework for Debating the Ethics of AI Consciousness Under Uncertainty",
        
        description: "As AI systems become increasingly sophisticated, questions about machine consciousness and its ethical implications have moved from fringe speculation to mainstream academic debate. We address these limitations through a structured three-level framework grounded in philosophical uncertainty.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2026/a-human-centric-framework-for-debating-the-ethics-of-ai-consciousness-under-uncertainty/";
          
        },
      },{id: "post-",
        
          title: "",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2025/2026-04-27-hallucination-cs/";
          
        },
      },{id: "post-",
        
          title: "",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/2026/blog/2025/2026-04-27-egraph-symreg/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/2026/books/the_godfather/";
            },},{id: "news-a-simple-inline-announcement",
          title: 'A simple inline announcement.',
          description: "",
          section: "News",},{id: "news-a-long-announcement-with-details",
          title: 'A long announcement with details',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/2026/news/announcement_2/";
            },},{id: "news-a-simple-inline-announcement-with-markdown-emoji-sparkles-smile",
          title: 'A simple inline announcement with Markdown emoji! :sparkles: :smile:',
          description: "",
          section: "News",},{id: "projects-project-1",
          title: 'project 1',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/1_project/";
            },},{id: "projects-project-2",
          title: 'project 2',
          description: "a project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/2_project/";
            },},{id: "projects-project-3-with-very-long-name",
          title: 'project 3 with very long name',
          description: "a project that redirects to another website",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/3_project/";
            },},{id: "projects-project-4",
          title: 'project 4',
          description: "another without an image",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/4_project/";
            },},{id: "projects-project-5",
          title: 'project 5',
          description: "a project with a background image",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/5_project/";
            },},{id: "projects-project-6",
          title: 'project 6',
          description: "a project with no image",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/6_project/";
            },},{id: "projects-project-7",
          title: 'project 7',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/7_project/";
            },},{id: "projects-project-8",
          title: 'project 8',
          description: "an other project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/8_project/";
            },},{id: "projects-project-9",
          title: 'project 9',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/2026/projects/9_project/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%79%6F%75@%65%78%61%6D%70%6C%65.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-inspire',
        title: 'Inspire HEP',
        section: 'Socials',
        handler: () => {
          window.open("https://inspirehep.net/authors/1010907", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/2026/feed.xml", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=qc6CJjYAAAAJ", "_blank");
        },
      },{
        id: 'social-custom_social',
        title: 'Custom_social',
        section: 'Socials',
        handler: () => {
          window.open("https://www.alberteinstein.com/", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
