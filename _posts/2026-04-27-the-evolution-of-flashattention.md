---
layout: distill
title: The Evolution of FlashAttention
description: We present a mathematical & technical overview of FlashAttention and its evolution across versions 1 to 4. We explain why IO-aware design became central to scalable transformers and how these kernels shape modern long-context LLMs as memory patterns and hardware limits shift. We then describe the changes across versions with Triton examples and place these kernels in the context of recent work on efficient attention. We close by outlining principles that can guide the next generation of attention algorithms.
date: 2026-04-27
future: true
hidden: true
htmlwidgets: true
authors:
  - name: Harshwardhan Fartale
    url: "https://emharsha1812.github.io"
    affiliations:
      name: Independent
  - name: Akshata Kishore Moharir
    affiliations:
      name: Independent
  - name: Ashish Kattamuri
    affiliations:
      name: Independent

bibliography: 2026-04-27-the-evolution-of-flashattention.bib

toc:
  - name: Introduction
  - name: Background
  - name: FlashAttention V1
  - name: FlashAttention V2
  - name: FlashAttention V3
  - name: FlashAttention V4
  - name: Principles for Future Attention Algorithms
  - name: Appendix A Standard Attention Complexity
  - name: Appendix B Memory Bound Proof
  - name: Appendix C Conditional Rescaling Threshold

---

