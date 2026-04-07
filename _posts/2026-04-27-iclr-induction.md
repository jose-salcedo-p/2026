---
layout: distill
title: In-context learning of representations can be explained by induction circuits
description: "Park et al., 2025 find that when large language models process random walks on a graph in-context, the geometry of their token representations comes to mirror the graph's connectivity structure. This suggests a two-step mechanism: the model first reshapes its representations to reflect the graph structure, then operates over them to predict valid next steps. We offer a simpler mechanistic explanation. The in-context graph tracing task can be solved by induction circuits, which implement a simple rule: if token B followed token A earlier in the sequence, predict B the next time A appears. Since consecutive tokens in a random walk are always graph neighbors, this rule naturally produces valid steps. Ablating the attention heads that comprise induction circuits substantially degrades task performance, compared to ablating random heads. As for the geometric structure of representations, we propose that induction circuits can account for this too: their previous-token heads mix each token's representation with that of its predecessor, always a graph neighbor in a random walk. We show that a single round of such 'neighbor mixing' applied to random embeddings is sufficient to recreate the graph-like PCA structure. These results suggest that the observed representation geometry is a byproduct of how the model solves the task, not the means by which it does so."
date: 2026-04-27
future: true
htmlwidgets: true
hidden: true

# Mermaid diagrams
mermaid:
  enabled: true
  zoomable: true

authors:
  - name: Andy Arditi
    url: "https://andyrdt.com"
    affiliations:
      name: Northeastern University

# must be the exact same name as your blogpost
bibliography: 2026-04-27-iclr-induction.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Recapitulation and reproduction of Park et al., 2025
    subsections:
      - name: The grid tracing task
      - name: "Reproduction and Park et al.'s interpretation"
  - name: "A simpler explanation: induction circuits"
    subsections:
      - name: Testing the induction hypothesis
      - name: Results
  - name: Previous-token mixing can account for representation geometry
    subsections:
      - name: The neighbor-mixing hypothesis
      - name: A toy model of previous-token mixing
      - name: Evidence of neighbor mixing in individual model activations
  - name: Limitations
  - name: Conclusion

_styles: >
  /* Plot images */
  .plot-container { position: relative; width: 100%; margin-bottom: 1rem; }
  .plot-container .plot-fallback { display: block; width: 100%; height: auto; }
  .plot-container a { border-bottom: none; position: relative; display: block; }
  .plot-container a:hover { border-bottom: none; }
  .plot-container a img { cursor: pointer; transition: opacity 0.15s; }
  .plot-container a img:hover { opacity: 0.85; }
  .plot-container a::after {
    content: "Click for interactive version";
    position: absolute; bottom: 6px; right: 6px;
    background: rgba(0,0,0,0.55); color: #fff;
    font-size: 10.5px; padding: 2px 8px; border-radius: 4px; line-height: 1.3;
    opacity: 0; transition: opacity 0.15s; pointer-events: none;
  }
  .plot-container a:hover::after { opacity: 1; }

  /* Two plots side-by-side */
  .plot-row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 0.5rem; }
  .plot-row .plot-container { flex: 1 1 400px; min-width: 300px; }
  .plot-row .plot-container.w-55 { flex: 55 1 300px; }
  .plot-row .plot-container.w-45 { flex: 45 1 300px; }

  /* Three plots side-by-side */
  .plot-row-triple { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 0.5rem; }
  .plot-row-triple .plot-container { flex: 1 1 280px; min-width: 250px; }

  /* Standalone square plot (e.g., bigram PCA) */
  .plot-container.plot-square { max-width: 550px; margin-left: auto; margin-right: auto; }

---

Park et al., 2025 <d-cite key="park2025iclr"></d-cite> show that when large language models (LLMs) process random walks on a graph, their internal representations come to mirror the underlying graph's structure. The authors interpret this broadly, suggesting that LLMs can "manipulate their representations in order to reflect concept semantics specified entirely in-context". In this post, we take a closer look at the underlying mechanism, and suggest a simpler explanation. We argue that induction circuits <d-cite key="elhage2021mathematical"/>, <d-cite key="olsson2022incontext"/>, a well-known mechanism for in-context bigram recall, suffice to explain both the task performance and the representation geometry observed by Park et al.

## Recapitulation and reproduction of Park et al., 2025

We begin by describing the experimental setup of Park et al., 2025 <d-cite key="park2025iclr"></d-cite> and reproducing their main results on Llama-3.1-8B <d-cite key="grattafiori2024llama3"></d-cite>.

