import { AggregatedDataPoints } from "../model/aggregatedDataPoint";
import { DataPoint } from "../model/dataPoint";
import { Inflation } from "../parameters/inflation";
import { Returns } from "../parameters/returns";
import { datesBetween } from "./dateRange";


const getSimulationSpan = (start: Date, end: Date): Array<AggregatedDataPoints> => {
    const simulatedDays: Array<AggregatedDataPoints> = datesBetween(start, end)
        .map(date => ({
            dataPoint: {
                date: date,
                invested: 0
            },
            dailyGain: 0,
            cumulatedInvested: 0,
            nominalValue: 0,
            realValue: 0
        }))
    return simulatedDays;
}

export interface DailyPercentageReturnsSupplier {
    get: () => number
}

export const simulate = (dataPoints: Array<DataPoint>, returnsSupplier: DailyPercentageReturnsSupplier, inflation: Inflation) => {

    console.table(dataPoints)
    console.log(returnsSupplier)
    console.log(inflation)

    if (!dataPoints?.length) return []
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime())

    const startDate = dataPoints[0]
    const endDate = dataPoints[dataPoints.length - 1];

    const investementDays = dataPoints.reduce((acc, point) => {
        acc.set(point.date.toDateString(), point)
        return acc;
    }, new Map<string, DataPoint>)

    const simulationDays = getSimulationSpan(startDate.date, endDate.date)

    let cumulatedInvested = 0;
    let cumulatedValue = 0;

    for (let i = 0; i < simulationDays.length; i++) {
        const day = simulationDays[i]
        // If we invested this day, add ammount
        const invested = investementDays.get(day.dataPoint.date.toDateString())
        if (invested?.invested) {
            day.dataPoint.invested = invested?.invested
            cumulatedInvested += invested.invested
            cumulatedValue += invested.invested
        }

        // Nominal Increase
        const dailyGain = cumulatedValue * returnsSupplier.get()
        cumulatedValue = cumulatedValue + dailyGain;


        // Nominal Value
        day.dailyGain = dailyGain
        day.nominalValue = cumulatedValue
        day.cumulatedInvested = cumulatedInvested;

        // Real Value
        day.realValue = day.nominalValue / inflation.inflationFactor(i + 1);
    }
    return simulationDays;
}




