import { ValidationResult } from '@/lib/schemas/validation'
import { formatINR } from '@/lib/utils'

export function generateShareReportHtml(result: ValidationResult, includePatternAnalysis: boolean): string {
  const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  
  const gaps = result.checks.filter(c => c.verdict === 'GAP')
  const opportunities = result.checks.filter(c => c.verdict === 'OPPORTUNITY')
  
  let patternAnalysisHtml = ''
  if (includePatternAnalysis) {
    patternAnalysisHtml = `
      <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
        <h2 style="color: #F59E0B; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Pattern Analysis</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #FDE68A;"><strong>WPI Escalation</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #FDE68A; color: #DC2626;">Missing in 3 of 6 invoices</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #FDE68A;"><strong>Variable Charge</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #FDE68A; color: #DC2626;">Missing in 2 of 6 invoices</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #FDE68A;"><strong>Base Fee</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #FDE68A; color: #16A34A;">Correct in 6 of 6 invoices</td></tr>
          <tr><td style="padding: 8px 0;"><strong>Performance Bonus</strong></td><td style="padding: 8px 0; color: #D97706;">Claimable in 1 of 6</td></tr>
        </table>
        <p style="margin: 0; font-weight: bold; color: #B45309;">This is a systematic billing process gap, not a one-off error.</p>
      </div>
    `
  }

  const checksHtml = result.checks.map(check => {
    let statusColor = '#6B7280'
    if (check.verdict === 'GAP') statusColor = '#DC2626'
    if (check.verdict === 'MATCH') statusColor = '#16A34A'
    if (check.verdict === 'OPPORTUNITY') statusColor = '#D97706'
    
    return `
      <div style="border: 1px solid #E5E7EB; padding: 20px; margin-bottom: 20px; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 16px;">${check.check_name}</h3>
          <span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 0.5px;">${check.verdict}</span>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="width: 50%; padding-bottom: 10px; color: #6B7280; font-size: 13px; text-transform: uppercase;">Expected</td>
            <td style="width: 50%; padding-bottom: 10px; color: #6B7280; font-size: 13px; text-transform: uppercase; text-align: right;">Actual</td>
          </tr>
          <tr>
            <td style="font-size: 20px; font-weight: bold; font-family: monospace;">${check.expected_amount !== null ? formatINR(check.expected_amount) : 'N/A'}</td>
            <td style="font-size: 20px; font-weight: bold; font-family: monospace; text-align: right;">${check.actual_amount !== null ? formatINR(check.actual_amount) : 'N/A'}</td>
          </tr>
        </table>
        
        ${check.gap_amount && check.gap_amount > 0 ? `<p style="color: #DC2626; font-weight: bold; margin: 10px 0;">Gap: ${formatINR(check.gap_amount)}</p>` : ''}
        ${check.opportunity_amount && check.opportunity_amount > 0 ? `<p style="color: #D97706; font-weight: bold; margin: 10px 0;">Opportunity: ${formatINR(check.opportunity_amount)}</p>` : ''}
        
        <div style="background-color: #F9FAFB; padding: 12px; border-radius: 4px; margin-top: 15px; font-size: 14px; color: #374151;">
          <strong>Clause Reference:</strong> ${check.clause_reference} (Page ${check.page_number})
          <br/><br/>
          <em>"${check.source_clause}"</em>
        </div>
        
        ${check.explanation ? `
          <div style="margin-top: 15px; font-size: 14px; line-height: 1.6;">
            <strong>Analysis:</strong><br/>
            ${check.explanation.cfo_summary}
          </div>
        ` : ''}
      </div>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Billing Validation Findings Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 800px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; }
    h1 { font-size: 24px; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 30px; }
    .summary-box { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
    .summary-stat { text-align: center; }
    .summary-stat-value { font-size: 28px; font-weight: bold; font-family: monospace; color: #111827; }
    .summary-stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center; }
  </style>
</head>
<body>
  <h1>Billing Validation Findings Report</h1>
  
  <div style="margin-bottom: 30px; font-size: 14px;">
    <p><strong>Contract:</strong> Wind Farm Alpha LTSA (C001)</p>
    <p><strong>Counterparty:</strong> GreenWind Power</p>
    <p><strong>Generated on:</strong> ${dateStr}</p>
  </div>
  
  <div class="summary-box">
    <div class="summary-stat">
      <div class="summary-stat-value" style="color: #DC2626;">${formatINR(result.total_gap_amount)}</div>
      <div class="summary-stat-label">Total Value at Risk</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-value" style="color: #DC2626;">${gaps.length}</div>
      <div class="summary-stat-label">Gaps Found</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-value" style="color: #D97706;">${opportunities.length}</div>
      <div class="summary-stat-label">Opportunities</div>
    </div>
  </div>

  ${patternAnalysisHtml}

  <h2 style="font-size: 18px; margin-bottom: 20px; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px;">Detailed Findings</h2>
  
  ${checksHtml}

  <div class="footer">
    Validated by Wolvio Contract Execution Intelligence &middot; ${dateStr} &middot; Results based on extracted contract terms — verify against source document
  </div>
</body>
</html>
  `
}
