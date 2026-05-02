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
  arrM: number;
  forgePrice: number;
  hiivePrice: number;
  noticePrice: number;
}

export const COMPANIES: Company[] = [
  { id: 'anthropic', name: 'Anthropic', ticker: 'ANTH', sector: 'AI Safety', color: '#FF6B35', currentValuationM: 900000, lastRoundDate: '2026-04-29', stage: 'Pre-IPO', description: 'AI safety company behind Claude.', arrM: 4200, forgePrice: 108, hiivePrice: 112, noticePrice: 115 },
  { id: 'spacex', name: 'SpaceX', ticker: 'SPACEX', sector: 'Aerospace', color: '#3B82F6', currentValuationM: 350000, lastRoundDate: '2024-12-01', stage: 'Pre-IPO', description: 'Reusable rockets, Starlink, Mars.', arrM: 10200, forgePrice: 185, hiivePrice: 192, noticePrice: 197 },
  { id: 'openai', name: 'OpenAI', ticker: 'OPENAI', sector: 'AI Foundation', color: '#10B981', currentValuationM: 300000, lastRoundDate: '2025-10-01', stage: 'Pre-IPO', description: 'GPT, DALL-E, Sora creator.', arrM: 11500, forgePrice: 52, hiivePrice: 55, noticePrice: 57 },
  { id: 'anduril', name: 'Anduril', ticker: 'ANDRL', sector: 'Defense Tech', color: '#EF4444', currentValuationM: 28000, lastRoundDate: '2024-08-01', stage: 'Series F', description: 'AI-powered defense systems.', arrM: 1050, forgePrice: 38, hiivePrice: 41, noticePrice: 43 },
  { id: 'databricks', name: 'Databricks', ticker: 'DBX', sector: 'Data & AI', color: '#8B5CF6', currentValuationM: 62000, lastRoundDate: '2024-12-17', stage: 'Series J', description: 'Unified data analytics platform.', arrM: 3200, forgePrice: 72, hiivePrice: 76, noticePrice: 79 },
  { id: 'stripe', name: 'Stripe', ticker: 'STRIPE', sector: 'Fintech', color: '#635BFF', currentValuationM: 70000, lastRoundDate: '2023-03-15', stage: 'Pre-IPO', description: 'Global payments infrastructure.', arrM: 4800, forgePrice: 24, hiivePrice: 26, noticePrice: 27 },
  { id: 'figma', name: 'Figma', ticker: 'FIGMA', sector: 'Design Tools', color: '#F24E1E', currentValuationM: 12500, lastRoundDate: '2021-06-01', stage: 'Pre-IPO', description: 'Collaborative design platform.', arrM: 780, forgePrice: 18, hiivePrice: 20, noticePrice: 21 },
  { id: 'discord', name: 'Discord', ticker: 'DISCORD', sector: 'Social / Gaming', color: '#5865F2', currentValuationM: 15000, lastRoundDate: '2021-09-01', stage: 'Pre-IPO', description: 'Community and voice platform.', arrM: 620, forgePrice: 22, hiivePrice: 24, noticePrice: 25 },
  { id: 'canva', name: 'Canva', ticker: 'CANVA', sector: 'Design Tools', color: '#00C4CC', currentValuationM: 26000, lastRoundDate: '2021-09-01', stage: 'Pre-IPO', description: 'Visual content creation platform.', arrM: 2400, forgePrice: 42, hiivePrice: 44, noticePrice: 46 },
  { id: 'bytedance', name: 'ByteDance', ticker: 'BDNCE', sector: 'Social / AI', color: '#FF0050', currentValuationM: 225000, lastRoundDate: '2023-12-01', stage: 'Pre-IPO', description: 'TikTok and AI product suite.', arrM: 85000, forgePrice: 165, hiivePrice: 170, noticePrice: 178 },
  { id: 'revolut', name: 'Revolut', ticker: 'RVLT', sector: 'Fintech', color: '#0075EB', currentValuationM: 45000, lastRoundDate: '2024-08-16', stage: 'Series E+', description: 'Global neobank and super-app.', arrM: 3200, forgePrice: 58, hiivePrice: 61, noticePrice: 63 },
  { id: 'klarna', name: 'Klarna', ticker: 'KLAR', sector: 'Fintech', color: '#FFB3C7', currentValuationM: 14600, lastRoundDate: '2024-07-01', stage: 'Pre-IPO', description: 'Buy now pay later pioneer.', arrM: 2400, forgePrice: 72, hiivePrice: 75, noticePrice: 77 },
  { id: 'plaid', name: 'Plaid', ticker: 'PLAID', sector: 'Fintech', color: '#00B274', currentValuationM: 13400, lastRoundDate: '2021-04-01', stage: 'Series D', description: 'Financial data connectivity.', arrM: 310, forgePrice: 12, hiivePrice: 13, noticePrice: 14 },
  { id: 'xai', name: 'xAI', ticker: 'XAI', sector: 'AI Foundation', color: '#1DA1F2', currentValuationM: 50000, lastRoundDate: '2024-11-01', stage: 'Series B', description: 'Grok AI and X platform AI.', arrM: 1600, forgePrice: 40, hiivePrice: 43, noticePrice: 45 },
  { id: 'perplexity', name: 'Perplexity AI', ticker: 'PRPLX', sector: 'AI Search', color: '#20B2AA', currentValuationM: 9000, lastRoundDate: '2025-01-01', stage: 'Series C', description: 'AI-powered search engine.', arrM: 110, forgePrice: 32, hiivePrice: 35, noticePrice: 37 },
  { id: 'waymo', name: 'Waymo', ticker: 'WAYMO', sector: 'Autonomous Vehicles', color: '#4285F4', currentValuationM: 45000, lastRoundDate: '2024-10-25', stage: 'Pre-IPO', description: 'Autonomous ride-hailing.', arrM: 520, forgePrice: 22, hiivePrice: 24, noticePrice: 26 },
  { id: 'ramp', name: 'Ramp', ticker: 'RAMP', sector: 'Fintech', color: '#F26419', currentValuationM: 16000, lastRoundDate: '2024-08-01', stage: 'Series D', description: 'Corporate spend management.', arrM: 520, forgePrice: 26, hiivePrice: 28, noticePrice: 29 },
  { id: 'rippling', name: 'Rippling', ticker: 'RPPLG', sector: 'HR & Payroll', color: '#FF5E00', currentValuationM: 13500, lastRoundDate: '2024-04-22', stage: 'Series F', description: 'HR, IT, and finance platform.', arrM: 370, forgePrice: 20, hiivePrice: 22, noticePrice: 23 },
  { id: 'scale-ai', name: 'Scale AI', ticker: 'SCALE', sector: 'AI Infrastructure', color: '#FF6B6B', currentValuationM: 14000, lastRoundDate: '2024-05-01', stage: 'Series F', description: 'AI data labeling and infrastructure.', arrM: 780, forgePrice: 18, hiivePrice: 20, noticePrice: 22 },
  { id: 'cohere', name: 'Cohere', ticker: 'COHR', sector: 'AI Foundation', color: '#39E09B', currentValuationM: 5500, lastRoundDate: '2024-07-22', stage: 'Series D', description: 'Enterprise language AI platform.', arrM: 105, forgePrice: 18, hiivePrice: 20, noticePrice: 21 },
  { id: 'mistral', name: 'Mistral AI', ticker: 'MSTRL', sector: 'AI Foundation', color: '#FF7D1A', currentValuationM: 6200, lastRoundDate: '2024-06-11', stage: 'Series B', description: 'Open-weight AI models.', arrM: 90, forgePrice: 22, hiivePrice: 24, noticePrice: 26 },
  { id: 'brex', name: 'Brex', ticker: 'BREX', sector: 'Fintech', color: '#FF6240', currentValuationM: 12300, lastRoundDate: '2022-01-11', stage: 'Series D', description: 'Corporate cards and finance.', arrM: 310, forgePrice: 14, hiivePrice: 15, noticePrice: 17 },
  { id: 'airtable', name: 'Airtable', ticker: 'AIRT', sector: 'Productivity', color: '#FCB400', currentValuationM: 11000, lastRoundDate: '2021-12-10', stage: 'Series F', description: 'Low-code app-building platform.', arrM: 325, forgePrice: 12, hiivePrice: 13, noticePrice: 15 },
  { id: 'faire', name: 'Faire', ticker: 'FAIRE', sector: 'B2B Commerce', color: '#4CAF50', currentValuationM: 12000, lastRoundDate: '2022-01-11', stage: 'Series G', description: 'Wholesale marketplace for retailers.', arrM: 720, forgePrice: 15, hiivePrice: 17, noticePrice: 18 },
  { id: 'chime', name: 'Chime', ticker: 'CHIME', sector: 'Fintech', color: '#00D3B8', currentValuationM: 25000, lastRoundDate: '2021-08-13', stage: 'Series G', description: 'Mobile banking for everyone.', arrM: 2100, forgePrice: 30, hiivePrice: 32, noticePrice: 34 },
  { id: 'epic-games', name: 'Epic Games', ticker: 'EPIC', sector: 'Gaming', color: '#0078F2', currentValuationM: 31500, lastRoundDate: '2022-04-11', stage: 'Pre-IPO', description: 'Fortnite and Unreal Engine.', arrM: 6200, forgePrice: 52, hiivePrice: 55, noticePrice: 57 },
  { id: 'shein', name: 'Shein', ticker: 'SHEIN', sector: 'E-Commerce', color: '#FF2E63', currentValuationM: 66000, lastRoundDate: '2023-05-01', stage: 'Pre-IPO', description: 'Fast fashion e-commerce giant.', arrM: 32000, forgePrice: 38, hiivePrice: 41, noticePrice: 43 },
];

export const getCompany = (id: string): Company | undefined =>
  COMPANIES.find((c) => c.id === id);
