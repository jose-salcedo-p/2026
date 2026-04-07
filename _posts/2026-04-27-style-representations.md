---
layout: distill
title: Artistic Style and the Play of Neural Style Representations
description: How do neural networks percieve the complex human construct of artistic style? We explore the dynamic interplay between diverse machine representations of style and style definitions. We reveal a profound divergence where models often reject established historical narratives in favour of their own perceptual truths.
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
  - name: Abhishek Dangeti
    affiliations:
      name: TCS Research, India
  - name: Pavan Gajula
    affiliations:
      name: TCS Research, India
  - name: Vikram Jamwal
    affiliations:
      name: TCS Research, India
  - name: Vivek Srivastava
    affiliations:
      name: TCS Research, India


# must be the exact same name as your blogpost
bibliography: 2026-04-27-style-representations.bib

toc:
  - name: The Chameleon Concept-Defining and Operationalizing "Style"
  - name: The Players-A Taxonomy of Neural Representations
    subsections:
      - name: The Generalists (Generic Task-Based)
      - name: The Statisticians (Style Feature-Based)
      - name: The Synthesizers (Style-Transfer)
      - name: The Linguists (Language-Based)
      - name: The Specialists (Style-Trained)
  - name: The Analysis-Effectiveness in the Unsupervised Arena
    subsections:
      - name: Insight I. The Failure of Generality in Disentanglement
      - name: Insight II. The Great Divergence-Machine Perception vs. Art History
      - name: Insight III. The Triumph of Synthesizers in Perceptual Definitions
      - name: Insight IV. The Semantic Ceiling of Vision-Language Models
      - name: Insight V. The Hidden Geometry is Hierarchical
  - name: Conclusion-The Unresolved Play and the Path Forward

_styles: >
  p {      
    text-align: justify;
  }
---

<div class="caption" style="margin-bottom:-20px">
   <p><i> <b>Figure 1:</b> The figure shows a sample of the WikiArt dataset, which has ground truth clusters depicting various art movements from Baroque to Mannerism. The above artworks are re-clustered using the neural style representation $F_{StyleShot}$; the infographics show the distribution of ground-truth in different clusters. Even though the re-clustering through $F_{StyleShot}$ representation does not produce clusters that adhere to ground truth, we can see that the artworks present in the same cluster are similar to each other in terms of style, highlighting a fundamental discrepancy between historical art categorizations and perceptual style representations..</i></p>
</div>

{% include figure.liquid path="assets/img/2026-04-27-style-representations/teaser.png" class="img-fluid" %}
  

Artistic style is central to visual art, embodying an artist’s identity, emotional expression, cultural context, and aesthetic choices. In the realm of computer vision, "style" has evolved into a critical dimension for understanding images beyond mere object categories. We have developed diverse architectures \- from convolutional networks to generative models and vision-language systems \- each claiming to capture artistic style effectively.

But how well do these neural representations actually "play" with the complex, multifaceted concept of artistic style? When stripped of supervised labels and left to organize artworks on their own, do these models rediscover the history of art, or do they reveal a fundamental disconnect between machine perception and human categorization?

We explore this by analyzing 16 state-of-the-art neural style representations through the lens of *unsupervised clustering*, using visual art as a rigorous testbed.

## The Chameleon Concept-Defining and Operationalizing "Style"

Before we can evaluate how well a neural network represents style, we face a fundamental scientific hurdle: the lack of a single, universally accepted ground-truth definition. Artistic style is a notorious chameleon; it is a complex amalgamation of an artist's individual "hand," broad historical movements, technical medium, and cultural context.

The machine learning and art history communities have wrestled with this ambiguity, proposing varied interpretations. In the literature, style has been treated not as a monolith, but as myriad distinct concepts:

* **Statistical properties** latent within neural representations <d-cite key="gatysnst"></d-cite>.  
* The **distinctive signatures** belonging to specific artists or historical movements  <d-cite key="elgammal2017"></d-cite>.  
* **Low-level visual attributes** such as color palettes, textures, or brushstrokes <d-cite key="paint-st"></d-cite>.  
* **Domain-specific distributions** that distinguish one modality from another <d-cite key="zhu2020"></d-cite>.  
* **Perceptually significant cues** derived from human behavioral studies <d-cite key="muller1979"></d-cite>.  
* **Transformative operations** that can be applied to content to alter its appearance <d-cite key="huang2025"></d-cite>.

