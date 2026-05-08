import { KinRegistry } from "./kinRegistry.js"
import { t } from "./mtosUI/mtosI18n.js"

const densityColors = [
    "#1e293b",
    "#c084fc",
    "#8b5cf6",
    "#6366f1",
    "#3b82f6",
    "#06b6d4",
    "#14b8a6",
    "#10b981",
    "#84cc16",
    "#eab308",
    "#f59e0b",
    "#f97316",
    "#ef4444"
]

const VIRIDIS_STOPS = [
    [0.00, [68, 1, 84]],
    [0.13, [71, 44, 122]],
    [0.25, [59, 81, 139]],
    [0.38, [44, 113, 142]],
    [0.50, [33, 144, 141]],
    [0.63, [39, 173, 129]],
    [0.75, [92, 200, 99]],
    [0.88, [170, 220, 50]],
    [1.00, [253, 231, 37]]
]

function lerp(a, b, t){
    return a + (b - a) * t
}

function viridisColor(value, alpha = 1){
    const v = clamp01(value)

    for(let i = 0; i < VIRIDIS_STOPS.length - 1; i++){
        const [p1, c1] = VIRIDIS_STOPS[i]
        const [p2, c2] = VIRIDIS_STOPS[i + 1]

        if(v >= p1 && v <= p2){
            const k = (v - p1) / Math.max(1e-6, (p2 - p1))
            const r = Math.round(lerp(c1[0], c2[0], k))
            const g = Math.round(lerp(c1[1], c2[1], k))
            const b = Math.round(lerp(c1[2], c2[2], k))
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }
    }

    const last = VIRIDIS_STOPS[VIRIDIS_STOPS.length - 1][1]
    return `rgba(${last[0]}, ${last[1]}, ${last[2]}, ${alpha})`
}

const sealNames = [
    "Dragon","Wind","Night","Seed","Serpent",
    "WorldBridger","Hand","Star","Moon","Dog",
    "Monkey","Human","Skywalker","Wizard","Eagle",
    "Warrior","Earth","Mirror","Storm","Sun"
]

function normalizeField(values){
    if(!Array.isArray(values) || !values.length) return []

    let min = Infinity
    let max = -Infinity

    for(const v of values){
        if(v < min) min = v
        if(v > max) max = v
    }

    const range = Math.max(1e-6, max - min)

    return values.map(v => (v - min) / range)
}

let selectedFieldKin = null

let selectedFieldPopupState = null

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

function neighborFieldAverage(fieldValues, kin){
    if(!Array.isArray(fieldValues) || fieldValues.length < 3) return 0

    const idx = kin - 1
    const left = clamp01(fieldValues[(idx - 1 + 260) % 260] ?? 0)
    const right = clamp01(fieldValues[(idx + 1) % 260] ?? 0)
    return (left + right) / 2
}

function getFillColor(count){
    if(count <= 0) return "#0f172a"
    return densityColors[Math.min(count - 1, densityColors.length - 1)]
}

