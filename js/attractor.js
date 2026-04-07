import { KinRegistry } from "./kinRegistry.js"

function at(key){
    if (typeof window.t === "function") return window.t(key)
    return key
}

let phi = 0
let k = 1
let consistency = 0
let pressure = 0.5
let volume = 0.5
let temperature = 0.5

export function drawAttractor(id, participants = [], relations = [], selectedKin = null){

        const FIELD_STORAGE_KEY = "mtos_persistent_field_v1"
    const MEMORY_STORAGE_KEY = "mtos_persistent_field_memory_v1"

    function clamp(value, min, max){
        const n = Number(value)
        if(!Number.isFinite(n)) return min
        return Math.max(min, Math.min(max, n))
    }

    function loadPersistentArray(key, length, fallback = 0){
        try{
            const raw = localStorage.getItem(key)
            const parsed = raw ? JSON.parse(raw) : null

            if(Array.isArray(parsed) && parsed.length === length){
                return parsed.map(v => {
                    const n = Number(v)
                    return Number.isFinite(n) ? n : fallback
                })
            }
        }catch(e){
            console.warn("Persistent field load failed:", key, e)
        }

        return new Array(length).fill(fallback)
    }

    const avgAbsField = average(field.map(v => Math.abs(v)))
phi = Math.max(0, pressure * volume)
k = phi / Math.max(temperature, 1e-6)
consistency = Math.abs(phi - k * temperature)

window.mtosAttractorMetabolism = {
    pressure: Number(pressure.toFixed(4)),
    volume: Number(volume.toFixed(4)),
    temperature: Number(temperature.toFixed(4)),
    phi: Number(phi.toFixed(4)),
    k: Number(k.toFixed(4)),
    consistency: Number(consistency.toFixed(6)),
    fieldMean: Number(avgAbsField.toFixed(4)),
    phase: phase + 1
}

phi = pressure * volume
k = phi / Math.max(temperature, 1e-6)
consistency = Math.abs(phi - k * temperature)

    function savePersistentArray(key, arr){
        try{
            localStorage.setItem(key, JSON.stringify(arr))
        }catch(e){
            console.warn("Persistent field save failed:", key, e)
        }
    }

    if(window._attractorRAF){
        cancelAnimationFrame(window._attractorRAF)
            window._attractorRAF = null
    }

    const root = document.getElementById(id)
    root.innerHTML = ""

    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 300

    const ctx = canvas.getContext("2d")

    // =========================
    // PARAMETERS (MTOS CORE)
    // =========================

    const N = 260

    const SEGMENT_SIZE = 65
const SEGMENT_COUNT = 4

function getSegmentIndex(i){
    return Math.floor(i / SEGMENT_SIZE)
}

function getLocalIndex65(i){
    return i % SEGMENT_SIZE
}

function getSegmentProfile(segment, localIndex){
    const t = localIndex / (SEGMENT_SIZE - 1) // 0..1

    // 4 длинные мета-фазы
    // 0 = initiation
    // 1 = growth
    // 2 = peak
    // 3 = release

    if(segment === 0){
        return {
            name: "initiation",
            pressureMul: 0.72 + t * 0.18,
            tempMul: 0.72 + t * 0.22,
            memoryGain: 0.06 + t * 0.03,
            diffusion: 0.18 + t * 0.04,
            pullMul: 0.85
        }
    }

    if(segment === 1){
        return {
            name: "growth",
            pressureMul: 0.92 + t * 0.18,
            tempMul: 0.95 + t * 0.18,
            memoryGain: 0.08 + t * 0.03,
            diffusion: 0.22 + t * 0.05,
            pullMul: 1.00
        }
    }

    if(segment === 2){
        return {
            name: "peak",
            pressureMul: 1.18 + t * 0.22,
            tempMul: 1.20 + t * 0.28,
            memoryGain: 0.11 + t * 0.03,
            diffusion: 0.28 + t * 0.06,
            pullMul: 1.18
        }
    }

    return {
        name: "release",
        pressureMul: 0.95 - t * 0.28,
        tempMul: 0.90 - t * 0.24,
        memoryGain: 0.07 - t * 0.02,
        diffusion: 0.24 - t * 0.08,
        pullMul: 0.82
    }
}

function circularDistance(a, b, n){
    let d = Math.abs(a - b)
    return Math.min(d, n - d)
}

    let field = loadPersistentArray(FIELD_STORAGE_KEY, N, 0)
    let memory = loadPersistentArray(MEMORY_STORAGE_KEY, N, 0)

    // =========================
    // MTOS REAL DATA INPUT
    // =========================
    
    // 1. участники → базовое поле
        const inputField = new Array(N).fill(0)

    participants.forEach(p => {
        const kinValue = parseInt(p.kin)
        const i = KinRegistry.toIndex(kinValue)

        if (i >= 0 && i < 260) {
            const w = p.weight !== undefined ? p.weight : 1
            inputField[i] += w
        }
    })
    
    // 2. связи → распространение сигнала
        let relField = [...inputField]

    relations.forEach(r => {
        const from = ((r.from % N) + N) % N
        const to = ((r.to % N) + N) % N
        const s = r.strength !== undefined ? r.strength : 1

        relField[to] += inputField[from] * s
    })

    // нормализованный новый вход поля
    const incomingMax = Math.max(...relField.map(v => Math.abs(v)), 1)
    const incomingField = relField.map(v => v / incomingMax)

    // смешиваем прошлое поле с новым входом
    // 0.82 = память поля, 0.18 = новый сигнал дня
    field = field.map((prev, i) => {
        return prev * 0.82 + incomingField[i] * 0.18
    })
    
    // 3. нормализация (чтобы не взрывалось)
    const maxVal = Math.max(...field.map(v => Math.abs(v)), 1)

for (let i = 0; i < N; i++) {
    field[i] = clamp(field[i] / maxVal, -1.5, 1.5)
}

volume = Math.max(0.1, Math.min(2.0, 1 + Math.abs(field.reduce((a,b)=>a+b,0)/N)))
phi = pressure * volume
consistency = Math.max(0, Math.min(1, 1 - temperature * 0.5))

    // =========================
    // HELPERS
    // =========================

    const wrap = (i) => (i + N) % N

    const getPhaseInfluence = (phase) => {
        // 13 фаз — разные режимы динамики
        const table = [
            0.2, // emergence
            0.4, // polarization
            0.6, // activation
            0.8, // structuring
            1.0, // amplification
            0.7, // stabilization
            0.9, // resonance
            0.6, // integration
            0.5, // intention
            0.8, // manifestation
            0.3, // release
            0.6, // synthesis
            0.4  // transition
        ]
        return table[phase]
    }

    // =========================
    // UPDATE STEP (MTOS ENGINE)
    // =========================

    function updateField() {

        const newField = new Array(N).fill(0)

        const phaseFactor = getPhaseInfluence(phase)

        // мягкий распад старого поля между шагами
        for(let i = 0; i < N; i++){
            field[i] *= 0.996
            memory[i] *= 0.999
        }

        const networkFeedback = window.mtosNetworkFeedback || {
    totalLinks: 0,
    density: 0,
    meanStrength: 0,
    conflictRatio: 0,
    supportRatio: 0
}

const networkDensity = Number(networkFeedback.density) || 0
const networkStrength = Number(networkFeedback.meanStrength) || 0
const networkConflict = Number(networkFeedback.conflictRatio) || 0
const networkSupport = Number(networkFeedback.supportRatio) || 0

// Network → Attractor feedback
pressure += networkConflict * 0.08
pressure -= networkSupport * 0.03

temperature += networkStrength * 0.06
temperature += networkDensity * 0.04

pressure = Math.max(0.05, Math.min(1.5, pressure))
temperature = Math.max(0.05, Math.min(1.5, temperature))

const metabolic = window.mtosMetabolicMetrics || {}

const extP = Number.isFinite(Number(metabolic.P)) ? Number(metabolic.P) : pressure
const extT = Number.isFinite(Number(metabolic.T)) ? Number(metabolic.T) : temperature
const extV = Number.isFinite(Number(metabolic.V)) ? Number(metabolic.V) : 0.5

pressure = pressure * 0.72 + extP * 0.28
temperature = temperature * 0.72 + extT * 0.28
volume = volume * 0.70 + extV * 0.30

        for (let i = 0; i < N; i++) {

            const segment = getSegmentIndex(i)
            const localIndex = getLocalIndex65(i)
            const seg = getSegmentProfile(segment, localIndex)

            const left = field[wrap(i - 1)]
            const right = field[wrap(i + 1)]
            const self = field[i]
            const mem = memory[i]

            // взаимодействие сигналов
            let interaction = (left + right) * 0.5

            const localPressure = pressure * seg.pressureMul
const localTemp = temperature * seg.tempMul

let pressureEffect = -localPressure * self
let memoryEffect = mem * (0.92 + seg.memoryGain)
let noise = (Math.random() - 0.5) * localTemp

            // итоговая динамика
            let networkEffect =
            networkSupport * 0.06 -
            networkConflict * 0.08
            
            let value =
            self * 0.4 +
            interaction * 0.4 +
            memoryEffect * 0.3 +
            pressureEffect +
            noise +
            networkEffect

            const localPhi = Math.max(0, localPressure * Math.max(0, Math.min(1, Math.abs(self))))
            const thermalPenalty = localTemp * 0.06
            value += localPhi * 0.10
            value -= thermalPenalty
            // =========================
            // SELECTED KIN ATTRACTOR
            // =========================
            let pull = 0
let attractorBoost = 0

if(selectedKin !== null){
    const selectedIndex = KinRegistry.toIndex(selectedKin)
    let dist = circularDistance(i, selectedIndex, N)

    const sameSegment = getSegmentIndex(selectedIndex) === segment ? 1 : 0
    const segmentBonus = sameSegment ? 1.0 : 0.72

    pull = Math.exp(-dist / 12) * 0.22 * seg.pullMul * segmentBonus
}

const leftDist = Math.abs(self - left)
const rightDist = Math.abs(self - right)
const localContrast = Math.max(0, self - (left + right) * 0.5)

if(localContrast > 0){
    attractorBoost = localContrast * 0.35 * seg.pullMul
}

value += pull + attractorBoost

            // фазовая модуляция
            value *= phaseFactor * k

            newField[i] = value

            // обновление памяти (медленно)
            memory[i] = memory[i] * (0.972 - seg.memoryGain * 0.22) + value * seg.memoryGain
            memory[i] = Math.max(-2, Math.min(2, memory[i]))
        }

        field = newField

        // =========================
        // POST-PROCESS FIELD (MTOS PHYSICS)
        // =========================
        
        // 1. diffusion
        let spreadField = new Array(N).fill(0)

for (let i = 0; i < N; i++) {
    const segment = getSegmentIndex(i)
    const localIndex = getLocalIndex65(i)
    const seg = getSegmentProfile(segment, localIndex)

    const diffusion = seg.diffusion

    const left = field[(i - 1 + N) % N]
    const right = field[(i + 1) % N]
    const self = field[i]

    spreadField[i] =
        self * (1 - diffusion) +
        (left + right) * 0.5 * diffusion
}
        
        field = spreadField
        
        // 2. decay
        const decayStrength = 0.15
        let decayField = new Array(N).fill(0)
            
        for (let i = 0; i < N; i++) {
            let sum = 0
                
            for (let j = 0; j < N; j++) {
                let dist = Math.abs(i - j)
                dist = Math.min(dist, N - dist)
                    
                sum += field[j] * Math.exp(-dist / 20)
            }
            
            decayField[i] =
                field[i] * (1 - decayStrength) +
                sum * decayStrength / N
        }
        
        field = decayField
        
        // 3. clustering
        const clusterStrength = 0.62
        let clusterField = new Array(N).fill(0)
            
        for (let i = 0; i < N; i++) {
            const left = field[(i - 1 + N) % N]
            const right = field[(i + 1) % N]
            const self = field[i]
                
            const localAvg = (left + self + right) / 3
                
            if (self > localAvg) {
                clusterField[i] = self + (self - localAvg) * clusterStrength
            } else {
                clusterField[i] = self * (1 - clusterStrength * 0.5)
            }
        }
        
        field = clusterField

        // дополнительная инерция поля:
        // поле не исчезает за один день, а тянет форму дальше
        for(let i = 0; i < N; i++){
            field[i] =
                field[i] * 0.88 +
                memory[i] * 0.12
        }

const minField = Math.min(...field)
const maxField = Math.max(...field)
const range = Math.max(0.0001, maxField - minField)

window._attractorFieldRaw = [...field]
window._attractorField = field.map(v => {
    return Math.max(0, Math.min(1, (v - minField) / range))
})

const avgAbsField = average(field.map(v => Math.abs(v)))
phi = Math.max(0, pressure * volume)
k = phi / Math.max(temperature, 1e-6)
consistency = Math.abs(phi - k * temperature)

window.mtosAttractorMetabolism = {
    pressure: Number(pressure.toFixed(4)),
    volume: Number(volume.toFixed(4)),
    temperature: Number(temperature.toFixed(4)),
    phi: Number(phi.toFixed(4)),
    k: Number(k.toFixed(4)),
    consistency: Number(consistency.toFixed(6)),
    fieldMean: Number(avgAbsField.toFixed(4)),
    phase: phase + 1
}

        savePersistentArray(
            FIELD_STORAGE_KEY,
            field.map(v => Number(clamp(v, -2, 2).toFixed(6)))
        )

        savePersistentArray(
            MEMORY_STORAGE_KEY,
            memory.map(v => Number(clamp(v, -2, 2).toFixed(6)))
        )

window._attractorSegments = new Array(N).fill(0).map((_, i) => {
    const segment = getSegmentIndex(i)
    const localIndex = getLocalIndex65(i)
    const seg = getSegmentProfile(segment, localIndex)

    return {
        index: i,
        kin: i + 1,
        segment,
        localIndex,
        name: seg.name,
        pressureMul: seg.pressureMul,
        tempMul: seg.tempMul,
        memoryGain: seg.memoryGain,
        diffusion: seg.diffusion,
        pullMul: seg.pullMul,
        value: window._attractorField[i]
    }
})
        
        // обновление параметров
        pressure = 0.3 + Math.abs(average(field)) * 0.7
        temperature = 0.3 + variance(field) * 1.5
        
        // ==============================
        // ATTRACTOR STATE (ВАЖНО)
        // ==============================

        const avgAbs = average(field.map(v => Math.abs(v)))
        const varianceValue = variance(field)

        let attractorType = "stable"

        if (temperature > 0.95 || varianceValue > 0.22) {
            attractorType = "chaos"
        }
        else if (avgAbs > 0.32 && temperature < 0.75) {
            attractorType = "cycle"
        }
        else if (pressure > 0.62 && avgAbs > 0.20) {
            attractorType = "trend"
        }
        
        const attractorIntensity = Math.max(
            0,
            Math.min(
                1,
                temperature * 0.45 +
                pressure * 0.35 +
                avgAbs * 0.20
            )
        )

        const attractorScore =
        varianceValue * 0.5 +
        avgAbs * 0.3 +
        pressure * 0.2
        
        // 🚨 ВОТ ЭТО САМОЕ ГЛАВНОЕ
        if (window.MTOSBridge && window.MTOSBridge.setAttractorState) {
    const state = window.MTOSBridge.setAttractorState(
        attractorType,
        attractorIntensity,
        attractorScore
    )

    if (window.MTOSBridge.syncAttractorWithSystem) {
        window.MTOSBridge.syncAttractorWithSystem({
            type: state.type,
            intensity: state.intensity,
            score: state.score,
            networkLinks: window.mtosNetworkLinks || [],
            collective: window.mtosCollective || {}
        })
    }
}
        
        // переход фаз
        phase = (phase + 1) % 13
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length
    }

    function variance(arr) {
        const avg = average(arr)
        return arr.reduce((a, b) => a + (b - avg) ** 2, 0) / arr.length
    }

    // =========================
    // DRAW
    // =========================

    function draw() {

        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // ось
        ctx.strokeStyle = "#333"
        ctx.beginPath()
        ctx.moveTo(0, 150)
        ctx.lineTo(canvas.width, 150)
        ctx.stroke()

        // график
        for (let i = 0; i < N; i++) {

            const x = (i / N) * canvas.width
            const y = 150 + field[i] * 100

            ctx.fillStyle = "orange"
            ctx.fillRect(x, y, 2, 2)
        }

        // HUD
        ctx.fillStyle = "#aaa"
        ctx.font = "10px monospace"

        ctx.fillText(`Volume: ${volume.toFixed(2)}`, 10, 60)
ctx.fillText(`Phi: ${phi.toFixed(3)}`, 10, 75)
ctx.fillText(`k: ${k.toFixed(3)}`, 10, 90)
ctx.fillText(`Consistency: ${consistency.toFixed(4)}`, 10, 105)

        const networkFeedback = window.mtosNetworkFeedback || {
            density: 0,
            meanStrength: 0,
            conflictRatio: 0,
            supportRatio: 0
        }
        
        ctx.fillText(`Phase: ${phase + 1}`, 10, 30)
ctx.fillText(`Pressure: ${pressure.toFixed(2)}`, 10, 45)
ctx.fillText(`Temperature: ${temperature.toFixed(2)}`, 10, 120)
        const segMeans = [0, 0, 0, 0]
const segCounts = [0, 0, 0, 0]

for(let i = 0; i < N; i++){
    const s = getSegmentIndex(i)
    segMeans[s] += field[i]
    segCounts[s] += 1
}

for(let s = 0; s < 4; s++){
    segMeans[s] = segCounts[s] ? segMeans[s] / segCounts[s] : 0
}

ctx.fillText(`S0 init: ${segMeans[0].toFixed(2)}`, 10, 110)
ctx.fillText(`S1 grow: ${segMeans[1].toFixed(2)}`, 10, 125)
ctx.fillText(`S2 peak: ${segMeans[2].toFixed(2)}`, 10, 140)
ctx.fillText(`S3 release: ${segMeans[3].toFixed(2)}`, 10, 155)
        ctx.fillText(`Net density: ${networkFeedback.density.toFixed(2)}`, 10, 60)
        ctx.fillText(`Net conflict: ${networkFeedback.conflictRatio.toFixed(2)}`, 10, 75)
        ctx.fillText(`Net support: ${networkFeedback.supportRatio.toFixed(2)}`, 10, 90)

    }

    // =========================
    // LOOP
    // =========================

    let isPaused = false
    let speedMultiplier = 1

    function loop() {

        if (!isPaused) {

            // управление скоростью
            const steps = Math.floor(speedMultiplier)

            for (let i = 0; i < steps; i++) {
                updateField()
            }

            // если медленный режим (дробный)
            if (speedMultiplier < 1) {
                if (Math.random() < speedMultiplier) {
                    updateField()
                }
            }
        }

        draw()
        window._attractorRAF = requestAnimationFrame(loop)
    }

    const controls = document.createElement("div")
    controls.style.marginBottom = "10px"
    
    // кнопка pause
    const pauseBtn = document.createElement("button")
    pauseBtn.innerText = at("pauseBtn")
    pauseBtn.onclick = () => {
        isPaused = !isPaused
        pauseBtn.innerText = isPaused ? at("resumeBtn") : at("pauseBtn")
    }
    
    // slow
    const slowBtn = document.createElement("button")
    slowBtn.innerText = at("slowBtn")
    slowBtn.onclick = () => {
        speedMultiplier = 0.3
    }
    
    // normal
    const normalBtn = document.createElement("button")
    normalBtn.innerText = at("normalBtn")
    normalBtn.onclick = () => {
        speedMultiplier = 1
    }
    
    // boost
    const boostBtn = document.createElement("button")
    boostBtn.innerText = at("boostBtn")
    boostBtn.onclick = () => {
        speedMultiplier = 5
    }

        const resetFieldBtn = document.createElement("button")
    resetFieldBtn.innerText = at("resetFieldBtn")
    resetFieldBtn.onclick = () => {
        localStorage.removeItem(FIELD_STORAGE_KEY)
        localStorage.removeItem(MEMORY_STORAGE_KEY)

        field = new Array(N).fill(0)
        memory = new Array(N).fill(0)

        window._attractorFieldRaw = new Array(N).fill(0)
        window._attractorField = new Array(N).fill(0.5)
    }
        
    // стили
    ;[pauseBtn, slowBtn, normalBtn, boostBtn, resetFieldBtn].forEach(btn => {
        btn.style.marginRight = "5px"
        btn.style.cursor = "pointer"
    })
    
    // добавляем
    controls.appendChild(pauseBtn)
    controls.appendChild(slowBtn)
    controls.appendChild(normalBtn)
    controls.appendChild(boostBtn)
    controls.appendChild(resetFieldBtn)
        
    root.appendChild(controls)

    root.appendChild(canvas)

    // =========================
    // DESCRIPTION (ENGLISH)
    // =========================

    const description = document.createElement("div")
    description.style.color = "#888"
    description.style.fontSize = "12px"
    description.style.marginTop = "10px"
    description.style.fontFamily = "monospace"
    description.style.whiteSpace = "pre-line"
    description.style.lineHeight = "1.5"
    description.style.maxWidth = "600px"
    description.style.margin = "10px auto"

    description.innerHTML = `
${at("attractorDynamicFieldTitle")}

${at("attractorDynamicFieldLine1")}

${at("attractorDynamicFieldLine2")}
• ${at("attractorXAxis")}
• ${at("attractorYAxis")}

${at("attractorCoreDynamics")}
• ${at("attractorMemory")}
• ${at("attractorPressure")}
• ${at("attractorTemperature")}
• ${at("attractorPhase")}
• ${at("attractorPersistent")}

${at("attractorEvolves")}
• ${at("attractorFormation")}
• ${at("attractorCollapse")}
• ${at("attractorEmergence")}

${at("attractorNotStatic")}
`

    root.appendChild(description)

    loop()
}

window.mtosAttractorMetabolism = {
    phi: Number(phi.toFixed(4)),
    k: Number(k.toFixed(4)),
    consistency: Number(consistency.toFixed(4)),
    pressure: Number(pressure.toFixed(4)),
    temperature: Number(temperature.toFixed(4)),
    volume: Number(volume.toFixed(4))
}