Recognizing this rich and varied landscape, our study does not rely on a single definition. Instead, we rigorously probe neural representations through four distinct, operational lenses that reflect these established views, isolating different aspects of aesthetic identity through specific benchmarks:

* **The Historical Lens (Art Movements):** Style defined as broad, socially-constructed categories tied to specific periods and philosophies (e.g., Baroque, Cubism). *Aligns with definitions by Elgammal et al. (2017)<d-cite key="elgammal2017"></d-cite>.* (Dataset: WikiArt-ArtMove)  
* **The Individual Lens (Artistic Signature):** Style defined as the unique, consistent visual fingerprint of a specific creator across their body of work. *Aligns with definitions by Elgammal et al. (2017)<d-cite key="elgammal2017"></d-cite>.* (Dataset: WikiArt-Artist)  
* **The Perceptual Lens (Visual Attributes):**  Style reduced to pure, low-level visual mechanics - isolated textures, color palettes, and brushstrokes - separated from semantic content. *Aligns with notions from Gatys et al. (2015) <d-cite key="gatysnst"></d-cite>, Liu et al. (2024) <d-cite key="paint-st"></d-cite>, and Huang et al. (2025)<d-cite key="huang2025"></d-cite>.* (Dataset: Synthetic Curated Datasets)  
* **The Disentanglement Lens (Style as Domain):** Style defined simply as the "manner" of depiction distinct from the "object" being depicted (e.g., recognizing a "sketch" vs. a "painting"). *Aligns with domain-specific definitions by Zhu et al. (2020) <d-cite key="zhu2020"></d-cite>.* (Dataset: DomainNet)

<div class="caption" style="margin-bottom:-20px">
    <p><i><b>Figure 2:</b> Representative samples from different datasets: (a) WikiArt Art Movememt, (b) WikiArt Artist, (b) Synthetic Curated and (d) DomainNet.</i></p>
</div>
<div class="caption" style="margin-bottom:-20px">
    <b>(a) WikiArt Art Movements:</b> Art movements representing aesthetic styles of artist groups during specific historical periods (e.g., Realism, Baroque, Expressionism, Renaissance)
</div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/wikiart_artmove.jpg" class="img-fluid" %}
<div class="caption" style="margin-bottom:-20px">
    <b>(b) WikiArt Artist:</b> Individual artist signatures reflecting personal styles developed through life experiences and artistic preferences
</div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/wikiart_artist.jpg" class="img-fluid" %}
<div class="caption" style="margin-bottom:-20px">
    <b>(c) Synthetic Curated:</b> Style transfer-based definitions using color, texture, and shading attributes from reference images
</div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/styleshot.jpg" class="img-fluid" %}
<div class="caption" style="margin-bottom:-20px">
    <b>(d) DomainNet:</b> Domain-based styles defined by artistic medium (clipart, infographics, etc.) across object categories
</div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/domainnet.jpg" class="img-fluid" %}





## The Players-A Taxonomy of Neural Representations

To truly understand how AI grasps a complex concept like artistic style, we cannot rely on a single model type. In deep learning, architecture is destiny: a model's training objective and structure fundamentally dictate what information it discards and what it deems essential. A network built to identify stop signs develops a very different "visual cortex" than one built to generate surrealist paintings.

<div class="caption" style="margin-bottom:-20px">
   <p><i> <b>Figure 3:</b> The sub-figures 1-16 show the Architectures for extracting various neural style representations where representation 1-3 are Generic Task-based Models, 4-6 are from Style Feature-based Models, 7-11 are from Style Transfer based Models, 12-13 are from Language models and 14-16 are from Style Trained models. </i> </p>
</div>
  {% include figure.liquid path="assets/img/2026-04-27-style-representations/feat_arc.png" class="img-fluid" %}
  

If we want to know if machines can perceive style unsupervised, we must cast a wide net across the entire ecosystem of modern AI. We assembled a diverse cast of 16 state-of-the-art neural representations, categorizing them into five distinct families based on their inherent "worldview":

