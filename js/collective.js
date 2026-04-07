import { getRelationLabel } from "./relationTypes.js"

function ct(key){
    if (typeof window.t === "function") return window.t(key)
    return key
}

function translateCollectiveAttractor(type){
    const x = String(type || "").toLowerCase()
    if (x === "stable") return ct("attractorStable")
    if (x === "cycle") return ct("attractorCycle")
    if (x === "trend") return ct("attractorTrend")
    if (x === "chaos") return ct("attractorChaos")
    return ct("unknownWord")
}

function translateCollectiveFeedback(value){
    const x = String(value || "").toLowerCase()
    if (x === "good") return ct("good").toUpperCase()
    if (x === "neutral") return ct("neutral").toUpperCase()
    if (x === "bad") return ct("bad").toUpperCase()
    return String(value || "").toUpperCase()
}

export function drawCollective(id, users){
        function getTimePressureState(){
        const tp = window.mtosTimePressure || window.mtosTimePressureSummary || {}

        const pressure = Number(tp.pressure ?? tp.value ?? 0)
        const urgency = Number(tp.urgency ?? 0)
        const momentum = Number(tp.momentum ?? 0)
        const overload = Number(tp.overload ?? 0)
        const fatigue = Number(tp.fatigue ?? 0)

        return {
            pressure: Math.max(0, Math.min(1, Number.isFinite(pressure) ? pressure : 0)),
            urgency: Math.max(0, Math.min(1, Number.isFinite(urgency) ? urgency : 0)),
            momentum: Math.max(-1, Math.min(1, Number.isFinite(momentum) ? momentum : 0)),
            overload: Math.max(0, Math.min(1, Number.isFinite(overload) ? overload : 0)),
            fatigue: Math.max(0, Math.min(1, Number.isFinite(fatigue) ? fatigue : 0)),
            label: typeof tp.label === "string" ? tp.label : "low",
            temporalMode: typeof tp.temporalMode === "string" ? tp.temporalMode : "EXPLORE"
        }
    }

    function propagateImpact(memory, users, sourceA, sourceB, impact){

    const spreadFactor = 0.1 + temperature * 0.4 // сила распространения

    users.forEach(u => {

        if(u.name === sourceA || u.name === sourceB) return

        // A влияет на остальных
        const key1 = sourceA + "->" + u.name
        if(memory[key1] !== undefined && memory[key1] !== 0){
            memory[key1] += impact * spreadFactor
        }

        // остальные влияют на B
        const key2 = u.name + "->" + sourceB
        if(memory[key2] !== undefined && memory[key2] !== 0){
            memory[key2] += impact * spreadFactor
        }

        // нормализация
        if(memory[key1] !== undefined && memory[key1] !== 0){
            memory[key1] = Math.max(-1, Math.min(1, memory[key1]))
        }

        if(memory[key2] !== undefined && memory[key2] !== 0){
            memory[key2] = Math.max(-1, Math.min(1, memory[key2]))
        }
    })
}
    const STORAGE_KEY = "collective_relations_memory"

    const TEMP_KEY = "collective_temperature"
        
    let temperature = Number(localStorage.getItem(TEMP_KEY))
if (!Number.isFinite(temperature)) temperature = 0.5

const attractorState = window.mtosAttractorState || {
    type: "unknown",
    intensity: 0
}
const timePressureState = getTimePressureState()



// мягкий возврат к центру
temperature += (0.5 - temperature) * 0.08

// небольшой шум
temperature += (Math.random() - 0.5) * 0.04

// attractor-влияние
if ((attractorState?.type || "unknown") === "chaos") {
    temperature += 0.10 * attractorState.intensity
} else if ((attractorState?.type || "unknown") === "cycle") {
    temperature += 0.04 * attractorState.intensity
} else if ((attractorState?.type || "unknown") === "trend") {
    temperature += 0.06 * attractorState.intensity
} else if ((attractorState?.type || "unknown") === "stable") {
    temperature -= 0.04 * attractorState.intensity
}
// time pressure → collective temperature
temperature += timePressureState.pressure * 0.14
temperature += timePressureState.urgency * 0.06
temperature += timePressureState.overload * 0.05
temperature -= Math.max(0, -timePressureState.momentum) * 0.03

temperature = Math.max(0.15, Math.min(0.95, temperature))

const metabolic = window.mtosMetabolicMetrics || {}
const collectivePressure = Number(metabolic.P ?? timePressureState.pressure ?? 0)
const collectiveVolume = Number(metabolic.V ?? 0.5)
const collectivePhi = Math.max(0, collectivePressure * collectiveVolume)
const collectiveK = collectivePhi / Math.max(temperature, 1e-6)
const collectiveConsistency = Math.abs(collectivePhi - collectiveK * temperature)

    let memory = {}
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
    try {
        memory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    } catch(e){
        memory = {}
    }

    const root = document.getElementById(id)
    root.innerHTML = ""

    // ===== КОНТЕЙНЕР =====
    const box = document.createElement("div")
    box.style.border = "2px solid #444"
    box.style.borderRadius = "12px"
    box.style.padding = "12px"
    box.style.maxHeight = "500px"
    box.style.overflowY = "auto"
    box.style.background = "#000"
    box.style.fontFamily = "Arial"
    box.style.maxWidth = "600px"
    box.style.margin = "0 auto"

    // ===== ЗАГОЛОВОК =====
    const title = document.createElement("div")
    title.innerText = ct("collectiveRelationsTitle")
    title.style.color = "#fff"
    title.style.fontWeight = "bold"
    title.style.fontSize = "16px"
    title.style.textAlign = "center"
    title.style.marginBottom = "10px"

    box.appendChild(title)

    const tempEl = document.createElement("div")
    tempEl.innerText = ct("systemTemperature") + ": " + temperature.toFixed(2)
    tempEl.style.color = "#888"
    tempEl.style.textAlign = "center"
    tempEl.style.marginBottom = "8px"
        
    box.appendChild(tempEl)

    const metabolicEl = document.createElement("div")
metabolicEl.innerText =
    "Φ: " + collectivePhi.toFixed(3) +
    " • k: " + collectiveK.toFixed(3) +
    " • " + ct("consistency").toLowerCase() + ": " + collectiveConsistency.toFixed(4)
metabolicEl.style.color = "#888"
metabolicEl.style.textAlign = "center"
metabolicEl.style.marginBottom = "8px"

box.appendChild(metabolicEl)

    const attractorIntensity = Number(attractorState?.intensity ?? 0)

const attractorText = isNaN(attractorIntensity)
    ? "0%"
    : (attractorIntensity * 100).toFixed(1) + "%"

const attractorEl = document.createElement("div")
attractorEl.innerText =
    ct("attractorWord") + ": " +
((attractorState && typeof attractorState.type === "string" && attractorState.type.trim())
    ? translateCollectiveAttractor(attractorState.type)
    : ct("unknownWord")) +
" (" + attractorText + ")"
attractorEl.style.color = "#888"
attractorEl.style.textAlign = "center"
attractorEl.style.marginBottom = "8px"

box.appendChild(attractorEl)

const timePressureEl = document.createElement("div")
timePressureEl.innerText =
    ct("time_pressure") + ": " +
    timePressureState.pressure.toFixed(2) +
    " • " +
    ct("level" + timePressureState.label.charAt(0).toUpperCase() + timePressureState.label.slice(1)) +
    " • " +
    (typeof window.translateModeLabel === "function"
        ? window.translateModeLabel(timePressureState.temporalMode)
        : timePressureState.temporalMode)
timePressureEl.style.color = "#888"
timePressureEl.style.textAlign = "center"
timePressureEl.style.marginBottom = "8px"

box.appendChild(timePressureEl)

    // ===== ПРОВЕРКА =====
    if(!users || users.length < 2){
        const empty = document.createElement("div")
        empty.innerText = ct("notEnoughParticipants")
        empty.style.color = "#888"
        empty.style.textAlign = "center"
        box.appendChild(empty)

        localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
        localStorage.setItem(TEMP_KEY, temperature.toFixed(3))

        root.appendChild(box)
        return
    }

    // ===== СТРОИМ СВЯЗИ =====
    const relations = []

    for(let i = 0; i < users.length; i++){
        for(let j = 0; j < users.length; j++){
            if(i === j) continue

            const a = users[i]
            const b = users[j]

            // === БАЗОВАЯ ЛОГИКА (потом заменишь на MTOS) ===
            const key = a.name + "->" + b.name
            const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

            if(locked[key]){
                continue
            }
            // ❌ если связь заблокирована — вообще не трогаем
            if(locked[key]){
                continue
            }
                    
            let score = 0
let relationFeedbackScalar = 0

if(memory[key] !== undefined){

    // если связь обнулена — полностью игнорируем
    if(memory[key] === 0){
        continue
    }

    const drift = 0
    const decay = 0

    score = memory[key] + drift + decay
    score = Math.max(-1, Math.min(1, score))

    score = window.resolveSharedRelationScore
        ? window.resolveSharedRelationScore(score, attractorState, timePressureState)
        : Math.max(-1, Math.min(1, score))

    const feedbackDay =
        typeof window.getCurrentRunDay === "function"
            ? window.getCurrentRunDay()
            : new Date().toISOString().slice(0, 10)

    relationFeedbackScalar =
        typeof window.getRelationFeedbackScalar === "function"
            ? Number(window.getRelationFeedbackScalar(feedbackDay, a.name, b.name) || 0)
            : 0

    score = Math.max(-1, Math.min(1, score + relationFeedbackScalar))
}else{
                continue
            }

            // 🔴 НЕ ПЕРЕЗАПИСЫВАЕМ ЗАБЛОКИРОВАННЫЕ
            if(memory[key] !== 0){
                if(memory[key] !== 0 && !locked[key]){
                    memory[key] = Number(score.toFixed(4))
                }
            }

            // случайные события
            const randomEventChance =
    0.05 +
    timePressureState.pressure * 0.06 +
    timePressureState.urgency * 0.03

if(memory[key] !== 0 && Math.random() < randomEventChance){
    let eventImpact = (Math.random() - 0.5) * 0.8

    if(timePressureState.pressure >= 0.62){
        eventImpact *= (1 + timePressureState.pressure * 0.35)
    }

    memory[key] = Math.max(-1, Math.min(1, memory[key] + eventImpact))
}

            score = memory[key]

            relations.push({
    a: a.name,
    b: b.name,
    score: score,
    relationFeedbackScalar
})
        }
    }

    // ===== СОРТИРОВКА (сильные сверху) =====
    relations.sort((x, y) => y.score - x.score)

    // ===== РЕНДЕР =====
relations.forEach(r => {

    const { label, color } = getRelationLabel(r.score)
const translatedLabel =
    typeof window.translateRelationLabel === "function"
        ? window.translateRelationLabel(label)
        : label

    const row = document.createElement("div")
    row.style.display = "grid"
    row.style.gridTemplateColumns = "1fr auto 1fr"
    row.style.alignItems = "center"
    row.style.textAlign = "center"
    row.style.padding = "6px 8px"
    row.style.borderBottom = "1px solid #111"
    row.style.background = "rgba(255,255,255," + (Math.abs(r.score) * 0.08) + ")"
    row.style.fontSize = "13px"

    row.title = ct("scoreLabel") + ": " + r.score.toFixed(3)

    row.style.cursor = "pointer"
    row.onmouseenter = () => {
        row.style.background = "rgba(255,255,255,0.15)"
    }

    row.onmouseleave = () => {
        row.style.background = "rgba(255,255,255," + (Math.abs(r.score) * 0.08) + ")"
    }

    row.oncontextmenu = (e) => {
        e.preventDefault()

        const impact = -0.4 * (1 + timePressureState.pressure * 0.35)
        const key = r.a + "->" + r.b

        memory[key] = Math.max(-1, Math.min(1, (memory[key] || 0) + impact))

        temperature += Math.abs(impact) * (0.1 + timePressureState.urgency * 0.08)
        temperature = Math.max(0, Math.min(1, temperature))

        localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
        localStorage.setItem(TEMP_KEY, temperature.toFixed(3))

        drawCollective(id, users)
    }

    row.onclick = (e) => {

        const key = r.a + "->" + r.b

        let impact = 0

        if(e.shiftKey){
            impact = -(memory[key] || 0) * (0.1 + timePressureState.pressure * 0.08)
        }else{
            impact = 0.3 * (1 - timePressureState.pressure * 0.18)
        }

        memory[key] = Math.max(-1, Math.min(1, (memory[key] || 0) + impact))

        temperature += Math.abs(impact) * (0.1 + timePressureState.urgency * 0.08)
        temperature = Math.max(0, Math.min(1, temperature))

        localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
        localStorage.setItem(TEMP_KEY, temperature.toFixed(3))

        drawCollective(id, users)
    }

    const left = document.createElement("div")
    left.innerText = r.a
    left.style.textAlign = "right"
    left.style.color = "#fff"

    const center = document.createElement("div")
    center.innerText = "↔"
    center.style.color = "#555"

    const right = document.createElement("div")
    right.innerText = r.b
    right.style.textAlign = "left"
    right.style.color = "#fff"

    const status = document.createElement("div")
    const feedbackDay =
    typeof window.getCurrentRunDay === "function"
        ? window.getCurrentRunDay()
        : new Date().toISOString().slice(0, 10)

const relationFeedback =
    typeof window.getRelationFeedbackFor === "function"
        ? window.getRelationFeedbackFor(feedbackDay, r.a, r.b)
        : null

status.innerText =
    translatedLabel +
    " (" + r.score.toFixed(2) + ")" +
    (relationFeedback ? ` • ${translateCollectiveFeedback(relationFeedback.value)}` : "")
    status.style.color = color
    status.style.fontWeight = "bold"
    status.style.gridColumn = "1 / span 3"
    status.style.marginTop = "2px"

    row.appendChild(left)
    row.appendChild(center)
    row.appendChild(right)
    row.appendChild(status)

    box.appendChild(row)
})

    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
    localStorage.setItem(TEMP_KEY, temperature.toFixed(3))

window.mtosCollectiveMetabolism = {
    phi: Number(collectivePhi.toFixed(4)),
    k: Number(collectiveK.toFixed(4)),
    consistency: Number(collectiveConsistency.toFixed(4)),
    pressure: Number(collectivePressure.toFixed(4)),
    volume: Number(collectiveVolume.toFixed(4)),
    temperature: Number(temperature.toFixed(4))
}

const relationCount = relations.length
const supportCount = relations.filter(r => Number(r.score) > 0.15).length
const conflictCount = relations.filter(r => Number(r.score) < -0.15).length
const neutralCount = relationCount - supportCount - conflictCount

const supportRatio = relationCount > 0 ? supportCount / relationCount : 0
const conflictRatio = relationCount > 0 ? conflictCount / relationCount : 0
const neutrality = relationCount > 0 ? neutralCount / relationCount : 1

window.mtosCollectiveState = {
    relationCount,
    supportCount,
    conflictCount,
    neutralCount,
    supportRatio: Number(supportRatio.toFixed(4)),
    conflictRatio: Number(conflictRatio.toFixed(4)),
    neutrality: Number(neutrality.toFixed(4)),
    temperature: Number(temperature.toFixed(4)),
    pressure: Number(collectivePressure.toFixed(4)),
    volume: Number(collectiveVolume.toFixed(4)),
    phi: Number(collectivePhi.toFixed(4)),
    k: Number(collectiveK.toFixed(4)),
    consistency: Number(collectiveConsistency.toFixed(4)),
    attractorType: String(attractorState?.type || "unknown"),
    attractorIntensity: Number((attractorState?.intensity ?? 0).toFixed(4)),
    timePressure: Number(timePressureState.pressure.toFixed(4)),
    urgency: Number(timePressureState.urgency.toFixed(4)),
    temporalMode: String(timePressureState.temporalMode || "EXPLORE"),
    label: String(timePressureState.label || "low"),
    updatedAt: new Date().toISOString()
}

    root.appendChild(box)

    const description = document.createElement("div")
description.style.color = "#888"
description.style.fontSize = "12px"
description.style.textAlign = "center"
description.style.marginTop = "10px"
description.style.maxWidth = "760px"
description.style.marginLeft = "auto"
description.style.marginRight = "auto"
description.style.lineHeight = "1.6"

description.innerHTML = `
    <div style="margin-bottom:6px;">${ct("leftClickSupport")}</div>
    <div style="margin-bottom:6px;">${ct("rightClickConflict")}</div>
    <div style="margin-bottom:14px;">${ct("shiftClickNeutral")}</div>

    <div style="margin-bottom:6px;">${ct("collectiveDescLine1")}</div>
    <div style="margin-bottom:14px;">${ct("collectiveDescLine2")}</div>

    <div style="margin:14px 0 8px 0; color:#bbb; font-weight:bold;">
        --- ${ct("systemMetricsTitle")} ---
    </div>

    <div style="margin-bottom:6px;">${ct("metricPhiDesc")}</div>
    <div style="margin-bottom:6px;">${ct("metricKDesc")}</div>
    <div style="margin-bottom:14px;">${ct("metricConsistencyDesc")}</div>

    <div style="margin-bottom:6px;">${ct("attractorDynamicPattern")}</div>
    <div>${ct("attractorModesLine")}</div>
`

root.appendChild(description)
}
