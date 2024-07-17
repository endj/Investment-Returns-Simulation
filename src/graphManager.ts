import { Graph } from "./graph";

export class GraphManager {
    readonly graphs = new Map<string, Graph>();
    constructor() {}

    public registerGraph(id: string, graph: Graph) {
        if(!id) throw new Error("id null");
        if(!graph) throw new Error("graph null");
        this.graphs.set(id, graph);
    }

    public getGraph(id: string) {
        return this.graphs.get(id);
        }
}