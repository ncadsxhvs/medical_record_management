# RVU Tracker

A full-stack application for tracking medical procedure RVUs (Relative Value Units) with Google OAuth authentication, analytics dashboard, and mobile API support.

**Production:** https://trackmyrvu.com

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Auth.js (Google & Apple OAuth)
- Neon Postgres
- Jest + React Testing Library

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3001
npm test             # Run all tests
```

## API Docs

Interactive Swagger UI available at `/api-docs` ([production](https://trackmyrvu.com/api-docs) | [local](http://localhost:3001/api-docs)).

See `docs/README.md` for details.

## Features

- Multi-procedure visit tracking with HCPCS code search (16,852+ codes)
- No-show encounter tracking
- Drag-and-drop favorites management
- Analytics dashboard (daily/weekly/monthly/yearly)
- Mobile JWT authentication (Google & Apple Sign-In)
- Account deletion (GDPR)
