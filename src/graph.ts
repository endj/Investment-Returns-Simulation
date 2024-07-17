import { AggregatedDataPoints } from "./model/aggregatedDataPoint";

export class Graph {
    readonly dataPoints: Array<AggregatedDataPoints> = []
    constructor(datapoints: Array<AggregatedDataPoints>) {
        this.dataPoints = datapoints;
    }
}