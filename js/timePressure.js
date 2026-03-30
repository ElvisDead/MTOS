function clamp01(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function clamp(v, min, max) {
    const n = Number(v)
    if (!Number.isFinite(n)) return min
    return Math.max(min, Math.min(max, n))
}

function safeNumber(v, fallback = 0) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
}

const STORAGE_KEY = "mtos_time_pressure_v1"

function loadTimePressureState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : null

        if (parsed && typeof parsed === "object") {
            return {
                pressure: clamp01(parsed.pressure ?? 0),
                urgency: clamp01(parsed.urgency ?? 0),
                drift: clamp(parsed.drift ?? 0, -1, 1),
                momentum: clamp(parsed.momentum ?? 0, -1, 1),
                overload: clamp01(parsed.overload ?? 0),
                fatigue: clamp01(parsed.fatigue ?? 0),
                idleHours: Math.max(0, safeNumber(parsed.idleHours ?? 0)),
                lastRunAt: parsed.lastRunAt || null,
                history: Array.isArray(parsed.history)
                    ? parsed.history.slice(-90)
                    : []
            }
        }
    } catch (e) {
        console.warn("timePressure load failed", e)
    }

    return {
        pressure: 0,
        urgency: 0,
        drift: 0,
        momentum: 0,
        overload: 0,
        fatigue: 0,
        idleHours: 0,
        lastRunAt: null,
        history: []
    }
}

function saveTimePressureState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
        console.warn("timePressure save failed", e)
    }
}

function computeIdleHours(lastRunAt) {
    if (!lastRunAt) return 0

    const prev = new Date(lastRunAt).getTime()
    const now = Date.now()

    if (!Number.isFinite(prev) || prev <= 0) return 0

    const diff = (now - prev) / (1000 * 60 * 60)
    return Math.max(0, diff)
}

function getPressureLabel(value) {
    const v = clamp01(value)

    if (v >= 0.82) return "critical"
    if (v >= 0.62) return "high"
    if (v >= 0.34) return "moderate"
    return "low"
}

function getPressureColor(value) {
    const v = clamp01(value)

    if (v >= 0.82) return "#ff4d4f"
    if (v >= 0.62) return "#ff9f43"
    if (v >= 0.34) return "#f6c453"
    return "#66d9ef"
}

function getPressureDescription(value) {
    const label = getPressureLabel(value)

    if (label === "critical") {
        return "Time compression is extreme. The system should reduce branching and avoid unnecessary interaction."
    }
    if (label === "high") {
        return "The system is under strong temporal load. Execution is preferred over exploration."
    }
    if (label === "moderate") {
        return "The system feels temporal friction, but still keeps room for adaptation."
    }

    return "Temporal pressure is low. The system can afford exploration and softer transitions."
}

function getRecommendedTemporalMode(value) {
    const v = clamp01(value)

    if (v >= 0.82) return "CRISIS"
    if (v >= 0.62) return "FOCUS"
    if (v >= 0.34) return "FLOW"
    return "EXPLORE"
}

function buildTimePressureComponents(input = {}) {
    const attention = clamp01(input.attention ?? 0.5)
    const activity = clamp01(input.activity ?? attention)
    const pressure = clamp01(input.pressure ?? 0)
    const conflict = clamp01(input.conflict ?? 0)
    const stability = clamp01(input.stability ?? 0.5)
    const field = clamp01(input.field ?? 0.5)
    const entropy = clamp01((safeNumber(input.entropy ?? 1.5) / 3))
    const noise = clamp01(input.noise ?? 0.1)
    const prediction = clamp01(input.prediction ?? 0.5)
    const predictability = clamp01((safeNumber(input.predictability ?? 130) / 260))
    const attractorIntensity = clamp01(input.attractorIntensity ?? 0)
    const networkConflict = clamp01(input.networkConflict ?? 0)
    const networkDensity = clamp01(input.networkDensity ?? 0)
    const idleHours = Math.max(0, safeNumber(input.idleHours ?? 0))

    const uncertainty =
        noise * 0.30 +
        entropy * 0.30 +
        (1 - prediction) * 0.20 +
        (1 - predictability) * 0.20

    const instability =
        pressure * 0.30 +
        conflict * 0.22 +
        (1 - stability) * 0.22 +
        Math.abs(field - 0.5) * 0.12 +
        attractorIntensity * 0.14

    const networkLoad =
        networkConflict * 0.65 +
        networkDensity * 0.35

    const idleLoad = clamp01(idleHours / 48)

    const overload =
        activity * 0.18 +
        pressure * 0.26 +
        conflict * 0.18 +
        networkLoad * 0.14 +
        uncertainty * 0.12 +
        idleLoad * 0.12

    const fatigue =
        (1 - attention) * 0.22 +
        (1 - stability) * 0.24 +
        pressure * 0.18 +
        idleLoad * 0.20 +
        uncertainty * 0.16

    return {
        attention,
        activity,
        pressure,
        conflict,
        stability,
        field,
        entropy,
        noise,
        prediction,
        predictability,
        attractorIntensity,
        networkConflict,
        networkDensity,
        idleHours,
        uncertainty: clamp01(uncertainty),
        instability: clamp01(instability),
        networkLoad: clamp01(networkLoad),
        idleLoad: clamp01(idleLoad),
        overload: clamp01(overload),
        fatigue: clamp01(fatigue)
    }
}

