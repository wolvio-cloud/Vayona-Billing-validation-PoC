import { z } from 'zod'

export const InvoiceLineItemSchema = z.object({
  item_id: z.string(),
  description: z.string(),
  category: z.enum(['BaseFee', 'Escalation', 'Variable', 'LD', 'Bonus', 'Other']),
  quantity: z.number(),
  unit: z.string(),
  unit_rate: z.number(),
  amount: z.number(),
})

export const InvoiceSchema = z.object({
  invoice_id: z.string(),
  contract_id: z.string(),
  invoice_date: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  line_items: z.array(InvoiceLineItemSchema),
  subtotal: z.number(),
  gst_rate: z.number().default(18),
  gst_amount: z.number(),
  total: z.number(),
  status: z.enum(['Paid', 'Pending', 'Disputed', 'Overdue']).default('Pending'),
  engineered_gap: z.string().optional(),
  expected_gap: z.number().optional(),
  note: z.string().optional(),
})

export type Invoice = z.infer<typeof InvoiceSchema>
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>