function getCellMetrics(mode, kin, weather, fieldValues){
    const w = safeWeatherAt(weather, kin)
    const field = safeFieldAt(fieldValues, kin)
    const neighborAvg = neighborFieldAverage(fieldValues, kin)
    const attractor = safeAttractorAt(kin)

    const attention = clamp01(w.attention)
    const activity = clamp01((w.activity + attention) / 2)
    const pressure = clamp01(
    w.pressure * 0.6 +
    w.conflict * 0.4 +
    Math.abs(field - 0.5) * 0.8
)
    const hybrid = clamp01(activity * 0.4 + pressure * 0.3 + field * 0.3)
    const spike = clamp01(Math.abs(field - neighborAvg))

    if(mode === "global"){
    return {
        primary: clamp01(
            attention * 0.35 +
            activity * 0.25 +
            field * 0.25 +
            attractor * 0.15
        ),
            attention,
            activity,
            pressure,
            hybrid,
            field,
            attractor,
            spike
        }
    }

    if(mode === "activity"){
        return {
            primary: activity,
            attention,
            activity,
            pressure,
            hybrid,
            field,
            attractor,
            spike
        }
    }

    if(mode === "pressure"){
        return {
            primary: pressure,
            attention,
            activity,
            pressure,
            hybrid,
            field,
            attractor,
            spike
        }
    }

    if(mode === "hybrid"){
        return {
            primary: hybrid,
            attention,
            activity,
            pressure,
            hybrid,
            field,
            attractor,
            spike
        }
    }

    if(mode === "landscape"){
        return {
            primary: field,
            attention,
            activity,
            pressure,
            hybrid,
            field,
            attractor,
            spike
        }
    }

    if(mode === "attractor"){
        return {
            primary: attractor,
            attention,
            activity,
            pressure,
            hybrid,
            field,
            attractor,
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
        attractor,
        spike
    }
}

function getFieldIntensity(mode, kin, weather, fieldValues){
    const m = getCellMetrics(mode, kin, weather, fieldValues)

    if(mode === "global"){
        return clamp01(
            m.attention * 0.35 +
            m.activity * 0.25 +
            m.field * 0.25 +
            m.attractor * 0.15
        )
    }

    if(mode === "activity"){
        return clamp01(m.activity)
    }

    if(mode === "pressure"){
        return clamp01(m.pressure)
    }

    if(mode === "hybrid"){
        return clamp01(m.hybrid)
    }

    if(mode === "landscape"){
        return clamp01(m.field)
    }

    if(mode === "attractor"){
        return clamp01(m.attractor)
    }

    return clamp01(m.primary)
}

function getFieldBaseFill(mode, kin, weather, fieldValues){
    const intensityRaw = getFieldIntensity(mode, kin, weather, fieldValues)

    // усиление + контраст
const intensity = Math.pow(intensityRaw, 0.55)

    if(mode === "pressure"){
        return viridisColor(intensity * 0.92, 0.92)
    }

    if(mode === "activity"){
        return viridisColor(intensity, 0.90)
    }

    if(mode === "hybrid"){
        return viridisColor(Math.min(1, intensity * 1.05), 0.92)
    }

    if(mode === "landscape"){
        return viridisColor(intensity, 0.88)
    }

    if(mode === "attractor"){
        return viridisColor(intensity, 0.90)
    }

    return viridisColor(intensity, 0.86)
}

function getCellState(mode, count, kin, weather, fieldValues){
    const m = getCellMetrics(mode, kin, weather, fieldValues)

    if(mode === "global"){
        if(count >= 3) return "cluster"
        if(count >= 1) return "occupied"
        return "empty"
    }

    if(mode === "activity"){
        if(m.activity >= 0.82) return "active_high"
        if(m.activity >= 0.58) return "active_mid"
        if(m.activity >= 0.35) return "active_low"
        return "empty"
    }

    if(mode === "pressure"){
        if(m.pressure >= 0.82 || m.spike >= 0.38) return "pressure_high"
        if(m.pressure >= 0.58) return "pressure_mid"
        if(m.pressure >= 0.35) return "pressure_low"
        return "empty"
    }

    if(mode === "hybrid"){
        if(m.hybrid >= 0.82 || m.spike >= 0.4) return "hybrid_high"
        if(m.hybrid >= 0.58) return "hybrid_mid"
        if(m.hybrid >= 0.35) return "hybrid_low"
        return "empty"
    }

    if(mode === "landscape"){
        if(m.spike >= 0.42) return "event"
        if(m.field >= 0.78) return "landscape_peak"
        if(m.field >= 0.56) return "landscape_flow"
        if(m.field >= 0.34) return "landscape_soft"
        return "empty"
    }

    if(mode === "attractor"){
    if(m.attractor >= 0.58) return "attractor_peak"
    if(m.attractor >= 0.36) return "attractor_flow"
    if(m.attractor >= 0.18) return "attractor_soft"
    return "empty"
}

    return "empty"
}

function getStateStroke(mode, state){
    if(mode === "global"){
        if(state === "cluster") return "#22c55e"
        if(state === "occupied") return "#94a3b8"
        return "#1e293b"
    }

    if(mode === "activity"){
        if(state === "active_high") return "#22d3ee"
        if(state === "active_mid") return "#38bdf8"
        if(state === "active_low") return "#0ea5e9"
        return "#1e293b"
    }

    if(mode === "pressure"){
        if(state === "pressure_high") return "#ef4444"
        if(state === "pressure_mid") return "#f97316"
        if(state === "pressure_low") return "#f59e0b"
        return "#1e293b"
    }

    if(mode === "hybrid"){
        if(state === "hybrid_high") return "#c084fc"
        if(state === "hybrid_mid") return "#a855f7"
        if(state === "hybrid_low") return "#8b5cf6"
        return "#1e293b"
    }

    if(mode === "landscape"){
        if(state === "event") return "#ffffff"
        if(state === "landscape_peak") return "#8b5cf6"
        if(state === "landscape_flow") return "#6366f1"
        if(state === "landscape_soft") return "#4f46e5"
        return "#1e293b"
    }

    if(mode === "attractor"){
    if(state === "attractor_peak") return "#ffffff"
    if(state === "attractor_flow") return "#a855f7"
    if(state === "attractor_soft") return "#7c3aed"
    return "#1e293b"
}

    return "#334155"
}

function getNeutralBaseFill(mode){
    if(mode === "pressure") return "rgba(148,163,184,0.08)"
    if(mode === "activity") return "rgba(30,64,175,0.12)"
    if(mode === "hybrid") return "rgba(88,28,135,0.14)"
    if(mode === "landscape") return "rgba(79,70,229,0.08)"
    if(mode === "attractor") return "rgba(91,33,182,0.08)"
    if(mode === "global") return "rgba(148,163,184,0.08)"
    return "rgba(148,163,184,0.08)"
}

function getStateFill(mode, state, intensity = 0){
    const a = Math.max(0.10, Math.min(0.92, 0.10 + intensity * 0.58))

    if(mode === "global"){
        if(state === "cluster") return `rgba(34,197,94,${Math.max(0.18, a * 0.7)})`
        if(state === "occupied") return `rgba(148,163,184,0.12)`
        return getNeutralBaseFill(mode)
    }

    if(mode === "activity"){
        if(state === "active_high") return `rgba(34,211,238,${a})`
        if(state === "active_mid") return `rgba(56,189,248,${a * 0.85})`
        if(state === "active_low") return `rgba(14,165,233,${a * 0.7})`
        return getNeutralBaseFill(mode)
    }

    if(mode === "pressure"){
        if(state === "pressure_high") return `rgba(239,68,68,${a})`
        if(state === "pressure_mid") return `rgba(249,115,22,${a * 0.85})`
        if(state === "pressure_low") return `rgba(245,158,11,${a * 0.7})`
        return getNeutralBaseFill(mode)
    }

    if(mode === "hybrid"){
        if(state === "hybrid_high") return `rgba(192,132,252,${a})`
        if(state === "hybrid_mid") return `rgba(168,85,247,${a * 0.85})`
        if(state === "hybrid_low") return `rgba(139,92,246,${a * 0.7})`
        return getNeutralBaseFill(mode)
    }

    if(mode === "landscape"){
        if(state === "event") return `rgba(255,255,255,${Math.max(0.20, a * 0.9)})`
        if(state === "landscape_peak") return `rgba(139,92,246,${a})`
        if(state === "landscape_flow") return `rgba(99,102,241,${a * 0.82})`
        if(state === "landscape_soft") return `rgba(79,70,229,${a * 0.64})`
        return getNeutralBaseFill(mode)
    }

    if(mode === "attractor"){
        if(state === "attractor_peak") return `rgba(168,85,247,${a})`
        if(state === "attractor_flow") return `rgba(124,58,237,${a * 0.82})`
        if(state === "attractor_soft") return `rgba(109,40,217,${a * 0.64})`
        return getNeutralBaseFill(mode)
    }

    return "rgba(51,65,85,0.15)"
}

function ensureFieldPopup(root){
    let popup = root.querySelector(".field-popup")

    if(!popup){
        popup = document.createElement("div")
        popup.className = "field-popup"
        popup.style.position = "absolute"
        popup.style.display = "none"
        popup.style.minWidth = "290px"
        popup.style.maxWidth = "400px"
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

function getModeTitle(mode){
    if(mode === "global") return t("field_mode_global")
    if(mode === "activity") return t("field_mode_activity")
    if(mode === "pressure") return t("field_mode_pressure")
    if(mode === "hybrid") return t("field_mode_hybrid")
    if(mode === "landscape") return t("field_mode_landscape")
    if(mode === "attractor") return t("field_mode_attractor")
    return t("fieldSectionTitle")
}

function getModeMeaning(mode){
    if(mode === "global") return t("field_mode_global_desc")
    if(mode === "activity") return t("field_mode_activity_desc")
    if(mode === "pressure") return t("field_mode_pressure_desc")
    if(mode === "hybrid") return t("field_mode_hybrid_desc")
    if(mode === "landscape") return t("field_mode_landscape_desc")
    if(mode === "attractor") return t("field_mode_attractor_desc")
    return ""
}

function showFieldPopup(root, popup, x, y, kin, usersHere, mode, weather, fieldValues){
    const tone = ((kin - 1) % 13) + 1
    const sealIndex = (kin - 1) % 20
    const sealName = sealNames[sealIndex] || "?"
    const count = usersHere.length
    const state = getCellState(mode, count, kin, weather, fieldValues)
    const m = getCellMetrics(mode, kin, weather, fieldValues)

    const names = count
    ? usersHere.map((u, i) => `${i + 1}. ${u.name} (${u.kin})`).join("<br>")
    : t("field_users_none")

    popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div style="font-weight:bold;color:#f8fafc;">${t("field_kin")} ${kin}</div>
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

    <div style="color:#94a3b8;margin-bottom:8px;">
        ${t("field_tone")}: ${tone} | ${t("field_seal")}: ${sealName}<br>
        ${t("field_mode")}: ${getModeTitle(mode)}<br>
        ${getModeMeaning(mode)}
    </div>

    <div style="margin-bottom:8px;">
        ${t("field_users_in_kin")}: <b>${count}</b>
    </div>

    <div style="margin-bottom:8px;color:#cbd5e1;">
        ${t("field_state")}: <b>${state}</b><br>
        ${t("field_attention")}: ${m.attention.toFixed(2)}<br>
        ${t("field_activity")}: ${m.activity.toFixed(2)}<br>
        ${t("field_pressure")}: ${m.pressure.toFixed(2)}<br>
        ${t("field_hybrid")}: ${m.hybrid.toFixed(2)}<br>
        ${t("field_field")}: ${m.field.toFixed(2)}<br>
        ${t("field_attractor")}: ${m.attractor.toFixed(2)}<br>
        ${t("field_spike")}: ${m.spike.toFixed(2)}
    </div>

    <div style="color:#e2e8f0;">
        ${names}
    </div>
`

    popup.style.display = "block"

    const rootRect = root.getBoundingClientRect()
    let left = x + 12
    let top = y + 12

    if(left + 340 > rootRect.width) left = x - 260
    if(top + 260 > rootRect.height) top = y - 220

    popup.style.left = `${Math.max(8, left)}px`
    popup.style.top = `${Math.max(8, top)}px`

    const closeBtn = popup.querySelector(".field-popup-close")
    if(closeBtn){
        closeBtn.onclick = () => {
            popup.style.display = "none"
        }
    }
}

function updateFieldLegend(mode){
    const el = document.getElementById("fieldLegend")
    if(!el) return

    const modeTitle = getModeTitle(mode)
    const modeText = getModeMeaning(mode)

    el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;">
        <div class="weather-legend-title">${t("field_about_title")}</div>

        <div class="weather-copy" style="max-width:700px; margin-bottom:10px;">
            ${t("field_about_what")}
        </div>

        <div class="weather-copy" style="max-width:700px; margin-bottom:10px;">
            ${t("field_about_reading")}
        </div>

        <div class="weather-copy" style="max-width:700px; margin-bottom:12px;">
            ${t("field_about_click")}
        </div>

        <div class="weather-copy" style="max-width:700px; margin-bottom:12px;">
            <b>${t("field_mode")}:</b> ${getModeTitle(mode)}<br>
            ${getModeMeaning(mode)}
        </div>

        <div style="
            width:min(680px, 100%);
            height:16px;
            border-radius:999px;
            margin:6px 0 10px;
            background:linear-gradient(
                90deg,
                rgb(68,1,84) 0%,
                rgb(59,81,139) 25%,
                rgb(33,144,141) 50%,
                rgb(92,200,99) 75%,
                rgb(253,231,37) 100%
            );
            border:1px solid rgba(255,255,255,0.14);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
        "></div>

        <div class="weather-copy" style="max-width:700px; margin-bottom:12px;">
    ${t("field_viridis_scale")}<br>
    ${t("field_weather_sync")}
</div>

        <div class="weather-copy" style="max-width:700px;">
            <b>${t("field_state_types")}:</b><br>
            <span style="color:#22c55e;">${t("field_cluster")}</span> — ${t("field_cluster_desc")}<br>
            <span style="color:#ef4444;">${t("field_pressure_label")}</span> — ${t("field_pressure_desc2")}<br>
            <span style="color:#38bdf8;">${t("field_active_label")}</span> — ${t("field_active_desc2")}<br>
            <span style="color:#a855f7;">${t("field_resonance")}</span> — ${t("field_resonance_desc")}<br>
            <span style="color:#f59e0b;">${t("field_stable_label")}</span> — ${t("field_stable_desc2")}<br>
            <span style="color:#ffffff;">${t("field_event_label")}</span> — ${t("field_event_desc2")}
        </div>

        <div class="weather-copy" style="max-width:700px; margin-bottom:12px;">
    ${t("field_viridis_scale")}<br>
    ${t("field_weather_sync")}
</div>
    </div>
`
}

function kinToCoords(kin, cols = 20, rows = 13){
    for(let tone = 0; tone < rows; tone++){
        for(let seal = 0; seal < cols; seal++){
            if(KinRegistry.fromGrid(seal, tone) === kin){
                return { seal, tone }
            }
        }
    }
    return null
}

function drawKinDiagonal(ctx, selectedKin, leftPad, topPad, cellW, cellH){
    if(!selectedKin) return

    const path = []

    for(let d = -10; d <= 9; d++){
        const kin = ((selectedKin - 1 + d + 260 * 3) % 260) + 1
        const coords = kinToCoords(kin)

        if(coords){
            path.push({
                x: leftPad + coords.seal * cellW + cellW / 2,
                y: topPad + coords.tone * cellH + cellH / 2,
                kin,
                offset: d
            })
        }
    }

    if(path.length < 2) return

    ctx.save()
    ctx.strokeStyle = "rgba(255,255,255,0.22)"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])

    for(let i = 0; i < path.length - 1; i++){
        const a = path[i]
        const b = path[i + 1]

        const dx = Math.abs(a.x - b.x)
        const dy = Math.abs(a.y - b.y)

        if(dx > cellW * 3 || dy > cellH * 3) continue

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
    }

    ctx.setLineDash([])

    for(let i = 0; i < path.length; i++){
        const p = path[i]

        ctx.beginPath()

        if(p.offset === 0){
            ctx.fillStyle = "#ffffff"
            ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2)
        }else{
            ctx.fillStyle = "rgba(255,255,255,0.35)"
            ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
        }

        ctx.fill()
    }

    ctx.restore()
}

