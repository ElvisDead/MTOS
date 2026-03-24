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

function clamp01(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function getFillColor(count) {
    if (count <= 0) return "#081122"
    return densityColors[Math.min(count - 1, densityColors.length - 1)]
}

function safeWeatherAt(weather, kin) {
    const w = Array.isArray(weather) ? weather[kin - 1] : null
    if (!w || typeof w !== "object") {
        return {
            attention: 0,
            activity: 0,
            pressure: 0,
            conflict: 0
        }
    }

    return {
        attention: clamp01(w.attention ?? 0),
        activity: clamp01(w.activity ?? w.attention ?? 0),
        pressure: clamp01(w.pressure ?? 0),
        conflict: clamp01(w.conflict ?? 0)
    }
}

function safeFieldAt(fieldValues, kin) {
    if (!Array.isArray(fieldValues)) return 0
    return clamp01(fieldValues[kin - 1] ?? 0)
}

function neighborFieldAverage(fieldValues, kin) {
    if (!Array.isArray(fieldValues) || fieldValues.length < 3) return 0

    const idx = kin - 1
    const left = clamp01(fieldValues[(idx - 1 + 260) % 260] ?? 0)
    const right = clamp01(fieldValues[(idx + 1) % 260] ?? 0)
    return (left + right) / 2
}

function getCellMetrics(mode, kin, weather, fieldValues) {
    const w = safeWeatherAt(weather, kin)
    const field = safeFieldAt(fieldValues, kin)
    const neighborAvg = neighborFieldAverage(fieldValues, kin)

    const attention = clamp01(w.attention)
    const activity = clamp01((w.activity + attention) / 2)
    const pressure = clamp01(Math.max(w.pressure, w.conflict, Math.abs(field - 0.5) * 2))
    const hybrid = clamp01((activity + pressure + field) / 3)
    const spike = clamp01(Math.abs(field - neighborAvg))

    if (mode === "activity") {
        return {
            primary: activity,
            attention,
            activity,
            pressure,
            hybrid,
            field,
            spike
        }
    }

    if (mode === "pressure") {
        return {
            primary: pressure,
            attention,
            activity,
            pressure,
            hybrid,
            field,
            spike
        }
    }

    if (mode === "hybrid") {
        return {
            primary: hybrid,
            attention,
            activity,
            pressure,
            hybrid,
            field,
            spike
        }
    }

    return {
        primary: field,
        attention,
        activity,
        pressure,
        hybrid,
        field,
        spike
    }
}

function getCellState(mode, count, kin, weather, fieldValues) {
    if (count <= 0) return "empty"

    const m = getCellMetrics(mode, kin, weather, fieldValues)

    if (m.spike >= 0.35 || m.primary >= 0.9) return "event"

    if (mode === "pressure") {
        if (m.pressure >= 0.7) return "pressure"
        if (count >= 3) return "cluster"
        return "stable"
    }

    if (mode === "activity") {
        if (m.activity >= 0.7) return "active"
        if (count >= 3) return "cluster"
        return "stable"
    }

    if (mode === "hybrid") {
        if (m.hybrid >= 0.68) return "resonance"
        if (count >= 3) return "cluster"
        return "stable"
    }

    if (count >= 3) return "cluster"
    if (m.field >= 0.75) return "resonance"
    return "stable"
}

function getStateStroke(state) {
    if (state === "cluster") return "#22c55e"
    if (state === "pressure") return "#ef4444"
    if (state === "active") return "#38bdf8"
    if (state === "resonance") return "#a855f7"
    if (state === "event") return "#ffffff"
    if (state === "stable") return "#f59e0b"
    return "#334155"
}

function ensureFieldPopup(root) {
    let popup = root.querySelector(".field-popup")

    if (!popup) {
        popup = document.createElement("div")
        popup.className = "field-popup"
        popup.style.position = "absolute"
        popup.style.display = "none"
        popup.style.minWidth = "280px"
        popup.style.maxWidth = "380px"
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

function showFieldPopup(root, popup, x, y, kin, usersHere, mode, weather, fieldValues) {
    const tone = ((kin - 1) % 13) + 1
    const sealIndex = (kin - 1) % 20
    const sealName = sealNames[sealIndex] || "?"
    const count = usersHere.length
    const state = getCellState(mode, count, kin, weather, fieldValues)
    const m = getCellMetrics(mode, kin, weather, fieldValues)

    const names = count
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
            Users in kin: <b>${count}</b>
        </div>

        <div style="margin-bottom:8px;color:#cbd5e1;">
            State: <b>${state}</b><br>
            Attention: ${m.attention.toFixed(2)}<br>
            Activity: ${m.activity.toFixed(2)}<br>
            Pressure: ${m.pressure.toFixed(2)}<br>
            Hybrid: ${m.hybrid.toFixed(2)}<br>
            Field: ${m.field.toFixed(2)}<br>
            Spike: ${m.spike.toFixed(2)}
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
    if (top + 260 > rootRect.height) top = y - 220

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

    for (let d = -10; d <= 9; d++) {
        const kin = ((selectedKin - 1 + d + 260 * 3) % 260) + 1
        const coords = kinToCoords(kin)

        if (coords) {
            path.push({
                x: leftPad + coords.seal * cellW + cellW / 2,
                y: topPad + coords.tone * cellH + cellH / 2,
                kin,
                offset: d
            })
        }
    }

    if (path.length < 2) return

    ctx.save()
    ctx.strokeStyle = "rgba(255,255,255,0.22)"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])

    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i]
        const b = path[i + 1]

        const dx = Math.abs(a.x - b.x)
        const dy = Math.abs(a.y - b.y)

        if (dx > cellW * 3 || dy > cellH * 3) continue

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
    }

    ctx.setLineDash([])

    for (let i = 0; i < path.length; i++) {
        const p = path[i]

        ctx.beginPath()

        if (p.offset === 0) {
            ctx.fillStyle = "#ffffff"
            ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2)
        } else {
            ctx.fillStyle = "rgba(255,255,255,0.35)"
            ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
        }

        ctx.fill()
    }

    ctx.restore()
}

