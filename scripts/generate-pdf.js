const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument();
const dir = path.join(__dirname, '..', 'demo_data', 'contracts');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

doc.pipe(fs.createWriteStream(path.join(dir, 'C001_LTSA_WindFarmAlpha.pdf')));

doc.fontSize(20).text('Wind Farm Alpha LTSA', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('Parties: GreenWind Power Pvt Ltd and Wolvio Energy Services Pvt Ltd');
doc.text('Asset: Wind Farm Alpha, Tirunelveli, Tamil Nadu — 50 turbines × 2MW = 100MW');
doc.text('Contract value: ₹14,40,00,000 per year (₹14.40 Cr)');
doc.text('Monthly fee: ₹1,20,00,000 (₹1.20 Cr)');
doc.text('Term: 15 years from April 1, 2020');
doc.text('Governing law: Tamil Nadu, India');
doc.moveDown();

doc.fontSize(14).text('Clause 4.1 — Base Fee');
doc.fontSize(12).text('₹14,40,00,000 per annum payable monthly at ₹1,20,00,000 per month on or before the 5th of each month.');
doc.moveDown();

doc.fontSize(14).text('Clause 5.2 — Escalation');
doc.fontSize(12).text('The Base Annual Fee shall be escalated on April 1 each year by the Wholesale Price Index (WPI) for January published by the Office of the Economic Adviser, GoI — capped at 8% p.a.');
doc.moveDown();

doc.fontSize(14).text('Clause 6.3 — Variable Component');
doc.fontSize(12).text('₹0.04 per kWh of net energy generated, billed quarterly within 30 days of quarter end.');
doc.moveDown();

doc.fontSize(14).text('Clause 7.1 — Availability Guarantee');
doc.fontSize(12).text('Contractor guarantees 96.0% turbine availability annually. Calculated as: (Available Hours / Total Hours) × 100.');
doc.moveDown();

doc.fontSize(14).text('Clause 8.2 — Liquidated Damages');
doc.fontSize(12).text('0.5% of Annual Fee per percentage point shortfall below 96%. Maximum LD: 15% of Annual Fee per annum.');
doc.moveDown();

doc.fontSize(14).text('Clause 9.1 — Performance Bonus');
doc.fontSize(12).text('1% of Annual Fee per percentage point above 98% availability. Maximum bonus: 5% of Annual Fee per annum.');
doc.moveDown();

doc.fontSize(14).text('Clause 10.1 — Payment Terms');
doc.fontSize(12).text('Net 45 days from invoice date.');
doc.moveDown();

doc.fontSize(14).text('Clause 11.3 — Late Payment Interest');
doc.fontSize(12).text('SBI base rate + 2% per annum on overdue amounts.');
doc.moveDown();

doc.fontSize(14).text('Clause 17.2 — Renewal');
doc.fontSize(12).text('12 months written notice required to terminate or renegotiate.');

doc.end();
console.log('PDF generated at demo_data/contracts/C001_LTSA_WindFarmAlpha.pdf');
