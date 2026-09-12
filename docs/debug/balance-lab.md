# Debug Balance Lab

The Balance Lab is a debug-only CPU self-play surface for fast hero-balance iteration.

## Entry

Add `?debug=1` to the RENZU URL. A floating `LAB` button appears without changing the normal product router or production flow.

## Setup

The first slice supports:

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

## Results

The first report exposes:

- P1 win rate;
- draw / stalled rate;
- average, P50 and P90 action count;
- directional matchup summaries;
- hero win rate;
- ability usage;
- pattern-event counts;
- topology-ability conversion rate: win within two own actions after Charge / Phase / Corrupt;
- flagged anomaly matches.

## Anomaly flags

Current anomaly classification includes:

- `SIMULATION_ERROR`;
- `STALLED`;
- `SHORT_OUTLIER`;
- `LONG_OUTLIER`;
- `ABILITY_LOOP`;
- `ABILITY_CONVERSION`.

This is a diagnostic shortlist, not an automatic balance verdict.

## Match Inspector and takeover

Selecting a flagged match re-runs that deterministic seed with snapshots enabled. The inspector can move through the recorded state/action trace without storing full board snapshots for every simulation in the original batch.

`TAKE OVER` selects the nearest live P1 turn and opens the normal Battle presentation from that snapshot:

- the developer controls P1;
- P2 remains CPU-controlled;
- the experiment CPU profile is preserved;
- normal battle legal-action and resolver rules remain authoritative.

The takeover is intended to validate whether a statistical anomaly is also understandable/exploitable in human play. It is not treated as a replay-perfect continuation after the human changes the recorded line.

## Interpretation

CPU self-play is a balance radar and regression detector. It should reduce the number of manual matches needed, but it does not replace human validation of readability, exploitability, strategic quality or fun.
