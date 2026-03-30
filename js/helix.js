import { KinRegistry } from "./kinRegistry.js"

const sealNames = [
    "Dragon","Wind","Night","Seed","Serpent",
    "WorldBridger","Hand","Star","Moon","Dog",
    "Monkey","Human","Skywalker","Wizard","Eagle",
    "Warrior","Earth","Mirror","Storm","Sun"
]

let selectedHelixKin = null

function clamp01(v){
    const n = Number(v)
    if(!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function safeWeatherAt(weather, kin){
    const w = Array.isArray(weather) ? weather[kin - 1] : null
    if(!w || typeof w !== "object"){
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

function safeFieldAt(fieldValues, kin){
    if(!Array.isArray(fieldValues)) return 0
    return clamp01(fieldValues[kin - 1] ?? 0)
}

function safeAttractorAt(kin){
    const arr = window._attractorField
    if(!Array.isArray(arr)) return 0
    return clamp01(arr[kin - 1] ?? 0)
}

function buildUsersByKin(users){
    const usersByKin = {}
    const safeUsers = Array.isArray(users) ? users : []

    safeUsers.forEach(u => {
        const kin = Number(u.kin)
        if(!Number.isFinite(kin) || kin < 1 || kin > 260) return
        if(!usersByKin[kin]) usersByKin[kin] = []
        usersByKin[kin].push(u)
    })

    return usersByKin
}

function getKinMetrics(kin, weather, fieldValues){
    const w = safeWeatherAt(weather, kin)
    const field = safeFieldAt(fieldValues, kin)
    const attractor = safeAttractorAt(kin)

    const attention = clamp01(w.attention)
    const activity = clamp01((w.activity + attention) / 2)
    const pressure = clamp01(Math.max(w.pressure, w.conflict, Math.abs(field - 0.5) * 2))
    const hybrid = clamp01((attention + activity + pressure + field) / 4)

    return {
        attention,
        activity,
        pressure,
        hybrid,
        field,
        attractor
    }
}

function metricValue(mode, kin, weather, fieldValues, usersByKin){
    const m = getKinMetrics(kin, weather, fieldValues)
    const count = (usersByKin[kin] || []).length

    if(mode === "activity") return m.activity
    if(mode === "pressure") return m.pressure
    if(mode === "hybrid") return m.hybrid
    if(mode === "landscape") return m.field
    if(mode === "attractor") return m.attractor
    if(mode === "global") return Math.min(1, count / 4)

    return m.hybrid
}

function metricColor(mode, value){
    const v = clamp01(value)

    if(mode === "pressure"){
        const r = Math.round(80 + v * 175)
        const g = Math.round(40 + v * 50)
        const b = Math.round(40 + v * 50)
        return `rgb(${r},${g},${b})`
    }

    if(mode === "activity"){
        const r = Math.round(30 + v * 40)
        const g = Math.round(90 + v * 165)
        const b = Math.round(80 + v * 130)
        return `rgb(${r},${g},${b})`
    }

    if(mode === "hybrid"){
        const r = Math.round(100 + v * 110)
        const g = Math.round(60 + v * 70)
        const b = Math.round(140 + v * 115)
        return `rgb(${r},${g},${b})`
    }

    if(mode === "landscape"){
        const r = Math.round(70 + v * 70)
        const g = Math.round(80 + v * 60)
        const b = Math.round(140 + v * 110)
        return `rgb(${r},${g},${b})`
    }

    if(mode === "attractor"){
        const r = Math.round(90 + v * 110)
        const g = Math.round(70 + v * 40)
        const b = Math.round(160 + v * 90)
        return `rgb(${r},${g},${b})`
    }

    const r = Math.round(50 + v * 90)
    const g = Math.round(90 + v * 110)
    const b = Math.round(140 + v * 80)
    return `rgb(${r},${g},${b})`
}

function getHelixPoint(kin, cx, topY, turnStep, radiusBase, radiusAmp){
    const k = kin - 1
    const seal = k % 20
    const tone = k % 13
    const level = Math.floor(k / 20)

    const angle = (Math.PI * 2 * seal / 20) - Math.PI / 2
    const radius = radiusBase + tone * radiusAmp

    const x = cx + Math.cos(angle) * radius
    const y = topY + level * turnStep + Math.sin(angle) * radius * 0.42

    return { x, y, angle, radius, level, seal, tone }
}

function ensureHelixPopup(root){
    let popup = root.querySelector(".helix-popup")

    if(!popup){
        popup = document.createElement("div")
        popup.className = "helix-popup"
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
        popup.style.zIndex = "30"
        popup.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)"
        root.appendChild(popup)
    }

    return popup
}

function getModeLabel(mode){
    if(mode === "activity") return "Activity"
    if(mode === "pressure") return "Pressure"
    if(mode === "hybrid") return "Hybrid"
    if(mode === "landscape") return "Landscape"
    if(mode === "attractor") return "Attractor"
    if(mode === "global") return "Users"
    return "Helix"
}

function showHelixPopup(root, popup, screenX, screenY, kin, mode, weather, fieldValues, usersByKin){
    const tone = ((kin - 1) % 13) + 1
    const sealIndex = (kin - 1) % 20
    const seal = sealNames[sealIndex] || "?"
    const usersHere = usersByKin[kin] || []
    const m = getKinMetrics(kin, weather, fieldValues)

    const names = usersHere.length
        ? usersHere.map((u, i) => `${i + 1}. ${u.name} (${u.kin})`).join("<br>")
        : "No users"

    popup.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="font-weight:bold;color:#f8fafc;">Kin ${kin}</div>
            <button class="helix-popup-close" style="
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
            Tone: ${tone} | Seal: ${seal} | Mode: ${getModeLabel(mode)}
        </div>

        <div style="margin-bottom:8px;color:#cbd5e1;">
            Attention: ${m.attention.toFixed(2)}<br>
            Activity: ${m.activity.toFixed(2)}<br>
            Pressure: ${m.pressure.toFixed(2)}<br>
            Hybrid: ${m.hybrid.toFixed(2)}<br>
            Field: ${m.field.toFixed(2)}<br>
            Attractor: ${m.attractor.toFixed(2)}<br>
            Users: ${usersHere.length}
        </div>

        <div style="color:#e2e8f0;">
            ${names}
        </div>
    `

    popup.style.display = "block"

    const rect = root.getBoundingClientRect()

    let left = screenX + 14
    let top = screenY + 14

    if(left + 340 > rect.width) left = screenX - 280
    if(top + 260 > rect.height) top = screenY - 220

    popup.style.left = `${Math.max(8, left)}px`
    popup.style.top = `${Math.max(8, top)}px`

    const closeBtn = popup.querySelector(".helix-popup-close")
    if(closeBtn){
        closeBtn.onclick = () => {
            popup.style.display = "none"
        }
    }
}

function drawVerticalAxis(ctx, cx, topY, bottomY){
    ctx.save()
    ctx.strokeStyle = "rgba(148,163,184,0.18)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, topY)
    ctx.lineTo(cx, bottomY)
    ctx.stroke()
    ctx.restore()
}

function drawTurnLabels(ctx, cx, startY, turnStep){
    ctx.save()
    ctx.fillStyle = "#94a3b8"
    ctx.font = "10px monospace"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"

    for(let i = 0; i < 13; i++){
        const y = startY + i * turnStep
        ctx.fillText(`T${i + 1}`, cx + 92, y)
    }

    ctx.restore()
}

function drawSealHints(ctx, cx, topY, radiusBase){
    ctx.save()
    ctx.fillStyle = "rgba(148,163,184,0.6)"
    ctx.font = "9px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for(let seal = 0; seal < 20; seal++){
        const angle = (Math.PI * 2 * seal / 20) - Math.PI / 2
        const x = cx + Math.cos(angle) * (radiusBase + 56)
        const y = topY + Math.sin(angle) * (radiusBase + 56) * 0.42
        ctx.fillText(String(seal + 1), x, y)
    }

    ctx.restore()
}

export function drawHelix(rootOrId, users = [], mode = "hybrid", weather = [], fieldValues = [], selectedKin = null, todayKin = null, userKin = null){
    const root =
        typeof rootOrId === "string"
            ? document.getElementById(rootOrId)
            : rootOrId

    if(!root) return

    root.innerHTML = ""
    root.style.position = "relative"
    root.style.overflow = "hidden"

    const canvas = document.createElement("canvas")
    canvas.width = 760
    canvas.height = 860
    canvas.style.display = "block"
    canvas.style.margin = "0 auto"
    canvas.style.cursor = "grab"
    canvas.style.touchAction = "none"
    root.appendChild(canvas)

    const popup = ensureHelixPopup(root)
    const ctx = canvas.getContext("2d")
    if(!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const topY = 44
    const turnStep = 58
    const radiusBase = 54
    const radiusAmp = 2.9

    const usersByKin = buildUsersByKin(users)

    let scale = 1
    let offsetX = 0
    let offsetY = 0
    let isDragging = false
    let dragMoved = false
    let dragStartX = 0
    let dragStartY = 0
    let hoverKin = null
    let hitMap = []

    function toWorld(mx, my){
        return {
            x: (mx - offsetX) / scale,
            y: (my - offsetY) / scale
        }
    }

    function drawScene(){
        ctx.clearRect(0, 0, W, H)
        ctx.fillStyle = "#020617"
        ctx.fillRect(0, 0, W, H)

        ctx.save()
        ctx.translate(offsetX, offsetY)
        ctx.scale(scale, scale)

        drawVerticalAxis(ctx, cx, topY - 10, topY + turnStep * 12 + 22)
        drawTurnLabels(ctx, cx, topY, turnStep)
        drawSealHints(ctx, cx, topY, radiusBase)

        const points = []
        for(let kin = 1; kin <= 260; kin++){
            points.push(getHelixPoint(kin, cx, topY, turnStep, radiusBase, radiusAmp))
        }

        ctx.save()
        ctx.strokeStyle = "rgba(148,163,184,0.18)"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        points.forEach((p, i) => {
            if(i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()
        ctx.restore()

        hitMap = []

        for(let kin = 1; kin <= 260; kin++){
            const p = points[kin - 1]
            const value = metricValue(mode, kin, weather, fieldValues, usersByKin)
            const color = metricColor(mode, value)
            const count = (usersByKin[kin] || []).length

            let r = 3 + value * 6
            if(count > 0) r += Math.min(7, count * 1.5)
            if(kin === todayKin) r += 2
            if(kin === userKin) r += 2
            if(kin === selectedKin || kin === selectedHelixKin) r += 2
            if(kin === hoverKin) r += 2

            ctx.beginPath()
            ctx.fillStyle = color
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
            ctx.fill()

            if(count > 0){
                ctx.strokeStyle = "#e5e7eb"
                ctx.lineWidth = 1.5
                ctx.stroke()

                ctx.fillStyle = "#ffffff"
                ctx.font = "10px monospace"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText(String(count), p.x, p.y)
            }

            if(kin === todayKin){
                ctx.beginPath()
                ctx.strokeStyle = "#22c55e"
                ctx.lineWidth = 2
                ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2)
                ctx.stroke()
            }

            if(kin === userKin){
                ctx.beginPath()
                ctx.strokeStyle = "#38bdf8"
                ctx.lineWidth = 2
                ctx.arc(p.x, p.y, r + 7, 0, Math.PI * 2)
                ctx.stroke()
            }

            if(kin === selectedKin || kin === selectedHelixKin){
                ctx.beginPath()
                ctx.strokeStyle = "#ffffff"
                ctx.lineWidth = 2
                ctx.arc(p.x, p.y, r + 10, 0, Math.PI * 2)
                ctx.stroke()
            }

            hitMap.push({
                kin,
                x: p.x,
                y: p.y,
                r: Math.max(12, r + 8)
            })
        }

        ctx.save()
        ctx.fillStyle = "#cbd5e1"
        ctx.font = "12px monospace"
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillText("Helix legend:", 16, 14)
        ctx.fillStyle = "#94a3b8"
        ctx.fillText("green ring = today kin", 16, 32)
        ctx.fillText("blue ring = user kin", 16, 48)
        ctx.fillText("white ring = selected kin", 16, 64)
        ctx.fillText("number inside dot = users in kin", 16, 80)
        ctx.fillText("wheel = zoom, drag = move, click = info", 16, 96)
        ctx.restore()

        ctx.restore()
    }

    function findHit(worldX, worldY){
        let best = null
        let bestDist = Infinity

        for(const item of hitMap){
            const dx = worldX - item.x
            const dy = worldY - item.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if(dist <= item.r && dist < bestDist){
                best = item
                bestDist = dist
            }
        }

        return best
    }

    drawScene()

    canvas.onwheel = (e) => {
        e.preventDefault()

        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        const zoom = e.deltaY < 0 ? 1.12 : 0.9
        const nextScale = Math.max(0.6, Math.min(3.5, scale * zoom))

        const worldBefore = toWorld(mx, my)

        scale = nextScale
        offsetX = mx - worldBefore.x * scale
        offsetY = my - worldBefore.y * scale

        drawScene()
    }

    canvas.onmousedown = (e) => {
        isDragging = true
        dragMoved = false
        dragStartX = e.clientX
        dragStartY = e.clientY
        canvas.style.cursor = "grabbing"
    }

    canvas.onmouseup = () => {
        isDragging = false
        canvas.style.cursor = "grab"
    }

    canvas.onmouseleave = () => {
        isDragging = false
        hoverKin = null
        canvas.style.cursor = "grab"
        drawScene()
    }

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        if(isDragging){
            const dx = e.clientX - dragStartX
            const dy = e.clientY - dragStartY

            if(Math.abs(dx) > 2 || Math.abs(dy) > 2){
                dragMoved = true
            }

            offsetX += dx
            offsetY += dy
            dragStartX = e.clientX
            dragStartY = e.clientY
            drawScene()
            return
        }

        const world = toWorld(mx, my)
        const hit = findHit(world.x, world.y)
        hoverKin = hit ? hit.kin : null
        canvas.style.cursor = hit ? "pointer" : "grab"
        drawScene()
    }

    canvas.onclick = (e) => {
    if(dragMoved){
        dragMoved = false
        return
    }

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const world = toWorld(mx, my)

    const best = findHit(world.x, world.y)
    if(!best) return

    selectedHelixKin = best.kin
    window.selectedKin = best.kin

    // Сначала показать popup локально
    drawScene()
    showHelixPopup(root, popup, mx, my, best.kin, mode, weather, fieldValues, usersByKin)

    // Внешнюю синхронизацию НЕ вызываем сразу,
    // иначе renderAll сносит popup
}

    canvas.ondblclick = () => {
        scale = 1
        offsetX = 0
        offsetY = 0
        drawScene()
    }

    canvas.oncontextmenu = (e) => {
        e.preventDefault()
        selectedHelixKin = null
        popup.style.display = "none"
        drawScene()
    }
}