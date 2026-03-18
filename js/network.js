export function drawNetwork(id, users){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    root.style.display = "flex"
    root.style.flexDirection = "column"
    root.style.alignItems = "center"

    const title = document.createElement("div")
    title.innerText = "Agent Network"
    title.style.marginBottom = "10px"
    title.style.fontFamily = "monospace"

    root.appendChild(title)

    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 400

    root.appendChild(canvas)

    const ctx = canvas.getContext("2d")

    const cx = 200
    const cy = 200
    const R = 130

    const N = users.length

    // ===============================
    // ПОЗИЦИИ
    // ===============================
    const positions = []

    for(let i=0;i<N;i++){

        const angle = (i / N) * Math.PI * 2

        positions.push({
            x: cx + R * Math.cos(angle),
            y: cy + R * Math.sin(angle)
        })
    }

    // ===============================
    // СВЯЗИ
    // ===============================
    for(let i=0;i<N;i++){
        for(let j=i+1;j<N;j++){

            const u1 = users[i]
            const u2 = users[j]

            const w = u1.weight * u2.weight

            // знак (упрощённо через веса)
            const sign = (u1.weight > 1 && u2.weight > 1) ? 1 : -1

            ctx.beginPath()

            ctx.moveTo(positions[i].x, positions[i].y)
            ctx.lineTo(positions[j].x, positions[j].y)

            if(sign > 0){
                ctx.strokeStyle = "rgba(0,255,0,0.7)" // синергия
            }else{
                ctx.strokeStyle = "rgba(255,0,0,0.7)" // конфликт
            }

            ctx.lineWidth = Math.max(1, w * 3)

            ctx.stroke()
        }
    }

    // ===============================
    // УЗЛЫ
    // ===============================
    for(let i=0;i<N;i++){

        const u = users[i]
        const p = positions[i]

        ctx.beginPath()
        ctx.arc(p.x, p.y, 10 + u.weight * 4, 0, Math.PI * 2)

        ctx.fillStyle = "#111"
        ctx.fill()

        ctx.fillStyle = "#fff"
        ctx.font = "10px monospace"
        ctx.textAlign = "center"

        ctx.fillText(u.name, p.x, p.y + 3)
    }
}
