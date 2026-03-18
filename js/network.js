export function drawNetwork(id, users, onSelect){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    const canvas = document.createElement("canvas")
    canvas.width = 420
    canvas.height = 420

    root.appendChild(canvas)

    const ctx = canvas.getContext("2d")

    const cx = 210
    const cy = 210
    const R = 140

    let selected = null
    let hover = null

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

                const w = u1.weight * u2.weight

                let sign = (u1.weight > 1 && u2.weight > 1) ? 1 : -1

                // фильтр по выбранному
                if(selected !== null && i !== selected && j !== selected){
                    ctx.globalAlpha = 0.05
                }else{
                    ctx.globalAlpha = 0.9
                }

                ctx.beginPath()
                ctx.moveTo(positions[i].x, positions[i].y)
                ctx.lineTo(positions[j].x, positions[j].y)

                ctx.strokeStyle = sign > 0 ? "#00ff88" : "#ff0044"
                ctx.lineWidth = Math.max(1, w * 4)

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

        for(let i=0;i<N;i++){

            const dx = mx - positions[i].x
            const dy = my - positions[i].y

            if(Math.sqrt(dx*dx + dy*dy) < 15){
                hover = i
                break
            }
        }

        draw()
    }

    draw()
}
