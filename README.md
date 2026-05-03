# Wolvio: Contract Execution Intelligence Platform

## Overview
Wolvio is an enterprise-grade AI platform designed specifically for the Renewable Energy sector (Wind & Solar). It automates the extraction, auditing, and validation of highly complex Long-Term Service Agreements (LTSA) and Turbine Service Agreements (TSA). 

By leveraging cutting-edge LLMs (Claude 3.5 Sonnet) and robust OCR pipelines, Wolvio prevents revenue leakage by identifying billing discrepancies, missed performance bonuses, and unapplied liquidated damages.

## Product Scope (PoC)
The current Proof of Concept (PoC) focuses on the core "Billing Validation" flow:
1. **Intelligent Extraction:** Ingesting 100+ page LTSA documents (PDF) and converting unstructured legal text (e.g., WPI Escalation formulas, Tiered LD Caps) into a highly structured, machine-readable JSON schema.
2. **Automated Auditing:** Parsing incoming monthly/quarterly invoices and cross-referencing them against the extracted contract parameters and real-time generation data (Turbine Availability, kWh output).
3. **Variance Detection:** A deterministic calculation engine that flags mismatches (Gaps) or missed opportunities (e.g., unclaimed bonuses) with 100% mathematical precision.
4. **Actionable Resolution:** Generating SAP-ready BAPI payloads to immediately issue Credit Notes or dispute resolutions.

## The Big Picture & Future Roadmap
While the PoC validates the core engine, the ultimate vision for Wolvio is to become the **Central Nervous System for Commercial Operations**:

### Phase 1: Expansion & Integration
* **Multi-Modal Document Processing:** Support for scanned PDFs, handwritten annexures, and email chains.
* **ERP Integration:** Direct API connections to SAP, Oracle, and Microsoft Dynamics for automated invoice holding and automated Credit Note generation.
* **WPI/CPI Auto-Sync:** Live data feeds from the Office of the Economic Adviser (GoI) to ensure escalation calculations are always using the latest indices without manual input.

### Phase 2: Predictive Intelligence
* **Risk Forecasting:** Simulating future financial exposure based on historical availability trends (e.g., "If availability drops by 1% next quarter, LD exposure will hit the 15% cap").
* **Contract Negotiation AI:** Analyzing historical leakage to recommend tighter clauses in future contract renewals.

### Phase 3: Total Portfolio Command
* **Fleet-Wide Analytics:** Aggregating data across dozens of wind/solar farms to identify systemic vendor underperformance.
* **Compliance Auto-Pilot:** Ensuring all regulatory and tax (GST) compliance is met automatically before any payment leaves the organization.

## Technical Architecture
* **Frontend:** Next.js 16 (App Router), React, TailwindCSS (High-performance Glassmorphism UI)
* **Backend:** Next.js Server Actions, Node.js
* **AI/Extraction:** Anthropic Claude 3.5 Sonnet (via `@anthropic-ai/sdk`)
* **Styling:** Custom CSS with CSS Variables for theme consistency

## Running Locally
\`\`\`bash
npm install
npm run dev
\`\`\`
*Note: Ensure \`ANTHROPIC_API_KEY\` is set in your \`.env\` file.*
