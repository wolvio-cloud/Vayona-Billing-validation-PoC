-- Demo contract seed
-- Run AFTER 0001_init.sql

-- 1. Insert Contract
INSERT INTO contracts (id, contract_id, display_name, pdf_storage_path, extraction_status, parameters)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'C001', 
  'Wind Farm Alpha LTSA', 
  'demo_data/contracts/C001_LTSA_WindFarmAlpha.pdf',
  'completed',
  '{"contract_id":"C001","contract_type":"LTSA","base_annual_fee":{"value":144000000,"source_clause":"₹14,40,00,000 per annum payable monthly at ₹1,20,00,000 per month on or before the 5th of each month.","clause_reference":"Clause 4.1","page_number":8,"confidence":"high"},"base_monthly_fee":{"value":12000000,"source_clause":"₹14,40,00,000 per annum payable monthly at ₹1,20,00,000 per month on or before the 5th of each month.","clause_reference":"Clause 4.1","page_number":8,"confidence":"high"},"escalation":{"value":{"type":"WPI","index_base_month":"January","effective_date":"April 1","cap_pct":8,"floor_pct":0},"source_clause":"The Base Annual Fee shall be escalated on April 1 each year by the Wholesale Price Index (WPI) for January published by the Office of the Economic Adviser, GoI — capped at 8% p.a.","clause_reference":"Clause 5.2","page_number":14,"confidence":"high"},"variable_component":{"value":{"rate_per_kwh":0.04,"billing_frequency":"Quarterly"},"source_clause":"₹0.04 per kWh of net energy generated, billed quarterly within 30 days of quarter end.","clause_reference":"Clause 6.3","page_number":18,"confidence":"high"},"availability_guarantee_pct":{"value":96,"source_clause":"Contractor guarantees 96.0% turbine availability annually. Calculated as: (Available Hours / Total Hours) × 100.","clause_reference":"Clause 7.1","page_number":22,"confidence":"high"},"ld_rate_per_pp":{"value":0.5,"source_clause":"0.5% of Annual Fee per percentage point shortfall below 96%. Maximum LD: 15% of Annual Fee per annum.","clause_reference":"Clause 8.2","page_number":27,"confidence":"high"},"ld_cap_pct":{"value":15,"source_clause":"0.5% of Annual Fee per percentage point shortfall below 96%. Maximum LD: 15% of Annual Fee per annum.","clause_reference":"Clause 8.2","page_number":27,"confidence":"high"},"bonus_threshold_pct":{"value":98,"source_clause":"1% of Annual Fee per percentage point above 98% availability. Maximum bonus: 5% of Annual Fee per annum.","clause_reference":"Clause 9.1","page_number":31,"confidence":"high"},"bonus_rate_per_pp":{"value":1,"source_clause":"1% of Annual Fee per percentage point above 98% availability. Maximum bonus: 5% of Annual Fee per annum.","clause_reference":"Clause 9.1","page_number":31,"confidence":"high"},"payment_terms_days":{"value":45,"source_clause":"Net 45 days from invoice date.","clause_reference":"Clause 10.1","page_number":35,"confidence":"high"},"late_payment_interest":{"value":"SBI base rate + 2%","source_clause":"SBI base rate + 2% per annum on overdue amounts.","clause_reference":"Clause 11.3","page_number":38,"confidence":"high"},"renewal_notice_months":{"value":12,"source_clause":"12 months written notice required to terminate or renegotiate.","clause_reference":"Clause 17.2","page_number":45,"confidence":"high"}}'
) ON CONFLICT (contract_id) DO UPDATE SET parameters = EXCLUDED.parameters, extraction_status = 'completed';

-- 2. Insert Invoices

INSERT INTO invoices (id, invoice_id, contract_id, invoice_date, period_start, period_end, line_items, subtotal, gst_rate, gst_amount, total, status)
VALUES (
  '22222222-2222-2222-2222-222222222221',
  'INV-001',
  '11111111-1111-1111-1111-111111111111',
  '2025-01-05',
  '2025-01-01',
  '2025-01-31',
  '[{"item_id":"LI-001","description":"Monthly O&M Service Fee — January 2025","category":"BaseFee","quantity":1,"unit":"month","unit_rate":12000000,"amount":12000000}]',
  12000000,
  18,
  2160000,
  14160000,
  'Paid'
) ON CONFLICT (invoice_id) DO NOTHING;

