// js/eventEngine.js

function clamp01(x) {
    return Math.max(0, Math.min(1, Number(x) || 0))
}

function normalizePhi(phi) {
    return clamp01(phi)
}

function normalizeStability(stability) {
    return clamp01(stability)
}

function normalizePressure(pressure) {
    return clamp01(pressure)
}

window.evaluateMTOSEvents = function () {
    const state = window.MTOS_STATE || {}
    const collective = state.collective || {}
    const network = state.network || {}
    const weather = state.weather || {}

    const phi = normalizePhi(collective.phi ?? weather.phi ?? 0)
    const stability = normalizeStability(collective.consistency ?? collective.stability ?? weather.stability ?? 0)
    const pressure = normalizePressure(collective.timePressure ?? network.timePressure ?? weather.timePressure ?? 0)

    const relationSummary = network.relationSummary || {}
    const conflictCount = Number(relationSummary.conflictCount || 0)
    const supportCount = Number(relationSummary.supportCount || 0)
    const ultraCount = Number(relationSummary.ultraCount || 0)

    const events = []

    if (phi >= 0.72 && stability <= 0.42) {
        events.push({
            type: "instability",
            level: "high",
            title: "Instability Spike",
            description: "High metabolic activation with low stability.",
            score: phi
        })
    }

    if (pressure >= 0.68 && conflictCount >= 2) {
        events.push({
            type: "conflict",
            level: "high",
            title: "Conflict Window",
            description: "Time pressure amplifies unstable ties.",
            score: pressure
        })
    }

    if (supportCount >= 2 && phi >= 0.45 && stability >= 0.58) {
        events.push({
            type: "support",
            level: "medium",
            title: "Support Window",
            description: "Good conditions for stable cooperation.",
            score: Math.max(phi, stability)
        })
    }

    if (ultraCount >= 1 && pressure <= 0.55 && stability >= 0.60) {
        events.push({
            type: "opportunity",
            level: "high",
            title: "Opportunity Window",
            description: "Strong relation potential under manageable pressure.",
            score: stability
        })
    }

    if (events.length === 0) {
        events.push({
            type: "background",
            level: "low",
            title: "Background Mode",
            description: "No major event threshold reached.",
            score: Math.max(phi, stability, pressure)
        })
    }

    window.setMTOSState({ events })
    return events
}