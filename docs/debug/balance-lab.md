# Debug Balance Lab

The Balance Lab is a debug-only CPU self-play surface for fast hero-balance iteration.

## Entry

Add `?debug=1` to the RENZU URL. A floating `LAB` button appears without changing the normal product router or production flow.

## Setup

The current slice supports:

- pair simulation or the full 3 × 3 Vanguard / Arcanist / Shade directional matrix;
- optional seat swap for pair simulations;
- games per seat;
- deterministic seed;
- maximum actions before a match is classified as stalled;
- a shared CPU evaluator profile:
  - candidate width;
  - attack weight;
  - defense weight;
  - ability weight;
  - optimal move rate;
  - blunder tolerance.

Both seats use the same evaluator profile so the default experiment isolates hero/rules effects instead of comparing different AI skill levels.

## Runtime contract

Self-play uses the same production combat path:

```text
AbilityActionState
  → listLegalActions
  → chooseAction
  → resolveSessionAction
  → next actor
```

`resolveAiTurn()` is actor-agnostic and is also the implementation behind the normal P2 CPU turn. Vanguard Guard placement support uses the same augmentation path in self-play as the normal CPU.

The Balance Lab does not maintain a second combat ruleset.

## Data-health-first results

A balance percentage is only useful when the underlying matches are valid. Results therefore expose health before interpretation:

- valid games / total games;
- simulation error rate;
- stalled rate;
- placement/action ratio;
- P1 win rate;
- draw rate;
- average, P50 and P90 action count;
- hero win rate and hero-specific ability usage;
- pattern-event counts;
- topology-ability conversion rate: win within two own actions after Charge / Phase / Corrupt;
- flagged anomaly matches.

`placement/action ratio` treats Guard as placement support rather than a separate full-turn action. A declining ratio is a useful signal that ability usage may be stretching match pacing.

## Matchup interpretation

The Matchups view separates three questions.

### Seat-adjusted hero pairs

Both directional seat assignments are combined for each unordered hero pair:

```text
Vanguard ↔ Arcanist
Vanguard ↔ Shade
Arcanist ↔ Shade
```

Each row reports both hero win rates together with valid sample count, average actions, and placement ratio. This is the preferred view for hero-vs-hero balance because it reduces first-player bias.

### Mirror seat baseline

Vanguard/Vanguard, Arcanist/Arcanist, and Shade/Shade remain visible as a P1 baseline. Large differences between mirror P1 rates indicate that initiative interacts differently with that hero's mechanics and should not be mistaken for hero strength.

### Tactical benchmark

The first fixed-state benchmark targets Vanguard Charge. Twelve deterministic boards contain four Vanguard stones in line, an enemy stone occupying the fifth intersection, and a legal adjacent Vanguard source that can Charge into the target, push the enemy away, and win immediately.

The benchmark measures whether the current CPU evaluator recognizes this tactical truth independently of how often random self-play reaches the setup. If self-play conversion is low while the benchmark is 100%, the gap is about setup frequency / use timing rather than inability to see the finisher.

## Denial placement-runway invariant

Temporary denial effects are allowed to reduce legal space, but a non-winning denial ability must not create a deterministic future turn with empty board cells and zero legal placements while its blockers remain active.

The rule is evaluated through the shared ability resolver, so unsafe Seal / Phase / Corrupt targets are absent from both human and AI legal-action generation. This preserves the fixed-turn topology and avoids adding a generic pass / END TURN action solely to recover from a hard lock.

This guardrail was introduced after deterministic Arcanist mirror replays showed late-game `no-legal-action` failures: the last one or two empty intersections were all covered by active Seal effects.

## Anomaly flags

Current anomaly classification includes:

- `SIMULATION_ERROR`;
- `STALLED`;
- `SHORT_OUTLIER`;
- `LONG_OUTLIER`;
- `ABILITY_LOOP`;
- `ABILITY_CONVERSION`.

This is a diagnostic shortlist, not an automatic balance verdict.

## Match Inspector and diagnostics

Selecting a flagged match re-runs that deterministic seed with snapshots enabled. The inspector can move through the recorded state/action trace without storing full board snapshots for every simulation in the original batch.

The inspector also re-runs a diagnostic pass and surfaces the real failure class when present, including:

- `not-actor-turn`, `no-legal-action`, or `resolution-failed`;
- actor / hero / action index;
- legal-action count;
- empty and blocked-empty cell counts;
- active Guard / Seal / Corruption / Flame counts;
- Mana / Pressure at failure.

`TAKE OVER` selects the nearest live P1 turn and opens the normal Battle presentation from that snapshot:

- the developer controls P1;
- P2 remains CPU-controlled;
- the experiment CPU profile is preserved;
- normal battle legal-action and resolver rules remain authoritative.

The takeover is intended to validate whether a statistical anomaly is also understandable/exploitable in human play. It is not treated as a replay-perfect continuation after the human changes the recorded line.

## Interpretation workflow

Use the Balance Lab in this order:

1. Verify error/stall rates and valid sample size.
2. Read seat-adjusted pair outcomes instead of raw directional win rates alone.
3. Compare mirror seat baselines to estimate initiative effects.
4. Inspect match length and placement ratio to find control/disruption pacing problems.
5. Use tactical benchmarks to distinguish AI-fidelity problems from balance problems.
6. Inspect / take over representative anomalies.
7. Only then change ability costs, prerequisites, duration, or Pattern Mastery entitlement.

CPU self-play is a balance radar and regression detector. It should reduce the number of manual matches needed, but it does not replace human validation of readability, exploitability, strategic quality, or fun.
