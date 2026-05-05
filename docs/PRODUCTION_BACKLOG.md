# PM Terminal — Production Backlog

This file turns the compact MVP brief into an execution backlog for the current
`Financial-tracker` codebase.

## Production Target

PM Terminal is a private-market portfolio tracker where users add positions in
admin-curated private companies and the app estimates current value using:

- last round valuation
- latest valuation signal
- indicative secondary price

Avoid in MVP:

- predictions
- IPO window estimates
- target price / fair value language
- buy/sell advice

Preferred product language:

- `Last round valuation`
- `Latest valuation signal`
- `Indicative secondary price`
- `Informational only`

## Current State Audit

### Already usable

- Public landing page and company universe
- Supabase auth
- Vercel production deployment
- Admin page for editing company metrics and secondary prices
- Portfolio shell with add/edit/remove position flow

### Prototype debt to remove

- Demo positions for first-time users
- localStorage-first portfolio behavior
- thin position schema that only supports share-count style entries
- wording that still assumes “current mark” instead of latest valuation signal
- company data split between hardcoded constants and Supabase

### Biggest gap against MVP

The position model is not rich enough yet for real usage. Users need to record
holding type, investment amount, fee drag, and vehicle metadata so portfolio
value and net multiple mean something.

## Execution Order

### Now

1. Make portfolio positions production-grade
2. Remove demo-mode onboarding from authenticated users
3. Formalize Supabase schema for positions and company metrics
4. Normalize copy around valuation signal / indicative secondary price
5. Make `main` the long-term production branch again after conflict cleanup

### Soon

1. Admin CRUD for companies and metrics
2. Public company detail page
3. Watchlist
4. Company requests
5. Audit logging

### Later

1. Google News ingestion
2. Metric extraction candidates + admin approval
3. Community aggregates with privacy thresholds
4. Stale data alerts

## First Implementation Slice

The first slice should optimize for one concrete outcome:

> A new user can sign in, add their own private stock/SPV/fund positions, and
> see fee-aware estimated value without fake demo data.

That slice includes:

- richer `positions` schema
- DB-backed positions with no demo fallback
- holding type, investment amount, vehicle, carry, and fee fields
- estimated value, net estimated value, gross multiple, and net multiple

