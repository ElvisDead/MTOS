import { drawWeatherMap } from "./weatherMap.js"
import { initTimeControls } from "./timeController.js"

let pyodide = null

let fieldState = null
let fieldMode = null

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
        // USER + TODAY KIN
        // ===============================
        userKin = Number(pyodide.runPython(`
mtos_current_kin("${name}",${year},${month},${day})
`))

        const today = new Date()

        todayKin = Number(pyodide.runPython(`
mtos_current_kin("today", ${today.getFullYear()}, ${today.getMonth()+1}, ${today.getDate()})
`))

        // ===============================
        // WEATHER + PRESSURE (для визуала)
        // ===============================
        weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}",${year},${month},${day}))
`))

        pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))

        // ===============================
        // MULTI-AGENT FIELD INIT
        // ===============================
        const users = [
            {name: name},
            {name: "Alice"},
            {name: "Bob"}
        ]

        const result = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s = mtos_multi_agents_field(users, ${year}, ${month}, ${day})
json.dumps([f,s])
`))

        fieldState = result[0]
        fieldMode = result[1]

        status.innerText = "Done"

    }catch(e){
        console.error(e)
        status.innerText = "ERROR"
    }

    // ===============================
    // RENDER
    // ===============================
    drawWeatherMap(
        "weatherMap",
        weather,
        userKin,
        todayKin,
        pressure,
        fieldState
    )

    // ===============================
    // TIME EVOLUTION
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

            const users = [
                {name: name},
                {name: "Alice"},
                {name: "Bob"}
            ]

            const result = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s = mtos_multi_agents_field(
    users,
    ${y},
    ${m},
    ${dd},
    ${JSON.stringify(fieldState)},
    ${JSON.stringify(fieldMode)}
)
json.dumps([f,s])
`))

            fieldState = result[0]
            fieldMode = result[1]

            drawWeatherMap(
                "weatherMap",
                weather,
                userKin,
                kin,
                pressure,
                fieldState
            )

        }catch(e){
            console.error("STEP ERROR:", e)
        }
    }

    // ===============================
    // CONTROLS (PLAY / STEP)
    // ===============================
    initTimeControls(step)
}
