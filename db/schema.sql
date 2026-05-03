-- Wolvio Contract Execution Intelligence
-- Production Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONTRACTS TABLE: Master records for agreements
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'C001'
    display_name VARCHAR(255) NOT NULL,
    counterparty VARCHAR(255),
    pdf_storage_path TEXT,
    
    -- Processing status
    extraction_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    extraction_error TEXT,
    
    -- Metadata
    page_count INTEGER,
    raw_text TEXT,
    
    -- Extracted Parameters (Stored as JSONB for flexibility, but indexed)
    -- This follows the ContractParametersSchema
    parameters JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. INVOICES TABLE: Billing documents received
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id VARCHAR(100) UNIQUE NOT NULL,
    contract_id VARCHAR(50) REFERENCES contracts(contract_id),
    
    period_start DATE,
    period_end DATE,
    total_amount NUMERIC(15, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    
    pdf_storage_path TEXT,
    extraction_status VARCHAR(20) DEFAULT 'pending',
    
    -- Extracted line items and technical data
    invoice_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. VALIDATION_RUNS: History of reconciliation audits
CREATE TABLE IF NOT EXISTS validation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id VARCHAR(100) REFERENCES invoices(invoice_id),
    contract_id VARCHAR(50) REFERENCES contracts(contract_id),
    
    run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verdict VARCHAR(50), -- CLEAN, GAPS_FOUND, REVIEW_REQUIRED
    
    total_gap_amount NUMERIC(15, 2) DEFAULT 0,
    total_opportunity_amount NUMERIC(15, 2) DEFAULT 0,
    
    -- Full report data
    report_data JSONB NOT NULL,
    
    -- Offline report link
    report_html_path TEXT
);

-- 4. CLAUSE_LIBRARY: Individual extracted clauses with OCR coordinates
-- This enables surgical highlighting in the PDF viewer
CREATE TABLE IF NOT EXISTS contract_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id VARCHAR(50) REFERENCES contracts(contract_id),
    clause_reference VARCHAR(50) NOT NULL, -- e.g., '8.1'
    clause_title TEXT,
    clause_text TEXT NOT NULL,
    page_number INTEGER,
    bbox JSONB, -- [x1, y1, x2, y2] coordinates for highlighting
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_contracts_cid ON contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cid ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_validation_invoice ON validation_runs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_params_jsonb ON contracts USING GIN (parameters);
