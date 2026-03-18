import { drawWeatherMap } from "./weatherMap.js"
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

        await pyodide.loadPackage("numpy")

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

    let weather = []
    let pressure = []
    let userKin = 1
    let todayKin = 1

    try{

        status.innerText = "Running..."

        // ===============================
        // USER KIN (GMT)
        // ===============================
        userKin = Number(pyodide.runPython(`
mtos_current_kin("${name}",${year},${month},${day})
`))

        // ===============================
        // TODAY KIN
        // ===============================
        const today = new Date()

        todayKin = Number(pyodide.runPython(`
mtos_current_kin("today", ${today.getFullYear()}, ${today.getMonth()+1}, ${today.getDate()})
`))

        // ===============================
        // WEATHER
        // ===============================
        weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}",${year},${month},${day}))
`))

        // ===============================
        // PRESSURE
        // ===============================
        pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))

        status.innerText = "Done"

    }catch(e){
        console.error(e)
        status.innerText = "ERROR (but UI continues)"
    }

    // ===============================
    // ВСЕГДА РЕНДЕРИМ
    // ===============================
    drawWeatherMap("weatherMap", weather, userKin, todayKin, pressure)

    // ===============================
    // TIME MOTION (НЕ В TRY!)
    // ===============================
    let baseYear = year
    let baseMonth = month
    let baseDay = day

    function step(dayOffset){

        try{

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

        }catch(e){
            console.error("STEP ERROR:", e)
        }
    }

    // ===============================
    // ВСЕГДА СОЗДАЁМ КНОПКИ
    // ===============================
    initTimeControls(step)
}
