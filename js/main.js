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
import { drawAttractorMap } from "./attractorMap.js"
import { drawClimateAtlas } from "./climateAtlasMap.js"
import {
    replayPlay,
    replayPause,
    replayStep,
    replaySeek,
    initReplay
} from "./replay.js"

function toPython(obj){
    return JSON.stringify(obj)
        .replace(/true/g, "True")
        .replace(/false/g, "False")
        .replace(/null/g, "None")
}

let pyodide = null
let historyStack = []
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
    window.removeUser = removeUser
    window.removeConnection = removeConnection
    window.removeConnectionHard = removeConnectionHard
    window.addConnection = addConnection
    window.attractorMode = "dynamic" // или "map"
    
    window.toggleEditMode = () => {
        window.networkMode = window.networkMode === "edit" ? "interaction" : "edit"
    
        const btn = document.getElementById("editBtn")
        if(btn){
            btn.innerText = window.networkMode === "edit" ? "EDIT ON" : "EDIT OFF"
        }

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

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_users") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    })

    // 1. удаляем из списка
    let list = loadUsers()
    list = list.filter(u => u !== name)
    saveUsers(list)

    // 2. чистим память связей
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory")) || {}

    const newMemory = {}

    Object.keys(memory).forEach(key => {

        const [a, b] = key.split("->")

        if(a !== name && b !== name){
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

function removeConnectionHard(a, b){

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_users") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    })

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")

    delete memory[a + "->" + b]
    delete memory[b + "->" + a]

    memory[a + "->" + b] = 0
    memory[b + "->" + a] = 0

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory))

    // 🔴 КЛЮЧ: ЖЁСТКАЯ БЛОКИРОВКА
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    locked[a + "->" + b] = true
    locked[b + "->" + a] = true

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked))

    window._lockedCache = locked

    runMTOS()
}

function removeConnection(a, b){

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_users") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    })

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")

    delete memory[a + "->" + b]
    delete memory[b + "->" + a]

    memory[a + "->" + b] = 0
    memory[b + "->" + a] = 0

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory))

    // мягкое удаление — НЕ блокируем
    window._lockedCache = null

    runMTOS()
}

function addConnection(a, b, value = 1){

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    // 🔴 КЛЮЧЕВОЙ ФИЛЬТР
    if(locked[a + "->" + b] || locked[b + "->" + a]){
        console.log("BLOCKED:", a, b)
        return
    }

    memory[a + "->" + b] = value
    memory[b + "->" + a] = value

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory))

    delete locked[a + "->" + b]
    delete locked[b + "->" + a]

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked))

    window._lockedCache = null

    runMTOS()
}

window.addConnection = addConnection

function lockConnection(a, b){

    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    locked[a + "->" + b] = true
    locked[b + "->" + a] = true

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked))
}

function undo(){

    const last = historyStack.pop()
    if(!last) return

    localStorage.setItem("mtos_users", JSON.stringify(last.users))
    localStorage.setItem("collective_relations_memory", JSON.stringify(last.memory))

    runMTOS()
}

window.undoMTOS = undo

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
        const now = new Date()
        
        const weatherToday = JSON.parse(pyodide.runPython(`
import json
weather = mtos_260_weather("today",${now.getFullYear()},${now.getMonth()+1},${now.getDate()})
json.dumps(weather)
`))
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
        const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
        const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
        
        const fieldResult = JSON.parse(pyodide.runPython(`
        import json
        users = ${JSON.stringify(users)}
        f,s,u = mtos_multi_agents_field(
            users,
            ${year},
            ${month},
            ${day},
            None,
            None,
            ${toPython(locked)},
            ${toPython(memory)}
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
        renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day)

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

            const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
            const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")

            const fieldResult = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(
 users,
 ${y},
 ${m},
 ${dd},
 ${fieldState ? toPython(fieldState) : "None"},
 ${fieldMode ? toPython(fieldMode) : "None"},
 ${toPython(locked)},
 ${toPython(memory)}
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

            renderAll(weather, weatherToday, pressure, currentKin, todayKin, y, m, dd)
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
            
        renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day)
    }
}

// ===============================
// RENDER ALL
// ===============================
function renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day){

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
        
        renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day)
    })

    const now = new Date()

    drawSeries("seriesMap", weatherToday, now.getFullYear(), now.getMonth()+1, now.getDate())
    drawPhaseSpace("phaseMap", weather, selectedKin)
    if(window.attractorMode === "structure"){

    const matrix2D = JSON.parse(pyodide.runPython(`
        import json
        json.dumps(mtos_climate_atlas())
        `))

        const matrix = matrix2D.flat()

        drawClimateAtlas("attractorMap", matrix)

    }else if(window.attractorMode === "map"){

        const matrix2D = JSON.parse(pyodide.runPython(`
        import json
        json.dumps(mtos_climate_atlas())
        `))

        const matrix = matrix2D.flat()

        drawAttractorMap("attractorMap", matrix)

    }else{

        drawAttractor(
            "attractorMap",
            users,
            [],
            selectedKin
        )
    }
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