### The Generalists (Generic Task-Based)

These are the foundation models of modern computer vision - the versatile workhorses trained on massive, diverse datasets (like ImageNet or LAION) for broad tasks like classification or image-text alignment.

* **Examples:** **DenseNet** <d-cite key="densenet"></d-cite> (supervised CNN), **DINOv2** <d-cite key="dinov2"></d-cite> (self-supervised Transformer), and **LongCLIP** <d-cite key="longclip"></d-cite>(vision-language contrastive learning).  
* **The Perspective:** These models are experts at semantic content - knowing *what* is in an image. The critical question is: in learning to recognize a "dog," do their rich feature spaces implicitly capture the stylistic manner in which the dog is painted? Are they jacks-of-all-trades, or masters of content only?

### The Statisticians (Style Feature-Based)

This family is rooted in the breakthrough moment of neural style transfer. Instead of using raw network outputs, these methods apply explicit mathematical operations to feature maps intended to isolate texture and discard spatial structure.

* **Examples:** **Gram Matrices ($F_{Gram}$)** <d-cite key="gatysnst"></d-cite> extracted from VGG networks. By calculating feature correlations, they capture the statistical "fingerprint" of textures and brushstrokes globally across an image. We also use mathematical correlation of gram matrices and consine similarity calculated on the representations extracted from the VGG network ($F_{g.c}$) <d-cite key="gcpaper"></d-cite>.  Furthermore, we explore modern variants like **Introspective Style Attribution** <d-cite key="introstyle"></d-cite> from diffusion models.  
* **The Perspective:** Style is math. It is a statistical distribution of low-level patterns, separate from the arrangement of objects.

### The Synthesizers (Style-Transfer)

These representations come from models explicitly engineered to *create* or *manipulate* art.

* **Examples:** The latent space of generative models like **StyleGAN** <d-cite key="stylegan"></d-cite>, Transformer-based transfer models like **StyleShot** <d-cite key="styleshot"></d-cite>, and diffusion-based editing models like **DEADiff** <d-cite key="deaddiff"></d-cite>.  
* **The Perspective:** The strongest hypothesis: ability implies understanding. If a model's architecture is designed to successfully separate style from content to generate a new image in the style of Van Gogh, surely its internal representations must hold a highly disentangled, accurate blueprint of that style.

### The Linguists (Language-Based)

This is a novel approach leveraging the explosion of Large Vision-Language Models (LVLMs). Style is often described with words, e.g., "gloomy," "geometric," "gestural."

* **Examples:** We prompt advanced LVLMs <d-cite key="internvl2"></d-cite> to generate rich **Style Captions** or structured **Concept Annotations** for artworks, then encode that text into embeddings <d-cite key="longclip"></d-cite>.  
* **The Perspective:** Style is semantic. By bridging vision and language, these models translate visual aesthetics into rich textual descriptions, encoding style as meaning rather than just pixel patterns.

### The Specialists (Style-Trained)

These models have an unfair advantage: they have seen the textbooks. They are supervised directly on art historical data.

* **Examples:** **Contrastive Style Descriptors ($F_{CSD}$)** <d-cite key="csd"></d-cite> trained on artistic tags, or Vision Transformers <d-cite key="vit"></d-cite> fine-tuned specifically to classify WikiArt artist and movement labels ($F_{Artist}$, $F_{ArtMove}$).  
* **The Perspective:** The expert approach. These models have been explicitly taught human categories of art. The question for unsupervised clustering is: once the teacher leaves the room (removing the labels), do they still organize new art according to those rules?

<div class="caption">
    <p><i><b>Table 1:</b> Summary of style representations explored.</i></p>
</div>
<table><thead>
  <tr>
    <th>Category</th>
    <th>Model</th>
    <th>Source/Training</th>
    <th>Representation Extracted</th>
  </tr></thead>
