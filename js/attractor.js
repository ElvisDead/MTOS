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

    function clamp(value, min, max){
        const n = Number(value)
        if(!Number.isFinite(n)) return min
        return Math.max(min, Math.min(max, n))
    }

    function average(arr){
        if (!Array.isArray(arr) || !arr.length) return 0
        return arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length
    }

    function variance(arr){
        if (!Array.isArray(arr) || !arr.length) return 0
        const avg = average(arr)
        return arr.reduce((a, b) => a + (Number(b || 0) - avg) ** 2, 0) / arr.length
    }

    function circularDistance(a, b, n){
        let d = Math.abs(a - b)
        return Math.min(d, n - d)
    }

    const root = document.getElementById(id)
    if (!root) return

    if (window._attractorRAF){
        cancelAnimationFrame(window._attractorRAF)
        window._attractorRAF = null
    }

    root.innerHTML = ""

    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 300

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const N = 260
    const SEGMENT_SIZE = 65

    function getSegmentIndex(i){
        return Math.floor(i / SEGMENT_SIZE)
    }

    function getLocalIndex65(i){
        return i % SEGMENT_SIZE
    }

    function getSegmentProfile(segment, localIndex){
        const t = localIndex / (SEGMENT_SIZE - 1)

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

    function getPhaseInfluence(phase){
        const table = [
            0.2,
            0.4,
            0.6,
            0.8,
            1.0,
            0.7,
            0.9,
            0.6,
            0.5,
            0.8,
            0.3,
            0.6,
            0.4
        ]
        return table[phase] ?? 0.6
    }

    const wrap = (i) => (i + N) % N

    let phase = 0
    let isPaused = false
    let speedMultiplier = 1

    let field = new Array(N).fill(0)
    let memory = new Array(N).fill(0)

    function buildIncomingField(){
        const inputField = new Array(N).fill(0)

        ;(Array.isArray(participants) ? participants : []).forEach(p => {
            const kinValue = Number(p?.kin)
            const i = KinRegistry.toIndex(kinValue)

            if (i >= 0 && i < N) {
                const w = Number(p?.weight ?? 1)
                inputField[i] += w
            }
        })

        const relField = [...inputField]

        ;(Array.isArray(relations) ? relations : []).forEach(r => {
            const from = ((Number(r?.from ?? 0) % N) + N) % N
            const to = ((Number(r?.to ?? 0) % N) + N) % N
            const s = Number(r?.strength ?? 1)

            relField[to] += inputField[from] * s
        })

        const incomingMax = Math.max(...relField.map(v => Math.abs(v)), 1)

        return relField.map(v => v / incomingMax)
    }

    function applyEnvironmentFeedback(){
        const networkFeedback = window.mtosNetworkFeedback || {
            totalLinks: 0,
            density: 0,
            meanStrength: 0,
            conflictRatio: 0,
            supportRatio: 0
        }

        const collectiveFeedback = window.mtosCollective || window.mtosCollectiveState || {
            supportRatio: 0,
            conflictRatio: 0,
            temperature: 0.5,
            coherence: 0.5,
            tension: 0.5,
            stability: 0.5,
            resonance: 0.5,
            relationCount: 0
        }

        const metabolic = window.mtosMetabolicMetrics || {}

        const networkDensity = Number(networkFeedback.density) || 0
        const networkStrength = Number(networkFeedback.meanStrength) || 0
        const networkConflict = Number(networkFeedback.conflictRatio) || 0
        const networkSupport = Number(networkFeedback.supportRatio) || 0

        const collectiveSupport = Number(collectiveFeedback.supportRatio) || 0
        const collectiveConflict = Number(collectiveFeedback.conflictRatio) || 0
        const collectiveTemperature = Number(collectiveFeedback.temperature) || 0.5
        const collectiveCoherence = Number(collectiveFeedback.coherence) || 0.5
        const collectiveTension = Number(collectiveFeedback.tension) || 0.5
        const collectiveStability = Number(collectiveFeedback.stability) || 0.5
        const collectiveResonance = Number(collectiveFeedback.resonance) || 0.5
        const collectiveRelations = Number(collectiveFeedback.relationCount) || 0

        pressure += networkConflict * 0.08
        pressure -= networkSupport * 0.03

        temperature += networkStrength * 0.06
        temperature += networkDensity * 0.04

        pressure += collectiveConflict * 0.10
        pressure += collectiveTension * 0.06
        pressure -= collectiveSupport * 0.05
        pressure -= collectiveStability * 0.04

        temperature += Math.max(0, collectiveTemperature - 0.5) * 0.18
        temperature += collectiveConflict * 0.06
        temperature -= collectiveCoherence * 0.05

        volume += collectiveSupport * 0.05
        volume += collectiveResonance * 0.04
        volume += Math.min(0.06, collectiveRelations / 200)
        volume -= collectiveConflict * 0.03

        pressure = clamp(pressure, 0.05, 1.5)
        temperature = clamp(temperature, 0.05, 1.5)
        volume = clamp(volume, 0.10, 2.00)

        const extP = Number.isFinite(Number(metabolic.P)) ? Number(metabolic.P) : pressure
        const extT = Number.isFinite(Number(metabolic.T)) ? Number(metabolic.T) : temperature
        const extV = Number.isFinite(Number(metabolic.V)) ? Number(metabolic.V) : 0.5

        pressure = pressure * 0.72 + extP * 0.28
        temperature = temperature * 0.72 + extT * 0.28
        volume = volume * 0.70 + extV * 0.30
    }

    function updateMetabolism(){
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
    }

    function publishFieldStructures(){
        const minField = Math.min(...field)
        const maxField = Math.max(...field)
        const range = Math.max(0.0001, maxField - minField)

        window._attractorFieldRaw = [...field]
        window._attractorField = field.map(v => clamp((v - minField) / range, 0, 1))

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
    }

    function publishLiveState(){
        const avgAbs = average(field.map(v => Math.abs(v)))
        const varianceValue = variance(field)

        let attractorType = "stable"

        if (temperature > 0.95 || varianceValue > 0.22) {
            attractorType = "chaos"
        } else if (avgAbs > 0.32 && temperature < 0.75) {
            attractorType = "cycle"
        } else if (pressure > 0.62 && avgAbs > 0.20) {
            attractorType = "trend"
        }

        const attractorIntensity = clamp(
            temperature * 0.45 +
            pressure * 0.35 +
            avgAbs * 0.20,
            0,
            1
        )

        const attractorScore =
            varianceValue * 0.5 +
            avgAbs * 0.3 +
            pressure * 0.2

        window.mtosLiveAttractorState = {
            type: attractorType,
            intensity: Number(attractorIntensity.toFixed(3)),
            score: Number(attractorScore.toFixed(3)),
            updatedAt: new Date().toISOString()
        }
    }

    function updateField(){
        const incomingField = buildIncomingField()

        field = field.map((prev, i) => prev * 0.82 + incomingField[i] * 0.18)

        const maxVal = Math.max(...field.map(v => Math.abs(v)), 1)
        for (let i = 0; i < N; i++) {
            field[i] = clamp(field[i] / maxVal, -1.5, 1.5)
        }

        volume = clamp(1 + Math.abs(field.reduce((a, b) => a + b, 0) / N), 0.1, 2.0)
        phi = pressure * volume
        consistency = clamp(1 - temperature * 0.5, 0, 1)

        applyEnvironmentFeedback()

        const newField = new Array(N).fill(0)
        const phaseFactor = getPhaseInfluence(phase)

        for (let i = 0; i < N; i++){
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

        const networkConflict = Number(networkFeedback.conflictRatio) || 0
        const networkSupport = Number(networkFeedback.supportRatio) || 0

        for (let i = 0; i < N; i++) {
            const segment = getSegmentIndex(i)
            const localIndex = getLocalIndex65(i)
            const seg = getSegmentProfile(segment, localIndex)

            const left = field[wrap(i - 1)]
            const right = field[wrap(i + 1)]
            const self = field[i]
            const mem = memory[i]

            const interaction = (left + right) * 0.5

            const localPressure = pressure * seg.pressureMul
            const localTemp = temperature * seg.tempMul

            const pressureEffect = -localPressure * self
            const memoryEffect = mem * (0.92 + seg.memoryGain)

            let networkEffect =
                networkSupport * 0.06 -
                networkConflict * 0.08

            let value =
                self * 0.4 +
                interaction * 0.4 +
                memoryEffect * 0.3 +
                pressureEffect +
                networkEffect

            const localPhi = Math.max(0, localPressure * Math.max(0, Math.min(1, Math.abs(self))))
            const thermalPenalty = localTemp * 0.06

            value += localPhi * 0.10
            value -= thermalPenalty

            let pull = 0
            let attractorBoost = 0

            if (selectedKin !== null) {
                const selectedIndex = KinRegistry.toIndex(selectedKin)
                const dist = circularDistance(i, selectedIndex, N)
                const sameSegment = getSegmentIndex(selectedIndex) === segment ? 1 : 0
                const segmentBonus = sameSegment ? 1.0 : 0.72

                pull = Math.exp(-dist / 12) * 0.22 * seg.pullMul * segmentBonus
            }

            const localContrast = Math.max(0, self - (left + right) * 0.5)
            if (localContrast > 0) {
                attractorBoost = localContrast * 0.35 * seg.pullMul
            }

            value += pull + attractorBoost
            value *= phaseFactor * Math.max(0.05, k)

            newField[i] = value

            memory[i] = memory[i] * (0.972 - seg.memoryGain * 0.22) + value * seg.memoryGain
            memory[i] = clamp(memory[i], -2, 2)
        }

        field = newField

        const spreadField = new Array(N).fill(0)
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

        const decayStrength = 0.15
        const decayField = new Array(N).fill(0)

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

        const clusterStrength = 0.62
        const clusterField = new Array(N).fill(0)

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

        for (let i = 0; i < N; i++) {
            field[i] = field[i] * 0.88 + memory[i] * 0.12
        }

        pressure = 0.3 + Math.abs(average(field)) * 0.7
        temperature = 0.3 + variance(field) * 1.5

        updateMetabolism()
        publishFieldStructures()
        publishLiveState()

        phase = (phase + 1) % 13
    }

    function draw(){
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.strokeStyle = "#333"
        ctx.beginPath()
        ctx.moveTo(0, 150)
        ctx.lineTo(canvas.width, 150)
        ctx.stroke()

        for (let i = 0; i < N; i++) {
            const x = (i / N) * canvas.width
            const y = 150 + field[i] * 100
            ctx.fillStyle = "orange"
            ctx.fillRect(x, y, 2, 2)
        }

        ctx.fillStyle = "#aaa"
        ctx.font = "10px monospace"

        ctx.fillText(`Phase: ${phase + 1}`, 10, 30)
        ctx.fillText(`Pressure: ${pressure.toFixed(2)}`, 10, 45)
        ctx.fillText(`Volume: ${volume.toFixed(2)}`, 10, 60)
        ctx.fillText(`Phi: ${phi.toFixed(3)}`, 10, 75)
        ctx.fillText(`k: ${k.toFixed(3)}`, 10, 90)
        ctx.fillText(`Consistency: ${consistency.toFixed(4)}`, 10, 105)
        ctx.fillText(`Temperature: ${temperature.toFixed(2)}`, 10, 120)

        const segMeans = [0, 0, 0, 0]
        const segCounts = [0, 0, 0, 0]

        for (let i = 0; i < N; i++) {
            const s = getSegmentIndex(i)
            segMeans[s] += field[i]
            segCounts[s] += 1
        }

        for (let s = 0; s < 4; s++) {
            segMeans[s] = segCounts[s] ? segMeans[s] / segCounts[s] : 0
        }

        ctx.fillText(`S0 init: ${segMeans[0].toFixed(2)}`, 10, 140)
        ctx.fillText(`S1 grow: ${segMeans[1].toFixed(2)}`, 10, 155)
        ctx.fillText(`S2 peak: ${segMeans[2].toFixed(2)}`, 10, 170)
        ctx.fillText(`S3 release: ${segMeans[3].toFixed(2)}`, 10, 185)

        const live = window.mtosLiveAttractorState || {
            type: "unknown",
            intensity: 0,
            score: 0
        }

        ctx.fillText(`Live type: ${String(live.type || "unknown")}`, 10, 215)
        ctx.fillText(`Live intensity: ${Number(live.intensity ?? 0).toFixed(3)}`, 10, 230)
        ctx.fillText(`Live score: ${Number(live.score ?? 0).toFixed(3)}`, 10, 245)
    }

    function loop(){
        if (!isPaused) {
            const wholeSteps = Math.max(1, Math.floor(speedMultiplier))

            for (let i = 0; i < wholeSteps; i++) {
                updateField()
            }

            if (speedMultiplier > 0 && speedMultiplier < 1) {
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

    const pauseBtn = document.createElement("button")
    pauseBtn.innerText = at("pauseBtn")
    pauseBtn.onclick = () => {
        isPaused = !isPaused
        pauseBtn.innerText = isPaused ? at("resumeBtn") : at("pauseBtn")
    }

    const slowBtn = document.createElement("button")
    slowBtn.innerText = at("slowBtn")
    slowBtn.onclick = () => {
        speedMultiplier = 0.3
    }

    const normalBtn = document.createElement("button")
    normalBtn.innerText = at("normalBtn")
    normalBtn.onclick = () => {
        speedMultiplier = 1
    }

    const boostBtn = document.createElement("button")
    boostBtn.innerText = at("boostBtn")
    boostBtn.onclick = () => {
        speedMultiplier = 5
    }

    const resetFieldBtn = document.createElement("button")
    resetFieldBtn.innerText = at("resetFieldBtn")
    resetFieldBtn.onclick = () => {
        field = new Array(N).fill(0)
        memory = new Array(N).fill(0)
        phase = 0
        pressure = 0.5
        volume = 0.5
        temperature = 0.5
        phi = 0
        k = 1
        consistency = 0

        window._attractorFieldRaw = new Array(N).fill(0)
        window._attractorField = new Array(N).fill(0.5)
        window._attractorSegments = []
        window.mtosLiveAttractorState = {
            type: "stable",
            intensity: 0,
            score: 0,
            updatedAt: new Date().toISOString()
        }

        draw()
    }

    ;[pauseBtn, slowBtn, normalBtn, boostBtn, resetFieldBtn].forEach(btn => {
        btn.style.marginRight = "5px"
        btn.style.cursor = "pointer"
    })

    controls.appendChild(pauseBtn)
    controls.appendChild(slowBtn)
    controls.appendChild(normalBtn)
    controls.appendChild(boostBtn)
    controls.appendChild(resetFieldBtn)

    root.appendChild(controls)
    root.appendChild(canvas)

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

    updateMetabolism()
    publishFieldStructures()
    publishLiveState()
    draw()
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