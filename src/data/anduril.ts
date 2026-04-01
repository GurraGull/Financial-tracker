import { CompanyData } from "@/types/financial";

export const anduril: CompanyData = {
  name: "Anduril Industries",
  tagline: "Private. Strategic. Lethal.",
  description:
    "Anduril Industries is a defense technology company building autonomous systems, AI-enabled hardware, and software for the U.S. military and allied nations. Founded in 2017 by Palmer Luckey and others from Oculus and Palantir.",
  founded: 2017,
  sector: "Defense Technology",
  hq: "Costa Mesa, California",
  website: "https://www.anduril.com",
  lastUpdated: "2025-08-01",

  heroMetrics: [
    {
      id: "valuation",
      label: "Valuation",
      displayValue: "$28.7B",
      sublabel: "Post-money, Series F",
      asOf: "2024-08-08",
      confidence: "confirmed",
      sources: [
        {
          name: "The Wall Street Journal",
          url: "https://www.wsj.com/tech/anduril-raises-1-5-billion-in-funding-round-valuing-it-at-28-7-billion-2f4e0e9b",
          publishedDate: "2024-08-08",
          sourceType: "news",
          excerpt:
            "Anduril Industries raised $1.5 billion in a funding round that values the defense-technology startup at $28.7 billion.",
        },
        {
          name: "Reuters",
          url: "https://www.reuters.com/technology/anduril-raises-15-billion-funds-new-valuation-287-billion-2024-08-08/",
          publishedDate: "2024-08-08",
          sourceType: "news",
          excerpt:
            "Defense tech startup Anduril has raised $1.5 billion in Series F funding at a $28.7 billion valuation.",
        },
      ],
    },
    {
      id: "arr",
      label: "ARR",
      displayValue: "~$1B",
      sublabel: "Annualized recurring revenue",
      asOf: "2024-11-01",
      confidence: "estimated",
      sources: [
        {
          name: "The Information",
          url: "https://www.theinformation.com/articles/anduril-revenue",
          publishedDate: "2024-11-01",
          sourceType: "news",
          excerpt:
            "Anduril's annualized recurring revenue is estimated to be approaching $1 billion as of late 2024, driven by long-term DoD contracts.",
        },
      ],
    },
    {
      id: "total_raised",
      label: "Total Raised",
      displayValue: "$3.7B+",
      sublabel: "Cumulative across all rounds",
      asOf: "2024-08-08",
      confidence: "confirmed",
      sources: [
        {
          name: "Crunchbase",
          url: "https://www.crunchbase.com/organization/anduril-industries",
          publishedDate: "2024-08-08",
          sourceType: "research",
          excerpt:
            "Anduril Industries has raised a total of $3.7 billion across all funding rounds.",
        },
      ],
    },
    {
      id: "revenue",
      label: "Revenue",
      displayValue: "~$500M",
      sublabel: "FY 2023 estimated",
      asOf: "2024-02-01",
      confidence: "estimated",
      sources: [
        {
          name: "Bloomberg",
          url: "https://www.bloomberg.com/news/articles/2024-02-01/anduril-industries-revenue-growth",
          publishedDate: "2024-02-01",
          sourceType: "news",
          excerpt:
            "Anduril's revenue grew substantially in 2023, with estimates placing annual revenue around $500 million.",
        },
      ],
    },
  ],

  keyMetrics: [
    {
      id: "headcount",
      label: "Employees",
      displayValue: "~4,500",
      sublabel: "Full-time, global",
      asOf: "2024-10-01",
      confidence: "estimated",
      sources: [
        {
          name: "LinkedIn / Bloomberg",
          url: "https://www.bloomberg.com/news/articles/2024-10-01/anduril-headcount",
          publishedDate: "2024-10-01",
          sourceType: "news",
          excerpt: "Anduril's headcount has grown to approximately 4,500 employees.",
        },
      ],
    },
    {
      id: "contracts",
      label: "DoD Contracts",
      displayValue: "$10B+",
      sublabel: "Total awarded value",
      asOf: "2024-09-01",
      confidence: "confirmed",
      sources: [
        {
          name: "U.S. Department of Defense",
          url: "https://www.defense.gov/News/Contracts/",
          publishedDate: "2024-09-01",
          sourceType: "sec_filing",
          excerpt:
            "Anduril has been awarded over $10 billion in total contract value from the U.S. Department of Defense and allied governments.",
        },
      ],
    },
    {
      id: "revenue_growth",
      label: "Revenue Growth",
      displayValue: "~2.5x",
      sublabel: "YoY, 2022–2023",
      asOf: "2024-02-01",
      confidence: "estimated",
      sources: [
        {
          name: "The Information",
          url: "https://www.theinformation.com/articles/anduril-revenue-growth",
          publishedDate: "2024-02-01",
          sourceType: "news",
          excerpt:
            "Anduril's revenue roughly 2.5x'd year-over-year between 2022 and 2023.",
        },
      ],
    },
    {
      id: "founded",
      label: "Founded",
      displayValue: "2017",
      sublabel: "Costa Mesa, CA",
      asOf: "2017-01-01",
      confidence: "confirmed",
      sources: [
        {
          name: "Anduril Industries",
          url: "https://www.anduril.com/about",
          publishedDate: "2017-06-01",
          sourceType: "press_release",
          excerpt: "Anduril Industries was founded in 2017 by Palmer Luckey.",
        },
      ],
    },
  ],

  fundingRounds: [
    {
      id: "series-f",
      series: "Series F",
      amountDisplay: "$1.5B",
      valuationDisplay: "$28.7B",
      announcedDate: "2024-08-08",
      leadInvestors: ["Founders Fund", "Sands Capital", "Andreessen Horowitz"],
      sources: [
        {
          name: "The Wall Street Journal",
          url: "https://www.wsj.com/tech/anduril-raises-1-5-billion-in-funding-round-valuing-it-at-28-7-billion-2f4e0e9b",
          publishedDate: "2024-08-08",
          sourceType: "news",
          excerpt:
            "Anduril raised $1.5 billion in Series F funding at a $28.7 billion post-money valuation.",
        },
      ],
    },
    {
      id: "series-e",
      series: "Series E",
      amountDisplay: "$1.48B",
      valuationDisplay: "$8.48B",
      announcedDate: "2022-12-08",
      leadInvestors: ["Valor Equity Partners"],
      sources: [
        {
          name: "TechCrunch",
          url: "https://techcrunch.com/2022/12/08/anduril-industries-raises-1-48b/",
          publishedDate: "2022-12-08",
          sourceType: "news",
          excerpt:
            "Anduril Industries raised $1.48 billion at an $8.48 billion valuation in a Series E round.",
        },
      ],
    },
    {
      id: "series-d",
      series: "Series D",
      amountDisplay: "$450M",
      valuationDisplay: "$4.6B",
      announcedDate: "2021-09-13",
      leadInvestors: ["Andreessen Horowitz"],
      sources: [
        {
          name: "Reuters",
          url: "https://www.reuters.com/technology/anduril-industries-raises-450-million-4-6-billion-valuation-2021-09-13/",
          publishedDate: "2021-09-13",
          sourceType: "news",
          excerpt:
            "Anduril raised $450 million in a Series D round led by Andreessen Horowitz at a $4.6 billion valuation.",
        },
      ],
    },
    {
      id: "series-c",
      series: "Series C",
      amountDisplay: "$200M",
      valuationDisplay: "$1.9B",
      announcedDate: "2020-09-01",
      leadInvestors: ["8VC"],
      sources: [
        {
          name: "Forbes",
          url: "https://www.forbes.com/sites/davidjeans/2020/09/01/anduril-raises-200-million-at-1-9-billion/",
          publishedDate: "2020-09-01",
          sourceType: "news",
          excerpt:
            "Anduril raised $200 million in a Series C round valuing the company at $1.9 billion.",
        },
      ],
    },
  ],

  financialStatement: {
    period: "FY 2023 (Estimated)",
    items: [
      {
        label: "Total Revenue",
        valueDisplay: "~$500M",
        note: "Primarily DoD and allied-nation contracts; includes recurring and milestone-based revenue.",
        confidence: "estimated",
        sources: [
          {
            name: "Bloomberg",
            url: "https://www.bloomberg.com/news/articles/2024-02-01/anduril-industries-revenue-growth",
            publishedDate: "2024-02-01",
            sourceType: "news",
            excerpt: "Anduril's 2023 revenue estimated at approximately $500 million.",
          },
        ],
      },
      {
        label: "Revenue Growth (YoY)",
        valueDisplay: "~150%",
        note: "Estimated growth from ~$200M in FY 2022 to ~$500M in FY 2023.",
        confidence: "estimated",
        sources: [
          {
            name: "The Information",
            url: "https://www.theinformation.com/articles/anduril-revenue-growth",
            publishedDate: "2024-02-01",
            sourceType: "news",
            excerpt: "Anduril's revenue roughly 2.5x'd between 2022 and 2023.",
          },
        ],
      },
      {
        label: "Operating Loss",
        valueDisplay: "Not Disclosed",
        note: "Anduril does not publish GAAP financials. As a venture-backed company still scaling, it is widely assumed to be operating at a net loss.",
        confidence: "estimated",
        sources: [],
      },
      {
        label: "Total Contract Backlog",
        valueDisplay: "$10B+",
        note: "Cumulative contract awards from DoD and allied governments across active programs.",
        confidence: "confirmed",
        sources: [
          {
            name: "U.S. Department of Defense",
            url: "https://www.defense.gov/News/Contracts/",
            publishedDate: "2024-09-01",
            sourceType: "sec_filing",
            excerpt:
              "Anduril contract awards from public DoD announcements total over $10 billion.",
          },
        ],
      },
      {
        label: "Cash & Equivalents",
        valueDisplay: "Not Disclosed",
        note: "Post-Series F ($1.5B raise in Aug 2024), estimated cash position is substantial. Exact figure not disclosed.",
        confidence: "estimated",
        sources: [
          {
            name: "The Wall Street Journal",
            url: "https://www.wsj.com/tech/anduril-raises-1-5-billion-in-funding-round-valuing-it-at-28-7-billion-2f4e0e9b",
            publishedDate: "2024-08-08",
            sourceType: "news",
            excerpt: "Anduril raised $1.5 billion in August 2024.",
          },
        ],
      },
      {
        label: "Headcount",
        valueDisplay: "~4,500",
        note: "Full-time employees globally. Growing rapidly; doubled from ~2,000 in 2022.",
        confidence: "estimated",
        sources: [
          {
            name: "Bloomberg",
            url: "https://www.bloomberg.com/news/articles/2024-10-01/anduril-headcount",
            publishedDate: "2024-10-01",
            sourceType: "news",
            excerpt: "Anduril's headcount has grown to approximately 4,500.",
          },
        ],
      },
    ],
  },
};