function restoreSelectedFieldPopup(root, users, mode, weather, fieldValues, leftPad, topPad, cellW, cellH){
    if(!selectedFieldKin || !selectedFieldPopupState) return

    const popup = root.querySelector(".field-popup")
    if(!popup) return

    const coords = kinToCoords(selectedFieldKin)
    if(!coords) return

    const usersByKin = {}
    users.forEach(u => {
        const k = Number(u.kin)
        if(!usersByKin[k]) usersByKin[k] = []
        usersByKin[k].push(u)
    })

    const usersHere = usersByKin[selectedFieldKin] || []

    showFieldPopup(
        root,
        popup,
        leftPad + coords.seal * cellW + cellW / 2,
        topPad + coords.tone * cellH + cellH / 2,
        selectedFieldKin,
        usersHere,
        mode,
        weather,
        fieldValues
    )
}

function selectFieldKin(root, users, mode, kin, cellCenterX, cellCenterY, weather, fieldValues){
    selectedFieldKin = kin
    selectedFieldPopupState = { kin }

    drawField(root, users, mode, weather, fieldValues)

    const popup = root.querySelector(".field-popup")
    if(!popup) return

    const usersByKin = {}
    users.forEach(u => {
        const k = Number(u.kin)
        if(!usersByKin[k]) usersByKin[k] = []
        usersByKin[k].push(u)
    })

    const usersHere = usersByKin[kin] || []

    showFieldPopup(
        root,
        popup,
        cellCenterX,
        cellCenterY,
        kin,
        usersHere,
        mode,
        weather,
        fieldValues
    )

    if(window.onKinSelect){
        window.onKinSelect(kin)
    }
}

