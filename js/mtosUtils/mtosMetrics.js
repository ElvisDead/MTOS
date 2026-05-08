import { clampMetric } from "./mtosMath.js";

export function interpretMetric(name, value) {
    if (value > 0.75) return "high";
    if (value < 0.3) return "low";
    return "moderate";
}

export function buildUnifiedMetrics(result, dayState) {
    const ds = dayState || {};
    const r = result || {};

    const attention = clampMetric(ds.attention ?? r.attention ?? 0.5, 0, 1);

    const noise = clampMetric(
        (Number(ds.conflict ?? 0) * 0.65) +
        (Number(ds.pressure ?? 0) * 0.35),
        0,
        1
    );

    const entropy = clampMetric(
        (
            Number(ds.pressure ?? 0) * 0.9 +
            Number(ds.conflict ?? 0) * 0.9 +
            (1 - Number(ds.stability ?? 0.5)) * 1.2
        ),
        0,
        1
    ) * 3.0;

    const lyapunov = Number(
        (
            Number(ds.stability ?? 0.5) -
            Number(ds.pressure ?? 0) * 0.8 -
            Number(ds.conflict ?? 0) * 0.6
        ).toFixed(3)
    );

    const prediction = clampMetric(
        Number(ds.stability ?? 0.5) * 0.5 +
        Number(ds.attention ?? 0.5) * 0.35 +
        Number(ds.field ?? 0.5) * 0.15 -
        Number(ds.pressure ?? 0) * 0.2 -
        Number(ds.conflict ?? 0) * 0.1,
        0,
        1
    );

    const predictability = Math.round(
        5 + 255 * clampMetric(
            Number(ds.stability ?? 0.5) * 0.55 +
            Number(ds.attention ?? 0.5) * 0.20 +
            Number(ds.field ?? 0.5) * 0.15 -
            Number(ds.pressure ?? 0) * 0.10 -
            Number(ds.conflict ?? 0) * 0.10,
            0,
            1
        )
    );

    return {
        attention,
        noise,
        entropy,
        lyapunov,
        prediction,
        predictability
    };
}

export function buildMetabolicMetrics(result, ds, deps = {}) {
    const {
        getUserKin = () => Number(window._userKin || result?.kin || 1)
    } = deps;

    const userKin = Number(getUserKin());
    const idx = Math.max(0, Math.min(259, userKin - 1));

    const pressureSeries = Array.isArray(result?.metabolic_pressure) ? result.metabolic_pressure : [];
    const temperatureSeries = Array.isArray(result?.metabolic_temperature) ? result.metabolic_temperature : [];
    const phiSeries = Array.isArray(result?.metabolic_phi) ? result.metabolic_phi : [];
    const kSeries = Array.isArray(result?.metabolic_k) ? result.metabolic_k : [];
    const consistencySeries = Array.isArray(result?.metabolic_consistency) ? result.metabolic_consistency : [];
    const stabilitySeries = Array.isArray(result?.metabolic_stability) ? result.metabolic_stability : [];

    const safe = (arr, fallback = 0) => {
        const v = Number(arr?.[idx]);
        return Number.isFinite(v) ? v : fallback;
    };

    const P = safe(pressureSeries, Number(ds?.pressure ?? 0));
    const V = Math.max(0, Math.min(1, Number(ds?.attention ?? result?.attention ?? 0.5)));
    const T = safe(temperatureSeries, 0.5);
    const phi = safe(phiSeries, P * V);
    const k = safe(kSeries, phi / Math.max(T, 1e-6));
    const consistency = safe(consistencySeries, Math.abs(phi - k * T));
    const stability = safe(stabilitySeries, Number(ds?.stability ?? 0.5));

    return {
        P: Number(result?.mean_pressure ?? ds?.pressure ?? 0.5),
        V: Number(ds?.attention ?? 0.5),
        T: Number(result?.mean_temperature ?? 0.5),
        phi: Number(result?.mean_phi ?? 0),
        k: Number(result?.mean_k ?? 0),
        consistency: Number(result?.mean_consistency ?? 0),
        stability: Number(stability ?? ds?.stability ?? 0.5),

        phiSeries: Array.isArray(result?.metabolic_phi)
            ? result.metabolic_phi.map(Number)
            : [],

        temperatureSeries: Array.isArray(result?.metabolic_temperature)
            ? result.metabolic_temperature.map(Number)
            : [],

        consistencySeries: Array.isArray(result?.metabolic_consistency)
            ? result.metabolic_consistency.map(Number)
            : []
    };
}