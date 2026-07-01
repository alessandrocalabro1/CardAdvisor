# CardAdvisor (CardRadar) TCG Price Tracker

CardAdvisor is a production-quality decision-support, comparison, and portfolio tracking MVP for collectible trading cards (initially focused on the One Piece Card Game).

---

## Important Product Positioning

> [!WARNING]
> **Not Financial Advice**
> CardAdvisor does not provide financial advice and does not guarantee future profits. Collectible markets are highly volatile. Estimated fair ranges represent market signals based on available sources and are subject to change. Always verify card authenticity, condition, language, seller reliability, and marketplace rules before making purchases.

---

## Features

- **Watchlist & Search Catalog**: Create a customized watchlist, filter by status, rarity, game, or language, and sort by opportunity scores.
- **Fair Price Range Estimator**: Uses algorithm-based thresholds ($\pm8\%$ for high confidence, widening to $\pm15\%$ for low confidence) to define estimated fair bounds.
- **Opportunity Evaluator**: Analyzes seller offers and returns a score from 0-100 mapped to cautious labels like `watch` or `strong opportunity to verify`.
- **Suspicion Warning Engine**: Automatically flags keywords like `proxy`, `fake`, `replica`, `bundle`, or outlier low prices to prevent impulsive scams.
- **Portfolio P/L & ROI tracker**: Logs purchase entries, shipping costs, and aggregates net worth and percentage return on investment.
- **Price Target Alerts**: Set drop alerts to monitor when a card's reference valuation drops below your target.
- **Data Portability**: Stream full database backups in JSON format or download portfolio ledgers in CSV spreadsheets.

---

## Data Providers and Limitations

CardAdvisor uses a modular provider architecture located under `backend/src/providers/`.

1.  **OPTCG Provider**:
    *   *Purpose*: Resolves search queries, card names, set numbers, and image assets.
    *   *API*: Utilizes the environment base URL. If the URL is blank or queries fail, it automatically falls back to local high-fidelity mock structures.
2.  **Cardmarket Export Provider**:
    *   *Purpose*: Processes daily public pricing exports.
    *   *API*: Live Cardmarket API credentials are **not** required for this MVP. It processes public sheet formats. If the environment path is empty, it uses `/sample-data/cardmarket-prices-sample.csv`.
3.  **PriceCharting Provider**:
    *   *Purpose*: Fetches aggregated market price estimates.
    *   *API*: Requires `PRICECHARTING_API_TOKEN` inside `backend/.env`. If the token is missing, the status safely updates to `NOT_CONFIGURED`, and the app defaults to other active feeds.
    *   *Limitation*: The PriceCharting provider queries official PriceCharting API endpoints which return aggregated market pricing summaries (loose raw price references and graded PSA 10 value estimates). It does **not** fetch, parse, or download raw, itemized individual eBay transaction logs or historical eBay sold transaction records.
4.  **JustTCG Provider**:
    *   *Purpose*: Alternative fallback/cross-check pricing feed.
    *   *API*: Requires `JUSTTCG_API_KEY` inside `backend/.env`. If the token is missing, the status updates to `NOT_CONFIGURED`.
5.  **Manual Feed**:
    *   *Purpose*: Allows users to manually log price references or private sales.
    *   *API*: Always active. Vinted, Facebook Marketplace, and private deals are manual-only in this MVP.

---

## No Scraping Policy

CardAdvisor strictly adheres to web scraping policies:
- **No Scraping**: The code does **not** contain any browser-automation tools (like Puppeteer or Playwright), html parsers (like Cheerio), or header-mimicking scraper routines.
- **No Unofficial APIs**: It does **not** query unofficial mobile or hidden marketplace endpoints.
- **API First**: It relies entirely on official API tokens or explicit manual file uploads (CSV/JSON), protecting user IPs and account standings.

---

## Setup & Running Instructions

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+ recommended)

### 1. Installation
Install root, backend, and frontend packages simultaneously:
```bash
# From the workspace root
npm run install:all
```
Alternatively, install folders manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment variables
Create a `.env` file under the `/backend` folder:
```bash
cp backend/.env.example backend/.env
```
Inside `backend/.env`, configure your parameters:
```env
PRICECHARTING_API_TOKEN=your_token_here_if_available
JUSTTCG_API_KEY=your_key_here_if_available
OPTCG_API_BASE_URL=
CARDMARKET_EXPORT_PATH=
DATABASE_URL="file:./dev.db"
PORT=4000
ADMIN_API_TOKEN=your_admin_secret_token
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

> [!IMPORTANT]
> **Pre-Deployment Security Configuration**
> - **`ADMIN_API_TOKEN`**: A secure pre-shared secret required to protect database JSON import/export operations and third-party API test endpoints from public abuse. In production (`NODE_ENV=production`), this token is strictly required and must be supplied in request headers as `x-admin-token`.
> - **`CORS_ORIGIN`**: Restricts browser client requests to specific white-listed domains (supports comma-separated lists, e.g., `https://cardadvisor.app,https://www.cardadvisor.app`). In production, this cannot be a wildcard `*`.
> - **`NODE_ENV`**: Set to `production` when deploying to production hosts.

### 3. Database Setup (PostgreSQL Migration & Backup)

CardAdvisor is configured for **PostgreSQL** databases. Follow these instructions to perform database setup or migrate your existing local SQLite dataset safely:

#### A. Export Safety Backup (Local Data Migration)
If you have local SQLite catalog data that you wish to preserve, retrieve a JSON backup file **before** resetting migrations:
1. Ensure the local backend service is running.
2. Verify that `ADMIN_API_TOKEN` matches your backend `.env` configuration.
3. Run this PowerShell command to download the backup file (store it safely outside your project workspace):
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:4000/api/export/json" -Method Get -Headers @{"x-admin-token"="your_admin_secret_token"} -OutFile "backup-local.json"
   ```

#### B. Configure PostgreSQL Baseline
1. Set the database provider to `postgresql` in `schema.prisma`.
2. Configure your production connection string `DATABASE_URL` in your environment variables.
3. Run the migrations to deploy baseline SQL schemes onto your PostgreSQL instance:
   ```bash
   # Run baseline deploy on target production database
   npx prisma migrate deploy
   ```

#### C. Restore Safety Backup to Production Database
To restore your exported local SQLite watchlist, portfolio, and alerts dataset onto your live PostgreSQL environment, execute the import command:
1. Verify migrations have been successfully applied to the production database.
2. Run this restore command (Note: this overrides the target database catalog state; only run against a trusted deployment and keep your token secure):
   ```powershell
   Invoke-RestMethod -Uri "https://YOUR_BACKEND_DOMAIN/api/import/json" -Method Post -Headers @{"x-admin-token"="your_admin_secret_token"; "Content-Type"="application/json"} -InFile "backup-local.json"
   ```

#### D. Production Seed Policy
- **Production environments must start clean**: Do **not** run seed scripts automatically (`npm run prisma:seed`) in production. The seed configurations write sample mock data and template price records meant solely for development purposes.
- If seeded records are uploaded to staging or testing environments, they will be explicitly flagged as `SEED_SAMPLE`/`MOCK` by the data transparency layer.

### 4. Run Development Servers
Start both servers simultaneously using root npm orchestration commands from the workspace root:
```bash
# Starts backend server (Port 4000)
npm run dev:backend

# Starts frontend server (Vite - Port 5173)
npm run dev:frontend
```
Or run commands in respective directories:
*   Backend: `cd backend && npm run dev`
*   Frontend: `cd frontend && npm run dev`

### 5. Build Projects
Confirm builds are compile-clean:
```bash
# Build backend TypeScript
npm run build:backend

# Build frontend production bundle
npm run build:frontend
```

---

## Future Integrations

- **Official Vinted Integration**: Placeholder documentation structures are provided. Once Vinted exposes official TCG catalog hooks, direct integrations can replace manual listing inputs.
- **eBay Active & Sold Adapters**: Direct API client modules to query eBay's developer portal.
- **PostgreSQL Migration**: Completed. The Prisma schema is configured for PostgreSQL and contains the baseline migration schemas inside `/prisma/migrations/`.

---

## Deployment Guide (Render + Vercel + Neon)

Follow this guide to deploy CardAdvisor to cloud production servers.

### 1. Database Provisioning (Neon)
1. Sign up on [Neon.tech](https://neon.tech) and create a new PostgreSQL database project.
2. Retrieve your connection string (`DATABASE_URL`). It should resemble:
   `postgresql://neondb_owner:***@ep-***.aws.neon.tech/neondb?sslmode=require`

### 2. Backend API Deployment (Render)
1. Create a new **Web Service** on [Render.com](https://render.com) linked to your CardAdvisor repository.
2. In the Render environment configuration, define the following variables:
   - **`NODE_ENV`**: `production`
   - **`DATABASE_URL`**: Your Neon production database connection string.
   - **`ADMIN_API_TOKEN`**: A strong random secret key (used for database backup/restore).
   - **`CORS_ORIGIN`**: Your final Vercel frontend domain URL (e.g. `https://cardadvisor.vercel.app`).
   - (Optional) `PRICECHARTING_API_TOKEN`, `JUSTTCG_API_KEY`, etc.
3. Configure your build settings:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start`
4. Run migrations against your Neon database before start (Render does not have release phase hooks on standard free plans):
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### 3. Frontend Static Hosting Deployment (Vercel)
1. Create a new project on [Vercel.com](https://vercel.com) pointing to the `/frontend` subfolder of your repository.
2. In the Vercel project settings, add the environment variable:
   - **`VITE_API_BASE_URL`**: Your deployed Render backend service URL (e.g. `https://cardadvisor-backend.onrender.com`).
3. Configure build settings:
   - **Build Command**: `npm run build` (runs `tsc -b && vite build`)
   - **Output Directory**: `dist`
4. SPA Routing Rewrites: Vercel SPA routing redirects are preconfigured in [`vercel.json`](file:///c:/Users/mashfrog/Desktop/CardAdvisor/frontend/vercel.json) to handle browser refresh rewrites gracefully.

### 4. Post-Deployment Verification & Data Restore
- Verify the backend health endpoint by visiting `https://your-backend.onrender.com/api/health`. It should report:
  `{"status":"UP","database":"CONNECTED"}`
- Restore your local watchlist cards and portfolio items to production:
  > [!WARNING]
  > **Database Overwrites**
  > Importing a JSON backup overrides the target database. Run this restore command only against your initial empty production setup or trusted backups:
  ```powershell
  Invoke-RestMethod -Uri "https://your-backend.onrender.com/api/import/json" -Method Post -Headers @{"x-admin-token"="your_admin_secret_token"; "Content-Type"="application/json"} -InFile "backup-local.json"
  ```
