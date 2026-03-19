export function drawCollective(id, users){

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

    // ===== ПРОВЕРКА =====
    if(!users || users.length < 2){
        const empty = document.createElement("div")
        empty.innerText = "
Not enough participants"
        empty.style.color = "#888"
        empty.style.textAlign = "center"
        box.appendChild(empty)

        root.appendChild(box)
        return
    }

    // ===== СТРОИМ СВЯЗИ =====
    const relations = []

    for(let i = 0; i < users.length; i++){
        for(let j = i + 1; j < users.length; j++){

            const a = users[i]
            const b = users[j]

            // === БАЗОВАЯ ЛОГИКА (потом заменишь на MTOS) ===
            const base = ((a.weight || 1) + (b.weight || 1)) / 2 - 0.5
            const noise = (Math.random() - 0.5) * 0.8
            const score = Math.max(-1, Math.min(1, base + noise))

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
        status.innerText = label
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

    root.appendChild(box)
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
