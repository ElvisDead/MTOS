import { drawWeatherMap } from "./weatherMap.js"
import { drawNetwork } from "./network.js"
import { drawSeries } from "./series260.js"
import { drawPhaseSpace } from "./phaseSpace.js"
import { drawAttractor } from "./attractor.js"
import "./attractorBridge.js";
import { drawCollective } from "./collective.js"
import { drawActivity } from "./activity.js"
import { initTimeControls } from "./timeController.js"
import {
    logEvent,
    addForecast,
    resolveForecasts,
    getForecastStats,
    alreadyLoggedDailySnapshot,
    logDailySnapshot
} from "./mtos_log.js"
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
import { KinRegistry } from "./kinRegistry.js"
import { saveNetworkState } from "./networkHistory.js"
import { drawHelix } from "./helix.js"
import { classifyUserDay } from "./dayClassifier.js"
import {
    resolveTimePressure,
    getTimePressureSummary,
    applyTimePressureToDayState,
    applyTimePressureToAttractorState
} from "./timePressure.js"
import { drawFieldLinear } from "./fieldLinear.js"
import { drawFieldTorus } from "./fieldTorus.js"

import { resolveTodayMode } from "./decisionEngine.js"
import { renderTodayPanel } from "./todayPanel.js"

function toPython(obj) {
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
export async function initMTOS() {

    const status = document.getElementById("status")

    pyodide = await loadPyodide()
    await pyodide.loadPackage("numpy")

    const code = await fetch("./MTOS_Engine.py").then(r => r.text())
    pyodide.runPython(code)

    status.innerText = "Ready"
    window.exportLog = exportLog
    window.fieldMode = "hybrid"
    window.fieldViewMode = "grid"
    window._logListener = (entry) => {

        const el = document.getElementById("logStream")
        if (!el) return

        const row = document.createElement("div")

        row.textContent =
            new Date(entry.t).toLocaleTimeString() +
            " | " +
            entry.type +
            " | " +
            JSON.stringify(entry)

        el.prepend(row)

        // ограничение UI
        if (el.children.length > 200) {
            el.removeChild(el.lastChild)
        }
    }
    window.removeUser = removeUser
    window.removeConnection = removeConnection
    window.removeConnectionHard = removeConnectionHard
    window.addConnection = addConnection
    window.attractorMode = "map"
    window.networkMode = "interaction"

    window.toggleEditMode = () => {
        window.networkMode = window.networkMode === "edit" ? "interaction" : "edit"

        const btn = document.getElementById("editBtn")
        if (btn) {
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
function loadUsers() {
    try {
        const saved = localStorage.getItem("mtos_user_list")
        if (!saved) return []

        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : []
    } catch (e) {
        return []
    }
}

function saveUsers(list) {
    localStorage.setItem("mtos_user_list", JSON.stringify(list))
}

function addUser(list, name) {

    // страховка
    if (!Array.isArray(list)) {
        list = []
    }

    if (name && !list.includes(name)) {
        list.push(name)
    }

    return list
}

function removeUser(name) {

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    })

    // 1. удаляем из списка имён
    let list = loadUsers()
    list = list.filter(u => u !== name)
    saveUsers(list)

    // 2. чистим память связей
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const newMemory = {}

    Object.keys(memory).forEach(key => {
        const [a, b] = key.split("->")
        if (a !== name && b !== name) {
            newMemory[key] = memory[key]
        }
    })

    localStorage.setItem("collective_relations_memory", JSON.stringify(newMemory))

    // 3. чистим жёсткие блокировки
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
    const newLocked = {}

    Object.keys(locked).forEach(key => {
        const [a, b] = key.split("->")
        if (a !== name && b !== name) {
            newLocked[key] = locked[key]
        }
    })

    localStorage.setItem("mtos_locked_relations", JSON.stringify(newLocked))
    window._lockedCache = newLocked

    // 4. перезапуск
    runMTOS()
}

function removeConnectionHard(a, b) {

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
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

function removeConnection(a, b) {

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
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

function addConnection(a, b, value = 1) {

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    // 🔴 КЛЮЧЕВОЙ ФИЛЬТР
    if (locked[a + "->" + b] || locked[b + "->" + a]) {
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

function lockConnection(a, b) {

    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    locked[a + "->" + b] = true
    locked[b + "->" + a] = true

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked))
}

function undo() {

    const last = historyStack.pop()
    if (!last) return

    localStorage.setItem("mtos_user_list", JSON.stringify(last.users))
    localStorage.setItem("collective_relations_memory", JSON.stringify(last.memory))

    runMTOS()
}

window.undoMTOS = undo

// ===============================
// RUN
// ===============================

function shiftWeatherArray(weather, offsetDays = 0) {
    const src = Array.isArray(weather) ? weather : []
    if (!src.length) return []

    const n = src.length
    const shift = ((offsetDays % n) + n) % n

    return src.map((_, i) => {
        const from = (i + shift) % n
        const w = src[from] || {}
        return {
            attention: Number(w.attention ?? 0.5),
            activity: Number(w.activity ?? 0.5),
            pressure: Number(w.pressure ?? 0),
            conflict: Number(w.conflict ?? 0)
        }
    })
}

const MTOS_MEMORY_KEY = "mtos_memory_layers_v1"

function clamp01(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function loadMemoryLayers() {
    try {
        const raw = localStorage.getItem(MTOS_MEMORY_KEY)
        const parsed = raw ? JSON.parse(raw) : null

        if (parsed && typeof parsed === "object") {
            return {
    sealMemory: Array.isArray(parsed.sealMemory)
        ? parsed.sealMemory.slice(0, 20).map(v => clamp01(v))
        : new Array(20).fill(0),

    kinMemory: Array.isArray(parsed.kinMemory)
        ? parsed.kinMemory.slice(0, 260).map(v => clamp01(v))
        : new Array(260).fill(0),

    userMemory: parsed.userMemory && typeof parsed.userMemory === "object"
        ? parsed.userMemory
        : {},

    pairMemory: parsed.pairMemory && typeof parsed.pairMemory === "object"
        ? parsed.pairMemory
        : {},

    dayMemory: parsed.dayMemory && typeof parsed.dayMemory === "object"
        ? parsed.dayMemory
        : {
            FOCUS: 0,
            FLOW: 0,
            NEUTRAL: 0,
            FATIGUE: 0,
            RECOVERY: 0
        },

    decisionMemory: Array.isArray(parsed.decisionMemory)
        ? parsed.decisionMemory.slice(-300)
        : [],

    fieldMemory: Array.isArray(parsed.fieldMemory)
        ? parsed.fieldMemory.slice(0, 260).map(v => clamp01(v))
        : new Array(260).fill(0)
}
        }
    } catch (e) {
        console.warn("memory load failed", e)
    }

    return {
    sealMemory: new Array(20).fill(0),
    kinMemory: new Array(260).fill(0),
    userMemory: {},
    pairMemory: {},
    dayMemory: {
        FOCUS: 0,
        FLOW: 0,
        NEUTRAL: 0,
        FATIGUE: 0,
        RECOVERY: 0
    },
    decisionMemory: [],
    fieldMemory: new Array(260).fill(0)
}
}

function saveMemoryLayers(state) {
    try {
        localStorage.setItem(MTOS_MEMORY_KEY, JSON.stringify(state))
    } catch (e) {
        console.warn("memory save failed", e)
    }
}

function getUserMemoryEntry(userMemory, name) {
    const entry = userMemory?.[name]
    if (entry && typeof entry === "object") {
        return {
            score: clamp01(entry.score ?? 0),
            streak: Math.max(0, Number(entry.streak ?? 0)),
            lastKin: Number(entry.lastKin ?? 0),
            lastSeal: Number(entry.lastSeal ?? 0),
            updatedAt: entry.updatedAt || null
        }
    }

    return {
        score: 0,
        streak: 0,
        lastKin: 0,
        lastSeal: 0,
        updatedAt: null
    }
}

function updateMemoryLayers(name, userKin, dayState, weather, attractorField) {
    const memory = loadMemoryLayers()

    const kinIndex = Math.max(0, Math.min(259, Number(userKin) - 1))
    const sealIndex = ((Number(userKin) - 1) % 20 + 20) % 20

    const ds = dayState || {}
    const w = Array.isArray(weather) ? weather[kinIndex] || {} : {}

    const attention = Number(ds.attention ?? w.attention ?? 0.5)
    const activity = Number(ds.activity ?? w.activity ?? attention)
    const pressure = Number(ds.pressure ?? w.pressure ?? 0)
    const conflict = Number(ds.conflict ?? w.conflict ?? 0)
    const stability = Number(ds.stability ?? 0.5)
    const field = Number(ds.field ?? 0.5)
    const attractor = Array.isArray(attractorField)
        ? Number(attractorField[kinIndex] ?? 0.5)
        : 0.5

    const reinforcement =
        attention * 0.22 +
        activity * 0.18 +
        stability * 0.18 +
        field * 0.14 +
        attractor * 0.16 -
        pressure * 0.10 -
        conflict * 0.08

    const signal = clamp01(reinforcement)

    const dayLabel = String(dayState?.dayLabel || "NEUTRAL").toUpperCase()

    const SEAL_DECAY = 0.985
    const KIN_DECAY = 0.992
    const USER_DECAY = 0.990

    for (let i = 0; i < 20; i++) {
        memory.sealMemory[i] = clamp01(memory.sealMemory[i] * SEAL_DECAY)
    }

    for (let i = 0; i < 260; i++) {
        memory.kinMemory[i] = clamp01(memory.kinMemory[i] * KIN_DECAY)
    }

    const userEntry = getUserMemoryEntry(memory.userMemory, name)
    userEntry.score = clamp01(userEntry.score * USER_DECAY)

// ===============================
// TIME DECAY (если пользователь не появлялся)
// ===============================

const now = Date.now()
const lastUpdate = userEntry.updatedAt ? new Date(userEntry.updatedAt).getTime() : now

const hoursIdle = (now - lastUpdate) / (1000 * 60 * 60)

// если человек не активен — память начинает "рассыпаться"
if (hoursIdle > 12) {
    const decayFactor = Math.min(0.25, (hoursIdle - 12) / 48) // максимум -25%
    userEntry.score = clamp01(userEntry.score * (1 - decayFactor))
}

if (hoursIdle > 48) {
    userEntry.streak = 0
}

    memory.sealMemory[sealIndex] = clamp01(
        memory.sealMemory[sealIndex] + signal * 0.18
    )

    memory.kinMemory[kinIndex] = clamp01(
        memory.kinMemory[kinIndex] + signal * 0.22
    )

    userEntry.score = clamp01(userEntry.score + signal * 0.24)

// ===============================
// DAY MEMORY
// ===============================
if (!memory.dayMemory[dayLabel]) {
    memory.dayMemory[dayLabel] = 0
}
memory.dayMemory[dayLabel] += 1

// ===============================
// FIELD MEMORY
// ===============================
if (Array.isArray(attractorField) && attractorField.length === 260) {
    for (let i = 0; i < 260; i++) {
        const prev = Number(memory.fieldMemory[i] ?? 0)
        const next = Number(attractorField[i] ?? 0)
        memory.fieldMemory[i] = clamp01(prev * 0.96 + next * 0.04)
    }
}

// ===============================
// DECISION MEMORY
// ===============================
const decisionMode = window.mtosAdaptiveMode?.mode || "UNKNOWN"

memory.decisionMemory.push({
    t: Date.now(),
    user: name,
    kin: userKin,
    dayLabel,
    decisionMode,
    attention: Number(attention.toFixed(3)),
    activity: Number(activity.toFixed(3)),
    pressure: Number(pressure.toFixed(3)),
    conflict: Number(conflict.toFixed(3)),
    stability: Number(stability.toFixed(3)),
    field: Number(field.toFixed(3)),
    attractor: Number(attractor.toFixed(3))
})

if (memory.decisionMemory.length > 300) {
    memory.decisionMemory.shift()
}

    if (userEntry.lastKin === userKin) {
        userEntry.streak += 1
    } else {
        userEntry.streak = 1
    }

    userEntry.lastKin = userKin
    userEntry.lastSeal = sealIndex + 1
    userEntry.updatedAt = new Date().toISOString()

    memory.userMemory[name] = userEntry

    saveMemoryLayers(memory)
    window.mtosMemoryLayers = memory

    return memory
}

function getMemoryInfluence(name, kin) {
    const memory = window.mtosMemoryLayers || loadMemoryLayers()

    const kinIndex = Math.max(0, Math.min(259, Number(kin) - 1))
    const sealIndex = ((Number(kin) - 1) % 20 + 20) % 20

    const nameSafe = name || ""
    const userEntry = getUserMemoryEntry(memory.userMemory, nameSafe)

    const sealValue = Number(memory.sealMemory[sealIndex] ?? 0)
    const kinValue = Number(memory.kinMemory[kinIndex] ?? 0)
    const userValue = Number(userEntry.score ?? 0)

    return {
        seal: sealValue,
        kin: kinValue,
        user: userValue,
        total: clamp01(
            sealValue * 0.30 +
            kinValue * 0.35 +
            userValue * 0.35
        )
    }
}

function saveAutoDailySnapshot({
    name,
    userKin,
    todayKin,
    uiMetrics,
    dayState,
    users,
    fieldState
}) {
    const day = new Date().toISOString().slice(0, 10)

    if (!name || !userKin || !todayKin || !uiMetrics || !dayState) {
        return
    }

    if (alreadyLoggedDailySnapshot(day, name, userKin)) {
        return
    }

    const snapshot = {
        t: Date.now(),
        day,
        name,

        userKin,
        todayKin,

        dayLabel: dayState.dayLabel ?? "UNKNOWN",
        dayIndex: Number(dayState.dayIndex ?? 0),
        dayScore: Number(dayState.dayScore ?? 0),

        recommendedMode: window.mtosAdaptiveMode?.mode || getRecommendedMode(dayState) || "UNKNOWN",

        attention: Number(uiMetrics.attention ?? 0),
        noise: Number(uiMetrics.noise ?? 0),
        entropy: Number(uiMetrics.entropy ?? 0),
        lyapunov: Number(uiMetrics.lyapunov ?? 0),
        prediction: Number(uiMetrics.prediction ?? 0),
        predictability: Number(uiMetrics.predictability ?? 0),

        attractorType: String(window.mtosAttractorState?.type ?? "unknown"),
        attractorIntensity: Number(window.mtosAttractorState?.intensity ?? 0),
        attractorScore: Number(window.mtosAttractorState?.score ?? 0),

        networkTotalLinks: Number(window.mtosNetworkFeedback?.totalLinks ?? 0),
        networkDensity: Number(window.mtosNetworkFeedback?.density ?? 0),
        networkMeanStrength: Number(window.mtosNetworkFeedback?.meanStrength ?? 0),
        networkConflictRatio: Number(window.mtosNetworkFeedback?.conflictRatio ?? 0),
        networkSupportRatio: Number(window.mtosNetworkFeedback?.supportRatio ?? 0),

        timePressure: Number(window.mtosTimePressureSummary?.value ?? 0),
        timePressureLabel: String(window.mtosTimePressureSummary?.label ?? "low"),
        temporalMode: String(window.mtosTimePressureSummary?.temporalMode ?? "EXPLORE"),

        usersCount: Array.isArray(users) ? users.length : 0,
        fieldMode: fieldState ? "active" : "none"
    }

    logDailySnapshot(snapshot)
}

export async function runMTOS() {

    const status = document.getElementById("status")

    const name = document.getElementById("name").value.trim()
    const year = +document.getElementById("year").value
    const month = +document.getElementById("month").value
    const day = +document.getElementById("day").value

        const runtimeKey = `${name}_${year}_${month}_${day}`

    window._mtosRunCache = window._mtosRunCache || {}

    if (window._mtosRunCache[runtimeKey]) {
        const cached = window._mtosRunCache[runtimeKey]

        window._weather = cached.weather
        window._weatherToday = cached.weatherToday
        window._pressure = cached.pressure
        window._userKin = cached.userKin
        window._todayKin = cached.todayKin
        window._date = { year, month, day }
        window._attractorField = cached.attractorField || []
        window.mtosDayState = cached.dayState || null
        window.mtosUnifiedMetrics = cached.uiMetrics || null
        window.mtosDaySync = cached.daySync || null
        window.currentUsers = cached.users || []

        window.mtosUserMeta = cached.userMeta || null
        window.mtosTodayMeta = cached.todayMeta || null

        fieldState = cached.fieldState || null
        fieldMode = cached.fieldMode || null
        users = cached.users || []

        renderCognitiveState(
            cached.userKin,
            cached.todayKin,
            cached.uiMetrics?.attention ?? 0.5,
            cached.uiMetrics?.noise ?? 0.1,
            cached.uiMetrics?.entropy ?? 1.0,
            cached.uiMetrics?.lyapunov ?? 0.0,
            cached.uiMetrics?.prediction ?? 0.5,
            cached.uiMetrics?.predictability ?? 120,
            cached.daySync || null,
            cached.dayState || null
        )

        renderAll(
            cached.weather,
            cached.weatherToday,
            cached.pressure,
            cached.userKin,
            cached.todayKin,
            year,
            month,
            day
        )

        window._rerenderMTOS = () => {
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

        status.innerText = "Done (cache)"
        return
    }

    if (!year || !month || !day) {
        document.getElementById("status").innerText = "Enter date"
        return
    }

    try {

        status.innerText = "Running..."
        logEvent("run_start", { name, year, month, day })

        const metrics = computeBehaviorMetrics(window.MTOS_LOG)
        const truth = computeAutoTruth(metrics)

        logEvent("auto_truth", truth)

        // ===============================
        // USERS MEMORY
        // ===============================
        let userList = loadUsers()
        userList = addUser(userList, name)
        saveUsers(userList)

        pyodide.runPython(`
        import datetime
        
        birth = datetime.date(${year}, ${month}, ${day})
        kin, tone, seal, i = kin_from_date(birth)
        register_user(${JSON.stringify(name)}, birth, kin, tone, seal)
        `)

        // ===============================
        // PYTHON CORE
        // ===============================
        const result = JSON.parse(pyodide.runPython(`

import json
import datetime

weather = mtos_260_weather(${JSON.stringify(name)},${year},${month},${day})
kin = mtos_current_kin_NEW(${JSON.stringify(name)},${year},${month},${day})
pressure = mtos_pressure_map()

safe_weather = [
    w if isinstance(w, dict) and "attention" in w else {
        "attention": 0.5,
        "activity": 0.5,
        "pressure": 0,
        "conflict": 0
    }
    for w in weather
]

attention_values = [w["attention"] for w in safe_weather]

birth = datetime.date(${year}, ${month}, ${day})
_, tone, _, i = kin_from_date(birth)
today = datetime.datetime.now(datetime.timezone.utc).date()
series = simulate(i, tone, today, 260, ${JSON.stringify(name)}).tolist()

attention = sum(attention_values) / 260
noise = sum([abs(v - 0.5) for v in attention_values]) / 260
series_entropy = entropy(series)
series_lyapunov = lyapunov(series)
prediction = attention * (1 - noise)
series_predictability = predictability(series)

json.dumps({
 "weather": safe_weather,
 "pressure": pressure,
 "kin": kin,
 "attention": attention,
 "noise": noise,
 "entropy": series_entropy,
 "lyapunov": series_lyapunov,
 "prediction": prediction,
 "predictability": series_predictability
})
`))

        const weather = result.weather
        const now = new Date()
        const weatherToday = weather

        // ===============================
        // ATTRACTOR FIELD
        // ===============================
        const attractorField = weather.map(w => {
            const a = Number(w.attention ?? 0.5)
            const act = Number(w.activity ?? a)
            const p = Number(w.pressure ?? 0)
            const c = Number(w.conflict ?? 0)

            const value =
                a * 0.45 +
                act * 0.30 +
                (1 - p) * 0.15 +
                (1 - c) * 0.10

            return Math.max(0, Math.min(1, value))
        })

        window._attractorField = attractorField

        //const weatherToday = JSON.parse(pyodide.runPython(`
        //import json
        //weather = mtos_260_weather("today",${now.getFullYear()},${now.getMonth()+1},${now.getDate()})
        //json.dumps(weather)
        //`))

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

        const todayKin = JSON.parse(pyodide.runPython(`
import json, datetime

today = datetime.datetime.now(datetime.timezone.utc).date()
kin, _, _, _ = kin_from_date(today)

json.dumps(kin)
`))

        window._weather = weather

        window._phaseField = weather.map(w => Number(w.phase ?? 0))
window._resonanceField = weather.map(w => Number(w.resonance ?? 0))
window._interferenceField = weather.map(w => Number(w.interference ?? 0))

window.mtosPhaseSummary = {
    meanPhase: Number(result.mean_phase ?? 0),
    meanResonance: Number(result.mean_resonance ?? 0),
    meanInterference: Number(result.mean_interference ?? 0)
}
        window._weatherToday = weatherToday
        window._pressure = pressure
        window._userKin = userKin
        window._todayKin = todayKin
        window._date = { year, month, day }

                const userMeta = JSON.parse(pyodide.runPython(`
import json, datetime
birth = datetime.date(${year}, ${month}, ${day})
kin, tone, seal, i = kin_from_date(birth)
json.dumps({
    "kin": kin,
    "tone": tone,
    "seal": seal,
    "sealIndex": i + 1
})
`))

        const todayMeta = JSON.parse(pyodide.runPython(`
import json, datetime
today = datetime.datetime.now(datetime.timezone.utc).date()
kin, tone, seal, i = kin_from_date(today)
json.dumps({
    "kin": kin,
    "tone": tone,
    "seal": seal,
    "sealIndex": i + 1
})
`))

        window.mtosUserMeta = userMeta
        window.mtosTodayMeta = todayMeta

        // ===============================
        // BUILD USERS
        // ===============================
        users = userList.map((uName) => {
            const userData = JSON.parse(pyodide.runPython(`
            import json
            users_db = load_users()
            json.dumps(users_db.get(${JSON.stringify(uName)}, {}))
            `))

            let baseKin = null

            if (userData && userData.birth) {
                const [yy, mm, dd] = userData.birth.split("-").map(Number)

                baseKin = Number(pyodide.runPython(`
                mtos_current_kin_NEW(${JSON.stringify(uName)}, ${yy}, ${mm}, ${dd})
                `))
            } else if (userData && userData.kin != null) {
                baseKin = Number(userData.kin)
            }

            if (!Number.isFinite(baseKin) || baseKin < 1 || baseKin > 260) {
                console.warn("BAD USER DATA:", uName, userData)
                return null
            }

            const weatherPhase =
    Array.isArray(result.weather) && result.weather[baseKin - 1]
        ? Number(result.weather[baseKin - 1].phase ?? 0)
        : 0

const phase = weatherPhase

            return {
    name: uName,
    kin: baseKin,
    baseKin: baseKin,
    phase,
    weight: 1,
    location: userData.location || userData.city || userData.country || "",
    city: userData.city || "",
    country: userData.country || ""
}
        }).filter(Boolean)

        // 1. Посмотрим в консоли, как РЕАЛЬНО выглядит один юзе
                // debug logs disabled for speed

        // ===============================
        // FIELD
        // ===============================
        const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
        const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")

        const networkFeedback = window.mtosNetworkFeedback || {
            totalLinks: 0,
            density: 0,
            meanStrength: 0,
            conflictRatio: 0,
            supportRatio: 0
        }

        const attractorState = window.mtosAttractorState || {
            type: "unknown",
            intensity: 0,
            score: 0
        }

        const prevUsers = JSON.parse(JSON.stringify(users))
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
    ${toPython(memory)},
    ${toPython(networkFeedback)},
    ${toPython(attractorState)}
)
json.dumps([f,s,u])
`))

        fieldState = fieldResult[0]
        fieldMode = fieldResult[1]
        const updated = fieldResult[2]

        const dayState = classifyUserDay(
            userKin,
            weather,
            pressure,
            fieldState,
            window.mtosNetworkFeedback,
            window.mtosAttractorState
        )

        const evolvedDayState = resolveDynamicDayState(
    dayState,
    window.mtosNetworkFeedback,
    window.mtosAttractorState
)

window.mtosDayState = evolvedDayState

const memoryLayers = updateMemoryLayers(
    name,
    userKin,
    window.mtosDayState,
    weather,
    window._attractorField
)

window.mtosMemoryInfluence = getMemoryInfluence(name, userKin)

        const attractorAtUser =
            Array.isArray(window._attractorField) && userKin >= 1 && userKin <= 260
                ? Number(window._attractorField[userKin - 1] ?? 0.5)
                : 0.5

        evolvedDayState.attractorField = attractorAtUser
        evolvedDayState.dayIndex = Number(
            Math.max(-1, Math.min(1, evolvedDayState.dayIndex + (attractorAtUser - 0.5) * 0.25)).toFixed(3)
        )

        if (attractorAtUser > 0.72) {
            evolvedDayState.dayDesc += " Strong attractor pull is present."
        } else if (attractorAtUser < 0.28) {
            evolvedDayState.dayDesc += " Weak attractor pull reduces coherence."
        }

        window.mtosDayState = evolvedDayState

        

const uiMetrics = buildUnifiedMetrics(result, evolvedDayState)
window.mtosUnifiedMetrics = uiMetrics

const timePressure = resolveTimePressure({
    attention: evolvedDayState.attention,
    activity: evolvedDayState.activity,
    pressure: evolvedDayState.pressure,
    conflict: evolvedDayState.conflict,
    stability: evolvedDayState.stability,
    field: evolvedDayState.field,
    entropy: uiMetrics.entropy,
    noise: uiMetrics.noise,
    prediction: uiMetrics.prediction,
    predictability: uiMetrics.predictability,
    attractorIntensity: Number(window.mtosAttractorState?.intensity ?? 0),
    networkConflict: Number(window.mtosNetworkFeedback?.conflictRatio ?? 0),
    networkDensity: Number(window.mtosNetworkFeedback?.density ?? 0)
})

window.mtosTimePressure = timePressure
window.mtosTimePressureSummary = getTimePressureSummary(timePressure)

window.mtosDayState = applyTimePressureToDayState(window.mtosDayState, timePressure)

const decision = resolveTodayMode(
    window.mtosDayState,
    window.mtosTimePressureSummary,
    window.mtosMemoryLayers
)

window.mtosDecision = decision

renderTodayPanel("todayPanel", decision)

if (window.mtosAttractorState) {
    window.mtosAttractorState = applyTimePressureToAttractorState(
        window.mtosAttractorState,
        timePressure
    )
}

const autoModeFeedback = applyAutomaticModeFeedback(
    name,
    evolvedDayState,
    metrics,
    truth
)

        window.mtosAutoModeFeedback = autoModeFeedback

        // ===============================
        // FORECAST VALIDATION
        // ===============================
        const baseDateUtc = new Date(Date.UTC(year, month - 1, day))

        const forecasts = makeForecastsFromWeather(
    name,
    userKin,
    weather,
    baseDateUtc,
    evolvedDayState
)

        forecasts.forEach(f => addForecast(f))

        const forecastValidation = resolveCurrentForecasts(
    name,
    userKin,
    result.attention,
    evolvedDayState
)

        const forecastStats = getForecastStats()
        window.mtosForecastStats = forecastStats

        logEvent("forecast_stats", forecastStats)

        const learningUpdate = updateSelfLearningLoop({
    name,
    dayState: evolvedDayState,
    mode: window.mtosAdaptiveMode?.mode || "UNKNOWN",
    attractorType: window.mtosAttractorState?.type || "unknown",
    forecastStats,
    autoModeFeedback
})

window.mtosLearningState = learningUpdate.state
window.mtosLearningSignal = learningUpdate.signal

if (learningUpdate.signal >= 0.20 && window.mtosAdaptiveMode?.mode) {
    registerModeFeedback(window.mtosAdaptiveMode.mode, true, evolvedDayState)
} else if (learningUpdate.signal <= -0.20 && window.mtosAdaptiveMode?.mode) {
    registerModeFeedback(window.mtosAdaptiveMode.mode, false, evolvedDayState)
}

        logEvent("day_state", {
    userKin,
    dayIndex: evolvedDayState.dayIndex,
    dayLabel: evolvedDayState.dayLabel,
    dayScore: evolvedDayState.dayScore,
    attention: evolvedDayState.attention,
    activity: evolvedDayState.activity,
    pressure: evolvedDayState.pressure,
    conflict: evolvedDayState.conflict,
    field: evolvedDayState.field,
    stability: evolvedDayState.stability
})

saveAutoDailySnapshot({
    name,
    userKin,
    todayKin,
    uiMetrics,
    dayState: evolvedDayState,
    users,
    fieldState
})

        const prevMap = {}
        prevUsers.forEach(u => {
            prevMap[u.name] = u
        })

        users = updated.map(u => {
    const prev = (prevUsers || []).find(x => x.name === u.name) || {}

    return {
        name: u.name,
        kin: Number(u.kin),
        baseKin: Number(u.baseKin ?? u.kin),
        weight: u.weight,
        location: u.location || prev.location || "",
        city: u.city || prev.city || "",
        country: u.country || prev.country || ""
    }
})

        window.currentUsers = users

        window.mtosDaySync = getDaySyncInfo(users, todayKin)

        saveNetworkState(users, memory)

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
    uiMetrics.attention,
    uiMetrics.noise,
    uiMetrics.entropy,
    uiMetrics.lyapunov,
    uiMetrics.prediction,
    uiMetrics.predictability,
    window.mtosDaySync,
    window.mtosDayState
)

        // ===============================
        // RENDER ВСЕГО
        // ===============================
        renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day)

        window._rerenderMTOS = () => {
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

                window._mtosRunCache[runtimeKey] = {
            weather,
            weatherToday,
            pressure,
            userKin,
            todayKin,
            attractorField: window._attractorField,
            dayState: window.mtosDayState,
            uiMetrics: window.mtosUnifiedMetrics,
            daySync: window.mtosDaySync,
            fieldState,
            fieldMode,
            userMeta,
            todayMeta,
            users: JSON.parse(JSON.stringify(users || []))
        }

        status.innerText = "Done"

        // ===============================
        // TIME CONTROL
        // ===============================
        let baseYear = year
        let baseMonth = month
        let baseDay = day

        let cachedBaseWeather = Array.isArray(weather) ? weather : []
        let cachedBasePressure = Array.isArray(pressure) ? pressure : []

        function step(offset) {

            const d = new Date(baseYear, baseMonth - 1, baseDay)
            d.setDate(d.getDate() + offset)

            const y = d.getFullYear()
            const m = d.getMonth() + 1
            const dd = d.getDate()

            const currentKin = JSON.parse(pyodide.runPython(`
import json, datetime
current_date = datetime.date(${y}, ${m}, ${dd})
current_kin, _, _, _ = kin_from_date(current_date)
json.dumps(current_kin)
`))

            const weather = shiftWeatherArray(cachedBaseWeather, offset)
            const pressure = cachedBasePressure

            const result = {
                weather,
                pressure,
                kin: currentKin,
                attention: 0.5,
                noise: 0.1,
                entropy: 1.2,
                lyapunov: 0.2,
                prediction: 0.5,
                predictability: 120
            }
            logEvent("time_step", {
                year: y,
                month: m,
                day: dd,
                kin: currentKin
            })

users = users.map((u) => {

    const kinForPhase = u.baseKin || u.kin

    const phaseFromWeather =
        Array.isArray(weather) && weather[kinForPhase - 1]
            ? Number(weather[kinForPhase - 1].phase ?? 0)
            : 0

    return {
        ...u,
        kin: kinForPhase,
        baseKin: kinForPhase,
        phase: phaseFromWeather
    }
})

            

            const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
            const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")

            const networkFeedback = window.mtosNetworkFeedback || {
                totalLinks: 0,
                density: 0,
                meanStrength: 0,
                conflictRatio: 0,
                supportRatio: 0
            }

            const attractorState = window.mtosAttractorState || {
                type: "unknown",
                intensity: 0,
                score: 0
            }

            const prevUsers = JSON.parse(JSON.stringify(users))
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
    ${toPython(memory)},
    ${toPython(networkFeedback)},
    ${toPython(attractorState)}
)
json.dumps([f,s,u])
`))

            fieldState = fieldResult[0]
            fieldMode = fieldResult[1]
            const updated = fieldResult[2]

            const dayState = classifyUserDay(
                currentKin,
                weather,
                pressure,
                fieldState,
                window.mtosNetworkFeedback,
                window.mtosAttractorState
            )

            const evolvedDayState = resolveDynamicDayState(
    dayState,
    window.mtosNetworkFeedback,
    window.mtosAttractorState
)

            const attractorAtUser =
                Array.isArray(window._attractorField) && userKin >= 1 && userKin <= 260
                    ? Number(window._attractorField[userKin - 1] ?? 0.5)
                    : 0.5

            evolvedDayState.attractorField = attractorAtUser
            evolvedDayState.dayIndex = Number(
                Math.max(-1, Math.min(1, evolvedDayState.dayIndex + (attractorAtUser - 0.5) * 0.25)).toFixed(3)
            )

            if (attractorAtUser > 0.72) {
                evolvedDayState.dayDesc += " Strong attractor pull is present."
            } else if (attractorAtUser < 0.28) {
                evolvedDayState.dayDesc += " Weak attractor pull reduces coherence."
            }

            window.mtosDayState = evolvedDayState
            

            const memoryLayers = updateMemoryLayers(
    name,
    currentKin,
    window.mtosDayState,
    weather,
    window._attractorField
)

window.mtosMemoryInfluence = getMemoryInfluence(name, currentKin)

const uiMetrics = buildUnifiedMetrics(result, evolvedDayState)
window.mtosUnifiedMetrics = uiMetrics

const timePressure = resolveTimePressure({
    attention: evolvedDayState.attention,
    activity: evolvedDayState.activity,
    pressure: evolvedDayState.pressure,
    conflict: evolvedDayState.conflict,
    stability: evolvedDayState.stability,
    field: evolvedDayState.field,
    entropy: uiMetrics.entropy,
    noise: uiMetrics.noise,
    prediction: uiMetrics.prediction,
    predictability: uiMetrics.predictability,
    attractorIntensity: Number(window.mtosAttractorState?.intensity ?? 0),
    networkConflict: Number(window.mtosNetworkFeedback?.conflictRatio ?? 0),
    networkDensity: Number(window.mtosNetworkFeedback?.density ?? 0)
})

window.mtosTimePressure = timePressure
window.mtosTimePressureSummary = getTimePressureSummary(timePressure)

window.mtosDayState = applyTimePressureToDayState(window.mtosDayState, timePressure)

if (window.mtosAttractorState) {
    window.mtosAttractorState = applyTimePressureToAttractorState(
        window.mtosAttractorState,
        timePressure
    )
}

const stepMetrics = computeBehaviorMetrics(window.MTOS_LOG)
const stepTruth = computeAutoTruth(stepMetrics)

const autoModeFeedback = applyAutomaticModeFeedback(
    name,
    evolvedDayState,
    stepMetrics,
    stepTruth
)

            window.mtosAutoModeFeedback = autoModeFeedback

            const baseDateUtc = new Date(Date.UTC(y, m - 1, dd))

const forecasts = makeForecastsFromWeather(
    name,
    currentKin,
    weather,
    baseDateUtc,
    evolvedDayState
)

forecasts.forEach(f => addForecast(f))

resolveCurrentForecasts(
    name,
    currentKin,
    uiMetrics.attention,
    evolvedDayState
)

const forecastStats = getForecastStats()
window.mtosForecastStats = forecastStats

const learningUpdate = updateSelfLearningLoop({
    name,
    dayState: evolvedDayState,
    mode: window.mtosAdaptiveMode?.mode || "UNKNOWN",
    attractorType: window.mtosAttractorState?.type || "unknown",
    forecastStats,
    autoModeFeedback
})

window.mtosLearningState = learningUpdate.state
window.mtosLearningSignal = learningUpdate.signal

if (learningUpdate.signal >= 0.20 && window.mtosAdaptiveMode?.mode) {
    registerModeFeedback(window.mtosAdaptiveMode.mode, true, evolvedDayState)
} else if (learningUpdate.signal <= -0.20 && window.mtosAdaptiveMode?.mode) {
    registerModeFeedback(window.mtosAdaptiveMode.mode, false, evolvedDayState)
}

            logEvent("day_state", {
    userKin: currentKin,
    dayIndex: evolvedDayState.dayIndex,
    dayLabel: evolvedDayState.dayLabel,
    dayScore: evolvedDayState.dayScore,
    attention: evolvedDayState.attention,
    activity: evolvedDayState.activity,
    pressure: evolvedDayState.pressure,
    conflict: evolvedDayState.conflict,
    field: evolvedDayState.field,
    stability: evolvedDayState.stability
})

saveAutoDailySnapshot({
    name,
    userKin,
    todayKin,
    uiMetrics,
    dayState: evolvedDayState,
    users,
    fieldState
})

            const prevMap = {}
            prevUsers.forEach(u => {
                prevMap[u.name] = u
            })

            users = updated.map(u => {

    const prev = (prevUsers || []).find(x => x.name === u.name) || {}

    const kinForPhase = Number(u.baseKin ?? u.kin)

    const phaseFromWeather =
        Array.isArray(weather) && weather[kinForPhase - 1]
            ? Number(weather[kinForPhase - 1].phase ?? 0)
            : 0

    return {
        name: u.name,
        kin: kinForPhase,
        baseKin: kinForPhase,
        weight: u.weight,
        phase: phaseFromWeather,
        location: u.location || prev.location || "",
        city: u.city || prev.city || "",
        country: u.country || prev.country || ""
    }
})
            window.currentUsers = users

            window.mtosDaySync = getDaySyncInfo(users, currentKin)

            saveNetworkState(users, memory)

            logEvent("agents_update", {
                users: users,
                fieldState: fieldState,
                weather: weather,
                pressure: pressure,
                userKin: currentKin,
                todayKin: currentKin
            })

            renderCognitiveState(
    currentKin,
    currentKin,
    uiMetrics.attention,
    uiMetrics.noise,
    uiMetrics.entropy,
    uiMetrics.lyapunov,
    uiMetrics.prediction,
    uiMetrics.predictability,
    window.mtosDaySync,
    window.mtosDayState
)

            renderAll(weather, weatherToday, pressure, currentKin, currentKin, y, m, dd)
        }

        initTimeControls(step)

    } catch (e) {
        console.error(e)
        status.innerText = "ERROR"
    }

    window.onKinSelect = (kin) => {
        logEvent("kin_select", {
            kin,
            memory: selectionMemory[KinRegistry.toIndex(kin)]
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

function renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day) {

    // WEATHER
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

    // SERIES
    const now = new Date()
    drawSeries(
        "seriesBlock",
        weatherToday,
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
    )

    // NETWORK (геометрия)
    drawNetwork(
        "networkMap",
        users,
        () => {}
    )

    // COLLECTIVE
    drawCollective(
        "collective",
        users
    )
        // ATTRACTOR 20×20 MAP
    renderAttractorOnly()
}

function getDaySyncInfo(users, todayKin) {
    const safeUsers = Array.isArray(users) ? users : []

    const exact = []
    const sameSeal = []
    const sameTone = []

    const todaySeal = ((todayKin - 1) % 20) + 1
    const todayTone = ((todayKin - 1) % 13) + 1

    safeUsers.forEach(u => {
        const kin = Number(u.kin)
        if (!Number.isFinite(kin)) return

        const seal = ((kin - 1) % 20) + 1
        const tone = ((kin - 1) % 13) + 1

        if (kin === todayKin) {
            exact.push(u)
        } else {
            if (seal === todaySeal) sameSeal.push(u)
            if (tone === todayTone) sameTone.push(u)
        }
    })

    return {
        todayKin,
        todaySeal,
        todayTone,
        exact,
        sameSeal,
        sameTone
    }
}

function formatSyncUsers(list) {
    if (!Array.isArray(list) || !list.length) return "—"

    return list
        .map(u => `${u.name} (${u.kin})`)
        .join(", ")
}
// ===============================
// UI STATE
// ===============================
function interpretMetric(name, value) {
    if (value > 0.75) return "high"
    if (value < 0.3) return "low"
    return "moderate"
}

function clampMetric(v, min = 0, max = 1) {
    const n = Number(v)
    if (!Number.isFinite(n)) return min
    return Math.max(min, Math.min(max, n))
}

function buildUnifiedMetrics(result, dayState) {
    const ds = dayState || {}
    const r = result || {}

    const attention = clampMetric(ds.attention ?? r.attention ?? 0.5, 0, 1)

    const noise = clampMetric(
        (Number(ds.conflict ?? 0) * 0.65) +
        (Number(ds.pressure ?? 0) * 0.35),
        0,
        1
    )

    const entropy = clampMetric(
        (
            Number(ds.pressure ?? 0) * 0.9 +
            Number(ds.conflict ?? 0) * 0.9 +
            (1 - Number(ds.stability ?? 0.5)) * 1.2
        ),
        0,
        1
    ) * 3.0

    const lyapunov = Number(
        (
            Number(ds.stability ?? 0.5) -
            Number(ds.pressure ?? 0) * 0.8 -
            Number(ds.conflict ?? 0) * 0.6
        ).toFixed(3)
    )

    const prediction = clampMetric(
        Number(ds.stability ?? 0.5) * 0.5 +
        Number(ds.attention ?? 0.5) * 0.35 +
        Number(ds.field ?? 0.5) * 0.15 -
        Number(ds.pressure ?? 0) * 0.2 -
        Number(ds.conflict ?? 0) * 0.1,
        0,
        1
    )

    const predictability = Math.round(
        5 + 255 * clampMetric(
            Number(ds.stability ?? 0.5) * 0.55 +
            Number(ds.attention ?? 0.5) * 0.20 +
            Number(ds.field ?? 0.5) * 0.15 -
            Number(ds.pressure ?? 0) * 0.10 -
            Number(ds.conflict ?? 0) * 0.10,
            0,
            1
        )
    )

    return {
        attention,
        noise,
        entropy,
        lyapunov,
        prediction,
        predictability
    }
}

function loadDayEvolutionMemory() {
    try {
        const raw = localStorage.getItem("mtos_day_evolution")
        const parsed = raw ? JSON.parse(raw) : null

        if (parsed && typeof parsed === "object") {
            return {
                lastLabel: typeof parsed.lastLabel === "string" ? parsed.lastLabel : "NEUTRAL",
                lastScore: Number(parsed.lastScore ?? 0),
                momentum: Number(parsed.momentum ?? 0),
                streak: Number(parsed.streak ?? 0),
                updatedAt: parsed.updatedAt || null
            }
        }
    } catch (e) {
        console.warn("day evolution memory load failed", e)
    }

    return {
        lastLabel: "NEUTRAL",
        lastScore: 0,
        momentum: 0,
        streak: 0,
        updatedAt: null
    }
}

function saveDayEvolutionMemory(state) {
    try {
        localStorage.setItem("mtos_day_evolution", JSON.stringify(state))
    } catch (e) {
        console.warn("day evolution memory save failed", e)
    }
}

function resolveDynamicDayState(dayState, networkFeedback, attractorState) {
    const ds = dayState ? { ...dayState } : {}

    const attention = Number(ds.attention ?? 0.5)
    const activity = Number(ds.activity ?? attention)
    const pressure = Number(ds.pressure ?? 0)
    const conflict = Number(ds.conflict ?? 0)
    const stability = Number(ds.stability ?? 0.5)
    const field = Number(ds.field ?? 0.5)

    const network = networkFeedback || {
        density: 0,
        meanStrength: 0,
        conflictRatio: 0,
        supportRatio: 0
    }

    const attractor = attractorState || {
        type: "unknown",
        intensity: 0,
        score: 0
    }

    const memory = loadDayEvolutionMemory()

    let score =
        attention * 0.28 +
        activity * 0.18 +
        stability * 0.22 +
        field * 0.16 -
        pressure * 0.22 -
        conflict * 0.18

    score += Number(network.supportRatio ?? 0) * 0.12
    score -= Number(network.conflictRatio ?? 0) * 0.16
    score += Number(network.meanStrength ?? 0) * 0.05

    if (attractor.type === "cycle") score += 0.08 * Number(attractor.intensity ?? 0)
    if (attractor.type === "stable") score += 0.06 * Number(attractor.intensity ?? 0)
    if (attractor.type === "chaos") score -= 0.14 * Number(attractor.intensity ?? 0)
    if (attractor.type === "trend") score += 0.03 * Number(attractor.intensity ?? 0)

    const rawScore = score

    const memoryInfluence = getMemoryInfluence(
    document.getElementById("name")?.value?.trim() || "",
    window._userKin || 1
)

score += memoryInfluence.seal * 0.10
score += memoryInfluence.kin * 0.14
score += memoryInfluence.user * 0.16

    const delta = rawScore - Number(memory.lastScore ?? 0)
    const momentum = Number(
        (
            Number(memory.momentum ?? 0) * 0.55 +
            delta * 0.45
        ).toFixed(4)
    )

    score += momentum * 0.7

    let label = "NEUTRAL"

    if (score >= 0.34) label = "FOCUS"
    else if (score >= 0.12) label = "FLOW"
    else if (score <= -0.34) label = "RECOVERY"
    else if (score <= -0.14) label = "FATIGUE"

    if (
        conflict >= 0.48 ||
        pressure >= 0.68 ||
        attractor.type === "chaos"
    ) {
        if (score < 0.20) {
            label = "RECOVERY"
        }
    }

    if (
        attention >= 0.72 &&
        stability >= 0.64 &&
        conflict <= 0.22 &&
        pressure <= 0.42
    ) {
        label = "FOCUS"
    }

    if (
        field >= 0.58 &&
        attention >= 0.48 &&
        attention <= 0.72 &&
        pressure <= 0.52 &&
        conflict <= 0.32 &&
        label === "NEUTRAL"
    ) {
        label = "FLOW"
    }

    if (
        pressure >= 0.62 &&
        stability <= 0.42 &&
        label !== "RECOVERY"
    ) {
        label = "FATIGUE"
    }

    let streak = 1
    if (memory.lastLabel === label) {
        streak = Number(memory.streak ?? 0) + 1
    }

    const evolved = {
        ...ds,
        rawDayScore: Number(rawScore.toFixed(3)),
        dayScore: Number(score.toFixed(3)),
        momentum: Number(momentum.toFixed(3)),
        dayLabel: label,
        dayIndex: Number(Math.max(-1, Math.min(1, score)).toFixed(3))
    }

    const descMap = {
        FOCUS: "High coherence. Best for execution and decisive work.",
        FLOW: "Constructive open movement. Good for exploration and synthesis.",
        NEUTRAL: "Balanced but not strongly directed. Good for maintenance.",
        FATIGUE: "Load exceeds productive stability. Reduce pressure.",
        RECOVERY: "System is restoring integrity. Avoid force."
    }

    evolved.dayDesc = descMap[label]

    const colorMap = {
        FOCUS: "#00ff88",
        FLOW: "#66ccff",
        NEUTRAL: "#bbbbbb",
        FATIGUE: "#ffb347",
        RECOVERY: "#ff6666"
    }

    evolved.dayColor = colorMap[label]

    saveDayEvolutionMemory({
        lastLabel: label,
        lastScore: evolved.dayScore,
        momentum,
        streak,
        updatedAt: new Date().toISOString()
    })

    evolved.streak = streak

    return evolved
}

function renderCognitiveState(
    userKin,
    todayKin,
    attention,
    noise,
    entropy,
    lyapunov,
    prediction,
    predictability,
    sync,
    ds
){
    const el = document.getElementById("todayBlock")
    const quick = document.getElementById("quickMetrics")

    if(!el) return

    if(!ds){
        el.innerHTML = `<div class="hero-card"><div class="hero-main">NO DATA</div></div>`
        if(quick) quick.innerHTML = ""
        return
    }

    const userMeta = window.mtosUserMeta || {
        kin: userKin,
        tone: ((userKin - 1) % 13) + 1,
        seal: "Unknown",
        sealIndex: ((userKin - 1) % 20) + 1
    }

    const todayMeta = window.mtosTodayMeta || {
        kin: todayKin,
        tone: ((todayKin - 1) % 13) + 1,
        seal: "Unknown",
        sealIndex: ((todayKin - 1) % 20) + 1
    }

    const label = ds.dayLabel || "UNKNOWN"
    const mode = getRecommendedMode(ds)
    const desc = getModeDescription(mode)
    const guide = getModeActionGuide(mode)
    const explanation = getDayExplanation(ds)
    const decision = getDecisionOutput(ds)
    const auto = window.mtosAutoModeFeedback || {}
    const mem = window.mtosMemoryInfluence || { seal: 0, kin: 0, user: 0, total: 0 }

        const scientific = getScientificConfidence(ds, {
        attention,
        noise,
        entropy,
        lyapunov,
        prediction,
        predictability
    })

    const scientificWhy = getScientificExplanation(ds, {
        attention,
        noise,
        entropy,
        lyapunov,
        prediction,
        predictability
    })

    const validation = getScientificValidation()

    const learning = getLearningSummary()

    el.innerHTML = `
<div class="hero-grid">

    <div class="hero-card">
        <div class="hero-label">USER</div>
        <div class="hero-main">Kin ${safeNum(userMeta.kin, userKin)}</div>
        <div class="hero-sub">
            ${safeText(userMeta.seal, "Unknown")} · Tone ${safeNum(userMeta.tone, ((userKin - 1) % 13) + 1)}<br>
            Seal #${safeNum(userMeta.sealIndex, ((userKin - 1) % 20) + 1)}
        </div>
    </div>

    <div class="hero-card">
        <div class="hero-label">TODAY</div>
        <div class="hero-main">Kin ${safeNum(todayMeta.kin, todayKin)}</div>
        <div class="hero-sub">
            ${safeText(todayMeta.seal, "Unknown")} · Tone ${safeNum(todayMeta.tone, ((todayKin - 1) % 13) + 1)}<br>
            Seal #${safeNum(todayMeta.sealIndex, ((todayKin - 1) % 20) + 1)}
        </div>
    </div>

    <div class="hero-card">
        <div class="hero-label">DAY STATE</div>
        <div class="hero-main" style="color:${safeText(ds.dayColor, "#00ff88")}">
            ${safeText(label, "UNKNOWN")} → ${safeText(mode, "UNKNOWN")}
        </div>
        <div class="hero-sub">
            ${safeText(desc, "No description")}<br>
            ${safeText(ds.dayDesc, "No state description")}<br>
            Attractor: ${getAttractorLabel()}
        </div>
    </div>
</div>

<div class="decision-box">
    <div class="decision-title">TODAY DECISION OUTPUT</div>
    <div class="decision-main">${safeText(decision.text, "NO DATA")}</div>
    <div class="decision-sub">
        Confidence: ${safeNum(decision.confidence, 0).toFixed(2)}
        · Scientific confidence: ${scientific.value.toFixed(2)}
        · Calibration: ${scientific.calibration}
        · Auto-feedback: ${safeText(auto.label ?? auto.result ?? "unknown", "unknown")}
    </div>

    <div class="hero-notes">
        <div class="hero-note"><b>Do:</b> ${safeText(guide.doText, "—")}</div>
        <div class="hero-note"><b>Avoid:</b> ${safeText(guide.avoidText, "—")}</div>
        <div class="hero-note"><b>Risk:</b> ${safeText(guide.riskText, "—")}</div>
        <div class="hero-note"><b>Why:</b> ${safeText(explanation, "—")}</div>
        <div class="hero-note"><b>Memory:</b> seal ${safeNum(mem.seal, 0).toFixed(2)} · kin ${safeNum(mem.kin, 0).toFixed(2)} · user ${safeNum(mem.user, 0).toFixed(2)}</div>
    </div>
</div>

<div class="decision-box" style="margin-top:12px;">
    <div class="decision-title">MODEL EXPLANATION</div>
    <div class="hero-notes">
        ${scientificWhy.map(line => `<div class="hero-note">• ${line}</div>`).join("")}
    </div>
</div>

<div class="decision-box" style="margin-top:12px;">
    <div class="decision-title">VALIDATION</div>
    <div class="hero-notes">
        <div class="hero-note"><b>Forecasts:</b> total ${validation.total} · resolved ${validation.resolved} · pending ${validation.pending}</div>
        <div class="hero-note"><b>Accuracy:</b> ${validation.correct}/${validation.resolved || 0} · hit rate ${validation.hitRate.toFixed(2)}</div>
        <div class="hero-note"><b>Auto-evaluation:</b> ${validation.autoFeedback}</div>
        <div class="hero-note"><b>Predictability horizon:</b> ${safeNum(predictability, 0)}</div>
    </div>

    <div class="decision-box" style="margin-top:12px;">
    <div class="decision-title">SELF-LEARNING LOOP</div>
    <div class="hero-notes">
        <div class="hero-note"><b>Total learning steps:</b> ${learning.total}</div>
        <div class="hero-note"><b>Successful:</b> ${learning.ok}</div>
        <div class="hero-note"><b>Failed:</b> ${learning.bad}</div>
        <div class="hero-note"><b>Learning rate:</b> ${learning.rate.toFixed(2)}</div>
        <div class="hero-note"><b>Current learning signal:</b> ${safeNum(window.mtosLearningSignal ?? 0, 0).toFixed(2)}</div>
    </div>
</div>
</div>
`

    if(quick){
    quick.innerHTML = `
        <div class="metric-card">
            <div class="metric-label">ATTENTION</div>
            <div class="metric-value">${attention.toFixed(2)}</div>
            <div class="metric-sub">${interpretAttention(attention)}</div>
        </div>

        <div class="metric-card">
            <div class="metric-label">NOISE / PRESSURE</div>
            <div class="metric-value">${noise.toFixed(2)}</div>
            <div class="metric-sub">${interpretNoise(noise)}</div>
        </div>

        <div class="metric-card">
            <div class="metric-label">ENTROPY / λ</div>
            <div class="metric-value">${entropy.toFixed(2)}</div>
            <div class="metric-sub">
                ${getEntropyDescription(entropy)} · λ ${lyapunov.toFixed(3)}
            </div>
        </div>

        <div class="metric-card">
            <div class="metric-label">PREDICTABILITY</div>
            <div class="metric-value">${predictability}</div>
            <div class="metric-sub">
                ${interpretPredictability(predictability)} · prediction ${prediction.toFixed(2)}
            </div>
        </div>

        <div class="metric-card">
            <div class="metric-label">TIME PRESSURE</div>
            <div class="metric-value">${(window.mtosTimePressureSummary?.value ?? 0).toFixed(2)}</div>
            <div class="metric-sub">
                ${(window.mtosTimePressureSummary?.label ?? "low")} · ${(window.mtosTimePressureSummary?.temporalMode ?? "EXPLORE")}
            </div>
        </div>

        <div class="metric-card">
            <div class="metric-label">MODEL VALIDATION</div>
            <div class="metric-value">${scientific.hitRate.toFixed(2)}</div>
            <div class="metric-sub">
                ${scientific.correct}/${scientific.resolved} resolved · calibration ${scientific.calibration}
            </div>
        </div>
    `
}
}

function getEntropyDescription(e) {

        if (e > 2.5) return "high chaos, low structure"
        if (e > 2.0) return "dynamic system, flexible"
        if (e > 1.5) return "moderate complexity"
        if (e > 1.0) return "structured, stable"

        return "low entropy, rigid system"
    }

    const SEALS = [
        "Dragon", "Wind", "Night", "Seed", "Serpent",
        "Worldbridger", "Hand", "Star", "Moon", "Dog",
        "Monkey", "Human", "Skywalker", "Wizard", "Eagle",
        "Warrior", "Earth", "Mirror", "Storm", "Sun"
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

    function interpretAttention(a) {
        if (a > 0.7) return "high focus, stable attention"
        if (a < 0.4) return "low focus, scattered attention"
        return "balanced attention"
    }

    function interpretNoise(n) {
        if (n < 0.1) return "low noise, stable system"
        if (n > 0.3) return "high noise, unstable dynamics"
        return "moderate variability"
    }

    function interpretLyapunov(l) {
        if (l < 0.05) return "high stability"
        if (l > 0.2) return "chaotic behavior"
        return "sensitive but controlled"
    }

    function interpretPrediction(p) {
        if (p > 0.7) return "high predictability"
        if (p < 0.4) return "low predictability"
        return "moderate predictability"
    }

    function interpretPredictability(days) {
        if (days > 200) return "long stable horizon"
        if (days < 50) return "short unstable horizon"
        return "medium-term stability"
    }

    // ===============================
    // FIELD MODE UI
    // ===============================

    window.setFieldMode = (mode) => {

        window.fieldMode = mode

        const buttons = ["btnActivity", "btnPressure", "btnHybrid", "btnLandscape", "btnAttractor"]

        buttons.forEach(id => {
            const b = document.getElementById(id)
            if (b) {
                b.style.background = "#111"
                b.style.color = "#fff"
            }
        })

        const activeMap = {
            activity: "btnActivity",
            pressure: "btnPressure",
            hybrid: "btnHybrid",
            landscape: "btnLandscape",
            attractor: "btnAttractor"
        }

        const active = document.getElementById(activeMap[mode])

        if (active) {
            active.style.background = "#00ff88"
            active.style.color = "#000"
        }

        if (window._weather) {
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

    window.setFieldViewMode = (view) => {
        window.fieldViewMode = view

        const buttons = ["btnViewGrid", "btnViewLinear", "btnViewTorus"]

        buttons.forEach(id => {
            const b = document.getElementById(id)
            if (b) {
                b.style.background = "#111"
                b.style.color = "#fff"
            }
        })

        const activeMap = {
            grid: "btnViewGrid",
            linear: "btnViewLinear",
            torus: "btnViewTorus"
        }

        const active = document.getElementById(activeMap[view])

        if (active) {
            active.style.background = "#00ff88"
            active.style.color = "#000"
        }

        if (window._weather) {
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

    function analyzeInteractions(matrix, seal) {

        const size = 20
        const start = seal * size
        const row = matrix.slice(start, start + size)

        const ranked = row
            .map((v, i) => ({ seal: i, value: v }))
            .sort((a, b) => b.value - a.value)

        return {
            best: ranked.slice(0, 3),
            worst: ranked.slice(-3).reverse()
        }
    }

    window.setNetworkMode = (mode) => {

    window.networkMode = (mode === "edit") ? "edit" : "interaction"

    const btn = document.getElementById("modeEdit")
    if (btn) {
        const isEdit = window.networkMode === "edit"
        btn.style.background = isEdit ? "#00ff88" : "#111"
        btn.style.color = isEdit ? "#000" : "#fff"
    }

    if (window._weather) {
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

function buildDailyArchetypePolarity(todayKin, weather, attractorField) {
    const todaySeal = (todayKin - 1) % 20
    const todayTone = (todayKin - 1) % 13

    const polarity = new Array(20).fill(0).map((_, seal) => {
        let sum = 0
        let count = 0

        for (let tone = 0; tone < 13; tone++) {
            let kin = seal * 13 + tone + 1
            while (kin > 260) kin -= 260

            const i = kin - 1
            const w = weather?.[i] || {}
            const attention = Number(w.attention ?? 0.5)
            const activity = Number(w.activity ?? attention)
            const pressure = Number(w.pressure ?? 0)
            const conflict = Number(w.conflict ?? 0)
            const attractor = Array.isArray(attractorField)
                ? Number(attractorField[i] ?? 0.5)
                : 0.5

            let v =
                attention * 0.24 +
                activity * 0.22 +
                attractor * 0.24 -
                pressure * 0.18 -
                conflict * 0.12

            const sealDistance = Math.min(
                Math.abs(seal - todaySeal),
                20 - Math.abs(seal - todaySeal)
            )

            const toneDistance = Math.min(
                Math.abs(tone - todayTone),
                13 - Math.abs(tone - todayTone)
            )

            const dayResonance =
                (1 - sealDistance / 10) * 0.18 +
                (1 - toneDistance / 6.5) * 0.10

            v += dayResonance

            sum += v
            count++
        }

        const avg = count ? sum / count : 0
        return Number(Math.max(-1, Math.min(1, (avg - 0.35) * 1.9)).toFixed(3))
    })

    window.mtosArchetypePolarity = polarity
    return polarity
}

function buildTodayInfluenceMatrix(userKin, users) {
    const size = 20
    const matrix = new Array(size * size).fill(0.5)

    const relationMemory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const memoryLayers = window.mtosMemoryLayers || loadMemoryLayers()
    if (!memoryLayers.pairMemory || typeof memoryLayers.pairMemory !== "object") {
        memoryLayers.pairMemory = {}
    }
    const userName = document.getElementById("name")?.value?.trim() || ""

    const userSeal = (userKin - 1) % 20
    const memoryInfluence = getMemoryInfluence(userName, userKin)

    const polarity = buildDailyArchetypePolarity(
        window._todayKin,
        window._weather,
        window._attractorField
    )

    const attractorAtUser = Array.isArray(window._attractorField)
        ? Number(window._attractorField[userKin - 1] ?? 0.5)
        : 0.5

    const networkFeedback = window.mtosNetworkFeedback || {
        density: 0,
        meanStrength: 0,
        conflictRatio: 0,
        supportRatio: 0
    }

    for (let colSeal = 0; colSeal < 20; colSeal++) {
        let supportSum = 0
        let conflictSum = 0
        let count = 0
        let members = []

        for (const u of (users || [])) {
            if (!u || !Number.isFinite(Number(u.kin))) continue

            const uSeal = (Number(u.kin) - 1) % 20
            if (uSeal !== colSeal) continue
            if (u.name === userName) continue

            const key1 = `${userName}->${u.name}`
            const key2 = `${u.name}->${userName}`

            const s1 = Number(relationMemory[key1] ?? 0)
const s2 = Number(relationMemory[key2] ?? 0)
const rel = (s1 + s2) / 2

const userObj = (users || []).find(x => x.name === userName) || null
const targetObj = u || null

const userPhase = Number(userObj?.phase ?? 0)
const targetPhase = Number(targetObj?.phase ?? 0)

const phaseLink = phaseLinkMod(userPhase, targetPhase)

// phase-aware relation
const relPhaseAdjusted =
    rel * (1 + phaseLink.align * 0.35)

            const pairKey = [userName, u.name].sort().join("::")
if(!memoryLayers.pairMemory[pairKey]){
    memoryLayers.pairMemory[pairKey] = 0
}
memoryLayers.pairMemory[pairKey] =
    Math.max(-1, Math.min(1,
        Number(memoryLayers.pairMemory[pairKey]) * 0.98 + rel * 0.02
    ))

            if (relPhaseAdjusted >= 0) {
    supportSum += relPhaseAdjusted + phaseLink.supportBoost * 0.12
} else {
    conflictSum += Math.abs(relPhaseAdjusted) + phaseLink.conflictBoost * 0.12
}

            count++
            members.push({
    name: u.name,
    kin: Number(u.kin),
    score: relPhaseAdjusted,
    rawScore: rel,
    phase: targetPhase,
    phaseDelta: Number(phaseLink.delta.toFixed(3)),
    phaseAlign: Number(phaseLink.align.toFixed(3))
})
        }

        const supportAvg = count ? supportSum / count : 0
        const conflictAvg = count ? conflictSum / count : 0

        const userPolarity = Number(polarity[userSeal] ?? 0)
const targetPolarity = Number(polarity[colSeal] ?? 0)
const polarityAlignment = 1 - Math.min(2, Math.abs(userPolarity - targetPolarity)) / 2
const polarityTension = Math.abs(userPolarity - targetPolarity)

const sealMemoryValue = Number(memoryLayers.sealMemory[colSeal] ?? 0)
const userMemoryValue = Number(memoryInfluence.user ?? 0)
const kinMemoryValue = Number(memoryInfluence.kin ?? 0)

const fieldKin = ((colSeal * 13) % 260)
const fieldMemoryValue = Number(memoryLayers.fieldMemory[fieldKin] ?? 0)

let phaseSupportMean = 0
let phaseConflictMean = 0

if (members.length) {
    phaseSupportMean =
        members.reduce((sum, m) => sum + Math.max(0, Number(m.phaseAlign ?? 0)), 0) / members.length

    phaseConflictMean =
        members.reduce((sum, m) => sum + Math.max(0, -Number(m.phaseAlign ?? 0)), 0) / members.length
}

let v =
    0.5 +
    supportAvg * 0.22 -
    conflictAvg * 0.24 +
    phaseSupportMean * 0.14 -
    phaseConflictMean * 0.16 +
    (attractorAtUser - 0.5) * 0.12 +
    networkFeedback.supportRatio * 0.08 -
    networkFeedback.conflictRatio * 0.10 +
    targetPolarity * 0.16 +
    polarityAlignment * 0.08 -
    polarityTension * 0.10 +
    sealMemoryValue * 0.14 +
    userMemoryValue * 0.08 +
    kinMemoryValue * 0.06 +
    fieldMemoryValue * 0.10

        v = Math.max(0, Math.min(1, v))

        matrix[userSeal * size + colSeal] = v

        // симметрия, если хочешь видеть и обратное влияние
        matrix[colSeal * size + userSeal] = v

        // сохраняем детали для tooltip
        window._todaySealInfluence = window._todaySealInfluence || {}
        window._todaySealInfluence[colSeal] = {
    value: v,
    supportAvg,
    conflictAvg,
    count,
    members,
    phaseSupportMean: Number(phaseSupportMean.toFixed(3)),
    phaseConflictMean: Number(phaseConflictMean.toFixed(3)),
    polarity: Number(targetPolarity.toFixed(3)),
    userPolarity: Number(userPolarity.toFixed(3)),
    polarityAlignment: Number(polarityAlignment.toFixed(3)),
    polarityTension: Number(polarityTension.toFixed(3))
}
    }

    saveMemoryLayers(memoryLayers)
    window.mtosMemoryLayers = memoryLayers

    return matrix
}

function buildDecisionRecommendations(userKin, users) {

    const influence = window._todaySealInfluence || {}
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const userName = document.getElementById("name")?.value?.trim() || ""

    const results = []

    for (let seal = 0; seal < 20; seal++) {

        const info = influence[seal]
        if (!info || !info.members.length) continue

        let score = info.value

        // усиливаем через реальные связи
        let networkBoost = 0

        for (const m of info.members) {

            const key1 = `${userName}->${m.name}`
            const key2 = `${m.name}->${userName}`

            const rel = (Number(memory[key1] ?? 0) + Number(memory[key2] ?? 0)) / 2

            networkBoost += rel
        }

        networkBoost /= info.members.length || 1

        const finalScore = score + networkBoost * 0.3

        results.push({
            seal,
            value: finalScore,
            members: info.members
        })
    }

    results.sort((a, b) => b.value - a.value)

    return {
        best: results.slice(0, 3),
        worst: results.slice(-3).reverse()
    }
}

function getAttractorSummaryForUser(activeKin, users){
    const decisions = buildDecisionRecommendations(activeKin, users)
    const attractor = window.mtosAttractorState || { type: "unknown", intensity: 0, score: 0 }
    const tp = window.mtosTimePressureSummary || { value: 0, label: "low", temporalMode: "EXPLORE" }

    const bestSeals = decisions.best.map(x => ({
        seal: SEALS[x.seal],
        score: Number(x.value.toFixed(2)),
        members: x.members.map(m => m.name)
    }))

    const worstSeals = decisions.worst.map(x => ({
        seal: SEALS[x.seal],
        score: Number(x.value.toFixed(2)),
        members: x.members.map(m => m.name)
    }))

    const bestPeople = []
    const worstPeople = []

    decisions.best.forEach(x => {
        x.members.forEach(m => {
            bestPeople.push({
                name: m.name,
                kin: m.kin,
                score: Number((m.score ?? x.value).toFixed(2))
            })
        })
    })

    decisions.worst.forEach(x => {
        x.members.forEach(m => {
            worstPeople.push({
                name: m.name,
                kin: m.kin,
                score: Number((m.score ?? x.value).toFixed(2))
            })
        })
    })

    bestPeople.sort((a, b) => b.score - a.score)
    worstPeople.sort((a, b) => a.score - b.score)

    return {
        bestSeals: bestSeals.slice(0, 3),
        worstSeals: worstSeals.slice(0, 3),
        bestPeople: bestPeople.slice(0, 3),
        worstPeople: worstPeople.slice(0, 3),
        attractorType: attractor.type,
        attractorIntensity: Number((attractor.intensity ?? 0).toFixed(2)),
        timePressure: Number((tp.value ?? 0).toFixed(2)),
        timePressureLabel: tp.label || "low",
        temporalMode: tp.temporalMode || "EXPLORE"
    }
}

function renderAttractorDecisionBoard(targetId, summary){
    const el = document.getElementById(targetId)
    if(!el) return

    const positiveSeals = summary.bestSeals.length
        ? summary.bestSeals.map(x => `
            <div class="attr-item positive">
                <div class="attr-name">${x.seal}</div>
                <div class="attr-meta">${x.members.join(", ") || "—"}</div>
            </div>
        `).join("")
        : `<div class="attr-empty">Нет данных</div>`

    const negativeSeals = summary.worstSeals.length
        ? summary.worstSeals.map(x => `
            <div class="attr-item negative">
                <div class="attr-name">${x.seal}</div>
                <div class="attr-meta">${x.members.join(", ") || "—"}</div>
            </div>
        `).join("")
        : `<div class="attr-empty">Нет данных</div>`

    const positivePeople = summary.bestPeople.length
        ? summary.bestPeople.map(x => `
            <div class="attr-item positive">
                <div class="attr-name">${x.name}</div>
                <div class="attr-meta">Kin ${x.kin}</div>
            </div>
        `).join("")
        : `<div class="attr-empty">Нет данных</div>`

    const negativePeople = summary.worstPeople.length
        ? summary.worstPeople.map(x => `
            <div class="attr-item negative">
                <div class="attr-name">${x.name}</div>
                <div class="attr-meta">Kin ${x.kin}</div>
            </div>
        `).join("")
        : `<div class="attr-empty">Нет данных</div>`

    const attractorTypeMap = {
    stable: "stable field",
    cycle: "cyclic pattern",
    trend: "directed flow",
    chaos: "unstable field",
    unknown: "undefined",
    undefined: "undefined"
}

const timePressureText =
    summary.timePressure < 0.34 ? "low" :
    summary.timePressure < 0.62 ? "medium" :
    summary.timePressure < 0.82 ? "high" :
    "critical"

const modeTextMap = {
    EXPLORE: "exploration",
    FOCUS: "focused execution",
    FLOW: "natural flow",
    CRISIS: "overload state"
}

const shortAdvice =
    summary.timePressure >= 0.62
        ? "Reduce spread. Stay with stable connections and avoid unnecessary actions."
        : "Good moment to explore, reinforce useful connections and try new paths."

    el.innerHTML = `
        <div class="attr-panel">
            <div class="attr-header">
                <div class="attr-headline">Today's Interaction Panel</div>
                <div class="attr-subline">
                    Field: <b>${attractorTypeMap[summary.attractorType] || summary.attractorType}</b> ·
                    Time pressure: <b>${timePressureText}</b> ·
                    Mode: <b>${modeTextMap[summary.temporalMode] || summary.temporalMode}</b>
                </div>
            </div>

            <div class="attr-advice">
                ${shortAdvice}
            </div>

            <div class="attr-sections">
                <div class="attr-box">
                    <div class="attr-title positive-title">Positive zones</div>
                    ${positiveSeals}
                </div>

                <div class="attr-box">
                    <div class="attr-title negative-title">Risk zones</div>
                    ${negativeSeals}
                </div>

                <div class="attr-box">
                    <div class="attr-title positive-title">Best connections</div>
                    ${positivePeople}
                </div>

                <div class="attr-box">
                    <div class="attr-title negative-title">Avoid interactions</div>
                    ${negativePeople}
                </div>
            </div>
        </div>
    `
}

    function renderAttractorOnly() {
    const mapEl = document.getElementById("attractorMap")
    const panelEl = document.getElementById("interactionAnalysis")

    if (!mapEl || !panelEl) return
    if (!window._weather) return

    const activeKin = selectedKin || window._userKin
    if (!activeKin) {
        mapEl.innerHTML = ""
        panelEl.innerHTML = ""
        return
    }

    const matrix = buildTodayInfluenceMatrix(activeKin, users)
    window._matrix = matrix

    // полностью скрываем старую карту/движок
    mapEl.innerHTML = ""
    mapEl.style.display = "none"

    const summary = getAttractorSummaryForUser(activeKin, users)
    renderAttractorDecisionBoard("interactionAnalysis", summary)
}

    function updateFieldLegend(mode) {
        const el = document.getElementById("fieldLegend")
        if (!el) return

        const modeTitle = {
            activity: "Activity",
            pressure: "Pressure",
            global: "Global",
            hybrid: "Hybrid",
            landscape: "Landscape",
            attractor: "Attractor Field"
        }[mode] || "Global"

        const modeText = {
            activity: "Shows where attention and activation are alive.",
            pressure: "Shows where tension, overload, and conflict accumulate.",
            hybrid: "Shows the strongest combined zones of the system.",
            landscape: "Shows the field itself, independent of participants.",
            attractor: "Shows where attention is naturally pulled."
        }[mode] || "Global mode reads the field as participant distribution across kin."

        el.innerHTML = `
    <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        text-align:center;
    ">
    
    <div style="margin-bottom:8px;"><b>About Field</b></div>
    
    <div style="margin-bottom:8px; max-width:700px;">
        Field is a 13×20 toroidal kin map (260 states). Each cell is one kin.
        The sequence is not linear: kin moves diagonally and wraps across the edges.
        The right edge connects to the left, and the bottom connects to the top, so the structure behaves like a torus.
    </div>

    <div style="margin-bottom:8px; max-width:700px;">
        <b>How to read the map</b><br>
        • Fill color = participant density in the kin.<br>
        • Inner frame = state type derived from real field/weather values.<br>
        • White outer frame = selected kin.<br>
        • Number inside cell = participant count.<br>
        • Dashed diagonal = 20-kin toroidal trace (10 back, selected, 9 forward).<br>
        • Click a kin to see full information about the people and values inside it.
    </div>

    <div style="margin-bottom:8px;">
        <b>Current mode: ${modeTitle}</b><br>
        ${modeText}
    </div>

    <div style="max-width:700px;">
        <b>State types</b><br>
        <span style="color:#22c55e;">Cluster</span> — dense multi-user concentration.<br>
        <span style="color:#ef4444;">Pressure</span> — high pressure / conflict / tension.<br>
        <span style="color:#38bdf8;">Active</span> — high attention / activation.<br>
        <span style="color:#a855f7;">Resonance</span> — strong hybrid combination.<br>
        <span style="color:#f59e0b;">Stable</span> — neutral stable presence.<br>
        <span style="color:#ffffff;">Event</span> — spike / threshold event.
    </div>

    </div>
    `
    }

    function hashCode(str) {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i)
            hash |= 0
        }
        return hash
    }

    function computeBehaviorMetrics(log) {
        const safeLog = Array.isArray(log) ? log : []

        const now = Date.now()
        const dayAgo = now - 24 * 60 * 60 * 1000

        const recent = safeLog.filter(e => e && e.t > dayAgo)

        let runCount = 0
        let interactions = 0
        let kinSelects = 0
        let timeSteps = 0

        for (const e of recent) {
            if (e.type === "run_start") runCount++

            if (
                e.type === "interaction" ||
                e.type === "kin_select" ||
                e.type === "time_step"
            ) {
                interactions++
            }

            if (e.type === "kin_select") kinSelects++
            if (e.type === "time_step") timeSteps++
        }

        return {
            runCount,
            interactions,
            kinSelects,
            timeSteps
        }
    }

    function computeAutoTruth(metrics) {

        const chaotic = metrics.interactions > 20
        const lowActivity = metrics.runCount <= 1 && metrics.interactions < 3
        const overload = metrics.interactions > 60
        const exploratory = metrics.kinSelects > 10 || metrics.timeSteps > 10

        const unstable =
            overload ||
            chaotic ||
            lowActivity

        return {
            unstable,
            chaotic,
            lowActivity,
            overload,
            exploratory
        }
    }

    const MODE_ADAPT_KEY = "mtos_mode_adaptation"

    function loadModeAdaptation() {
        try {
            const raw = localStorage.getItem(MODE_ADAPT_KEY)
            const parsed = raw ? JSON.parse(raw) : null

            if (parsed && typeof parsed === "object") {
                return {
                    focusBias: Number(parsed.focusBias ?? 0),
                    restBias: Number(parsed.restBias ?? 0),
                    exploreBias: Number(parsed.exploreBias ?? 0),
                    interactBias: Number(parsed.interactBias ?? 0),
                    history: Array.isArray(parsed.history) ? parsed.history : []
                }
            }
        } catch (e) {
            console.warn("Mode adaptation load failed", e)
        }

        return {
            focusBias: 0,
            restBias: 0,
            exploreBias: 0,
            interactBias: 0,
            history: []
        }
    }

    function saveModeAdaptation(state) {
        try {
            localStorage.setItem(MODE_ADAPT_KEY, JSON.stringify(state))
        } catch (e) {
            console.warn("Mode adaptation save failed", e)
        }
    }

    function clampBias(v) {
        return Math.max(-0.25, Math.min(0.25, Number(v) || 0))
    }

    function getAdaptiveRecommendedMode(ds) {
        const adapt = loadModeAdaptation()
        const attractor = Number(ds.attractorField ?? 0.5)

        const scores = {
            REST:
                (ds.pressure * 0.9) +
                ((1 - ds.stability) * 0.8) +
                (ds.conflict * 0.2) +
                adapt.restBias,

            INTERACT:
                (ds.conflict * 0.95) +
                (ds.field * 0.35) +
                (attractor * 0.15) +
                adapt.interactBias,

            FOCUS:
                (ds.attention * 0.9) +
                (ds.stability * 0.7) +
                (attractor * 0.45) -
                (ds.pressure * 0.45) -
                (ds.conflict * 0.25) +
                adapt.focusBias,

            EXPLORE:
                (ds.field * 0.7) +
                (attractor * 0.65) +
                ((1 - Math.abs(ds.attention - 0.58)) * 0.25) -
                (ds.pressure * 0.2) +
                adapt.exploreBias
        }

        const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
        const mode = ranked[0][0]

        return {
            mode,
            scores,
            adaptation: adapt
        }
    }

    function registerModeFeedback(mode, wasHelpful, ds) {
        const adapt = loadModeAdaptation()

        const delta = wasHelpful ? 0.025 : -0.025

        if (mode === "FOCUS") adapt.focusBias = clampBias(adapt.focusBias + delta)
        if (mode === "REST") adapt.restBias = clampBias(adapt.restBias + delta)
        if (mode === "EXPLORE") adapt.exploreBias = clampBias(adapt.exploreBias + delta)
        if (mode === "INTERACT") adapt.interactBias = clampBias(adapt.interactBias + delta)

        adapt.history.push({
            t: Date.now(),
            mode,
            wasHelpful: !!wasHelpful,
            attention: Number(ds?.attention ?? 0.5),
            activity: Number(ds?.activity ?? 0.5),
            pressure: Number(ds?.pressure ?? 0),
            conflict: Number(ds?.conflict ?? 0),
            field: Number(ds?.field ?? 0.5),
            stability: Number(ds?.stability ?? 0.5),
            attractorField: Number(ds?.attractorField ?? 0.5)
        })

        if (adapt.history.length > 300) {
            adapt.history.shift()
        }

        saveModeAdaptation(adapt)
        window.mtosModeAdaptation = adapt

        logEvent("mode_feedback", {
            mode,
            wasHelpful: !!wasHelpful,
            focusBias: adapt.focusBias,
            restBias: adapt.restBias,
            exploreBias: adapt.exploreBias,
            interactBias: adapt.interactBias
        })
    }

    window.registerModeFeedback = function (wasHelpful) {
        const ds = window.mtosDayState || null
        const adaptive = window.mtosAdaptiveMode || null
        const mode = adaptive?.mode || getRecommendedMode(ds || {})

        registerModeFeedback(mode, wasHelpful, ds)

        if (window._weather) {
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

    const AUTO_MODE_FEEDBACK_KEY = "mtos_auto_mode_feedback"

    function loadAutoModeFeedbackState() {
        try {
            const raw = localStorage.getItem(AUTO_MODE_FEEDBACK_KEY)
            const parsed = raw ? JSON.parse(raw) : null
            if (parsed && typeof parsed === "object") {
                return parsed
            }
        } catch (e) {
            console.warn("Auto mode feedback load failed", e)
        }

        return {
            lastStamp: null,
            lastResult: null
        }
    }

    function saveAutoModeFeedbackState(state) {
        try {
            localStorage.setItem(AUTO_MODE_FEEDBACK_KEY, JSON.stringify(state))
        } catch (e) {
            console.warn("Auto mode feedback save failed", e)
        }
    }

    function getAutoModeStamp(name, mode) {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, "0")
        const d = String(now.getDate()).padStart(2, "0")
        return `${name || "anon"}_${y}-${m}-${d}_${mode}`
    }

    function inferAutomaticModeFeedback(mode, ds, metrics, truth) {
        const safeDs = ds || {}
        const safeMetrics = metrics || {}
        const safeTruth = truth || {}

        const attention = Number(safeDs.attention ?? 0.5)
        const pressure = Number(safeDs.pressure ?? 0)
        const conflict = Number(safeDs.conflict ?? 0)
        const field = Number(safeDs.field ?? 0.5)
        const stability = Number(safeDs.stability ?? 0.5)
        const attractor = Number(safeDs.attractorField ?? 0.5)

        const interactions = Number(safeMetrics.interactions ?? 0)
        const kinSelects = Number(safeMetrics.kinSelects ?? 0)
        const timeSteps = Number(safeMetrics.timeSteps ?? 0)

        if (mode === "FOCUS") {
            if (
                attention >= 0.52 &&
                pressure <= 0.50 &&
                stability >= 0.58 &&
                conflict <= 0.25 &&
                kinSelects <= 6 &&
                timeSteps <= 6
            ) {
                return {
                    wasHelpful: true,
                    reason: "focus conditions matched actual calm/stable usage"
                }
            }

            if (
                pressure >= 0.62 ||
                stability <= 0.40 ||
                safeTruth.chaotic ||
                kinSelects >= 10
            ) {
                return {
                    wasHelpful: false,
                    reason: "focus was contradicted by pressure/instability/excess switching"
                }
            }

            return null
        }

        if (mode === "REST") {
            if (
                pressure >= 0.58 ||
                stability <= 0.45 ||
                safeTruth.lowActivity ||
                safeTruth.overload
            ) {
                return {
                    wasHelpful: true,
                    reason: "rest matched overload or unstable recovery conditions"
                }
            }

            if (
                attention >= 0.65 &&
                pressure <= 0.35 &&
                stability >= 0.65
            ) {
                return {
                    wasHelpful: false,
                    reason: "rest was too passive for a stable productive state"
                }
            }

            return null
        }

        if (mode === "EXPLORE") {
            if (
                kinSelects >= 4 ||
                timeSteps >= 4 ||
                safeTruth.exploratory ||
                (field >= 0.58 && attractor >= 0.52)
            ) {
                return {
                    wasHelpful: true,
                    reason: "explore matched open search / navigation behavior"
                }
            }

            if (
                attention >= 0.72 &&
                stability >= 0.68 &&
                pressure <= 0.35
            ) {
                return {
                    wasHelpful: false,
                    reason: "explore was weaker than a clear focus state"
                }
            }

            return null
        }

        if (mode === "INTERACT") {
            if (
                interactions >= 6 ||
                conflict >= 0.35
            ) {
                return {
                    wasHelpful: true,
                    reason: "interact matched social/conflict-driven activity"
                }
            }

            if (
                interactions <= 1 &&
                conflict <= 0.15 &&
                attention >= 0.60
            ) {
                return {
                    wasHelpful: false,
                    reason: "interact was unnecessary in a quiet focused state"
                }
            }

            return null
        }

        return null
    }

    function applyAutomaticModeFeedback(name, ds, metrics, truth) {
        const adaptive = getAdaptiveRecommendedMode(ds)
        const mode = adaptive.mode
        const inferred = inferAutomaticModeFeedback(mode, ds, metrics, truth)

        if (!inferred) {
            const state = loadAutoModeFeedbackState()
            const result = {
                mode,
                applied: false,
                wasHelpful: null,
                reason: "not enough evidence for automatic feedback"
            }
            state.lastResult = result
            saveAutoModeFeedbackState(state)
            window.mtosAutoModeFeedback = result
            return result
        }

        const stamp = getAutoModeStamp(name, mode)
        const state = loadAutoModeFeedbackState()

        if (state.lastStamp === stamp) {
            window.mtosAutoModeFeedback = state.lastResult || {
                mode,
                applied: false,
                wasHelpful: null,
                reason: "already evaluated today"
            }
            return window.mtosAutoModeFeedback
        }

        registerModeFeedback(mode, inferred.wasHelpful, ds)

        const result = {
            mode,
            applied: true,
            wasHelpful: inferred.wasHelpful,
            reason: inferred.reason
        }

        state.lastStamp = stamp
        state.lastResult = result
        saveAutoModeFeedbackState(state)

        window.mtosAutoModeFeedback = result

        logEvent("auto_mode_feedback", {
            mode,
            wasHelpful: inferred.wasHelpful,
            reason: inferred.reason
        })

        return result
    }

    function futureDateParts(baseDate, offsetDays) {
        const d = new Date(baseDate)
        d.setUTCDate(d.getUTCDate() + offsetDays)

        return {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
            time: d.getTime()
        }
    }

    function buildForecastRow(name, baseKin, horizonDays, predictedAttention, predictedState, targetParts) {
        return {
            id: `${name}_${Date.now()}_${horizonDays}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: Date.now(),
            targetTime: targetParts.time,
            horizonDays,
            user: name,
            baseKin,
            predictedAttention,
            predictedState,
            targetYear: targetParts.year,
            targetMonth: targetParts.month,
            targetDay: targetParts.day
        }
    }

    function makeForecastsFromWeather(name, userKin, weather, baseDate, dayState) {
        const horizons = [1, 3, 7]
        const rows = []

        for (const h of horizons) {
            const idx = Math.min(259, h)
            const w = weather[idx] || weather[0] || {
                attention: 0.5,
                activity: 0.5,
                pressure: 0,
                conflict: 0
            }

            const predictedAttention = Number(w.attention ?? 0.5)

            let predictedState = "NEUTRAL"
            if (predictedAttention > 0.72) {
                predictedState = "FOCUS"
            } else if (predictedAttention > 0.58) {
                predictedState = "FLOW"
            } else if (predictedAttention < 0.34) {
                predictedState = "RECOVERY"
            } else if ((w.pressure ?? 0) > 0.6 || (w.conflict ?? 0) > 0.45) {
                predictedState = "PRESSURE"
            }

            const target = futureDateParts(baseDate, h)

            rows.push(
                buildForecastRow(
                    name,
                    userKin,
                    h,
                    predictedAttention,
                    predictedState,
                    target
                )
            )
        }

        return rows
    }

    function resolveCurrentForecasts(name, userKin, currentAttention, currentDayState) {
        return resolveForecasts((forecast) => {
            if (forecast.user !== name) {
                return null
            }

            return {
                actualAttention: currentAttention,
                actualState: currentDayState?.dayLabel?.toUpperCase?.() || "NEUTRAL"
            }
        })
    }

    function getDayExplanation(ds) {

        const parts = []

        if (ds.field > 0.75) {
            parts.push("Strong alignment with environment")
        } else if (ds.field < 0.3) {
            parts.push("Weak connection to environment")
        }

        if (ds.pressure > 0.6) {
            parts.push("High pressure load")
        } else if (ds.pressure < 0.3) {
            parts.push("Low stress level")
        }

        if (ds.conflict > 0.4) {
            parts.push("Internal conflict present")
        }

        if (ds.stability > 0.7) {
            parts.push("Stable system state")
        } else if (ds.stability < 0.4) {
            parts.push("Unstable condition")
        }

        if (ds.attention > 0.7) {
            parts.push("High focus")
        } else if (ds.attention < 0.3) {
            parts.push("Scattered attention")
        }

        return parts.join(" • ")
    }

    function getRecommendedMode(ds) {
        const adaptive = getAdaptiveRecommendedMode(ds)
        window.mtosAdaptiveMode = adaptive
        return adaptive.mode
    }

    function getModeDescription(mode) {
        if (mode === "FOCUS") return "Deep work, high efficiency, auto-adaptive mode"
        if (mode === "REST") return "Recovery, reduce load, auto-adaptive mode"
        if (mode === "EXPLORE") return "Open exploration, learning, auto-adaptive mode"
        if (mode === "INTERACT") return "Communication, social dynamics, auto-adaptive mode"

        return ""
    }

    function getModeActionGuide(mode) {
        if (mode === "FOCUS") {
            return {
                doText: "Deep work, key decisions, execution, coding, structured writing",
                avoidText: "Context switching, chats, multitasking, random browsing",
                riskText: "Overload if pressure starts rising during the day"
            }
        }

        if (mode === "REST") {
            return {
                doText: "Recovery, routine, sleep, food, walking, reduce stimulus",
                avoidText: "Heavy decisions, conflict, forcing concentration",
                riskText: "False guilt from trying to push against the system"
            }
        }

        if (mode === "EXPLORE") {
            return {
                doText: "Research, testing, idea generation, open exploration, prototypes",
                avoidText: "Premature final decisions, rigid plans",
                riskText: "Scattering energy across too many directions"
            }
        }

        if (mode === "INTERACT") {
            return {
                doText: "Conversations, coordination, negotiation, messaging, feedback loops",
                avoidText: "Isolation, silent frustration, solo overcontrol",
                riskText: "Escalation if conflict is already high"
            }
        }

        return {
            doText: "",
            avoidText: "",
            riskText: ""
        }
    }

    function getDecisionOutput(ds, metrics){

    if(!ds){
        return {
            text: "NO DATA",
            confidence: 0
        }
    }

    const mode = getRecommendedMode(ds)

    let action = ""
    let confidence = 0

    const stability = Number(ds.stability ?? 0.5)
    const attention = Number(ds.attention ?? 0.5)
    const pressure = Number(ds.pressure ?? 0)
    const conflict = Number(ds.conflict ?? 0)
    const field = Number(ds.field ?? 0.5)

    // ===============================
    // DECISION LOGIC
    // ===============================

    if(mode === "FOCUS"){
        action = "Build / Execute core tasks"
        confidence =
            attention * 0.5 +
            stability * 0.4 -
            pressure * 0.3 -
            conflict * 0.2
    }

    else if(mode === "REST"){
        action = "Recover / reduce load"
        confidence =
            pressure * 0.5 +
            (1 - stability) * 0.4 +
            conflict * 0.2
    }

    else if(mode === "EXPLORE"){
        action = "Explore / test / prototype"
        confidence =
            field * 0.5 +
            (1 - Math.abs(attention - 0.55)) * 0.3 -
            pressure * 0.2
    }

    else if(mode === "INTERACT"){
        action = "Communicate / resolve / align"
        confidence =
            conflict * 0.6 +
            field * 0.3 +
            pressure * 0.1
    }

    confidence = Math.max(0, Math.min(1, confidence))

    return {
        text: `${mode} → ${action}`,
        confidence: Number(confidence.toFixed(2))
    }
}

function safeText(value, fallback = "unknown") {
    if (value === null || value === undefined) return fallback
    const s = String(value).trim()
    return s ? s : fallback
}

function safeNum(value, fallback = 0) {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

function clamp01Local(v) {
    return Math.max(0, Math.min(1, safeNum(v, 0)))
}

function wrapPhaseDelta(a, b) {
    const TAU = Math.PI * 2
    let d = Math.abs(Number(a || 0) - Number(b || 0)) % TAU
    if (d > Math.PI) d = TAU - d
    return d
}

function phaseAlignmentScore(a, b) {
    return Math.cos(wrapPhaseDelta(a, b))
}

function phaseLinkMod(a, b) {
    const align = phaseAlignmentScore(a, b)

    return {
        delta: wrapPhaseDelta(a, b),
        align,                          // -1 .. 1
        supportBoost: Math.max(0, align),
        conflictBoost: Math.max(0, -align)
    }
}

function getScientificConfidence(ds, metrics) {
    const safeDs = ds || {}
    const safeMetrics = metrics || {}

    const attention = clamp01Local(safeDs.attention ?? safeMetrics.attention ?? 0.5)
    const stability = clamp01Local(safeDs.stability ?? 0.5)
    const pressure = clamp01Local(safeDs.pressure ?? 0)
    const conflict = clamp01Local(safeDs.conflict ?? 0)
    const field = clamp01Local(safeDs.field ?? 0.5)

    const prediction = clamp01Local(safeMetrics.prediction ?? 0.5)
    const noise = clamp01Local(safeMetrics.noise ?? 0.2)
    const entropyNorm = clamp01Local((safeNum(safeMetrics.entropy, 1.5)) / 3.0)

    const attractor = window.mtosAttractorState || {}
    const attractorIntensity = clamp01Local(attractor.intensity ?? 0)

    const forecastStats = window.mtosForecastStats || {}
    const resolved = safeNum(forecastStats.resolved ?? 0, 0)
    const correct = safeNum(forecastStats.correct ?? 0, 0)
    const hitRate = resolved > 0 ? correct / resolved : 0.5

    let confidence =
        attention * 0.18 +
        stability * 0.22 +
        field * 0.10 +
        prediction * 0.18 +
        hitRate * 0.18 -
        pressure * 0.12 -
        conflict * 0.10 -
        noise * 0.08 -
        entropyNorm * 0.08 -
        attractorIntensity * 0.04

    confidence = clamp01Local(confidence)

    let calibration = "weak"
    if (resolved >= 8 && hitRate >= 0.68) calibration = "good"
    else if (resolved >= 4 && hitRate >= 0.52) calibration = "medium"

    return {
        value: Number(confidence.toFixed(2)),
        calibration,
        hitRate: Number(hitRate.toFixed(2)),
        resolved,
        correct
    }
}

function getScientificExplanation(ds, metrics) {
    const safeDs = ds || {}
    const safeMetrics = metrics || {}

    const attention = clamp01Local(safeDs.attention ?? safeMetrics.attention ?? 0.5)
    const stability = clamp01Local(safeDs.stability ?? 0.5)
    const pressure = clamp01Local(safeDs.pressure ?? 0)
    const conflict = clamp01Local(safeDs.conflict ?? 0)
    const field = clamp01Local(safeDs.field ?? 0.5)
    const prediction = clamp01Local(safeMetrics.prediction ?? 0.5)
    const noise = clamp01Local(safeMetrics.noise ?? 0.2)

    const attractor = window.mtosAttractorState || {}
    const network = window.mtosNetworkFeedback || {}
    const mem = window.mtosMemoryInfluence || { seal: 0, kin: 0, user: 0, total: 0 }

    const lines = []

    if (attention >= 0.62) lines.push(`Attention is high (${attention.toFixed(2)})`)
    else if (attention <= 0.38) lines.push(`Attention is low (${attention.toFixed(2)})`)
    else lines.push(`Attention is balanced (${attention.toFixed(2)})`)

    if (stability >= 0.62) lines.push(`Stability supports action (${stability.toFixed(2)})`)
    else if (stability <= 0.38) lines.push(`Stability is fragile (${stability.toFixed(2)})`)
    else lines.push(`Stability is moderate (${stability.toFixed(2)})`)

    if (pressure >= 0.55) lines.push(`Pressure is elevated (${pressure.toFixed(2)})`)
    else lines.push(`Pressure remains controlled (${pressure.toFixed(2)})`)

    if (conflict >= 0.42) lines.push(`Conflict signal is meaningful (${conflict.toFixed(2)})`)
    else lines.push(`Conflict remains low (${conflict.toFixed(2)})`)

    if (field >= 0.60) lines.push(`Field coherence is supportive (${field.toFixed(2)})`)
    else if (field <= 0.40) lines.push(`Field coherence is weak (${field.toFixed(2)})`)
    else lines.push(`Field coherence is neutral (${field.toFixed(2)})`)

    lines.push(
        `Attractor: ${safeText(attractor.type, "unknown")} (${clamp01Local(attractor.intensity ?? 0).toFixed(2)})`
    )

    lines.push(
        `Network support/conflict: ${safeNum(network.supportRatio ?? 0, 0).toFixed(2)} / ${safeNum(network.conflictRatio ?? 0, 0).toFixed(2)}`
    )

    lines.push(
        `Memory influence: seal ${safeNum(mem.seal, 0).toFixed(2)} • kin ${safeNum(mem.kin, 0).toFixed(2)} • user ${safeNum(mem.user, 0).toFixed(2)}`
    )

    lines.push(
        `Prediction / noise: ${prediction.toFixed(2)} / ${noise.toFixed(2)}`
    )

    return lines
}

function getScientificValidation() {
    const stats = window.mtosForecastStats || {}
    const auto = window.mtosAutoModeFeedback || {}

    const total = safeNum(stats.total ?? 0, 0)
    const resolved = safeNum(stats.resolved ?? 0, 0)
    const correct = safeNum(stats.correct ?? 0, 0)
    const pending = Math.max(0, total - resolved)
    const hitRate = resolved > 0 ? correct / resolved : 0

    return {
        total,
        resolved,
        correct,
        pending,
        hitRate: Number(hitRate.toFixed(2)),
        autoFeedback: safeText(auto.label ?? auto.result ?? auto.feedback ?? "not available", "not available")
    }
}

function getAttractorLabel() {
    const a = window.mtosAttractorState || {}
    return `${safeText(a.type, "unknown")} (${clamp01Local(a.intensity ?? 0).toFixed(2)})`
}

const MTOS_LEARNING_KEY = "mtos_learning_loop_v1"

function loadLearningState() {
    try {
        const raw = localStorage.getItem(MTOS_LEARNING_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed && typeof parsed === "object") return parsed
    } catch (e) {
        console.warn("learning load failed", e)
    }

    return {
        totalSteps: 0,
        successfulSteps: 0,
        failedSteps: 0,
        modeStats: {
            FOCUS: { ok: 0, bad: 0 },
            REST: { ok: 0, bad: 0 },
            EXPLORE: { ok: 0, bad: 0 },
            INTERACT: { ok: 0, bad: 0 },
            UNKNOWN: { ok: 0, bad: 0 }
        },
        attractorStats: {
            stable: { ok: 0, bad: 0 },
            cycle: { ok: 0, bad: 0 },
            trend: { ok: 0, bad: 0 },
            chaos: { ok: 0, bad: 0 },
            unknown: { ok: 0, bad: 0 }
        },
        history: []
    }
}

function saveLearningState(state) {
    try {
        localStorage.setItem(MTOS_LEARNING_KEY, JSON.stringify(state))
    } catch (e) {
        console.warn("learning save failed", e)
    }
}

function computeLearningSignal({ forecastHit, autoHelpful, stability, pressure, conflict }) {
    let score = 0

    score += (forecastHit ? 1 : 0) * 0.45
    score += (autoHelpful ? 1 : 0) * 0.30
    score += Math.max(0, Math.min(1, Number(stability ?? 0.5))) * 0.20
    score -= Math.max(0, Math.min(1, Number(pressure ?? 0))) * 0.10
    score -= Math.max(0, Math.min(1, Number(conflict ?? 0))) * 0.10

    return Math.max(-1, Math.min(1, score))
}

function updateSelfLearningLoop({
    name,
    dayState,
    mode,
    attractorType,
    forecastStats,
    autoModeFeedback
}) {
    const state = loadLearningState()

    const safeMode = mode || "UNKNOWN"
    const safeAttractor = attractorType || "unknown"

    if (!state.modeStats[safeMode]) {
        state.modeStats[safeMode] = { ok: 0, bad: 0 }
    }

    if (!state.attractorStats[safeAttractor]) {
        state.attractorStats[safeAttractor] = { ok: 0, bad: 0 }
    }

    const resolved = Number(forecastStats?.resolved ?? 0)
    const correct = Number(forecastStats?.correct ?? 0)

    const forecastHit = resolved > 0 ? (correct / resolved) >= 0.5 : false
    const autoHelpful = !!autoModeFeedback?.wasHelpful

    const signal = computeLearningSignal({
        forecastHit,
        autoHelpful,
        stability: dayState?.stability ?? 0.5,
        pressure: dayState?.pressure ?? 0,
        conflict: dayState?.conflict ?? 0
    })

    const success = signal >= 0.15
    const failure = signal <= -0.15

    state.totalSteps += 1
    if (success) state.successfulSteps += 1
    if (failure) state.failedSteps += 1

    if (success) {
        state.modeStats[safeMode].ok += 1
        state.attractorStats[safeAttractor].ok += 1
    } else if (failure) {
        state.modeStats[safeMode].bad += 1
        state.attractorStats[safeAttractor].bad += 1
    }

    state.history.push({
        t: Date.now(),
        user: name || "anon",
        mode: safeMode,
        attractorType: safeAttractor,
        signal: Number(signal.toFixed(3)),
        forecastHit,
        autoHelpful,
        stability: Number(dayState?.stability ?? 0.5),
        pressure: Number(dayState?.pressure ?? 0),
        conflict: Number(dayState?.conflict ?? 0)
    })

    if (state.history.length > 500) state.history.shift()

    saveLearningState(state)

    return { state, signal }
}

function getLearningSummary() {
    const s = loadLearningState()
    const total = Number(s.totalSteps ?? 0)
    const ok = Number(s.successfulSteps ?? 0)
    const bad = Number(s.failedSteps ?? 0)
    const rate = total > 0 ? ok / total : 0

    return {
        total,
        ok,
        bad,
        rate: Number(rate.toFixed(2))
    }
}

function renderTodayBlock(data){

    const el = document.getElementById("todayBlock")

    const modeMap = {
        FOCUS: "Deep Work",
        FLOW: "Creative Flow",
        NEUTRAL: "Balanced",
        FATIGUE: "Low Energy",
        RECOVERY: "Recovery"
    }

    el.innerHTML = `
    <div class="today-card">

        <div class="today-top">
            <div class="today-user">
                <div class="label">USER</div>
                <div class="value">
                    Kin ${data.kin} — ${data.seal} (Tone ${data.tone})
                </div>
            </div>

            <div class="today-day">
                <div class="label">TODAY</div>
                <div class="value">
                    Kin ${data.today_kin} — ${data.today_seal} (Tone ${data.today_tone})
                </div>
            </div>
        </div>

        <div class="today-state">
            <div class="state-main">
                ${data.state} — ${modeMap[data.state] || ""}
            </div>

            <div class="state-sub">
                Attention: ${data.attention.toFixed(2)} |
                Entropy: ${data.entropy.toFixed(2)} |
                Predictability: ${data.predictability}
            </div>
        </div>

    </div>
    `
}

window.getAccuracy = function(){

    const logs = window.MTOS_LOG || []

    const feedback = logs.filter(e => e.type === "user_feedback")

    if(!feedback.length) return "0%"

    const correct = feedback.filter(
        e => e.predictedState === e.realState
    ).length

    return (correct / feedback.length * 100).toFixed(1) + "%"
}

function alreadyConfirmedYesterday(){

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const day = yesterday.toISOString().slice(0,10)

    const logs = window.MTOS_LOG || []

    return logs.some(e =>
        e.type === "user_feedback" &&
        e.day === day
    )
}

function showSimplePrompt(){
    return
}

window.confirmYesterday = function(realState){

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const day = yesterday.toISOString().slice(0,10)

    const logs = window.MTOS_LOG || []

    const predicted = logs
        .filter(e => e.type === "daily_snapshot" && e.day === day)
        .slice(-1)[0]?.dayLabel || "UNKNOWN"

    logEvent("user_feedback", {
        day,
        predictedState: predicted,
        realState
    })

    console.log("Yesterday confirmed:", realState)

    const el = document.getElementById("mtosPrompt")
    if(el) el.remove()
}