function resolveTimePressure(input = {}) {
    const prev = loadTimePressureState()
    const computedIdleHours = input.idleHours != null
        ? Math.max(0, safeNumber(input.idleHours))
        : computeIdleHours(prev.lastRunAt)

    const components = buildTimePressureComponents({
        ...input,
        idleHours: computedIdleHours
    })

    const basePressure =
        components.uncertainty * 0.26 +
        components.instability * 0.34 +
        components.networkLoad * 0.14 +
        components.idleLoad * 0.10 +
        components.overload * 0.10 +
        components.fatigue * 0.06

    const rawPressure = clamp01(basePressure)

    const drift = clamp(rawPressure - safeNumber(prev.pressure, 0), -1, 1)

    const momentum = clamp(
        safeNumber(prev.momentum, 0) * 0.60 +
        drift * 0.40,
        -1,
        1
    )

    const stabilizedPressure = clamp01(
        rawPressure * 0.72 +
        safeNumber(prev.pressure, 0) * 0.18 +
        Math.max(0, momentum) * 0.10
    )

    const urgency = clamp01(
        stabilizedPressure * 0.62 +
        components.idleLoad * 0.12 +
        components.networkLoad * 0.10 +
        components.overload * 0.10 +
        Math.max(0, momentum) * 0.06
    )

    const entry = {
        t: new Date().toISOString(),
        pressure: Number(stabilizedPressure.toFixed(4)),
        urgency: Number(urgency.toFixed(4)),
        drift: Number(drift.toFixed(4)),
        momentum: Number(momentum.toFixed(4)),
        overload: Number(components.overload.toFixed(4)),
        fatigue: Number(components.fatigue.toFixed(4)),
        idleHours: Number(computedIdleHours.toFixed(3))
    }

    const nextState = {
        pressure: entry.pressure,
        urgency: entry.urgency,
        drift: entry.drift,
        momentum: entry.momentum,
        overload: entry.overload,
        fatigue: entry.fatigue,
        idleHours: entry.idleHours,
        lastRunAt: entry.t,
        history: [...(prev.history || []), entry].slice(-90)
    }

    saveTimePressureState(nextState)

    const result = {
        ...nextState,
        label: getPressureLabel(nextState.pressure),
        color: getPressureColor(nextState.pressure),
        description: getPressureDescription(nextState.pressure),
        temporalMode: getRecommendedTemporalMode(nextState.pressure),
        components
    }

    window.mtosTimePressure = result
    return result
}

function applyTimePressureToDayState(dayState, tp = null) {
    const state = dayState && typeof dayState === "object" ? { ...dayState } : {}
    const p = tp || window.mtosTimePressure || resolveTimePressure()

    const pressureValue = clamp01(p.pressure)
    const urgency = clamp01(p.urgency)

    state.timePressure = pressureValue
    state.timeUrgency = urgency
    state.timePressureLabel = p.label
    state.timePressureColor = p.color
    state.timePressureMode = p.temporalMode

    state.dayIndex = clamp(
        safeNumber(state.dayIndex, 0) -
        pressureValue * 0.18 -
        urgency * 0.08 +
        Math.min(0, safeNumber(p.momentum, 0)) * 0.06,
        -1,
        1
    )

    state.pressure = clamp01(
        safeNumber(state.pressure, 0) +
        pressureValue * 0.18
    )

    state.conflict = clamp01(
        safeNumber(state.conflict, 0) +
        urgency * 0.08
    )

    state.stability = clamp01(
        safeNumber(state.stability, 0.5) -
        pressureValue * 0.16
    )

    state.activity = clamp01(
        safeNumber(state.activity, safeNumber(state.attention, 0.5)) +
        (pressureValue >= 0.62 ? 0.05 : -0.02)
    )

    const baseDesc = typeof state.dayDesc === "string" ? state.dayDesc : ""

    state.dayDesc = `${baseDesc} Temporal pressure: ${p.label}. ${p.description}`.trim()

    return state
}

