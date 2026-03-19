export function drawSeries(id, weather, year, month, day){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    const startDate = new Date(year, month - 1, day)

    function formatDate(d){
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short"
        })
    }

    function drawBlock(length, title){

        const wrap = document.createElement("div")
        wrap.style.marginBottom = "30px"
        wrap.style.textAlign = "center"

        const label = document.createElement("div")
        label.innerText = title
        label.style.marginBottom = "5px"
        label.style.color = "white"

        const canvas = document.createElement("canvas")
        const width = 500
        const height = 160

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")

        const padLeft = 50
        const padBottom = 30
        const padTop = 10
        const padRight = 10

        const innerW = width - padLeft - padRight
        const innerH = height - padTop - padBottom

        const data = weather.slice(0, length).map(w => w.attention)

        const min = Math.min(...data)
        const max = Math.max(...data)
        const range = max - min || 1

        const norm = data.map(v => (v - min) / range)

        // ===== Y GRID =====
        ctx.strokeStyle = "#333"
        ctx.fillStyle = "#aaa"
        ctx.font = "10px Arial"

        for(let i=0;i<=4;i++){
            const v = i / 4
            const y = padTop + innerH - v * innerH

            ctx.beginPath()
            ctx.moveTo(padLeft, y)
            ctx.lineTo(width - padRight, y)
            ctx.stroke()

            const val = (min + v * range).toFixed(2)
            ctx.fillText(val, 5, y + 3)
        }

        // ===== X GRID + DATES =====
        const steps = Math.min(length, 6)

        for(let i=0;i<steps;i++){

            const idx = Math.floor(i * (length-1) / (steps-1))
            const x = padLeft + (idx/(length-1)) * innerW

            const d = new Date(startDate)
            d.setDate(d.getDate() + idx)

            ctx.beginPath()
            ctx.moveTo(x, padTop)
            ctx.lineTo(x, padTop + innerH)
            ctx.strokeStyle = "#222"
            ctx.stroke()

            ctx.fillStyle = "#aaa"
            ctx.fillText(formatDate(d), x-18, height - 5)
        }

        // ===== LINE =====
        ctx.beginPath()

        for(let i=0;i<norm.length;i++){

            const x = padLeft + (i/(norm.length-1)) * innerW
            const y = padTop + innerH - norm[i] * innerH

            if(i===0) ctx.moveTo(x,y)
            else ctx.lineTo(x,y)
        }

        ctx.strokeStyle = "cyan"
        ctx.lineWidth = 2
        ctx.stroke()

        // ===== HOVER =====
        canvas.onmousemove = (e)=>{
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left

            const i = Math.floor(((x - padLeft)/innerW) * data.length)

            if(i >= 0 && i < data.length){

                const d = new Date(startDate)
                d.setDate(d.getDate() + i)

                canvas.title =
                    "Date: " + formatDate(d) +
                    "\nValue: " + data[i].toFixed(3)
            }
        }

        wrap.appendChild(label)
        wrap.appendChild(canvas)

        return wrap
    }

    root.appendChild(drawBlock(7, "7 days"))
    root.appendChild(drawBlock(30, "30 days"))
    root.appendChild(drawBlock(260, "260 days"))

    // ===============================
    // DESCRIPTION (ENGLISH)
    // ===============================
    const desc = document.createElement("div")
    desc.style.color = "#aaa"
    desc.style.fontSize = "12px"
    desc.style.marginTop = "10px"
    desc.style.maxWidth = "600px"
    desc.style.marginInline = "auto"
    desc.style.lineHeight = "1.4"

    desc.innerText = `
These charts represent the temporal evolution of attention within the 260-phase cognitive cycle.

• 7 days — short-term fluctuations and immediate dynamics
• 30 days — mid-range stability and behavioral patterns
• 260 days — full cycle structure (complete phase space traversal)

Values are normalized per window, meaning each chart highlights relative changes rather than absolute magnitude.

The system reflects how attention distributes over time under internal pressure, noise, and structural constraints of the cognitive field.
`

    root.appendChild(desc)
}