INSERT INTO invoices (id, invoice_id, contract_id, invoice_date, period_start, period_end, line_items, subtotal, gst_rate, gst_amount, total, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'INV-002',
  '11111111-1111-1111-1111-111111111111',
  '2025-04-05',
  '2025-04-01',
  '2025-04-30',
  '[{"item_id":"LI-001","description":"Monthly O&M Service Fee — April 2025","category":"BaseFee","quantity":1,"unit":"month","unit_rate":12000000,"amount":12000000}]',
  12000000,
  18,
  2160000,
  14160000,
  'Paid'
) ON CONFLICT (invoice_id) DO NOTHING;

INSERT INTO invoices (id, invoice_id, contract_id, invoice_date, period_start, period_end, line_items, subtotal, gst_rate, gst_amount, total, status)
VALUES (
  '22222222-2222-2222-2222-222222222223',
  'INV-003',
  '11111111-1111-1111-1111-111111111111',
  '2025-07-05',
  '2025-04-01',
  '2025-06-30',
  '[{"item_id":"LI-001","description":"Quarterly O&M Service Fee — Q1 2025","category":"BaseFee","quantity":3,"unit":"month","unit_rate":12000000,"amount":36000000}]',
  36000000,
  18,
  6480000,
  42480000,
  'Pending'
) ON CONFLICT (invoice_id) DO NOTHING;

INSERT INTO invoices (id, invoice_id, contract_id, invoice_date, period_start, period_end, line_items, subtotal, gst_rate, gst_amount, total, status)
VALUES (
  '22222222-2222-2222-2222-222222222224',
  'INV-004',
  '11111111-1111-1111-1111-111111111111',
  '2025-06-05',
  '2025-05-01',
  '2025-05-31',
  '[{"item_id":"LI-001","description":"Monthly O&M Service Fee — May 2025","category":"BaseFee","quantity":1,"unit":"month","unit_rate":12000000,"amount":12000000}]',
  12000000,
  18,
  2160000,
  14160000,
  'Disputed'
) ON CONFLICT (invoice_id) DO NOTHING;

INSERT INTO invoices (id, invoice_id, contract_id, invoice_date, period_start, period_end, line_items, subtotal, gst_rate, gst_amount, total, status)
VALUES (
  '22222222-2222-2222-2222-222222222225',
  'INV-005',
  '11111111-1111-1111-1111-111111111111',
  '2025-08-05',
  '2025-07-01',
  '2025-07-31',
  '[{"item_id":"LI-001","description":"Monthly O&M Service Fee — July 2025","category":"BaseFee","quantity":1,"unit":"month","unit_rate":12347484,"amount":12347484}]',
  12347484,
  18,
  2222547,
  14570031,
  'Paid'
) ON CONFLICT (invoice_id) DO NOTHING;

INSERT INTO invoices (id, invoice_id, contract_id, invoice_date, period_start, period_end, line_items, subtotal, gst_rate, gst_amount, total, status)
VALUES (
  '22222222-2222-2222-2222-222222222226',
  'INV-006',
  '11111111-1111-1111-1111-111111111111',
  '2025-09-05',
  '2025-08-01',
  '2025-08-31',
  '[{"item_id":"LI-001","description":"Monthly O&M Service Fee — August 2025","category":"BaseFee","quantity":1,"unit":"month","unit_rate":12200000,"amount":12200000},{"item_id":"LI-002","description":"WPI Escalation Adjustment FY2025","category":"Escalation","quantity":1,"unit":"adjustment","unit_rate":200000,"amount":200000}]',
  12400000,
  18,
  2232000,
  14632000,
  'Pending'
) ON CONFLICT (invoice_id) DO NOTHING;

-- 3. Insert Generation Data

INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '2025-01-01',
  '2025-01-31',
  8450000,
  96.8
);

INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '2025-04-01',
  '2025-04-30',
  9350000,
  96.2
);

INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '2025-05-01',
  '2025-05-31',
  12800000,
  95.2
);

INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '2025-06-01',
  '2025-06-30',
  12850000,
  96.5
);

INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '2025-07-01',
  '2025-07-31',
  9780000,
  98.4
);

INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '2025-08-01',
  '2025-08-31',
  9010000,
  96.1
);
