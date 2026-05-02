import { getCompany } from './companies';

export interface StoredPosition {
  id: string;
  companyId: string;
  shares: number;
  entrySharePrice: number;
  entryValuationM: number;
  currentValuationM: number;
  secondaryValuationM: number;
  entryDate: string;
  notes: string;
}

export interface DerivedPosition extends StoredPosition {
  name: string;
  ticker: string;
  sector: string;
  color: string;
  stage: string;
  domain: string;
  currSharePrice: number;
  secSharePrice: number;
  costBasis: number;
  currentValue: number;
  secondaryValue: number;
  unrealizedPL: number;
  unrealizedPct: number;
  multiple: number;
  days: number;
  annualizedRet: number;
  allocation: number;
}

const STORAGE_KEY = 'pm-terminal-positions';

export function loadPositions(): StoredPosition[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePositions(positions: StoredPosition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function derivePosition(p: StoredPosition, totalCurrVal: number): DerivedPosition {
  const company = getCompany(p.companyId);
  const name = company?.name ?? p.companyId;
  const ticker = company?.ticker ?? p.companyId.toUpperCase();
  const sector = company?.sector ?? 'Private';
  const color = company?.color ?? '#6366F1';
  const stage = company?.stage ?? 'Pre-IPO';
  const domain = company?.domain ?? '';

  const currSharePrice = (p.currentValuationM / p.entryValuationM) * p.entrySharePrice;
  const secSharePrice = (p.secondaryValuationM / p.entryValuationM) * p.entrySharePrice;
  const costBasis = p.shares * p.entrySharePrice;
  const currentValue = p.shares * currSharePrice;
  const secondaryValue = p.shares * secSharePrice;
  const unrealizedPL = currentValue - costBasis;
  const unrealizedPct = (unrealizedPL / costBasis) * 100;
  const multiple = currentValue / costBasis;
  const days = Math.max(1, Math.floor((Date.now() - new Date(p.entryDate).getTime()) / 86400000));
  const annualizedRet = (Math.pow(multiple, 365 / days) - 1) * 100;
  const allocation = totalCurrVal > 0 ? (currentValue / totalCurrVal) * 100 : 0;

  return { ...p, name, ticker, sector, color, stage, domain, currSharePrice, secSharePrice, costBasis, currentValue, secondaryValue, unrealizedPL, unrealizedPct, multiple, days, annualizedRet, allocation };
}

/* formatters */
export const fmtM = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}T`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}B`;
  return `$${n.toFixed(0)}M`;
};

export const fmtK = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

export const fmtPct = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
export const fmtX = (n: number): string => `${n.toFixed(2)}x`;
export const fmtDays = (n: number): string => n >= 365 ? `${(n / 365).toFixed(1)}y` : `${n}d`;

/* demo positions so the app looks populated on first load */
export const DEMO_POSITIONS: StoredPosition[] = [
  { id: 'demo1', companyId: 'anthropic', shares: 800, entrySharePrice: 5125, entryValuationM: 41000, currentValuationM: 900000, secondaryValuationM: 850000, entryDate: '2022-06-10', notes: 'Series B entry.' },
  { id: 'demo2', companyId: 'spacex', shares: 200, entrySharePrice: 68500, entryValuationM: 137000, currentValuationM: 350000, secondaryValuationM: 350000, entryDate: '2020-08-22', notes: 'Secondary via Forge.' },
  { id: 'demo3', companyId: 'openai', shares: 500, entrySharePrice: 17200, entryValuationM: 86000, currentValuationM: 300000, secondaryValuationM: 290000, entryDate: '2021-03-15', notes: 'Series C.' },
  { id: 'demo4', companyId: 'anduril', shares: 2000, entrySharePrice: 425, entryValuationM: 8500, currentValuationM: 28000, secondaryValuationM: 28000, entryDate: '2022-12-01', notes: 'Series D.' },
  { id: 'demo5', companyId: 'databricks', shares: 1200, entrySharePrice: 3167, entryValuationM: 38000, currentValuationM: 62000, secondaryValuationM: 62000, entryDate: '2023-02-14', notes: 'Series H.' },
];