<div id="fig-1" class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/html/2026-04-27-iclr-induction/fig_1/park_fig_1.png" class="" %}
    </div>
</div>
<div class="caption">
   <b>Figure 1.</b> <b>Overview of Park et al.</b> <b>(a)</b> The grid tracing task uses a $4 {\times} 4$ grid of words. <b>(b)</b> Models observe random walks on the grid (e.g., <code>&nbsp;apple</code><code>&nbsp;bird</code><code>&nbsp;milk</code><code>&nbsp;sand</code><code>&nbsp;sun</code><code>&nbsp;plane</code><code>&nbsp;opera</code><code>&nbsp;...</code>) where consecutive words are always neighbors. As the sequence length grows, the model begins to predict valid next words based on the graph structure. <b>(c)</b> Surprisingly, the geometry of the model's effective token representations mirrors that of the grid structure: the model comes to represent each node adjacent to its neighbor in activation space.
   <br>
   <i>
   Figure reproduced from Park et al.
   </i>
</div>

### The grid tracing task

Park et al. introduce the *in-context graph tracing* task. The task involves a predefined graph $$\mathcal{G} = (\mathcal{T}, E)$$ where nodes $$\mathcal{T} = \{\tau_1, \tau_2, \ldots, \tau_n\}$$ are referenced via tokens (e.g., <code>&nbsp;apple</code>, <code>&nbsp;bird</code>, <code>&nbsp;math</code>, etc.). The graph's connectivity structure $$E$$ is defined independently of any semantic relationships between the tokens. The model is provided with traces of random walks on this graph as context and must predict valid next nodes based on the learned connectivity structure. While Park et al. study graph tracing on three different graph structures, we focus exclusively on their $$4{\times}4$$ square grid setting (<a href="#fig-1">Figure 1</a>). We provide details of the experimental setup below; our methodology always follows Park et al. except when otherwise noted.

**Grid structure.** The task uses a $$4{\times}4$$ grid of 16 distinct word tokens: <code>&nbsp;apple</code>, <code>&nbsp;bird</code>, <code>&nbsp;car</code>, <code>&nbsp;egg</code>, <code>&nbsp;house</code>, <code>&nbsp;milk</code>, <code>&nbsp;plane</code>, <code>&nbsp;opera</code>, <code>&nbsp;box</code>, <code>&nbsp;sand</code>, <code>&nbsp;sun</code>, <code>&nbsp;mango</code>, <code>&nbsp;rock</code>, <code>&nbsp;math</code>, <code>&nbsp;code</code>, <code>&nbsp;phone</code>.<d-footnote>All words tokenize to exactly one token when preceded by a space (e.g., <code>&nbsp;apple</code> is a single token). Sequences are tokenized with a leading space before the first word, ensuring single-token-per-word encoding.</d-footnote> Each word occupies a unique position in the grid. Two words are *neighbors* if they are horizontally or vertically adjacent (not diagonally). This defines an adjacency matrix $$A \in \{0,1\}^{16 \times 16}$$ where $$A_{ij} = 1$$ if and only if words $$i$$ and $$j$$ are neighbors.

**Random walk generation.** Sequences are generated by random walks on this grid: starting from a random position, the walk moves to a uniformly random neighbor at each step. This produces sequences like <code>&nbsp;apple</code><code>&nbsp;bird</code><code>&nbsp;milk</code><code>&nbsp;sand</code><code>&nbsp;sun</code><code>&nbsp;plane</code><code>&nbsp;opera</code><code>&nbsp;...</code> where consecutive words are always grid neighbors.
<!-- Experiments use batch size 16 with *uniform initialization*: each sequence in the batch starts at a different grid position (one for each of the 16 words). This ensures all grid positions are represented across the batch. -->
Following Park et al., we use sequence lengths of 1400 tokens.

**Measuring accuracy.** At timestep $$t$$, the walk is at node $$w_t$$ with neighbors $$\mathcal{N}(w_t)$$, and the model outputs a distribution $$p_{\theta}(\cdot \mid w_{1:t})$$ over vocabulary tokens. Following Park et al., we define "rule following accuracy" as the total probability mass assigned to valid next nodes:

$$
\text{acc}_t \;=\; \sum_{w \in \mathcal{N}(w_t)} p_{\theta}(w \mid w_{1:t}).
$$

