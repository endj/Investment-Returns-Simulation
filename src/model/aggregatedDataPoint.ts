import { DataPoint } from "./dataPoint"

export interface AggregatedDataPoints {
    dataPoint: DataPoint
    dailyGain: number
    cumulatedInvested: number
    nominalValue: number,
    realValue: number
}