function drawCellBase(ctx, x, y, cellW, cellH, mode, state, intensity, kin, weather, fieldValues){
    ctx.fillStyle = "#020617"
    ctx.fillRect(x, y, cellW, cellH)

    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, cellW, cellH)

    const viridisFill = getFieldBaseFill(mode, kin, weather, fieldValues)
    const stroke = getStateStroke(mode, state)

    // основная непрерывная заливка viridis
    ctx.fillStyle = viridisFill
    ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)

    // лёгкое затемнение по центру, чтобы цифры и рамки лучше читались
    ctx.fillStyle = "rgba(2, 6, 23, 0.18)"
    ctx.fillRect(x + 6, y + 6, cellW - 12, cellH - 12)

    // state-рамка остаётся как второй слой
    if(state !== "empty"){
        ctx.strokeStyle = stroke
        ctx.lineWidth = intensity >= 0.78 ? 2.2 : 1.4
        ctx.strokeRect(x + 4.5, y + 4.5, cellW - 9, cellH - 9)
    }
}

function drawUserOverlay(ctx, x, y, cellW, cellH, count){
    if(count <= 0) return

    const fillColor = getFillColor(count)

    ctx.fillStyle = "#081122"
    ctx.fillRect(x + 7, y + 7, cellW - 14, cellH - 14)

    ctx.fillStyle = fillColor
    ctx.fillRect(x + 9, y + 9, cellW - 18, cellH - 18)

    ctx.fillStyle = count >= 2 ? "#0b1020" : "#e5e7eb"
    ctx.font = "bold 12px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(String(count), x + cellW / 2, y + cellH / 2)
}

