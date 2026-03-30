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
        return `rgba(56,189,248,${0.15 + v * 0.85})`
    }
    if(mode === "pressure"){
        return `rgba(239,68,68,${0.15 + v * 0.85})`
    }
    if(mode === "hybrid"){
        return `rgba(168,85,247,${0.15 + v * 0.85})`
    }
    if(mode === "landscape"){
        return `rgba(99,102,241,${0.15 + v * 0.85})`
    }
    if(mode === "attractor"){
        return `rgba(124,58,237,${0.15 + v * 0.85})`
    }

    return `rgba(148,163,184,${0.15 + v * 0.85})`
}

export function drawFieldTorus(rootOrId, users = [], mode = "hybrid", weather = [], fieldValues = [], selectedKin = null, todayKin = null, userKin = null){
    const root =
        typeof rootOrId === "string"
            ? document.getElementById(rootOrId)
            : rootOrId

    if(!root) return

    root.innerHTML = ""
    root.style.position = "relative"

    const canvas = document.createElement("canvas")
    canvas.width = 760
    canvas.height = 520
    canvas.style.display = "block"
    canvas.style.margin = "0 auto"
    root.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if(!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = "#020617"
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2
    const cy = H / 2
    const R = 170
    const r = 75

    const usersByKin = {}
    users.forEach(u => {
        const kin = Number(u.kin)
        if(!usersByKin[kin]) usersByKin[kin] = []
        usersByKin[kin].push(u)

    })

    for(let tone = 0; tone < 13; tone++){
    for(let seal = 0; seal < 20; seal++){

        const kin = ((seal * 13 + tone) % 260) + 1
        const value = getMetric(mode, kin, weather, fieldValues)

        const u = (seal / 20) * Math.PI * 2
        const v = (tone / 13) * Math.PI * 2

        const x = cx + (R + r * Math.cos(v)) * Math.cos(u)
        const y = cy + (R + r * Math.cos(v)) * Math.sin(u) * 0.45 + r * Math.sin(v)

        const size = 8 + value * 10

        ctx.beginPath()
        ctx.fillStyle = metricColor(mode, value)
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.fill()

        if(usersByKin[kin]?.length){
            ctx.strokeStyle = "#ffffff"
            ctx.lineWidth = 1.5
            ctx.stroke()
        }

        if(kin === todayKin){
            ctx.beginPath()
            ctx.strokeStyle = "#22c55e"
            ctx.lineWidth = 2
            ctx.arc(x, y, size / 2 + 4, 0, Math.PI * 2)
            ctx.stroke()
        }

        if(kin === userKin){
            ctx.beginPath()
            ctx.strokeStyle = "#38bdf8"
            ctx.lineWidth = 2
            ctx.arc(x, y, size / 2 + 7, 0, Math.PI * 2)
            ctx.stroke()
        }

        if(kin === selectedKin){
            ctx.beginPath()
            ctx.strokeStyle = "#ffffff"
            ctx.lineWidth = 2
            ctx.arc(x, y, size / 2 + 10, 0, Math.PI * 2)
            ctx.stroke()
        }
    }
}

    canvas.onclick = (e) => {

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let closestKin = null
    let minDist = Infinity

    for(let tone = 0; tone < 13; tone++){
        for(let seal = 0; seal < 20; seal++){

            const kin = ((seal * 13 + tone) % 260) + 1

            const u = (seal / 20) * Math.PI * 2
            const v = (tone / 13) * Math.PI * 2

            const x = cx + (R + r * Math.cos(v)) * Math.cos(u)
            const y = cy + (R + r * Math.cos(v)) * Math.sin(u) * 0.45 + r * Math.sin(v)

            const dx = mx - x
            const dy = my - y
            const dist = Math.sqrt(dx*dx + dy*dy)

            if(dist < minDist){
                minDist = dist
                closestKin = kin
            }
        }
    }

    if(closestKin && window.onKinSelect){
        window.onKinSelect(closestKin)
    }
}
}