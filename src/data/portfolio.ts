export interface Investment {
  company: string;
  invested: number; // SEK
  entryValuationB: number; // USD billions
  paperValueLow: number; // SEK
  paperValueHigh: number; // SEK
  multiplierLow: number;
  multiplierHigh: number;
  projectedValueLow: number; // SEK
  projectedValueHigh: number; // SEK
  projectedMultiplierLow: number;
  projectedMultiplierHigh: number;
  projectedStage: string;
  color: string;
  accentColor: string;
}

export const investments: Investment[] = [
  {
    company: 'Anthropic',
    invested: 31_000,
    entryValuationB: 18,
    paperValueLow: 210_000,
    paperValueHigh: 385_000,
    multiplierLow: 6.8,
    multiplierHigh: 12.4,
    projectedValueLow: 520_000,
    projectedValueHigh: 650_000,
    projectedMultiplierLow: 16.8,
    projectedMultiplierHigh: 21,
    projectedStage: '$900B–$1T+ IPO',
    color: '#FF6B35',
    accentColor: '#FF8C5A',
  },
  {
    company: 'SpaceX',
    invested: 200_000,
    entryValuationB: 180,
    paperValueLow: 1_035_000,
    paperValueHigh: 1_400_000,
    multiplierLow: 5.2,
    multiplierHigh: 7.0,
    projectedValueLow: 1_300_000,
    projectedValueHigh: 1_600_000,
    projectedMultiplierLow: 6.5,
    projectedMultiplierHigh: 8.0,
    projectedStage: '>$2T IPO target',
    color: '#3B82F6',
    accentColor: '#60A5FA',
  },
  {
    company: 'OpenAI',
    invested: 100_000,
    entryValuationB: 90,
    paperValueLow: 274_000,
    paperValueHigh: 322_000,
    multiplierLow: 2.7,
    multiplierHigh: 3.2,
    projectedValueLow: 350_000,
    projectedValueHigh: 420_000,
    projectedMultiplierLow: 3.5,
    projectedMultiplierHigh: 4.2,
    projectedStage: '$1T–$1.2T+ IPO Q4 2026',
    color: '#10B981',
    accentColor: '#34D399',
  },
  {
    company: 'Anduril',
    invested: 100_000,
    entryValuationB: 30,
    paperValueLow: 300_000,
    paperValueHigh: 500_000,
    multiplierLow: 3.0,
    multiplierHigh: 5.0,
    projectedValueLow: 600_000,
    projectedValueHigh: 800_000,
    projectedMultiplierLow: 6.0,
    projectedMultiplierHigh: 8.0,
    projectedStage: '$100B+ IPO 2027',
    color: '#8B5CF6',
    accentColor: '#A78BFA',
  },
  {
    company: 'Databricks',
    invested: 25_000,
    entryValuationB: 60,
    paperValueLow: 55_000,
    paperValueHigh: 70_000,
    multiplierLow: 2.2,
    multiplierHigh: 2.8,
    projectedValueLow: 100_000,
    projectedValueHigh: 130_000,
    projectedMultiplierLow: 4.0,
    projectedMultiplierHigh: 5.2,
    projectedStage: '$200B+ IPO 2027',
    color: '#F59E0B',
    accentColor: '#FCD34D',
  },
];

export const totalInvested = 456_000;
export const totalPaperValueLow = 1_874_000;
export const totalPaperValueHigh = 2_677_000;
export const totalProjectedValueLow = 2_870_000;
export const totalProjectedValueHigh = 3_600_000;
export const totalMultiplierLow = 4.1;
export const totalMultiplierHigh = 5.9;
export const totalProjectedMultiplierLow = 6.3;
export const totalProjectedMultiplierHigh = 7.9;
