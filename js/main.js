import { drawWeatherMap } from "./weatherMap.js"
import { drawNetwork } from "./network.js"
import { drawSeries } from "./series260.js"
import { drawPhaseSpace } from "./phaseSpace.js"
import { drawAttractor } from "./attractor.js"
import { drawCollective } from "./collective.js"
import { drawActivity } from "./activity.js"
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
// USER MEMORY
// ===============================
function loadUsers(){

    try{
        const saved = localStorage.getItem("mtos_users")

        if(!saved) return []

        const parsed = JSON.parse(saved)

        // защита
        if(Array.isArray(parsed)){
            return parsed
        }else{
            return []
        }

    }catch(e){
        return []
    }
}
function saveUsers(list){
    localStorage.setItem("mtos_users", JSON.stringify(list))
}

function addUser(list, name){

    // страховка
    if(!Array.isArray(list)){
        list = []
    }

    if(name && !list.includes(name)){
        list.push(name)
    }

    return list
}

// ===============================
// RUN
// ===============================
export async function runMTOS(){

    const status = document.getElementById("status")

    const name  = document.getElementById("name").value.trim()
    const year  = +document.getElementById("year").value
    const month = +document.getElementById("month").value
    const day   = +document.getElementById("day").value

    try{

        status.innerText = "Running..."

        // ===============================
        // USERS MEMORY
        // ===============================
        let userList = loadUsers()
        userList = addUser(userList, name)
        saveUsers(userList)

        // ===============================
        // PYTHON CORE
        // ===============================
        const result = JSON.parse(pyodide.runPython(`
import json

weather = mtos_260_weather(${JSON.stringify(name)},${year},${month},${day})
kin = mtos_current_kin(${JSON.stringify(name)},${year},${month},${day})
pressure = mtos_pressure_map()

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
 "prediction": prediction,
 "predictability": predictability([w["attention"] for w in weather])
})
`))

        const weather = result.weather
        const pressure = result.pressure
        const userKin = result.kin

        // ===============================
        // TODAY
        // ===============================
        const now = new Date()

        const todayKin = Number(pyodide.runPython(`
mtos_current_kin("today",${now.getFullYear()},${now.getMonth()+1},${now.getDate()})
`))

        // ===============================
        // BUILD USERS
        // ===============================
        users = userList.map(uName=>{

            const kin = Number(pyodide.runPython(`
mtos_current_kin("${uName}",${year},${month},${day})
`))

            const phase = (kin % 20) * Math.PI / 10

            return {
                name: uName,
                kin,
                phase,
                weight: 1
            }
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
        // UI STATE
        // ===============================
        renderCognitiveState(
            currentKin,
            todayKin,
            result.attention,
            result.noise,
            result.lyapunov,
            result.prediction,
            result.predictability
        )

        // ===============================
        // RENDER ВСЕГО
        // ===============================
        renderAll(weather, pressure, userKin, todayKin)

        status.innerText = "Done"

        // ===============================
        // TIME CONTROL
        // ===============================
        let baseYear = year
        let baseMonth = month
        let baseDay = day

        function step(offset){

            const d = new Date(baseYear, baseMonth-1, baseDay)
            d.setDate(d.getDate() + offset)

            const y = d.getFullYear()
            const m = d.getMonth()+1
            const dd = d.getDate()

            const result = JSON.parse(pyodide.runPython(`
import json

weather = mtos_260_weather(${JSON.stringify(name)},${y},${m},${dd})
kin = mtos_current_kin(${JSON.stringify(name)},${y},${m},${dd})
pressure = mtos_pressure_map()

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
 "prediction": prediction,
 "predictability": predictability([w["attention"] for w in weather])
})
`))

            const weather = result.weather
            const pressure = result.pressure
            const currentKin = result.kin

            users = users.map(u=>{

                const kin = Number(pyodide.runPython(`
mtos_current_kin("${u.name}",${y},${m},${dd})
`))

                const phase = (kin % 20) * Math.PI / 10

                return {...u, kin, phase}
            })

            const fieldResult = JSON.parse(pyodide.runPython(`
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

            fieldState = fieldResult[0]
            fieldMode  = fieldResult[1]
            users      = fieldResult[2]

            window.currentUsers = users

            renderCognitiveState(
                userKin,
                todayKin,
                result.attention,
                result.noise,
                result.lyapunov,
                result.prediction,
                result.predictability
            )

            renderAll(weather, pressure, currentKin, todayKin)
        }

        initTimeControls(step)

    }catch(e){
        console.error(e)
        status.innerText = "ERROR"
    }
}

// ===============================
// RENDER ALL
// ===============================
function renderAll(weather, pressure, userKin, todayKin){

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

    drawSeries("seriesMap", weather)
    drawPhaseSpace("phaseMap", weather)
    drawAttractor("attractorMap", fieldState)
    drawCollective("collectiveMap", users)
    drawActivity("activityMap", weather)
}

// ===============================
// UI STATE
// ===============================
function renderCognitiveState(
    userKin,
    todayKin,
    attention,
    noise,
    lyapunov,
    prediction,
    predictability
){

    const el = document.getElementById("mtosSummary")

    if(!el) return

    const daysLabel = predictability === 1 ? "day" : "days"

    el.innerHTML = `
    <div style="font-weight:bold; font-size:16px;">
        Current Cognitive State
    </div>

    <div>Today Kin: ${todayKin}</div>
    <div>Your Kin: ${userKin}</div>

    <div style="margin-top:6px;">
        Attention: ${attention.toFixed(3)} |
        Noise: ${noise.toFixed(3)}
    </div>

    el.innerHTML = `
    <div style="font-weight:bold; font-size:16px;">
        Current Cognitive State
    </div>

    <div>Today Kin: ${todayKin}</div>
    <div>Your Kin: ${userKin}</div>

    <div style="margin-top:6px;">
        Attention: ${attention.toFixed(3)} |
        Noise: ${noise.toFixed(3)}
    </div>

    <div>
        Lyapunov: ${lyapunov.toFixed(3)} |
        Prediction: ${prediction.toFixed(3)}
    </div>

    <div>
        Predictability: ${predictability} ${daysLabel}
    </div>
    `
    `
}
