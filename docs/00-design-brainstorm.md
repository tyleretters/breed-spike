# Crossbreeding brainstorm

## Primer: what's a SHA256 and how does it become a genome?

If you're coming from a genetics background and not a cryptography one — `SHA256` is just a function that takes any input (a name, a number, anything) and produces a fixed-length string of 64 hexadecimal characters. Hexadecimal means each character is one of 16 values: `0 1 2 3 4 5 6 7 8 9 a b c d e f`. So each character carries 4 bits of information, and 64 characters carry 256 bits total.

Two useful properties for a game:

- **Deterministic** — the same input always produces the same output. So a plant's "name" or "lineage ID" can hash to a stable genome.
- **Avalanche effect** — change one bit of input and ~half the output bits flip. This makes randomly-generated plants look very different from one another, even when their inputs are similar. Real-world useful for procedural variety.

Arranged as an 8×8 grid (each cell holds one hex character), it gives us 64 "loci" — analogous to gene positions on a chromosome. We can treat rows as chromosomes, regions as gene clusters, or the whole thing as a 256-bit string, depending on which model we pick below.

### Example genome — Parent A

Hash of `"revery prairie clover #001"`:

```
00a880f62225f388770b0a9b9444c3a8a31ac96aa8738f3b936251d30afaae14
```

As an 8×8 grid:

```
 0 0 a 8 8 0 f 6
 2 2 2 5 f 3 8 8
 7 7 0 b 0 a 9 b
 9 4 4 4 c 3 a 8
 a 3 1 a c 9 6 a
 a 8 7 3 8 f 3 b
 9 3 6 2 5 1 d 3
 0 a f a a e 1 4
```

Or grouped as bytes (8 rows × 4 bytes per row):

```
 00 a8 80 f6
 22 25 f3 88
 77 0b 0a 9b
 94 44 c3 a8
 a3 1a c9 6a
 a8 73 8f 3b
 93 62 51 d3
 0a fa ae 14
```

114 of 256 bits set (popcount ≈ 45%).

### Example genome — Parent B

Hash of `"revery prairie clover #002"`:

```
a84e6a7920ded3d7d1d48a23bd77838201deb0ed903ee0e2ea32508ddf7b57c9
```

As an 8×8 grid:

```
 a 8 4 e 6 a 7 9
 2 0 d e d 3 d 7
 d 1 d 4 8 a 2 3
 b d 7 7 8 3 8 2
 0 1 d e b 0 e d
 9 0 3 e e 0 e 2
 e a 3 2 5 0 8 d
 d f 7 b 5 7 c 9
```

131 of 256 bits set (popcount ≈ 51%). **Hamming distance from Parent A = 125 bits** — these two are roughly half-different, a healthy outcross.

---

## Idea 1 — Chromosomal crossover (Mendelian meiosis)

**The model:** Each of the 8 rows is a "chromosome." Each nibble (0–F) within a row is a "locus" — a position whose hex value is the allele.

**Breeding math:**

- For each chromosome pair, pick a random crossover point `k ∈ [0, 8]`. Child's row = `parentA[0..k] ++ parentB[k..8]`.
- This is exactly how meiotic recombination works — chromosomes swap segments at chiasmata.
- Mutation: ~0.1% chance per nibble to XOR with a random 4-bit value (point mutation).
- Optional second crossover per chromosome (real meiosis averages 1–3).

**Trait encoding:** Designate rows as trait families — row 0 = drought tolerance, row 1 = yield, row 2 = pest resistance, etc. Within a row, certain nibble positions are "key genes" whose hex value maps to allele strength.

**Resilience:** Heterozygosity advantage (hybrid vigor / heterosis). The further apart parents are in Hamming distance, the higher the resilience ceiling — but variance also rises (inbred = predictable mediocrity, wide outcross = jackpot or dud).

**Seed count:** Roughly proportional to parent diversity. `seeds = base + popcount(parentA XOR parentB) / 8` with some jitter. Mirrors real outbreeding fertility patterns.

**Loot-box feel:** You can see which segments came from which parent before reveal, but mutations and the specific crossover points are hidden until commit.

### Worked example

Crossover points (one per row): `[4, 5, 1, 5, 3, 4, 8, 3]`

| row | parent A   | parent B   | k   | child      |
| --- | ---------- | ---------- | --- | ---------- |
| 0   | `00a880f6` | `a84e6a79` | 4   | `00a86a79` |
| 1   | `2225f388` | `20ded3d7` | 5   | `2225f3d7` |
| 2   | `770b0a9b` | `d1d48a23` | 1   | `71d48a23` |
| 3   | `9444c3a8` | `bd778382` | 5   | `9444c382` |
| 4   | `a31ac96a` | `01deb0ed` | 3   | `a31eb0ed` |
| 5   | `a8738f3b` | `903ee0e2` | 4   | `a873e0e2` |
| 6   | `936251d3` | `ea32508d` | 8   | `936251d3` |
| 7   | `0afaae14` | `df7b57c9` | 3   | `0afb57c9` |

