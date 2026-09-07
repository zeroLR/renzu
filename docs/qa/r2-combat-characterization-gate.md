# R2 Combat Characterization Gate

## Purpose

R2.4 is the release gate for the Combat Complete milestone. It does not add combat features or redesign architecture. It proves that the combat contracts built in R2.1–R2.3 remain coherent when exercised together.

The gate has two layers:

1. **Automated characterization** — deterministic cross-module scenarios in CI.
2. **Staging combat matrix** — interaction/readability checks that require the rendered product.

R2 is complete only when both layers are green and no P0/P1 combat blocker remains.

---

## Automated gate

Run:

```bash
npm run test:combat-gate
```

The gate covers these milestone contracts:

| Contract | Characterization |
| --- | --- |
| Vanguard engine | pattern placement materializes Guard; effect survives player handoff and expires after the opponent logical turn |
| Arcanist engine | pattern reward reaches Mana economy and unlocks a real Phase activation lifecycle |
| Shade engine | legal Corrupt consumes Pressure and mutates the shared board state |
| Architect engine | live formation condition, legal target generation, and Rally resolution agree |
| Swordmaster engine | Step → placement → triggered Sever preserves ownership until the chain resolves |
| CPU orchestration | a pending multi-action Swordmaster turn completes through controller choreography and returns to the player |
| Match ending | normal placement and ability placement both terminate through shared session rules |

Existing lower-level suites remain authoritative for detailed boundaries such as individual illegal targets, cooldown arithmetic, pattern scoring, board-effect expiry units, and AI ranking.

The R2.4 suite intentionally tests **integration seams**, not every coordinate permutation already covered elsewhere.

---

## Staging combat matrix

Validate on the current staging build after the gate PR reaches `main`.

### Shared battle flow

- [ ] 9×9 stones render on intersections and edge intersections remain tappable.
- [ ] normal placement visibly hands off to `CPU THINKING`, then returns to the player.
- [ ] illegal taps do not mutate the board or leave targeting stuck.
- [ ] victory ends input and exposes result actions.
- [ ] rematch creates a clean combat state.

### Vanguard

- [ ] Blink: source → target hints match legal movement.
- [ ] Charge: eight-direction source/target hints match legal push/move outcomes.
- [ ] pattern placement shows Fortified/Guard feedback and the effect expires at the intended time.
- [ ] cooldown readiness updates after logical turns.

### Arcanist

- [ ] pattern creation visibly increases Mana.
- [ ] ability activation spends Mana and Flow refund/readiness remains understandable.
- [ ] Phase places a stone and shows Flame denial on cardinal points.
- [ ] blocked Flame points cannot be selected for normal placement.

### Shade

- [ ] adjacent-enemy placement increases Pressure.
- [ ] Corrupt only marks supported, unguarded enemy targets.
- [ ] Corrupt removes the target and its temporary denial is visible.

### Architect

- [ ] Rally/Lattice are unavailable without a qualifying formation.
- [ ] qualifying board state makes the relevant ability selectable without a reload or extra move.
- [ ] Rally source/target hints match the shared legal-action surface.
- [ ] Lattice denial cells are readable and expire correctly.

### Swordmaster

- [ ] pattern creation produces Momentum and Step readiness.
- [ ] Step clearly enters `STEP ARMED · PLACE A STONE` state.
- [ ] Step placement can open Sever without giving control to CPU early.
- [ ] triggered Sever shows source/target hints and `END TURN` remains available.
- [ ] resolving or skipping Sever returns to CPU exactly once.

### CPU / AI

- [ ] Easy and Normal never enter a stuck opponent phase during ordinary play.
- [ ] CPU can use abilities without breaking turn choreography.
- [ ] obvious ability-created wins/defenses are not ignored in reproducible test positions.
- [ ] CPU multi-action follow-up does not exceed the bounded choreography guard.

---

## Severity gate

R2 cannot close with:

- **P0:** match cannot finish, combat boot failure, unrecoverable state.
- **P1:** legal action resolves incorrectly, important ability unusable, CPU/session stuck, turn ownership breaks.

P2 readability/balance findings may move forward only if recorded for the appropriate later milestone and do not make a core combat action misleading.

---

## Exit

R2.4 is complete when:

- full CI is green;
- `npm run test:combat-gate` is green;
- staging combat matrix is green for the v1 five-hero surface;
- there are no open P0/P1 combat blockers.

After this gate, new combat architecture or ability semantics require an explicit scope decision rather than being folded into R3 content work.
