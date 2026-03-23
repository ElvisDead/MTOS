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
import { drawField } from "./field.js"

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
    window.networkMode = "interaction"
    
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
    window.networkMode = "interaction"
    setTimeout(() => setNetworkMode("interaction"), 0)

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
    if(!year || !month || !day){
        document.getElementById("status").innerText = "Enter date"
        return
    }

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
 "entropy": entropy([w["attention"] for w in weather]),
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

        window._weather = weather
        window._weatherToday = weatherToday
        window._pressure = pressure
        window._userKin = userKin
        window._todayKin = todayKin
        window._date = { year, month, day }

        // ===============================
        // BUILD USERS
        // ===============================
        users = userList.map(uName => {
            
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

        console.log("USER KINS:", users.map(u => u.kin))

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
            result.entropy,
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
                result.entropy,
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
        
        selectedKin = kin
        window.selectedKin = kin
            
        renderAll(
            window._weather,
            window._weatherToday,
            window._pressure,
            window._userKin,
            window._todayKin,
            window._date.year,
            window._date.month,
            window._date.day
        )
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

// ===============================
// FIELD
// ===============================

const fieldModeCurrent = window.fieldMode || "hybrid"

const safeWeather = Array.isArray(weather) ? weather : []

let activity = safeWeather.map(w => 
    w && typeof w.attention === "number" ? w.attention : 0.5
)

// 🔥 КРИТИЧЕСКИЙ ФИКС — УБИРАЕМ RETURN
if(!safeWeather.length){
    console.log("FIELD FALLBACK: using empty grid")

    activity = new Array(260).fill(0.5)
}

    const globalCounts = new Array(260).fill(0)
    const usersByKin = {}
        
    users.forEach(u=>{
        const i = u.kin - 1

        globalCounts[i]++

        if(!usersByKin[u.kin]){
            usersByKin[u.kin] = []
        }

        usersByKin[u.kin].push(u)
    })

drawField("fieldMap", {
    mode: fieldModeCurrent,
    activity: activity,
    pressure: Array.isArray(pressure) ? pressure : new Array(260).fill(0),
    global: globalCounts,
    users: users || [],
    connections: [],
    usersByKin: usersByKin,
    onKinClick: (kin) => {
        window.onKinSelect(kin)
    },
    getSelectedKin: () => window.selectedKin
})
    updateFieldLegend(fieldModeCurrent)

    const now = new Date()

    drawSeries("seriesMap", weatherToday, now.getFullYear(), now.getMonth()+1, now.getDate())
    drawPhaseSpace("phaseMap", weather, selectedKin)
    
    let matrix = null
        
    if(window.attractorMode === "structure"){
        const matrix2D = JSON.parse(pyodide.runPython(`
    import json
    json.dumps(mtos_climate_atlas())
    `))
        matrix = matrix2D.flat()
            
        drawClimateAtlas("attractorMap", matrix)
    
    }else if(window.attractorMode === "map"){
        const matrix2D = JSON.parse(pyodide.runPython(`
        import json
        json.dumps(mtos_climate_atlas())
        `))

        matrix = matrix2D.flat()
        window._matrix = matrix

        const activeKin = selectedKin || userKin

        drawAttractorMap("attractorMap", matrix, {
            selectedSeal: activeKin ? (activeKin - 1) % 20 : null,
            labels: SEALS,
            meanings: SEAL_MEANING
        })
        
    }else{
        drawAttractor(
            "attractorMap",
            users,
            [],
            selectedKin
        )
    }

    drawNetwork("networkMap", users, (agent)=>{
        selectedAgent = agent
        renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day)
    }, matrix)

    if(window.attractorMode === "map" && matrix){

        const seal = ((selectedKin || userKin) - 1) % 20
        const analysis = analyzeInteractions(matrix, seal)

        const el = document.getElementById("interactionAnalysis")

        if(el){
            el.innerHTML = `
            <div><b>Best interactions:</b></div>
            ${analysis.best.map(x => `
            🟢 ${SEALS[x.seal]} (${SEAL_MEANING[x.seal]}) → ${x.value.toFixed(2)}
            `).join("<br>")}
            
            <div style="margin-top:8px;"><b>Worst interactions:</b></div>

            ${analysis.worst.map(x => `
            🔴 ${SEALS[x.seal]} (${SEAL_MEANING[x.seal]}) → ${x.value.toFixed(2)}
            `).join("<br>")}
            `
        }
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
    entropy,
    lyapunov,
    prediction,
    predictability
){

    const userSeal = (userKin - 1) % 20
    const todaySeal = (todayKin - 1) % 20
        
    const userSealName = SEALS[userSeal]
    const todaySealName = SEALS[todaySeal]

    const userMeaning = SEAL_MEANING[userSeal]
    const todayMeaning = SEAL_MEANING[todaySeal]
    
    const el = document.getElementById("mtosSummary")
    if(!el) return

    el.innerHTML = `
    <div>
    <b>Today Kin:</b> ${todayKin} — ${todaySealName}<br>
    <span style="color:#aaa">${todayMeaning}</span>
    </div>
    
    <div style="margin-top:8px;">
    <b>Your Kin:</b> ${userKin} — ${userSealName}<br>
    <span style="color:#aaa">${userMeaning}</span>
    </div>
    
    <div style="margin-top:10px;">
    <b>Attention:</b> ${attention.toFixed(3)}<br>
    <span style="color:#888">${interpretAttention(attention)}</span>
    </div>
    
    <div>
    <b>Noise:</b> ${noise.toFixed(3)}<br>
    <span style="color:#888">${interpretNoise(noise)}</span>
    </div>

    <div>
    <b>Entropy:</b> ${entropy.toFixed(3)}<br>
    <span style="color:#888">${getEntropyDescription(entropy)}</span>
    </div>
    
    <div>
    <b>Lyapunov:</b> ${lyapunov.toFixed(3)}<br>
    <span style="color:#888">${interpretLyapunov(lyapunov)}</span>
    </div>
    
    <div>
    <b>Prediction:</b> ${prediction.toFixed(3)}<br>
    <span style="color:#888">${interpretPrediction(prediction)}</span>
    </div>
    
    <div style="color:lime; margin-top:6px;">
    <b>Predictability:</b> ${predictability} days<br>
    <span style="color:#8f8">${interpretPredictability(predictability)}</span>
    </div>
    `
}

function getEntropyDescription(e){
    
    if(e > 2.5) return "high chaos, low structure"
    if(e > 2.0) return "dynamic system, flexible"
    if(e > 1.5) return "moderate complexity"
    if(e > 1.0) return "structured, stable"
    
    return "low entropy, rigid system"
}

const SEALS = [
"Dragon","Wind","Night","Seed","Serpent",
"Worldbridger","Hand","Star","Moon","Dog",
"Monkey","Human","Skywalker","Wizard","Eagle",
"Warrior","Earth","Mirror","Storm","Sun"
]

const SEAL_MEANING = [
"initiation, birth",
"breath, communication",
"inner world, intuition",
"growth, potential",
"instinct, life force",
"transition, letting go",
"action, healing",
"harmony, beauty",
"purification, flow",
"loyalty, heart",
"play, spontaneity",
"choice, free will",
"exploration, expansion",
"time, depth",
"vision, perspective",
"strategy, intelligence",
"synchronization, navigation",
"structure, reflection",
"transformation, energy",
"clarity, center"
]

window.SEALS = SEALS

// ===============================
// METRIC INTERPRETATION
// ===============================

function interpretAttention(a){
    if(a > 0.7) return "high focus, stable attention"
    if(a < 0.4) return "low focus, scattered attention"
    return "balanced attention"
}

function interpretNoise(n){
    if(n < 0.1) return "low noise, stable system"
    if(n > 0.3) return "high noise, unstable dynamics"
    return "moderate variability"
}

function interpretLyapunov(l){
    if(l < 0.05) return "high stability"
    if(l > 0.2) return "chaotic behavior"
    return "sensitive but controlled"
}

function interpretPrediction(p){
    if(p > 0.7) return "high predictability"
    if(p < 0.4) return "low predictability"
    return "moderate predictability"
}

function interpretPredictability(days){
    if(days > 200) return "long stable horizon"
    if(days < 50) return "short unstable horizon"
    return "medium-term stability"
}

// ===============================
// FIELD MODE UI
// ===============================

window.setFieldMode = (mode) => {

    window.fieldMode = mode

    const buttons = ["btnActivity","btnPressure","btnGlobal","btnHybrid"]

    buttons.forEach(id=>{
        const b = document.getElementById(id)
        if(b){
            b.style.background = "#111"
            b.style.color = "#fff"
        }
    })

    const activeMap = {
        activity: "btnActivity",
        pressure: "btnPressure",
        global: "btnGlobal",
        hybrid: "btnHybrid"
    }

    const active = document.getElementById(activeMap[mode])

    if(active){
        active.style.background = "#00ff88"
        active.style.color = "#000"
    }

    runMTOS()
}

function analyzeInteractions(matrix, seal){

    const size = 20
    const start = seal * size
    const row = matrix.slice(start, start + size)

    const ranked = row
        .map((v,i)=>({seal:i, value:v}))
        .sort((a,b)=>b.value-a.value)

    return {
        best: ranked.slice(0,3),
        worst: ranked.slice(-3).reverse()
    }
}

window.setNetworkMode = (mode) => {

    window.networkMode = mode

    // сброс стилей
    const buttons = ["modeNormal", "modeAttractor", "modeEdit"]

    buttons.forEach(id => {
        const btn = document.getElementById(id)
        if(btn){
            btn.style.background = "#111"
            btn.style.color = "#fff"
        }
    })

    // активная кнопка
    const activeMap = {
        interaction: "modeNormal",
        attractor: "modeAttractor",
        edit: "modeEdit"
    }

    const activeBtn = document.getElementById(activeMap[mode])

    if(activeBtn){
        activeBtn.style.background = "#00ff88"
        activeBtn.style.color = "#000"
    }

    if(window._weather){
    renderAll(
        window._weather,
        window._weatherToday,
        window._pressure,
        window._userKin,
        window._todayKin,
        window._date.year,
        window._date.month,
        window._date.day
    )
}
}

function renderAttractorOnly(){

    if(!window._weather) return

    let matrix = null

    if(window.attractorMode === "map"){

        const matrix = window._matrix
        if(!matrix) return

        const activeKin = selectedKin || window._userKin
        if(!activeKin) return

        drawAttractorMap("attractorMap", matrix, {
            selectedSeal: activeKin ? (activeKin - 1) % 20 : null,
            labels: SEALS,
            meanings: SEAL_MEANING
        })

        // 🔥 анализ тоже обновляем
        const seal = (activeKin - 1) % 20
        const analysis = analyzeInteractions(matrix, seal)

        const el = document.getElementById("interactionAnalysis")

        if(el){
            el.innerHTML = `
            <div><b>Best interactions:</b></div>
            ${analysis.best.map(x => `
            🟢 ${SEALS[x.seal]} (${SEAL_MEANING[x.seal]}) → ${x.value.toFixed(2)}
            `).join("<br>")}
            
            <div style="margin-top:8px;"><b>Worst interactions:</b></div>

            ${analysis.worst.map(x => `
            🔴 ${SEALS[x.seal]} (${SEAL_MEANING[x.seal]}) → ${x.value.toFixed(2)}
            `).join("<br>")}
            `
        }

    }else{
        drawAttractor(
            "attractorMap",
            users,
            [],
            selectedKin
        )
    }
}

function updateFieldLegend(mode){

    const el = document.getElementById("fieldLegend")
    if(!el) return

    if(mode === "activity"){
        el.innerHTML = "🔴 Activity — attention intensity"
    }

    if(mode === "pressure"){
        el.innerHTML = "🔵→🔴 Pressure — system tension"
    }

    if(mode === "global"){
        el.innerHTML = "🟠 Global — users per kin"
    }

    if(mode === "hybrid"){
        el.innerHTML = "🟣 Hybrid — attention × pressure"
    }

    el.innerHTML += "<br>🟩 Cluster — pressure zone"
    el.innerHTML += "<br>🟨 Attractor — stable zone"
    el.innerHTML += "<br>⚡ Event — spike"
}

function hashCode(str){
    let hash = 0
    for(let i = 0; i < str.length; i++){
        hash = (hash << 5) - hash + str.charCodeAt(i)
        hash |= 0
    }
    return hash
}