function selectFieldKin(root, users, mode, kin, cellCenterX, cellCenterY, weather, fieldValues) {
    selectedFieldKin = kin

    drawField(root, users, mode, weather, fieldValues)

    const popup = root.querySelector(".field-popup")
    if (!popup) return

    const usersByKin = {}
    users.forEach(u => {
        const k = Number(u.kin)
        if (!usersByKin[k]) usersByKin[k] = []
        usersByKin[k].push(u)
    })

    const usersHere = usersByKin[kin] || []

    if (usersHere.length > 0) {
        showFieldPopup(root, popup, cellCenterX, cellCenterY, kin, usersHere, mode, weather, fieldValues)
    } else {
        popup.style.display = "none"
    }
}

export function drawField(rootOrId, users = [], mode = "global", weather = [], fieldValues = []) {
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
                const state = getCellState(mode, count, kin, weather, fieldValues)
                const strokeColor = getStateStroke(state)

                ctx.fillStyle = "#081122"
                ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)

                ctx.fillStyle = fillColor
                ctx.fillRect(x + 6, y + 6, cellW - 12, cellH - 12)

                ctx.strokeStyle = strokeColor
                ctx.lineWidth = 2
                ctx.strokeRect(x + 3.5, y + 3.5, cellW - 7, cellH - 7)

                ctx.fillStyle = count >= 2 ? "#0b1020" : "#e5e7eb"
                ctx.font = "bold 12px monospace"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText(String(count), x + cellW / 2, y + cellH / 2)
            }

            if (selectedFieldKin === kin) {
                ctx.strokeStyle = "#ffffff"
                ctx.lineWidth = 2
                ctx.strokeRect(x + 1.5, y + 1.5, cellW - 3, cellH - 3)
            }
        }
    }

    drawKinDiagonal(ctx, selectedFieldKin, leftPad, topPad, cellW, cellH)

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

        selectFieldKin(
            root,
            users,
            mode,
            kin,
            leftPad + seal * cellW + cellW / 2,
            topPad + tone * cellH + cellH / 2,
            weather,
            fieldValues
        )
    }

    canvas.oncontextmenu = (e) => {
        e.preventDefault()
        selectedFieldKin = null
        popup.style.display = "none"
        drawField(root, users, mode, weather, fieldValues)
    }
}
