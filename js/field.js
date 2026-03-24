import { KinRegistry } from "./kinRegistry.js"

const densityColors = [
    "#1e293b", // 1
    "#c084fc", // 2
    "#8b5cf6", // 3
    "#6366f1", // 4
    "#3b82f6", // 5
    "#06b6d4", // 6
    "#14b8a6", // 7
    "#10b981", // 8
    "#84cc16", // 9
    "#eab308", // 10
    "#f59e0b", // 11
    "#f97316", // 12
    "#ef4444"  // 13+
]

const sealNames = [
    "Dragon","Wind","Night","Seed","Serpent","WorldBridger","Hand","Star","Moon","Dog",
    "Monkey","Human","Skywalker","Wizard","Eagle","Warrior","Earth","Mirror","Storm","Sun"
]

let selectedFieldKin = null

function getFillColor(count) {
    if (count <= 0) return "#081122"
    return densityColors[Math.min(count - 1, densityColors.length - 1)]
}

function getStrokeColor(mode) {
    if (mode === "activity") return "#22c55e"
    if (mode === "pressure") return "#ef4444"
    if (mode === "hybrid") return "#7c3aed"
    return "#f59e0b"
}

function ensureFieldPopup(root) {
    let popup = root.querySelector(".field-popup")

    if (!popup) {
        popup = document.createElement("div")
        popup.className = "field-popup"
        popup.style.position = "absolute"
        popup.style.display = "none"
        popup.style.minWidth = "260px"
        popup.style.maxWidth = "360px"
        popup.style.background = "rgba(2,6,23,0.98)"
        popup.style.border = "1px solid #334155"
        popup.style.borderRadius = "10px"
        popup.style.padding = "10px 12px"
        popup.style.color = "#e5e7eb"
        popup.style.fontFamily = "monospace"
        popup.style.fontSize = "12px"
        popup.style.lineHeight = "1.5"
        popup.style.zIndex = "20"
        popup.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)"
        root.appendChild(popup)
    }

    return popup
}

