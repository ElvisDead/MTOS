export function resolveTodayMode(dayState, timePressure, memory) {

    const s = dayState || {}

    const attention = Number(s.attention ?? 0.5)
    const activity = Number(s.activity ?? attention)
    const pressure = Number(s.pressure ?? 0)
    const conflict = Number(s.conflict ?? 0)
    const stability = Number(s.stability ?? 0.5)
    const field = Number(s.field ?? 0.5)

    // 4 режима
    let scores = {
        FOCUS: 0,
        EXPLORE: 0,
        SOCIAL: 0,
        RECOVER: 0
    }

    // === FOCUS ===
    scores.FOCUS =
        stability * 0.4 +
        attention * 0.3 -
        pressure * 0.25 -
        conflict * 0.2

    // === EXPLORE ===
    scores.EXPLORE =
        activity * 0.35 +
        field * 0.3 -
        stability * 0.2

    // === SOCIAL ===
    scores.SOCIAL =
        (1 - conflict) * 0.4 +
        activity * 0.25 +
        field * 0.2

    // === RECOVER ===
    scores.RECOVER =
        pressure * 0.4 +
        conflict * 0.3 +
        (1 - stability) * 0.2

    // === TIME PRESSURE ===
    if (timePressure?.pressure > 0.7) {
        scores.RECOVER += 0.2
        scores.FOCUS -= 0.1
    }

    // === выбор ===
    const mode = Object.keys(scores).reduce((a, b) =>
        scores[a] > scores[b] ? a : b
    )

    // === confidence ===
    const sorted = Object.values(scores).sort((a,b)=>b-a)
    const diff = sorted[0] - sorted[1]

    let confidence = "Low"
    if (diff > 0.25) confidence = "High"
    else if (diff > 0.12) confidence = "Medium"

    return {
        mode,
        confidence,
        scores
    }
}