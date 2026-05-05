import { Company } from './companies';

export type HoldingType = 'direct' | 'spv' | 'fund' | 'secondary' | 'other';

export interface StoredPosition {
  id: string;
  companyId: string;
  holdingType: HoldingType;
  investmentAmount: number;
  currency: string;
  purchaseDate: string;
  entryValuationM: number;
  shares: number | null;
  costPerShare: number | null;
  vehicleName: string;
  carryPct: number;
  annualManagementFeePct: number;
  oneTimeAdminFee: number;
  notes: string;
  includeInCommunityStats: boolean;
}

export interface DerivedPosition extends StoredPosition {
  name: string;
  ticker: string;
  sector: string;
  color: string;
  stage: string;
  domain: string;
  latestValuationSignalM: number;
  indicativeSecondaryPrice: number;
  costBasis: number;
  estimatedValue: number;
  secondaryValue: number;
  grossGain: number;
  grossReturnPct: number;
  grossMultiple: number;
  carryAmount: number;
  managementFeeEstimate: number;
  netEstimatedValue: number;
  netGain: number;
  netMultiple: number;
  days: number;
  yearsHeld: number;
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

function blendedSecondaryPrice(company?: Company): number {
  if (!company) return 0;
  return [company.forgePrice, company.hiivePrice, company.noticePrice].sort((a, b) => a - b)[1];
}

export function derivePosition(p: StoredPosition, totalCurrVal: number, liveCompanies?: Company[]): DerivedPosition {
  const company = liveCompanies?.find((c) => c.id === p.companyId);
  const name = company?.name ?? p.companyId;
  const ticker = company?.ticker ?? p.companyId.toUpperCase();
  const sector = company?.sector ?? 'Private';
  const color = company?.color ?? '#6366F1';
  const stage = company?.stage ?? 'Pre-IPO';
  const domain = company?.domain ?? '';

  const latestValuationSignalM = company?.currentValuationM ?? p.entryValuationM;
  const indicativeSecondaryPrice = blendedSecondaryPrice(company);
  const valuationMultiple = p.entryValuationM > 0 ? latestValuationSignalM / p.entryValuationM : 1;
  const costBasis = p.investmentAmount;
  const estimatedValue = costBasis * valuationMultiple;
  const secondaryValue = p.shares && indicativeSecondaryPrice > 0 ? p.shares * indicativeSecondaryPrice : 0;
  const grossGain = estimatedValue - costBasis;
  const grossReturnPct = costBasis > 0 ? (grossGain / costBasis) * 100 : 0;
  const grossMultiple = costBasis > 0 ? estimatedValue / costBasis : 0;
  const days = Math.max(1, Math.floor((Date.now() - new Date(p.purchaseDate).getTime()) / 86400000));
  const yearsHeld = days / 365;
  const carryAmount = Math.max(grossGain, 0) * (p.carryPct / 100);
  const managementFeeEstimate = costBasis * (p.annualManagementFeePct / 100) * yearsHeld;
  const netEstimatedValue = Math.max(0, estimatedValue - carryAmount - managementFeeEstimate - p.oneTimeAdminFee);
  const netGain = netEstimatedValue - costBasis;
  const netMultiple = costBasis > 0 ? netEstimatedValue / costBasis : 0;
  const allocation = totalCurrVal > 0 ? (estimatedValue / totalCurrVal) * 100 : 0;

  return {
    ...p,
    name,
    ticker,
    sector,
    color,
    stage,
    domain,
    latestValuationSignalM,
    indicativeSecondaryPrice,
    costBasis,
    estimatedValue,
    secondaryValue,
    grossGain,
    grossReturnPct,
    grossMultiple,
    carryAmount,
    managementFeeEstimate,
    netEstimatedValue,
    netGain,
    netMultiple,
    days,
    yearsHeld,
    allocation,
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