Then a single point mutation (row 4, nibble 3): `e` → `c`. Final row 4 becomes `a31cb0ed`.

**Child genome:**

```
00a86a792225f3d771d48a239444c382a31cb0eda873e0e2936251d30afb57c9
```

Hamming distance 125 → seeds = `3 + 125/8 ≈ 18 seeds`.

---

## Idea 2 — Bitwise alchemy (player-chosen recombination operator)

**The model:** Treat the grid as raw bits. The player picks one of several breeding operations, each with different statistical signatures.

**Operations:**

- `AND` — conservative. Child only inherits genes both parents had. Tends toward stable, minimal genomes. Often weaker but never radical.
- `OR` — promiscuous. Child gets every gene from either parent. Maximally expressed but prone to over-expression instability.
- `XOR` — novel. Child gets genes that differ between parents. High variance — creates new phenotypes from differences alone.
- `MAJ3` (with a third "wild" parent or wild plant) — three-way majority vote per bit. Most stable of the high-information operators.
- `AVG` — nibble-wise mean. Smooth blending, low excitement, low risk.

**Trait encoding:** Resilience emerges from _bit-pattern features_, not designated loci:

- Popcount in certain quadrants = trait strength
- Runs of identical nibbles = trait stability
- Palindromic sub-rows = "rare" mutations with bonus effects

**Seed count:** Tied to "balance" — `seeds ∝ min(popcount, 256-popcount) / 128`. Plants with extreme bit imbalance (all 0s or all Fs) are sterile-ish. Real analogue: chromosomal aneuploidy reduces fertility.

**Loot-box feel:** The operator is your bet. `XOR` is the high-variance pull; `AND` is the safe pull. You're literally gambling on which kind of distribution you want to sample from.

### Worked example (same parents)

| operator | child genome                                                       | popcount | character                                     |
| -------- | ------------------------------------------------------------------ | -------- | --------------------------------------------- |
| `AND`    | `000800702004d38051000a0394448380011a806880328022822250810a7a0600` | 60       | sparse, minimal, stable but weak              |
| `OR`     | `a8eeeaff22fff3dff7df8abbbd77c3aaa3def9efb87feffbfb7251dfdffbffdd` | 185      | over-expressed, dense, high yield but fragile |
| `XOR`    | `a8e6ea8f02fb205fa6df80b82933402aa2c47987384d6fd97950015ed581f9dd` | 125      | balanced novelty, the "exciting" pull         |

`AND` halved the bit count, `OR` nearly doubled it, `XOR` landed at the 50% balance point that maximizes Idea 2's seed count.

---

## Idea 3 — Loci with dominance, mutation, and maternal mosaicism

**The model:** The 8×8 is divided into named _loci_ (gene regions) — like real chromosomal map positions. Each region decodes into a visible phenotype.

**Region map (example):**

- Top-left 2×2 → root system
- Top-right 2×2 → canopy
- Middle band → flowering time
- Bottom-left 2×2 → seed coat
- Bottom-right 2×2 → pest resistance
- Stray cells along edges → minor modifier genes (epistasis)

### Inheritance rules

- For each region, resolve allele dominance per nibble: the high bit determines dominance (`>= 8` dominant, `< 8` recessive — like uppercase/lowercase Mendelian alleles).
- Both dominant → take the higher-value nibble.
- One dominant + one recessive → dominant expresses, recessive carried (stored but hidden — "carrier status").
- Both recessive → recessive expresses (this is where bad traits resurface generations later — real recessive disease pattern).
- **Linkage:** adjacent regions have a 70% chance of being inherited together as a block, 30% chance to recombine independently. Models real chromosomal linkage disequilibrium.

### Worked example — canopy region (top-right 2×2)

Parent A region: `f6 / 88`
Parent B region: `79 / d7`

| cell  | A allele      | B allele      | resolution                              | expressed |
| ----- | ------------- | ------------- | --------------------------------------- | --------- |
| (0,6) | `f` dominant  | `7` recessive | A dominant, B carrier (`7` hidden)      | `f`       |
| (0,7) | `6` recessive | `9` dominant  | B dominant, A carrier (`6` hidden)      | `9`       |
| (1,6) | `8` dominant  | `d` dominant  | both dominant → max of `8,d`            | `d`       |
| (1,7) | `8` dominant  | `7` recessive | A dominant, B carrier (`7` hidden)      | `8`       |

Child canopy: `f9 / d8`. Visible phenotype reads as a strong, broad canopy. The hidden `7` and `6` recessives are quietly along for the ride — they'll matter when this child is bred with another carrier.

### Mutation events

After dominance resolution, every nibble in the child has a small chance of undergoing a mutation event. Severity scales by rarity:

