// tzolkin.js

// ======================================
// CONSTANTS (SYNC WITH PYTHON)
// ======================================

const BASE_DATE = new Date(Date.UTC(1987, 6, 26)); // July = 6
const BASE_KIN = 34;

const SEALS = [
    "Dragon","Wind","Night","Seed","Serpent",
    "Worldbridger","Hand","Star","Moon","Dog",
    "Monkey","Human","Skywalker","Wizard","Eagle",
    "Warrior","Earth","Mirror","Storm","Sun"
];

// ======================================
// DATE → KIN
// ======================================

export function kinFromDate(date) {

    const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    const deltaDays = Math.floor(
        (utcDate - BASE_DATE) / (1000 * 60 * 60 * 24)
    );

    const kin = ((BASE_KIN + deltaDays - 1) % 260 + 260) % 260 + 1;

    const tone = ((kin - 1) % 13) + 1;
    const sealIndex = (kin - 1) % 20;

    return {
        kin,
        tone,
        seal: SEALS[sealIndex],
        sealIndex
    };
}

// ======================================
// TODAY
// ======================================

export function getTodayKin() {

    const now = new Date();

    return kinFromDate(now);
}

// ======================================
// HELPERS
// ======================================

// kin → tone (1–13)
export function kinToTone(kin) {
    return ((kin - 1) % 13) + 1;
}

// kin → seal index (0–19)
export function kinToSeal(kin) {
    return (kin - 1) % 20;
}

// kin → seal name
export function kinToSealName(kin) {
    return SEALS[kinToSeal(kin)];
}

// ======================================
// RANGE
// ======================================

// массив kin по дням
export function kinSequence(startDate, days) {

    const result = [];

    for (let i = 0; i < days; i++) {

        const d = new Date(startDate);
        d.setUTCDate(d.getUTCDate() + i);

        result.push(kinFromDate(d));
    }

    return result;
}
