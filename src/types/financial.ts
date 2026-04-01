export type SourceType =
  | "press_release"
  | "news"
  | "research"
  | "sec_filing"
  | "investor_letter"
  | "earnings_call";

export type Confidence = "confirmed" | "estimated" | "rumored";

export interface MetricSource {
  name: string;
  url: string;
  publishedDate: string; // ISO date
  excerpt?: string;
  sourceType: SourceType;
}

export interface Metric {
  id: string;
  label: string;
  displayValue: string;      // e.g. "$28.7B", "~$650M", "~3,000"
  sublabel?: string;         // e.g. "post-money", "annualized run-rate"
  asOf: string;              // ISO date of most recent source
  confidence: Confidence;
  sources: MetricSource[];
}

export interface FundingRound {
  id: string;
  series: string;            // "Seed", "Series A", "Series F", etc.
  amountDisplay: string;     // "$1.5B"
  valuationDisplay: string;  // "$14B"
  announcedDate: string;     // ISO date
  leadInvestors: string[];
  sources: MetricSource[];
}

export interface FinancialStatement {
  period: string;            // e.g. "FY 2024 (Estimated)"
  items: StatementLineItem[];
}

export interface StatementLineItem {
  label: string;
  valueDisplay: string;
  note?: string;
  confidence: Confidence;
  sources: MetricSource[];
}

export interface CompanyData {
  name: string;
  ticker?: string;
  tagline: string;
  description: string;
  founded: number;
  sector: string;
  hq: string;
  website: string;
  lastUpdated: string;
  heroMetrics: Metric[];
  fundingRounds: FundingRound[];
  financialStatement: FinancialStatement;
  keyMetrics: Metric[];
}
