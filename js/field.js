import { KinRegistry } from "./kinRegistry.js"

const seals = [
    "Drg","Wnd","Ngt","Sed","Spr","WBr","Hnd","Str","Mon","Dog",
    "Mnk","Hum","Sky","Wzd","Egl","Wrr","Ert","Mir","Strm","Sun"
]

const densityColors = [
    "#a855f7", // 1
    "#8b5cf6", // 2
    "#6366f1", // 3
    "#3b82f6", // 4
    "#06b6d4", // 5
    "#14b8a6", // 6
    "#10b981", // 7
    "#84cc16", // 8
    "#eab308", // 9
    "#f59e0b", // 10
    "#f97316", // 11
    "#ef4444"  // 12+
]

export function drawField(rootOrId, users = [], mode = "global") {
    const root =
        typeof rootOrId === "string"
            ? document.getElementById(rootOrId)
            : rootOrId

    if (!root) return

    root.innerHTML = ""

    const canvas = document.createElement("canvas")
    canvas.width = 760
    canvas.height = 420
    canvas.style.display = "block"
    canvas.style.margin = "0 auto"
    root.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    const cols = 20
    const rows = 13

    const leftPad = 34
    const topPad = 20
    const gridW = W - leftPad
    const gridH = H - topPad

    const cellW = gridW / cols
    const cellH = gridH / rows

    ctx.clearRect(0, 0, W, H)

    const usersByKin = {}

    users.forEach(u => {
        const kin = Number(u.kin)
        if (!usersByKin[kin]) usersByKin[kin] = []
        usersByKin[kin].push(u)
    })

    for (let tone = 0; tone < rows; tone++) {
        for (let seal = 0; seal < cols; seal++) {
            const kin = KinRegistry.fromGrid(seal, tone)

            const x = leftPad + seal * cellW
            const y = topPad + tone * cellH

            ctx.fillStyle = "#020617"
            ctx.fillRect(x, y, cellW, cellH)

            ctx.strokeStyle = "#1e293b"
            ctx.strokeRect(x, y, cellW, cellH)

            const usersHere = usersByKin[kin] || []

            if (usersHere.length > 0) {
                const count = usersHere.length
                    
                if (count === 1) {
                    if (mode === "activity") {
                        ctx.fillStyle = "#22c55e"
                    } else if (mode === "pressure") {
                        ctx.fillStyle = "#ef4444"
                    } else if (mode === "hybrid") {
                        ctx.fillStyle = "#a855f7"
                    } else {
                        ctx.fillStyle = "#f59e0b"
                    }
                } else {
                    const colorIndex = Math.min(count - 2, densityColors.length - 1)
                    ctx.fillStyle = densityColors[colorIndex]
                }

                ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)
                    
                ctx.fillStyle = "#111827"
                ctx.font = "bold 12px monospace"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText(String(count), x + cellW / 2, y + cellH / 2)
            }
        }
    }

    ctx.fillStyle = "#94a3b8"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (let seal = 0; seal < cols; seal++) {
        const x = leftPad + seal * cellW + cellW / 2
        ctx.fillText(seals[seal], x, topPad / 2)
    }

    ctx.textAlign = "right"

    for (let tone = 0; tone < rows; tone++) {
        const y = topPad + tone * cellH + cellH / 2
        ctx.fillText(String(tone + 1), leftPad - 6, y)
    }

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        if (mx < leftPad || my < topPad) return

        const seal = Math.floor((mx - leftPad) / cellW)
        const tone = Math.floor((my - topPad) / cellH)

        if (seal < 0 || seal >= cols || tone < 0 || tone >= rows) return

        const kin = KinRegistry.fromGrid(seal, tone)

        if (window.onKinSelect) {
            window.onKinSelect(kin)
        }
    }
}
