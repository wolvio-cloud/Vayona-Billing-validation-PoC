import { z } from 'zod'

export const ValidationCheckSchema = z.object({
  check_id: z.string(),
  check_name: z.string(),
  verdict: z.enum(['MATCH', 'GAP', 'OPPORTUNITY', 'INSUFFICIENT_DATA']),
  expected_amount: z.number().nullable(),
  actual_amount: z.number().nullable(),
  gap_amount: z.number().nullable(),
  opportunity_amount: z.number().nullable(),
  clause_reference: z.string(),
  source_clause: z.string(),
  page_number: z.number(),
  explanation: z.string(),
  severity: z.enum(['High', 'Medium', 'Low']).nullable(),
  confidence: z.enum(['High', 'Medium', 'Low']).optional(),
})

export const ValidationResultSchema = z.object({
  contract_id: z.string(),
  invoice_id: z.string(),
  run_at: z.string(),
  checks: z.array(ValidationCheckSchema),
  total_gap_amount: z.number(),
  total_opportunity_amount: z.number(),
  verdict: z.enum(['CLEAN', 'GAPS_FOUND', 'REVIEW_REQUIRED']),
})

export type ValidationCheck = z.infer<typeof ValidationCheckSchema>
export type ValidationResult = z.infer<typeof ValidationResultSchema>