<!-- At each timestep we average $$\text{acc}_t$$ over the 16 sequences in the batch, and report the resulting mean and standard deviation. For plots, we apply a 30-step moving-average smoothing. Figure 2 (left) shows accuracy increasing with context length, approaching $$\sim 0.90$$ after $$\sim10^3$$ tokens. -->

**PCA visualization.** To assess whether the model's representations come to resemble the grid structure, we extract activations from a late layer (layer 26 out of 32). For each of the 16 words, we compute a class-mean activation by averaging over all occurrences in the final 200 positions of the sequence. We then project these 16 class-mean vectors onto their first two principal components for visualization. If the representation geometry reflects the grid, neighboring tokens should appear nearby in this projection.

### Reproduction and Park et al.'s interpretation

<a href="#fig-2">Figure 2</a> shows our reproduction of Park et al.'s main results on Llama-3.1-8B.

<div id="fig-2" class="l-page">
  <div class="plot-row">
    <!-- Accuracy curve plot -->
    <div class="plot-container w-55">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/reproduce/plots/accuracy_curve.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/reproduce/plots/accuracy_curve.png' | relative_url }}" alt="Accuracy curve showing model performance increasing with context length">
      </a>
    </div>

    <!-- PCA visualization plot -->
    <div class="plot-container w-45">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/reproduce/plots/pca_class_means.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/reproduce/plots/pca_class_means.png' | relative_url }}" alt="PCA visualization showing grid structure in token representations">
      </a>
    </div>
  </div>
</div>
<div class="caption">
  <b>Figure 2.</b> <b>Reproduction of main results from Park et al.</b>
  <b>Left:</b> Model accuracy on the grid tracing task increases with context length, reaching
  ${\sim}0.90$ accuracy after ${\sim}10^3$ tokens. Shaded region shows $\pm 1$ standard
  deviation across 16 random sequences. <b>Right:</b> PCA projection of class-mean activations at layer 26
  after seeing 1400 tokens. Gray dashed lines connect grid neighbors. The geometry of the
  effective representations resembles the grid structure underlying the data.
</div>

Park et al. interpret these findings as evidence that the geometric reorganization plays a functional role in task performance: the model learns the graph structure in its representations, and this learned structure is what enables accurate next-node predictions.

> "We see once a critical amount of context is seen by the model, accuracy starts to rapidly improve. We find this point in fact closely matches when Dirichlet energy<d-footnote>Dirichlet energy measures how much a signal varies across graph edges. Low energy means neighboring nodes have similar representations, so Park et al. use it to quantify how well the model's representations respect the graph structure.</d-footnote> reaches its minimum value: energy is minimized shortly before the rapid increase in in-context task accuracy, suggesting that the structure of the data is correctly learned before the model can make valid predictions. This leads us to the claim that <b>as the amount of context is scaled, there is an emergent re-organization of representations that allows the model to perform well on our in-context graph tracing task.</b>"
> <p style="text-align: right; margin-bottom: 0;">— Park et al. (Section 4.1; emphasis in original)</p>

<!--
Other relevant quotes from Park et al. for reference:

> "As we show, increasing the amount of context leads to a sudden re-organization of representations in accordance with the graph's connectivity. This suggests LLMs can manipulate their representations in order to reflect concept semantics specified entirely in-context, inline with theories of inferential semantics from cognitive science." (Section 1)

> "This suggests an implicit optimization process, as hypothesized by theoretical work on ICL in toy setups (e.g., in-context linear regression), can transpire in more naturalistic settings." (Section 1)

> "In this work, we show that LLMs can flexibly manipulate their representations from semantics internalized based on pretraining data to semantics defined entirely in-context." (Section 7)

> "Interestingly, we find the ability to flexibly manipulate representations is in fact emergent with respect to context size—we propose a model based on energy minimization to hypothesize a mechanism for the underlying dynamics of this behavior. These results suggest context-scaling can unlock new capabilities, and, more broadly, this axis may have as of yet been underappreciated for improving a model." (Section 7)
-->

## A simpler explanation: induction circuits

We propose that the grid tracing task can be solved by a much simpler mechanism than the in-context representation reorganization posited by Park et al.: *induction circuits* <d-cite key="elhage2021mathematical"/>, <d-cite key="olsson2022incontext"/>.

