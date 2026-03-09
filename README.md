# ls_timeline

A statistical analysis web app for law school applicants that turns community-sourced application data into rigorous, interpretable insights.

## What it does

ls_timeline helps applicants understand not just what the data shows, but what it means for their specific situation. Enter your GPA and LSAT, add schools to your watchlist, and see where you stand in the decision timeline relative to historical cohort peers — applicants who applied the same month as you, not the general pool.

The core analysis is **decision timing**: Kaplan-Meier survival curves with cycle-week normalization, so you can honestly compare wait times across multiple admission cycles. A percentile progress bar and expected decision date label frame your wait relative to your cohort, answering "is my wait normal?" without implying the school is late or broke a promise.

Your profile and watchlist persist across sessions via localStorage.

## Planned features

**Phase 1 — MVP (Decision Timeline)** (Completed)
- User profile (GPA + LSAT), skippable for casual visitors
- Searchable school watchlist, persistent across sessions
- Per-school cohort histogram, percentile progress bar, expected decision date
- Dual Kaplan-Meier survival curves (last completed cycle + current cycle)
- Data freshness timestamp, responsive layout (mobile + desktop)
- Python pipeline producing static JSON from source data; GitHub Pages deployment

**Phase 2 — Predictive Models**
- KM confidence bands
- Per-school multinomial logistic regression (Accepted / Waitlisted / Rejected) with confidence intervals
- Scholarship prediction (GPA + LSAT + acceptance date) with explicit confounding caveats
- Multi-school overview with outcome tier clustering
- Data sparsity warnings and hidden diagnostics panel

**Phase 3 — Vision**
- Additional datasets
- Annotation layers for notable cycle events
- Shareable school-specific links

## Data

ls_timeline uses self-reported applicant data published by [LSD.law](https://lsd.law). All analysis is derived from this community-contributed dataset. Thank you to LSD.law for making this data publicly available — this project would not exist without it.

## Tech stack

Vite + React 19 + TypeScript · Tailwind CSS v4 · D3 v7 · Python 3.11+ pipeline · GitHub Pages
