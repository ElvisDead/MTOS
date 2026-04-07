// js/memoryLoop.js

function safeNumber(x, fallback = 0) {
    const n = Number(x)
    return Number.isFinite(n) ? n : fallback
}

window.applyMTOSMemoryToRelations = function (relations) {
    const state = window.MTOS_STATE || {}
    const memory = state.memory || {}
    const history = memory.relationHistory || {}

    if (!Array.isArray(relations)) return relations || []

    return relations.map(rel => {
        const id = rel.id || `${rel.source}->${rel.target}`
        const mem = history[id] || { reinforcement: 0, decay: 0 }

        const adjustedStrength = safeNumber(rel.strength, 0) + safeNumber(mem.reinforcement, 0) - safeNumber(mem.decay, 0)

        return {
            ...rel,
            strength: Math.max(-1, Math.min(1, adjustedStrength))
        }
    })
}

window.commitMTOSDecisionToMemory = function () {
    const state = window.MTOS_STATE || {}
    const memory = state.memory || {}
    const decision = state.decision || null

    if (!decision) return

    const decisions = Array.isArray(memory.decisions) ? memory.decisions.slice() : []
    decisions.push({
        mode: decision.mode,
        action: decision.action,
        confidence: decision.confidence,
        createdAt: decision.createdAt
    })

    while (decisions.length > 120) decisions.shift()

    window.updateMTOSBranch("memory", {
        ...memory,
        decisions
    })
}

window.registerMTOSOutcome = function (payload) {
    const state = window.MTOS_STATE || {}
    const memory = state.memory || {}
    const outcomes = Array.isArray(memory.outcomes) ? memory.outcomes.slice() : []

    let safeRelationId = payload.relationId || null

    if (typeof safeRelationId === "string" && safeRelationId.includes("->")) {
        const [a, b] = safeRelationId.split("->")
        const aId = typeof window.getAnonIdForExport === "function" ? window.getAnonIdForExport(a) : a
        const bId = typeof window.getAnonIdForExport === "function" ? window.getAnonIdForExport(b) : b
        safeRelationId = `${aId}->${bId}`
    }

    outcomes.push({
        outcome: payload.outcome || "neutral",
        relationId: safeRelationId,
        value: safeNumber(payload.value, 0),
        createdAt: new Date().toISOString()
    })
    while (outcomes.length > 300) outcomes.shift()

    const relationHistory = { ...(memory.relationHistory || {}) }

    if (safeRelationId) {
        const prev = relationHistory[safeRelationId] || { reinforcement: 0, decay: 0 }

        if (payload.outcome === "good") {
            prev.reinforcement = Math.min(0.50, safeNumber(prev.reinforcement, 0) + 0.04)
            prev.decay = Math.max(0, safeNumber(prev.decay, 0) - 0.01)
        }
        else if (payload.outcome === "bad") {
            prev.decay = Math.min(0.50, safeNumber(prev.decay, 0) + 0.05)
            prev.reinforcement = Math.max(0, safeNumber(prev.reinforcement, 0) - 0.01)
        }
        else {
            prev.decay = Math.min(0.50, safeNumber(prev.decay, 0) + 0.005)
        }

        relationHistory[safeRelationId] = prev
    }

    window.updateMTOSBranch("memory", {
        ...memory,
        outcomes,
        relationHistory
    })
}