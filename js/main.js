// ===============================
// IMPORTS
// ===============================
import { drawWeatherMap } from "./weatherMap.js"
import { drawGlobalKinMap } from "./globalKinMap.js"

// ===============================
// GLOBAL STATE
// ===============================
let pyodide = null

// ===============================
// INIT
// ===============================
export async function initMTOS(){

    const status = document.getElementById("status")
    status.innerText = "Loading Pyodide..."

    try{

        // 1. LOAD PYODIDE (ПРАВИЛЬНО)
        pyodide = await loadPyodide()

        status.innerText = "Loading NumPy..."

        // 2. LOAD NUMPY (ОБЯЗАТЕЛЬНО)
        await pyodide.loadPackage("numpy")

        status.innerText = "Loading MTOS Engine..."

        // 3. LOAD PYTHON ENGINE
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

    if(!name || !year || !month || !day){
        status.innerText = "Fill all fields"
        return
    }

    status.innerText = "Running..."

    try{

        // ===============================
        // RUN CORE
        // ===============================
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
        const weather = JSON.parse(
            pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}",${year},${month},${day}))
`)
        )

        drawWeatherMap("weatherMap", weather)

        status.innerText = "Done"

    }catch(e){

        console.error(e)
        status.innerText = "ERROR"
    }
}
