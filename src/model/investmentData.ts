import { AggregatedDataPoints } from "./aggregatedDataPoint"

export interface InvestmentData {
    investmentPoints: Array<AggregatedDataPoints>
    inflationRate: number
    yearlyReturns: number
}