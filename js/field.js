import { KinRegistry } from "./kinRegistry.js"

const seals = [
    "Drg","Wnd","Ngt","Sed","Spr","WBr","Hnd","Str","Mon","Dog",
    "Mnk","Hum","Sky","Wzd","Egl","Wrr","Ert","Mir","Strm","Sun"
]

const densityColors = [
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

function getFillColor(count) {
    if (count <= 0) return "#081122"
    if (count === 1) return "#0f172a"
    return densityColors[Math.min(count - 2, densityColors.length - 1)]
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
        popup.style.minWidth = "240px"
        popup.style.maxWidth = "340px"
        popup.style.background = "rgba(2,6,23,0.97)"
        popup.style.border = "1px solid #334155"
        popup.style.borderRadius = "10px"
        popup.style.padding = "10px 12px"
        popup.style.color = "#e5e7eb"
        popup.style.fontFamily = "monospace"
        popup.style.fontSize = "12px"
        popup.style.lineHeight = "1.45"
        popup.style.zIndex = "20"
        popup.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)"
        root.appendChild(popup)
    }

    return popup
}

function sealNameByIndex(sealIndex) {
    return seals[sealIndex] || "?"
}

function showFieldPopup(root, popup, x, y, kin, usersHere, mode) {
    const tone = ((kin - 1) % 13) + 1
    const sealIndex = (kin - 1) % 20
    const sealName = sealNameByIndex(sealIndex)

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

    if (left + 320 > rootRect.width) left = x - 250
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
            ctx.lineWidth = 1
            ctx.strokeRect(x, y, cellW, cellH)

            const usersHere = usersByKin[kin] || []

            if (usersHere.length > 0) {
                const count = usersHere.length
                const fillColor = getFillColor(count)
                const strokeColor = getStrokeColor(mode)

                ctx.fillStyle = "#081122"
                ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)

                ctx.fillStyle = fillColor
                ctx.fillRect(x + 5, y + 5, cellW - 10, cellH - 10)

                ctx.strokeStyle = strokeColor
                ctx.lineWidth = 2
                ctx.strokeRect(x + 3.5, y + 3.5, cellW - 7, cellH - 7)

                ctx.fillStyle = count >= 2 ? "#0b1020" : "#e5e7eb"
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
        const usersHere = usersByKin[kin] || []

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
        popup.style.display = "none"
    }
}
