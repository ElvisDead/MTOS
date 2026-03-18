import { drawWeatherMap } from "./weatherMap.js"
import { drawNetwork } from "./network.js"
import { initTimeControls } from "./timeController.js"

let pyodide = null
let fieldState = null
let fieldMode = null
let users = []
let selectedAgent = null

// ===============================
// INIT
// ===============================
export async function initMTOS(){

    const status = document.getElementById("status")

    pyodide = await loadPyodide()
    await pyodide.loadPackage("numpy")

    const code = await fetch("./MTOS_Engine.py").then(r => r.text())
    pyodide.runPython(code)

    status.innerText = "Ready"
}

// ===============================
// RUN
// ===============================
export async function runMTOS(){

    const name  = document.getElementById("name").value
    const year  = +document.getElementById("year").value
    const month = +document.getElementById("month").value
    const day   = +document.getElementById("day").value

    // ===============================
    // CORE DATA
    // ===============================
    const result = JSON.parse(pyodide.runPython(`
import json

weather = mtos_260_weather("${name}",${year},${month},${day})
kin = mtos_current_kin("${name}",${year},${month},${day})

pressure = mtos_pressure_map()

# ДОП МЕТРИКИ (ВАЖНО)
attention = sum([w["attention"] for w in weather]) / 260
noise = sum([abs(w["attention"]-0.5) for w in weather]) / 260
lyapunov = noise * 2.5
prediction = attention * (1 - noise)

json.dumps({
 "weather": weather,
 "pressure": pressure,
 "kin": kin,
 "attention": attention,
 "noise": noise,
 "lyapunov": lyapunov,
 "prediction": prediction
})
`))

    const weather = result.weather
    const pressure = result.pressure

    const userKin = result.kin
    const today = new Date()

    const todayKin = Number(pyodide.runPython(`
mtos_current_kin("today",${today.getFullYear()},${today.getMonth()+1},${today.getDate()})
`))

    // ===============================
    // USERS (ТОЛЬКО РЕАЛЬНЫЙ!)
    // ===============================
    users = [{
        name: name,
        weight: 1
    }]

    users = users.map(u=>{

        const kin = Number(pyodide.runPython(`
mtos_current_kin("${u.name}",${year},${month},${day})
`))

        const phase = (kin % 20) * Math.PI / 10

        return {...u, kin, phase}
    })

    // ===============================
    // FIELD
    // ===============================
    const fieldResult = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(users,${year},${month},${day})
json.dumps([f,s,u])
`))

    fieldState = fieldResult[0]
    fieldMode  = fieldResult[1]
    users      = fieldResult[2]

    window.currentUsers = users

    // ===============================
    // ВЫВОД (КЛЮЧ)
    // ===============================
    renderStats(
        userKin,
        todayKin,
        result.attention,
        result.noise,
        result.lyapunov,
        result.prediction
    )

    drawWeatherMap(
        "weatherMap",
        weather,
        userKin,
        todayKin,
        pressure,
        fieldState,
        selectedAgent
    )

    drawNetwork("networkMap", users, (agent)=>{
        selectedAgent = agent
    })
}

// ===============================
// STATS UI
// ===============================
function renderStats(kin, todayKin, attention, noise, lyapunov, prediction){

    const box = document.getElementById("stats")

    box.innerHTML = `
    <div>Today Kin: ${todayKin}</div>
    <div>Your Kin: ${kin}</div>
    <div>Attention: ${attention.toFixed(3)}</div>
    <div>Noise: ${noise.toFixed(3)}</div>
    <div>Lyapunov: ${lyapunov.toFixed(3)}</div>
    <div>Prediction: ${prediction.toFixed(3)}</div>
    `
}
