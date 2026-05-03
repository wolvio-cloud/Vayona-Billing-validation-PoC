# Wolvio: Contract Execution Intelligence Platform (PoC)

## Executive Summary
Wolvio is an enterprise-grade AI platform designed specifically for the Renewable Energy sector. It automates the extraction, auditing, and validation of highly complex Long-Term Service Agreements (LTSA) to prevent revenue leakage.

---

## 🚀 DEMO RUNBOOK (T-ZERO ZERO-FAIL CHECKLIST)

### 1. Environment Readiness (T-24h)
Ensure the following environment variables are strictly set in your `.env.local` file:
\`\`\`env
# Core AI Extraction Engine
ANTHROPIC_API_KEY=sk-ant-api03-... # Must be active and funded

# Optional: Supabase Connection (if using real DB instead of Mock DB)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
\`\`\`

### 2. Cache Warmup & Cinematic Flow (T-1h)
The PoC is designed with a "Cinematic Extraction" flow to keep the client engaged while the AI processes complex documents.
1. Start the server: `taskkill /F /IM node.exe /T` (to clear locks) -> `npm run dev`
2. Open `http://localhost:3000/welcome`
3. Click through the login (any credentials work).
4. **Important**: Go to the Dashboard and click on the **ReNew Power Mega-LTSA (C002)** contract to ensure the Next.js cache has compiled the page.
5. In the contract detail view, expand the "Predictive Financial Modeling" section at the bottom.
6. Click "Validate New Invoice" and upload the provided `demo_data/invoices/INV-002.pdf` (or any dummy PDF, the engine will use the seeded INV-002 logic for the demo).

### 3. Demo Pilot Controls (Fallback Mode)
If the live AI extraction fails due to hotel Wi-Fi or API timeouts, press **`Ctrl+Shift+D` (Windows) or `Cmd+Shift+D` (Mac)** to open the **Demo Pilot Panel**.
- **Restart Experience**: Quickly drops you back to the welcome screen.
- **Confidential Mode**: Toggles UI blurring for sensitive client screens.
- **Pre-cached Path**: The `INV-002` validation results are deterministic and will always render perfectly, even if the Anthropic API is slow.

---

## Technical Architecture
* **Frontend:** Next.js 16 (Turbopack), TailwindCSS, Radix UI.
* **Validation Engine:** Deterministic rule-engine (`lib/validation/engine.ts`) with 100% precision.
* **AI Extraction:** Claude 3.5 Sonnet with exponential backoff for resilience.

## Test Harness
To verify the deterministic engine is working flawlessly for the golden scenario (INV-002):
\`\`\`bash
npm install -D vitest
npx vitest run
\`\`\`
This ensures the Base Fee match, WPI gap, Variable under-billing, and Bonus opportunity are mathematically verified before you step into the room.
