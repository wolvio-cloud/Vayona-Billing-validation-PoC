// Volatile mock storage for PoC demos when DATABASE_URL is missing
// This keeps data in memory during the dev session.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface MockContract {
  contract_id: string
  display_name: string
  pdf_storage_path: string
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_error?: string | null
  parameters?: any
  raw_text?: string
  page_count?: number
  created_at: string
}

class MockStore {
  private filePath = join(process.cwd(), 'demo_data', 'mock_db.json')
  private contracts: Map<string, MockContract> = new Map()

  constructor() {
    this.load()
  }

  private load() {
    try {
      if (existsSync(this.filePath)) {
        const data = JSON.parse(readFileSync(this.filePath, 'utf-8'))
        this.contracts = new Map(Object.entries(data))
      }
    } catch (err) {
      console.error('Failed to load mock DB', err)
    }
  }

  private save() {
    try {
      const dir = join(process.cwd(), 'demo_data')
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      const data = Object.fromEntries(this.contracts)
      writeFileSync(this.filePath, JSON.stringify(data, null, 2))
    } catch (err) {
      console.error('Failed to save mock DB', err)
    }
  }

  set(id: string, data: Partial<MockContract>) {
    const existing = this.contracts.get(id) || {
      contract_id: id,
      display_name: 'Unknown',
      pdf_storage_path: '',
      extraction_status: 'pending',
      created_at: new Date().toISOString()
    }
    this.contracts.set(id, { ...existing, ...data } as MockContract)
    this.save()
  }

  get(id: string) {
    this.load() // Force reload from disk to sync across Next.js workers/isolates
    return this.contracts.get(id)
  }

  list() {
    this.load() // Force reload
    return Array.from(this.contracts.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  deleteContract(id: string) {
    this.contracts.delete(id)
    this.save()
  }
}

export const mockStore = new MockStore()

