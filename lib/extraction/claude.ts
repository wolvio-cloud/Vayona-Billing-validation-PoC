import Anthropic from '@anthropic-ai/sdk'
import { createLogger } from '@/lib/logger'

const logger = createLogger('claude-extraction')
const MODELS = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-5',
  'claude-opus-4-7',
  'claude-haiku-4-5',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-latest',
]
const MAX_TOKENS = 4000
const COST_PER_INPUT_TOKEN = 0.000003
const COST_PER_OUTPUT_TOKEN = 0.000015
const COST_WARN_THRESHOLD = 0.15

function computeCost(inputTokens: number, outputTokens: number): number {
  return inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN
}

export async function callClaude(params: {
  systemPrompt: string
  userMessage: string
  images?: string[] // base64 or data URLs
  timeoutMs?: number
}): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { systemPrompt, userMessage, images = [], timeoutMs = 90_000 } = params

  let lastError: any
  
  // Try each model in order of capability
  for (const modelId of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const content: Anthropic.Messages.ContentBlockParam[] = [
          { type: 'text', text: userMessage }
        ]

        // Add images if provided
        for (const img of images) {
          // Anthropic expects base64 without the "data:image/png;base64," prefix
          const base64Match = img.match(/^data:([^;]+);base64,(.+)$/)
          const mediaType = base64Match ? base64Match[1] : 'image/png'
          const data = base64Match ? base64Match[2] : img

          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as any,
              data: data
            }
          })
        }

        const response = await Promise.race([
          client.messages.create({
            model: modelId,
            max_tokens: MAX_TOKENS,
            temperature: 0,
            system: systemPrompt,
            messages: [{ role: 'user', content }],
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Claude request timed out')), timeoutMs)
          ),
        ])

        const { input_tokens, output_tokens } = (response as Anthropic.Message).usage
        const cost = computeCost(input_tokens, output_tokens)
        logger.info(`Extraction success with ${modelId} [Attempt ${attempt}]`, { cost: `$${cost.toFixed(4)}` })

        const responseContent = (response as Anthropic.Message).content[0]
        if (responseContent.type !== 'text') throw new Error('Unexpected response type from Claude')
        return responseContent.text
      } catch (err: any) {
        lastError = err
        
        // If it's a 404 (Model Not Found), immediately try the next model in the list
        if (err.status === 404) {
          logger.warn(`Model ${modelId} not available, trying fallback...`)
          break // Exit the retry loop for THIS model
        }

        const isRetryable =
          err instanceof Anthropic.RateLimitError ||
          err instanceof Anthropic.InternalServerError ||
          (err instanceof Anthropic.APIError && err.status >= 500)
        
        if (!isRetryable || attempt === 2) break
        
        const delay = 1000 * Math.pow(2, attempt - 1)
        logger.warn(`Claude attempt ${attempt} failed for ${modelId}, retrying...`, err.message)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  
  throw lastError
}
