const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateContract() {
  const doc = new PDFDocument({ margin: 50 });
  const outputPath = path.join(process.cwd(), 'public', 'Siemens_Gamesa_LTSA_Full_50Pages.pdf');

  if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
    fs.mkdirSync(path.join(process.cwd(), 'public'));
  }

  doc.pipe(fs.createWriteStream(outputPath));

  // Title Page
  doc.fontSize(24).font('Helvetica-Bold').text('LONG TERM SERVICE AGREEMENT (LTSA)', { align: 'center' });
  doc.moveDown(10);
  doc.fontSize(14).text('Project: Wind Farm Alpha (150 MW)', { align: 'center' });
  doc.text('Version 4.2 - Execution Copy', { align: 'center' });
  doc.addPage();

  // Helper for filler text
  const addFiller = (title, count = 2) => {
    doc.font('Helvetica-Bold').fontSize(12).text(title).moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text('The parties hereby agree that all services provided under this agreement shall be governed by the standard operating procedures of the renewable energy sector. This includes, but is not limited to, compliance with all local safety regulations, environmental standards, and grid stability requirements. Any deviation from these standards must be documented in writing and signed by both authorized representatives of the Operator and the Owner. Failure to do so may result in a breach of contract as defined in Section 14.2 of this document. Furthermore, all equipment used during maintenance must be certified by the original manufacturer or an approved third-party vendor to ensure project longevity and safety.').moveDown();
    for(let i=0; i<count; i++) {
        doc.text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.').moveDown();
    }
  };

  // Generate 50 pages
  for (let i = 3; i <= 50; i++) {
    if (i === 12) {
      doc.font('Helvetica-Bold').fontSize(14).text('8. COMMERCIAL TERMS AND PAYMENTS');
      doc.moveDown();
      doc.font('Helvetica').fontSize(11).text('8.1 Base Monthly Fee', { bold: true });
      doc.text('The Owner shall pay the Operator a fixed monthly service fee of INR 45,00,000 (Forty-Five Lakhs) for the duration of the agreement term.');
      doc.moveDown();
    } else if (i === 28) {
      doc.font('Helvetica-Bold').fontSize(12).text('8.2 Annual Escalation (WPI)');
      doc.text('The Base Monthly Fee shall be escalated annually on April 1st. The escalation calculation shall utilize the Wholesale Price Index (WPI) for "All Commodities" with January of the preceding year as the base index month.');
    } else if (i === 35) {
      doc.font('Helvetica-Bold').fontSize(12).text('12. PERFORMANCE GUARANTEES');
      doc.moveDown();
      doc.text('12.1 Availability Guarantee: The Operator guarantees an annual project availability of 97.0%. Shortfall below this threshold triggers LDs at 0.5% of the annual fee per 1% deviation.');
    } else if (i === 45) {
        doc.font('Helvetica-Bold').fontSize(12).text('8.3 Variable Component');
        doc.text('A variable O&M rate of INR 0.15 per kWh of net generation is applicable, payable monthly against SCADA meter verification.');
    } else {
      addFiller(`Section ${i}: General Provisions and Standard Terms`);
    }
    
    if (i < 50) doc.addPage();
  }

  doc.end();
  console.log('50-page Contract PDF generated at:', outputPath);
}

generateContract();

