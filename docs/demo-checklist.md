# 🎯 WOLVIO DEMO: ZERO-FAIL CHECKLIST

This document is the operational runbook for the "First Meeting Demo". Ensure all steps are signed off before the client enters the room.

## 🔴 T-24 Hours (Environment & Code Freeze)
- [ ] **Tests Pass:** Run `npx vitest run`. Ensure all Golden Scenario tests for INV-002 pass mathematically.
- [ ] **Code Freeze:** No new commits to `main` unless it's a P0 blocker.
- [ ] **API Keys:** Verify `ANTHROPIC_API_KEY` is funded and active. Test a raw API call to ensure no IP blocks.
- [ ] **Data Seed:** Verify `demo_data/contracts/C002.json` and `demo_data/mock_db.json` are intact.

## 🟠 T-1 Hour (Cache & Hardware)
- [ ] **Port Clearance:** Run `taskkill /F /IM node.exe /T` (Windows) to clear any lingering ghost ports.
- [ ] **Server Start:** Run `npm run dev`. Ensure it starts without Turbopack errors.
- [ ] **Cache Warmup:** 
    - Open `http://localhost:3000/welcome`
    - Navigate to Dashboard.
    - Open Contract C001 and C002.
    - Run the Invoice Validation flow once to ensure the Next.js App Router cache is primed.
- [ ] **Screenshot Backup:** Export static screenshots of the Dashboard, C002 Detail View, and Validation Report to a local folder in case the server completely crashes.

## 🟢 T-10 Minutes (Room Prep)
- [ ] **Clean Slate:** Ensure the browser has no cache of previous auth states (or use an Incognito window).
- [ ] **Demo Pilot:** Press `Ctrl+Shift+D` to verify the Demo Control Panel works. Close it.
- [ ] **Resolution:** Ensure display is at 100% scale (no weird zoom) so the `xl:grid-cols` layout renders perfectly side-by-side.
- [ ] **Take a breath.** You're ready.
