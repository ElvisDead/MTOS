// ==========================================================
// MTOS STATE RESOLUTION ENGINE
// (IChing / Tzolkin / Adaptive N-states)
// ==========================================================

export const STATE_MODES = {
    ICHING: "iching",        // 64
    TZOLKIN: "tzolkin",      // 260
    ADAPTIVE: "adaptive"     // dynamic N
}

// ==========================================================
// CORE RESOLUTION SELECTOR
// ==========================================================

export function resolveStateMode(config = {}) {
    const mode = String(config.mode || "tzolkin").toLowerCase()

    if (mode === STATE_MODES.ICHING) return STATE_MODES.ICHING
    if (mode === STATE_MODES.ADAPTIVE) return STATE_MODES.ADAPTIVE
    return STATE_MODES.TZOLKIN
}

// ==========================================================
// MAIN ENTRY
// ==========================================================

export function resolveStateIndex({
    kin = 1,
    attention = 0.5,
    pressure = 0.5,
    conflict = 0,
    field = 0.5,
    mode = "tzolkin",
    adaptiveCache = null
} = {}) {

    const m = resolveStateMode({ mode })

    if (m === STATE_MODES.ICHING) {
        return resolve64State(kin)
    }

    if (m === STATE_MODES.ADAPTIVE) {
        return resolveAdaptiveState({
            kin,
            attention,
            pressure,
            conflict,
            field,
            adaptiveCache
        })
    }

    // default TZOLKIN
    return clampIndex(kin, 260)
}

// ==========================================================
// 64 STATES (I CHING STYLE)
// ==========================================================

function resolve64State(kin) {
    // сворачиваем 260 → 64
    const idx = ((kin - 1) % 64) + 1
    return idx
}

// ==========================================================
// ADAPTIVE STATES (KEY PART)
// ==========================================================

export function resolveAdaptiveState({
    kin,
    attention,
    pressure,
    conflict,
    field,
    adaptiveCache = null
}) {

    const signature = buildStateSignature({
        attention,
        pressure,
        conflict,
        field
    })

    if (!adaptiveCache || !adaptiveCache.centroids) {
        return kin // fallback
    }

    let best = 0
    let bestDist = Infinity

    adaptiveCache.centroids.forEach((c, i) => {
        const d = distance(signature, c)
        if (d < bestDist) {
            bestDist = d
            best = i
        }
    })

    return best + 1
}

// ==========================================================
// SIGNATURE
// ==========================================================

export function buildStateSignature({
    attention,
    pressure,
    conflict,
    field
}) {
    const noise = () => (Math.random() - 0.5) * 0.18

    return [
        clamp01(attention + noise()),
        clamp01(pressure + noise()),
        clamp01(conflict + noise()),
        clamp01(field + noise())
    ]
}

// ==========================================================
// ADAPTIVE BUILDER
// ==========================================================

export function buildAdaptiveModel(weather, N = 36) {
    if (!Array.isArray(weather) || weather.length === 0) {
        return null
    }

    const samples = weather.map(w => buildStateSignature({
        attention: w.attention ?? 0.5,
        pressure: w.pressure ?? 0.5,
        conflict: w.conflict ?? 0,
        field: w.field ?? 0.5
    }))

    const centroids = kMeans(samples, N, 8)

    return {
        N,
        centroids
    }
}

// ==========================================================
// SIMPLE K-MEANS
// ==========================================================

function kMeans(samples, k, iterations = 6) {

    const centroids = samples.slice(0, k)

    for (let iter = 0; iter < iterations; iter++) {

        const clusters = new Array(k).fill(0).map(() => [])

        samples.forEach(s => {
            let best = 0
            let bestDist = Infinity

            centroids.forEach((c, i) => {
                const d = distance(s, c)
                if (d < bestDist) {
                    bestDist = d
                    best = i
                }
            })

            clusters[best].push(s)
        })

        for (let i = 0; i < k; i++) {
            if (clusters[i].length === 0) continue

            centroids[i] = average(clusters[i])
        }
    }

    return centroids
}

// ==========================================================
// UTILS
// ==========================================================

function distance(a, b) {
    let sum = 0
    for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i]
        sum += d * d
    }
    return Math.sqrt(sum)
}

function average(arr) {
    const out = new Array(arr[0].length).fill(0)

    arr.forEach(v => {
        for (let i = 0; i < v.length; i++) {
            out[i] += v[i]
        }
    })

    for (let i = 0; i < out.length; i++) {
        out[i] /= arr.length
    }

    return out
}

function clamp01(x) {
    const n = Number(x)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function clampIndex(x, max) {
    const n = Math.floor(Number(x) || 1)
    return Math.max(1, Math.min(max, n))
}

export function estimateAdaptiveResolution(weather = [], metrics = {}) {
    const points = Array.isArray(weather) ? weather : []
    if (!points.length) return 12

    const entropy = Number(metrics.entropy ?? 0.5)
    const temperature = Number(metrics.T ?? metrics.temperature ?? 0.5)
    const pressure = Number(metrics.pressure ?? 0.5)
    const conflict = Number(metrics.conflict ?? 0.0)

    const signatures = points.map(w => buildStateSignature({
        attention: w.attention ?? 0.5,
        pressure: w.pressure ?? 0.5,
        conflict: w.conflict ?? 0,
        field: w.field ?? 0.5
    }))

    const diversity = estimateSignatureDiversity(signatures)

    let rawN =
        8 +
        diversity * 38 +
        entropy * 12 +
        temperature * 10 -
        pressure * 6 -
        conflict * 4

    rawN = Math.round(rawN)

    return Math.max(8, Math.min(72, rawN))
}

export function buildAdaptiveModelDynamic(weather = [], metrics = {}) {
    const N = estimateAdaptiveResolution(weather, metrics)
    const model = buildAdaptiveModel(weather, N)

    if (!model) return null

    return {
        ...model,
        dynamic: true,
        diversity: Number(
            estimateSignatureDiversity(
                weather.map(w => buildStateSignature({
                    attention: w.attention ?? 0.5,
                    pressure: w.pressure ?? 0.5,
                    conflict: w.conflict ?? 0,
                    field: w.field ?? 0.5
                }))
            ).toFixed(3)
        ),
        entropy: Number(metrics.entropy ?? 0.5),
        temperature: Number(metrics.T ?? metrics.temperature ?? 0.5),
        pressure: Number(metrics.pressure ?? 0.5),
        conflict: Number(metrics.conflict ?? 0.0)
    }
}

function estimateSignatureDiversity(samples = []) {
    if (!Array.isArray(samples) || samples.length < 2) return 0

    let total = 0
    let count = 0

    for (let i = 0; i < samples.length; i++) {
        for (let j = i + 1; j < samples.length; j++) {
            total += distance(samples[i], samples[j])
            count++
        }
    }

    if (!count) return 0
    return Math.max(0, Math.min(1, total / count / 2))
}