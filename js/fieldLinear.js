import { KinRegistry } from "./kinRegistry.js"

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

function getMetric(mode, kin, weather, fieldValues){
    const w = safeWeatherAt(weather, kin)
    const field = safeFieldAt(fieldValues, kin)
    const attractor = safeAttractorAt(kin)

    const attention = clamp01(w.attention)
    const activity = clamp01((w.activity + attention) / 2)
    const pressure = clamp01(Math.max(w.pressure, w.conflict, Math.abs(field - 0.5) * 2))
    const hybrid = clamp01(activity * 0.4 + pressure * 0.3 + field * 0.3)

    if(mode === "activity") return activity
    if(mode === "pressure") return pressure
    if(mode === "hybrid") return hybrid
    if(mode === "landscape") return field
    if(mode === "attractor") return attractor

    return field
}

function metricColor(mode, value){
    const v = clamp01(value)

    if(mode === "activity"){
        return `rgba(56,189,248,${0.2 + v * 0.8})`
    }
    if(mode === "pressure"){
        return `rgba(239,68,68,${0.2 + v * 0.8})`
    }
    if(mode === "hybrid"){
        return `rgba(168,85,247,${0.2 + v * 0.8})`
    }
    if(mode === "landscape"){
        return `rgba(99,102,241,${0.2 + v * 0.8})`
    }
    if(mode === "attractor"){
        return `rgba(124,58,237,${0.2 + v * 0.8})`
    }

    return `rgba(148,163,184,${0.2 + v * 0.8})`
}

export function drawFieldLinear(rootOrId, users = [], mode = "hybrid", weather = [], fieldValues = [], selectedKin = null, todayKin = null, userKin = null){
    const root =
        typeof rootOrId === "string"
            ? document.getElementById(rootOrId)
            : rootOrId

    if(!root) return

    root.innerHTML = ""
    root.style.position = "relative"

    const canvas = document.createElement("canvas")
    canvas.width = 920
    canvas.height = 340
    canvas.style.display = "block"
    canvas.style.margin = "0 auto"
    root.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if(!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = "#020617"
    ctx.fillRect(0, 0, W, H)

    const leftPad = 40
    const rightPad = 20
    const topPad = 20
    const bottomPad = 50

    const chartW = W - leftPad - rightPad
    const chartH = H - topPad - bottomPad
    const barW = chartW / 260

    const usersByKin = {}
    users.forEach(u => {
        const kin = Number(u.kin)
        if(!usersByKin[kin]) usersByKin[kin] = []
        usersByKin[kin].push(u)
    })

    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 1

    for(let g = 0; g <= 4; g++){
        const y = topPad + (chartH / 4) * g
        ctx.beginPath()
        ctx.moveTo(leftPad, y)
        ctx.lineTo(leftPad + chartW, y)
        ctx.stroke()
    }

    for(let kin = 1; kin <= 260; kin++){
        const value = getMetric(mode, kin, weather, fieldValues)
        const x = leftPad + (kin - 1) * barW
        const h = value * chartH
        const y = topPad + chartH - h

        ctx.fillStyle = metricColor(mode, value)
        ctx.fillRect(x, y, Math.max(1, barW - 1), h)

        if(usersByKin[kin]?.length){
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(x, topPad + chartH - 4, Math.max(1, barW - 1), 4)
        }

        if(kin === todayKin){
            ctx.strokeStyle = "#22c55e"
            ctx.lineWidth = 2
            ctx.strokeRect(x, topPad, Math.max(1, barW - 1), chartH)
        }

        if(kin === userKin){
            ctx.strokeStyle = "#38bdf8"
            ctx.lineWidth = 2
            ctx.strokeRect(x, topPad + 3, Math.max(1, barW - 1), chartH - 6)
        }

        if(kin === selectedKin){
            ctx.strokeStyle = "#ffffff"
            ctx.lineWidth = 2
            ctx.strokeRect(x, topPad + 6, Math.max(1, barW - 1), chartH - 12)
        }
    }

    ctx.fillStyle = "#94a3b8"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    for(let kin = 20; kin <= 260; kin += 20){
        const x = leftPad + (kin - 0.5) * barW
        ctx.fillText(String(kin), x, topPad + chartH + 8)
    }

    ctx.fillStyle = "#cbd5e1"
    ctx.font = "12px monospace"
    ctx.textAlign = "left"
    ctx.fillText(`Linear View • Mode: ${mode}`, leftPad, H - 8)
}