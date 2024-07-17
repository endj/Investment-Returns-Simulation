import { AggregatedDataPoints } from "./model/aggregatedDataPoint";

const graphCanvas = document.createElement("canvas") as HTMLCanvasElement
graphCanvas.width = window.innerWidth;
graphCanvas.height = window.innerHeight;
document.querySelector("body")!.appendChild(graphCanvas)
const ctx = graphCanvas.getContext("2d")!


const toolTipCanvas = document.createElement("canvas") as HTMLCanvasElement
toolTipCanvas.width = window.innerWidth;
toolTipCanvas.height = window.innerHeight;
toolTipCanvas.style.cssText = "position: fixed; left: 0"
document.querySelector("body")!.appendChild(toolTipCanvas)
const ctx2 = toolTipCanvas.getContext("2d")!


export interface DataSet {
    label: string,
    data: Array<number>
    colour: string
}
export interface ChartData {
    labels: Array<AggregatedDataPoints>,
    datasets: Array<DataSet>,
}
const normalize = (val: number, min: number, max: number, range: number) => {
    return ((val - min) / (max - min)) * range;
}

const height = (chartData: ChartData) => {
    let maxVal = 0;
    chartData.datasets.forEach(set => {
        set.data.forEach(val => {
            maxVal = Math.max(maxVal, val)
        })
    })
    return maxVal
}

const renderDataSet = (dataset: DataSet, renderMaxHeight: number, columnWidth: number) => {
    const datapoints = dataset.data.length
    ctx.fillStyle = dataset.colour
    for (let i = 0; i < datapoints; i++) {
        const val = dataset.data[i]
        const heightNormalize = normalize(val, 0, renderMaxHeight, graphCanvas.height)
        ctx?.fillRect((i * columnWidth), graphCanvas.height - heightNormalize, columnWidth, heightNormalize)
    }
}

export const render = (chartData: ChartData) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height)
    ctx.reset()
    ctx2.reset()

    const renderMaxHeight = height(chartData)

    const columnWidth = graphCanvas.width / chartData.datasets[0].data.length
    chartData.datasets.forEach(dataset => {
        if (!dataset.label.includes("Returns")) {
            renderDataSet(dataset, renderMaxHeight, columnWidth)
        }
    });


    document.addEventListener("mousemove", (e: MouseEvent) => {
        const { offsetX, offsetY } = e
        const index = Math.floor(offsetX / columnWidth)

        if (!chartData.labels.length) return;

        const values = chartData.datasets.map(set => {
            return `${set.label}: ${set.data[index].toFixed(2)}`
        })
        const firstDate = chartData.labels[0].dataPoint.date
        const today = new Date(firstDate)
        today.setDate(today.getDate() + index)
        values.push("Date: " + today.toDateString())

        ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height)

        chartData.datasets.forEach(set => {
            ctx2.font = "bold 35px serif";
            ctx2.fillStyle = "#f3f3f3"
            ctx2.strokeStyle = "black"
            ctx2.lineWidth = 1;


            values.forEach((text, i) => {
                const { actualBoundingBoxAscent, actualBoundingBoxDescent, width } = ctx2.measureText(text)
                const height = actualBoundingBoxAscent + actualBoundingBoxDescent;

                const textX = offsetX > ctx2.canvas.width / 2
                    ? offsetX - width / 2
                    : offsetX + width / 2
                const textY = offsetY > ctx2.canvas.height / 2
                    ? offsetY - ((height * i) + height)
                    : offsetY + (height * i) + height

                ctx2.fillText(text, textX - width / 2, textY, ctx2.canvas.width)
                ctx2.strokeText(text, textX - width / 2, textY, ctx2.canvas.width)
            })
        })

        // Draw vertical line at mouse pointer position
        ctx2.beginPath();
        ctx2.moveTo(offsetX, 0);  // Start at the top of the canvas
        ctx2.lineTo(offsetX, ctx2.canvas.height);  // Draw down to the bottom of the canvas
        ctx2.stroke();

        // Draw horizontal line from left to center
        ctx2.beginPath();
        ctx2.moveTo(0, offsetY);  // Start at the center of the canvas vertically
        ctx2.lineTo(ctx2.canvas.width, offsetY);  // Draw to the right edge of the canvas
        ctx2.stroke();
    })
}

