# Crossbreeding — loci, dominance, mutation, and maternal mosaicism

## Primer: what's a SHA256 and how does it become a genome?

If you're coming from a genetics background and not a cryptography one — `SHA256` is just a function that takes any input (a name, a number, anything) and produces a fixed-length string of 64 hexadecimal characters. Hexadecimal means each character is one of 16 values: `0 1 2 3 4 5 6 7 8 9 a b c d e f`. So each character carries 4 bits of information, and 64 characters carry 256 bits total.

Two useful properties for a game:

- **Deterministic** — the same input always produces the same output. So a plant's "name" or "lineage ID" can hash to a stable genome.
- **Avalanche effect** — change one bit of input and ~half the output bits flip. Procedural variety for free.

Arranged as an 8×8 grid (each cell holds one hex character), it gives us 64 "loci" — analogous to gene positions on a chromosome.

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

(Hamming distance = the count of bit positions where two equal-length strings differ. It's the cheap proxy for "how genetically different are these two parents." Real-world analogue: heterozygosity.)

---

## The model

The 8×8 is divided into named _loci_ (gene regions) — like real chromosomal map positions. Each region decodes into a visible phenotype.

**Region map (example layout — the actual one will need playtesting):**

- Top-left 2×2 → root system
- Top-right 2×2 → canopy
- Middle band → flowering time
- Bottom-left 2×2 → seed coat
- Bottom-right 2×2 → pest resistance
- Stray cells along edges → minor modifier genes (epistasis)

## Inheritance rules

For each region, resolve allele dominance per nibble. The **high bit** determines dominance: a nibble `>= 8` is dominant, a nibble `< 8` is recessive. (This is the hex-grid analogue of Mendel's uppercase/lowercase allele convention.)

- **Both dominant** → take the higher-value nibble.
- **One dominant + one recessive** → dominant expresses; recessive is **carried** (stored but hidden — "carrier status").
- **Both recessive** → recessive expresses. This is where bad traits resurface generations later.
- **Linkage:** adjacent regions have a 70% chance of being inherited together as a block, 30% chance to recombine independently. Models real chromosomal linkage disequilibrium — genes physically close together on a chromosome tend to inherit together.

### Worked example — canopy region (top-right 2×2)

Parent A canopy: `f6 / 88`
Parent B canopy: `79 / d7`

Per-cell resolution:

```
(0,6)  A=f dominant    B=7 recessive   →  A wins, B carrier (7 hidden)   →  expressed f
(0,7)  A=6 recessive   B=9 dominant    →  B wins, A carrier (6 hidden)   →  expressed 9
(1,6)  A=8 dominant    B=d dominant    →  both dominant, max(8,d)        →  expressed d
(1,7)  A=8 dominant    B=7 recessive   →  A wins, B carrier (7 hidden)   →  expressed 8
```

Child canopy: `f9 / d8`. Visible phenotype reads as a strong, broad canopy. The hidden `7` and `6` recessives are quietly along for the ride — they'll matter when this child is bred with another carrier.

## Mutation events

After dominance resolution, every nibble in the child has a small chance of undergoing a mutation event. Severity scales by rarity.

- **missense** — ~1% per nibble.
  - _Effect:_ nibble flipped to a neighboring value (e.g. `c` → `b` or `d`). Trait shifts slightly in the same family.
  - _Real-world analogue:_ single base change → different amino acid, often mild effect.
- **nonsense** — ~0.1% per nibble.
  - _Effect:_ nibble forced to `0`. If it lands inside a coding region it can silence a sub-trait.
  - _Real-world analogue:_ premature stop codon truncates a protein.
- **de novo** — ~0.01% per nibble.
  - _Effect:_ nibble replaced with a value **neither parent contributed and that has not been seen in this lineage before**. Logged as "first occurrence" in the player's species record.
  - _Real-world analogue:_ a spontaneous, never-before-seen mutation. The genuine source of evolutionary novelty — and the rarest, most exciting roll in the game.

Two more real concepts worth mentioning but probably not worth their own mechanic in the first pass: **frameshift** mutations (would shift the entire region map by one nibble downstream — catastrophic, mostly produces dead seeds) and **exon deletion** (would zero a whole region — equivalent to a row of nonsense mutations stacked). These can show up as rare "blighted seed" failure modes rather than playable variants.

### De novo mutation in the canopy example

Suppose the (1,6) cell — which resolved to `d` from dominance — rolls a de novo event and becomes `1` (not in either parent, not in the player's lineage history).

Child canopy becomes: `f9 / 18`. The phenotype reads as a strong upper canopy with a previously-unseen lower-leaf trait. The species record now has a new entry: `canopy.lower-left = 1` first observed in generation N. Future plants in this lineage can inherit it.

This is where breeding stops being recombination of known alleles and starts producing genuine novelty. It's also the rarest dopamine hit — the legendary pull.

## Maternal germline mosaicism

This is the part that makes "same two parents, different siblings" feel real even when crossover and mutation are off the table.

In actual biology, a mother's ovaries don't all carry one identical genome — different egg cells can carry small mutations that arose during the mother's own development. So even before any recombination with the father, each egg is already a slightly different draw from a mosaic population.

**Mechanic:** the displayed maternal genome (the one the player sees on the breeding UI) is a _consensus_, not the actual gamete. Internally, each plant marked as a "mother" carries a small population of variant genomes — say 3–5 variants, each within Hamming distance ~3 of the consensus. Each breeding event samples one variant uniformly at random as the actual contributing gamete.

Effect on the player:

- Breeding the same Parent A × Parent B pair twice will produce different siblings even if the player could somehow lock crossover points. The variance has another hidden layer.
- Inspecting a mother (with a future "microscope" tool, perhaps?) could reveal her mosaic population — rewarding observation with predictability.
- Selecting for a mother whose mosaic happens to skew toward a desirable allele is a real long-term breeding strategy, just like human plant breeders track maternal lines.

The father doesn't get the same treatment in real biology — sperm is produced continuously and mosaicism is much less pronounced. So this asymmetry between the two parents has a basis, and it gives players a reason to care which parent they pick as the seed-bearer vs. the pollen donor. (In a clover game where both functions can live in the same plant, this is a meaningful design choice.)

## Resilience and seed count

- **Resilience** = sum of dominant-positive alleles minus recessive-negative penalties, with a small bonus for novel de novo alleles that survive the first generation (proven viable).
- **Seed count** = derived from the seed-coat region's hex value directly. So one specific locus is what you're really optimizing for if you want volume. Range: low single digits to ~16 seeds per cross.
- **Carrier status** is invisible to the player without inspection tools. Two healthy-looking plants can produce a blighted child if both carry the same hidden recessive — this is the central source of long-term breeding tension.

## What makes this loop work

Three layers of hidden information stack to drive the loot-box feel:

1. **Carrier status** (medium-term) — recessives lurking in apparently-healthy plants, surfacing in grandchildren.
2. **Maternal mosaic** (per-breeding) — same parents, different siblings, every cross.
3. **De novo mutations** (long-tail) — the chance, on any given seed, that something genuinely new enters your lineage.

Layer 1 rewards careful pedigree tracking. Layer 2 means every breeding is its own pull. Layer 3 is the dream — the reason you keep breeding even when your "ideal" plant already exists, because somewhere in the next litter could be a trait nobody in your prairie has ever grown before.