<tbody>
  <tr>
    <td rowspan="3">Generic Task-based</td>
      <td>DenseNet <br> (F<sub>Dense</sub>)</td>
    <td>ImageNet CNN <d-cite key="densenet"></d-cite> </td>
    <td>1024-dim pooled final layer features</td>
  </tr>
  <tr>
      <td>Vision--Language <br> (F<sub>LongCLIP</sub>)</td>
    <td>LongCLIP <d-cite key="longclip"></d-cite></td>
    <td>Joint image--text embeddings (long captions)</td>
  </tr>
  <tr>
      <td>Self-supervised <br> (F<sub>DINO</sub>)</td>
    <td>DINOv2 <d-cite key="dinov2"></d-cite></td>
    <td>SSL-based semantic embeddings</td>
  </tr>
  <tr>
    <td rowspan="2">Style Feature-based</td>
      <td>Gram Matrices <br> (F<sub>Gram</sub>, F<sub>g.c</sub>)</td>
    <td>VGG19 conv5_1 <d-cite key="gatysnst"></d-cite><d-cite key="gcpaper"></d-cite></td>
    <td>Gram matrix statistics; cosine similarity variant</td>
  </tr>
  <tr>
      <td>Introspective Style Attribution <br> (F<sub>IntroStyle</sub>)</td>
    <td>Diffusion UNet <d-cite key="introstyle"></d-cite></td>
    <td>Channel-wise mean/variance embeddings</td>
  </tr>
  <tr>
    <td rowspan="5">Style-Transfer</td>
      <td>StyleGAN <br> (F<sub>StyleGAN</sub>)</td>
    <td>GAN <d-cite key="stylegan"></d-cite></td>
    <td>Latent w vector</td>
  </tr>
  <tr>
      <td>Stytr$^2$ <br> (F<sub>Stytr2</sub>)</td>
    <td>Transformer <d-cite key="stytr2"></d-cite></td>
    <td>Encoder outputs from patch embeddings</td>
  </tr>
  <tr>
      <td>StyleShot <br> (F<sub>StyleShot</sub>)</td>
    <td>Transformer <d-cite key="styleshot"></d-cite></td>
    <td>Multi-scale patch embeddings</td>
  </tr>
  <tr>
      <td>Mamba-ST <br> (F<sub>Mamba</sub>)</td>
    <td>VSSM<d-cite key="mambast"></d-cite></td>
    <td>Style encoder representations </td>
  </tr>
  <tr>
      <td>DEADiff <br> (F<sub>DEADiff</sub>)</td>
    <td>Diffusion T2I <d-cite key="deaddiff"></d-cite></td>
    <td>Q-Former embeddings (style disentangled)</td>
  </tr>
  <tr>
    <td rowspan="2">Language-based</td>
      <td>Style Caption <br> (F<sub>StyleCap</sub>)</td>
    <td>InternVL2 <d-cite key="internvl2"></d-cite> + LongCLIP <d-cite key="longclip"></d-cite></td>
    <td>Style captions extracted from image using LVLM and further encoded using text encoder</td>
  </tr>
  <tr>
      <td>Style Concept Annotations <br> (F<sub>Annot</sub>)</td>
    <td>InternVL2 <d-cite key="internvl2"></d-cite> + taxonomy</td>
    <td>Structured annotations across 59 concepts <d-cite key="artfund"></d-cite> obtained from image using LVLM and encoded using text encoder</td>
  </tr>
  <tr>
    <td rowspan="2">Style-Trained</td>
      <td>Contrastive Style Descriptors <br> (F<sub>CSD</sub>)</td>
    <td>ViT on LAION Aesthetics <d-cite key="csd"></d-cite></td>
    <td>Contrastive embeddings with style tags</td>
  </tr>
  <tr>
      <td>Artwork-Trained ViTs</td>
    <td>Fine-tuned on WikiArt</td>
      <td>(i) Art movement (F<sub>ArtMove</sub>), <br> (ii) Artist (F<sub>Artist</sub>)</td>
  </tr>
</tbody></table>

## The Analysis-Effectiveness in the Unsupervised Arena

Having defined our terms and assembled our cast of neural players, we now move to the core of our investigation. We took these 16 diverse representations and dropped them into an unsupervised arena—using clustering algorithms like K-Means <d-cite key="kmeans"></d-cite> and Deep Embedded Clustering (DEC) <d-cite key="dec"></d-cite>—to see how they would organize the world of art without human supervision.

