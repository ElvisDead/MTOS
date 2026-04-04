// js/decisionEngine.js

function clamp01(x){
    const n = Number(x)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

export function resolveTodayMode(dayState = {}, timePressureSummary = {}, memoryLayers = null) {
    const pressure = clamp01(dayState.pressure ?? 0)
    const conflict = clamp01(dayState.conflict ?? 0)
    const stability = clamp01(dayState.stability ?? 0.5)
    const attention = clamp01(dayState.attention ?? 0.5)
    const field = clamp01(dayState.field ?? 0.5)
    const temporalMode = String(timePressureSummary.temporalMode || "EXPLORE").toUpperCase()
    const tp = clamp01(timePressureSummary.value ?? timePressureSummary.pressure ?? 0)

    let mode = "EXPLORE"
    let text = "Explore carefully without forcing commitment."
    let confidence = 0.55

    if (tp >= 0.82 || pressure >= 0.78) {
        mode = "REST"
        text = "Reduce load, avoid escalation, and keep actions reversible."
        confidence = 0.84
    }
    else if ((pressure >= 0.62 && stability <= 0.42) || conflict >= 0.52) {
        mode = "FOCUS"
        text = "Narrow the scope, cut noise, and finish one concrete thing."
        confidence = 0.74
    }
    else if (attention >= 0.70 && stability >= 0.60 && conflict <= 0.28) {
        mode = "FOCUS"
        text = "Use the coherence window for direct execution."
        confidence = 0.78
    }
    else if (field >= 0.60 && conflict <= 0.34 && tp <= 0.55) {
        mode = "INTERACT"
        text = "Good moment for constructive contact and coordination."
        confidence = 0.68
    }
    else {
        mode = temporalMode === "FOCUS" ? "FOCUS" : "EXPLORE"
        text = mode === "FOCUS"
            ? "Stay selective and move in one direction."
            : "Probe the field and test without overcommitting."
        confidence = 0.58
    }

    if (memoryLayers && Array.isArray(memoryLayers.decisionMemory) && memoryLayers.decisionMemory.length >= 3) {
        confidence = Math.min(0.95, confidence + 0.04)
    }

    return {
        mode,
        text,
        confidence
    }
}

function pickTopEvent(events) {
    if (!Array.isArray(events) || events.length === 0) return null
    return [...events].sort((a, b) => (b.score || 0) - (a.score || 0))[0]
}

window.buildMTOSDecision = function () {
    const state = window.MTOS_STATE || {}
    const events = state.events || []
    const collective = state.collective || {}

    const topEvent = pickTopEvent(events)
    const pressure = Number(collective.timePressure ?? 0)
    const stability = Number(collective.consistency ?? collective.stability ?? 0)

    let mode = "EXPLORE"
    let action = "Observe the field and avoid impulsive actions."
    let reason = "Default background mode."

    if (topEvent) {
        if (topEvent.type === "conflict") {
            mode = "REST"
            action = "Avoid unnecessary contact and do practical solo work."
            reason = "Conflict window under elevated pressure."
        }
        else if (topEvent.type === "instability") {
            mode = "FOCUS"
            action = "Reduce noise, narrow tasks, finish one concrete thing."
            reason = "Activation is high while stability is low."
        }
        else if (topEvent.type === "support") {
            mode = "INTERACT"
            action = "Good moment for constructive contact or coordination."
            reason = "Supportive ties are stronger than friction."
        }
        else if (topEvent.type === "opportunity") {
            mode = "EXPLORE"
            action = "Initiate a useful move, test a connection, or advance a project."
            reason = "Potential is high and pressure is manageable."
        }
    }

    if (pressure >= 0.80) {
        mode = "REST"
        action = "Do not expand commitments today. Protect energy and simplify."
        reason = "Extreme time pressure overrides softer signals."
    }

    if (stability <= 0.30 && pressure >= 0.60) {
        mode = "FOCUS"
        action = "No new social moves. Finish physical or technical work only."
        reason = "Low stability plus pressure requires narrowing."
    }

    const decision = {
        mode,
        action,
        reason,
        confidence: Math.round(
            Math.max(50, Math.min(95, ((stability * 0.55 + (1 - pressure) * 0.45) * 100)))
        ),
        createdAt: new Date().toISOString()
    }

    window.setMTOSState({ decision })
    return decision
}