| event           | probability | effect on a single nibble                                                                                | real-world analogue                                                                                                                                  |
| --------------- | ----------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **missense**    | ~1%         | Nibble flipped to a neighboring value (e.g. `c` → `b` or `d`). Trait shifts slightly in the same family. | Single base change → different amino acid, often mild effect.                                                                                        |
| **nonsense**    | ~0.1%       | Nibble forced to `0`. If it lands inside a coding region it can silence a sub-trait.                     | Premature stop codon truncates a protein.                                                                                                            |
| **de novo**     | ~0.01%      | Nibble replaced with a value **neither parent contributed and that has not been seen in this lineage before**. Logged as "first occurrence" in the player's species record. | A spontaneous, never-before-seen mutation. The genuine source of evolutionary novelty — and the rarest, most exciting roll in the game. |

Two more real concepts worth mentioning but probably not worth their own mechanic in the first pass: **frameshift** mutations (would shift the entire region map by one nibble downstream — catastrophic, mostly produces dead seeds) and **exon deletion** (would zero a whole region — equivalent to a row of nonsense mutations stacked). These can show up as rare "blighted seed" failure modes rather than playable variants.

#### De novo mutation in the canopy example

Suppose the (1,6) cell — which resolved to `d` from dominance — rolls a de novo event and becomes `1` (not in either parent, not in the player's lineage history).

Child canopy becomes: `f9 / 18`. The phenotype reads as a strong upper canopy with a previously-unseen lower-leaf trait. The species record now has a new entry: `canopy.lower-left = 1` first observed in generation N. Future plants in this lineage can inherit it.

This is where breeding stops being recombination of known alleles and starts producing genuine novelty. It's also the rarest dopamine hit — the legendary pull.

### Maternal germline mosaicism

This is the part that makes "same two parents, different siblings" feel real even when crossover and mutation are off the table.

In actual biology, a mother's ovaries don't all carry one identical genome — different egg cells can carry small mutations that arose during the mother's own development. So even before any recombination with the father, each egg is already a slightly different draw from a mosaic population.

**Mechanic:** the displayed maternal genome (the one the player sees on the breeding UI) is a *consensus*, not the actual gamete. Internally, each plant marked as a "mother" carries a small population of variant genomes — say 3–5 variants, each within Hamming distance ~3 of the consensus. Each breeding event samples one variant uniformly at random as the actual contributing gamete.

Effect on the player:

- Breeding the same Parent A × Parent B pair twice will produce different siblings even if the player could somehow lock crossover points. The variance has another hidden layer.
- Inspecting a mother (with a future "microscope" tool, perhaps?) could reveal her mosaic population — rewarding observation with predictability.
- Selecting for a mother whose mosaic happens to skew toward a desirable allele is a real long-term breeding strategy, just like human plant breeders track maternal lines.

The father doesn't get the same treatment in real biology — sperm is produced continuously and mosaicism is much less pronounced. So this asymmetry between the two parents has a basis, and it gives players a reason to care which parent they pick as the seed-bearer vs. the pollen donor. (In a clover game where both functions can live in the same plant, this is a meaningful design choice.)

### Resilience and seed count

- **Resilience** = sum of dominant-positive alleles minus recessive-negative penalties, with a small bonus for novel de novo alleles that survive the first generation (proven viable).
- **Seed count** = derived from the seed-coat region's hex value directly. So one specific locus is what you're really optimizing for if you want volume.
- **Carrier status** is invisible to the player without inspection tools. Two healthy-looking plants can produce a blighted child if both carry the same hidden recessive — this is the central source of long-term breeding tension.

---

## How they compare

|                                   | #1 Crossover      | #2 Bitwise                   | #3 Loci/Dominance/Mosaic       |
| --------------------------------- | ----------------- | ---------------------------- | ------------------------------ |
| Real-genetics fidelity            | High (meiosis)    | Low (abstract)               | Highest (Mendel + mutation + mosaicism) |
| Player agency                     | Pick parents      | Pick parents + operator      | Pick parents + role assignment |
| Hidden information                | Mutation outcomes | Operator output distribution | Carriers + maternal mosaic     |
| Resilience driver                 | Heterozygosity    | Bit-pattern features         | Dominant good alleles + de novo gains |
| Best fit for "loot box"           | Medium            | High (operator gamble)       | Highest (de novo mutations)    |
| Best fit for "breeding to a goal" | Medium            | Low                          | Highest                        |

**Lean:** Idea 3 with maternal mosaicism is the deepest of the three. Generations of breeding to surface or eliminate recessives, plus the rare-but-possible de novo mutation that introduces something nobody in the species has ever had — that's the loop.

A hybrid worth considering: **#1 as the underlying recombination math, #3 as the trait-decoding and mutation layer**, with one #2-style operator choice exposed (e.g. "selfing" vs "outcross" vs "wild graft") as the loot-box dial.
