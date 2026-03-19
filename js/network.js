export function drawNetwork(id, users, onSelect){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    const canvas = document.createElement("canvas")
    canvas.width = 420
    canvas.height = 420

    root.appendChild(canvas)

    const desc = document.createElement("div")
        
    desc.innerText =
        "Nodes represent participants.\n" +
        "Lines represent relationships.\n" +
        "Green = support, Red = conflict.\n" +
        "Thicker lines = stronger connections.\n" +
        "Only significant relationships are shown."
        
    desc.style.whiteSpace = "pre-line"
    desc.style.color = "#888"
    desc.style.textAlign = "center"
    desc.style.marginTop = "10px"
        
    root.appendChild(desc)

    const ctx = canvas.getContext("2d")

    const cx = 210
    const cy = 210
    const R = 140

    let selected = null
    let hover = null
    let tooltip = null
    let hoverEdge = null

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory")) || {}

    const N = users.length

    const positions = users.map((u, i)=>{
        const angle = (i / N) * Math.PI * 2
        return {
            x: cx + R * Math.cos(angle),
            y: cy + R * Math.sin(angle)

    const velocities = users.map(()=>({x:0, y:0}))

            function loop(){
            
            draw()
                
            requestAnimationFrame(loop)
        }
        
        loop()
    
    }
                                })

    function applyClustering(){

        for(let i=0;i<N;i++){
            for(let j=i+1;j<N;j++){

                const u1 = users[i]
                const u2 = users[j]

                const key1 = u1.name + "->" + u2.name
                const key2 = u2.name + "->" + u1.name

                const score = ((memory[key1] || 0) + (memory[key2] || 0)) / 2

                if(score > 0.3){

                    const dx = positions[j].x - positions[i].x
                    const dy = positions[j].y - positions[i].y

                    positions[i].x += dx * 0.01 * score
                    positions[i].y += dy * 0.01 * score

                    positions[j].x -= dx * 0.01 * score
                    positions[j].y -= dy * 0.01 * score
                }
            }
        }
    }

    function applyForces(){
                    
                    // отталкивание
                    for(let i=0;i<N;i++){
                        for(let j=i+1;j<N;j++){
                            
                            const dx = positions[j].x - positions[i].x
                            const dy = positions[j].y - positions[i].y
                                
                            const dist = Math.sqrt(dx*dx + dy*dy) + 0.01
                            const force = 50 / dist
                                
                            const fx = force * dx / dist
                            const fy = force * dy / dist
                                
                            velocities[i].x -= fx
                            velocities[i].y -= fy
                                
                            velocities[j].x += fx
                            velocities[j].y += fy
                        }
                    }
        
        // притяжение к центру
        for(let i=0;i<N;i++){
            velocities[i].x += (cx - positions[i].x) * 0.001
            velocities[i].y += (cy - positions[i].y) * 0.001
        }
        
        // применение
        for(let i=0;i<N;i++){
            positions[i].x += velocities[i].x
            positions[i].y += velocities[i].y
                
            velocities[i].x *= 0.85
            velocities[i].y *= 0.85
        }
    }
    
    draw()
        
    return
}
}
}

    function draw(){

        ctx.clearRect(0,0,420,420)

        applyClustering()

        applyForces()

        // ===============================
        // СВЯЗИ
        // ===============================
        for(let i=0;i<N;i++){
            for(let j=i+1;j<N;j++){

                const u1 = users[i]
                const u2 = users[j]

                const key1 = u1.name + "->" + u2.name
                const key2 = u2.name + "->" + u1.name
                    
                const score = ((memory[key1] || 0) + (memory[key2] || 0)) / 2
                
                // ❗ ФИЛЬТР
                if(Math.abs(score) < 0.3) continue

                // фильтр по выбранному
                if(selected !== null && i !== selected && j !== selected){
                    ctx.globalAlpha = 0.05
                }else{
                    ctx.globalAlpha = 0.2 + Math.abs(score) * 0.8
                }

                ctx.beginPath()
                ctx.moveTo(positions[i].x, positions[i].y)
                ctx.lineTo(positions[j].x, positions[j].y)

                ctx.strokeStyle = score > 0 ? "#00ff88" : "#ff4444"
                ctx.lineWidth = Math.max(1, Math.abs(score) * 5)

                ctx.stroke()

                }
            }

        ctx.globalAlpha = 1

        // ===============================
        // УЗЛЫ
        // ===============================
        for(let i=0;i<N;i++){

            const u = users[i]
            const p = positions[i]

            let radius = 10 + u.weight * 6

            if(i === selected) radius += 6
            if(i === hover) radius += 3

            ctx.beginPath()
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)

            ctx.fillStyle = "#111"
            ctx.fill()

            // рамка
            if(i === selected){
                ctx.strokeStyle = "yellow"
                ctx.lineWidth = 3
                ctx.stroke()
            }

            // текст
            ctx.fillStyle = "#fff"
            ctx.font = "11px monospace"
            ctx.textAlign = "center"

            ctx.fillText(u.name, p.x, p.y + 4)
        }

        if(hoverEdge){
            ctx.fillStyle = "#fff"
            ctx.font = "14px Arial"
            ctx.textAlign = "center"
            ctx.fillText(hoverEdge.text, cx, 20)
        }
        else if(tooltip){
            ctx.fillStyle = "#fff"
            ctx.font = "14px Arial"
            ctx.textAlign = "center"
            ctx.fillText(tooltip, cx, 20)
        }

    }

    // ===============================
    // CLICK
    // ===============================
    canvas.onclick = (e)=>{

        const rect = canvas.getBoundingClientRect()

        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        for(let i=0;i<N;i++){

            const dx = mx - positions[i].x
            const dy = my - positions[i].y

            if(Math.sqrt(dx*dx + dy*dy) < 15){

                selected = (selected === i) ? null : i

                if(onSelect){
                    onSelect(selected !== null ? users[selected] : null)
                }

                

    // ===============================
    // HOVER
    // ===============================
    canvas.onmousemove = (e)=>{

    const rect = canvas.getBoundingClientRect()

    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    hover = null
    tooltip = null
    hoverEdge = null

    for(let i=0;i<N;i++){
        for(let j=i+1;j<N;j++){
            
            const x1 = positions[i].x
            const y1 = positions[i].y
            const x2 = positions[j].x
            const y2 = positions[j].y
                
            const A = mx - x1
            const B = my - y1
            const C = x2 - x1
            const D = y2 - y1
                
            const dot = A*C + B*D
            const len_sq = C*C + D*D
            const param = dot / len_sq
                
            if(param >= 0 && param <= 1){
                const xx = x1 + param * C
                const yy = y1 + param * D
                    
                const dx = mx - xx
                const dy = my - yy
                    
                if(Math.sqrt(dx*dx + dy*dy) < 6){
                    
                    const u1 = users[i]
                    const u2 = users[j]
                        
                    const key1 = u1.name + "->" + u2.name
                    const key2 = u2.name + "->" + u1.name
                        
                    const score = ((memory[key1] || 0) + (memory[key2] || 0)) / 2
                        
                    hoverEdge = {
                        text: `${u1.name} ↔ ${u2.name}: ${score.toFixed(2)}`
                    }
                }
            }
        }
    }

    for(let i=0;i<N;i++){

        const dx = mx - positions[i].x
        const dy = my - positions[i].y

        if(Math.sqrt(dx*dx + dy*dy) < 15){
            hover = i
            tooltip = users[i].name
            break
        }
    }

    draw()
}
}
