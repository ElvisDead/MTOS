export function clamp01(v){
    const n = Number(v)
    if(!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

export function getUserDayMetrics(userKin, weather = [], pressure = [], fieldState = [], networkFeedback = null, attractorState = null){
    const idx = Math.max(0, Math.min(259, (Number(userKin) || 1) - 1))

    const w = Array.isArray(weather) && weather[idx] && typeof weather[idx] === "object"
        ? weather[idx]
        : {
            attention: 0.5,
            activity: 0.5,
            pressure: 0,
            conflict: 0
        }

    const attention = clamp01(w.attention ?? 0.5)
    const activity  = clamp01(w.activity ?? attention)
    const localPressure = clamp01(w.pressure ?? 0)
    const conflict  = clamp01(w.conflict ?? 0)
    const field     = clamp01(Array.isArray(fieldState) ? (fieldState[idx] ?? 0.5) : 0.5)

    const p = clamp01(Array.isArray(pressure) ? (pressure[idx] ?? localPressure) : localPressure)

    const stability = clamp01(
        1 - (
            0.35 * Math.abs(attention - field) +
            0.35 * localPressure +
            0.30 * conflict
        )
    )

    const network = networkFeedback || window.mtosNetworkFeedback || {
        density: 0,
        meanStrength: 0,
        conflictRatio: 0,
        supportRatio: 0
    }

    const attractor = attractorState || window.mtosAttractorState || {
        type: "unknown",
        intensity: 0,
        score: 0
    }

    return {
        attention,
        activity,
        pressure: Math.max(localPressure, p),
        conflict,
        field,
        stability,
        networkDensity: clamp01(network.density ?? 0),
        networkStrength: clamp01(network.meanStrength ?? 0),
        networkConflict: clamp01(network.conflictRatio ?? 0),
        networkSupport: clamp01(network.supportRatio ?? 0),
        attractorType: attractor.type || "unknown",
        attractorIntensity: clamp01(attractor.intensity ?? 0)
    }
}

export function computeDayIndex(metrics){
    let score =
        0.24 * metrics.attention +
        0.18 * metrics.activity +
        0.18 * metrics.field +
        0.18 * metrics.stability +
        0.10 * metrics.networkSupport +
        0.06 * metrics.networkStrength -
        0.22 * metrics.pressure -
        0.16 * metrics.conflict -
        0.10 * metrics.networkConflict

    if(metrics.attractorType === "chaos"){
        score -= 0.12 * metrics.attractorIntensity
    }else if(metrics.attractorType === "stable"){
        score += 0.08 * metrics.attractorIntensity
    }else if(metrics.attractorType === "cycle"){
        score += 0.03 * metrics.attractorIntensity
    }else if(metrics.attractorType === "trend"){
        score -= 0.02 * metrics.attractorIntensity
    }

    return Number(score.toFixed(3))
}

export function classifyDayFromMetrics(metrics){
    const dayIndex = computeDayIndex(metrics)

    let dayLabel = "Neutral"
let dayScore = 0
let dayDesc = "Balanced state, no strong deviations"
let dayColor = "#999999"

if(dayIndex <= -0.35){
    dayLabel = "Bad"
    dayScore = -3
    dayDesc = "High pressure, instability, system under stress"
    dayColor = "#ff4d4d"
}
else if(dayIndex <= -0.10){
    dayLabel = "Heavy"
    dayScore = -2
    dayDesc = "Sustained load, reduced flexibility"
    dayColor = "#ff944d"
}
else if(dayIndex < 0.18){
    dayLabel = "Neutral"
    dayScore = 0
    dayDesc = "Balanced state, no strong deviations"
    dayColor = "#aaaaaa"
}
else if(dayIndex < 0.38){
    dayLabel = "Light"
    dayScore = 1
    dayDesc = "Low friction, smooth flow of activity"
    dayColor = "#66cc66"
}
else if(dayIndex < 0.62){
    dayLabel = "Joyful"
    dayScore = 2
    dayDesc = "High energy, positive activation"
    dayColor = "#33cc99"
}
else{
    dayLabel = "Positive"
    dayScore = 3
    dayDesc = "Stable coherence, optimal alignment"
    dayColor = "#00e6cc"
}

    return {
        ...metrics,
        dayIndex,
        dayLabel,
        dayScore,
        dayDesc,
        dayColor
    }
}

export function classifyUserDay(userKin, weather = [], pressure = [], fieldState = [], networkFeedback = null, attractorState = null){
    const metrics = getUserDayMetrics(
        userKin,
        weather,
        pressure,
        fieldState,
        networkFeedback,
        attractorState
    )

    return classifyDayFromMetrics(metrics)
}