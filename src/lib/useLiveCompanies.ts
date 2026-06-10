import { COMPANIES } from './companies';
import type { Company } from './companies';

export interface LiveCompanies {
  companies: Company[];
  live: boolean;
  lastUpdate: Date | null;
}

export function useLiveCompanies(): LiveCompanies {
  return { companies: COMPANIES, live: false, lastUpdate: null };
}
