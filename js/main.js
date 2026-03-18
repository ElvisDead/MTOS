import { drawWeatherMap } from "./weatherMap.js"
import { drawGlobalKinMap } from "./globalKinMap.js"
import { drawPressureMap } from "./pressureMap.js"
import { drawPressureGradientMap } from "./pressureGradientMap.js"
import { drawAttractorMap } from "./attractorMap.js"
import { drawPhaseMap } from "./phaseMap.js"
import { drawWaveMap } from "./waveMap.js"
import { drawClimateAtlas } from "./climateAtlasMap.js"

import { drawSeries7 } from "./series7.js"
import { drawSeries30 } from "./series30.js"
import { drawSeries260 } from "./series260.js"

import { drawPhaseSpace } from "./phaseSpace.js"
import { drawNetwork } from "./networkMap.js"
import { drawCollective } from "./collectiveMap.js"
import { drawKinActivity } from "./kinActivityMap.js"

import { initTimeControls } from "./timeController.js"

let pyodide = null

// ===============================
// INIT
// ===============================
export async function initMTOS(){

    const status = document.getElementById("status")

    try{
        status.innerText = "Loading Pyodide..."
        pyodide = await loadPyodide()

        status.innerText = "Loading numpy..."
        await pyodide.loadPackage("numpy")

        status.innerText = "Loading MTOS Engine..."
        const code = await fetch("./MTOS_Engine.py").then(r => r.text())
        pyodide.runPython(code)

        status.innerText = "Ready"

    }catch(e){
        console.error(e)
        status.innerText = "INIT ERROR"
    }
}

// ===============================
// RUN
// ===============================
export async function runMTOS(){

    const status = document.getElementById("status")

    const name = document.getElementById("name").value
    const year = parseInt(document.getElementById("year").value)
    const month = parseInt(document.getElementById("month").value)
    const day = parseInt(document.getElementById("day").value)

    try{

        status.innerText = "Running..."

        // ===============================
        // USER KIN (GMT)
        // ===============================
        const userKin = Number(pyodide.runPython(`
mtos_current_kin("${name}",${year},${month},${day})
`))

        // ===============================
        // TODAY KIN (GMT)
        // ===============================
        const today = new Date()

        const todayKin = Number(pyodide.runPython(`
mtos_current_kin("today", ${today.getFullYear()}, ${today.getMonth()+1}, ${today.getDate()})
`))

        // ===============================
        // WEATHER
        // ===============================
        const weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}",${year},${month},${day}))
`))

        // ===============================
        // PRESSURE
        // ===============================
        const pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))
        const pressureGrad = JSON.parse(pyodide.runPython(`mtos_pressure_gradient()`))

        // ===============================
        // GLOBAL
        // ===============================
        const kinCounts = JSON.parse(pyodide.runPython(`mtos_global_kin_map()`))
        const usersByKin = JSON.parse(pyodide.runPython(`mtos_users_by_kin()`))

        // ===============================
        // OTHER MAPS
        // ===============================
        const attractor = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_phase_density("${name}",${year},${month},${day}))
`))

        const phaseMatrix = JSON.parse(pyodide.runPython(`mtos_phase_matrix()`))
        const wave = JSON.parse(pyodide.runPython(`mtos_wave_structure()`))
        const climate = JSON.parse(pyodide.runPython(`mtos_climate_atlas()`))

        const activity = JSON.parse(pyodide.runPython(`mtos_kin_activity()`))
        const network = JSON.parse(pyodide.runPython(`mtos_user_network()`))
        const collective = pyodide.runPython(`mtos_collective()`)

        // ===============================
        // SERIES
        // ===============================
        const series30 = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_series("${name}",${year},${month},${day},30))
`))

        const series7 = series30.slice(0,7)

        const series260 = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_series("${name}",${year},${month},${day},260))
`))

        // ===============================
        // RENDER
        // ===============================
        drawWeatherMap("weatherMap", weather, userKin, todayKin, pressure)

        drawGlobalKinMap("globalKinMap", kinCounts, usersByKin)
        drawPressureMap("pressureMap", pressure)
        drawPressureGradientMap("pressureGradientMap", pressureGrad)

        drawAttractorMap("attractorMap", attractor)
        drawPhaseMap("phaseMap", phaseMatrix)
        drawWaveMap("waveMap", wave)
        drawClimateAtlas("climateMap", climate)

        drawSeries7("series7", series7)
        drawSeries30("series30", series30)
        drawSeries260("series260", series260)

        drawNetwork("networkMap", network)
        drawCollective("collectiveMap", collective)
        drawKinActivity("activityMap", activity)

        status.innerText = "Done"

        // ===============================
        // TIME MOTION
        // ===============================
        let baseYear = year
        let baseMonth = month
        let baseDay = day

        function step(dayOffset){

            const d = new Date(baseYear, baseMonth-1, baseDay)
            d.setDate(d.getDate() + dayOffset)

            const y = d.getFullYear()
            const m = d.getMonth()+1
            const dd = d.getDate()

            const weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}",${y},${m},${dd}))
`))

            const kin = Number(pyodide.runPython(`
mtos_current_kin("${name}",${y},${m},${dd})
`))

            const pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))

            drawWeatherMap("weatherMap", weather, userKin, kin, pressure)
        }

        initTimeControls(step)

    }catch(e){
        console.error(e)
        status.innerText = "ERROR"
    }
}
