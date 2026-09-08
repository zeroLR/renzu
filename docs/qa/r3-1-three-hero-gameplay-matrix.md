# R3.1 Three-Hero Gameplay Matrix

Use this matrix on staging after the simplification PR reaches `main`.

## Shared fixed-turn flow

- [ ] player action always hands off to CPU exactly once
- [ ] CPU THINKING appears before one CPU action
- [ ] CPU action always returns control to player when the match continues
- [ ] no STEP ARMED / FOLLOW-UP / END TURN state appears
- [ ] ability targeting remains readable and cancellable
- [ ] board effects expire on the expected logical turn

## Vanguard

- [ ] qualifying pattern visibly produces Fortified Guard
- [ ] Blink / Charge create meaningful repositioning or push decisions
- [ ] cooldown pacing is readable without extra turn phases
- [ ] defense/mobility tension feels different from Arcanist and Shade

## Arcanist

- [ ] qualifying patterns naturally produce Mana
- [ ] low-Mana and high-Mana board states lead to different decisions
- [ ] Seal / Phase create a clear spatial-control plan
- [ ] Flow refund is understandable through normal HUD feedback

## Shade

- [ ] enemy adjacency produces Pressure in a predictable way
- [ ] Corrupt rewards tactically useful contact instead of generic ability use
- [ ] spacing provides understandable counterplay
- [ ] disruption feels different from Vanguard movement and Arcanist control

## Cross-roster identity

- [ ] Vanguard reads protection / repositioning opportunities first
- [ ] Arcanist reads pattern-to-resource / space-control opportunities first
- [ ] Shade reads contested-contact / removal opportunities first
- [ ] no two heroes feel like the same plan with a different meter
- [ ] each hero remains understandable under the same turn topology

## Exit

R3.1 closes when all three active heroes are playable on staging, fixed turn flow is clean, each hero has a distinct board-reading priority/economy/signature sequence/counterplay, and no P0/P1 hero or turn-flow blocker remains.
