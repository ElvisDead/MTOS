// js/decisionEngine.js
import { t } from "./mtosUI/mtosI18n.js"

function clamp01(x) {
    const n = Number(x)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function clamp(x, min, max) {
    const n = Number(x)
    if (!Number.isFinite(n)) return min
    return Math.max(min, Math.min(max, n))
}

function toUpperSafe(v, fallback = "UNKNOWN") {
    const s = String(v || "").trim()
    return s ? s.toUpperCase() : fallback
}

function getAttractorState() {
    const raw = window.mtosAttractorState || {}
    return {
        type: String(raw.type || "unknown").toLowerCase(),
        intensity: clamp01(raw.intensity ?? 0),
        score: clamp(raw.score ?? 0, 0, 1)
    }
}

function getResolvedState() {
    return Math.max(0, Number(window.mtosResolvedState || 0))
}

function getAdaptiveN() {
    const n = Number(window._adaptiveModel?.N ?? 36)
    return Number.isFinite(n) && n > 0 ? n : 36
}

function getMemoryStrength(memoryLayers = null) {
    if (!memoryLayers || typeof memoryLayers !== "object") return 0
    const decisionMemory = Array.isArray(memoryLayers.decisionMemory)
        ? memoryLayers.decisionMemory
        : []
    return clamp01(Math.min(1, decisionMemory.length / 12))
}

function buildRiskPayload({
    pressure = 0,
    conflict = 0,
    stability = 0.5,
    attention = 0.5,
    field = 0.5,
    tp = 0,
    temporalMode = "EXPLORE",
    memoryStrength = 0,
    mode = "EXPLORE"
} = {}) {
    const p = clamp01(pressure)
    const c = clamp01(conflict)
    const s = clamp01(stability)
    const a = clamp01(attention)
    const f = clamp01(field)
    const tpNorm = clamp01(tp)
    const m = clamp01(memoryStrength)

    const overload =
    p * 0.34 +
    tpNorm * 0.28 +
    (1 - s) * 0.20 +
    c * 0.12 +
    Math.max(0, a - 0.72) * 0.06

const social =
    c * 0.34 +
    p * 0.18 +
    tpNorm * 0.14 +
    Math.max(0, f - 0.58) * 0.10 +
    Math.max(0, a - 0.66) * 0.08 +
    (mode === "INTERACT" ? 0.10 : 0)

    const drift =
        (1 - a) * 0.30 +
        (1 - s) * 0.22 +
        (1 - m) * 0.14 +
        Math.max(0, 0.58 - f) * 0.12 +
        (mode === "EXPLORE" ? 0.10 : 0)

    const rigidity =
        Math.max(0, a - 0.72) * 0.24 +
        Math.max(0, s - 0.68) * 0.18 +
        p * 0.14 +
        (mode === "FOCUS" ? 0.16 : 0)

    const total = clamp01(
        overload * 0.36 +
        social * 0.26 +
        drift * 0.22 +
        rigidity * 0.16
    )

    let label = "LOW"
    let color = "#00ff88"
    let title = "Manageable risk"

    if (total >= 0.78) {
        label = "HIGH"
        color = "#ff6666"
        title = "High error probability"
    } else if (total >= 0.50) {
        label = "MEDIUM"
        color = "#ffb347"
        title = "Moderate behavioral risk"
    }

    const vectors = [
        { key: "overload", value: overload },
        { key: "social", value: social },
        { key: "drift", value: drift },
        { key: "rigidity", value: rigidity }
    ].sort((a, b) => b.value - a.value)

    const top = vectors.slice(0, 2).map(v => v.key)

    const reasons = []
    const avoid = []
    const doNow = []

    top.forEach(key => {
  if (key === "overload") {
    reasons.push("load can exceed stable capacity")
    avoid.push("do not expand commitments")
    doNow.push(t("stepReduceLoad"))
  }
  if (key === "social") {
    reasons.push("contact may become reactive")
    avoid.push("avoid parallel contacts")
    doNow.push(t("stepInteractNarrow"))
  }
  if (key === "drift") {
    reasons.push("attention may scatter")
    avoid.push("avoid weak branching")
    doNow.push(t("stepFinishTask"))
  }
  if (key === "rigidity") {
    reasons.push("you may lock into one angle too early")
    avoid.push("avoid forcing certainty")
    doNow.push(t("stepReopenAlternative"))
  }
})

    return {
        score: Number(total.toFixed(3)),
        label,
        color,
        title,
        temporalMode: toUpperSafe(temporalMode, "EXPLORE"),
        topVectors: top,
        reasons: [...new Set(reasons)].slice(0, 3),
        avoid: [...new Set(avoid)].slice(0, 3),
        doNow: [...new Set(doNow)].slice(0, 3)
    }
}

function resolveModeFromState(dayState = {}, timePressureSummary = {}) {
    const pressure = clamp01(dayState.pressure ?? 0)
    const conflict = clamp01(dayState.conflict ?? 0)
    const stability = clamp01(dayState.stability ?? 0.5)
    const attention = clamp01(dayState.attention ?? 0.5)
    const field = clamp01(dayState.field ?? 0.5)

    const tp = clamp01(timePressureSummary.value ?? timePressureSummary.pressure ?? 0)

    const attractor = getAttractorState()
    const attractorType = attractor.type
    const attractorIntensity = attractor.intensity

    const state = getResolvedState()
    const N = getAdaptiveN()
    const stateRatio = clamp01(N > 0 ? state / N : 0)
    const cyclePos = state > 0 ? (state - 1) % 13 : 0

    let mode = "EXPLORE"

    // 1) SYSTEM STATE = главный драйвер
    if (stateRatio >= 0.82) {
        mode = "REST"
    } else if (stateRatio >= 0.58) {
        mode = "ADJUST"
    } else if (stateRatio >= 0.34) {
        mode = "EXPLORE"
    } else {
        mode = "FOCUS"
    }

    // 2) dayState как корректор
    if (pressure >= 0.72 || conflict >= 0.52 || stability <= 0.36) {
        mode = "REST"
    } else if (
        attention >= 0.72 &&
        stability >= 0.62 &&
        pressure <= 0.42 &&
        conflict <= 0.24
    ) {
        mode = "FOCUS"
    } else if (
        field >= 0.58 &&
        attention >= 0.48 &&
        attention <= 0.74 &&
        pressure <= 0.52 &&
        conflict <= 0.34 &&
        mode === "EXPLORE"
    ) {
        mode = "INTERACT"
    }

    // 3) внутренняя 13-фаза
    if (cyclePos <= 2) {
        if (mode === "FOCUS") mode = "EXPLORE"
    } else if (cyclePos >= 3 && cyclePos <= 5) {
        if (mode === "EXPLORE") mode = "FOCUS"
    } else if (cyclePos >= 6 && cyclePos <= 8) {
        if (mode === "EXPLORE" && pressure < 0.58 && conflict < 0.42) {
            mode = "INTERACT"
        }
    } else if (cyclePos >= 9) {
        if (mode === "FOCUS") mode = "ADJUST"
        if (tp >= 0.45) mode = "REST"
    }

    // 4) attractor = модулятор
    if (attractorType === "chaos") {
        if (tp >= 0.30 || pressure >= 0.42 || conflict >= 0.30) {
            mode = "REST"
        } else {
            mode = "ADJUST"
        }
    } else if (attractorType === "trend") {
        if (mode === "FOCUS") mode = "ADJUST"
    } else if (attractorType === "cycle") {
        if (cyclePos >= 6 && cyclePos <= 8 && tp < 0.58) {
            mode = "INTERACT"
        }
    } else if (attractorType === "stable") {
        if (mode === "REST" && tp < 0.34 && pressure < 0.34 && attractorIntensity >= 0.35) {
            mode = "FOCUS"
        }
    }

    // 5) time pressure = предохранитель
    if (tp >= 0.82) {
        mode = "REST"
    } else if (tp >= 0.62) {
        if (mode === "FOCUS" || mode === "INTERACT") {
            mode = "ADJUST"
        }
    }

    return mode
}

function buildActionFromMode(mode, risk) {
    let action = "Observe the field and avoid impulsive actions."
    let reason = "Default background mode."

    const driver = String(risk?.topVectors?.[0] || "")

    if (mode === "FOCUS") {
        action = "Reduce noise, narrow tasks, finish one concrete thing."
        reason = driver === "drift"
            ? "Attention may scatter. Narrowing improves efficiency."
            : "Focused execution is currently the cleanest path."
    }
    else if (mode === "ADJUST") {
        action = "Loosen fixation, reopen one alternative, and continue without forcing certainty."
        reason = driver === "rigidity"
            ? "You may lock too early. Keep movement, but do not overcommit to one angle."
            : "The system needs flexibility before strong commitment."
    }
    else if (mode === "REST") {
        action = "Do not expand commitments today. Protect energy and simplify."
        reason = driver === "overload"
            ? "Load pressure is dominant. Reduce commitments."
            : "Recovery and simplification are safer than expansion."
    }
    else if (mode === "INTERACT") {
        action = "Good moment for one constructive contact or clean coordination."
        reason = driver === "social"
            ? "Social dynamics are active. Interaction works best when kept clean and narrow."
            : "The field is open enough for one useful contact."
    }
    else if (mode === "EXPLORE") {
        action = "Test a move without full commitment and observe response."
        reason = "No single hard constraint dominates. Exploration stays viable."
    }

    if (risk?.label === "HIGH") {
        reason = "High risk overrides softer signals."
    }

    const attractorType = String(window.mtosAttractorState?.type || "").toLowerCase()
    if (attractorType === "chaos" && Number(risk?.score ?? 0) < 0.3) {
        reason = "System unstable, but behavior still controlled."
    }

    return { action, reason }
}

function buildStepHints(mode, risk) {
    let nextStep = risk?.doNow?.[0] || "hold position"
    let avoidNow = risk?.avoid?.[0] || "avoid unnecessary actions"

    if (mode === "FOCUS") {
        nextStep = "finish one concrete task"
        avoidNow = "avoid multitasking"
    }
    else if (mode === "ADJUST") {
        nextStep = "reopen one alternative before committing"
        avoidNow = "avoid forcing certainty too early"
    }
    else if (mode === "REST") {
        nextStep = risk?.doNow?.[0] || "reduce load"
        avoidNow = risk?.avoid?.[0] || "avoid pressure decisions"
    }
    else if (mode === "INTERACT") {
        nextStep = risk?.doNow?.[0] || "choose one safe contact only"
        avoidNow = risk?.avoid?.[0] || "avoid emotional escalation"
    }
    else if (mode === "EXPLORE") {
        nextStep = risk?.doNow?.[0] || "test safely"
        avoidNow = risk?.avoid?.[0] || "avoid rigid commitments"
    }

    return { nextStep, avoidNow }
}

function buildDecisionConfidence({
    stability = 0.5,
    attention = 0.5,
    pressure = 0,
    riskScore = 0,
    memoryLayers = null,
    attractorIntensity = 0
} = {}) {
    let confidence =
        0.52 +
        clamp01(stability) * 0.18 +
        clamp01(attention) * 0.10 +
        (1 - clamp01(pressure)) * 0.10 +
        (1 - clamp01(riskScore)) * 0.10

    if (memoryLayers && Array.isArray(memoryLayers.decisionMemory) && memoryLayers.decisionMemory.length >= 3) {
        confidence += 0.04
    }

    confidence -= clamp01(attractorIntensity) * 0.04

    return Math.max(0.18, Math.min(0.95, confidence))
}

export function resolveTodayMode(dayState = {}, timePressureSummary = {}, memoryLayers = null) {
    const pressure = clamp01(dayState.pressure ?? 0)
    const conflict = clamp01(dayState.conflict ?? 0)
    const stability = clamp01(dayState.stability ?? 0.5)
    const attention = clamp01(dayState.attention ?? 0.5)
    const field = clamp01(dayState.field ?? 0.5)

    const temporalMode = toUpperSafe(
        timePressureSummary.temporalMode || "EXPLORE",
        "EXPLORE"
    )

    const tp = clamp01(timePressureSummary.value ?? timePressureSummary.pressure ?? 0)
    const memoryStrength = getMemoryStrength(memoryLayers)

    const mode = resolveModeFromState(dayState, timePressureSummary)

    const risk = buildRiskPayload({
        pressure,
        conflict,
        stability,
        attention,
        field,
        tp,
        temporalMode,
        memoryStrength,
        mode
    })

    const { action, reason } = buildActionFromMode(mode, risk)
    const { nextStep, avoidNow } = buildStepHints(mode, risk)
    const attractor = getAttractorState()

    const confidence = buildDecisionConfidence({
        stability,
        attention,
        pressure,
        riskScore: risk.score,
        memoryLayers,
        attractorIntensity: attractor.intensity
    })

    return {
        mode,
        text: action,
        action,
        reason,
        confidence: Number(confidence.toFixed(3)),
        nextStep,
        avoidNow,
        risk,
        source: {
            pressure,
            conflict,
            stability,
            attention,
            field,
            tp,
            temporalMode,
            memoryStrength,
            state: getResolvedState(),
            attractorType: attractor.type,
            attractorIntensity: attractor.intensity
        }
    }
}

function pickTopEvent(events) {
    if (!Array.isArray(events) || events.length === 0) return null
    return [...events].sort((a, b) => (b.score || 0) - (a.score || 0))[0]
}

function generateTargetsFromNetwork() {
    if (!Array.isArray(window.currentNetworkRelations)) {
        return {
            primary: [],
            avoid: [],
            neutral: []
        }
    }

    const primary = []
    const avoid = []
    const neutral = []

    window.currentNetworkRelations.forEach(r => {
        const score = Number(r?.score ?? r?.displayScore ?? 0)
        const name = String(r?.target || r?.b || r?.source || r?.a || "").trim()

        if (!name) return

        const item = {
            name,
            role: "neutral",
            score: Number(score.toFixed(3))
        }

        if (score > 0.6) {
            item.role = "primary"
            primary.push(item)
        } else if (score < -0.4) {
            item.role = "avoid"
            avoid.push(item)
        } else {
            neutral.push(item)
        }
    })

    primary.sort((a, b) => b.score - a.score)
    avoid.sort((a, b) => a.score - b.score)
    neutral.sort((a, b) => Math.abs(b.score) - Math.abs(a.score))

    return {
        primary,
        avoid,
        neutral
    }
}

window.resolveDecisionTargets = generateTargetsFromNetwork

window.buildMTOSDecision = function () {
    const state = window.MTOS_STATE || {}
    const events = state.events || []
    const collective = state.collective || {}

    const topEvent = pickTopEvent(events)
    void topEvent

    const pseudoDayState = {
        pressure: Number(collective.timePressure ?? collective.pressure ?? 0),
        conflict: Number(collective.conflict ?? 0),
        stability: Number(collective.consistency ?? collective.stability ?? 0.5),
        attention: Number(collective.attention ?? 0.5),
        field: Number(collective.field ?? collective.coherence ?? 0.5)
    }

    const timePressureSummary = {
        value: Number(collective.timePressure ?? collective.pressure ?? 0),
        temporalMode: String(collective.temporalMode || "EXPLORE")
    }

    const decision = resolveTodayMode(
        pseudoDayState,
        timePressureSummary,
        window.mtosMemoryLayers || null
    )

    const fullDecision = {
        ...decision,
        targets: generateTargetsFromNetwork(),
        createdAt: new Date().toISOString()
    }

    if (typeof window.setMTOSState === "function") {
        window.setMTOSState({ decision: fullDecision })
    }

    return fullDecision
}