> Note: For brevity, we’ve omitted code implementations in this post. You can view the source and notebooks on GitHub [here](https://github.com/emharsha1812/FlashAttention-Code).



## Introduction

The fundamental concept that underpins the transformer architecture is **Attention**. This was originally developed as an enhancement to RNNs for machine translation <d-cite key="bahdanau2016neuralmachinetranslationjointly"> </d-cite>.
However, in 2017, Vaswani et al. <d-cite key="vaswani2023attentionneed"></d-cite> showed that significantly improved performance could be obtained by eliminating the recurrence structure and instead focusing exclusively on the attention mechanism. 

The importance of this mechanism can be explained with the help of the following example:

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_1.jpg" class="img-fluid rounded z-depth-1" caption="Attention weights showing how the model resolves ambiguity in word meaning through context. The arrows indicate strong attention connections between 'bank' and contextually relevant words." %}

Consider the sentence **"I swam across the river to get to the other bank."** The word "**bank**" has multiple meanings—it could refer to a financial institution or a riverbank. The attention mechanism helps the model understand context by weighing relationships between words. In this case, the model attends strongly to words like "swam," "across," and "river," which provide contextual clues that "bank" refers to a riverbank rather than a financial institution.


Therefore, the Attention mechanism has become a critical mechanism driving the growth of Large Language Models. Over the years, several variants of the attention mechanism have been proposed such as Multi Query Attention (MQA) <d-cite key='shazeer2019fasttransformerdecodingwritehead'></d-cite>, Grouped-Query Attention (GQA), Multi-Head Latent Attention (MLA), etc. For instance, here's a non-exhaustive taxonomy of efficient attention mechanisms

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_0.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Figure adapted from <d-cite key='sun2025efficient'></d-cite>" %}


However, the transformer's attention mechanism has a limitation: it scales quadratically both in time and memory with the sequence (context) length $N$, resulting in $O(N^2 \cdot d_{\text{model}})$ time complexity and $O(N^2)$ memory complexity. We use $N$ to denote the sequence length throughout this post. For example, a 2,048-token sequence requires 16 MB of memory for the attention matrix; at 16,384 tokens, this increases to 1GB per layer. A mathematical analysis is presented in [Appendix A](#appendix-a-standard-attention-complexity). This quadratic scaling makes it prohibitive for processing long sequences beyond 8K-16K tokens without specialized optimizations <d-cite key="keles2022computationalcomplexityselfattention"></d-cite>. While many works aim for sub-quadratic attention using approximations, including Linformer <d-cite key="wang2020linformerselfattentionlinearcomplexity"></d-cite>, Performer <d-cite key="choromanski2022rethinkingattentionperformers"></d-cite>, and Reformer <d-cite key="kitaev2020reformerefficienttransformer"></d-cite>, these methods have seen limited use in large language models. These are approximate attention methods that reduce cost through low-rank projections, kernel approximations, or sparse routing. These assumptions improve asymptotic complexity, but they introduce accuracy and hardware-efficiency tradeoffs, so large-scale models still rely on exact attention.


The FlashAttention series by Tri Dao <d-cite key="dao2022flashattention"></d-cite> <d-cite key="dao2023flashattention2"></d-cite><d-cite key="NEURIPS2024_7ede97c3"></d-cite>  looks at the attention bottleneck from a systems angle. Instead of approximating attention and hurting model quality, the idea is to rethink how attention moves data through the GPU. Modern GPUs have a very uneven memory hierarchy, so the cost of moving data often dominates the cost of doing the math. FlashAttention reduces this movement and gets closer to the limits of the hardware. In this blog, we walk through how this idea has evolved. FlashAttention v1 introduced **tiled exact attention**. FlashAttention v2 improved how work is split across the GPU. FlashAttention v3 added **warp specialization**, **asynchrony**, and low precision on the Hopper GPU to push utilization even higher. FlashAttention v4 then co-designs the algorithm and kernel pipeline for the Blackwell GPU, where asymmetric hardware scaling shifts the bottleneck away from matrix multiplication entirely.


## Background

### GPU Memory Hierarchy

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_2.png" class="img-fluid rounded z-depth-1" caption="Memory Hierarchy with Bandwidth & Memory Size" %}

Every modern processor faces the same fundamental challenge: fast storage is expensive and small, while large storage is slow and cheap. 
Modern GPUs organize memory into a hierarchical form which has five distinct levels, each with different characteristics, different access patterns, and different implications for your code. Starting from the fastest and smallest and working towards the slowest and largest, these levels are: registers, shared memory, L1 cache, L2 cache, and global memory (as shown in the above Figure). At the top of the memory hierarchy sit registers, the fastest storage available on a GPU. Each thread running on the GPU has access to a private set of registers - typically up to 255 registers per thread on modern NVIDIA architectures. These registers feed directly into the computational units. When a thread performs an arithmetic operation, the operands come from registers and the result goes back to registers. There is no separate "register access" operation visible to the programmer; registers are simply where the active data lives. The register file on a single Streaming Multiprocessor contains 65,536 registers with each register holding 32 bits. This gives 256 kilobytes of register storage per SM, and these registers are dynamically shared among all threads running on that SM

Unlike registers, which are private to each individual thread, shared memory (SRAM) is shared among all threads in a **thread block**. NVIDIA GPUs organize parallel work in a hierarchy: individual **threads** are grouped into **warps** of 32 threads that execute in lockstep, warps are grouped into **thread blocks** (also called cooperative thread arrays) that are scheduled onto a single Streaming Multiprocessor (SM) and share its SRAM, and the full collection of thread blocks forms the **grid** launched by a kernel. Shared memory is the primary mechanism for threads within a block to cooperate and communicate and is **explicitly managed by the programmer rather than automatically managed by the compiler**. Shared memory provides a staging area for data that multiple threads need to access. Rather than having each thread read the same value from slow global memory, one thread can read it once into shared memory, synchronize with the other threads, and then all threads can read from fast shared memory. Secondly, it enables algorithms that require threads to exchange data. This is used explicitly by FlashAttention. 


At the bottom of the hierarchy sits global memory - the large DRAM pool that provides the bulk of a GPU's storage capacity. An H100 for example, has 80GBs of HBM memory, operating at around 3,000 gigabytes per second of bandwidth. This is where your input data starts, where your output data goes, and where any persistent state lives. In frameworks like PyTorch, when a tensor is moved to the GPU (e.g., via `.cuda()` or `.to(device)`), it is placed in global memory (HBM); from there, GPU kernels load it into faster memory levels as needed. It is also by far the slowest level of hierarchy, with individual access latencies reaching 400 to 800 clock cycles depending on architecture and access pattern.

*Table: Representative GPU memory hierarchy for the NVIDIA A100 (Ampere architecture) <d-cite key="nvidia2020a100"></d-cite>. Hopper (H100) increases SRAM to 256 KB/SM and HBM bandwidth to ~3.35 TB/s <d-cite key="nvidia2022h100"></d-cite>.*

| Memory Level | Capacity | Bandwidth | Latency | Programmer Control |
|:-------------|:---------|:----------|:--------|:-------------------|
| **Registers** | 256 KB/SM | ~100 TB/s | 0 cycles | Automatic |
| **SRAM** | 192 KB/SM | 19 TB/s | ~20 cycles | Explicit |
| **L2 Cache** | 40-50 MB | 12 TB/s | ~200 cycles | Transparent |
| **HBM** | 40-80 GB | 1.5-2 TB/s | ~500 cycles | Explicit |


When we look at the GPU memory hierarchy in detail, we see a sharp difference in both latency and bandwidth across levels. Registers and shared memory sit close to the compute units and respond within a few cycles. HBM sits hundreds of cycles away with higher bandwidth but much higher latency. This separation means that the location of data often dictates runtime. As an example, the A100 GPU has 40GB of high bandwidth memory (HBM2e) with bandwidth 1.6TB/s and 192KB of on-chip SRAM per each of 108 streaming multiprocessors with bandwidth estimated around 19TB/s <d-cite key="nvidia2020a100"></d-cite>. This shows that the on-chip SRAM is an order of magnitude faster than HBM but many orders of magnitude smaller in size. As L2 Cache is not directly controllable by the programmer we focus on the HBM and SRAM

### Attention is memory bound despite $O(N^{2})$ compute

The efficiency of a kernel is governed by its arithmetic intensity, defined as the number of floating-point operations (FLOPs) performed per byte of memory access. This concept is formalized by the **Roofline model** <d-cite key="williams2009roofline"></d-cite>, which plots attainable performance as a function of arithmetic intensity. The model defines a hardware-specific ridge point $I_{\text{crit}} = \frac{\text{Peak FLOP/s}}{\text{Peak Bandwidth}}$; operations below this threshold are *memory-bound* (bottlenecked by data movement), and operations above it are *compute-bound* (bottlenecked by processing power). For an NVIDIA A100 GPU using FP32 (single-precision) scalar operations on CUDA cores (19.5 TFLOPS peak, 1.555 TB/s HBM bandwidth), $I_{\text{crit}} \approx 12.5$ FLOPs/Byte. This is the relevant threshold for non-matrix-multiply operations such as softmax, which execute element-wise FP32 arithmetic on CUDA cores rather than Tensor Cores. Typical memory-bound operations include elementwise operations such as activation, dropout and reduction operations such as sum, softmax, batch norm, layer norm. Typical compute-bound operations include Matrix Multiplication and Convolution.

$$
\text{Arithmetic Intensity} = \frac{\text{FLOPs}}{\text{Bytes Accessed}}
$$

Standard Attention operates on three input matrices: the queries $Q \in \mathbb{R}^{N \times d}$, keys $K \in \mathbb{R}^{N \times d}$, and values $V \in \mathbb{R}^{N \times d}$, where $N$ is the sequence length and $d$ is the head dimension. It involves three primary stages
1. Matrix Multiplication: $ S = Q K^T $
2. Softmax: $ P = \text{softmax}(S) $
3. Matrix Multiplication: $ O = P V $

The matrix multiplications ($QK^T$ and $PV$) are compute-bound operations with high arithmetic intensity ($O(N^2 d)$ FLOPs vs $O(N^2)$ IO). However, the intermediate Softmax operation is memory-bound. It requires reading the entire $N \times N$ matrix $S$ from HBM, performing reduction operations, and writing the resulting $P$ matrix back to HBM. This $O(N^2)$ memory traffic saturates the HBM bandwidth, leaving the powerful Tensor Cores idle. Tensor Cores are specialized hardware units on NVIDIA GPUs designed to accelerate matrix multiply-accumulate operations, delivering an order of magnitude higher throughput than standard CUDA cores for these operations. (Detailed analysis provided in [Appendix B](#appendix-b-memory-bound-analysis))


## FlashAttention V1 

One of the hardware-efficient mechanisms now widely adopted across different providers is Fast and Memory-Efficient Exact Attention with IO-Awareness, or FlashAttention. The "IO-Awareness" part of the title describes its core technical principle: optimizing data movement between GPU memory hierarchies.

FlashAttention addresses the dual challenges of speed and memory consumption in transformers, especially on long sequences, by rethinking attention algorithms through the lens of GPU memory hierarchy awareness. The key insight is minimizing data movement between high-bandwidth memory (HBM) and on-chip SRAM.

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_3.png" class="img-fluid rounded z-depth-1" caption="Standard execution loads data from HBM for every step. Kernel fusion and tiling keep data in fast memory longer, reducing memory traffic and improving throughput. Figure adapted from Fig. 1 of Dao et al. <d-cite key='dao2022flashattention'></d-cite>." %}

FlashAttention v1, published at Neural Information Processing Systems 2022 by Tri Dao and collaborators, introduced two key innovations: **tiled** attention that processes blocks of queries, keys, and values entirely in SRAM, and an **online softmax algorithm** that computes exact softmax incrementally without materializing the full attention matrix.

### Online Softmax Algorithm Enables Incremental Computation

Standard softmax computation requires three sequential passes over the data, making it inherently memory-intensive. The first pass finds the maximum value for numerical stability. The second pass computes exponentials and accumulates the normalization sum. The third pass normalizes each element. This three-pass structure can be expressed mathematically as follows:

Given a vector $x \in \mathbb{R}^n$, the numerically stable softmax is computed in three passes:

$$
\text{Pass 1:} \quad 
m = \max_{i} x_i
$$

$$
\text{Pass 2:} \quad 
d = \sum_{i=1}^{n} e^{\,x_i - m}
$$

$$
\text{Pass 3:} \quad
\text{softmax}(x)_i = \frac{e^{\,x_i - m}}{d}
$$

This approach ensures numerical stability by preventing overflow in the exponential computation. However, this three-pass dependency creates a critical bottleneck: we must materialize the entire attention matrix in HBM before proceeding. The softmax operation requires global information—specifically, the denominator in Pass 2 must sum over all $N$ elements. This seemingly requires loading the full row into memory before computing any output, making the process extremely memory I/O intensive and defeating attempts to tile the computation efficiently.

The breakthrough came from **online softmax**, an algorithmic technique that computes softmax incrementally in blocks while maintaining running statistics for the maximum and the sum of exponentials. This method was originally discovered by Milakov and Gimelshein <d-cite key="milakov2018online"></d-cite> and later applied to sparse attention patterns by Child et al. <d-cite key="child2019generatinglongsequencessparse"></d-cite>. FlashAttention's key innovation was adapting online softmax to work within a tiled attention algorithm, enabling exact softmax computation without materializing the full attention matrix. Instead of waiting for the global maximum $m_N$ across all elements before computing the normalization sum, the algorithm maintains running statistics that are updated as each new block of data is processed. This incremental approach transforms softmax into a streaming computation that can be fused with the surrounding matrix operations.

### Algebra of Online Softmax

Online softmax allows combining partial results without revisiting the raw data. In a streaming (block-wise) setting, we process the sequence in chunks. Let's assume we have processed the first block of keys and have a local maximum $m_{old}$ and a local unnormalized sum $\ell_{old}$ (where $\ell = \sum e^{x_j - m}$). Now, we load a new block of keys and compute their raw scores. From this new block, we find a local maximum $m_{block}$ and a local sum $\ell_{block}$.

For each block, we compute local statistics independently. The block size is chosen such that each block fits comfortably in SRAM, allowing us to process it entirely on-chip.

**Running maximum** (after processing new block):

$$
m_{new} = \max(m_{old}, m_{block})
$$

with initial condition: $m_{old} = -\infty$ for the first block

**Running sum** (relative to current maximum):

$$
\ell_{new} = \sum_{j} e^{x_j - m_{new}}
$$

with initial condition: $\ell_{old} = 0$ for the first block

#### Recurrence Relation for the Sum

The mathematical insight is the **rescaling formula** for $\ell_{new}$. To combine the old and new blocks into a valid global state without accessing the old data, we need to express the new sum in terms of the old statistics.

Starting from the definition:

$$
\ell_{new} = \sum_{j \in \text{old}} e^{x_j - m_{new}} + \sum_{j \in \text{block}} e^{x_j - m_{new}}
$$

**Key transformation:** Express terms using the old maximum $m_{old}$:

$$
e^{x_j - m_{new}} = e^{x_j - m_{old}} \cdot e^{m_{old} - m_{new}}
$$

Therefore, for the old block terms:

$$
\sum_{j \in \text{old}} e^{x_j - m_{new}} = e^{m_{old} - m_{new}} \sum_{j \in \text{old}} e^{x_j - m_{old}} = e^{m_{old} - m_{new}} \cdot \ell_{old}
$$

Similarly, for the new block terms:

$$
\sum_{j \in \text{block}} e^{x_j - m_{new}} = e^{m_{block} - m_{new}} \sum_{j \in \text{block}} e^{x_j - m_{block}} = e^{m_{block} - m_{new}} \cdot \ell_{block}
$$

Combining both:

$$
\boxed{\ell_{new} = e^{m_{old} - m_{new}} \cdot \ell_{old} + e^{m_{block} - m_{new}} \cdot \ell_{block}}
$$

We can define the correction factor $\alpha = e^{m_{old} - m_{new}}$. This is the **rescaling equation** for online softmax. It allows us to update the running sum using only the previous statistics ($m_{old}$ and $\ell_{old}$) and the new block statistics, without ever loading the earlier blocks from HBM again. The exponential correction terms ensure numerical stability throughout the incremental computation by properly rescaling all exponentials relative to the current global maximum. This reduces the operation from 3 passes to 2 passes <d-cite key="dukhan2020two"> </d-cite>

With the online softmax recurrence in hand, we now have all the ingredients needed to build an IO-aware attention algorithm. The rescaling equation above lets us process $K, V$ one block at a time and fold each block's contribution into a running output — without ever writing the $N \times N$ attention matrix to HBM. The forward pass below shows exactly how FlashAttention orchestrates this block-by-block computation on the GPU.

### Forward Pass

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_4.png" class="img-fluid rounded z-depth-1" caption="Algorithm for FlashAttention Forward Pass. The algorithm partitions inputs into blocks that fit in SRAM, computes attention incrementally using online softmax, and updates running statistics to avoid materializing the full attention matrix in HBM. Reproduced from Algorithm 1 of Dao et al. <d-cite key='dao2022flashattention'></d-cite>." %}

For each attention head, FlashAttention reduces memory reads and writes by tiling. It loads small blocks of queries, keys, and values from GPU HBM into fast on-chip SRAM, computes attention for that block, and updates the output before moving on to the next block. This limits how often data moves between slow and fast memory, which is the main bottleneck on modern GPUs. Cutting this movement often gives a 2–4× speedup in practice.

#### Mathematical Derivation

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_5.png" class="img-fluid rounded z-depth-1"%}

We define the block sizes based on the available SRAM size $M$. Let $B_c$ be the block size for columns (dimension along $N$ for $K, V$), and let $B_r$ be the block size for rows (dimension along $N$ for $Q, O$). The key constraint is $4 B_c d \le M$ to ensure that $K, V$ blocks and various buffers fit in SRAM. Usually, we set $B_c \approx \lceil \frac{M}{4d} \rceil$ and $B_r \approx \min(\lceil \frac{M}{4d} \rceil, d)$.

The matrices are divided into blocks as follows:

- $Q$ is divided into $T_r = \lceil N/B_r \rceil$ blocks: $Q_1, \dots, Q_{T_r}$
- $K$ and $V$ are divided into $T_c = \lceil N/B_c \rceil$ blocks: $K_1, \dots, K_{T_c}$ and $V_1, \dots, V_{T_c}$
- $O$ is divided into $T_r$ blocks: $O_1, \dots, O_{T_r}$

Ideally, to minimize HBM writes of the output $O$, we want to load a block of $Q$, iterate over all blocks of $K, V$, accumulating the result, and then write $O$ once. However, FlashAttention V1 actually uses an outer loop over $K, V$ and an inner loop over $Q$ to better utilize the SRAM for the larger $K, V$ blocks, though conceptually the accumulation happens per query row.

**Initialization:**

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_6.png" class="img-fluid rounded z-depth-1" caption="Q, K, and V blocks are stored in HBM (blue). Each K and V block is streamed into SRAM, where partial score matrices S(t) and exponentials A(t) are computed (orange). Softmax normalization is accumulated across blocks, and partial outputs O(t) are merged to form the final output." %}

We initialize the output matrix $O = 0 \in \mathbb{R}^{N \times d}$, the running sum vector $\ell = 0 \in \mathbb{R}^N$, and the running maximum vector $m = -\infty \in \mathbb{R}^N$. These statistics will be updated incrementally as we process each block.

**Outer Loop** (iterating over $K, V$ blocks, $j = 1, \dots, T_c$):

1. **Load Key-Value blocks:** Load $K_j, V_j \in \mathbb{R}^{B_c \times d}$ from HBM to on-chip SRAM. These blocks remain in SRAM throughout the inner loop.

   **Inner Loop** (iterating over $Q$ blocks, $i = 1, \dots, T_r$):

   1. **Load Query block and statistics:** Load $Q_i \in \mathbb{R}^{B_r \times d}$, $O_i \in \mathbb{R}^{B_r \times d}$, $\ell_i \in \mathbb{R}^{B_r}$, $m_i \in \mathbb{R}^{B_r}$ from HBM to SRAM.

   2. **Compute attention scores:** Compute $S_{ij} = Q_i K_j^\top \in \mathbb{R}^{B_r \times B_c}$. This matrix multiplication is performed entirely in SRAM, computing the raw attention scores between the current query block and key block.

   3. **Compute local statistics:** For the current block, we compute:
      
      $$\tilde{m}_{ij} = \text{rowmax}(S_{ij}) \in \mathbb{R}^{B_r}$$
      
      (maximum score in each row)
      
      $$\tilde{P}_{ij} = \exp(S_{ij} - \tilde{m}_{ij}) \in \mathbb{R}^{B_r \times B_c}$$
      
      (pointwise exponential with local normalization)
      
      $$\tilde{\ell}_{ij} = \text{rowsum}(\tilde{P}_{ij}) \in \mathbb{R}^{B_r}$$
      
      (sum of exponentials in each row)

   4. **Update running statistics:** Using the online softmax rescaling formula:
      
      $$m_i^{\text{new}} = \max(m_i, \tilde{m}_{ij})$$
      
      (update global maximum)
      
      $$\ell_i^{\text{new}} = e^{m_i - m_i^{\text{new}}} \ell_i + e^{\tilde{m}_{ij} - m_i^{\text{new}}} \tilde{\ell}_{ij}$$
      
      (rescale and accumulate sum)

   5. **Update output:** We incrementally update the attention output. First, compute partial output contribution:
      
      $$\tilde{V}_{ij} = \tilde{P}_{ij} V_j$$
      
      (weighted sum of values for current block)
      
      Then combine with running output using the rescaling formula:
      
      $$O_i^{\text{new}} = \text{diag}(\ell_i^{\text{new}})^{-1} \left( \text{diag}(\ell_i) e^{m_i - m_i^{\text{new}}} O_i + e^{\tilde{m}_{ij} - m_i^{\text{new}}} \tilde{V}_{ij} \right)$$
      
      This rescales the old output and adds the new contribution, then normalizes by the updated sum.

   6. **Write back to HBM:** Write $O_i^{\text{new}}, \ell_i^{\text{new}}, m_i^{\text{new}}$ back to HBM, updating the global state for this query block.


In practice, to avoid numerical instability from dividing by $\ell_i$ at every step, the algorithm often stores the unnormalized output (let's call it $U_i = O_i \cdot \ell_i$) and only divides by $\ell_i$ at the very end of the computation or maintains the invariant correctly. The formulation above effectively rescales the previous running average to match the new magnitude determined by the new maximum.

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_7.png" class="img-fluid rounded z-depth-1" caption="Blockwise computation of attention using online softmax. Q remains in HBM while K and V are streamed in blocks. For each block, partial scores S(t) and exponentials A(t) are computed in SRAM. The running softmax denominator is updated across blocks, and partial outputs O(t) are rescaled and accumulated to form the final output." %}

#### GPU Parallelism in FlashAttention V1

In FlashAttention v1, the CUDA kernel is launched with one **thread block per attention head**, for a grid of $B \times H$ blocks (batch size $\times$ number of heads). Each thread block is scheduled onto a single Streaming Multiprocessor (SM) and **cooperatively** processes the entire tiled attention computation for its assigned head — there is no further partitioning of work across thread blocks within a head.

Within a thread block, all warps (groups of 32 threads) collaborate on the same pair of $(Q_i, K_j)$ tiles. The work is divided as follows:

- **HBM ↔ SRAM loads:** All warps in the block participate in loading $K_j$, $V_j$, $Q_i$, and the running statistics from HBM into shared memory (SRAM), using coalesced memory accesses for maximum bandwidth.
- **MatMul ($S_{ij} = Q_i K_j^\top$ and $\tilde{V}_{ij} = \tilde{P}_{ij} V_j$):** The matrix multiplications are split across warps, with each warp computing a subset of rows or tiles of the result using Tensor Core `mma` (matrix-multiply-accumulate) instructions. All warps read from the shared $K_j / V_j$ tiles in SRAM.
- **Softmax & statistics:** After computing $S_{ij}$, all warps **synchronize** (via `__syncthreads()`), and the row-wise max, exponentiation, and row-wise sum are computed cooperatively — each warp handles a subset of rows. A second synchronization barrier follows before the output update proceeds.
- **Output accumulation & write-back:** Each warp updates its assigned rows of $O_i$ and writes the results back to HBM.

Because all warps within a block share the same $K_j / V_j$ tiles in SRAM, this scheme avoids redundant HBM reads. However, it also means that the **entire sequential iteration** over the outer loop ($j = 1, \dots, T_c$) and inner loop ($i = 1, \dots, T_r$) is carried out by a single thread block. No parallelism is exploited *along the sequence dimension* — the sequence-length loops are fully serial within each block. This becomes a significant occupancy bottleneck when $B \times H$ is small, as discussed in the FlashAttention-2 section below.


### Complexity Analysis

The efficiency of FlashAttention is theoretically grounded in its IO complexity. We analyze the number of HBM accesses using a **two-level external memory model**: a slow memory (HBM) of unbounded size, and a fast memory (SRAM) of size $M$ words. The cost metric is the number of words transferred between HBM and SRAM. This is the same model used in classical cache complexity analysis <d-cite key="aggarwal1988io"></d-cite> and in the Red-Blue Pebble Game framework <d-cite key="demaine2018red"></d-cite> that Dao et al. employ for their lower-bound proof.

#### Standard Attention IO Complexity

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_8.png" class="img-fluid rounded z-depth-1"%}


For standard attention, the HBM accesses are:

- Read $Q, K, V$: $O(Nd)$
- Write $S = QK^T$: $O(N^2)$
- Read $S$: $O(N^2)$
- Write $P = \text{softmax}(S)$: $O(N^2)$
- Read $P$ and $V$: $O(N^2) + O(Nd)$
- Write $O = PV$: $O(Nd)$

**Total:** $\Theta(Nd + N^2) = \Theta(N^2)$ HBM accesses (assuming $N \gg d$).

Note that this complexity is **independent of $M$**: the standard implementation does not exploit SRAM to reduce data movement. Each kernel materializes the full $N \times N$ intermediate matrix to HBM, so no amount of fast memory avoids the quadratic traffic.

#### FlashAttention IO Complexity

FlashAttention's tiled algorithm significantly reduces memory traffic:

**Outer loop** (over $K, V$ blocks, $j = 1, \dots, T_c$): Each iteration loads blocks $K_j, V_j$ into SRAM. Since the outer loop iterates over all $K, V$ blocks, these matrices are loaded once in total: $O(Nd)$.

**Inner loop** (over $Q$ blocks, $i = 1, \dots, T_r$): For each outer iteration, the inner loop loads $Q_i$, $O_i$, $\ell_i$, $m_i$ from HBM.

- Size of $Q_i$: $B_r \times d$
- Total inner loop iterations: $T_c \times T_r$
- Total loading of $Q$: $T_c \times (T_r \times B_r d) = T_c \times Nd$

Since $T_c = \lceil N/B_c \rceil$ and $B_c = \Theta(M/d)$:

$$
\text{Total } Q \text{ loads} = \frac{N}{B_c} \times Nd = \frac{N}{M/d} \times Nd = \frac{N^2 d^2}{M}
$$

**Theorem:** For sequence length $N$, head dimension $d$, and SRAM size $M$, FlashAttention requires $O(N^2 d^2 M^{-1})$ HBM accesses.

The key factor is the ratio $d^2/M$. Since $d^2$ is typically much smaller than $M$ (e.g., $d=64 \implies d^2=4096$, while SRAM size $M \approx 10^5$ bytes on an A100), we have $d^2/M \ll 1$. By tiling the computation to fit within the fast memory of size $M$, FlashAttention trades extra FLOPs (recomputation) for drastically fewer HBM accesses — reducing the $M$-independent $\Theta(N^2)$ of standard attention to $O(N^2 d^2 M^{-1})$, a factor of $M/d^2$ improvement.

#### Lower Bound and Optimality

Dao et al. prove that this complexity is **asymptotically optimal** within the two-level external memory model defined above. <d-cite key="dao2022flashattention"></d-cite> The proof uses the Red-Blue Pebble Game — a combinatorial framework where "blue pebbles" represent HBM-resident data and "red pebbles" represent data loaded into SRAM (of size $M$). A computation step can only fire when all its operands hold red pebbles, and each blue$\leftrightarrow$red pebble transfer counts as one IO. Under this model, the attention computation graph involves $N^2$ pairwise interactions. To compute these interactions with a fast memory of size $M$, any algorithm must re-stream inputs multiple times. Dao et al. show that any algorithm computing exact attention must incur $\Omega(N^2 d^2 M^{-1})$ memory accesses, confirming that FlashAttention is not just an improvement but **IO-optimal** for exact attention computation.

#### Complexity Comparison with Standard Attention

| Metric | Standard Attention | FlashAttention |
|:-------|:-------------------|:---------------|
| **Time Complexity (FLOPs)** | $O(N^2 d)$ | $O(N^2 d)$ |
| **Space Complexity (Memory)** | $O(N^2)$ (stores $S, P$) | $O(N)$ (stores $O, \ell, m$) |
| **IO Complexity (HBM Access)** | $O(N^2)$ | $O(N^2 d^2 M^{-1})$ |


### Backward Pass

Training deep models requires a backward pass to compute gradients. Standard backpropagation requires the stored attention probability matrix $P$ (size $N \times N$) to compute gradients with respect to $Q$ and $K$. Storing $P$ for long sequences is prohibitively expensive ($O(N^2)$ memory).

FlashAttention solves this through **recomputation**. Instead of saving $P$, it saves only the final output $O$ and the normalization statistics $(\ell, m)$ from the forward pass—both of size $N \times 1$, plus the random seed for dropout. During the backward pass, the kernel reloads $Q$, $K$, $V$ from HBM and uses $m$ and $\ell$ to regenerate the attention scores $S$ and probabilities $P$ block-by-block in SRAM, exactly as they were computed in the forward pass. 

While this recomputation increases FLOPs by repeating the forward matrix multiplications, the reduction in HBM reads—avoiding $O(N^2)$ reads of $P$—results in a net speedup because the operation is memory-bound. The additional compute cost is more than offset by the savings in memory bandwidth.


#### Backward Pass Derivation

The backward pass must compute gradients $d\mathbf{Q}$, $d\mathbf{K}$, $d\mathbf{V}$ given $d\mathbf{O}$ from the loss. Standard backprop saves the $N \times N$ attention matrix $\mathbf{P}$ from the forward pass. FlashAttention instead saves only $\mathbf{Q}, \mathbf{K}, \mathbf{V}, \mathbf{O} \in \mathbb{R}^{N \times d}$ and the log-sum-exp statistics $\mathbf{L} \in \mathbb{R}^N$ where $L_i = m_i + \log(\ell_i)$. The $O(N^2)$ matrices $\mathbf{S} = \mathbf{QK}^T$ and $\mathbf{P} = \text{softmax}(\mathbf{S})$ are recomputed on-the-fly in SRAM during backprop.

**Gradient computation.** Recall the forward equations:

$$
\mathbf{S} = \mathbf{QK}^T, \quad \mathbf{P} = \text{softmax}(\mathbf{S}), \quad \mathbf{O} = \mathbf{PV}
$$

Backpropagating through this chain via $\mathcal{L} \xleftarrow{\text{grad}} \mathbf{O} \xleftarrow{\mathbf{P,V}} \mathbf{P} \xleftarrow{\text{softmax}} \mathbf{S} \xleftarrow{\mathbf{Q,K}} \mathbf{Q}, \mathbf{K}$ gives:

**Gradient w.r.t. $\mathbf{V}$:** From $\mathbf{O} = \mathbf{PV}$,

$$
d\mathbf{V} = \mathbf{P}^T d\mathbf{O}
$$

**Gradient w.r.t. $\mathbf{P}$:** 

$$
d\mathbf{P} = d\mathbf{O} \mathbf{V}^T \in \mathbb{R}^{N \times N}
$$

**Gradient through softmax.** For row-wise softmax, the Jacobian is $\frac{\partial P_{ij}}{\partial S_{ik}} = P_{ij}(\delta_{jk} - P_{ik})$ where $\delta$ is the Kronecker delta. Applying the chain rule, for each row $i$:

$$
d\mathbf{S}_i = \mathbf{P}_i \odot d\mathbf{P}_i - \mathbf{P}_i (d\mathbf{P}_i^\top \mathbf{P}_i)
$$

where $\odot$ denotes element-wise multiplication. 

Define $D_i = d\mathbf{P}\_{i:} \cdot \mathbf{P}\_{i:} = \sum_j d\mathbf{P}\_{ij} \mathbf{P}\_{ij}$. Since $d\mathbf{P}\_{ij} = (d\mathbf{O}_i)^\top \mathbf{V}_j$ and $\sum_j \mathbf{P}\_{ij} \mathbf{V}_j = \mathbf{O}_i$:

$$
D_i = \sum_j (d\mathbf{O}_i^\top \mathbf{V}_j) \mathbf{P}_{ij} = d\mathbf{O}_i^\top \mathbf{O}_i
$$

Thus the gradient through softmax becomes:

$$
d\mathbf{S} = \mathbf{P} \odot d\mathbf{P} - \mathbf{P} \odot (d\mathbf{O} \odot \mathbf{O})
$$

**Gradients w.r.t. $\mathbf{Q}$ and $\mathbf{K}$.** Since $\mathbf{S} = \mathbf{QK}^T$:

$$
d\mathbf{Q} = d\mathbf{S} \mathbf{K} \in \mathbb{R}^{N \times d}
$$

$$
d\mathbf{K} = d\mathbf{S}^T \mathbf{Q} \in \mathbb{R}^{N \times d}
$$

**Tiled backward pass with recomputation.** FlashAttention avoids storing $O(N^2)$ attention matrices $\mathbf{P}$ and $\mathbf{S}$ by recomputing them block-by-block in SRAM during the backward pass. This strategy exchanges additional compute for reduced memory requirements. The approach is practical because attention computation is memory-bound—the memory bandwidth savings outweigh the recomputation cost.

#### Backward Pass Setup

**Saved state from forward pass:**

From the forward pass, we save only the minimal information required:
- $\mathbf{Q}, \mathbf{K}, \mathbf{V}$ (all in HBM, size $N \times d$ each)
- $\mathbf{O}$ (output, size $N \times d$)
- Log-sum-exp statistics: $\mathbf{L} \in \mathbb{R}^N$ where $L_i = m_i + \log(\ell_i)$
- Dropout random seed (if used)

**Preprocessing step:**

Before the main loop, we compute an auxiliary vector $\mathbf{D} \in \mathbb{R}^N$:

$$
D_i = \sum_{j=1}^d dO_{ij} \cdot O_{ij}
$$

This vector encodes the diagonal of $(dO \odot O)$ and is reused throughout the backward pass to efficiently compute gradients through softmax for each block. Computing $\mathbf{D}$ requires one pass over $dO$ and $O$, costing $O(Nd)$ HBM accesses.

#### Backward Algorithm (FlashAttention V1)

The backward pass uses the same tiling structure as the forward pass. We iterate over $K, V$ blocks in the outer loop and $Q$ blocks in the inner loop, accumulating gradients into each block as we process them.

**Outer Loop** (over $K, V$ blocks, $j = 1, \dots, T_c$):

1. **Load key-value blocks:** Load $\mathbf{K}_j, \mathbf{V}_j \in \mathbb{R}^{B_c \times d}$ from HBM to SRAM.

2. **Initialize gradient accumulators:** Set $d\mathbf{K}_j = 0$ and $d\mathbf{V}_j = 0$ in SRAM. These accumulators will receive contributions from all query blocks in the inner loop.

   **Inner Loop** (over $Q$ blocks, $i = 1, \dots, T_r$):

   3. **Load query block and statistics:** Load from HBM into SRAM:
      - $\mathbf{Q}_i \in \mathbb{R}^{B_r \times d}$
      - $d\mathbf{Q}_i \in \mathbb{R}^{B_r \times d}$ (partial gradient, accumulated across $j$ iterations)
      - $d\mathbf{O}_i \in \mathbb{R}^{B_r \times d}$ (upstream gradient from backprop)
      - $\mathbf{O}_i \in \mathbb{R}^{B_r \times d}$ (output from forward pass)
      - Statistics: $\mathbf{L}_i, m_i, D_i$ (all size $B_r$)

   4. **Recompute attention scores and probabilities:**
   
      $$\mathbf{S}_{ij} = \mathbf{Q}_i \mathbf{K}_j^\top \in \mathbb{R}^{B_r \times B_c}$$
      
      Recover the attention probabilities using the saved log-sum-exp statistics:
      
      $$\mathbf{P}_{ij} = \exp(\mathbf{S}_{ij} - m_i) / \exp(\mathbf{L}_i - m_i)$$
      
      where subtraction and division are applied row-wise with broadcasting. If dropout was applied during the forward pass, regenerate the dropout mask using the saved random seed and apply it to $\mathbf{P}_{ij}$.

   5. **Compute value gradients:** Accumulate into $d\mathbf{V}_j$:
   
      $$d\mathbf{V}_j \leftarrow d\mathbf{V}_j + \mathbf{P}_{ij}^\top d\mathbf{O}_i$$
      
      This is a $(B_c \times B_r) \times (B_r \times d) \to (B_c \times d)$ matrix multiplication.

   6. **Compute score gradients through softmax:** The gradient flowing backward through softmax is:
   
      $$d\mathbf{S}_{ij} = \mathbf{P}_{ij} \odot \left( d\mathbf{O}_i \mathbf{V}_j^\top - \mathbf{P}_{ij}^\top (d\mathbf{O}_i \odot \mathbf{O}_i) \right)$$
      
      Computing this requires first forming the intermediate matrix:
      
      $$\mathbf{A}_{ij} = d\mathbf{O}_i \mathbf{V}_j^\top$$
      
      Then applying the softmax gradient formula:
      
      $$d\mathbf{S}_{ij} = \mathbf{P}_{ij} \odot \left( \mathbf{A}_{ij} - D_i \right)$$
      
      where $D_i$ is broadcast across the column dimension.

   7. **Compute query gradients:** Accumulate into $d\mathbf{Q}_i$:
   
      $$d\mathbf{Q}_i \leftarrow d\mathbf{Q}_i + d\mathbf{S}_{ij} \mathbf{K}_j$$
      
      This is $(B_r \times B_c) \times (B_c \times d) \to (B_r \times d)$.

   8. **Compute key gradients:** Accumulate into $d\mathbf{K}_j$:
   
      $$d\mathbf{K}_j \leftarrow d\mathbf{K}_j + d\mathbf{S}_{ij}^\top \mathbf{Q}_i$$
      
      This is $(B_c \times B_r) \times (B_r \times d) \to (B_c \times d)$.

   9. **Write query gradients back:** Write updated $d\mathbf{Q}_i$ to HBM. When the outer loop is parallelized across GPU threads or blocks, this requires atomic operations to safely accumulate contributions from multiple $j$ values into the same $d\mathbf{Q}_i$. In sequential execution, this is a standard write operation.

   **End Inner Loop**

3. **Write key-value gradients:** After processing all query blocks, write the accumulated gradients to HBM:

   $$\text{Write } d\mathbf{K}_j, d\mathbf{V}_j \text{ to HBM}$$

**End Outer Loop**

#### Backward Pass Complexity Analysis

**Floating-point operations:**

The backward pass requires recomputing the attention matrices and computing all gradient operations. The FLOP count is:
- Recomputing $\mathbf{S}_{ij} = \mathbf{Q}_i \mathbf{K}_j^\top$: $T_c \times T_r \times 2 B_r B_c d = 2 N^2 d$ FLOPs
- Gradient computations (matrix multiplies for $dV, dQ, dK$): $2 N^2 d$ FLOPs
- **Total backward FLOPs:** $\Theta(N^2 d)$, equivalent to the forward pass

**HBM access (IO complexity):**

- Load $Q, K, V$ for recomputation: $O(N^2 d^2 / M)$ (same scaling as forward pass)
- Load $dO, O$ (single pass): $O(Nd)$
- Load and write statistics $L, m, D$: $O(N)$
- Write $dQ, dK, dV$: $O(Nd)$

**Total backward IO:** $\Theta(N^2 d^2 / M)$ HBM accesses

This matches the forward pass complexity. Critically, we avoid storing and reading the $O(N^2)$ attention matrix, which is the dominant memory cost in standard backpropagation.

#### Comparison: Standard Backpropagation vs. FlashAttention

| Aspect | Standard Backprop | FlashAttention |
|:-------|:-----------------|:---------------|
| **Saved state** | $Q, K, V, P, S$ | $Q, K, V, O, L, m$ |
| **Memory footprint** | $O(Nd + 2N^2)$ | $O(Nd)$ |
| **Backward recomputation** | None | $S, P$ blocks on-the-fly |
| **HBM reads in backward** | $\Theta(N^2)$ from $P$ | $\Theta(N^2 d^2 / M)$ |
| **Backward FLOPs** | $\Theta(N^2 d)$ | $\Theta(N^2 d)$ |

The memory savings of $2N^2$ elements directly offset the recomputation cost of $\Theta(N^2 d)$ FLOPs. On memory-bound hardware where the memory bus saturates before compute cores reach full utilization, this trade-off consistently improves overall throughput.

## FlashAttention V2

### Background

Despite the success of FlashAttention v1, performance analysis revealed that it achieved only 30-50% of the theoretical maximum FLOPs on the NVIDIA A100 GPU. The two primary bottlenecks were **suboptimal parallelism**, which led to **low occupancy**, and **inefficient work partitioning**, which resulted in excessive non-matrix-multiply operations.

#### Parallelism Bottleneck
FlashAttention v1 parallelized computation over the batch size ($B$) and the number of heads ($H$). Consequently, the total number of thread blocks launched was $B \times H$. In scenarios with long context lengths, the batch size is often reduced (e.g., $B=1$) to fit the model into memory. If the number of heads is also small (e.g., 12 or 32), the GPU launches only a handful of thread blocks. Given that an A100 GPU has 108 Streaming Multiprocessors (SMs), launching only 32 thread blocks leaves over 70% of the GPU's compute resources idle. This phenomenon is known as **low occupancy**.

#### Non-Matmul Overhead
Furthermore, the online softmax in FlashAttention v1 performed rescaling at every iteration. On modern GPUs equipped with Tensor Cores, non-matrix-multiply operations (like exponentiation and division) are significantly more expensive per FLOP than matrix multiplications. For instance, the A100 delivers 312 TFLOPS for FP16 matrix multiplications but only 19.5 TFLOPS for other FP32 operations.

### Improvements in FlashAttention-2
FlashAttention-2, released in July 2023, achieves a ~2x speedup over v1 by addressing these architectural inefficiencies. The authors identified that v1 processed each attention head largely serially within a single thread block, underutilizing the parallelism available on modern GPUs. Additionally, the work partitioning within blocks caused unnecessary communication overhead between warps.

#### Optimization 1: Reducing Non-Matmul FLOPs

FlashAttention-2 introduces **algebraic simplifications** to minimize non-matrix-multiply operations. While matrix multiplications (GEMMs) run on specialized Tensor Cores, operations like exp, sum, and division run on the Special Function Units (SFUs) or CUDA cores, which are much slower. At the assembly level, these operations are dispatched via MUFU (Multi-Function Unit) instructions (e.g., MUFU.EX2 for exponentials) — SFU and MUFU refer to the same hardware unit at different abstraction levels. We use both terms in this post: SFU when discussing the architectural view, and MUFU when referring to instruction-level scheduling in FA3 and FA4.

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_12.png" class="img-fluid rounded z-depth-1" caption="NVIDIA A100 Streaming Multiprocessor (SM) Architecture. Note the specialized Tensor Cores for matrix math vs. SFUs for activation functions. Figure adapted from the NVIDIA A100 architecture whitepaper <d-cite key='nvidia2020a100'></d-cite>." %}

**1. Deferring Normalization:**
In FlashAttention v1, the output matrix $O$ is rescaled at every iteration to maintain numerical stability:
$$
O^{\text{new}} = \text{diag}(\ell^{\text{new}})^{-1} \left( \text{diag}(\ell) e^{m - m^{\text{new}}} O + e^{\tilde{m} - m^{\text{new}}} \tilde{V} \right)
$$
This requires performing vector-matrix divisions at every step. FlashAttention-2 instead maintains an **un-normalized** output accumulator $\tilde{O}$ throughout the loop:
$$
\tilde{O}^{\text{new}} = \text{diag}(e^{m - m^{\text{new}}}) \tilde{O} + e^{\tilde{m} - m^{\text{new}}} \tilde{V}
$$
The expensive division operation is performed only once at the very end of the loop: $O = \text{diag}(\ell^{\text{final}})^{-1} \tilde{O}$. This simple reordering significantly reduces the number of non-matmul FLOPs.

**2. LogSumExp Storage:**
To further reduce memory overhead, FlashAttention-2 changes the statistics stored for the backward pass. Instead of storing both the maximum $m$ and the sum of exponentials $\ell$, it stores a single log-sum-exp value $L$:
$$
L = m + \log(\ell)
$$
During the backward pass, the required statistics can be derived as $\ell = \exp(L - m)$. This halves the memory footprint for metadata, allowing for larger block sizes and better occupancy.

#### Optimization 2: Loop Reordering (Split-K to Split-Q)

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_10.png" class="img-fluid rounded z-depth-1" %}

The original FlashAttention used a loop order where the outer loop iterated over $K, V$ blocks and the inner loop over $Q$ blocks. This minimized repeated loads of $K$ and $V$ from HBM, but required writing partial results to the output accumulator $O$ back to HBM after each step. This "Split-K" style (accumulating results across $K$) creates dependencies that are difficult to parallelize without atomic updates, particularly when multiple warps share the same output.

FlashAttention-2 inverts this loop hierarchy. Specifically:
- FlashAttention v1: Outer Loop ($K, V$), Inner Loop ($Q$).
- FlashAttention-2: Outer Loop ($Q$), Inner Loop ($K, V$).

Let us divide $Q$ into $T_r$ blocks and $K, V$ into $T_c$ blocks. In FlashAttention-2, a thread block loads a specific block $Q_i$ into SRAM. It then iterates through all blocks of keys and values ($K_1, V_1$ to $K_{T_c}, V_{T_c}$) (as shown in the above Figure). 
Since $Q_i$ is fixed for the duration of the inner loop, the corresponding output block $O_i$ is also fixed. The thread block can maintain $O_i$ entirely in registers (the fastest memory) throughout the entire computation. There is no need for atomic additions or synchronization between thread blocks regarding the output, as they write to disjoint regions of HBM. The algorithm accumulates the results of $Q_i \times K_j^\top \times V_j$ directly into registers. Only after the inner loop finishes (all $K, V$ processed) is the final result $O_i$ written to HBM. This simplifies control flow, improves memory coalescing, and completely eliminates the need to write partial results to HBM and read them back, ensuring that $O$ is written exactly once.

#### Optimization 3: Sequence Parallelism and Warp Partitioning

**Sequence Parallelism:**
FlashAttention-2 solves the low occupancy issue by introducing parallelism over the sequence length dimension. Instead of assigning one thread block per attention head, v2 assigns thread blocks to chunks of the sequence. With an outer loop over $Q$ blocks, we can treat each block $Q_i$ as an independent unit of work.

For example, if the sequence length $N=8192$ and the block size $B_r = 128$, there are $T_r = 64$ blocks of $Q$.
- For a single head, we can now launch 64 thread blocks.
- For 12 heads, we launch $12 \times 64 = 768$ thread blocks.

This approach easily saturates the 108 SMs of an A100, even with a batch size of 1, ensuring high occupancy and utilization regardless of input dimensions.

**Improved Warp Partitioning:**
A major innovation in v2 is parallelizing across the sequence dimension. Instead of one thread block handling one $(i,j)$ pair at a time, FlashAttention-2 splits the work of a single attention head into multiple thread blocks and warps.

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_15.png" class="img-fluid rounded z-depth-1" caption="Comparison of Warp Partitioning: Split-K (FA1) vs Split-Q (FA2). Figure adapted from Dao <d-cite key='dao2023flashattention2'></d-cite>." %}

FlashAttention v1 used a "Split-K" scheme where 4 warps each computed a slice of $K^{T}$ and then synchronized to aggregate results. This required writing intermediate results to shared memory, barrier synchronization across warps, and reading/summing partial results.

In v2, the work within a thread block is partitioned differently. Since the outer loop is over $Q$, the thread block is responsible for a block of rows of $Q$. This "Split-Q" scheme allows warps to partition $Q$ instead of $K/V$. Each warp works on a disjoint slice of the output $O$, eliminating the need for inter-warp communication or synchronization.

#### Optimization 4: Causal Masking

In autoregressive modeling, position $i$ cannot attend to position $j$ if $j > i$. Standard attention creates a mask matrix (setting values to $-\infty$) and applies it. FlashAttention-2 optimizes this at the block level:

1.  **Full Mask:** If a block $K_j$ is entirely "future" relative to $Q_i$ (i.e., all column indices $>$ all row indices), the algorithm skips the inner loop iteration entirely. This essentially halves the compute for causal attention.
2.  **Partial Mask:** If the block lies on the diagonal (contains both valid and invalid interactions), the mask is applied on-the-fly in registers during the computation of $S_{ij}$, setting invalid entries to $-\infty$ before the softmax exponential.

Skipping blocks where all column indices exceed row indices removes about **50%** of blocks for long sequences, yielding about **1.7–1.8×** extra speedup.

### Performance Analysis

#### Forward Pass
FlashAttention-2 consistently achieves ~2x the throughput of v1 and reaches high hardware utilization.

| Implementation | 2k SeqLen Speed | 8k SeqLen Speed | 16k SeqLen Speed | Note |
|:---|:---|:---|:---|:---|
| Standard Attention | ~40 TFLOPs/s | OOM | OOM | Limited by HBM bandwidth. |
| FlashAttention v1 | ~110 TFLOPs/s | ~120 TFLOPs/s | ~125 TFLOPs/s | Limited by work partitioning. |
| FlashAttention-2 | ~200 TFLOPs/s | ~220 TFLOPs/s | ~225 TFLOPs/s | Near linear scaling. |

*Table 1: Forward pass throughput (FP16) on A100 GPU (Head Dim 128).*

Reaching 225 TFLOPs/s on a device with a theoretical max of ~312 TFLOPs/s (approx. 73% utilization) is high for a complex operation involving exponentials and reductions. Typical optimized GEMM kernels reach 80-90%, so this indicates highly effective latency hiding.

#### Backward Pass
FlashAttention-2 optimizes the backward pass by applying the same "Split-Q" logic. It partitions the warps to minimize synchronization when accumulating into $dK_j$ and $dV_j$, which reside in SRAM/Registers during the loop.

| Implementation | Speed (TFLOPs/s) | Theoretical Utilization |
|:---|:---|:---|
| FlashAttention v1 | ~85 | ~27% |
| FlashAttention-2 | ~165 | ~53% |

*Table 2: Backward pass throughput comparison.*

While the backward pass remains slower than the forward pass (due to more FLOPs and atomic operations for $dQ$), v2 still delivers a nearly 2x improvement over v1. The bottleneck remains the atomic accumulations for $dQ$ and the higher ratio of non-matmul operations.

## FlashAttention V3

FlashAttention-3 (FA3), presented at NeurIPS 2024, represents a shift in how attention kernels interact with GPU hardware. While FA1 and FA2 focused on memory hierarchy optimization (tiling) and parallelism, FA3 was designed specifically to exploit the asynchronous execution model of NVIDIA's Hopper GPU (H100) architecture.

### Shortcomings in FA1 and FA2 on Hopper GPU

Despite their success, FA1 and FA2 left performance potential on the table when running on modern hardware. FA2 achieves only ~35% of the theoretical maximum FLOPS on H100 GPUs, compared to 80-90% for optimized GEMM kernels <d-cite key="NEURIPS2024_7ede97c3"></d-cite>. This gap stems from three main issues:

1.  **Synchronous Execution Model:** FA2 used Ampere's `mma.sync` instruction. Hopper GPU's new **WGMMA** (Warp-Group Matrix Multiply-Accumulate) instruction achieves 50% higher throughput but requires asynchronous programming.
2.  **No Producer-Consumer Overlap:** FA2's data loading and computation were serialized. Hopper GPU's **TMA** (Tensor Memory Accelerator) enables loading the next tile while computing on the current one.
3.  **Non-GEMM Bottleneck:** H100's Tensor Cores deliver 989 TFLOPS for FP16 matmul but only 3.9 TFLOPS for special functions (exponential). This 256× throughput gap means softmax can consume ~50% of execution time despite having far fewer FLOPs.

### Improvements over FA1 & FA2

FlashAttention-3 addresses these bottlenecks through three key innovations: Warp Specialization, GEMM-Softmax Pipelining, and Low-Precision Block Quantization.

#### 1. Warp Specialization: Producer-Consumer Model

FA3 splits the warps in a thread block into two specialized groups with distinct responsibilities, leveraging Hopper GPU's asynchronous nature:

*   **Producer Warps:** exclusively issue TMA instructions to load data from global memory into a **circular buffer** in shared memory. Since TMA is asynchronous, a single warp can keep the memory pipeline full. For a deeper dive into TMA, see the CUTLASS tutorial <d-cite key="cutlass-tma"></d-cite> or Modal's hardware glossary <d-cite key="modal-tma"></d-cite>.
*   **Consumer Warps:** exclusively execute WGMMA and softmax instructions. They never issue memory loads.

This separation allows for true hardware-level parallelism. While consumer warps compute on stage $i$, producer warps load stage $(i+s) \mod s$ in parallel.
Additionally, FA3 utilizes the `setmaxnreg` instruction for **dynamic register reallocation**. Producer warps need few registers, while consumer warps need many for accumulators. The hardware allows reallocating registers from producers to consumers to maximize occupancy.

#### 2. GEMM-Softmax Pipelining (Pingpong Scheduling)

To break the sequential dependency bottleneck ($GEMM \rightarrow Softmax \rightarrow GEMM$), FA3 introduces **Pingpong Scheduling** between warpgroups:

*   **Iteration $j$:** Warpgroup 1 executes the high-throughput GEMMs for blocks $j$ and $j+1$.
*   **Simultaneously:** Warpgroup 2 executes the low-throughput Softmax for block $j-1$ on the Multi-Function Unit (MUFU), which is separate from Tensor Cores.

**Intra-Warpgroup Pipelining (2-Stage Pipeline):**
Beyond the inter-warpgroup pingpong overlap, FA3 also pipelines execution *within* each consumer warpgroup. Recall that each iteration of the inner loop performs three steps in sequence:

1. **GEMM-1:** $S_j = Q_i K_j^\top$ (on Tensor Cores via WGMMA)
2. **Softmax:** $\tilde{P}_j = \text{softmax}(S_j)$ (on MUFU/SFU — exp, max, sum, div)
3. **GEMM-2:** $O_i \mathrel{+}= \tilde{P}_j V_j$ (on Tensor Cores via WGMMA)

In a naïve schedule, these execute strictly back-to-back: GEMM-1$_j$ → Softmax$_j$ → GEMM-2$_j$ → GEMM-1$_{j+1}$ → …, leaving the Tensor Cores idle during every Softmax phase. The key insight is that **WGMMA instructions are asynchronous** — once issued, they execute on the Tensor Cores while the warp is free to issue other non-Tensor-Core instructions. FA3 exploits this by reordering the instruction stream so that the Softmax of the *current* iteration overlaps with the GEMM-1 of the *next* iteration:

| Time slot | Tensor Cores | MUFU (SFU) |
|:----------|:-------------|:-----------|
| $t_1$ | GEMM-1$_j$ | *(idle)* |
| $t_2$ | GEMM-1$_{j+1}$ | Softmax$_j$ |
| $t_3$ | GEMM-2$_j$ | *(idle)* |
| $t_4$ | GEMM-1$_{j+2}$ | Softmax$_{j+1}$ |
| $t_5$ | GEMM-2$_{j+1}$ | *(idle)* |

Concretely, the instruction reordering works as follows: after issuing GEMM-1$_j$ (an async WGMMA), the warpgroup immediately issues the MUFU instructions for Softmax$_j$ (exp, row-max, row-sum) without waiting for GEMM-1$_j$ to retire — WGMMA results are not needed until GEMM-2$_j$. In the same time window, the warpgroup also issues GEMM-1$_{j+1}$ using the *already-loaded* $K_{j+1}$ tile (pre-fetched by the producer warp). Only when Softmax$_j$ completes and $\tilde{P}_j$ is ready does the warpgroup issue GEMM-2$_j$, consuming both the softmax output and $V_j$. This creates a **2-stage software pipeline** where two iterations of the loop are in flight simultaneously — one in the "softmax + GEMM-1" phase, and one in the "GEMM-2" phase. The result is that Tensor Core idle time during softmax is largely eliminated, and MUFU latency is hidden behind the next GEMM-1. This is the precursor to the more complex 5-stage pipeline seen in FA4.

#### 3. Low-Precision with Block Quantization

FA3 is the first to effectively utilize FP8 (8-bit floating point) for attention. However, this introduces two challenges:

**Challenge 1: Layout Constraints.** FP8 WGMMA requires operands in **K-major format** — meaning the matrix must be laid out in memory so that elements along the *contraction dimension* (the $K$-dimension, i.e., the dimension being summed over in the matrix multiply) are contiguous in memory. For the first GEMM $S = QK^\top$, the contraction dimension is $d$ (the head dimension), and $K$ is naturally stored with $d$ contiguous, so no transposition is needed. For the second GEMM $O = PV$, the contraction dimension is the sequence dimension $N$. However, $V$ is typically stored in row-major order (with $d$ contiguous per row), which places the wrong dimension contiguous for the Tensor Core instruction. This mismatch means $V$ cannot be fed directly to the FP8 WGMMA without a layout change.
*   **Solution:** FA3 performs an **in-kernel transpose** using `ldmatrix`/`stmatrix` instructions in the producer warpgroup, overlapped with the preceding GEMMs.

**Challenge 2: Quantization Error.** FP8 (E4M3) has only 3 mantissa bits, making it sensitive to outliers.

<div class="col-sm-8 mx-auto">
{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_13.png" class="img-fluid rounded z-depth-1" caption="FP8 E5M2 Format Structure" %}
{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_14.png" class="img-fluid rounded z-depth-1" caption="FP8 E5M2 Calculation Example" %}
</div>

*   **Solution:** FA3 uses **Block Quantization** (per-block scaling factors) and **Incoherent Processing** (Hadamard transform) to spread outliers.

    Block quantization works by computing a separate scaling factor for each tile of the $Q$, $K$, and $V$ matrices before quantizing them to FP8:

    $$
    \mathbf{Q}_{\text{quant}}^{(i)} = \text{quantize}(\mathbf{Q}^{(i)}, \text{scale}^{(i)})
    $$

    Because each tile is scaled independently, a single outlier in one tile does not consume the dynamic range for all other tiles. After the FP8 GEMM produces a result, the output is rescaled by the product of the input scaling factors to recover the correct magnitude.

    This is implemented **entirely in software** — the scaling, quantization, GEMM, and rescaling are all orchestrated within the FA3 CUDA kernel on **Hopper (H100)**, which has no hardware microscaling support.

> **Hardware microscaling on Blackwell:** NVIDIA's Blackwell architecture introduces **hardware-native microscaling** (the [MX format family](https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf): MXFP8, MXFP6, MXFP4) where per-block scale factors are consumed directly by the Tensor Cores, avoiding the software overhead. However, FA4 on Blackwell does **not yet utilize FP4 or native microscaling** — this remains a future optimization opportunity. For more detail, see the [OCP Microscaling Specification](https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf) and NVIDIA's [Blackwell architecture whitepaper](https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf) <d-cite key="nvidia-blackwell-brief"></d-cite>.

### Performance Results

On H100 GPUs, these optimizations yield significant gains:

| Configuration | FlashAttention-2 | FlashAttention-3 | Speedup |
|:---|:---|:---|:---|
| FP16 Forward | 350 TFLOPS | **740 TFLOPS** | 2.1x |
| FP8 Forward | N/A | **1,200+ TFLOPS** | - |
| GPU Utilization | 35% | **75-85%** | 2.2x |

## FlashAttention V4

FlashAttention-4 (FA4) <d-cite key="zadouri2026flashattention4"></d-cite> addresses a fundamental shift in GPU hardware economics: **asymmetric hardware scaling**. On NVIDIA's Blackwell architecture (B200/GB200), tensor core throughput doubled to 2.25 PFLOPS for BF16, up from Hopper's 1 PFLOPS. However, other functional units did not keep pace — the multi-function unit (MUFU) for exponentials remains at 16 ops/clock/SM (unchanged from Hopper), and shared memory read bandwidth stays at 128 bytes/clock/SM. This imbalance means that on Blackwell, the bottleneck for attention has shifted away from matrix multiplication toward shared memory traffic and non-matmul operations like softmax. FA2 on Hopper already achieved ~35% utilization, with the gap to peak explained by non-matmul overhead. On Blackwell, that gap widens because the matmul ceiling moved up while everything else stayed in place.

FA4 responds with algorithm-kernel co-design: redesigned pipelines that exploit Blackwell's fully asynchronous MMA and tensor memory, software-emulated exponentials to bypass the MUFU bottleneck, and conditional softmax rescaling to eliminate unnecessary non-matmul work.

### Roofline Analysis: Where the Cycles Go

> **What is a "cycle"?** A clock cycle is the GPU's basic unit of time — one tick of its internal clock. On the B200, the clock runs at ~1850 MHz, so one cycle ≈ 0.54 nanoseconds. When we say "MMA takes 1024 cycles," we mean the tensor cores need 1024 ticks to finish that matrix multiply. Comparing cycle counts across different hardware units (tensor cores, MUFU, shared memory) tells us which unit finishes last — and that unit is the bottleneck. If two units take the same number of cycles, they are **co-bottlenecks**: speeding up one alone does not help unless you also speed up the other.

Before describing FA4's optimizations, we quantify the bottleneck shift. This analysis follows the same spirit as [Appendix B](#appendix-b-memory-bound-analysis), but targets per-tile cycle counts on Blackwell rather than arithmetic intensity on Ampere. Let the tile dimensions be $M \times N$ along the sequence length, with head dimension $d$. The three relevant hardware resources are:

**MMA compute.** The forward pass performs two MMAs per inner-loop iteration ($QK^\top$ and $PV$), each requiring $2MNd$ FLOPs. At 8192 FLOPs/clock/SM on Blackwell:

$$T_{\text{MMA}} = \frac{4MNd}{8192} \text{ cycles}$$

**Shared memory traffic.** The $QK^\top$ MMA reads both operands from shared memory (SS mode), while $PV$ reads only $V$ from shared memory with $P$ coming from tensor memory (TS mode). Accounting for all operand reads at 128 bytes/cycle and 2 bytes per BF16 element:

$$T_{\text{SMEM}} = \frac{3MNd}{8192} \text{ cycles}$$

**Exponential unit.** Softmax requires exponentiating the $M \times N$ score matrix. At 16 ops/clock/SM:

$$T_{\text{exp}} = \frac{MN}{16} \text{ cycles}$$

For $M = N = d = 128$, these evaluate to:

| Resource | Cycles ($128^3$) | Cycles ($256 \times 128^2$) |
|:---|:---|:---|
| MMA compute | **1024** | **2048** |
| Shared memory | 768 | 1536 |
| Exponential unit | **1024** | **2048** |

The key observation: MMA compute and the exponential unit are **co-bottlenecks**, each consuming 1024 cycles. On Hopper (where MMA throughput was 4096 FLOPs/clock/SM), MMA alone dominated. Blackwell doubled MMA throughput without doubling MUFU throughput, making the exponential unit equally expensive. Since MMA and the exponential unit consume the same number of cycles, speeding up only one leaves the other as the sole bottleneck — the total time does not improve. FA4 must therefore attack both simultaneously: overlap MMA with softmax so they run in parallel, offload part of the exponential work onto FMA units that would otherwise sit idle, and skip rescaling operations that do not affect the final result.

### Forward Pass Optimizations

#### 1. Pipeline for Matmul-Softmax Overlap

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_17.png" class="img-fluid rounded z-depth-1" caption="FlashAttention-4 forward pipeline. Superscript $H$ denotes matrices for the 'high' Q tile, $L$ for the 'low' Q tile. Each Q tile corresponds to 128 query tokens. Tensor core operations and MUFU softmax alternate across tiles in a ping-pong schedule. Reproduced from Fig. 1 of Zadouri et al. <d-cite key='zadouri2026flashattention4'></d-cite>." %}


> **What is a ping-pong schedule?** Imagine two players alternating at a single table tennis table. While player A swings (MMA on tile A), player B retrieves the ball (softmax on tile B). Then they switch — B swings, A retrieves. Neither player is ever idle. In FA4, the "table" is the tensor core hardware, and the two "players" are two output tiles. While one tile's matrix multiplications run on the tensor cores, the other tile's softmax runs on the MUFU. They alternate, keeping both hardware units busy simultaneously.

Since MMA and MUFU are co-bottlenecks, FA4 must overlap them as completely as possible. FA4 follows a **ping-pong schedule** similar to FA3's inter-warpgroup pipelining, but redesigned for Blackwell's larger tiles and tensor memory. Two tiles of the output are computed per thread block: while one tile's tensor core operations execute, the other tile computes softmax on the MUFU.

> **What is Tensor Memory (TMEM)?** Previous GPU architectures forced tensor core results into registers — fast but scarce (256 per thread). Blackwell adds a new 256 KB on-chip memory called **Tensor Memory** that sits between registers and shared memory in the hierarchy. It is warp-synchronous and tightly coupled with the tensor cores: MMAs write outputs directly to TMEM without consuming registers. Think of it as a dedicated scratchpad for matrix accumulation results. It is explicitly managed by the programmer (allocate, deallocate, move data), not a transparent cache.

A key architectural difference from FA3: Blackwell tensor cores write accumulators to **tensor memory (TMEM)** — a new 256 KB on-chip memory per SM — rather than to registers. This has two consequences. First, Blackwell MMA tiles are $128 \times 128$ (double Hopper's $64 \times 128$), so each warpgroup of 128 threads processes an entire row, eliminating inter-warp shuffles for the row-max reduction that softmax requires. Second, since $P$ is communicated via TMEM rather than the register file, rescaling of the output accumulator can be offloaded to a separate **correction warpgroup**, removing it from the critical path between MMA and softmax.

The TMEM is partitioned to hold two output accumulator tiles (for the ping-pong) and two copies of $S$ that are reused for $P$ after softmax. This lets the pipeline start by immediately computing two $S$ tiles, filling the pipeline from the first iteration.

#### 2. Software-Emulated Exponential

The MUFU computes 16 exponentials per cycle per SM. For a $128 \times 128$ tile, that is $16{,}384 / 16 = 1024$ cycles — matching the MMA cost exactly. To break this tie, FA4 offloads part of the exponential computation onto the **FMA units**, which are otherwise idle during softmax phases.

The method decomposes $2^x$ using classical range reduction (Cody-Waite):

$$2^x = 2^{\lfloor x \rfloor} \cdot 2^{x_{\text{frac}}} \quad \text{where } x_{\text{frac}} = x - \lfloor x \rfloor \in [0, 1)$$

**Integer part** ($2^{\lfloor x \rfloor}$): In IEEE 754 representation, powers of two are encoded directly in the exponent field. Computing $2^{\lfloor x \rfloor}$ reduces to shifting $\lfloor x \rfloor$ into the exponent bits — an integer ALU operation.

**Fractional part** ($2^{x_{\text{frac}}}$): Approximated by a degree-$n$ polynomial via Horner's method using FMA instructions:

$$2^{x_{\text{frac}}} \approx \sum_{i=0}^{n} p_i \, x_{\text{frac}}^i$$

with $p_0 = 1.0$ and remaining coefficients minimizing relative error over $[0, 1)$. A degree-3 polynomial suffices for BF16 precision: BF16 quantization error ($\sim 3.9 \times 10^{-3}$) dominates the polynomial approximation error ($\sim 8.8 \times 10^{-5}$) by roughly 45×, making higher-degree polynomials unnecessary when the output is consumed at BF16 precision.

**Partial emulation.** Full software emulation would increase register pressure and latency. FA4 applies emulation to only **10–25%** of entries per softmax row, with the remainder computed via hardware MUFU.EX2. The exact fraction is tuned empirically based on the MMA-to-exponential throughput ratio for each tile configuration.

#### 3. Conditional Softmax Rescaling

Standard FlashAttention rescales the output accumulator at every iteration where $m_j > m_{j-1}$:

$$O_j = e^{m_{j-1} - m_j} O_{j-1} + e^{S_j - m_j} V_j$$

Each rescaling requires a vector-matrix multiplication and a synchronization point. FA4 introduces **conditional rescaling** — only rescale when the change in running maximum exceeds a threshold $\tau$:

$$O_j = \begin{cases} e^{m_{j-1} - m_j} O_{j-1} + e^{S_j - m_j} V_j & \text{if } m_j - m_{j-1} > \tau \\ O_{j-1} + e^{S_j - m_{j-1}} V_j & \text{otherwise} \end{cases}$$

When $m_j - m_{j-1} \le \tau$, the kernel keeps $m_{j-1}$ and skips the rescaling entirely. Correctness is preserved because the true maximum $m_{\text{final}}$ and normalizer $\ell_{\text{final}}$ are tracked throughout, and the final normalization $\text{Output} = \ell_{\text{final}}^{-1} \, O_{\text{final}}$ corrects any accumulated slack.

The threshold is set to $\tau = \log_2(256) = 8.0$, meaning intermediate values can be inflated by at most $2^8 = 256$ before a rescaling is triggered. This is safe because the FP32 accumulator retains sufficient precision even with 8 bits of exponent slack — a detailed numerical argument is given in [Appendix C](#appendix-c-conditional-rescaling-threshold). In practice, conditional rescaling yields a **10× reduction** in rescaling operations, removing a significant source of pipeline stalls. To avoid warp divergence, the kernel rescales when *any* thread in the warp requires it.

### Backward Pass

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_18.png" class="img-fluid rounded z-depth-1" caption="FlashAttention-4 backward computation graph (5 MMA operations + 2 elementwise operations), showing the 1-CTA software pipeline order across prologue, main loop, and tail. Reproduced from Fig. 2 of Zadouri et al. <d-cite key='zadouri2026flashattention4'></d-cite>." %}

The backward pass computes five MMAs per inner-loop iteration: recomputing $S^\top = KQ^\top$, then $dP^\top = VdO^\top$, $dV = P^\top dO$, $dQ = dS \cdot K$, and $dK = dS^\top Q$. The gradients $dV$ and $dK$ accumulate across the inner loop, while $dQ$ requires a reduction across the outer loop (over KV blocks).

**Roofline.** For $M = N = d = 128$ in the 1-CTA configuration:

| Resource | Cycles (1-CTA, $M{=}128$) | Cycles (2-CTA, $M{=}256$) |
|:---|:---|:---|
| MMA compute | 2560 | 2560 |
| **Total shared memory** | **3328** | **2688** |
| Exponential unit | 1024 | 1024 |

Unlike the forward pass, shared memory is the dominant bottleneck — exceeding MMA compute by ~30% in the 1-CTA case. This is because five MMAs require eight BF16 operands to be loaded from shared memory (only two operands reside in TMEM), plus additional traffic for writing $dS$ and $dQ$.

**2-CTA MMA mode.** 
> **What is a CTA?** A Cooperative Thread Array (CTA), also called a **thread block**, is a group of threads that are co-scheduled on the same Streaming Multiprocessor (SM) and share its SRAM. Within a CTA, threads are organized into **warps** of 32 threads that execute in lockstep (SIMT). Four consecutive warps form a **warpgroup** of 128 threads. Multiple CTAs form a **grid** — the full set of work launched by a kernel. Blackwell's 2-CTA mode pairs two CTAs on the same SM so they can cooperatively execute a single MMA, sharing tensor memory across the pair.

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_16.png" class="img-fluid rounded z-depth-1" caption="Visualizing the GPU parallel hierarchy: A grid consists of Thread Blocks (CTAs), which contain warpgroups, which contain warps. In a 2-CTA cluster, paired blocks share a single MMA." %}

To reduce shared memory pressure, FA4 uses Blackwell's **2-CTA tensor core mode**, where a CTA pair on the same SM cooperatively executes a single MMA with tile shape $M = 256$, $N = K = 128$. Each CTA stages only half of operand B in its own shared memory, while the hardware consumes the combined B tile during the multiply. This roughly halves shared memory traffic for operand B, bringing total SMEM time to 2688 cycles — only ~5% above MMA compute.

{% include figure.liquid path="assets/img/2026-04-27-the-evolution-of-flashattention/Figure_19.png" class="img-fluid rounded z-depth-1" caption="2-CTA backward \$dQ\$ decomposition. The CTA pair uses distributed shared memory (DSMEM) to exchange half of the $dS$ tile so each CTA forms an $(M/2 \times 2N)$ operand for a CTA-pair MMA with doubled reduction dimension. Adapted from Fig. 3 of Zadouri et al. <d-cite key='zadouri2026flashattention4'></d-cite>." %}

The $dQ$ computation presents a special challenge: its reduction dimension ($N$) is the KV sequence length, which is partitioned across CTAs in the outer loop. In 2-CTA mode, the CTA pair uses **distributed shared memory (DSMEM)** to exchange half of the $dS$ tile between partner CTAs. After the exchange, each CTA holds $M/2$ rows with the full $2N$ reduction dimension, enabling a CTA-pair MMA that doubles the reduction per step. A complementary benefit: since each CTA writes only $M/2$ rows of $dQ$, the number of global **atomic reductions is halved**.

**Deterministic backward pass.** Atomic $dQ$ updates introduce nondeterminism. For reproducible training, FA4 provides a deterministic mode using semaphore-based serialization: each CTA acquires a lock in a predefined order before performing its reduction. With shortest-processing-time-first (SPT) scheduling for causal masking, the deterministic mode reaches up to **75% the speed** of the nondeterministic mode.

### LPT Scheduling

Attention workloads with causal masking are inherently **load-imbalanced**: tiles near the diagonal of the causal mask process fewer valid entries than tiles far below it. Standard grid linearization assigns tiles in increasing order, which processes the shortest tiles first and leaves SMs idle at the end.

FA4 applies **longest-processing-time-first (LPT) scheduling** <d-cite key="zadouri2026flashattention4"></d-cite>: tiles are ordered by decreasing main-loop iteration count. For causal masking, this means processing tiles in reverse mblock order within each head. To preserve L2 cache locality for KV blocks, FA4 swizzles over heads within cache-capacity sections before varying over mblocks. For GQA/MQA, all query heads sharing a KV head are traversed before moving to the next mblock.

For **variable sequence lengths**, FA4 launches a lightweight preprocessing kernel that sorts batches by their maximum per-tile execution time. The resulting virtual-to-actual batch index mapping is cached and reused across training iterations.

Empirically, LPT scheduling yields **4–8% FLOPS improvement** for MHA and **7–14% for MQA** on causal attention workloads.

### Performance Results

On B200 GPUs with BF16:

| Configuration | FlashAttention-4 | cuDNN 9.13 | Triton | FA4 vs cuDNN | FA4 vs Triton |
|:---|:---|:---|:---|:---|:---|
| BF16 Forward (peak) | **1613 TFLOPS** | ~1240 TFLOPS | ~600 TFLOPS | **1.3×** | **2.7×** |
| GPU Utilization | **71%** | — | — | — | — |

FA4 consistently outperforms all baselines for sequences of 4K tokens and above. The gains are larger for causal attention, attributable to the LPT scheduler. For the DeepSeek V3 configuration (head dimension 192/128), FA4 reaches up to 1654 TFLOPS.

### Current Limitations

FA4 currently operates exclusively in BF16 precision and does **not yet utilize FP4 operations** or **hardware-native microscaling** (the MX format family introduced by Blackwell). It also does not employ 2-CTA MMA for all forward pass operations. These remain optimization opportunities for future work.

## Limitations of FlashAttention and the Long-Context Boundary

FlashAttention is an *IO optimization*, not a *compute optimization*. This distinction is critical for understanding where its benefits plateau and where complementary techniques become necessary.

### The Quadratic Compute Wall

FlashAttention reduces HBM accesses from $\Theta(N^2)$ to $O(N^2 d^2 M^{-1})$ — an improvement factor of $M/d^2$. But the FLOP count remains unchanged at $O(N^2 d)$. The IO savings are governed by a hardware-determined constant: $M/d^2 \approx 10^5 / 4096 \approx 25\times$ on an A100 with $d=64$. No matter how large $N$ grows, this constant does not improve.

At moderate sequence lengths (say $N \leq 16K$), attention is memory-bound — the IO cost dominates, and FlashAttention's tiling delivers substantial wall-clock speedups. But as $N$ increases, the raw compute cost $O(N^2 d)$ eventually overtakes the IO cost as the binding constraint. Doubling the sequence length from 64K to 128K quadruples the attention FLOPs per layer. At $N = 128K$ with $d = 128$ and 32 heads, a single forward attention pass requires approximately 135 TFLOPs — a cost that no amount of memory hierarchy optimization can reduce, since FlashAttention computes *exact* attention and performs the same number of floating-point operations as the standard algorithm.

This is the fundamental ceiling: FlashAttention makes exact attention as fast as the hardware allows, but it cannot make exact attention cheaper than $O(N^2 d)$.

### SRAM Tiling Limits at Extreme Sequence Lengths

FlashAttention's inner loop iterates over $T_c = \lceil N / B_c \rceil$ key-value blocks, where $B_c = \Theta(M/d)$ is capped by SRAM capacity. As $N$ grows, $T_c$ grows linearly — the pipeline simply has more iterations to execute, and each iteration's cost is fixed by the tile size.

The pipeline optimizations introduced across FA2–FA4 (pingpong scheduling, warp specialization, conditional rescaling) amortize *per-tile* overhead effectively, but they cannot reduce the *number of tiles*. Meanwhile, increasing $B_c$ to reduce $T_c$ is constrained by SRAM size: on an A100, 192 KB per SM limits $B_c$ to a few hundred rows at $d = 128$; Hopper's 256 KB per SM and Blackwell's additional TMEM help, but the improvement is incremental. Register pressure further constrains tile dimensions — FA4's forward pass already requires careful staging of softmax values to avoid register spills with $128 \times 128$ tiles.

The practical consequence is that FlashAttention's wall-clock time scales linearly with $T_c$ (i.e., linearly with $N$ for fixed tile size), and each unit of that linear scaling carries an $O(N \cdot d)$ FLOP cost per tile. The total remains $O(N^2 d)$, and hardware constraints prevent the constant factor from shrinking significantly across GPU generations.

### Where Complementary Methods Become Necessary

Beyond approximately 64K–128K tokens, FlashAttention alone faces diminishing returns: the absolute compute cost becomes prohibitive for single-device execution, and the KV tensors may not fit in a single GPU's HBM. At this scale, several complementary techniques become essential — not as replacements for FlashAttention, but as partners that address orthogonal bottlenecks.

**Ring Attention** <d-cite key="liu2023ringattention"></d-cite> distributes the key-value sequence across multiple GPUs arranged in a logical ring. Each device holds a local chunk of $K, V$ and computes attention over that chunk using a local FlashAttention kernel, while simultaneously sending its chunk to the next device in the ring. By overlapping communication with computation, Ring Attention extends the effective context length to millions of tokens across a device cluster. Crucially, FlashAttention serves as the *local compute primitive* inside each ring step — the two techniques are complementary rather than competing.

**Striped Attention** <d-cite key="brandon2023striped"></d-cite> addresses a load-imbalance problem inherent to Ring Attention under causal masking. When tokens are distributed in contiguous chunks across devices, devices holding early tokens perform significantly less work (since causal masking zeroes out most of their attention scores), while devices holding later tokens are fully loaded. Striped Attention interleaves tokens across devices in a round-robin fashion, ensuring each device sees a balanced mixture of early and late positions. This achieves near-perfect load balance while preserving the communication-computation overlap of Ring Attention.

**Block-Sparse Attention** approaches skip entire blocks of the attention matrix that contribute negligibly to the output. Rather than computing all $T_r \times T_c$ tile pairs, a sparsity mask identifies which $(Q_i, K_j)$ blocks to evaluate. If only a fraction $k/N$ of blocks per row are retained, the effective complexity drops toward $O(N \cdot k \cdot d)$, which is sub-quadratic when $k \ll N$. Recent frameworks such as FlexAttention <d-cite key="he2024flexattention"></d-cite> provide composable APIs for specifying block-sparse patterns and can leverage FlashAttention-style tiled kernels for the non-zero blocks, combining sparsity with IO-efficient execution.

The key insight is that for long-context models operating beyond 64K tokens, these techniques form a *stack*: block-sparse patterns reduce the effective number of tiles, Ring/Striped Attention distributes those tiles across devices, and FlashAttention executes each tile IO-efficiently on the local GPU. No single technique in this stack is sufficient on its own.

### Inference: A Different Bottleneck

It is worth noting that FlashAttention primarily targets the *training* and *prefill* phases, where the full $N \times N$ attention computation is performed. During autoregressive decoding, the computational pattern is fundamentally different: each new token attends to all previous tokens, producing a single row of the attention matrix rather than the full matrix. Here, the bottleneck shifts from attention FLOPs to **KV cache memory** — storing and accessing the key-value states of all prior tokens. Techniques such as Multi-Query Attention (MQA) <d-cite key="shazeer2019fasttransformerdecodingwritehead"></d-cite>, Grouped-Query Attention (GQA), Multi-Head Latent Attention (MLA), and PagedAttention <d-cite key="kwon2023pagedattention"></d-cite> address this distinct bottleneck by compressing or managing the KV cache, and are largely orthogonal to FlashAttention's IO-aware tiling.



## Principles for Future Attention Algorithms

The evolution from FlashAttention v1 through v4 reveals several core principles that extend beyond simply optimizing existing attention mechanisms. These principles form a foundation for thinking about future attention algorithms as the hardware landscape continues to evolve.

First, **memory hierarchy awareness must become a first-class concern** in algorithm design. The FlashAttention series demonstrates that asymptotic complexity alone is insufficient — the IO complexity term $O(N^2 d^2 M^{-1})$ matters as much as the FLOP count. With Blackwell's introduction of tensor memory (TMEM) as a new level between registers and shared memory, the hierarchy that algorithms must reason about continues to deepen. Future attention mechanisms should be designed with explicit consideration of data movement costs across every level, rather than treating memory as a flat abstraction.

Second, **kernel fusion and recomputation trade-offs offer underexplored design space**. FlashAttention's backward pass trades additional compute for reduced memory traffic, exploiting the fact that modern accelerators are increasingly memory-bound rather than compute-bound. This suggests a broader principle: as the compute-to-bandwidth ratio continues to grow in future hardware, selectively recomputing intermediate values rather than storing them becomes increasingly favorable. The question becomes which intermediate tensors to materialize and which to recompute, a decision that depends on both the operation's arithmetic intensity and its position in the dependency graph.

Third, **algorithm design must track asymmetric hardware scaling**. FA4 demonstrates that the dominant bottleneck can shift between hardware generations — from HBM bandwidth (FA1), to occupancy and non-matmul overhead (FA2), to asynchronous pipeline utilization (FA3), to exponential unit and shared memory traffic (FA4). The progression toward heterogeneous functional units (Tensor Cores, MUFUs, FMA units, integer ALUs) means algorithms should explicitly partition work to match the throughput characteristics of each unit type. FA4's warp specialization — separating MMA, softmax, correction, load, and store roles — and its use of FMA units to supplement MUFU throughput are instances of this principle. Future kernel authors cannot treat the GPU as a homogeneous compute resource; they must profile and match the bottleneck resource of each hardware generation.

Fourth, **numerical precision is a tunable parameter, not a fixed constraint**. FlashAttention-3's block quantization and FA4's software-based exponential approximation and conditional rescaling demonstrate that carefully managed reduced-precision computation can maintain accuracy while improving throughput. FA4's conditional rescaling is particularly instructive: by tolerating bounded slack in intermediate values (up to $2^8 = 256$) and correcting at the end, it eliminates 90% of rescaling synchronization points. Future algorithms might adaptively select precision per-operation based on numerical sensitivity analysis, potentially using FP8 or FP4 for matmuls while maintaining higher precision only where gradients demand it.

However, these principles come with a sobering caveat: **the usability wall remains high**. Writing a custom attention kernel that achieves even 50% of hardware peak requires deep expertise in GPU memory hierarchies, warp scheduling, Tensor Core constraints, and low-level CUDA or PTX programming. This excludes most ML researchers from contributing to or modifying these kernels directly. Tools like Triton <d-cite key="tillet2019triton"></d-cite>, ThunderKittens <d-cite key="spector2024thunderkittenssimplefastadorable"></d-cite>, and CuTe-DSL aim to lower this barrier by providing higher-level abstractions. FA4 itself is implemented entirely in CuTe-DSL embedded in Python, achieving 20–30× faster compile times than the C++ template-based FA3, while maintaining full low-level control. This suggests that the gap between algorithm design on paper and efficient GPU implementation is narrowing, but closing it fully — through better DSLs, compilers, or automated tuning — remains as important as the algorithmic advances themselves.

A related concern is the risk of permanent vendor lock-in. The optimizations in FA3 and FA4 rely heavily on NVIDIA-specific features: TMA, WGMMA, Tensor Memory, and architecture-specific warp scheduling. Code tuned for Blackwell does not run on Hopper, let alone on AMD or Intel GPUs. This creates a tension between extracting peak performance and maintaining portability. Encouragingly, the ecosystem is beginning to diversify: AMD's ROCm stack now includes FlashAttention ports, and projects like AMD's Iris library <d-cite key="amd-iris"></d-cite> aim to provide competitive attention kernels for MI300X and future accelerators. Whether the field converges on portable abstractions or fragments into vendor-specific silos will shape who can participate in — and benefit from — the next generation of efficient attention.

These principles point toward a future where attention mechanisms are not merely approximate variants of the standard formulation, but fundamentally redesigned algorithms that achieve exact results through hardware-conscious implementation strategies.


## Appendix A: Standard Attention Complexity

The standard self-attention mechanism in Transformers is formally defined as:

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

where inputs $Q, K \in \mathbb{R}^{N \times d_k}$ and $V \in \mathbb{R}^{N \times d_v}$ represent the query, key, and value matrices respectively. The computation proceeds in three sequential stages, each contributing to the overall computational cost.

First, we compute the attention score matrix $S = \frac{QK^T}{\sqrt{d_k}}$. This operation involves a matrix multiplication between $Q$ and $K^T$, resulting in an $N \times N$ matrix. Since each of the $N^2$ entries requires a dot product of size $d_k$, the computational cost is proportional to the number of elements multiplied by the dimension size.

$$
\text{Time Complexity (Scores)} = O(N^2 d_k)
$$

Crucially, this step requires storing the intermediate matrix $S$, which scales quadratically with the sequence length $N$. This $O(N^2)$ memory requirement is the primary bottleneck for long sequences.

Second, we apply the softmax function row-wise to normalize the scores. For each of the $N$ rows, we compute exponentials, sum them, and divide to normalize. As this is performed for every element in the $N \times N$ matrix, the cost is quadratic.

$$
\text{Time Complexity (Softmax)} = O(N^2)
$$

Finally, we compute the weighted sum of values by multiplying the normalized probability matrix $P = \text{softmax}(S)$ with the value matrix $V$. This results in an output matrix of size $N \times d_v$. Similar to the first step, each of the $N \times d_v$ output elements requires a dot product of length $N$.

$$
\text{Time Complexity (Aggregation)} = O(N^2 d_v)
$$

Summing these components gives the total time complexity:

$$
\text{Total Time} = O(N^2 d_k) + O(N^2) + O(N^2 d_v) = O(N^2(d_k + d_v))
$$

In typical Transformer architectures, the head dimensions $d_k$ and $d_v$ are proportional to the model dimension $d_{\text{model}}$. Thus, the complexity is often simplified to $O(N^2 d_{\text{model}})$.

### Scalability Implications

The quadratic dependency on sequence length $N$ creates significant resource challenges as context length increases. The table below illustrates how computational cost and memory usage grow with sequence length, assuming a hidden dimension of $d=768$.

| Sequence Length | Relative Compute Cost | Memory (GB) |
| :-- | :-- | :-- |
| 512 | 1× | 0.001 |
| 2,048 | 16× | 0.016 |
| 8,192 | 256× | 0.25 |
| 65,536 | 16,384× | 16 |
| 1M | 4,000,000× | 4,000 |

### Theoretical Lower Bounds

One might ask if it is possible to compute attention more efficiently than $O(N^2)$. Research grounded in the Strong Exponential Time Hypothesis (SETH) suggests that this quadratic cost is fundamental. SETH, introduced by Impagliazzo and Paturi, posits that there is no algorithm solving $k$-SAT in $O(2^{(1-\epsilon)n})$ time for all $k$. Under this assumption, Keles et al. <d-cite key="keles2022computationalcomplexityselfattention"></d-cite> proved that for any $\epsilon > 0$, computing the softmax dot-product attention requires $\Omega(N^{2-\epsilon})$ time.

This lower bound holds for exact computation as well as for multiplicative and additive approximations. The proof relies on a reduction from the Orthogonal Vectors Problem (OVP): given two sets of $N$ binary vectors, deciding whether any pair is orthogonal requires $\Omega(N^{2-\epsilon})$ time under SETH. Keles et al. show that an algorithm computing attention in truly sub-quadratic time could be used to solve OVP faster than SETH allows, by encoding the orthogonal vectors as queries and keys. Intuitively, to accurately determine the attention distribution, the algorithm must evaluate pairwise interactions between query and key vectors. In high-dimensional spaces, distinguishing between orthogonal and nearly-orthogonal vectors requires checking all pairs, which establishes the $\Omega(N^2)$ barrier.


## Appendix B: Memory Bound Analysis

We show that standard attention is memory-bound by analyzing the Arithmetic Intensity ($AI$) of its components. An operation is memory-bound if its $AI$ is lower than the hardware's critical threshold ($I_{crit}$). For an NVIDIA A100 using FP32 scalar operations on CUDA cores (19.5 TFLOPS peak, 1.555 TB/s HBM bandwidth), $I_{crit} \approx 12.5$ FLOPs/Byte.

Standard attention consists of three kernels:
1.  **MatMul 1 ($S = QK^T$):** Compute-bound ($AI \approx 64$ for $d=64$).
2.  **Softmax ($P = \text{softmax}(S)$):** Memory-bound.
3.  **MatMul 2 ($O = PV$):** Compute-bound ($AI \approx 64$).

**Analysis of the Softmax Kernel:**

A numerically stable (safe) softmax implementation requires **3 separate passes** over each row of the $N \times N$ attention matrix $S$:

1.  **Pass 1 — Row-max:** Read $S$ to compute $m_i = \max_j S_{ij}$ for each row (for numerical stability).
2.  **Pass 2 — Exp & sum:** Read $S$ again, compute $e^{S_{ij} - m_i}$, and accumulate the row-wise sum $\ell_i = \sum_j e^{S_{ij} - m_i}$.
3.  **Pass 3 — Normalize:** Read the unnormalized values and divide by $\ell_i$ to produce $P_{ij}$, then write $P$ back to HBM.

Each pass reads the full $N \times N$ matrix from HBM, meaning the matrix is traversed **3 times** in total.

*   **Compute:** Across these 3 passes the softmax performs element-wise operations (max, subtract, exp, sum, div) on the $N \times N$ matrix. These are FP32 scalar operations executed on CUDA cores (not Tensor Cores), requiring approximately 5 FLOPs per element.
    $$ \text{FLOPs}_{\text{FP32}} \approx 5N^2 $$
*   **Memory:** With 3 read passes and 1 final write of the $N \times N$ matrix in FP16 precision ($P=2$ bytes), the total data movement is:
    $$ \text{Bytes} = 2 \times (3 \times N^2 \text{ read} + N^2 \text{ write}) = 8N^2 $$
*   **Arithmetic Intensity:**
    $$ AI_{\text{softmax}} = \frac{5N^2}{8N^2} = 0.625 \text{ FLOPs/Byte} $$

**Conclusion:**
Since $0.625 \ll 12.5$, the Softmax kernel is severely memory-bound. The need for 3 separate passes over the $N \times N$ matrix amplifies the bandwidth pressure, forcing the GPU compute cores to stall while waiting for $O(N^2)$ data to move to and from HBM in each pass. Therefore, despite the high compute complexity of the matrix multiplications, the intermediate materialization of the attention matrix creates a bandwidth bottleneck that limits overall performance.

> **Note on the $d \ll N$ assumption:** This analysis assumes the head dimension $d$ is much smaller than the sequence length $N$ (e.g., $d = 64$ or $128$ while $N$ can be $1024$ to $128{,}000$+). Under this regime, the $O(N^2)$ memory traffic from the Softmax kernel dominates the overall cost, making the operation memory-bound. If $d$ were comparable to $N$, the compute-bound MatMul kernels ($AI \propto d$) would dominate instead, and the bottleneck characterization would no longer hold.




## Appendix C: Conditional Rescaling Threshold

In standard FlashAttention, the output accumulator $O$ is rescaled at every inner-loop iteration where the running maximum increases: $O_j = e^{m_{j-1} - m_j} O_{j-1} + e^{S_j - m_j} V_j$. FA4's conditional rescaling skips this update when $m_j - m_{j-1} \le \tau$, using $m_{j-1}$ in place of $m_j$. Here we derive why $\tau = \log_2(256) = 8.0$ is safe.

### Setup

The attention kernel uses $2^x$ (via the hardware MUFU.EX2 instruction) rather than $e^x$. When rescaling is skipped, the kernel computes:

$$2^{S_{ij} - m_{j-1}} \quad \text{instead of} \quad 2^{S_{ij} - m_j}$$

Since $S_{ij} \le m_j$ by definition of $m_j = \max(m_{j-1}, \text{rowmax}(S_j))$, the largest value of the skipped-rescaling expression is:

$$2^{m_j - m_{j-1}} \le 2^\tau = 2^8 = 256$$

Without rescaling, the intermediate accumulator values can thus be **inflated** by a factor of up to 256 relative to their correctly-scaled magnitudes. The question is whether this inflation causes overflow or unacceptable precision loss.

### Overflow Safety

The accumulator $O$ is stored in FP32, which has an exponent range of $[-126, 127]$ and a maximum representable value of approximately $3.4 \times 10^{38}$. When correctly scaled (i.e., with the running maximum subtracted), the softmax exponentials satisfy $2^{S_{ij} - m_j} \le 1$, so the weighted value contributions $\tilde{P}_{ij} V_j$ are bounded by the magnitude of $V$. With an inflation factor of at most 256, the worst-case intermediate value grows by 8 bits of exponent — well within FP32's 127-bit exponent range. Overflow is not a concern.

### Precision Safety

The more subtle question is whether the inflated accumulator loses precision when combined with correctly-scaled values from subsequent blocks.

FP32 has 23 mantissa bits, providing approximately 7 decimal digits of precision. When intermediate values are inflated by a factor of $2^8$, 8 bits of the mantissa are effectively "consumed" by representing the inflated magnitude, leaving $23 - 8 = 15$ effective mantissa bits.

The final attention output is consumed at BF16 precision, which has only 7 mantissa bits ($\sim 2$ decimal digits). Even in the worst case, the FP32 accumulator retains 15 mantissa bits of effective precision — more than double what the BF16 output requires. This margin ensures that the inflation introduces no observable error after the final normalization and BF16 conversion.

To make this concrete: suppose the correctly-scaled accumulator would hold the value $1.0$ (in FP32, this is exact). After inflation by $256$, the accumulator holds $256.0$ instead. The FP32 representation of $256.0$ is still exact, and nearby values are representable to within $2^{8-23} = 2^{-15} \approx 3 \times 10^{-5}$. After final normalization divides by the true denominator and the result is rounded to BF16 (which can only distinguish values differing by $\sim 2^{-7} \approx 0.008$), the $2^{-15}$ precision of the inflated accumulator is invisible.

### Practical Impact

In typical attention distributions, the running maximum $m_j$ stabilizes within the first few blocks of each row — attention scores rarely exhibit jumps of more than 8 in the $\log_2$ scale between consecutive blocks. This makes rescaling a rare event under the $\tau = 8.0$ threshold. Empirically, conditional rescaling reduces rescaling operations by approximately **10×**, with the corresponding elimination of synchronization points and pipeline stalls.

### Correctness Guarantee

Regardless of how many rescaling operations are skipped, the final output is exact up to floating-point rounding. The true running maximum $m_{\text{final}}$ and normalizer $\ell_{\text{final}}$ are maintained throughout (the statistics tracking is never skipped — only the accumulator rescaling is). The final step:

$$\text{Output} = \frac{1}{\ell_{\text{final}}} O_{\text{final}}$$

corrects any accumulated slack, producing the same result (up to floating-point precision) as if every intermediate rescaling had been performed.
