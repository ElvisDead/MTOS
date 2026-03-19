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

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory")) || {}

    const N = users.length

    const positions = users.map((u, i)=>{
        const angle = (i / N) * Math.PI * 2
        return {
            x: cx + R * Math.cos(angle),
            y: cy + R * Math.sin(angle)
        }
    })

    function draw(){

        ctx.clearRect(0,0,420,420)

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

        if(tooltip){
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

                draw()
                
                return
            }
        }
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
