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
    title.innerText = "Collective Relations"
    title.style.color = "#fff"
    title.style.fontWeight = "bold"
    title.style.fontSize = "16px"
    title.style.textAlign = "center"
    title.style.marginBottom = "10px"

    box.appendChild(title)

    const tempEl = document.createElement("div")
    tempEl.innerText = "System Temperature: " + temperature.toFixed(2)
    tempEl.style.color = "#888"
    tempEl.style.textAlign = "center"
    tempEl.style.marginBottom = "8px"
        
    box.appendChild(tempEl)

    const attractorIntensity = Number(attractorState?.intensity ?? 0)

const attractorText = isNaN(attractorIntensity)
    ? "0%"
    : (attractorIntensity * 100).toFixed(1) + "%"

const attractorEl = document.createElement("div")
attractorEl.innerText =
    "Attractor: " +
((attractorState && typeof attractorState.type === "string" && attractorState.type.trim())
    ? attractorState.type
    : "unknown") +
" (" + attractorText + ")"
attractorEl.style.color = "#888"
attractorEl.style.textAlign = "center"
attractorEl.style.marginBottom = "8px"

box.appendChild(attractorEl)

const timePressureEl = document.createElement("div")
timePressureEl.innerText =
    "Time Pressure: " +
    timePressureState.pressure.toFixed(2) +
    " • " +
    timePressureState.label +
    " • " +
    timePressureState.temporalMode
timePressureEl.style.color = "#888"
timePressureEl.style.textAlign = "center"
timePressureEl.style.marginBottom = "8px"

box.appendChild(timePressureEl)

    // ===== ПРОВЕРКА =====
    if(!users || users.length < 2){
        const empty = document.createElement("div")
        empty.innerText = "Not enough participants"
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
            let score
                    
            if(memory[key] !== undefined){

                // если связь обнулена — полностью игнорируем
                if(memory[key] === 0){
                    continue
                }

                const drift = 0
                const decay = 0

                score = memory[key] + drift + decay
                score = Math.max(-1, Math.min(1, score))
                // time pressure influence
if (timePressureState.pressure >= 0.82) {
    if (score > 0) {
        score *= (1 - 0.22 * timePressureState.pressure)
    } else if (score < 0) {
        score *= (1 + 0.26 * timePressureState.pressure)
    }

    if (Math.abs(score) < 0.2) {
        score *= (1 - 0.14 * timePressureState.pressure)
    }
}
else if (timePressureState.pressure >= 0.62) {
    if (score > 0) {
        score *= (1 - 0.12 * timePressureState.pressure)
    } else if (score < 0) {
        score *= (1 + 0.16 * timePressureState.pressure)
    }
}
else if (timePressureState.pressure < 0.34) {
    if (score > 0) {
        score *= (1 + 0.05 * (1 - timePressureState.pressure))
    }
}

if ((attractorState?.type || "unknown") === "chaos") {
    if (score > 0) {
        score *= (1 - 0.15 * attractorState.intensity)
    } else if (score < 0) {
        score *= (1 + 0.18 * attractorState.intensity)
    }
} else if ((attractorState?.type || "unknown") === "cycle"){
    score *= (1 + 0.08 * attractorState.intensity)
}

else if ((attractorState?.type || "unknown") === "trend") {
    if (Math.abs(score) > 0.3) {
        score *= (1 + 0.12 * attractorState.intensity)
    }
}

else if ((attractorState?.type || "unknown") === "stable") {
    score *= (1 - 0.05 * attractorState.intensity)
}

score = Math.max(-1, Math.min(1, score))
            }else{

                // ❌ НИЧЕГО НЕ СОЗДАЁМ С НУЛЯ
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
                score: score
            })
        }
    }

    // ===== СОРТИРОВКА (сильные сверху) =====
    relations.sort((x, y) => y.score - x.score)

    // ===== РЕНДЕР =====
    relations.forEach(r => {

        const {label, color} = getRelationLabel(r.score)

        const row = document.createElement("div")
        row.style.display = "grid"
        row.style.gridTemplateColumns = "1fr auto 1fr"
        row.style.alignItems = "center"
        row.style.textAlign = "center"
        row.style.padding = "6px 8px"
        row.style.borderBottom = "1px solid #111"
        row.style.background = "rgba(255,255,255," + (Math.abs(r.score) * 0.08) + ")"
        row.style.fontSize = "13px"

        row.title = "Score: " + r.score.toFixed(3)
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

            //propagateImpact(memory, users, r.a, r.b, impact)
                
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
                
            //propagateImpact(memory, users, r.a, r.b, impact)
                
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
        status.innerText = label + " (" + r.score.toFixed(2) + ")"
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

    root.appendChild(box)

    const description = document.createElement("div")
    description.style.color = "#888"
    description.style.fontSize = "12px"
    description.style.textAlign = "center"
    description.style.marginTop = "10px"
        
    description.innerText = 
        "Left click → Support (+)\n" +
        "Right click → Conflict (−)\n" +
        "Shift + Click → Neutral (0)\n\n" +
        "The system reveals dynamic relationships between participants.\n" +
"Connections evolve over time, influenced by user actions, internal dynamics, time pressure, and random events."
        
    description.style.whiteSpace = "pre-line"
        
    root.appendChild(description)
}


// ===== ШКАЛА ОТНОШЕНИЙ =====
function getRelationLabel(score){

    if(score >= 0.9){
        return {label:"Ultra Synergy", color:"#00ffd5"}
    }

    if(score >= 0.75){
        return {label:"Strong", color:"#00cc66"}
    }

    if(score >= 0.6){
        return {label:"Collaborate", color:"#33ff66"}
    }

    if(score >= 0.45){
        return {label:"Support", color:"#99ff99"}
    }

    if(score >= 0.3){
        return {label:"Weak Support", color:"#cccccc"}
    }

    if(score >= 0.15){
        return {label:"Neutral", color:"#888888"}
    }

    if(score >= 0){
        return {label:"Tension", color:"#ffcc00"}
    }

    if(score >= -0.3){
        return {label:"Conflict", color:"#ff6600"}
    }

    return {label:"Strong Conflict", color:"#ff0000"}
}
