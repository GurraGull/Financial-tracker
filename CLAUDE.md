# CLAUDE.md — Anduril Financials

This file provides guidance for AI assistants (Claude Code and others) working on this repository.

## Project Overview

**Anduril Financials** is a public-facing website that tracks and displays financial metrics for Anduril Industries — a private defense technology company. The site is styled after Anduril's own aesthetic: dark, stark, minimal, high-contrast.

**Purpose**: Public discourse and transparency around Anduril's financial health, sourced entirely from credible public records (news, research, funding announcements).

## Repository State

The project is scaffolded with:
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript throughout (`src/` directory)
- **Entry point**: `src/app/page.tsx`

## Development Branch

Active development happens on feature branches. The current working branch is `claude/add-claude-documentation-DUZw2`. Always develop on the designated branch and push with:

```bash
git push -u origin <branch-name>
```

Never push directly to `main` without explicit permission.

## Design System (Anduril Aesthetic)

The site mirrors Anduril Industries' visual identity:

| Token | Value | Usage |
|---|---|---|
| Background | `#0a0a0a` | Page background |
| Surface | `#111111` | Cards, sections |
| Border | `#1f1f1f` | Dividers, card borders |
| Text primary | `#ffffff` | Headlines, big numbers |
| Text secondary | `#737373` | Labels, metadata |
| Text muted | `#404040` | Footnotes, timestamps |
| Accent | `#ffffff` | No color accents — numbers speak |
| Font | Geist Sans | Clean, modern sans-serif |

Key patterns:
- Large numbers as the primary visual anchor (hero metrics)
- Minimal navigation — no clutter
- Generous whitespace between dense data sections
- Subtle `#1f1f1f` borders for structure
- All-caps small labels above metrics
- Source citations inline with data

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (dark bg, Geist font)
│   ├── page.tsx            # Homepage (hero metrics + financial statement)
│   └── globals.css         # Tailwind base + CSS variables
├── components/
│   ├── MetricCard.tsx      # Big number display with label + source
│   ├── SourceBadge.tsx     # Inline source citation chip
│   ├── FinancialStatement.tsx  # Curated financial statement section
│   └── Nav.tsx             # Minimal top navigation
├── data/
│   └── anduril.ts          # All financial data + source citations
└── types/
    └── financial.ts        # Shared TypeScript types
```

## Data Conventions

All financial data lives in `src/data/anduril.ts`. Every data point **must** carry:

```typescript
interface MetricSource {
  name: string;         // e.g. "Bloomberg"
  url: string;          // Direct link to article
  publishedDate: string; // ISO date: "2024-11-15"
  excerpt?: string;     // Relevant quote from source
}

interface Metric {
  label: string;
  value: number;          // Always integers (cents for money, or raw units)
  displayValue: string;   // Formatted: "$28.7B", "~$650M"
  unit: string;
  asOf: string;           // ISO date this figure was reported
  confidence: "confirmed" | "estimated" | "rumored";
  sources: MetricSource[];
}
```

**Never use floats for monetary values.** Store as integer cents or millions-of-cents and format for display.

## Key Domain Concepts

| Term | Definition |
|---|---|
| **Valuation** | Post-money valuation from most recent funding round |
| **ARR** | Annual Recurring Revenue — recurring contract value per year |
| **Revenue** | Total revenue including one-time contracts |
| **Total Raised** | Cumulative capital raised across all rounds |
| **Burn Rate** | Monthly cash outflow (estimated) |

## Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

## What NOT to Do

- Do not fabricate financial figures — every number needs a source
- Do not use color accents that deviate from the Anduril monochrome palette
- Do not add features beyond what is scoped (this is a single-company metrics site)
- Do not commit `.env`, secrets, or credentials
- Do not use floating-point arithmetic for currency values
