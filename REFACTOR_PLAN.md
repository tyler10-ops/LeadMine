# REFACTOR: Generalize to Lead Mine Multi-Industry

## What to do
Refactor this codebase from a real-estate-specific product to a general lead-mining SaaS. Target market: local service businesses (roofing, plumbing, HVAC, etc.)

## Renames (across ALL files — types, SQL, API routes, components, comments, strings)
- `realtors` table → `clients`
- `realtor_id` → `client_id` (everywhere — columns, variables, params, types)
- `Realtor` interface → `Client`
- `realtor` variable names → `client`
- `components/realtor/` dir → `components/client/`
- Real estate specific intent types: `buyer/seller/investor/unknown` → `hot/warm/cold/unknown`
- Update LeadQualification to be industry-agnostic (remove real-estate fields, make generic)

## New fields to ADD

### Client table/type:
- `industry TEXT` (e.g. 'roofing', 'plumbing', 'hvac', 'general_contractor')
- `icp_config JSONB DEFAULT '{}'` (Ideal Customer Profile: target_industries, target_locations, company_size_range, keywords, exclusions)

### Lead table/type:
- `gem_grade TEXT DEFAULT 'ungraded'` CHECK (gem_grade IN ('elite', 'refined', 'rock', 'ungraded'))
- `industry TEXT`
- `company_name TEXT`
- `job_title TEXT`
- `enrichment_data JSONB DEFAULT '{}'`
- `source_url TEXT`

## New migration
Create `supabase/migrations/005_generalize_to_lead_mine.sql` with all ALTER statements.

## Update CLAUDE.md
Change project description from real-estate to Lead Mine multi-industry SaaS.

## After all changes
1. Run `npx next build` and fix any type errors
2. Commit: `refactor: generalize data model from real-estate to lead-mine multi-industry`
