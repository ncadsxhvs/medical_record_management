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

export function saveBonusSettings(settings: BonusSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}
