// IMPORTS
import { drawGlobalKinMap } from "./globalKinMap.js"

// GLOBAL STATE
let pyodide = null

// ===============================
// INIT
// ===============================
export async function initMTOS(){

    const status = document.getElementById("status")
    status.innerText = "Loading Pyodide..."

    try{

        // LOAD PYODIDE
        pyodide = await loadPyodide()

        status.innerText = "Loading MTOS Engine..."

        // LOAD PYTHON ENGINE
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

    status.innerText = "Running..."

    try{

        // RUN CORE
        pyodide.runPython(`
run_mtos("${name}",${year},${month},${day})
`)

        // ===============================
        // GLOBAL KIN MAP
        // ===============================
        const kinCounts = JSON.parse(
            pyodide.runPython(`mtos_global_kin_map()`)
        )

        const usersByKin = JSON.parse(
            pyodide.runPython(`mtos_users_by_kin()`)
        )

        drawGlobalKinMap("globalKinMap", kinCounts, usersByKin)

        // ===============================
        // WEATHER MAP (260)
        // ===============================
        const weather = pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}",${year},${month},${day}))
`)

        drawWeatherMap(weather)

        status.innerText = "Done"

    }catch(e){

        console.error(e)
        status.innerText = "ERROR"
    }
}


// ===============================
// WEATHER MAP (ВСТРОЕННЫЙ, БЕЗ ОТДЕЛЬНОГО ФАЙЛА)
// ===============================
function drawWeatherMap(data){

    const container = document.getElementById("weatherMap")
    container.innerHTML = ""

    const weather = JSON.parse(data)

    container.style.display = "grid"
    container.style.gridTemplateColumns = "repeat(20, 14px)"
    container.style.gridGap = "2px"

    for(let i=0;i<260;i++){

        const cell = document.createElement("div")

        const val = weather[i].attention

        const r = Math.floor(255 * val)
        const b = Math.floor(255 * (1 - val))

        cell.style.width = "12px"
        cell.style.height = "12px"
        cell.style.background = `rgb(${r},0,${b})`

        container.appendChild(cell)
    }
}
