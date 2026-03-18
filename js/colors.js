// colors.js

// ======================================
// BASE COLORS
// ======================================

export const COLORS = {
    background: "#0f0f0f",
    panel: "#1a1a1a",
    grid: "#222",
    axis: "#444",
    text: "#ccc",

    focus: "#00ff88",
    flow: "#00ccff",
    neutral: "#888888",
    fatigue: "#ffaa00",
    recovery: "#ff4444"
};

// ======================================
// STATE FROM VALUE
// ======================================

export function getState(value) {

    if (value > 0.72) return "FOCUS";
    if (value > 0.60) return "FLOW";
    if (value > 0.48) return "NEUTRAL";
    if (value > 0.36) return "FATIGUE";

    return "RECOVERY";
}

// ======================================
// COLOR FROM STATE
// ======================================

export function getStateColor(state) {

    switch (state) {
        case "FOCUS": return COLORS.focus;
        case "FLOW": return COLORS.flow;
        case "NEUTRAL": return COLORS.neutral;
        case "FATIGUE": return COLORS.fatigue;
        case "RECOVERY": return COLORS.recovery;
        default: return "#ffffff";
    }
}

// ======================================
// GRADIENT COLOR (0 → 1)
// ======================================

export function getColor(value) {

    value = Math.max(0, Math.min(1, value));

    // градиент: красный → оранж → серый → голубой → зелёный

    const stops = [
        { v: 0.0, c: [255, 68, 68] },    // recovery
        { v: 0.36, c: [255, 170, 0] },   // fatigue
        { v: 0.48, c: [136, 136, 136] }, // neutral
        { v: 0.60, c: [0, 204, 255] },   // flow
        { v: 0.72, c: [0, 255, 136] }    // focus
    ];

    for (let i = 0; i < stops.length - 1; i++) {

        const a = stops[i];
        const b = stops[i + 1];

        if (value >= a.v && value <= b.v) {

            const t = (value - a.v) / (b.v - a.v);

            const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * t);
            const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * t);
            const bcol = Math.round(a.c[2] + (b.c[2] - a.c[2]) * t);

            return `rgb(${r},${g},${bcol})`;
        }
    }

    // fallback
    if (value < 0.36) return COLORS.recovery;
    if (value > 0.72) return COLORS.focus;

    return COLORS.neutral;
}

// ======================================
// HEATMAP COLOR (contrast version)
// ======================================

export function getHeatColor(value) {

    value = Math.max(0, Math.min(1, value));

    const intensity = Math.floor(255 * value);

    return `rgb(${intensity}, ${intensity * 0.6}, 255)`;
}

// ======================================
// PRESSURE COLOR
// ======================================

export function getPressureColor(value) {

    value = Math.max(0, Math.min(1, value));

    const r = Math.floor(255 * value);
    const g = Math.floor(80 * (1 - value));
    const b = Math.floor(80 * (1 - value));

    return `rgb(${r},${g},${b})`;
}