The results are not a simple leaderboard of "best to worst." Instead, they reveal crucial insights about the nature of these architectures and the gap between human definitions of style and machine perception.

Here are five key takeaways for researchers and practitioners in AI and computer vision.

### Insight I. The Failure of Generality in Disentanglement

For a machine to truly grasp style, it must learn to ignore content. It needs to recognize that a charcoal sketch of a clock and a charcoal sketch of a dog share the same "domain" style, while a photo of a clock is fundamentally different.

We tested this using the **DomainNet** dataset, the ultimate test of content-style disentanglement.

* **The Reality Check:** The **Generalists** (like DenseNet or DINOv2) failed this test. Their feature spaces are so heavily optimized for semantic object recognition that they could not "unsee" the objects. They clustered clocks with clocks, regardless of whether they were sketches or paintings.  
* **The Success Story:** The models that succeeded were those explicitly designed for disentanglement. **DEADiff** (a diffusion-based model) and **CSD** (contrastive style descriptors) achieved high scores, successfully grouping images by domain while ignoring the objects within them.

<div class="caption">
    <p><i><b>Table 2: Unsupervised Clustering Performance on DomainNet dataset:</b> This table presents the Adjusted Rand Index (ARI) <d-cite key="ari-metric"></d-cite> and Normalized Mutual Information (NMI) <d-cite key="nmi-metric"></d-cite> scores for a representative set of neural representations using K-Means clustering. The maximum possible score is 1.0. </i></p>
</div>

| Representation Family | Model (F) | Adjusted Rand Index | Normalized Mutual Information | 
| :---- | :---- | :---- | :---- | 
| **Generalist** | $F_{DINO}$ | 0.291 | 0.352 |
| **Synthesizer** | $F_{DEADDiff}$ | 0.733 | 0.736 | 
| **Linguist** | $F_{StyleCap}$ | 0.547 | 0.591 | 
| **Specialist** | $F_{CSD}$ | 0.654 | 0.681 | 


 <div class="caption" style="margin-bottom:-20px">
    <p><i><b>Figure 4:</b> Sample qualitative results of style-based clustering through the $F_{Dense}$ neural feature representation on the DomainNet dataset. </i></p>
</div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/domainnet_dense.PNG" class="img-fluid" %}


> **The Takeaway:** If your application requires separating the "how" from the "what," do not rely on off-the-shelf foundation models. General visual competency does not equate to stylistic disentanglement. You need architectures with explicit biases or training objectives tailored for separating style from content.

### Insight II. The Great Divergence-Machine Perception vs Art History

The most philosophically provocative finding emerged when we tested the models against definitions drawn directly from art history and curation: **Art Movements** (e.g., Cubism, Impressionism) and individual **Artistic Signatures** (e.g., Picasso, Van Gogh).

We asked the models to cluster tens of thousands of paintings from WikiArt without supervision. We then measured how well these machine-generated clusters aligned with the ground-truth historical labels for movements and artists.

* **The Quantitative Failure:** Across the board, performance was consistently low for both tasks. No neural representation could reliably reconstruct the categories of art history unsupervised. Notably, most models found clustering by **individual artist** even more difficult than clustering by broad **movement**, highlighting the immense challenge of capturing a creator's evolving "hand" without explicit labels.

<div class="caption">
    <p><i><b>Table 3: Unsupervised Clustering Performance on WikiArt History</b> This table presents the Adjusted Rand Index (ARI) <d-cite key="ari-metric"></d-cite> and Normalized Mutual Information (NMI) <d-cite key="nmi-metric"></d-cite> scores for a representative set of neural representations using K-Means clustering. The maximum possible score is 1.0. <br> Note: $F_{Artist}$ is supervised directly on artist labels. While its performance on the Artist Signature task is higher than others, it is still far from perfect, and its ability to generalize to the related Art Movement task remains low, highlighting the challenge of this domain.</i></p>
</div>