An induction circuit consists of two types of attention heads working together. *Previous-token heads* attend from position $$t$$ to position $$t{-}1$$, copying information about the previous token into the current position's residual stream. *Induction heads* then attend to positions that follow previous occurrences of the current token. Together, they implement in-context bigram recall: "if $$B$$ followed $$A$$ before, predict $$B$$ when seeing $$A$$ again."<d-footnote>In the literature, the term "induction head" is sometimes used to refer to both the individual attention head and the full two-component circuit. We use "induction circuit" for the full mechanism and "induction head" for the specific head that attends to tokens following previous occurrences, to avoid ambiguity.</d-footnote>

In the grid task, if the model has seen the bigram <code> apple</code><code> bird</code> earlier in the sequence, then upon encountering <code> apple</code> again, the induction circuit can retrieve and predict <code> bird</code>. Since consecutive tokens in a random walk are always grid neighbors, every recalled successor is guaranteed to be a valid next step. With enough context, the model will have observed multiple successors for each token, and can aggregate over these to assign probability mass to all valid neighbors.<d-footnote>For example, if the model has seen both <code>&nbsp;apple</code><code>&nbsp;bird</code> and <code>&nbsp;apple</code><code>&nbsp;house</code>, it can distribute probability across both <code>&nbsp;bird</code> and <code>&nbsp;house</code> when predicting the next token after <code>&nbsp;apple</code>.</d-footnote>

### Testing the induction hypothesis

If the model relies on induction circuits to solve the task, then ablating the heads that comprise them should substantially degrade task performance. We test this via *zero ablation*: setting targeted attention heads' outputs to zero and measuring the causal impact on both task accuracy and in-context representations.

**Head identification.** Following Olsson et al., 2022 <d-cite key="olsson2022incontext"></d-cite>, we identify induction heads and previous-token heads using attention pattern analysis on repeated sequences (see <a href="#appendix-b">Appendix B</a> for details), and rank all 1024 heads in Llama-3.1-8B by their respective scores, yielding two ranked lists.

**Ablation procedure.** For each head type, we ablate the top-$$k$$ heads for $$k \in \{1, 2, 4, 8, 16, 32\}$$ and measure impact on task accuracy and representation geometry. As a control, we ablate random heads sampled from all heads excluding the top 32 induction and top 32 previous-token heads. All accuracy curves are averaged over 16 random walk sequences (one per grid starting position). The random head control additionally averages over 4 independent sets of 32 heads.

### Results

<div id="fig-3" class="l-page">
  <div class="plot-row">
    <!-- Induction head ablation -->
    <div class="plot-container">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/ablation_induction.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/ablation_induction.png' | relative_url }}" alt="Effect of ablating induction heads on accuracy">
      </a>
    </div>

    <!-- Previous-token head ablation -->
    <div class="plot-container">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/ablation_prev_token.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/ablation_prev_token.png' | relative_url }}" alt="Effect of ablating previous-token heads on accuracy">
      </a>
    </div>
  </div>
</div>
<div class="caption">
  <b>Figure 3.</b> <b>Effect of head ablation on task accuracy.</b>
  <b>Left:</b> Ablating top induction heads progressively degrades accuracy, but the model still learns with context.
  <b>Right:</b> Ablating top previous-token heads causes accuracy to plateau, preventing learning even with more context.
  Accuracy is averaged over 16 random walk sequences. The <span style="color: gray;">gray lines</span> show the effect of ablating 32 random heads, excluding top induction and prev-token heads (averaged over 4 independent head sets).
</div>

**Both induction heads and previous-token heads are critical to task performance.**
<a href="#fig-3">Figure 3</a> shows task accuracy under head ablations. Ablating the top-4 induction heads causes accuracy to drop from $${\sim}0.90$$ to $${\sim}0.60$$, and ablating the top-32 drops accuracy all the way to $${\sim}0.40$$.
Ablating just the top-2 previous-token heads reduces accuracy to below $$0.60$$, and ablating the top-32 previous-token heads further drops accuracy to $${\sim}0.30$$.

In contrast, ablating $$k$$ random heads causes only minor degradation (accuracy remains at $${\sim}0.85$$), suggesting that induction and previous-token heads are *particularly* important for task performance.

While both head types are important for task performance, their ablations have qualitatively different effects on in-context learning dynamics.
Ablating induction heads degrades performance, but accuracy continues to ascend as context length increases.
In contrast, ablating previous-token heads causes accuracy to plateau entirely.

