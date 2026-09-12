export type RenzuRuntimeEnvironment = 'local' | 'staging' | 'production';

export function runtimeEnvironment(): RenzuRuntimeEnvironment {
  if (import.meta.env.MODE === 'staging') return 'staging';
  if (import.meta.env.MODE === 'production') return 'production';
  return 'local';
}

export function heroRosterValidationEnabled(): boolean {
  return runtimeEnvironment() !== 'production';
}

export function debugToolsEnabled(search?: string): boolean {
  const query = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  return new URLSearchParams(query).get('debug') === '1';
}
