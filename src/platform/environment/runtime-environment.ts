export type RenzuRuntimeEnvironment = 'local' | 'staging' | 'production';

export function runtimeEnvironment(): RenzuRuntimeEnvironment {
  if (import.meta.env.MODE === 'staging') return 'staging';
  if (import.meta.env.MODE === 'production') return 'production';
  return 'local';
}

export function heroRosterValidationEnabled(): boolean {
  return runtimeEnvironment() !== 'production';
}
