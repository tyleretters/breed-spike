# breed-spike

Standalone React spike prototyping a plant crossbreeding mechanic intended for [revery-prairie](https://github.com/tyleretters/revery-prairie). The goal: test a SHA256-based genome with Mendelian dominance, mutation events, maternal germline mosaicism, and retrotransposons in isolation. If the mechanic earns its keep here, it gets ported back into the main game.

This file is the entry point for any future Claude session picking up the spike. Read it top-to-bottom before making changes — the design has accumulated nuance that's not obvious from the code alone.

## Origin and intent

The spike grew out of a brainstorm with the project owner (Tyler) and his genetics friend. They wanted a breeding mechanic that:

- Uses a SHA256 hash arranged in an 8×8 grid as a plant's "DNA"
- Crossbreeds two parents of the same species with hex-level operations
- Has a "loot box" feel — outcomes are not always predictable
- Rewards selection over generations toward more resilient plants
- Yields seeds at the end (count is partially random)
- Pulls real genetics concepts in where they make the model deeper, not just decorative

Three big-picture approaches were brainstormed (`docs/00-design-brainstorm.md`):

1. **Chromosomal crossover** — rows as chromosomes, segment-swap recombination
2. **Bitwise alchemy** — player picks an AND/OR/XOR/MAJ3/AVG operator
3. **Loci, dominance, and linkage** — regions of the grid encode named traits with dominance and recessive-carrier mechanics

Idea 3 was chosen and extended (`docs/01-design-idea3.md`) with:

- A **mutation taxonomy** — missense, nonsense, de novo (the legendary tier)
- **Maternal germline mosaicism** — the displayed mother genome is a consensus; each breeding samples from a small mosaic population around it
- **Retrotransposons** — stress-activated 2×2 region copy-paste, the structural-novelty counterpart to point mutations

The spike implements that Idea 3 + retrotransposon model.

## Core model

### Genome

```
type Genome = string  // 64-char hex (256 bits) from SHA256 of any input string
```

Arranged as an **8×8 grid** of hex nibbles. Each cell carries 4 bits. Each cell is a "locus."

Founders are seeded by `sha256("revery prairie clover #001")` etc. so the same input always gives the same genome.

### Region map (`src/engine/regions.ts`)

The grid is divided into named regions ("loci" in genetics terms):

```
 R R . . . . C C       R = Root System (top-left 2x2)
 R R . . . . C C       C = Canopy (top-right 2x2)
 . . . . . . . .       F = Flowering Time (middle band, rows 3-4 cols 2-5, 8 cells)
 . . F F F F . .       S = Seed Coat (bottom-left 2x2)
 . . F F F F . .       P = Pest Resistance (bottom-right 2x2)
 . . . . . . . .       . = Modifier locus (single-cell minor effect, 40 cells)
 S S . . . . P P
 S S . . . . P P
```

Each named region has a `description` and a `traits` list — these power the hover-to-inspect UI. The exact layout is deliberately tunable (see `REGIONS` constant). Modifier cells get a generic description shared across all of them.

### Inheritance rules (`src/engine/breed.ts`)

For each of the 64 cells, resolve dominance per nibble:

- A nibble `>= 8` is **dominant**, a nibble `< 8` is **recessive**. (Hex analogue of Mendel's uppercase/lowercase allele convention.)
- **Both dominant** → take the higher-value nibble (the "strongest" allele wins). Source tagged `'A'` or `'B'`.
- **One dominant + one recessive** → dominant expresses, recessive is **carried** (stored in `child.carriers[pos]` but invisible).
- **Both recessive** → take the higher-value nibble (least bad recessive expresses).

Carriers are the central long-term tension: two healthy-looking plants can both carry a low recessive at the same position and produce a child with both copies expressed.

**Not currently implemented**: chromosomal crossover (Idea 1's recombination math) and linkage disequilibrium (the 70% adjacent-block co-inheritance from Idea 3's spec). Each cell resolves independently. Adding these is the highest-impact next move if the model needs more structure-preservation across generations.

### Mutation events (`src/engine/mutations.ts`)

After dominance resolution, each cell rolls for a possible mutation event. The base rates scale with the **environmental stress** slider (`baseMutationRates(stress)`):

- **missense** — `0.01 + stress * 0.04` per cell. Nibble flips to a neighboring value (`c` → `b` or `d`). Trait shifts slightly within its family.
- **nonsense** — `0.001 + stress * 0.02` per cell. Nibble forced to `0`. Silences the locus.
- **de novo** — `0.0001 + stress * 0.005` per cell. Nibble replaced with a value **neither parent contributed and never seen at that position in this lineage before**. Logged as `firstOccurrence: true` if it's globally novel. The legendary tier.
- **retrotransposon** — `0.005 + stress * 0.2` per breeding (whole genome). Stress-activated by design (real retrotransposons activate under genome stress). Copies a 2×2 region from one position and pastes it over another. Source can be a named region or a 2×2 modifier block; target similarly. Models real evolutionary "gene duplication followed by neofunctionalization."

Roll precedence in `breed.ts`: de novo > nonsense > missense (each cell rolls once; first triggered class wins). Retrotransposon rolls separately at the end of the breeding and overlays its target cells regardless of any per-cell mutations there.

**De novo "first occurrence" tracking**: `App.tsx` holds a `knownAlleles: Set<string>` keyed by `${region}:${pos}:${nibble}`. Founders seed it with all their nibbles. A de novo event marks `firstOccurrence: true` only if the (region, position, nibble) tuple isn't already in the set.

### Maternal germline mosaicism (`src/engine/mosaic.ts`)

Real biology: a mother's ovaries carry multiple slightly-different egg cells from somatic mutations during her own development. Sperm doesn't have this asymmetry to nearly the same degree.

The spike models this:

- Each plant used as a mother has a deterministic mosaic population of **4 variants**, generated by a `mulberry32` RNG seeded by `'mosaic:' + genome`. Each variant drifts from the consensus by 1–3 random nibble flips.
- When `mosaicEnabled` is true, each breeding samples one variant uniformly. The displayed mother UI is still the consensus.
- The asymmetry between mother and father is the entire point — toggling mother/father on the same plant pair yields different sibling distributions.
- The spike surfaces this in the breeding outcome panel: "mother variant ≠ consensus by N bits."

### Resilience and seed count

- `resilience = sum_over_cells(value - 7.5) - 0.5 * count(low_carriers) + 4 * denovoFirsts + floor(hammingDistance / 16)`
  - Roughly: bias toward dominant alleles, mild penalty for low recessive carriers, bonus for de novo first occurrences (proven viable since the seed is going to germinate), small bonus for outcrossed parents (heterozygosity).
- `seedCount = max(1, round(sum_of_seed_coat_cells / 4))`
  - Comes directly from the bottom-left 2×2 region. So one specific locus is what you optimize for if you want yield. Range: ~1 to ~16 seeds.

## Genetics glossary

The genetics friend speaks fluent biology, the project owner is fluent in TypeScript, and a future Claude session may be fluent in neither. Keep the model accurate to the named concepts — they were chosen because they map cleanly onto the grid:

- **Locus** — a fixed position on a chromosome. Here: a single cell of the 8×8 grid.
- **Allele** — one of multiple variants of a gene at a locus. Here: a hex value `0`–`f`.
- **Dominant / recessive** — dominant alleles express when paired with recessives; recessives express only when paired with another recessive. Here: nibble `>= 8` vs `< 8`.
- **Heterozygous / homozygous** — having two different vs two identical alleles at a locus.
- **Carrier** — heterozygous individual with a hidden recessive that doesn't express but passes to offspring.
- **Hamming distance** — count of positions where two equal-length strings differ. Here: bit-level proxy for parental genetic distance / heterozygosity.
- **Heterosis / hybrid vigor** — the observation that offspring of distantly-related parents are often more robust than either parent.
- **Missense / nonsense / frameshift mutations** — different ways a single mutation can damage a gene. Missense changes one amino acid (mild), nonsense truncates the protein (severe), frameshift scrambles everything downstream (catastrophic).
- **De novo mutation** — a mutation present in the offspring but in neither parent. Genuinely novel.
- **Retrotransposon** — a "jumping gene" that copies itself to a new genomic location via an RNA intermediate. Major driver of plant genome evolution. Activates under stress (heat, drought, hybridization).
- **Maternal germline mosaicism** — different egg cells of the same mother carrying different genotypes due to mutations during her own development. Distinct from somatic mosaicism (different body tissues of the same individual).
- **Linkage / linkage disequilibrium** — physically adjacent loci tend to inherit together. Models the fact that crossover is rare and localized.
- **Epistasis** — when one gene modifies the effect of another. The "modifier" cells in our region map are conceptually epistatic.
- **Exon deletion** — removing a chunk of coding sequence. Usually loss-of-function. Not modeled here (would mostly produce dead seeds).

## Code structure

Two-layer separation, mirroring revery-prairie's convention:

### `src/engine/` — pure TypeScript, no React

- `types.ts` — `Genome`, `Plant`, `BreedEvent`, `BreedingResult`, `Region`, etc. The single source of truth for shape.
- `hash.ts` — async SHA256 via Web Crypto, plus `mulberry32` seeded RNG and `seedFromString` (FNV-1a).
- `genome.ts` — `popcountHex`, `hammingDistance`, `nibbleAt`, `isDominant`, `posToRowCol`, etc. Pure helpers.
- `regions.ts` — `REGIONS` constant with descriptions and trait lists, plus `regionAtPos`, `regionById`, `MODIFIER_DESCRIPTION`.
- `mosaic.ts` — `generateMosaic` (deterministic per genome), `sampleMosaicVariant`.
- `mutations.ts` — `baseMutationRates`, `rollMissense`, `rollDeNovoNibble`, `tryRetrotransposon`.
- `breed.ts` — `breed(mother, father, config, knownAlleles)` is the orchestrator. Returns `BreedingResult` with the child plant and a `CellResolution[]` describing what happened at every cell.
- `lineage.ts` — `createFounderFromString`, `seedKnownAlleles`. The known-alleles set is the substrate for de novo first-occurrence detection.

### `src/components/` — React UI

- `App.tsx` — session state (plants, selections, config, knownAlleles, totals, lastLitter, inspectedPlantId, pedigreeRootId). Pre-loads two default founders matching the design doc examples and wires the panels. Owns the litter loop in `handleBreed` (calls `breed()` N times where N = mother.seedCount).
- `BreedingPanel.tsx` — three-column layout (mother / father / inspector), animated reveal keyed to `inspectedPlant.id`, Breed button shows the upcoming litter size, hover state lifted up so all three grids highlight in sync, RegionDetail underneath.
- `GenomeGrid.tsx` — 8×8 hex grid with region-tinted backgrounds (HSL by value), dominance borders, carrier subscripts, sequential cell-by-cell reveal animation, retrotransposon source-outline + target-burst overlays. Hover state is lifted up by the parent.
- `RegionDetail.tsx` — hover inspector. Shows region label, trait chips, description, and a side-by-side mother/father/child allele comparison at the hovered region's cells.
- `PlantCard.tsx` — compact card with grade badge, label, genome preview, generation, seeds, resilience, popcount. Used in lineage list and breeding panel headers.
- `Backpack.tsx` — list of unplanted seeds (planted=false) sorted by grade, with Plant / Discard / Pedigree buttons per seed and a click-to-inspect interaction.
- `LineageGraph.tsx` — SVG pedigree chart. Recursively walks up `parents.{mother, father}` from a root plant, renders nodes at slot positions, draws pink/blue edges to parents. Side panel inspects a focused node and lets you re-root the chart on any ancestor.
- `GradeBadge.tsx` — colored letter chip rendering one of F/E/D/C/B/A/S based on resilience.
- `Controls.tsx` — environmental stress slider with live mutation rate readout, mosaic toggle.
- `EventFrequencyPanel.tsx` — cumulative event totals across the session with per-cross averages and de novo first-occurrence highlight.
- `LineagePanel.tsx` — sortable list of *planted* plants this session with Set Mother / Set Father / Pedigree buttons.
- `EventLog.tsx` — list of mutation events for a single breeding.
- `RegionLegend.tsx` — color key in the header.
- `NewFounderForm.tsx` — text inputs to spawn additional founders by hashing a string.

### Data flow

```
NewFounderForm → App.handleAddFounder → createFounderFromString → plants[] (planted=true) + knownAlleles
LineagePanel  → App.handleSelect → selectedMotherId / selectedFatherId
BreedingPanel.Breed → App.handleBreed → loop N=mother.seedCount calls of engine/breed.ts
                    → results: BreedingResult[] → plants[] (planted=false) + lastLitter + totals + knownAlleles
Backpack click  → App.handleInspect → inspectedPlantId → BreedingPanel re-runs reveal animation
Backpack Plant  → App.handlePlant → flips planted=true → enters LineagePanel as parent option
Backpack Discard→ App.handleDiscard → removes plant + clears inspector if needed
LineagePanel.Pedigree / Backpack.Pedigree → App.pedigreeRootId → LineageGraph replaces BreedingPanel
GenomeGrid hover → BreedingPanel.hoveredPos → RegionDetail + highlightCells on all three grids
Controls       → App.config (stress, mosaicEnabled) → consumed by next breed() call
```

Session state is pure React. Persistence is intentionally not implemented yet (see "Open questions").

## Conventions

Match revery-prairie:

- No enums. `as const` objects + type aliases.
- Arrow functions throughout (`const foo = () => {}`).
- ES modules, `verbatimModuleSyntax`, `erasableSyntaxOnly` — types must be `import type` or shape-only `as const`.
- Engine code must not import from React or `src/components/`. Currently honored.
- Tailwind for styling. Custom theme tokens in `src/styles.css` `@theme` block. Colors use `var(--color-*)` references in JSX style props for animation (cell-flash and retro-burst keyframes).
- `@/` path alias maps to `src/`.
- Sentence case for prose, Title Case for labels (per project owner's preference). Code identifiers preserve original casing.

## Two display modes

The UI ships with **two modes** controlled by `mode: 'simple' | 'dense'` in `App.tsx`. Default is `'simple'`. Toggle via the header chip ("Specimen / Dense") or the `/` keyboard shortcut.

### Simple mode (Blade Runner 2049-inspired, default)

Two views inside the simple mode shell:

- **Sequencer** (`src/components/Sequencer.tsx`) — three horizontal genome strands stacked: Parent A on top, **offspring in the middle**, Parent B on bottom. Hit "Run sequence" → an amber scan line sweeps left-to-right while the offspring strand resolves cell by cell. Tick marks above and below the offspring highlight differences from each parent. When the scan completes, the grade letter rises into view and the shell transitions to:
- **Specimen Viewer** (`src/components/SpecimenViewer.tsx`) — single centered 8×8 grid rendered as colored squares (no chars). Parent attribution above, big grade letter and seed count below, littermate strip at the very bottom (click any sibling to swap into center). Click any cell to magnify that region — opens a modal with hex chars and the trait description (`RegionDetail` reused). Plant / Discard / Pedigree / Run Another Sequence buttons.
- **SequencerStrand** (`src/components/SequencerStrand.tsx`) — primitive: one horizontal genome row of 64 colored chips. `revealedCells` drives the cell-by-cell reveal; `diffAgainst` adds tick marks where this strand differs from another.

Side panels (Backpack, Lineage, Controls, Frequency, NewFounderForm) are tucked into a slide-out **SimpleDrawer** on the right edge. Triggered by the vertical "Library" tab or the `]` key. Sections are collapsible accordions; Backpack and Planted Lineage open by default.

### Dense mode (opt-in)

The original layout: `BreedingPanel` with mother / father / inspector grids, full sidebar with all panels visible at once. Reached by clicking "Dense" in the header chip or pressing `/`.

Both modes call the same `handleBreed`, `handlePlant`, `handleDiscard`, `handleSelect`, etc. from `App.tsx`. Engine and state are identical; only rendering changes.

## What's built (current state)

- Two-parent breeding with full dominance resolution
- All four mutation event types fire and are visualized: missense (yellow flash), nonsense (orange), de novo (magenta, marked first-occurrence in event log), retrotransposon (green burst with source highlight + target burst)
- Maternal mosaicism toggle with deterministic per-mother variant population
- Stress slider with live mutation rate readout
- Sequential cell-by-cell reveal animation tied to position (~22ms per cell, ~1.4s total)
- Hover-to-inspect: any cell on any grid → all three grids highlight the same region, RegionDetail shows the trait description and side-by-side allele comparison
- Cumulative event totals with per-cross averages
- Founder spawning via text input (string → SHA256 → genome)
- **Litters & seed backpack** — each breeding produces N=mother.seedCount sibling seeds (each rolled independently, so siblings differ from each other even with the same parents). All seeds land in the **Backpack** panel as unplanted. Player must hit **Plant** on a seed to make it parent-eligible. **Discard** removes a seed. Founders are auto-planted. The lineage panel only lists planted plants.
- **FEDCBAS grade** (`src/engine/grading.ts`) — plants are graded F/E/D/C/B/A/S based on resilience score thresholds. Surfaced as colored `GradeBadge` on every plant card, the inspector outcome panel, the backpack, and pedigree nodes. S = best, F = worst.
- **Pedigree chart** (`src/components/LineageGraph.tsx`) — clicking the **Pedigree** button on any plant card opens a SVG-rendered family tree with the selected plant at the bottom and ancestors stacked above (max depth 3, so up to 8 oldest ancestors visible). Each node shows a mini 8×8 genome visualization, the grade badge, and the label. Pink edges = mother lines, blue edges = father lines. Click any node to inspect it in a side panel; "Make this plant the pedigree root" lets you walk up the tree.

## Open design questions

These are scoped for future sessions to consider, not pre-decided:

- **Crossover / recombination is not implemented.** Each cell is resolved independently. Adding chromosomal crossover (Idea 1) would change the inheritance pattern significantly — entire 8-nibble row segments would be inherited as units. Worth prototyping if the current model feels too "scattershot" across generations.
- **Linkage disequilibrium not modeled.** Idea 3's spec called for adjacent regions inheriting as blocks 70% of the time. Currently 0% — every cell is independent. This makes large structural traits less stable across generations than they probably should be.
- **No selfing / hermaphroditism rules.** A plant can be both mother and father in different breedings, but the UI doesn't prevent picking the same plant for both roles. Real plants do self-pollinate — selfing is a useful breeding strategy for fixing recessives. Should this be allowed, encouraged, or warned against?
- **No persistence.** Refresh = lose the lineage. localStorage-keyed by session id would be straightforward.
- **Region map is hardcoded.** The 5 named regions plus modifier band assumes one species. Real game would want different region maps per species (clover vs. wheat vs. tomato have different important traits).
- **Visible phenotype is implicit.** The grid shows raw alleles; the player has to mentally translate "high values = stronger trait." A visible plant illustration that responds to genome values would close the loop.
- **Inbreeding depression not modeled.** Hamming distance close to 0 should produce weaker offspring (real heterosis loss). Currently the resilience formula gives a bonus for outcrossing but no penalty for inbreeding.
- **Frameshift, exon deletion, somatic mosaicism** were mentioned by the genetics friend and intentionally not modeled (catastrophic / similar to nonsense / more flavor than mechanic). Could be added as rare "blighted seed" failure modes.
- **Retrotransposon target placement.** Currently picks any 2×2 source/target with no preference. Real retrotransposons have insertion-site biases. A weighted distribution (e.g. higher chance into modifier regions, lower into seed coat) would feel more realistic.

## Running

```bash
npm install        # first time
npm run dev        # vite dev server at http://localhost:5173/
npm run typecheck  # tsc -b --noEmit
npm run build      # production build to dist/
```

No tests yet (intentional for a spike). If the spike graduates, port engine tests over from revery-prairie's pattern (`src/engine/__tests__/*.test.ts`, vitest, pure functions only).

## Design docs

- `docs/00-design-brainstorm.md` — original three-ideas brainstorm with worked examples for all three approaches and the comparison matrix.
- `docs/01-design-idea3.md` — standalone deep-dive on the chosen Idea 3, including the genetics friend's input on de novo / mosaicism / retrotransposons, before retrotransposons were added.

The README at `README.md` (if added) is for human readers; this CLAUDE.md is the working brief.

## Project owner notes

- Tyler is a frontend engineer who treats the spike's UI as something he'll iterate on rapidly. Tight components, sensible Tailwind, no premature abstraction.
- His genetics friend reviews the model — keep biology terms accurate. Use the glossary above, don't invent.
- The spike should remain portable back into revery-prairie. Avoid dependencies that wouldn't fit there (it's already React 19 + Tailwind 4 + Vite 8 to match).
- When in doubt about scope: keep it a spike. The goal is to test the breeding mechanic, not to ship a game.
