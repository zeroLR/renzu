import { createPlayerProfile, normalizePlayerProfile, type PlayerProfile } from '../../progression/profile/player-profile';

export const PLAYER_PROFILE_STORAGE_KEY = 'renzu.player-profile.v1';

export interface PlayerProfileStorage {
  load(): PlayerProfile;
  save(profile: PlayerProfile): PlayerProfile;
  clear(): PlayerProfile;
}

export function createBrowserPlayerProfileStorage(storage: Storage | null = typeof localStorage === 'undefined' ? null : localStorage): PlayerProfileStorage {
  return {
    load() {
      if (!storage) return createPlayerProfile();
      try {
        const raw = storage.getItem(PLAYER_PROFILE_STORAGE_KEY);
        return raw ? normalizePlayerProfile(JSON.parse(raw)) : createPlayerProfile();
      } catch {
        return createPlayerProfile();
      }
    },
    save(profile) {
      const normalized = normalizePlayerProfile(profile);
      try { storage?.setItem(PLAYER_PROFILE_STORAGE_KEY, JSON.stringify(normalized)); } catch {}
      return normalized;
    },
    clear() {
      try { storage?.removeItem(PLAYER_PROFILE_STORAGE_KEY); } catch {}
      return createPlayerProfile();
    },
  };
}
