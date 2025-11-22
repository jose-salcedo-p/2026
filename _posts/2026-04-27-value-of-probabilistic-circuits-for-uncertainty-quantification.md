---
layout: distill
title: The Value of Probabilistic Circuits for Uncertainty Quantification
description: Deep learning architectures struggle with epistemic uncertainty
  quantification, often exhibiting blind confidence on out-of-distribution data.
  This work reviews on Probabilistic Circuits (PCs) as a unifying framework for
  rigorous, tractable reasoning. Unlike standard neural networks, PCs model 
  the joint probability distribution. By enforcing structural 
  constraints—specifically smoothness, decomposability, and determinism they 
  allow for the exact computation of marginals, conditionals, and moments in 
  polynomial time. We discuss on the suitability of PCs for Uncertainty 
  Quantification, describing their advantages and highlighting their 
  drawbacks. We review several recent architectural design, building on or 
  incorporating PCs for tractable UQ in high-dimensional problems.
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
  - name: Maternus Herold
    url: ""
    affiliations:
      name: BMW Group, appliedAI Institute for Europe & University of the Bundeswehr Munich
  - name: Konstantin von Gaisberg
    url: ""
    affiliations:
      name: BMW Group, Karlsruhe Institute of Technology

# must be the exact same name as your blogpost
bibliography: 2026-04-27-value-of-probabilistic-circuits-for-uncertainty-quantification.bib

# Add a table of contents to your post.
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - please use this format rather than manually creating a markdown table of contents.
toc:
  - name: Epistemic Uncertainty in Today's Machine Learning
  - name: Foundations - The Grammar of Tractability
  - name: Tractable Inference - The Engine of Reliability
  - name: Scaling Circuit Architectures to High Dimensions
  - name: Applications of Probabilistic Circuits for UQ
    subsections:
      - name: Probabilistic Neural Circuits
      - name: Multi-Token Prediction with Probabilistic Circuits
      - name: Physics-Driven Deep Latent Variable Models
      - name: SPN-Guided Latent Space Manipulation
  - name: A Personal Note

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

<!-- todo: Write the blog post as specified. 
 -->