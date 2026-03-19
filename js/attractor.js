export function drawAttractor(id, participants = [], relations = []) {

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

    let field = new Array(N).fill(0)
    let memory = new Array(N).fill(0)

    // =========================
    // MTOS REAL DATA INPUT
    // =========================
    
    // 1. участники → базовое поле
    participants.forEach(p => {
        const i = ((p.kin % N) + N) % N
        const w = p.weight !== undefined ? p.weight : 1
        field[i] += w
    })
    
    // 2. связи → распространение сигнала
    let relField = [...field]
        
    relations.forEach(r => {
        const from = ((r.from % N) + N) % N
        const to = ((r.to % N) + N) % N
        const s = r.strength !== undefined ? r.strength : 1
            
        relField[to] += field[from] * s
    })
        
    field = relField
    
    // 3. нормализация (чтобы не взрывалось)
    const maxVal = Math.max(...field.map(v => Math.abs(v)), 1)
        
    for (let i = 0; i < N; i++) {
        field[i] = field[i] / maxVal
    }

    let pressure = 0.5      // P
    let temperature = 0.5   // T
    let k = 1.0             // rhythm constant

    let phase = 0           // 0–12 (13 фаз)

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

        for (let i = 0; i < N; i++) {

            const left = field[wrap(i - 1)]
            const right = field[wrap(i + 1)]
            const self = field[i]
            const mem = memory[i]

            // взаимодействие сигналов
            let interaction = (left + right) * 0.5

            // давление (скепсис)
            let pressureEffect = -pressure * self

            // память (аттрактор)
            let memoryEffect = mem * 0.6

            // температура (хаос / активность)
            let noise = (Math.random() - 0.5) * temperature

            // итоговая динамика
            let value =
                self * 0.4 +
                interaction * 0.4 +
                memoryEffect * 0.3 +
                pressureEffect +
                noise

            // фазовая модуляция
            value *= phaseFactor * k

            newField[i] = value

            // обновление памяти (медленно)
            memory[i] = memory[i] * 0.95 + value * 0.05
        }

        field = newField

        // =========================
        // POST-PROCESS FIELD (MTOS PHYSICS)
        // =========================
        
        // 1. diffusion
        const diffusion = 0.25
        let spreadField = new Array(N).fill(0)
            
        for (let i = 0; i < N; i++) {
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
        const clusterStrength = 0.4
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

        // обновление параметров
        pressure = 0.3 + Math.abs(average(field)) * 0.7
        temperature = 0.2 + variance(field)

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

        ctx.fillText(`Phase: ${phase + 1}/13`, 10, 15)
        ctx.fillText(`Pressure: ${pressure.toFixed(2)}`, 10, 30)
        ctx.fillText(`Temperature: ${temperature.toFixed(2)}`, 10, 45)
    }

    // =========================
    // LOOP
    // =========================

    function loop() {
        updateField()
        draw()
        requestAnimationFrame(loop)
    }

    root.appendChild(canvas)

    // =========================
    // DESCRIPTION (ENGLISH)
    // =========================

    const description = document.createElement("div")
    description.style.color = "#888"
    description.style.fontSize = "12px"
    description.style.marginTop = "10px"
    description.style.fontFamily = "monospace"

    description.innerHTML = `
MTOS Attractor — Dynamic Cognitive Field Visualization

This system represents a 260-node cyclic field evolving under metabolic dynamics.

Each point corresponds to a node in the field:
• X-axis — position in the 260-cycle
• Y-axis — signal intensity

Core dynamics:
• Memory — stabilizes recurring patterns (attractor formation)
• Pressure — suppresses unstable signals (skepticism)
• Temperature — introduces variability (activity / noise)
• Phase — modulates behavior across 13-cycle temporal states

The attractor evolves in real time, showing:
• formation of patterns
• collapse of unstable structures
• emergence of coherent clusters

This is not a static graph, but a living system.
`

    root.appendChild(description)

    loop()
}