| Representation Family | Model (F) | Art Movement (ARI) | Art Movement (NMI) | Artist Signature (ARI) | Artist Signature (NMI) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Generalist** | $F_{DINO}$ | 0.077 |  0.217 | 0.074 | 0.273 |
| **Statistician** | $F_{Gram}$ | 0.068 | 0.223  | 0.043 | 0.219 |
| **Synthesizer** | $F_{StyleShot}$ | 0.060 | 0.213  | 0.056 | 0.253 |
| **Linguist** | $F_{StyleCap}$ | 0.080 | 0.228 | 0.075 | 0.284 |
| **Specialist** | $F_{Artist}$\* | **0.087** |  **0.249** | **0.346** | **0.510** |



* **The Qualitative Twist:** Why did they fail? Because art history is a social, temporal, and biographical construct, not just a visual one.  
  * A "Renaissance" painting and a "Baroque" painting might share more sheer visual similarity in palette and subject than two distinct "Post-Impressionist" works.  
  * An artist like Picasso radically changed his style over time (from Blue Period to Cubism). Grouping all his works together requires external biographical knowledge that an unsupervised visual model simply doesn't have.  
* **The Human Validation:** Crucially, our human study revealed that the machines weren't necessarily "wrong." Participants with art backgrounds often rated the clusters generated by models like **StyleShot** (a Synthesizer) as *more visually cohesive* than the ground-truth historical clusters.

<div class="caption" style="margin-bottom:-20px">
   <p><i> <b>Figure 5:</b> Sample qualitative results of style-based clustering through the $F_{StyleShot}$ neural feature representations on the <i>Wikiart Artist</i> dataset.</i></p>
</div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/artist_styleshot.PNG" class="img-fluid" %}

<div class="caption" style="margin-bottom:-20px">
    <p><i><b>Figure 6:</b> Results from for the survey conducted on the clusters obtained from 450 samples from the WikiArt-ArtMove dataset. Clusters were obtained on the subset using $F_{Dense}$, $F_{StyleCap}$, $F_{StyleShot}$ and $F_{CSD}$ features and K-Means clustering model. The survey was conducted on the art movement ground truth as well. The survey included questions relating to cluster cohesion, cluster separation, and overall clustering quality. Overall, 25 participants responded to the survey.</i></p>
</div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/survey_box_plot.jpg" class="img-fluid" %}
  
> **The Takeaway:** Researchers must be cautious when using human-defined labels, whether broad movements or individual artist names, as ground truth for visual style. Low supervised metrics do not mean the representation is "bad"; it often means the model has discovered a valid *perceptual* reality that simply disagrees with the complex, context-dependent narratives of art history.

### Insight III. The Triumph of Synthesizers in Perceptual Definitions

If art history is too abstract, what happens when we define style purely by physical features - texture, color, and brushstroke patterns?

We tested this using our **Synthetic Curated Datasets**, where style was rigorously controlled via style transfer algorithms.

<div class="caption">
    <p><i><b>Table 4: Unsupervised Clustering Performance on Synthetic Curated dataset:</b> This table presents the Adjusted Rand Index (ARI) <d-cite key="ari-metric"></d-cite> and Normalized Mutual Information (NMI) <d-cite key="nmi-metric"></d-cite> scores for a representative set of neural representations using K-Means clustering. The maximum possible score is 1.0. </i></p>
</div>

| Representation Family | Model (F) | Adjusted Rand Index | Normalized Mutual Information | 
| :---- | :---- | :---- | :---- | 
| **Generalist** | $F_{LongCLIP}$ | 0.541 | 0.592 | 
| **Statistician** | $F_{Gram}$ | 0.837 | 0.932 | 
| **Synthesizer-I** | $F_{Stytr2}$ | 0.91 | 0.95 |
| **Synthesizer-II** | $F_{Mamba}$ | 0.91 | 0.96 |
| **Synthesizer-III** | $F_{DEADiff}$ | 0.84 | 0.91 |
| **Linguist** | $F_{StyleCap}$ | 0.347 | 0.565 | 
| **Specialist** | $F_{CSD}$| 0.96 | 0.98 |

<div class="caption" style="margin-bottom:-20px">
    <p><i><b>Figure 7:</b> Sample qualitative results of style-based clustering through the $F_{Stytr2}$ neural feature representations on the <i>Synethic Curated</i> dataset.</i></p>
