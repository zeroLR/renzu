# R3.1 — Five-Hero Gameplay Pass

## Purpose

R3.1 closes the gap between **five implemented hero systems** and **five recognizably different ways to play RENZU**.

This is an identity and validation pass, not a broad balance pass. Numerical tuning is justified only when a number prevents the intended engine from being experienced.

The shared board remains authoritative for every hero. A hero is successful when it changes what the player looks for on that board, not when it replaces board reading with a separate combat system.

---

## Roster identity contract

### Vanguard — Cooldown / Defense

**Primary tactical question**  
Where can I turn a useful pattern into a protected anchor, then use repositioning or displacement to keep control of the line?

**Economy rhythm**  
Abilities are paced by cooldowns. Qualifying placement patterns create a short-lived Fortified Guard on the new stone, giving Vanguard temporary stability while cooldowns cycle.

**Signature play pattern**  
Create a three/four → gain a protected anchor → Blink or Charge to redirect the local fight → wait for cooldown recovery while the board position carries value.

**Weakness / counterplay**  
Cooldown windows reduce flexibility after commitment. A guarded stone is safe but cannot be used as a Charge source while guarded, creating tension between protection and mobility.

**Beginner behavior**  
Build ordinary board threats first. Use movement or push effects when they clearly improve a line or answer an enemy threat rather than activating them simply because they are ready.

**Expected CPU behavior**  
Prefer forced wins/blocks, then use Charge or Blink when simulation produces meaningful topology gain or denial. Avoid ability spam with no board outcome.

---

### Arcanist — Mana / Control

**Primary tactical question**  
Which pattern should I build now so that I can afford the control action I will need next?

**Economy rhythm**  
Exact three/four placement patterns generate Mana. Ability use participates in the Flow economy, encouraging repeated conversion between ordinary pattern play and board manipulation rather than passive resource waiting.

**Signature play pattern**  
Build a scoring pattern → bank Mana → spend on Seal/Phase/Blink to reshape open space → use the reshaped board to create the next pattern.

**Weakness / counterplay**  
Without productive patterns, Mana access slows down. Control effects are strongest when the Arcanist has already read the next line of play; spending Mana without a follow-up plan loses tempo.

**Beginner behavior**  
Treat Mana as a consequence of good Gomoku play first. Look for a clear pattern before reaching for Phase or Seal.

**Expected CPU behavior**  
Recognize ability-created wins and denial, but prefer ordinary placement when an ability does not materially improve threats, lines, or blocked space.

---

### Shade — Pressure / Disruption

**Primary tactical question**  
How close can I safely play to the enemy so that pressure becomes a tactical removal opportunity?

**Economy rhythm**  
Pressure is gained by placing adjacent to enemy stones. The resource rewards contact and contest rather than isolated shape-building.

**Signature play pattern**  
Contest an enemy cluster → gain Pressure → use Corrupt to remove a supported key stone and leave denial behind → exploit the broken line.

**Weakness / counterplay**  
Shade needs enemy proximity to accelerate. Spread-out or low-contact positions reduce Pressure gain, while poorly timed aggression can strengthen the opponent's own local shape.

**Beginner behavior**  
Do not chase every enemy stone. Build contact where removing one stone would actually change a threat or open a line.

**Expected CPU behavior**  
Prioritize Corrupt when it removes a key threat, breaks multiple winning continuations, or meaningfully reduces enemy topology; otherwise continue ordinary board development.

---

### Architect — Formation / Control

**Primary tactical question**  
Where should I build a support network so that future movement and space denial become legal?

**Economy rhythm**  
Readiness comes from live formation geometry rather than a stored currency. Rally and Lattice become available only when the board itself satisfies their structural conditions.

**Signature play pattern**  
Build connected support → unlock formation readiness → Rally a stone into stronger support or Lattice an anchor to seal surrounding space → continue expanding from the resulting structure.

**Weakness / counterplay**  
Dispersed stones and early-board positions provide fewer useful formation actions. Breaking support relationships can remove readiness without needing to attack a separate resource pool.

**Beginner behavior**  
Prefer placements that serve both Gomoku shape and future adjacency. Do not create clusters solely to light up an ability if the cluster has no line value.

**Expected CPU behavior**  
Use Rally/Lattice only when the resulting board gains line potential, reduces enemy space, or resolves a tactical threat. Formation availability alone is not sufficient reason to cast.

---

### Swordmaster — Momentum / Offense

**Primary tactical question**  
Can I keep converting productive patterns into another aggressive action before the opponent forces me into a quiet move?

**Economy rhythm**  
Qualifying patterns build Momentum and refresh Step access. Quiet placements decay Momentum unless protected by Step. At full Momentum, placement can open the triggered Sever follow-up.

**Signature play pattern**  
Create a pattern → gain Momentum + Step → Step into the next placement without losing tempo → reach full Momentum → choose Sever or END TURN based on the board.

**Weakness / counterplay**  
Forced defensive or quiet placements drain Momentum. If the opponent can interrupt the chain, Swordmaster loses access to its strongest follow-up timing.

**Beginner behavior**  
Think one placement ahead: Step is valuable when it protects a continuation, not simply because it is available. Sever is optional; skip it when pushing a stone would worsen the position.

**Expected CPU behavior**  
Preserve forced tactical priorities, maintain Momentum when a useful chain exists, and use/skip Sever according to simulated board outcome rather than always consuming the follow-up.

---

## Free Battle validation access

R3.1 needs all five heroes to be playable before the R4 unlock economy exists.

The product therefore uses an explicit validation policy:

- **local/dev:** all five player heroes are available for roster validation;
- **staging:** all five player heroes are available and the setup screen shows `ROSTER VALIDATION`;
- **production:** normal profile ownership remains authoritative and locked heroes remain disabled.

The validation override is not persisted into `PlayerProfile` and does not unlock heroes. R4 remains responsible for the actual production unlock loop.

CPU hero selection always exposes the full roster because CPU ownership is not a player progression concept.

---

## Validation protocol

For each hero, play enough Free Battle matches to answer the following without relying on implementation knowledge:

1. What board feature am I looking for before using the hero system?
2. What makes the hero's economy become ready?
3. What is the most characteristic two- or three-step play sequence?
4. What does the opponent do to interrupt that sequence?
5. Does the default loadout demonstrate the engine?
6. Does the CPU use the hero in a way consistent with the same identity?

Recommended comparison set:

- Vanguard vs Arcanist — stability/cooldown vs resource/control
- Shade vs Architect — contact disruption vs formation control
- Swordmaster vs Vanguard — tempo chain vs deliberate cooldown pacing
- one mirror match per hero when an interaction is ambiguous

---

## R3.1 Exit Criteria

R3.1 is complete when:

- all five heroes are selectable and playable on staging without mutating profile ownership;
- every hero has a legal default loadout;
- every hero creates a recognizably different board-reading priority and economy rhythm;
- the intended signature pattern can be executed through the normal Battle UI;
- each hero has understandable counterplay;
- Easy/Normal CPU behavior does not contradict the hero identity in common situations;
- no P0/P1 hero-specific combat blocker remains;
- any remaining numerical imbalance is documented as balance debt rather than confused with identity failure.

R3.1 does **not** require perfect matchup balance, final VFX/audio, alternate loadouts, Hero Archive completion, or progression unlock tuning.
