import { drawWeatherMap } from "./weatherMap.js"
import { drawNetwork } from "./network.js"
import { initTimeControls } from "./timeController.js"

let pyodide = null

let fieldState = null
let fieldMode = null
let users = []

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

    const name  = document.getElementById("name").value
    const year  = parseInt(document.getElementById("year").value)
    const month = parseInt(document.getElementById("month").value)
    const day   = parseInt(document.getElementById("day").value)

    let weather = []
    let pressure = []
    let userKin = 1
    let todayKin = 1

    try{

        status.innerText = "Running..."

        // ===============================
        // USER KIN
        // ===============================
        userKin = Number(pyodide.runPython(`
mtos_current_kin("${name}", ${year}, ${month}, ${day})
`))

        // ===============================
        // TODAY KIN
        // ===============================
        const now = new Date()

        todayKin = Number(pyodide.runPython(`
mtos_current_kin("today", ${now.getFullYear()}, ${now.getMonth()+1}, ${now.getDate()})
`))

        // ===============================
        // WEATHER / PRESSURE
        // ===============================
        weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}", ${year}, ${month}, ${day}))
`))

        pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))

        // ===============================
        // АГЕНТЫ (СТАРТ)
        // ===============================
        users = [
            {name: name, weight: 1.0},
            {name: "Alice", weight: 0.8},
            {name: "Bob", weight: 0.6}
        ]

        // ===============================
        // ПОЛЕ (INIT)
        // ===============================
        const result = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(users, ${year}, ${month}, ${day})
json.dumps([f,s,u])
`))

        fieldState = result[0]
        fieldMode  = result[1]
        users      = result[2]

        status.innerText = "Done"

    }catch(e){
        console.error(e)
        status.innerText = "ERROR"
    }

    // ===============================
    // РЕНДЕР (ПЕРВЫЙ)
    // ===============================
    renderAll(weather, pressure, userKin, todayKin)

    // ===============================
    // TIME EVOLUTION
    // ===============================
    let baseYear = year
    let baseMonth = month
    let baseDay = day

    function step(offset){

        try{

            const d = new Date(baseYear, baseMonth - 1, baseDay)
            d.setDate(d.getDate() + offset)

            const y = d.getFullYear()
            const m = d.getMonth() + 1
            const dd = d.getDate()

            const weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}", ${y}, ${m}, ${dd}))
`))

            const kin = Number(pyodide.runPython(`
mtos_current_kin("${name}", ${y}, ${m}, ${dd})
`))

            const pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))

            const result = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(
    users,
    ${y},
    ${m},
    ${dd},
    ${JSON.stringify(fieldState)},
    ${JSON.stringify(fieldMode)}
)
json.dumps([f,s,u])
`))

            fieldState = result[0]
            fieldMode  = result[1]
            users      = result[2]

            renderAll(weather, pressure, userKin, kin)

        }catch(e){
            console.error("STEP ERROR:", e)
        }
    }

    // ===============================
    // CONTROLS
    // ===============================
    initTimeControls(step)
}

// ===============================
// RENDER ALL
// ===============================
function renderAll(weather, pressure, userKin, currentKin){

    // WEATHER MAP
    drawWeatherMap(
        "weatherMap",
        weather,
        userKin,
        currentKin,
        pressure,
        fieldState
    )

    // NETWORK
    drawNetwork("networkMap", users)
}
