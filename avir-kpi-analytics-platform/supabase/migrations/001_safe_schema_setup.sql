-- Avir KPI Analytics Platform - Safe Schema Setup
-- Ensures all required tables exist without dropping data.

-- 1. Core Entities
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acquisition_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acquisition_group_id UUID REFERENCES acquisition_groups(id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(acquisition_group_id, name)
);

CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES regions(id),
    name TEXT NOT NULL,
    normalized_name TEXT UNIQUE NOT NULL,
    payroll_schedule_group TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Payroll Metadata
CREATE TABLE IF NOT EXISTS pay_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_date DATE NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upload_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing', -- processing, active, error
    rows_parsed INTEGER DEFAULT 0,
    detected_pay_periods INTEGER DEFAULT 0,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Detail Lines (Bulk Data)
CREATE TABLE IF NOT EXISTS ot_detail_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES upload_batches(id),
    facility_id UUID REFERENCES facilities(id),
    pay_period_id UUID REFERENCES pay_periods(id),
    employee_name TEXT,
    department TEXT,
    position TEXT,
    metric_group TEXT, -- OT Dollars ($), OT Hours, etc.
    value NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bonus_detail_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES upload_batches(id),
    facility_id UUID REFERENCES facilities(id),
    pay_period_id UUID REFERENCES pay_periods(id),
    employee_name TEXT,
    bonus_type TEXT,
    department TEXT,
    position TEXT,
    bonus_dollars NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Rollup Metrics
CREATE TABLE IF NOT EXISTS facility_period_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES upload_batches(id),
    facility_id UUID REFERENCES facilities(id),
    pay_period_id UUID REFERENCES pay_periods(id),
    ot_dollars NUMERIC,
    ot_hours NUMERIC,
    bonus_dollars NUMERIC,
    direct_care_hppd NUMERIC,
    direct_care_ppd NUMERIC,
    overall_labor_ppd NUMERIC,
    is_total_row BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Logic & QA Results
CREATE TABLE IF NOT EXISTS labor_pressure_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES upload_batches(id),
    facility_id UUID REFERENCES facilities(id),
    score INTEGER,
    risk_category TEXT,
    main_driver TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconciliation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES upload_batches(id),
    check_name TEXT,
    status TEXT,
    detail_total NUMERIC,
    rollup_total NUMERIC,
    variance NUMERIC,
    notes TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for Performance
CREATE INDEX IF NOT EXISTS idx_ot_batch ON ot_detail_lines(batch_id);
CREATE INDEX IF NOT EXISTS idx_ot_facility ON ot_detail_lines(facility_id);
CREATE INDEX IF NOT EXISTS idx_bonus_batch ON bonus_detail_lines(batch_id);
CREATE INDEX IF NOT EXISTS idx_fpm_facility ON facility_period_metrics(facility_id);
CREATE INDEX IF NOT EXISTS idx_fpm_period ON facility_period_metrics(pay_period_id);
