
import { DataPoint } from '../model/dataPoint';
import { AggregatedDataPoints } from '../model/aggregatedDataPoint';
import { simulate } from './simulation';
import { Returns } from '../parameters/returns';
import { Inflation } from '../parameters/inflation';

function calculateCompoundInterest(principal: number, rate: number, periods: number): number {
    return principal * Math.pow(1 + rate, periods);
}

describe('simulate investments', () => {

    it('should simulate 1% daily return over 10 days', () => {
        const principal = 10_000;
        const returns = new Returns(100, 1);
        const inflation = new Inflation(0, 1)
        const dataPoints: DataPoint[] = [
            { date: new Date('2000-01-01'), invested: principal },
            { date: new Date('2000-01-10'), invested: 0 }
        ];
        const days = 10;

        const simulatedData: AggregatedDataPoints[] = simulate(dataPoints, returns, inflation);
        expect(simulatedData.length).toEqual(days);

        // First day 10_000 * 1.01 => 10_100
        const firstSimulatedDay = simulatedData[0];
        expect(firstSimulatedDay).toEqual(
            {
                dataPoint: { date: new Date('2000-01-01'), invested: 10000 },
                dailyGain: 100,
                cumulatedInvested: 10000,
                nominalValue: 10100,
                realValue: 10100,
            }
        );

        // Second day 10_100 * 1.01 => 10_100 + 101 = 10_201
        const secondDay = simulatedData[1]
        expect(secondDay).toEqual({
            dataPoint: { date: new Date('2000-01-02'), invested: 0 },
            dailyGain: 101,
            cumulatedInvested: 10000,
            nominalValue: 10201,
            realValue: 10201,
        });

        const lastDay = simulatedData[simulatedData.length - 1]
        expect(lastDay.nominalValue).toBeCloseTo(calculateCompoundInterest(principal, returns.dailyReturnPercentageDecimal(), days))
    });

    it('should handle zero yearly return', () => {
        const dataPoints: DataPoint[] = [
            { date: new Date('2000-01-01'), invested: 15_000 },
            { date: new Date('2000-01-15'), invested: 15_000 },
            { date: new Date('2000-01-30'), invested: 15_000 }
        ];
        const zeroReturns = new Returns(0, 1);
        const simulatedData: AggregatedDataPoints[] = simulate(dataPoints, zeroReturns, new Inflation(0, 1));


        // Check that simulatedData has the expected length
        expect(simulatedData.length).toBeGreaterThan(0);

        const firstSimulatedDay = simulatedData[0];
        expect(firstSimulatedDay.dataPoint.date).toEqual(new Date('2000-01-01'));
        expect(firstSimulatedDay.dataPoint.invested).toBe(15_000);
        expect(firstSimulatedDay.cumulatedInvested).toBe(15_000);

        const sixtenthDay = simulatedData[14]
        expect(sixtenthDay.dataPoint.date).toEqual(new Date('2000-01-15'));
        expect(sixtenthDay.dataPoint.invested).toBe(15_000);
        expect(sixtenthDay.cumulatedInvested).toBe(30_000);

        const lastDay = simulatedData[simulatedData.length - 1]
        expect(lastDay.dataPoint.date).toEqual(new Date('2000-01-30'));
        expect(lastDay.dataPoint.invested).toBe(15_000);
        expect(lastDay.cumulatedInvested).toBe(45_000);
    });

    it('should handle negative returns', () => {
        const principal = 10_000;
        const returns = new Returns(-100, 1);
        const inflation = new Inflation(0, 1)
        const dataPoints: DataPoint[] = [
            { date: new Date('2000-01-01'), invested: principal },
            { date: new Date('2000-01-10'), invested: 0 }
        ];

        const simulatedData: AggregatedDataPoints[] = simulate(dataPoints, returns, inflation);
        expect(simulatedData[0]).toEqual({
            dataPoint: { date: new Date('2000-01-01'), invested: 10000 },
            dailyGain: -100,
            cumulatedInvested: 10000,
            nominalValue: 9900,
            realValue: 9900,
        })

        const expectedReturns = calculateCompoundInterest(10_000, returns.dailyReturnPercentageDecimal(), 10)
        const finalValue = simulatedData[simulatedData.length - 1].nominalValue;
        expect(finalValue).toBeCloseTo(expectedReturns)
    });

    it('Inflation should eat ', () => {
        const principal = 10_000;
        const returns = new Returns(0, 1);
        const inflation = new Inflation(1_000, 365) // 10%
        const dataPoints: DataPoint[] = [
            { date: new Date('2000-01-01'), invested: principal },
            { date: new Date('2000-01-10'), invested: 0 }
        ];
        const simulatedData: AggregatedDataPoints[] = simulate(dataPoints, returns, inflation);
        
        
        const inflationFactor = inflation.inflationFactor(10)
        const expectedRealValue = principal / inflationFactor

        expect(simulatedData[simulatedData.length - 1].realValue).toBeCloseTo(expectedRealValue)
    })

    it('Expected inflation value after year 10%', () => {
        const principal = 10_000
        const oneYearInflation = new Inflation(1000, 365).inflationFactor(365)
        const realValue = principal / oneYearInflation
        expect(realValue).toBeCloseTo(9090.91)
    })

    it('10% inflation 5% returns', () => {
        const principal = 10_000;
        const returns = new Returns(500, 365)
        const inflation = new Inflation(1000, 365) // 10% inflation

        const nominal = calculateCompoundInterest(principal, returns.dailyReturnPercentageDecimal(), 365)
        const real = nominal / inflation.inflationFactor(365)

        expect(nominal).toBeCloseTo(10512.67)
        expect(real).toBeCloseTo(nominal / 1.1) // -10%
    })

    it('Compared bying Power', () => {
        const principal = 10_000;
        // Person A
        const aReturns = new Returns(100, 365)
        const aInflation = new Inflation(200, 365)
        // Person B
        const bReturns = new Returns(0, 365)
        const bInflation = new Inflation(0, 365)
        

        const nominalA = calculateCompoundInterest(principal, aReturns.dailyReturnPercentageDecimal(), 365)
        const realA = nominalA / aInflation.inflationFactor(365)

        const nominalB = calculateCompoundInterest(principal, bReturns.dailyReturnPercentageDecimal(), 365)
        const realB = nominalB / bInflation.inflationFactor(365)

        expect(nominalA).toBeGreaterThan(nominalB)
        expect(realA).toBeLessThan(realB)
    })

    it('Test yearly investment', () => {
        const monthly = [
            '2000-01-01',
            '2000-02-01',
            '2000-03-01',
            '2000-04-01',
            '2000-05-01',
            '2000-06-01',
            '2000-07-01',
            '2000-08-01',
            '2000-09-01',
            '2000-10-01',
            '2000-11-01',
            '2000-12-01'
        ].map(day => ({
            date: new Date(day),
            invested: 10_000
        }))

        const returns = new Returns(700, 365) // 7%
        const inflation = new Inflation(300, 365) // 3%

        const result = simulate(monthly, returns, inflation)

        console.log(result.slice(0,5))
        const gainedFirstMonth = result.slice(0, 30).reduce((acc, day) => acc + day.dailyGain, 0)
        const expectedValue = 58.50;

        const diff = Math.abs(expectedValue - gainedFirstMonth) // Rounding errors
        expect(diff).toBeLessThan(1)
        
    })
});
