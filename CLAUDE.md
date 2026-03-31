# CLAUDE.md — Financial Tracker

This file provides guidance for AI assistants (Claude Code and others) working on this repository.

## Project Overview

**Financial Tracker** is a web application for private companies to track their finances. The project is in its initial scaffolding phase — no source code exists yet beyond this documentation.

**Purpose**: Internal financial management for private companies, likely covering income/expense tracking, budgeting, reporting, and company-level financial dashboards.

## Repository State

As of 2026-03-31, this repository contains only:
- `README.md` — minimal project description
- `CLAUDE.md` — this file

All architecture decisions, tech stack choices, and initial scaffolding are yet to be made. When the project is bootstrapped, update this file to reflect actual choices.

## Development Branch

Active development happens on feature branches. The current working branch is `claude/add-claude-documentation-DUZw2`. Always develop on the designated branch and push with:

```bash
git push -u origin <branch-name>
```

Never push directly to `main` without explicit permission.

## Expected Architecture (To Be Confirmed)

Given the project description ("financial tracker for private companies"), the likely architecture will include:

- **Frontend**: React or Next.js with TypeScript
- **Backend**: Node.js API (REST or tRPC) or Next.js API routes
- **Database**: PostgreSQL (via Prisma ORM) for financial data integrity
- **Auth**: NextAuth.js or similar for company-scoped access control
- **Styling**: Tailwind CSS

> Update this section once `package.json` and the tech stack are established.

## Conventions (Establish These Early)

### File Structure (Proposed)
```
/
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utility functions, DB client, helpers
│   ├── server/            # Server-side logic, API handlers
│   └── types/             # Shared TypeScript types
├── prisma/                # Schema and migrations (if using Prisma)
├── public/                # Static assets
├── tests/                 # Test files
├── .env.example           # Environment variable template (never commit .env)
└── package.json
```

### Code Style
- Use TypeScript throughout — no plain `.js` files in `src/`
- Prefer named exports over default exports for components and utilities
- Keep components small and focused; extract logic into custom hooks or lib functions
- Co-locate tests with source files or place in `tests/` mirroring `src/`

### Financial Data Handling
- Always store monetary values as integers (cents/minor currency units) — never floats
- Label all currency fields clearly (e.g., `amountCents`, `balanceCents`)
- Include currency code alongside amounts when multi-currency support is needed
- Validate and sanitize all financial inputs at the API boundary

### Security
- Never log sensitive financial data
- Scope all queries to the authenticated company — never allow cross-company data access
- Use parameterized queries; never interpolate user input into SQL
- Store secrets in environment variables only; never hardcode credentials

### Database
- Use migrations (not `push`) for all schema changes in production
- Never delete columns or tables directly — use soft deletes or deprecation patterns
- Add indexes on frequently queried fields (company ID, date ranges, transaction IDs)

### Git Workflow
- Commit messages should be concise and imperative (e.g., `Add expense category model`)
- One logical change per commit — avoid mixing refactors with feature work
- Always run tests before pushing

## Environment Variables

When `.env.example` is created, document all required variables here. Expected variables will include:

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

## Commands (Update Once Package.json Exists)

Once the project is bootstrapped, document the standard commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Database migrations
npx prisma migrate dev
```

## Key Domain Concepts

When implementing financial tracking features, maintain consistent terminology:

| Term | Definition |
|---|---|
| **Transaction** | A single financial event (income or expense) |
| **Category** | Classification for transactions (e.g., Payroll, Rent, Revenue) |
| **Account** | A financial account (bank account, credit line) belonging to a company |
| **Company** | The top-level tenant — all data is scoped to a company |
| **Period** | A reporting timeframe (month, quarter, fiscal year) |
| **Budget** | A planned spend/income target for a category in a period |

## Testing

- Write tests for all financial calculation logic — this is critical correctness territory
- Test API endpoints for authorization (ensure company scoping is enforced)
- Use integration tests for database interactions involving financial data

## What NOT to Do

- Do not use floating-point arithmetic for currency calculations
- Do not expose one company's data to another company's session
- Do not add speculative features — build only what is scoped in the current task
- Do not skip database migrations in favor of schema pushes in production
- Do not commit `.env`, secrets, or credentials
