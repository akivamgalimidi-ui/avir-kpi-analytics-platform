# Avir KPI Analytics Platform 🚀

A production-grade, Power BI-style labor analytics platform for nursing home operations. Built with React, Vite, Tailwind CSS, and a Vercel-native FastAPI backend.

## 🏗 Architecture
- **Frontend**: React 18 + Vite (SPA)
- **Backend**: Python 3.9/FastAPI (Vercel Serverless Functions)
- **Styling**: Tailwind CSS
- **Database**: Supabase (Existing Backend)
- **Parsing**: `openpyxl` for Excel ingestion

## 📂 Project Structure
- `/api`: Vercel Serverless Functions (Python)
- `/src`: React Frontend code
  - `/pages`: The 15+ dashboard tabs
  - `/services`: API clients and Supabase logic
- `/server`: Core parsing and KPI engine logic
- `/supabase`: SQL migration scripts

## 🚀 Setup Instructions

### 1. New GitHub Repository
Create a new private repository on GitHub named `avir-kpi-analytics-platform`.

### 2. Deployment to Vercel
1. Create a **New Project** in Vercel.
2. Select the `avir-kpi-analytics-platform` repository.
3. Use the **Vite** Framework Preset.
4. **Environment Variables**: Add these in Settings > Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
   - `SUPABASE_URL`: Same as above
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Server-side only)

### 3. Supabase Migration
Run the script in `/supabase/migrations/001_safe_schema_setup.sql` in your Supabase SQL Editor. 
*Note: This script is non-destructive and will not drop existing tables or data.*

## 📈 Dashboard Tabs
1.  Executive Portfolio Dashboard
2.  KPI Dashboard by Period
3.  Portfolio Facility Trends
4.  Facility Drilldown
5.  Region Dashboard
6.  Acq Group Dashboard
7.  Pay Period Dashboard
8.  OT Analysis
9.  Bonus Analysis
10. HPPD / PPD Analysis
11. Labor Pressure Ranking
12. Employee Review
13. Pay Cycle Mapping
14. Data Quality Dashboard
15. QA / Reconciliation
16. Upload History
17. Export Center
18. System Status

## 🛠 Troubleshooting API Errors
This project uses a strict JSON policy. All `/api` routes return valid JSON. The frontend `fetchApi` utility in `src/services/api.ts` validates `Content-Type`. If you see an error, check the **System Status** tab for diagnostics.
