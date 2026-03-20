import { drawWeatherMap } from "./weatherMap.js"
import { drawNetwork } from "./network.js"
import { drawSeries } from "./series260.js"
import { drawPhaseSpace } from "./phaseSpace.js"
import { drawAttractor } from "./attractor.js"
import { drawCollective } from "./collective.js"
import { drawActivity } from "./activity.js"
import { initTimeControls } from "./timeController.js"
import { logEvent } from "./mtos_log.js"
import { exportLog } from "./exportExperiment.js"
import {
    replayPlay,
    replayPause,
    replayStep,
    replaySeek,
    initReplay
} from "./replay.js"

let pyodide = null

let fieldState = null
let fieldMode = null
let users = []
let selectedAgent = null
let selectedKin = null
let selectionMemory = new Array(260).fill(0)

// ===============================
// INIT
// ===============================
export async function initMTOS(){

    const status = document.getElementById("status")

    pyodide = await loadPyodide()
    await pyodide.loadPackage("numpy")

    const code = await fetch("./MTOS_Engine.py?v=" + Date.now()).then(r => r.text())
    pyodide.runPython(code)

    status.innerText = "Ready"
    window.exportLog = exportLog
    window._logListener = (entry) => {

    const el = document.getElementById("logStream")
    if(!el) return

    const row = document.createElement("div")

    row.textContent =
        new Date(entry.t).toLocaleTimeString() +
        " | " +
        entry.type +
        " | " +
        JSON.stringify(entry)

    el.prepend(row)

    // ограничение UI
    if(el.children.length > 200){
        el.removeChild(el.lastChild)
    }
}
    window.toggleEditMode = () => {
        window.removeUser = removeUser
        window.networkMode = window.networkMode === "edit" ? "interaction" : "edit"
        console.log("Mode:", window.networkMode)
    }
    
    window.replayPlay = replayPlay
    window.replayPause = replayPause
    window.replayStep = replayStep
    window.replaySeek = replaySeek

    initReplay()
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

function removeUser(name){

    // 1. удаляем из списка
    let list = loadUsers()
    list = list.filter(u => u !== name)
    saveUsers(list)

    // 2. чистим память связей
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory")) || {}

    const newMemory = {}

    Object.keys(memory).forEach(key => {
        if(!key.includes(name)){
            newMemory[key] = memory[key]
        }
    })

    localStorage.setItem("collective_relations_memory", JSON.stringify(newMemory))

    // 3. пересборка системы
    users = list.map(uName => ({
        name: uName,
        kin: 1,
        phase: 0,
        weight: 1
    }))

    // 4. обновление UI
    runMTOS()
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
        logEvent("run_start", { name, year, month, day })

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
kin = mtos_current_kin_NEW(${JSON.stringify(name)},${year},${month},${day})
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
        logEvent("python_result", {
            kin: result.kin,
            attention: result.attention,
            noise: result.noise,
            predictability: result.predictability
        })
        const pressure = result.pressure
        const userKin = result.kin

        // ===============================
        // TODAY
        // ===============================
        const now = new Date()

        const todayKin = Number(pyodide.runPython(`
mtos_current_kin_NEW("today",${now.getFullYear()},${now.getMonth()+1},${now.getDate()})
`))

        // ===============================
        // BUILD USERS
        // ===============================
        users = userList.map(uName=>{

            const kin = Number(pyodide.runPython(`
mtos_current_kin_NEW("${uName}",${year},${month},${day})
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

        // ===============================
        // AGENT MOVEMENT (field-driven)
        // ===============================
        if(fieldState){
            users = users.map(u => {
                
                let bestKin = u.kin
                let bestVal = -Infinity
                    
                for(let d = -3; d <= 3; d++){
                    let k = (u.kin - 1 + d + 260) % 260
                        
                    const v = fieldState[k]
                        
                    if(v > bestVal){
                        bestVal = v
                        bestKin = k + 1
                    }
                }
                
                let newKin = u.kin

                if(bestKin !== u.kin){

                    if((bestKin - u.kin + 260) % 260 < 130){
                        newKin = u.kin + 1
                    }else{
                        newKin = u.kin - 1
                    }
                }

// нормализация
if(newKin < 1) newKin += 260
if(newKin > 260) newKin -= 260

return {
    ...u,
    kin: newKin
}
            })
        }

        window.currentUsers = users
        logEvent("agents_update", {
            users: users,
            fieldState: fieldState,
            weather: weather,
            pressure: pressure,
            userKin: userKin,
            todayKin: todayKin
            })

        // ===============================
        // UI STATE
        // ===============================
        renderCognitiveState(
            userKin,
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
        renderAll(weather, pressure, userKin, todayKin, year, month, day)

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
kin = mtos_current_kin_NEW(${JSON.stringify(name)},${y},${m},${dd})
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
            logEvent("time_step", {
                year: y,
                month: m,
                day: dd,
                kin: currentKin
            })

            users = users.map(u=>{

                const kin = Number(pyodide.runPython(`
mtos_current_kin_NEW("${u.name}",${y},${m},${dd})
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

            // ===============================
            // AGENT MOVEMENT (field-driven)
            // ===============================
            if(fieldState){
                users = users.map(u => {
                    
                    let bestKin = u.kin
                    let bestVal = -Infinity
                        
                    for(let d = -3; d <= 3; d++){
                        let k = (u.kin - 1 + d + 260) % 260
                            
                        const v = fieldState[k]
                            
                        if(v > bestVal){
                            bestVal = v
                            bestKin = k + 1
                        }
                    }
                    
                    let newKin = u.kin
                        
                    if(bestKin !== u.kin){

                        if((bestKin - u.kin + 260) % 260 < 130){
                            newKin = u.kin + 1
                        }else{
                            newKin = u.kin - 1
                        }
                    }

                    if(newKin < 1) newKin += 260
                        if(newKin > 260) newKin -= 260

                    return {
                        ...u,
                        kin: newKin
                    }
                })
            }

            window.currentUsers = users

            logEvent("agents_update", {
                users: users,
                fieldState: fieldState,
                weather: weather,
                pressure: pressure,
                userKin: userKin,
                todayKin: todayKin
            })

            renderCognitiveState(
                currentKin,
                todayKin,
                result.attention,
                result.noise,
                result.lyapunov,
                result.prediction,
                result.predictability
            )

            renderAll(weather, pressure, currentKin, todayKin, y, m, dd)
        }

        initTimeControls(step)

    }catch(e){
        console.error(e)
        status.innerText = "ERROR"
    }

    window.onKinSelect = (kin) => {
        logEvent("kin_select", {
            kin,
            memory: selectionMemory[kin-1]
        })
        // ===============================
        // MEMORY UPDATE
        // ===============================
        selectionMemory[kin-1] += 1

        // затухание памяти
        selectionMemory = selectionMemory.map(v => v * 0.98)
        window.selectionMemory = selectionMemory
        selectedKin = kin
            
        renderAll(weather, pressure, userKin, todayKin, year, month, day)
    }
}

// ===============================
// RENDER ALL
// ===============================
function renderAll(weather, pressure, userKin, todayKin, year, month, day){

    drawWeatherMap(
        "weatherMap",
        weather,
        userKin,
        todayKin,
        pressure,
        fieldState,
        selectedAgent,
        window._attractorField
    )

    drawNetwork("networkMap", users, (agent)=>{
        selectedAgent = agent
        
        renderAll(weather, pressure, userKin, todayKin, year, month, day)
    })

    drawSeries("seriesMap", weather, year, month, day)
    drawPhaseSpace("phaseMap", weather, selectedKin)
    drawAttractor(
        "attractorMap",
        users,
        [], // relations пока пусто
        selectedKin
    )
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

    el.innerHTML = `
        <div>Today Kin: ${todayKin}</div>
        <div>Your Kin: ${userKin}</div>
        <div>Attention: ${attention.toFixed(3)}</div>
        <div>Noise: ${noise.toFixed(3)}</div>
        <div>Lyapunov: ${lyapunov.toFixed(3)}</div>
        <div>Prediction: ${prediction.toFixed(3)}</div>
        <div style="color:lime;">Predictability: ${predictability} days</div>
    `
}