function showFieldPopup(root, popup, x, y, kin, usersHere, mode) {
    const tone = ((kin - 1) % 13) + 1
    const sealIndex = (kin - 1) % 20
    const sealName = sealNames[sealIndex] || "?"
    const names = usersHere.length
        ? usersHere.map((u, i) => `${i + 1}. ${u.name}`).join("<br>")
        : "No users"

    popup.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="font-weight:bold;color:#f8fafc;">Kin ${kin}</div>
            <button class="field-popup-close" style="
                background:#111827;
                color:#cbd5e1;
                border:1px solid #334155;
                border-radius:6px;
                cursor:pointer;
                font-size:11px;
                padding:2px 6px;
            ">×</button>
        </div>

        <div style="color:#94a3b8;margin-bottom:6px;">
            Tone: ${tone} | Seal: ${sealName} | Mode: ${mode}
        </div>

        <div style="margin-bottom:6px;">
            Users in kin: <b>${usersHere.length}</b>
        </div>

        <div style="color:#e2e8f0;">
            ${names}
        </div>
    `

    popup.style.display = "block"

    const rootRect = root.getBoundingClientRect()
    let left = x + 12
    let top = y + 12

    if (left + 340 > rootRect.width) left = x - 260
    if (top + 220 > rootRect.height) top = y - 180

    popup.style.left = `${Math.max(8, left)}px`
    popup.style.top = `${Math.max(8, top)}px`

    const closeBtn = popup.querySelector(".field-popup-close")
    if (closeBtn) {
        closeBtn.onclick = () => {
            popup.style.display = "none"
        }
    }
}

function kinToCoords(kin, cols = 20, rows = 13) {
    for (let tone = 0; tone < rows; tone++) {
        for (let seal = 0; seal < cols; seal++) {
            if (KinRegistry.fromGrid(seal, tone) === kin) {
                return { seal, tone }
            }
        }
    }
    return null
}

function drawKinDiagonal(ctx, selectedKin, leftPad, topPad, cellW, cellH) {
    if (!selectedKin) return

    const path = []
    for (let d = -12; d <= 12; d++) {
        const kin = ((selectedKin - 1 + d + 260 * 3) % 260) + 1
        const coords = kinToCoords(kin)
        if (coords) {
            path.push({
                x: leftPad + coords.seal * cellW + cellW / 2,
                y: topPad + coords.tone * cellH + cellH / 2,
                kin
            })
        }
    }

    if (path.length < 2) return

    ctx.save()
    ctx.strokeStyle = "rgba(255,255,255,0.18)"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])

    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i]
        const b = path[i + 1]

        const dx = Math.abs(a.x - b.x)
        const dy = Math.abs(a.y - b.y)

        // не соединяем точки через дальний скачок при тороидальном переходе
        if (dx > cellW * 3 || dy > cellH * 3) continue

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
    }

    ctx.setLineDash([])
    ctx.restore()
}

export function drawField(rootOrId, users = [], mode = "global") {
    const root =
        typeof rootOrId === "string"
            ? document.getElementById(rootOrId)
            : rootOrId

    if (!root) return

    root.innerHTML = ""
    root.style.position = "relative"

    const canvas = document.createElement("canvas")
    canvas.width = 760
    canvas.height = 420
    canvas.style.display = "block"
    canvas.style.margin = "0 auto"
    root.appendChild(canvas)

    const popup = ensureFieldPopup(root)
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    const cols = 20
    const rows = 13

    const leftPad = 34
    const topPad = 10
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

    // grid
    for (let tone = 0; tone < rows; tone++) {
        for (let seal = 0; seal < cols; seal++) {
            const kin = KinRegistry.fromGrid(seal, tone)
            const x = leftPad + seal * cellW
            const y = topPad + tone * cellH

            ctx.fillStyle = "#020617"
            ctx.fillRect(x, y, cellW, cellH)

            ctx.strokeStyle = "#1e293b"
            ctx.lineWidth = 1
            ctx.strokeRect(x, y, cellW, cellH)

            const usersHere = usersByKin[kin] || []

            if (usersHere.length > 0) {
                const count = usersHere.length
                const fillColor = getFillColor(count)
                const strokeColor = getStrokeColor(mode)

                // фон клетки
                ctx.fillStyle = "#081122"
                ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)

                // внутренняя заливка = плотность
                ctx.fillStyle = fillColor
                ctx.fillRect(x + 6, y + 6, cellW - 12, cellH - 12)

                // рамка = режим
                ctx.strokeStyle = strokeColor
                ctx.lineWidth = 2
                ctx.strokeRect(x + 3.5, y + 3.5, cellW - 7, cellH - 7)

                // число участников
                ctx.fillStyle = count >= 2 ? "#0b1020" : "#e5e7eb"
                ctx.font = "bold 12px monospace"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText(String(count), x + cellW / 2, y + cellH / 2)
            }

            // выделение выбранного kin
            if (selectedFieldKin === kin) {
                ctx.strokeStyle = "#ffffff"
                ctx.lineWidth = 2
                ctx.strokeRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3)
            }
        }
    }

    // диагональ выбранного kin
    drawKinDiagonal(ctx, selectedFieldKin, leftPad, topPad, cellW, cellH)

    // tones only
    ctx.fillStyle = "#94a3b8"
    ctx.font = "10px monospace"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

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
        const usersHere = usersByKin[kin] || []

        selectedFieldKin = kin

        // redraw with diagonal highlight
        drawField(root, users, mode)

        if (usersHere.length > 0) {
            showFieldPopup(
                root,
                popup,
                leftPad + seal * cellW + cellW / 2,
                topPad + tone * cellH + cellH / 2,
                kin,
                usersHere,
                mode
            )
        } else {
            popup.style.display = "none"
        }
    }

    canvas.oncontextmenu = (e) => {
        e.preventDefault()
        selectedFieldKin = null
        popup.style.display = "none"
        drawField(root, users, mode)
    }
}
