export interface BonusSettings {
  rvuTarget: number;
  targetStartDate: string;
  targetEndDate: string;
  bonusRate: number;
}

const STORAGE_KEY = 'rvu-bonus-settings';

export function getDefaultSettings(): BonusSettings {
  const now = new Date();
  const year = now.getFullYear();
  return {
    rvuTarget: 0,
    targetStartDate: `${year}-01-01`,
    targetEndDate: `${year}-12-31`,
    bonusRate: 0,
  };
}

export function loadBonusSettings(): BonusSettings {
  if (typeof window === 'undefined') return getDefaultSettings();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.targetPeriod && !parsed.targetStartDate) {
        return getDefaultSettings();
      }
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch {}
  return getDefaultSettings();
}

export function saveBonusSettingsLocal(settings: BonusSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export async function fetchBonusSettings(): Promise<BonusSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      const settings = { ...getDefaultSettings(), ...data };
      saveBonusSettingsLocal(settings);
      return settings;
    }
  } catch {}
  return loadBonusSettings();
}

export async function saveBonusSettings(settings: BonusSettings): Promise<void> {
  saveBonusSettingsLocal(settings);
  try {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch {}
}