</div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/styleshot_stytr2.jpg" class="img-fluid" %}

* **The Clear Winners:** Under this strict perceptual definition, the **Synthesizers** reigned supreme. Representations derived from models built to *create* art - specifically transformer-based style transfer models like **StyleShot** and **Stytr²** - achieved near-perfect clustering scores.  
* **Why it Makes Sense:** To successfully transfer a style, these architectures must learn to perfectly isolate low-level aesthetic textures from structure. Their internal representations are, by design, the purest distillation of this "physical" definition of style.

>**The Takeaway:** For practitioners building applications focused on visual aesthetics - like texture or color palette matching - architectures derived from style-transfer or synthesis tasks offer the most robust and accurate representations



### Insight IV. The Semantic Ceiling of Vision-Language Models

Given the immense capabilities of modern Large Vision-Language Models (LVLMs), we hypothesized that our sophisticated language-based representations ($F_{StyleCap}$, $F_{Annot}$) - which encode rich textual descriptions of artwork - might bridge the gap between visual perception and human concepts.
The reality, however, pointed to significant limitations. These advanced linguistic models posted surprisingly "average" performance across the entire spectrum of definitions. They could not match the raw, low-level perceptual precision of the Synthesizers on texture tasks, nor did their semantic knowledge allow them to better reconstruct the complex historical categories of WikiArt compared to simpler baselines.

<div class="caption" style="margin-bottom:-20px">
    <p><i><b>Figure 8:</b> Sample qualitative results of style-based clustering through the $F_{StyleCap}$ neural feature representations on the different datasets.</i></p>
</div>
<div class="caption" style="margin-bottom:-20px">
    <b>(a)</b> Style clusters and class distribution using $F_{StyleCap}$ for <i>Wikiart Art Movement</i> dataset
    </div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/artmove_stylecap.PNG" class="img-fluid" %}
<div class="caption" style="margin-bottom:-20px">
    <b>(b)</b> Style clusters and class distribution using $F_{StyleCap}$ for <i>Wikiart Artist</i> dataset
    </div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/artist_stylecap.PNG" class="img-fluid" %}
<div class="caption" style="margin-bottom:-20px">
    <b>(c)</b> Style clusters and class distribution using $F_{StyleCap}$ for <i>Synthetically Curated</i> dataset
    </div>
{% include figure.liquid path="assets/img/2026-04-27-style-representations/styleshot_stylecap.PNG" class="img-fluid" %}

> The Takeaway: Despite their linguistic prowess, current vision-language models appear to hit a "semantic ceiling" in the arts. They possess a broad, descriptive grasp of style concepts, but still lack the deep, nuanced visual understanding required to truly master artistic style in either its historical or purely perceptual forms.

### Insight V. The Hidden Geometry is Hierarchical

Finally, our analysis challenges a fundamental assumption in many ML approaches to style: that it is a flat classification problem.

When we analyzed the clustering dynamics, we found strong evidence that the latent space of artistic style is inherently hierarchical.

1. **Super-Clusters:** Many representations (especially **Statisticians** like Gram Matrices) initially grouped massive amounts of varied art into a few giant "super-clusters."  
2. **Sub-Structures:** When we applied sub-clustering to these groups, they decomposed into distinct, coherent sub-styles. The model hadn't failed to see the difference; it had simply grouped them at a high level of abstraction.

<div class="caption" style="margin-bottom:-20px">
    <p><i><b>Figure 9:</b> Sub-clustering on a single cluster from the results of the WikiArt-AM dataset for $F_{StyleCap}$ features through the DEC model. (a) shows the distribution of the number of samples in each cluster before and after sub-clustering. (b) shows the qualitative results after we obtain the sub clusters of a single cluster with most samples. Samples on the left are from the original cluster and samples on the right are from the sub-clusters.</i></p>
</div>
  {% include figure.liquid path="assets/img/2026-04-27-style-representations/Subclustering.png" class="img-fluid" %}
  

3. **Semantic Trees:** Using our **Linguist** representations ($F_{StyleCap}$), we generated dendrograms that perfectly mirrored human intuition, automatically organizing art from broad philosophies (Abstract vs. Representational) down to specific movements, and finally to individual artistic signatures at the leaf nodes.

