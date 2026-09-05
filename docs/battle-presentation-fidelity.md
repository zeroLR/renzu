# Battle Presentation Fidelity

This staging-feedback slice restores two presentation contracts that are essential to RENZU feeling like a Gomoku duel rather than a generic tile board.

## Board geometry

RENZU keeps a 9×9 logical board, but stones are rendered on line intersections.

- 9 logical rows / columns
- 9 visible horizontal / vertical grid lines
- 8 visible spaces between lines
- touch regions are larger than the stones and centered on intersections
- stones, last-action markers, board effects, and ability source highlights share the same geometry mapping

The game-domain board remains unchanged; this is a presentation-coordinate correction only.

## CPU turn choreography

CPU decision logic remains synchronous and deterministic under the existing AI boundary. Presentation timing is applied outside the AI/domain rules:

1. resolve player action
2. render opponent phase
3. wait a bounded thinking delay
4. resolve one CPU decision step
5. render the CPU action
6. if a follow-up is required, wait a shorter follow-up delay and continue
7. render the player phase

Default presentation timing:

- initial CPU thinking: 520 ms
- CPU follow-up: 280 ms

Tests inject a zero-delay function so gameplay tests remain fast and deterministic.
