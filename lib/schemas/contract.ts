import { z } from 'zod'

export const TracedFieldSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    value: z.union([valueSchema, z.null()]),
    source_clause: z.string().max(200),
    clause_reference: z.string(),
    page_number: z.number().int(),
    confidence: z.enum(['high', 'medium', 'low']),
    flag: z.string().optional(),
    suggestion: z.string().optional(),
  })

export const ContractParametersSchema = z.object({
  contract_id: z.string(),
  contract_type: z.enum(['LTSA', 'TSA', 'Service', 'Supply']),
  base_annual_fee: TracedFieldSchema(z.number()),
  base_monthly_fee: TracedFieldSchema(z.number()),
  escalation: TracedFieldSchema(z.object({
    type: z.enum(['WPI', 'CPI', 'Fixed', 'None']),
    index_base_month: z.string(),
    effective_date: z.string(),
    cap_pct: z.number(),
    floor_pct: z.number().default(0),
  })).nullable(),
  variable_component: TracedFieldSchema(z.object({
    rate_per_kwh: z.number(),
    billing_frequency: z.enum(['Monthly', 'Quarterly']),
  })).nullable(),
  availability_guarantee_pct: TracedFieldSchema(z.number()),
  ld_rate_per_pp: TracedFieldSchema(z.number()),
  ld_cap_pct: TracedFieldSchema(z.number()),
  bonus_threshold_pct: TracedFieldSchema(z.number()).nullable(),
  bonus_rate_per_pp: TracedFieldSchema(z.number()).nullable(),
  payment_terms_days: TracedFieldSchema(z.number()),
  late_payment_interest: TracedFieldSchema(z.string()),
  renewal_notice_months: TracedFieldSchema(z.number()),
  validation_warnings: z.array(z.string()).optional(),
})

export type ContractParameters = z.infer<typeof ContractParametersSchema>
export type TracedField<T> = ReturnType<typeof TracedFieldSchema<z.ZodType<T>>>['_output']