<div id="fig-4" class="l-page">
  <div class="plot-row-triple">
    <!-- Baseline PCA -->
    <div class="plot-container">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/pca_baseline.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/pca_baseline.png' | relative_url }}" alt="PCA baseline - grid structure visible">
      </a>
    </div>

    <!-- Induction heads ablated -->
    <div class="plot-container">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/pca_induction_ablated.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/pca_induction_ablated.png' | relative_url }}" alt="PCA with induction heads ablated - grid structure preserved">
      </a>
    </div>

    <!-- Prev-token heads ablated -->
    <div class="plot-container">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/pca_prev_token_ablated.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/ablation/plots/pca_prev_token_ablated.png' | relative_url }}" alt="PCA with prev-token heads ablated - grid structure disrupted">
      </a>
    </div>
  </div>
</div>
<div class="caption">
  <b>Figure 4.</b> <b>Effect of head ablation on representation geometry.</b>
  PCA projections of class-mean activations under different ablation conditions.
  <b>Left:</b> Baseline (no ablation) shows clear grid structure.
  <b>Center:</b> Ablating top-32 induction heads preserves the grid geometry.
  <b>Right:</b> Ablating top-32 previous-token heads disrupts the spatial organization.
  This suggests previous-token heads are necessary for the geometric structure, while induction heads are not.
</div>

**Ablating previous-token heads disrupts representation geometry.**
While both head types are important for accuracy, they seem to have different effects on representation geometry. <a href="#fig-4">Figure 4</a> shows that ablating induction heads preserves the grid-like geometric structure in PCA visualizations, as the 2D projections still resemble the spatial grid. However, ablating previous-token heads disrupts this structure, causing representations to lose their apparent spatial organization.

## Previous-token mixing can account for representation geometry

In the previous section, we studied *task performance* and argued that the model achieves high task accuracy by using induction circuits.
We now study the *representation geometry*, and attempt to explain the grid-like PCA plots.
We will argue that this structure is plausibly a byproduct of "token mixing" performed by previous-token heads.

### The neighbor-mixing hypothesis

<a href="#fig-4">Figure 4</a> shows that ablating previous-token heads disrupts the grid structure, while ablating induction heads preserves it.
This suggests that previous-token heads are somehow necessary for the geometric organization.
But what mechanism could link previous-token heads to spatial structure?

Previous-token heads mix information from position $$t-1$$ into position $$t$$. In a random walk, the token at $$t-1$$ is always a grid neighbor of the token at $$t$$. So each token's representation gets mixed with a neighbor's. When we compute the class mean for word $$c$$, we average over all positions where $$c$$ appears, each of which has been mixed with whichever neighbor preceded it. Over many occurrences, $$c$$ is preceded by each of its neighbors roughly equally, so the class mean for $$c$$ roughly encodes $$c$$ plus an average of its neighbors.

To test whether neighbor-mixing alone can create the observed geometry, we construct a minimal toy model.

### A toy model of previous-token mixing

We work directly in a 16-token space indexed by the $$4{\times}4$$ grid nodes. Each node $$i$$ is assigned an initial random vector $$\mathbf{e}_i \in \mathbb{R}^{4096}$$, sampled i.i.d. from $$\mathcal{N}(0,I)$$. PCA of just the raw embeddings $$\{\mathbf{e}_i\}$$ produces an essentially unstructured cloud: there is no visible trace of the grid.

We then apply a single, "neighbor mixing" step:

$$
\tilde{\mathbf{e}}_i
\;=\;
\mathbf{e}_i
\;+\;
\frac{1}{|\mathcal{N}(i)|}
\sum_{j \in \mathcal{N}(i)} \mathbf{e}_j,
$$

where $$\mathcal{N}(i)$$ denotes the set of neighbors of node $$i$$.

After this one step, PCA of the 16 mixed vectors $$\{\tilde{\mathbf{e}}_i\}$$ recovers a clear $$4{\times}4$$ grid: neighbors are close in the 2D projection and non-neighbors are far (<a href="#fig-5">Figure 5</a>).

<div id="fig-5" class="l-body-outset">
  <div class="plot-row">
    <!-- Random embeddings baseline (no mixing) -->
    <div class="plot-container">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/neighbor_mixing/plots/before_mixing.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/neighbor_mixing/plots/before_mixing.png' | relative_url }}" alt="PCA of random embeddings without mixing - no structure visible">
      </a>
    </div>

    <!-- After neighbor mixing -->
    <div class="plot-container">
      <a href="{{ 'assets/html/2026-04-27-iclr-induction/neighbor_mixing/plots/after_mixing.html' | relative_url }}" target="_blank">
        <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/neighbor_mixing/plots/after_mixing.png' | relative_url }}" alt="PCA after neighbor mixing - grid structure emerges">
      </a>
    </div>
  </div>
