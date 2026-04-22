export function clamp01(x) {
    return Math.max(0, Math.min(1, Number(x)));
}

export function safeText(value, fallback = "unknown") {
    if (value === null || value === undefined) return fallback;
    const s = String(value).trim();
    return s ? s : fallback;
}

export function safeNum(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function wrapPhaseDelta(a, b) {
    const TAU = Math.PI * 2;
    let d = Math.abs(Number(a || 0) - Number(b || 0)) % TAU;
    if (d > Math.PI) d = TAU - d;
    return d;
}

export function phaseAlignmentScore(a, b) {
    return Math.cos(wrapPhaseDelta(a, b));
}

export function phaseLinkMod(a, b) {
    const align = phaseAlignmentScore(a, b);

    return {
        delta: wrapPhaseDelta(a, b),
        align,
        supportBoost: Math.max(0, align),
        conflictBoost: Math.max(0, -align)
    };
}

export function clampMetric(v, min = 0, max = 1) {
    const n = Number(v);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
}