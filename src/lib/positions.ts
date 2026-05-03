import { Company, getCompany } from './companies';

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
  carryPct?: number;        // e.g. 20 → 20% carry on gains
  managementFeePct?: number; // e.g. 2 → 2% / year of cost basis
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
  carryFee: number;
  managementFeeAnnual: number;
  managementFeeTotal: number;
  netUnrealizedPL: number;
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

export function derivePosition(p: StoredPosition, totalCurrVal: number, liveCompanies?: Company[]): DerivedPosition {
  const company = liveCompanies ? liveCompanies.find((c) => c.id === p.companyId) : getCompany(p.companyId);
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

  const carryFee = unrealizedPL > 0 ? ((p.carryPct ?? 0) / 100) * unrealizedPL : 0;
  const managementFeeAnnual = ((p.managementFeePct ?? 0) / 100) * costBasis;
  const managementFeeTotal = managementFeeAnnual * (days / 365);
  const netUnrealizedPL = unrealizedPL - carryFee - managementFeeTotal;

  return {
    ...p, name, ticker, sector, color, stage, domain,
    currSharePrice, secSharePrice, costBasis, currentValue, secondaryValue,
    unrealizedPL, unrealizedPct, multiple, days, annualizedRet, allocation,
    carryFee, managementFeeAnnual, managementFeeTotal, netUnrealizedPL,
  };
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
