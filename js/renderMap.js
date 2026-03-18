import { drawHeatmap } from "./heatmap.js"

export function renderMap(id, cols=20, rows=13){
console.log("DRAW MAP:", id)

if(!MTOS_MAPS[id]) return

let data = MTOS_MAPS[id]()

drawHeatmap(id,data,cols,rows)

}
