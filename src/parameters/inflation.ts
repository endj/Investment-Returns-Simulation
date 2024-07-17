export class Inflation {
    readonly yearlyRate: number;

    constructor(bps: number, days: number) {
        if (days <= 0) {
            throw new Error('Invalid argument: days must be greater than zero');
        }

        if (bps === 0) {
            this.yearlyRate = 0;
        } else {
            this.yearlyRate = (bps / 10000) * (365 / days);
        }
    }


    realValue(principal: number, days: number): number {
        return principal / this.inflationFactor(days);
    }
    // Calculate inflation factor over a given number of days
    inflationFactor(days: number): number {
        return Math.pow(1 + this.yearlyRate, days / 365);
    }

    // Calculate inflation-adjusted amount based on principal and number of days
    inflationAdjust(principal: number, days: number): number {
        return principal * this.inflationFactor(days);
    }

    // Get yearly inflation rate in percentage
    yearlyInflationPercentage(): number {
        return this.yearlyRate * 100;
    }

    // Get daily inflation rate in percentage
    dailyInflationPercentage(): number {
        return this.yearlyRate / 365 * 100;
    }
}
