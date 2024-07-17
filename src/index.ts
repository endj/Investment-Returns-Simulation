import { ChartData, render } from "./canvas";
import { Graph } from "./graph";
import { GraphManager } from "./graphManager";
import { DataPoint } from "./model/dataPoint";
import { Inflation } from "./parameters/inflation";
import { Returns } from "./parameters/returns";
import { DailyPercentageReturnsSupplier, simulate } from "./simulation/simulation";


interface Investments {
  startingCapital: number,
  amount: number,
  period: number,
  type: "daily" | "monthly" | "yearly"
}
interface Rate {
  inflationRate: number;
  returnRate: number
  randomWalk: boolean
}

interface Range {
  start: Date,
  end: Date
}

interface SimulationArgs {
  investments: Investments
  rates: Rate,
  duration: Range
}

const runSimulation = (args: SimulationArgs) => {
  const { investments, rates, duration } = args


  const { start, end } = duration;
  const investmentDates: Array<DataPoint> = []
  const firstDay = new Date(duration.start)
  firstDay.setDate(firstDay.getDate() - 1)
  investmentDates.push({
    date: firstDay,
    invested: investments.startingCapital
  })
  investmentDates.push({
    date: new Date(duration.end),
    invested: 0
  })


  const { amount, period, type } = investments
  if (amount !== 0) {
    for (let date = start; date < end;) {
      investmentDates.push({
        date: new Date(date),
        invested: amount
      })
      switch (type) {
        case "daily":
          date.setDate(date.getDate() + period)
          break;
        case "monthly":
          date.setMonth(date.getMonth() + period)
          break;
        case "yearly":
          date.setFullYear(date.getFullYear() + period)
          break;
      }
    }
  }

  const inflation = new Inflation(rates.inflationRate * 100, 365)

  const fixedReturns = new Returns(rates.returnRate * 100, 365)
  const returns = rates.randomWalk 
  ? {
    get: () => {
      const volatility = (Math.random() - 0.5) / 8
      return volatility + fixedReturns.dailyReturnPercentageDecimal() / 365
    }
  }
  : fixedReturns

  const result = simulate(investmentDates, returns, inflation)

  const chartData: ChartData = {
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
          return (1-(dataPoint.nominalValue / dataPoint.cumulatedInvested)) * 100 * -1
        } ),
        colour: "black"
      }
    ]
  };
  render(chartData)
}




const button = document.getElementById("runSimulation")!
const yearlyReturns = document.getElementById("yearlyReturns") as HTMLInputElement
const inflationRate = document.getElementById("inflationRate") as HTMLInputElement
const randomWalk = document.getElementById("randomWalk") as HTMLInputElement
const startingCapital = document.getElementById("startingCapital") as HTMLInputElement
const period = document.getElementById("period") as HTMLInputElement
const periodType = document.getElementById("periodType") as HTMLSelectElement
const purchaseAmount = document.getElementById("purchaseAmount") as HTMLInputElement
const start = document.getElementById("start") as HTMLInputElement
const end = document.getElementById("end") as HTMLInputElement
const error = document.getElementById("errorMessage") as HTMLPreElement


start.valueAsDate = new Date()
const endDateDefault = new Date()
endDateDefault.setDate(endDateDefault.getDate() + 90)
end.valueAsDate = endDateDefault

button.onclick = () => {
  let errorMessage = ""

  const returns = parseFloat(yearlyReturns.value)
  if (Number.isNaN(returns)) {
    errorMessage += `
Invalid returns: ${returns}
    `
  }
  const inflation = parseFloat(inflationRate.value)
  if (Number.isNaN(inflation)) {
    errorMessage += `
Invalid inflation: ${inflation}
    `
  }

  const randomizeReturns = randomWalk.checked

  const capital = parseInt(startingCapital.value)
  if (Number.isNaN(inflation)) {
    errorMessage += `
Invalid capital: ${inflation}
    `
  }

  const purchasePeriod = parseInt(period.value);
  if (Number.isNaN(purchasePeriod) || purchasePeriod < 0) {
    errorMessage += `
Invalid purchase period: ${purchasePeriod}
    `
  }

  const periodDateType = periodType.value as "daily" | "monthly" | "yearly"
  const periodicPurchaseAmount = parseInt(purchaseAmount.value)
  if (Number.isNaN(periodicPurchaseAmount) || periodicPurchaseAmount < 0) {
    errorMessage += `
Invalid purchase amount: ${periodicPurchaseAmount} 
    `
  }

  const startDate = start.valueAsDate!
  const endDate = end.valueAsDate!

  if (startDate > endDate) {
    errorMessage += `
Invalid dates, can't end before start

start: ${startDate.toDateString()} 
end:   ${endDate.toDateString()}
    `
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
    })
  }
  error.hidden = !errorMessage
  error.textContent = errorMessage || ""
}

//render(chartData)