function drawLandscapeOnlyOverlay(ctx, x, y, cellW, cellH, state, intensity, mode){
    if(state === "empty") return

    const stroke = getStateStroke(mode, state)

    if(intensity >= 0.72 || state === "event" || state === "attractor_peak"){
        ctx.strokeStyle = stroke
        ctx.lineWidth = 2.2
        ctx.strokeRect(x + 8, y + 8, cellW - 16, cellH - 16)
    }
}

export function drawField(rootOrId, users = [], mode = "global", weather = [], fieldValues = []){
    const root =
        typeof rootOrId === "string"
            ? document.getElementById(rootOrId)
            : rootOrId

    if(!root) return

    root.innerHTML = ""
    root.style.position = "relative"

    fieldValues = Array.isArray(fieldValues) ? normalizeField(fieldValues) : []

    const canvas = document.createElement("canvas")
    canvas.width = 760
    canvas.height = 420
    canvas.style.display = "block"
    canvas.style.margin = "0 auto"
    root.appendChild(canvas)
    updateFieldLegend(mode)

    const popup = ensureFieldPopup(root)
    const ctx = canvas.getContext("2d")
    if(!ctx) return

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
        if(!usersByKin[kin]) usersByKin[kin] = []
        usersByKin[kin].push(u)
    })

    for(let tone = 0; tone < rows; tone++){
        for(let seal = 0; seal < cols; seal++){
            const kin = KinRegistry.fromGrid(seal, tone)
            const x = leftPad + seal * cellW
            const y = topPad + tone * cellH

            const usersHere = usersByKin[kin] || []
            const count = usersHere.length
            const m = getCellMetrics(mode, kin, weather, fieldValues)
            const state = getCellState(mode, count, kin, weather, fieldValues)
            const intensity = m.primary

            drawCellBase(ctx, x, y, cellW, cellH, mode, state, intensity, kin, weather, fieldValues)
            if(mode === "landscape" || mode === "attractor"){
                drawLandscapeOnlyOverlay(ctx, x, y, cellW, cellH, state, intensity, mode)
            }else{
                if(count > 0){
                    drawUserOverlay(ctx, x, y, cellW, cellH, count)
                }
            }

            if(selectedFieldKin === kin){
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

    for(let tone = 0; tone < rows; tone++){
        const y = topPad + tone * cellH + cellH / 2
        ctx.fillText(String(tone + 1), leftPad - 6, y)
    }

    restoreSelectedFieldPopup(root, users, mode, weather, fieldValues, leftPad, topPad, cellW, cellH)

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        if(mx < leftPad || my < topPad) return

        const seal = Math.floor((mx - leftPad) / cellW)
        const tone = Math.floor((my - topPad) / cellH)

        if(seal < 0 || seal >= cols || tone < 0 || tone >= rows) return

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
    selectedFieldPopupState = null
    popup.style.display = "none"
    drawField(root, users, mode, weather, fieldValues)
}
}