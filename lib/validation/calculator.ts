import { escalationFactor } from './indices'

export function calcEscalatedMonthlyFee(params: {
  baseMonthlyFee: number
  currentIndexValue: number
  baseIndexValue: number
  capPct: number
  floorPct?: number
}): { value: number; factor: number; rawChange: number } {
  const rawChange = (params.currentIndexValue - params.baseIndexValue) / params.baseIndexValue
  const factor = escalationFactor(params.currentIndexValue, params.baseIndexValue, params.capPct, params.floorPct || 0)
  return {
    value: Math.round(params.baseMonthlyFee * factor),
    factor,
    rawChange
  }
}

export function calcLiquidatedDamages(params: {
  baseAnnualFee: number
  ldRatePerPP: number
  ldCapPct: number
  guaranteePct: number
  actualAvailabilityPct: number
}): { value: number; shortfallPP: number; rawAmount: number; capAmount: number } {
  const shortfallPP = params.guaranteePct - params.actualAvailabilityPct
  if (shortfallPP <= 0) return { value: 0, shortfallPP: 0, rawAmount: 0, capAmount: 0 }
  
  const rawAmount = params.baseAnnualFee * (params.ldRatePerPP / 100) * shortfallPP
  const capAmount = params.baseAnnualFee * (params.ldCapPct / 100)
  
  return {
    value: Math.round(Math.min(rawAmount, capAmount)),
    shortfallPP,
    rawAmount,
    capAmount
  }
}

export function calcPerformanceBonus(params: {
  baseAnnualFee: number
  bonusRatePerPP: number
  bonusThresholdPct: number
  actualAvailabilityPct: number
}): { value: number; excessPP: number; rawAmount: number; capAmount: number } {
  const excessPP = params.actualAvailabilityPct - params.bonusThresholdPct
  if (excessPP <= 0) return { value: 0, excessPP: 0, rawAmount: 0, capAmount: 0 }
  
  const rawAmount = params.baseAnnualFee * (params.bonusRatePerPP / 100) * excessPP
  const capAmount = params.baseAnnualFee * 0.05 // Standard 5% cap if not specified
  
  return {
    value: Math.round(Math.min(rawAmount, capAmount)),
    excessPP,
    rawAmount,
    capAmount
  }
}

export function calcVariableComponent(totalKwh: number, ratePerKwh: number): number {
  return Math.round(totalKwh * ratePerKwh)
}
