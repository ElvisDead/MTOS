// GLOBAL STATE
window.charts = {}
window.currentKin = null
window.kinUsers = {}

// IMPORT MODULES
import { drawChart } from "./charts.js"
import { getColor, getColorInferno } from "./colors.js"
import { drawHeatmap } from "./heatmap.js"
import { drawMatrix } from "./matrix.js"
import { drawLinearKinMap } from "./linearKinMap.js"
import { renderMap } from "./renderMap.js"
import { drawPhaseSpace } from "./phaseSpace.js"
import { exportExperiment } from "./exportExperiment.js"
import { drawKinMap } from "./kinmap.js"
import { drawGlobalKinMap } from "./globalKinMap.js"
import { kinFromTS, tsFromKin, kinToTS } from "./tzolkin.js"
import { MTOS_MAPS } from "./mapsConfig.js"
import { run } from "./run.js"
import { startMTOS } from "./pyodideLoader.js"


window.addEventListener("DOMContentLoaded", () => {
  startMTOS()
})

// EXPOSE TO GLOBAL SCOPE
window.drawChart = drawChart
window.getColor = getColor
window.getColorInferno = getColorInferno
window.drawHeatmap = drawHeatmap
window.drawLinearKinMap = drawLinearKinMap
window.renderMap = renderMap
window.drawPhaseSpace = drawPhaseSpace
window.exportExperiment = exportExperiment
window.drawGlobalKinMap = drawGlobalKinMap
window.kinFromTS = kinFromTS
window.tsFromKin = tsFromKin
window.kinToTS = kinToTS
window.MTOS_MAPS = MTOS_MAPS
window.run = run

document.addEventListener("click",(e)=>{
let p = document.getElementById("kin-popup")
if(!p) return
if(!p.contains(e.target) && !e.target.classList.contains("cell")){
p.remove()
}
})

const btn = document.getElementById("runBtn")
if (btn) {
  btn.addEventListener("click", run)
}

const exportBtn = document.getElementById("exportBtn")
if (exportBtn) {
  exportBtn.addEventListener("click", exportExperiment)
}
