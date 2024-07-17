import { DailyPercentageReturnsSupplier } from "../simulation/simulation";

export class Returns implements DailyPercentageReturnsSupplier {
    readonly yearlyBPS: number;
    readonly dailyBPS: number;
    constructor(returnsBPS: number, days: number) {
        if(returnsBPS === 0) {
            this.dailyBPS = 0;
            this.yearlyBPS = 0;
        } else {
            this.yearlyBPS = (returnsBPS / days) * 365;
            this.dailyBPS = returnsBPS / days;
        }
    }
    dailyReturnBPS() {
        return this.dailyBPS;
    }
    yearlyReturnBPS() {
        return this.yearlyBPS;
    }

    dailyReturnPercentage() {
        return this.dailyBPS * 0.01
    }

    yearlyReturnPercentage() {
        return this.yearlyBPS * 0.01
    }

    dailyReturnPercentageDecimal() {
        return this.dailyReturnPercentage() / 100
    }
    yearlyReturnPercentageDecimal() {
        return this.yearlyReturnPercentage() / 100
    }

   get() {
    return this.dailyReturnPercentageDecimal();
   }
}