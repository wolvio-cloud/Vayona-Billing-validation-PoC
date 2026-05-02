import { wpiEscalationFactor } from './wpi-index'

export function calcEscalatedMonthlyFee(params: {
  baseMonthlyFee: number
  currentJanWPI: number
  baseJanWPI: number
  capPct: number
}): number {
  const factor = wpiEscalationFactor(params.currentJanWPI, params.baseJanWPI, params.capPct)
  return Math.round(params.baseMonthlyFee * factor)
}

export function calcLiquidatedDamages(params: {
  baseAnnualFee: number
  ldRatePerPP: number
  ldCapPct: number
  guaranteePct: number
  actualAvailabilityPct: number
}): number {
  const shortfallPP = params.guaranteePct - params.actualAvailabilityPct
  if (shortfallPP <= 0) return 0
  const raw = params.baseAnnualFee * (params.ldRatePerPP / 100) * shortfallPP
  const cap = params.baseAnnualFee * (params.ldCapPct / 100)
  return Math.round(Math.min(raw, cap))
}

export function calcPerformanceBonus(params: {
  baseAnnualFee: number
  bonusRatePerPP: number
  bonusThresholdPct: number
  actualAvailabilityPct: number
}): number {
  const excessPP = params.actualAvailabilityPct - params.bonusThresholdPct
  if (excessPP <= 0) return 0
  const raw = params.baseAnnualFee * (params.bonusRatePerPP / 100) * excessPP
  const cap = params.baseAnnualFee * 0.05
  return Math.round(Math.min(raw, cap))
}

export function calcVariableComponent(totalKwh: number, ratePerKwh: number): number {
  return Math.round(totalKwh * ratePerKwh)
}
