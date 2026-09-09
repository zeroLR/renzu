# R2 Combat Characterization Gate

> **Historical milestone / current regression boundary:** R2 originally included Architect and Swordmaster experiments. The active product baseline was later simplified to Vanguard, Arcanist, and Shade with one fixed turn topology. This document now describes the regression contract that remains relevant after that product decision.

## Purpose

The combat gate protects durable shared behavior across gameplay modules. It is not a requirement to preserve every experimental hero mechanic that existed during R2.

Run:

```bash
npm run test:combat-gate
```

## Current automated gate

| Contract | Characterization |
| --- | --- |
| Vanguard engine | pattern placement materializes Guard; effect lifetime remains correct across the opponent turn |
| Arcanist engine | pattern reward reaches Mana economy and supports real ability activation |
| Shade engine | legal Corrupt consumes Pressure and mutates the shared board state |
| Fixed turn topology | one player action hands off to CPU; one CPU action returns control to player |
| Match ending | normal placement and ability placement terminate through shared session rules |
| Legal-action authority | presentation/AI operate through the same legal action and resolver boundaries |

Lower-level suites remain authoritative for individual illegal targets, cooldown/resource arithmetic, pattern scoring, board-effect expiry, targeting projection, and AI ranking details.

## Active staging combat matrix

### Shared battle flow

- [ ] 9×9 stones render on intersections and edge intersections remain tappable.
- [ ] normal placement visibly hands off to `CPU THINKING`, then returns to the player.
- [ ] every active ability also hands off after resolution; there is no intermediate hero-specific phase.
- [ ] illegal taps do not mutate the board or leave targeting stuck.
- [ ] victory ends input and exposes result actions.
- [ ] rematch creates a clean combat state.

### Vanguard

- [ ] Blink source/target hints match legal movement.
- [ ] Charge eight-direction source/target hints match legal push/move outcomes.
- [ ] pattern placement shows Fortified/Guard feedback and intended expiry.
- [ ] cooldown readiness updates after logical turns.

### Arcanist

- [ ] pattern creation visibly increases Mana.
- [ ] ability activation spends Mana and Flow remains understandable.
- [ ] Phase places a stone and shows Flame denial on cardinal points.
- [ ] blocked Flame points cannot be selected for normal placement.

### Shade

- [ ] adjacent-enemy placement increases Pressure.
- [ ] Corrupt only marks supported, unguarded enemy targets.
- [ ] Corrupt removes the target and temporary denial is visible.

### CPU / AI

- [ ] Easy and Normal never enter a stuck opponent phase during ordinary play.
- [ ] CPU resolves exactly one complete action per logical turn.
- [ ] CPU can use active abilities without breaking turn ownership.
- [ ] obvious ability-created wins/defenses are not ignored in reproducible positions.

## Retired R2 experiments

The following are intentionally **not current regression requirements**:

- Architect formation / Rally / Lattice;
- Swordmaster Momentum / Step / Sever;
- precommit follow-up;
- triggered follow-up;
- after-step or same-turn action chaining;
- follow-up `END TURN` interaction.

They remain visible in Git history and prior PRs as design evidence, but should not be reintroduced accidentally as compatibility work.

## Severity gate

- **P0:** match cannot finish, combat boot failure, unrecoverable state.
- **P1:** common legal action resolves incorrectly, active ability unusable, CPU/session stuck, or turn ownership breaks.

P2 readability/balance findings may move forward only if recorded for the appropriate later milestone and do not make a core action misleading.

## Current exit use

R2 itself is already closed. This suite now serves as a regression boundary for R3+ changes. The active R3.1 staging identity gate is tracked separately in Issue #31.
