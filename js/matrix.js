// ======================================
// MATRIX CORE (13 x 20)
// ======================================

// kin (1–260) → tone (0–12), seal (0–19)
export function kinToTS(kin) {

    if (kin < 1 || kin > 260) {
        console.warn("kinToTS: invalid kin", kin);
    }

    const k = kin - 1;

    return {
        tone: k % 13,
        seal: k % 20
    };
}

// ======================================
// CORRECT ts → kin (CRT FIX)
// ======================================

export function tsToKin(tone, seal) {

    if (tone < 0 || tone > 12) {
        console.warn("tsToKin: invalid tone", tone);
    }

    if (seal < 0 || seal > 19) {
        console.warn("tsToKin: invalid seal", seal);
    }

    // 🔥 ПРАВИЛЬНАЯ ЛОГИКА (без формулы!)
    for (let i = 0; i < 260; i++) {

        if (i % 13 === tone && i % 20 === seal) {
            return i + 1;
        }

    }

    console.error("tsToKin FAILED:", tone, seal);
    return 1;
}

// ======================================
// SAFE CONVERSIONS
// ======================================

export function safeKinToTS(kin) {
    try {
        return kinToTS(kin);
    } catch (e) {
        console.error("safeKinToTS error:", kin);
        return { tone: 0, seal: 0 };
    }
}

export function safeTsToKin(tone, seal) {
    try {
        return tsToKin(tone, seal);
    } catch (e) {
        console.error("safeTsToKin error:", tone, seal);
        return 1;
    }
}

// ======================================
// GRID BUILDERS
// ======================================

export function buildKinMatrix() {

    const rows = 20;
    const cols = 13;

    const matrix = [];

    for (let seal = 0; seal < rows; seal++) {

        const row = [];

        for (let tone = 0; tone < cols; tone++) {

            const kin = tsToKin(tone, seal);

            row.push(kin);
        }

        matrix.push(row);
    }

    return matrix;
}

export function buildLinearKin() {
    return Array.from({ length: 260 }, (_, i) => i + 1);
}

// ======================================
// INDEX HELPERS
// ======================================

export function indexToKin(i) {
    return i + 1;
}

export function kinToIndex(kin) {
    return kin - 1;
}

// ======================================
// NEIGHBORS
// ======================================

export function getNeighbors(kin) {

    const { tone, seal } = kinToTS(kin);

    return {
        left: tsToKin((tone + 12) % 13, seal),
        right: tsToKin((tone + 1) % 13, seal),
        up: tsToKin(tone, (seal + 19) % 20),
        down: tsToKin(tone, (seal + 1) % 20)
    };
}

// ======================================
// DISTANCE
// ======================================

export function kinDistance(a, b) {

    const diff = Math.abs(a - b);
    return Math.min(diff, 260 - diff);
}

// ======================================
// WAVE / HARMONIC
// ======================================

export function getWave(kin) {
    return Math.floor((kin - 1) / 13);
}

export function getHarmonic(kin) {
    return Math.floor((kin - 1) / 4);
}

// ======================================
// VALIDATION (ФИКС)
// ======================================

export function validateMatrix() {

    let errors = 0;

    for (let kin = 1; kin <= 260; kin++) {

        const { tone, seal } = kinToTS(kin);
        const reconstructed = tsToKin(tone, seal);

        if (reconstructed !== kin) {
            console.warn("Mismatch:", kin, reconstructed);
            errors++;
        }
    }

    if (errors === 0) {
        console.log("Matrix OK");
    } else {
        console.error("Matrix errors:", errors);
    }
}

// ======================================
// CACHE
// ======================================

let _matrixCache = null;
let _linearCache = null;

export function getMatrixCached() {
    if (!_matrixCache) {
        _matrixCache = buildKinMatrix();
    }
    return _matrixCache;
}

export function getLinearCached() {
    if (!_linearCache) {
        _linearCache = buildLinearKin();
    }
    return _linearCache;
}

// ======================================
// DEBUG
// ======================================

export function debugKin(kin) {

    const ts = kinToTS(kin);

    return {
        kin,
        tone: ts.tone,
        seal: ts.seal,
        wave: getWave(kin),
        harmonic: getHarmonic(kin),
        neighbors: getNeighbors(kin)
    };
}

// ======================================
// GLOBAL DEBUG
// ======================================

if (typeof window !== "undefined") {

    window.debugKin = debugKin;
    window.buildKinMatrix = buildKinMatrix;
    window.validateMatrix = validateMatrix;

}
