-- Wolvio Billing Validation PoC — initial schema
-- Run in Supabase SQL editor (or via supabase db push)

CREATE TABLE IF NOT EXISTS contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         TEXT UNIQUE NOT NULL,
  display_name        TEXT,
  pdf_storage_path    TEXT,
  raw_text            TEXT,
  page_count          INT,
  parameters          JSONB,
  extraction_status   TEXT DEFAULT 'pending',
  extraction_error    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    TEXT UNIQUE NOT NULL,
  contract_id   UUID REFERENCES contracts(id),
  invoice_date  DATE NOT NULL,
  period_start  DATE,
  period_end    DATE,
  line_items    JSONB,
  subtotal      NUMERIC,
  gst_rate      NUMERIC DEFAULT 18,
  gst_amount    NUMERIC,
  total         NUMERIC,
  status        TEXT DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS generation_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID REFERENCES contracts(id),
  period_start    DATE,
  period_end      DATE,
  total_kwh       NUMERIC,
  availability_pct NUMERIC
);

CREATE TABLE IF NOT EXISTS validation_runs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id              UUID REFERENCES contracts(id),
  invoice_id               UUID REFERENCES invoices(id),
  run_at                   TIMESTAMPTZ DEFAULT NOW(),
  checks                   JSONB,
  total_gap_amount         NUMERIC,
  total_opportunity_amount NUMERIC,
  verdict                  TEXT
);

-- Storage bucket for contract PDFs (create via Supabase dashboard or:)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contract-pdfs', 'contract-pdfs', false)
-- ON CONFLICT DO NOTHING;