<div class="caption" style="margin-bottom:-20px">
    <p><i><b>Figure 10:</b> Hierarchical distribution of Art Movements in the WikiArt dataset. We showcase the sample art movement-wise artworks distribution dendrogram in (b) and the respective sample artworks in (c). The dendrogram is obtained with 27 art movements with the $F_{StyleCap}$ features. We display the top 5 art movements. We observe that the WikiArt dataset contains hierarchies showcasing a higher level of similarity between art movements at the top of the hierarchy. The art movements get separated into distinct clusters when we move down the hierarchy.</i></p>
  </div>
  <div class="caption" style="margin-bottom:-20px">
    <b>(a)</b> Complete dendrogram for the WikiArt dataset
    </div>
  {% include figure.liquid path="assets/img/2026-04-27-style-representations/Dendrogram.png" class="img-fluid" %}
  <div class="caption" style="margin-bottom:-20px">
    <b>(b)</b> Distribution of artworks at each level of the dendrogram based on Art Movement
    </div>
  {% include figure.liquid path="assets/img/2026-04-27-style-representations/Hier_Distribution.png" class="img-fluid" %}
  <div class="caption" style="margin-bottom:-20px">
    <b>(c)</b> Sample Artworks from each level of the hierarchy based on Art Movement categorization
  </div>
  {% include figure.liquid path="assets/img/2026-04-27-style-representations/Hier_Qual.png" class="img-fluid" %}
  
  
>**The Takeaway:** Stop treating artistic style as a flat list of mutually exclusive labels. It is a nested structure. Future evaluation metrics and model architectures should explicitly account for this hierarchy, rewarding models that capture relationships at multiple levels of granularity - from the broad stroke of a movement to the unique signature of a master.

## Conclusion-The Unresolved Play and the Path Forward

The "play" of neural style representations proves to be complex and far from finished. Our expansive analysis reveals a fragmented landscape for neural representations. There is no single universal solution for capturing artistic style; instead, we find deep specializations alongside significant gaps in the machine understanding of style. *Ultimately, we demonstrate that a neural representation embodies only the specific notion of style dictated by its architecture and training data*.

Because "style" itself is a chameleon, the search for a single "style embedding" to rule them all is futile. A model that perfects the capture of perceptual textures (like a **Synthesizer**) may be completely blind to the socio-historical context that defines a movement. Crucially, we found that even sophisticated **vision-language models** appear to hit a "semantic ceiling", offering only an average performance across the spectrum and failing to bridge the gap between raw visual mechanics and complex human concepts.

Most critically, our investigation into unsupervised clustering uncovered a fundamental divergence: a neural network using most popular representations, left to organize art history without supervision, builds a taxonomy based on visual logic - a "perceptual truth" - that rarely aligns perfectly with the biographical and temporal narratives of human art history.

**The Path Forward for the Community:**

This research positions visual art as a rigorous testbed for advancing representation learning. The failures and successes documented here chart a more nuanced course for future research:

1. **Develop Representations Along Multiple Directions:** The community must move beyond a monolithic view of style. Current research trends often cater to only one definition at a time (e.g., optimizing purely for texture synthesis or purely for domain disentanglement). The path forward requires acknowledging these distinct, valid definitions and developing specialized research tracks for historical, perceptual, and semantic notions of style, rather than forcing one architecture to solve them all.  
2. **Embrace Hierarchy:** We should go beyond the flat classification benchmarks for style. Future models and evaluation metrics should explicitly account for the nested nature of aesthetics, rewarding systems that capture relationships at multiple levels of granularity - from broad philosophical movements down to individual artistic signatures.  
3. **Rethink Ground Truth:** We need to reconsider how we evaluate unsupervised style learning. Low alignment with WikiArt labels is not necessarily a failure; it may indicate the discovery of valid alternative visual structures. We need new metrics that balance historical fidelity with perceptual coherence.

By addressing these challenges, we do more than just build better tools for digital art history. We push the boundaries of how artificial intelligence grasps abstraction, context, and the deeply human dimensions of visual communication.