function applyTimePressureToLinks(links = [], tp = null) {
    const p = tp || window.mtosTimePressure || resolveTimePressure()
    const pressureValue = clamp01(p.pressure)

    if (!Array.isArray(links)) return []

    return links.map(link => {
        if (!link || typeof link !== "object") return link

        const out = { ...link }

        let weight = safeNumber(out.weight, safeNumber(out.strength, 0))
        let strength = safeNumber(out.strength, weight)
        let conflict = clamp01(out.conflict ?? 0)
        let support = clamp01(out.support ?? 0)
        let resonance = clamp01(out.resonance ?? 0)

        if (pressureValue >= 0.82) {
            conflict = clamp01(conflict + 0.20 * pressureValue)
            support = clamp01(support * (1 - 0.18 * pressureValue))
            resonance = clamp01(resonance * (1 - 0.16 * pressureValue))
            weight *= (1 - 0.12 * pressureValue)
            strength *= (1 - 0.10 * pressureValue)
        } else if (pressureValue >= 0.62) {
            conflict = clamp01(conflict + 0.12 * pressureValue)
            support = clamp01(support * (1 - 0.10 * pressureValue))
            resonance = clamp01(resonance * (1 - 0.08 * pressureValue))
            weight *= (1 - 0.07 * pressureValue)
        } else if (pressureValue < 0.34) {
            support = clamp01(support + 0.06 * (1 - pressureValue))
            resonance = clamp01(resonance + 0.05 * (1 - pressureValue))
        }

        out.weight = Number(weight.toFixed(4))
        out.strength = Number(strength.toFixed(4))
        out.conflict = Number(conflict.toFixed(4))
        out.support = Number(support.toFixed(4))
        out.resonance = Number(resonance.toFixed(4))

        return out
    })
}

function applyTimePressureToAttractorState(attractorState = {}, tp = null) {
    const state = attractorState && typeof attractorState === "object"
        ? { ...attractorState }
        : {}

    const p = tp || window.mtosTimePressure || resolveTimePressure()
    const pressureValue = clamp01(p.pressure)

    state.intensity = clamp01(
        safeNumber(state.intensity, 0) +
        pressureValue * 0.12
    )

    state.score = safeNumber(state.score, 0) + pressureValue * 0.10

    if (pressureValue >= 0.82 && state.type !== "chaos") {
        state.type = "chaos"
    } else if (pressureValue >= 0.62 && state.type === "stable") {
        state.type = "trend"
    }

    state.timePressure = pressureValue
    return state
}

function getTimePressureSummary(tp = null) {
    const p = tp || window.mtosTimePressure || loadTimePressureState()
    const value = clamp01(p.pressure ?? 0)

    return {
        value: Number(value.toFixed(3)),
        urgency: Number(clamp01(p.urgency ?? 0).toFixed(3)),
        label: getPressureLabel(value),
        color: getPressureColor(value),
        temporalMode: getRecommendedTemporalMode(value),
        description: getPressureDescription(value),
        drift: Number(clamp(p.drift ?? 0, -1, 1).toFixed(3)),
        momentum: Number(clamp(p.momentum ?? 0, -1, 1).toFixed(3)),
        overload: Number(clamp01(p.overload ?? 0).toFixed(3)),
        fatigue: Number(clamp01(p.fatigue ?? 0).toFixed(3)),
        idleHours: Number(Math.max(0, safeNumber(p.idleHours ?? 0)).toFixed(3))
    }
}

function clearTimePressureState() {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
        console.warn("timePressure clear failed", e)
    }

    window.mtosTimePressure = null
}

export {
    loadTimePressureState,
    saveTimePressureState,
    resolveTimePressure,
    getTimePressureSummary,
    applyTimePressureToDayState,
    applyTimePressureToLinks,
    applyTimePressureToAttractorState,
    getPressureLabel,
    getPressureColor,
    getPressureDescription,
    getRecommendedTemporalMode,
    clearTimePressureState
}