</div>
<div class="caption">
  <b>Figure 5.</b> <b>One round of neighbor mixing creates grid structure from random embeddings.</b>
  <b>Left:</b> PCA projection of 16 random Gaussian vectors $\mathbf{e}_i \sim \mathcal{N}(0, I)$ shows no spatial structure.
  <b>Right:</b> After applying one neighbor-mixing step, the same embeddings exhibit clear grid organization in PCA space. Gray dashed lines connect grid neighbors.
</div>

### Evidence of neighbor mixing in individual model activations

The neighbor-mixing hypothesis makes a further prediction: individual activations should reflect not just the current token, but also its predecessor.

Instead of collapsing each word into a single class mean, we take the final 200 positions of a length-1400 random-walk sequence and project all 200 residual-stream vectors into the same 2D PCA space used for the class means. Each point now corresponds to a specific activation.
For each point, we display bigram information: the center color indicates the current token $$w_t$$ and the border color indicates the previous token $$w_{t-1}$$.

<div id="fig-6" class="l-body">
  <div class="plot-container plot-square">
    <a href="{{ 'assets/html/2026-04-27-iclr-induction/reproduce/plots/bigram_pca.html' | relative_url }}" target="_blank">
      <img class="plot-fallback" src="{{ 'assets/html/2026-04-27-iclr-induction/reproduce/plots/bigram_pca.png' | relative_url }}" alt="Bigram PCA showing each point colored by current token (fill) and previous token (border)">
    </a>
  </div>
</div>
<div class="caption">
  <b>Figure 6.</b> <b>Bigram-level PCA visualization.</b>
  Each point represents a single position's activation. Fill color indicates the current token; border color indicates the previous token. Points with the same current token but different previous tokens form distinct clusters, suggesting the representation encodes information about both. Star markers show token centroids.</div>

Individual activations seem to bear the fingerprint of previous-token mixing (<a href="#fig-6">Figure 6</a>).
For example, activations at positions where the bigram <code> plane</code><code> math</code> occurred tend to lie between the <code> plane</code> and <code> math</code> centroids, and positions where <code> egg</code><code> math</code> occurred tend to lie between the <code> egg</code> and <code> math</code> centroids.
We see similar "in-between" behavior for all other bigrams.
This is what one would expect if the representation of $$w_t$$ contains something like a mixture of "self" and "previous token" rather than depending only on the current word.

## Limitations

Our experiments point toward a simple explanation: the model performs in-context graph tracing via induction circuits, and the grid-like PCA geometry is a byproduct of previous-token mixing.
However, our understanding remains incomplete in important ways.

**The toy model is a significant simplification.** Our neighbor-mixing rule assumes that previous-token heads simply add the previous token's activation $$\mathbf{h}_{t-1}$$ to the current token's activation $$\mathbf{h}_t$$. In reality, attention heads apply value and output projections: they add $$W_O W_V \mathbf{h}_{t-1}$$, where $$W_O W_V \in \mathbb{R}^{d_{\text{model}} \times d_{\text{model}}}$$ is a low-rank matrix (rank $$\leq d_{\text{head}}$$). This projection could substantially transform the information being mixed, and notably cannot implement the identity mapping (with a single head, at least) since it is low-rank. We also model everything as a single mixing step on static vectors, whereas the actual network has many attention heads, MLP blocks, and multiple layers that repeatedly transform the residual stream.

**Why does the grid structure emerge late in the sequence?** Previous-token heads are active from the start of the sequence, yet the grid-like PCA structure only becomes clearly visible after many tokens have been processed. If neighbor-mixing were the whole story, we might expect the geometric structure to appear earlier. Yang et al. <d-cite key="yang2025provablelowfrequencybiasincontext"></d-cite> develop a theoretical framework formalizing a graph-convolution-like process across both context and layers, that may offer a more complete account of how the geometric structure emerges.

