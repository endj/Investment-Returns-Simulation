(function () {
    'use strict';

    const graphCanvas = document.createElement("canvas");
    graphCanvas.width = window.innerWidth;
    graphCanvas.height = window.innerHeight;
    document.querySelector("body").appendChild(graphCanvas);
    const ctx = graphCanvas.getContext("2d");
    const toolTipCanvas = document.createElement("canvas");
    toolTipCanvas.width = window.innerWidth;
    toolTipCanvas.height = window.innerHeight;
    toolTipCanvas.style.cssText = "position: fixed; left: 0";
    document.querySelector("body").appendChild(toolTipCanvas);
    const ctx2 = toolTipCanvas.getContext("2d");
    const normalize = (val, min, max, range) => {
        return ((val - min) / (max - min)) * range;
    };
    const height = (chartData) => {
        let maxVal = 0;
        chartData.datasets.forEach(set => {
            set.data.forEach(val => {
                maxVal = Math.max(maxVal, val);
            });
        });
        return maxVal;
    };
    const renderDataSet = (dataset, renderMaxHeight, columnWidth) => {
        const datapoints = dataset.data.length;
        ctx.fillStyle = dataset.colour;
        for (let i = 0; i < datapoints; i++) {
            const val = dataset.data[i];
            const heightNormalize = normalize(val, 0, renderMaxHeight, graphCanvas.height);
            ctx === null || ctx === void 0 ? void 0 : ctx.fillRect((i * columnWidth), graphCanvas.height - heightNormalize, columnWidth, heightNormalize);
        }
    };
    const render = (chartData) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);
        ctx.reset();
        ctx2.reset();
        const renderMaxHeight = height(chartData);
        const columnWidth = graphCanvas.width / chartData.datasets[0].data.length;
        chartData.datasets.forEach(dataset => {
            if (!dataset.label.includes("Returns")) {
                renderDataSet(dataset, renderMaxHeight, columnWidth);
            }
        });
        document.addEventListener("mousemove", (e) => {
            const { offsetX, offsetY } = e;
            const index = Math.floor(offsetX / columnWidth);
            if (!chartData.labels.length)
                return;
            const values = chartData.datasets.map(set => {
                return `${set.label}: ${set.data[index].toFixed(2)}`;
            });
            const firstDate = chartData.labels[0].dataPoint.date;
            const today = new Date(firstDate);
            today.setDate(today.getDate() + index);
            values.push("Date: " + today.toDateString());
            ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);
            chartData.datasets.forEach(set => {
                ctx2.font = "bold 35px serif";
                ctx2.fillStyle = "#f3f3f3";
                ctx2.strokeStyle = "black";
                ctx2.lineWidth = 1;
                values.forEach((text, i) => {
                    const { actualBoundingBoxAscent, actualBoundingBoxDescent, width } = ctx2.measureText(text);
                    const height = actualBoundingBoxAscent + actualBoundingBoxDescent;
                    const textX = offsetX > ctx2.canvas.width / 2
                        ? offsetX - width / 2
                        : offsetX + width / 2;
                    const textY = offsetY > ctx2.canvas.height / 2
                        ? offsetY - ((height * i) + height)
                        : offsetY + (height * i) + height;
                    ctx2.fillText(text, textX - width / 2, textY, ctx2.canvas.width);
                    ctx2.strokeText(text, textX - width / 2, textY, ctx2.canvas.width);
                });
            });
            // Draw vertical line at mouse pointer position
            ctx2.beginPath();
            ctx2.moveTo(offsetX, 0); // Start at the top of the canvas
            ctx2.lineTo(offsetX, ctx2.canvas.height); // Draw down to the bottom of the canvas
            ctx2.stroke();
            // Draw horizontal line from left to center
            ctx2.beginPath();
            ctx2.moveTo(0, offsetY); // Start at the center of the canvas vertically
            ctx2.lineTo(ctx2.canvas.width, offsetY); // Draw to the right edge of the canvas
            ctx2.stroke();
        });
    };

    class Inflation {
        constructor(bps, days) {
            if (days <= 0) {
                throw new Error('Invalid argument: days must be greater than zero');
            }
            if (bps === 0) {
                this.yearlyRate = 0;
            }
            else {
                this.yearlyRate = (bps / 10000) * (365 / days);
            }
        }
        realValue(principal, days) {
            return principal / this.inflationFactor(days);
        }
        // Calculate inflation factor over a given number of days
        inflationFactor(days) {
            return Math.pow(1 + this.yearlyRate, days / 365);
        }
        // Calculate inflation-adjusted amount based on principal and number of days
        inflationAdjust(principal, days) {
            return principal * this.inflationFactor(days);
        }
        // Get yearly inflation rate in percentage
        yearlyInflationPercentage() {
            return this.yearlyRate * 100;
        }
        // Get daily inflation rate in percentage
        dailyInflationPercentage() {
            return this.yearlyRate / 365 * 100;
        }
    }

    class Returns {
        constructor(returnsBPS, days) {
            if (returnsBPS === 0) {
                this.dailyBPS = 0;
                this.yearlyBPS = 0;
            }
            else {
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
            return this.dailyBPS * 0.01;
        }
        yearlyReturnPercentage() {
            return this.yearlyBPS * 0.01;
        }
        dailyReturnPercentageDecimal() {
            return this.dailyReturnPercentage() / 100;
        }
        yearlyReturnPercentageDecimal() {
            return this.yearlyReturnPercentage() / 100;
        }
        get() {
            return this.dailyReturnPercentageDecimal();
        }
    }

    const datesBetween = (startDate, endDate) => {
        if (startDate === endDate)
            return [startDate];
        const currentDate = new Date(startDate);
        const dates = [];
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const getSimulationSpan = (start, end) => {
        const simulatedDays = datesBetween(start, end)
            .map(date => ({
            dataPoint: {
                date: date,
                invested: 0
            },
            dailyGain: 0,
            cumulatedInvested: 0,
            nominalValue: 0,
            realValue: 0
        }));
        return simulatedDays;
    };
    const simulate = (dataPoints, returnsSupplier, inflation) => {
        console.table(dataPoints);
        console.log(returnsSupplier);
        console.log(inflation);
        if (!(dataPoints === null || dataPoints === void 0 ? void 0 : dataPoints.length))
            return [];
        dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
        const startDate = dataPoints[0];
        const endDate = dataPoints[dataPoints.length - 1];
        const investementDays = dataPoints.reduce((acc, point) => {
            acc.set(point.date.toDateString(), point);
            return acc;
        }, new Map);
        const simulationDays = getSimulationSpan(startDate.date, endDate.date);
        let cumulatedInvested = 0;
        let cumulatedValue = 0;
        for (let i = 0; i < simulationDays.length; i++) {
            const day = simulationDays[i];
            // If we invested this day, add ammount
            const invested = investementDays.get(day.dataPoint.date.toDateString());
            if (invested === null || invested === void 0 ? void 0 : invested.invested) {
                day.dataPoint.invested = invested === null || invested === void 0 ? void 0 : invested.invested;
                cumulatedInvested += invested.invested;
                cumulatedValue += invested.invested;
            }
            // Nominal Increase
            const dailyGain = cumulatedValue * returnsSupplier.get();
            cumulatedValue = cumulatedValue + dailyGain;
            // Nominal Value
            day.dailyGain = dailyGain;
            day.nominalValue = cumulatedValue;
            day.cumulatedInvested = cumulatedInvested;
            // Real Value
            day.realValue = day.nominalValue / inflation.inflationFactor(i + 1);
        }
        return simulationDays;
    };

    const runSimulation = (args) => {
        const { investments, rates, duration } = args;
        const { start, end } = duration;
        const investmentDates = [];
        const firstDay = new Date(duration.start);
        firstDay.setDate(firstDay.getDate() - 1);
        investmentDates.push({
            date: firstDay,
            invested: investments.startingCapital
        });
        investmentDates.push({
            date: new Date(duration.end),
            invested: 0
        });
        const { amount, period, type } = investments;
        if (amount !== 0) {
            for (let date = start; date < end;) {
                investmentDates.push({
                    date: new Date(date),
                    invested: amount
                });
                switch (type) {
                    case "daily":
                        date.setDate(date.getDate() + period);
                        break;
                    case "monthly":
                        date.setMonth(date.getMonth() + period);
                        break;
                    case "yearly":
                        date.setFullYear(date.getFullYear() + period);
                        break;
                }
            }
        }
        const inflation = new Inflation(rates.inflationRate * 100, 365);
        const fixedReturns = new Returns(rates.returnRate * 100, 365);
        const returns = rates.randomWalk
            ? {
                get: () => {
                    const volatility = (Math.random() - 0.5) / 8;
                    return volatility + fixedReturns.dailyReturnPercentageDecimal() / 365;
                }
            }
            : fixedReturns;
        const result = simulate(investmentDates, returns, inflation);
        const chartData = {
            labels: result.filter(a => a.dataPoint.invested),
            datasets: [
                {
                    label: 'Nominal Value',
                    data: result.map(dataPoint => dataPoint.nominalValue),
                    colour: "rgba(255, 0, 0, 1)"
                },
                {
                    label: 'Real Value',
                    data: result.map(dataPoint => dataPoint.realValue),
                    colour: "rgba(0, 255, 0, 1)"
                },
                {
                    label: 'Invested Value',
                    data: result.map(dataPoint => dataPoint.cumulatedInvested),
                    colour: "rgba(0, 0, 0, 0.2)"
                },
                {
                    label: 'Returns %',
                    data: result.map(dataPoint => {
                        return (1 - (dataPoint.nominalValue / dataPoint.cumulatedInvested)) * 100 * -1;
                    }),
                    colour: "black"
                }
            ]
        };
        render(chartData);
    };
    const button = document.getElementById("runSimulation");
    const yearlyReturns = document.getElementById("yearlyReturns");
    const inflationRate = document.getElementById("inflationRate");
    const randomWalk = document.getElementById("randomWalk");
    const startingCapital = document.getElementById("startingCapital");
    const period = document.getElementById("period");
    const periodType = document.getElementById("periodType");
    const purchaseAmount = document.getElementById("purchaseAmount");
    const start = document.getElementById("start");
    const end = document.getElementById("end");
    const error = document.getElementById("errorMessage");
    start.valueAsDate = new Date();
    const endDateDefault = new Date();
    endDateDefault.setDate(endDateDefault.getDate() + 90);
    end.valueAsDate = endDateDefault;
    button.onclick = () => {
        let errorMessage = "";
        const returns = parseFloat(yearlyReturns.value);
        if (Number.isNaN(returns)) {
            errorMessage += `
Invalid returns: ${returns}
    `;
        }
        const inflation = parseFloat(inflationRate.value);
        if (Number.isNaN(inflation)) {
            errorMessage += `
Invalid inflation: ${inflation}
    `;
        }
        const randomizeReturns = randomWalk.checked;
        const capital = parseInt(startingCapital.value);
        if (Number.isNaN(inflation)) {
            errorMessage += `
Invalid capital: ${inflation}
    `;
        }
        const purchasePeriod = parseInt(period.value);
        if (Number.isNaN(purchasePeriod) || purchasePeriod < 0) {
            errorMessage += `
Invalid purchase period: ${purchasePeriod}
    `;
        }
        const periodDateType = periodType.value;
        const periodicPurchaseAmount = parseInt(purchaseAmount.value);
        if (Number.isNaN(periodicPurchaseAmount) || periodicPurchaseAmount < 0) {
            errorMessage += `
Invalid purchase amount: ${periodicPurchaseAmount} 
    `;
        }
        const startDate = start.valueAsDate;
        const endDate = end.valueAsDate;
        if (startDate > endDate) {
            errorMessage += `
Invalid dates, can't end before start

start: ${startDate.toDateString()} 
end:   ${endDate.toDateString()}
    `;
        }
        if (!errorMessage) {
            runSimulation({
                duration: {
                    start: startDate,
                    end: endDate
                },
                investments: {
                    startingCapital: capital,
                    amount: periodicPurchaseAmount,
                    period: purchasePeriod,
                    type: periodDateType
                },
                rates: {
                    inflationRate: inflation,
                    returnRate: returns,
                    randomWalk: randomizeReturns
                }
            });
        }
        error.hidden = !errorMessage;
        error.textContent = errorMessage || "";
    };
    //render(chartData)

})();
//# sourceMappingURL=bundle.js.map
