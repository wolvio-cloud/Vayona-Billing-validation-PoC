-- Demo contract seed (placeholder — PDF upload populates real data)
-- Run AFTER 0001_init.sql

INSERT INTO contracts (contract_id, display_name, extraction_status)
VALUES ('C001', 'Wind Farm Alpha LTSA', 'pending')
ON CONFLICT (contract_id) DO NOTHING;
