// matrix.js

// ======================================
// BASIC CONVERSIONS
// ======================================

// kin (1–260) → tone (0–12), seal (0–19)
export function kinToTS(kin) {

    const k = kin - 1;

    return {
        tone: k % 13,
        seal: k % 20
    };
}

// tone + seal → kin (1–260)
export function tsToKin(tone, seal) {

    return ((seal * 13 + tone) % 260) + 1;
}

// ======================================
// GRID BUILDERS
// ======================================

// создаёт 20×13 матрицу kin
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

// создаёт линейный массив 260 kin
export function buildLinearKin() {

    return Array.from({ length: 260 }, (_, i) => i + 1);
}

// ======================================
// VALIDATION (очень важно)
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
// HELPERS
// ======================================

// индекс 0–259 → kin
export function indexToKin(i) {
    return i + 1;
}

// kin → индекс
export function kinToIndex(kin) {
    return kin - 1;
}
