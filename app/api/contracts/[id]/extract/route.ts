import sql from '@/lib/db'
import { callClaude } from '@/lib/extraction/claude'
import { ContractParametersSchema } from '@/lib/schemas/contract'
import { createLogger } from '@/lib/logger'
import { mockStore } from '@/lib/db/mock-store'
import { safeParseJSON, sanitizeExtractedData } from '@/lib/extraction/utils'

const logger = createLogger('api/contracts/extract')

export const dynamic = 'force-dynamic'

function scoreConfidence(params: Record<string, any>): { score: number; highCount: number; totalCount: number } {
  const fields = Object.values(params).filter(v => v && typeof v === 'object' && 'confidence' in v)
  const highCount = fields.filter((f: any) => f.confidence === 'high').length
  const score = fields.length ? Math.round((highCount / fields.length) * 100) : 0
  return { score, highCount, totalCount: fields.length }
}

import { CONTRACT_EXTRACTION_SYSTEM_PROMPT } from '@/lib/extraction/contract-prompt'

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const startTime = Date.now()

  let contract: any
  try {
    const rows = await sql`SELECT * FROM contracts WHERE contract_id::text = ${id} LIMIT 1`
    contract = rows[0]
  } catch {
    contract = mockStore.get(id)
  }

  if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 })

  const updateDB = async (data: any) => {
    try {
      if (process.env.DATABASE_URL) {
        const keys = Object.keys(data)
        if (keys.length === 0) return
        
        if (data.parameters) {
          await sql`UPDATE contracts SET parameters = ${JSON.stringify(data.parameters)} WHERE contract_id = ${id}`
        }
        if (data.extraction_status) {
          await sql`UPDATE contracts SET extraction_status = ${data.extraction_status} WHERE contract_id = ${id}`
        }
        if (data.extraction_error) {
          await sql`UPDATE contracts SET extraction_error = ${data.extraction_error} WHERE contract_id = ${id}`
        }
      } else {
        mockStore.set(id, { ...mockStore.get(id), ...data })
      }
    }
    catch (err) { 
      logger.error('DB update failed, using mockStore', err)
      mockStore.set(id, { ...mockStore.get(id), ...data }) 
    }
  }

  const updateProgress = async (step: string, stageIndex?: number, eta?: string) => {
    const payload: any = { current_step: step }
    if (stageIndex !== undefined) payload.stage_index = stageIndex
    if (eta) payload.stage_eta = eta
    
    try {
      if (process.env.DATABASE_URL) {
        await sql`UPDATE contracts SET parameters = jsonb_set(COALESCE(parameters, '{}'::jsonb), '{current_step}', ${JSON.stringify(step)}) WHERE contract_id = ${id}`
      } else {
        const existing = mockStore.get(id)?.parameters || {}
        mockStore.set(id, { 
          ...mockStore.get(id), 
          parameters: { ...existing, ...payload },
          stage_index: stageIndex // Save stage_index directly for polling
        })
      }
    } catch {
      const existing = mockStore.get(id)?.parameters || {}
      mockStore.set(id, { ...mockStore.get(id), parameters: { ...existing, ...payload }, stage_index: stageIndex })
    }
  }

  // ── Demo fast-path for seeded contracts ──
  const SEEDED = ['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008']
  if (SEEDED.includes(id)) {
    const stages = [
      { step: 'Scanning document structure...', delay: 1000 },
      { step: 'Detecting clause boundaries...', delay: 800 },
      { step: 'Extracting commercial parameters...', delay: 1200 },
      { step: 'Validating against schema...', delay: 600 },
      { step: 'Scoring confidence levels...', delay: 800 },
      { step: 'Building Digital Twin...', delay: 1500 },
    ]
    for (let i = 0; i < stages.length; i++) {
      await updateProgress(stages[i].step, i + 1)
      await new Promise(r => setTimeout(r, stages[i].delay))
    }
    await updateProgress('Complete — 12 parameters extracted', 7)
    await updateDB({ extraction_status: 'completed' })
    return Response.json({ contract_id: id, status: 'completed', parameter_count: 12 })
  }

  // ── LIVE INTAKE ──
  // We use an async IIFE to run extraction in the background to avoid Heroku 30s timeout
  const runBackgroundExtraction = async () => {
    try {
      const text = contract.raw_text || ''
      const screenshots = contract.parameters?._screenshots || []
      
      await updateProgress('Scanning document structure...', 1)
      await new Promise(r => setTimeout(r, 1000))
      
      await updateProgress('Detecting clause boundaries...', 2)
      await new Promise(r => setTimeout(r, 1000))

      await updateProgress('Extracting commercial parameters...', 3)
      const result = await callClaude({
        systemPrompt: CONTRACT_EXTRACTION_SYSTEM_PROMPT,
        userMessage: `Extract parameters from this contract text. I have also attached images of the first few pages for reference:\n\n${text}`,
        images: screenshots
      })

      await updateProgress('Validating against schema...', 4)
      const sanitized = sanitizeExtractedData(safeParseJSON(result))
      const validated = ContractParametersSchema.safeParse(sanitized)

      await updateProgress('Scoring confidence levels...', 5)
      const confidence = scoreConfidence(sanitized)

      await updateProgress('Building Digital Twin...', 6)
      
      const finalStatus = validated.success ? 'completed' : 'partial'
      const paramCount = Object.values(sanitized).filter((v: any) => v && typeof v === 'object' && 'value' in v && v.value !== null).length

      await updateDB({
        parameters: { 
          ...sanitized, 
          _extraction_meta: { confidence, page_count: contract.page_count || contract.parameters?.page_count } 
        },
        extraction_status: finalStatus
      })

      await updateProgress(`Complete — ${paramCount} parameters extracted`, 7)
    } catch (err: any) {
      logger.error('Background extraction failed', err)
      await updateDB({ extraction_status: 'failed', extraction_error: err.message })
      await updateProgress('Extraction failed', 0)
    }
  }

  // Kick off background task
  runBackgroundExtraction()

  // Return immediately to avoid timeout
  return Response.json({ 
    contract_id: id, 
    status: 'processing',
    message: 'Extraction started in background'
  }, { status: 202 })
}
