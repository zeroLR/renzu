import type { Player, Position } from '../board/board';
import type { AbilityId, HeroId } from '../../heroes/domain/hero-definition';

export type LegalAction = PlaceAction | AbilityAction | FollowUpAction;

export interface PlaceAction {
  kind: 'place';
  actor: Player;
  at: Position;
}

export interface AbilityAction {
  kind: 'ability';
  actor: Player;
  heroId: HeroId;
  abilityId: AbilityId;
  target: Position;
  source?: Position;
}

export interface FollowUpAction {
  kind: 'follow-up';
  actor: Player;
  heroId: HeroId;
  abilityId: AbilityId;
  target: Position;
  source?: Position;
}
