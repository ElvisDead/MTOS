window.resolveDecisionTargets = function () {

    if (!window.MTOS_STATE?.network) return []

    const users = window.MTOS_STATE.network.nodes || []
    const edges = window.MTOS_STATE.network.edges || []

    const myId = window.currentUserId

    const scores = []

    edges.forEach(edge => {

        if (edge.from !== myId && edge.to !== myId) return

        const otherId = edge.from === myId ? edge.to : edge.from

        const strength = Number(edge.weight || edge.score || 0)
        const lastContact = edge.lastContact || 0

        const recency = Date.now() - lastContact

        // чем свежее контакт — тем ниже приоритет
        const recencyScore = recency > 86400000 ? 1 : 0.3

        const total = strength * recencyScore

        scores.push({
            id: otherId,
            score: total
        })
    })

    return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
}