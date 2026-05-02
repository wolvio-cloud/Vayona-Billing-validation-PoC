const fs = require('fs');
const path = require('path');

const params = {
  contract_id: 'C001',
  contract_type: 'LTSA',
  base_annual_fee: { value: 144000000, source_clause: '₹14,40,00,000 per annum payable monthly at ₹1,20,00,000 per month on or before the 5th of each month.', clause_reference: 'Clause 4.1', page_number: 8, confidence: 'high' },
  base_monthly_fee: { value: 12000000, source_clause: '₹14,40,00,000 per annum payable monthly at ₹1,20,00,000 per month on or before the 5th of each month.', clause_reference: 'Clause 4.1', page_number: 8, confidence: 'high' },
  escalation: { value: { type: 'WPI', index_base_month: 'January', effective_date: 'April 1', cap_pct: 8, floor_pct: 0 }, source_clause: 'The Base Annual Fee shall be escalated on April 1 each year by the Wholesale Price Index (WPI) for January published by the Office of the Economic Adviser, GoI — capped at 8% p.a.', clause_reference: 'Clause 5.2', page_number: 14, confidence: 'high' },
  variable_component: { value: { rate_per_kwh: 0.04, billing_frequency: 'Quarterly' }, source_clause: '₹0.04 per kWh of net energy generated, billed quarterly within 30 days of quarter end.', clause_reference: 'Clause 6.3', page_number: 18, confidence: 'high' },
  availability_guarantee_pct: { value: 96.0, source_clause: 'Contractor guarantees 96.0% turbine availability annually. Calculated as: (Available Hours / Total Hours) × 100.', clause_reference: 'Clause 7.1', page_number: 22, confidence: 'high' },
  ld_rate_per_pp: { value: 0.5, source_clause: '0.5% of Annual Fee per percentage point shortfall below 96%. Maximum LD: 15% of Annual Fee per annum.', clause_reference: 'Clause 8.2', page_number: 27, confidence: 'high' },
  ld_cap_pct: { value: 15, source_clause: '0.5% of Annual Fee per percentage point shortfall below 96%. Maximum LD: 15% of Annual Fee per annum.', clause_reference: 'Clause 8.2', page_number: 27, confidence: 'high' },
  bonus_threshold_pct: { value: 98.0, source_clause: '1% of Annual Fee per percentage point above 98% availability. Maximum bonus: 5% of Annual Fee per annum.', clause_reference: 'Clause 9.1', page_number: 31, confidence: 'high' },
  bonus_rate_per_pp: { value: 1, source_clause: '1% of Annual Fee per percentage point above 98% availability. Maximum bonus: 5% of Annual Fee per annum.', clause_reference: 'Clause 9.1', page_number: 31, confidence: 'high' },
  payment_terms_days: { value: 45, source_clause: 'Net 45 days from invoice date.', clause_reference: 'Clause 10.1', page_number: 35, confidence: 'high' },
  late_payment_interest: { value: 'SBI base rate + 2%', source_clause: 'SBI base rate + 2% per annum on overdue amounts.', clause_reference: 'Clause 11.3', page_number: 38, confidence: 'high' },
  renewal_notice_months: { value: 12, source_clause: '12 months written notice required to terminate or renegotiate.', clause_reference: 'Clause 17.2', page_number: 45, confidence: 'high' }
};

let sql = `-- Demo contract seed
-- Run AFTER 0001_init.sql

-- 1. Insert Contract
INSERT INTO contracts (id, contract_id, display_name, pdf_storage_path, extraction_status, parameters)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'C001', 
  'Wind Farm Alpha LTSA', 
  'demo_data/contracts/C001_LTSA_WindFarmAlpha.pdf',
  'completed',
  '${JSON.stringify(params).replace(/'/g, "''")}'
) ON CONFLICT (contract_id) DO UPDATE SET parameters = EXCLUDED.parameters, extraction_status = 'completed';

-- 2. Insert Invoices
`;

const invDir = path.join(__dirname, '..', 'demo_data', 'invoices');
const invoices = fs.readdirSync(invDir).filter(f => f.endsWith('.json'));

let idCounter = 1;
for (const file of invoices) {
  const inv = JSON.parse(fs.readFileSync(path.join(invDir, file), 'utf8'));
  const uuid = `22222222-2222-2222-2222-22222222222${idCounter}`;
  idCounter++;

  sql += `
INSERT INTO invoices (id, invoice_id, contract_id, invoice_date, period_start, period_end, line_items, subtotal, gst_rate, gst_amount, total, status)
VALUES (
  '${uuid}',
  '${inv.invoice_id}',
  '11111111-1111-1111-1111-111111111111',
  '${inv.invoice_date}',
  '${inv.period_start}',
  '${inv.period_end}',
  '${JSON.stringify(inv.line_items).replace(/'/g, "''")}',
  ${inv.subtotal},
  ${inv.gst_rate},
  ${inv.gst_amount},
  ${inv.total},
  '${inv.status}'
) ON CONFLICT (invoice_id) DO NOTHING;
`;
}

sql += `\n-- 3. Insert Generation Data\n`;
const genData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_data', 'generation', 'gen-data.json'), 'utf8'));

for (const g of genData.monthly) {
  // calculate start and end of month
  const start = `${g.month}-01`;
  const [year, month] = g.month.split('-');
  const daysInMonth = new Date(year, month, 0).getDate();
  const end = `${g.month}-${daysInMonth}`;

  sql += `
INSERT INTO generation_data (contract_id, period_start, period_end, total_kwh, availability_pct)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '${start}',
  '${end}',
  ${g.kwh},
  ${g.availability_pct}
);
`;
}

fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seed', 'demo_contracts.sql'), sql);
console.log('Generated supabase/seed/demo_contracts.sql');
