const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateInvoice() {
  const doc = new PDFDocument({ margin: 50 });
  const outputPath = path.join(process.cwd(), 'public', 'Siemens_Gamesa_Invoice_Full_5Pages.pdf');

  if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
    fs.mkdirSync(path.join(process.cwd(), 'public'));
  }

  doc.pipe(fs.createWriteStream(outputPath));

  // Page 1: Cover and General Info
  doc.fontSize(20).text('INVOICE / TAX BILL', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(10).text('Invoice Number: SG-2025-MAR-001', { align: 'right' });
  doc.text('Project: Wind Farm Alpha', { align: 'right' });
  doc.moveDown(4);
  doc.text('To: GreenWind Power Generation Ltd', 50, 150);
  doc.text('Attn: Accounts Payable', 50, 165);
  doc.addPage();

  // Pages 2-4: Meter Readings (The "Haystack")
  for (let p = 2; p <= 4; p++) {
    doc.fontSize(12).text(`Annexure ${p-1}: SCADA Meter Logs - Phase ${p-1}`);
    doc.moveDown();
    doc.fontSize(8);
    for (let i = 1; i <= 30; i++) {
        doc.text(`Turbine ID: T-${i.toString().padStart(3, '0')} | Start Meter: ${10000 + i*100} | End Meter: ${10000 + i*100 + Math.random()*500} | Total Generation: ${Math.round(Math.random()*500)} kWh`);
    }
    doc.addPage();
  }

  // Page 5: Financial Summary
  const tableTop = 100;
  doc.fontSize(14).font('Helvetica-Bold').text('FINAL SETTLEMENT SUMMARY', 50, 50);
  doc.fontSize(10).font('Helvetica');
  
  doc.text('Description', 50, tableTop);
  doc.text('Amount (INR)', 480, tableTop, { align: 'right' });
  doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

  doc.text('Monthly O&M Fixed Fee', 50, tableTop + 30);
  doc.text('45,00,000.00', 480, tableTop + 30, { align: 'right' });

  doc.text('Variable O&M (2,240,000 kWh @ 0.15)', 50, tableTop + 55);
  doc.text('3,36,000.00', 480, tableTop + 55, { align: 'right' });

  doc.font('Helvetica-Bold');
  doc.text('TOTAL PAYABLE (Excl. Tax)', 350, tableTop + 100);
  doc.text('48,36,000.00', 480, tableTop + 100, { align: 'right' });

  doc.end();
  console.log('5-page Invoice PDF generated at:', outputPath);
}

generateInvoice();

