export interface Company {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  color: string;
  currentValuationM: number;
  lastRoundDate: string;
  stage: string;
  description: string;
  arrM: number | null;
  forgePrice: number | null;
  hiivePrice: number | null;
  noticePrice: number | null;
  domain: string;
}

export const COMPANIES: Company[] = [
  { id: 'anthropic',  name: 'Anthropic',     ticker: 'ANTH',    sector: 'AI Safety',           color: '#FF6B35', currentValuationM: 900000, lastRoundDate: '2026-04-29', stage: 'Pre-IPO',   description: 'AI safety company behind Claude.',       arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'anthropic.com' },
  { id: 'spacex',     name: 'SpaceX',        ticker: 'SPACEX',  sector: 'Aerospace',           color: '#3B82F6', currentValuationM: 350000, lastRoundDate: '2024-12-01', stage: 'Pre-IPO',   description: 'Reusable rockets, Starlink, Mars.',      arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'spacex.com' },
  { id: 'openai',     name: 'OpenAI',        ticker: 'OPENAI',  sector: 'AI Foundation',       color: '#10B981', currentValuationM: 300000, lastRoundDate: '2025-10-01', stage: 'Pre-IPO',   description: 'GPT, DALL-E, Sora creator.',             arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'openai.com' },
  { id: 'stripe',     name: 'Stripe',        ticker: 'STRIPE',  sector: 'Fintech',             color: '#635BFF', currentValuationM: 70000,  lastRoundDate: '2023-03-15', stage: 'Pre-IPO',   description: 'Global payments infrastructure.',        arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'stripe.com' },
  { id: 'databricks', name: 'Databricks',    ticker: 'DBX',     sector: 'Data & AI',           color: '#8B5CF6', currentValuationM: 62000,  lastRoundDate: '2024-12-17', stage: 'Series J',  description: 'Unified data analytics platform.',       arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'databricks.com' },
  { id: 'revolut',    name: 'Revolut',       ticker: 'RVLT',    sector: 'Fintech',             color: '#0075EB', currentValuationM: 45000,  lastRoundDate: '2024-08-16', stage: 'Series E+', description: 'Global neobank and super-app.',          arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'revolut.com' },
  { id: 'waymo',      name: 'Waymo',         ticker: 'WAYMO',   sector: 'Autonomous Vehicles', color: '#4285F4', currentValuationM: 45000,  lastRoundDate: '2024-10-25', stage: 'Pre-IPO',   description: 'Autonomous ride-hailing.',               arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'waymo.com' },
  { id: 'epic-games', name: 'Epic Games',    ticker: 'EPIC',    sector: 'Gaming',              color: '#0078F2', currentValuationM: 31500,  lastRoundDate: '2022-04-11', stage: 'Pre-IPO',   description: 'Fortnite and Unreal Engine.',            arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'epicgames.com' },
  { id: 'anduril',    name: 'Anduril',       ticker: 'ANDRL',   sector: 'Defense Tech',        color: '#EF4444', currentValuationM: 28000,  lastRoundDate: '2024-08-01', stage: 'Series F',  description: 'AI-powered defense systems.',            arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'anduril.com' },
  { id: 'canva',      name: 'Canva',         ticker: 'CANVA',   sector: 'Design Tools',        color: '#00C4CC', currentValuationM: 26000,  lastRoundDate: '2021-09-01', stage: 'Pre-IPO',   description: 'Visual content creation platform.',     arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'canva.com' },
  { id: 'discord',    name: 'Discord',       ticker: 'DISCORD', sector: 'Social / Gaming',     color: '#5865F2', currentValuationM: 15000,  lastRoundDate: '2021-09-01', stage: 'Pre-IPO',   description: 'Community and voice platform.',         arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'discord.com' },
  { id: 'perplexity', name: 'Perplexity AI', ticker: 'PRPLX',   sector: 'AI Search',           color: '#20B2AA', currentValuationM: 9000,   lastRoundDate: '2025-01-01', stage: 'Series C',  description: 'AI-powered search engine.',              arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'perplexity.ai' },
  { id: 'mistral',    name: 'Mistral AI',    ticker: 'MSTRL',   sector: 'AI Foundation',       color: '#FF7D1A', currentValuationM: 6200,   lastRoundDate: '2024-06-11', stage: 'Series B',  description: 'Open-weight AI models.',                 arrM: null, forgePrice: null, hiivePrice: null, noticePrice: null, domain: 'mistral.ai' },
];

export const getCompany = (id: string): Company | undefined =>
  COMPANIES.find((c) => c.id === id);