**Limited to the in-context grid tracing task.** Our analysis is limited to the $$4{\times}4$$ grid random walk task from Park et al., where bigram copying suffices for next-token prediction. Lepori et al., 2026 <d-cite key="lepori2026languagemodelsstruggleuse"></d-cite> concurrently find that on these random walk tasks, the in-context representations are largely "inert" -- models encode the graph topology but struggle to deploy it for downstream spatial reasoning. However, in other settings, in-context representation changes may be more functional: Yona et al., 2025 <d-cite key="yona2025incontextrepresentationhijacking"></d-cite> show that in-context exemplars can functionally override a token's semantic meaning.
It would also be interesting to investigate more complex in-context learning tasks where induction circuits are not sufficient, such as those with hierarchical or context-dependent structure <d-cite key="saanum2025circuitpredictinghierarchicalstructure"></d-cite>.

## Conclusion

We have argued that the phenomena observed by Park et al. <d-cite key="park2025iclr"></d-cite> can be explained by well-known mechanisms in language models. Task performance on in-context graph tracing is well-explained by induction circuits, which recall previously-seen bigrams. The geometric organization visible in PCA plots appears to be a byproduct of previous-token mixing: because random walks traverse graph edges, previous-token heads mix each position's representation with that of a graph neighbor, and this mixing alone is sufficient to produce grid-like structure from unstructured embeddings.

These findings suggest that the "representation reorganization" observed by Park et al. may not reflect a sophisticated in-context learning strategy, but rather an artifact of previous-token head behavior.

<d-appendix>
<h3 id="appendix-a">Appendix A</h3>
<h4>A: Code availability</h4>
<p>All code and experiments are available at <a href="https://github.com/andyrdt/iclr_induction">github.com/andyrdt/iclr_induction</a>.</p>
<h3 id="appendix-b">Appendix B</h3>
<h4>B: Head detection methodology</h4>
<p>We identify induction heads and previous-token heads using attention pattern analysis on synthetic repeated sequences, following the approach of Olsson et al., 2022 <d-cite key="olsson2022incontext"></d-cite>.</p>
<h4>B.1: Test sequence construction</h4>
<p>We construct a test sequence by repeating a random sequence of tokens: <d-math>[\text{tok}_1, \ldots, \text{tok}_{32}, \text{tok}_1, \ldots, \text{tok}_{32}]</d-math>, where tokens are sampled uniformly from the lower half of the vocabulary. The full sequence has length <d-math>T = 64</d-math>. We run the model on a batch of 32 such sequences and extract attention patterns from all heads.</p>
<p>For layer <d-math>\ell \in \{1, \ldots, 32\}</d-math> and head <d-math>h \in \{1, \ldots, 32\}</d-math> (Llama-3.1-8B has 32 layers and 32 heads per layer), let <d-math>P^{(\ell,h)} \in \mathbb{R}^{T \times T}</d-math> denote the attention pattern, where <d-math>P^{(\ell,h)}_{t,s}</d-math> is the attention weight from position <d-math>t</d-math> (query) to position <d-math>s</d-math> (key).</p>
<h4>B.2: Induction score</h4>
<p>Induction heads exhibit a characteristic pattern: for a repeated token at position <d-math>i</d-math> in the second half of the sequence, they attend not to its earlier occurrence at position <d-math>i - 32</d-math>, but to the token <em>after</em> that earlier occurrence, i.e., position <d-math>i - 31</d-math>.</p>
<p>We compute the induction score as the average attention along this offset-31 diagonal:</p>
<d-math block>s_{\text{ind}}^{(\ell,h)} = \frac{1}{32} \sum_{i=33}^{64} P^{(\ell,h)}_{i, i-31}.</d-math>
<p>This measures how strongly the head attends to "the token that followed the previous occurrence of the current token."</p>
<h4>B.3: Previous-token score</h4>
<p>Previous-token heads implement a simpler pattern: at each position, they attend primarily to the immediately preceding token.</p>
<p>We compute the previous-token score as the average attention along the offset-1 diagonal:</p>
<d-math block>s_{\text{prev}}^{(\ell,h)} = \frac{1}{T-1} \sum_{i=2}^{T} P^{(\ell,h)}_{i, i-1}.</d-math>
<h4>B.4: Head ranking</h4>
<p>We average scores across the batch of 32 sequences, then rank all 1024 heads (32 layers <d-math>\times</d-math> 32 heads) by their induction and previous-token scores separately. This yields two ranked lists. For ablation experiments, we ablate the top-<d-math>k</d-math> heads from each list for <d-math>k \in \{1, 2, 4, 8, 16, 32\}</d-math>.</p>
</d-appendix>
