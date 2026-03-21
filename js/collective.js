export function drawCollective(id, users){
    function propagateImpact(memory, users, sourceA, sourceB, impact){

    const spreadFactor = 0.1 + temperature * 0.4 // сила распространения

    users.forEach(u => {

        if(u.name === sourceA || u.name === sourceB) return

        // A влияет на остальных
        const key1 = sourceA + "->" + u.name
        if(memory[key1] !== undefined){
            memory[key1] += impact * spreadFactor
        }

        // остальные влияют на B
        const key2 = u.name + "->" + sourceB
        if(memory[key2] !== undefined){
            memory[key2] += impact * spreadFactor
        }

        // нормализация
        if(memory[key1] !== undefined){
            memory[key1] = Math.max(-1, Math.min(1, memory[key1]))
        }

        if(memory[key2] !== undefined){
            memory[key2] = Math.max(-1, Math.min(1, memory[key2]))
        }
    })
}
    const STORAGE_KEY = "collective_relations_memory"

    const TEMP_KEY = "collective_temperature"
        
    let temperature = Number(localStorage.getItem(TEMP_KEY)) || 0.5
    
    // плавное изменение температуры
    temperature += (Math.random() - 0.5) * 0.1
    temperature = Math.max(0, Math.min(1, temperature))

    let memory = {}
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
            let score
                    
            if(memory[key] !== undefined){

                // если связь обнулена — полностью игнорируем
                if(memory[key] === 0){
                    continue
                }

                const drift = (Math.random() - 0.5) * (0.05 + temperature * 0.2)
                const decay = -0.01 - (1 - temperature) * 0.03

                score = memory[key] + drift + decay
                score = Math.max(-1, Math.min(1, score))
            }else{

                // ❌ НИЧЕГО НЕ СОЗДАЁМ С НУЛЯ
                continue
            }

            memory[key] = Number(score.toFixed(4))

            // случайные события
            if(Math.random() < 0.05){
                const eventImpact = (Math.random() - 0.5) * 0.8
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
                
            const impact = -0.4
                
            const key = r.a + "->" + r.b
                
            memory[key] = Math.max(-1, Math.min(1, (memory[key] || 0) + impact))

            propagateImpact(memory, users, r.a, r.b, impact)
                
            temperature += Math.abs(impact) * 0.1
            temperature = Math.max(0, Math.min(1, temperature))
                
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
            localStorage.setItem(TEMP_KEY, temperature.toFixed(3))
                
            drawCollective(id, users)
        }

        row.onclick = (e) => {
            
            const key = r.a + "->" + r.b
                
            let impact = 0
                
            if(e.shiftKey){
                // тянем к нейтрали
                impact = -(memory[key] || 0) * 0.1
            }else{
                // поддержка
                impact = 0.3
            }
            
            memory[key] = Math.max(-1, Math.min(1, (memory[key] || 0) + impact))
                
            propagateImpact(memory, users, r.a, r.b, impact)
                
            temperature += Math.abs(impact) * 0.1
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
        "Connections evolve over time, influenced by user actions, internal dynamics, and random events."
        
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
