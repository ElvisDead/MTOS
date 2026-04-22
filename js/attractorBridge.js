// MTOS/js/attractorBridge.js

(function () {
    if (!window) return;

    window.mtosAttractorState = window.mtosAttractorState || {
        type: "unknown",      // chaos | cycle | trend | stable | unknown
        intensity: 0,         // 0..1
        score: 0,             // raw score if needed
        updatedAt: null
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function safeNumber(v, fallback = 0) {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    }

    function normalizeLink(link) {
        if (!link || typeof link !== "object") return null;

        const out = { ...link };

        out.weight = safeNumber(out.weight, 0);
        out.strength = safeNumber(out.strength, out.weight);
        out.conflict = safeNumber(out.conflict, 0);
        out.support = safeNumber(out.support, 0);
        out.neutral = safeNumber(out.neutral, 0);
        out.resonance = safeNumber(out.resonance, 0);

        return out;
    }

    function setAttractorState(type, intensity = 0, score = 0) {
        const normalizedType = typeof type === "string" ? type.toLowerCase() : "unknown";

        window.mtosAttractorState = {
            type: normalizedType,
            intensity: clamp(safeNumber(intensity, 0), 0, 1),
            score: safeNumber(score, 0),
            updatedAt: new Date().toISOString()
        };

        return window.mtosAttractorState;
    }

    function applyAttractorToLinks(links, state) {
        if (!Array.isArray(links)) return [];

        const attractor = state || window.mtosAttractorState || {
            type: "unknown",
            intensity: 0
        };

        const type = attractor.type || "unknown";
        const intensity = clamp(safeNumber(attractor.intensity, 0), 0, 1);

        return links.map((rawLink) => {
            const link = normalizeLink(rawLink);
            if (!link) return rawLink;

            let weight = safeNumber(link.weight, 0);
            let strength = safeNumber(link.strength, weight);
            let conflict = safeNumber(link.conflict, 0);
            let support = safeNumber(link.support, 0);
            let resonance = safeNumber(link.resonance, 0);

            if (type === "chaos") {
                // хаос усиливает трение и слегка размывает слабые позитивные связи
                conflict += 0.25 * intensity;
                support *= (1 - 0.18 * intensity);
                weight *= (1 - 0.08 * intensity);

                if (Math.abs(weight) < 0.25) {
                    weight *= (1 - 0.25 * intensity);
                }

                resonance *= (1 - 0.12 * intensity);
            }

            else if (type === "cycle") {
                // цикл стабилизирует повторяющиеся связи и слегка усиливает резонанс
                support += 0.18 * intensity;
                resonance += 0.22 * intensity;
                weight *= (1 + 0.10 * intensity);
            }

            else if (type === "trend") {
                // тренд усиливает доминирующие связи и поляризацию
                if (Math.abs(weight) >= 0.35) {
                    weight *= (1 + 0.18 * intensity);
                    strength *= (1 + 0.15 * intensity);
                } else {
                    weight *= (1 - 0.05 * intensity);
                }

                if (weight > 0) {
                    support += 0.20 * intensity;
                } else if (weight < 0) {
                    conflict += 0.20 * intensity;
                }
            }

            else if (type === "stable") {
                // стабильность гасит экстремумы
                conflict *= (1 - 0.15 * intensity);
                support *= (1 - 0.05 * intensity);
                resonance += 0.10 * intensity;

                if (weight > 0.8) weight *= 0.97;
                if (weight < -0.8) weight *= 0.97;
            }

            link.weight = Number(weight.toFixed(4));
            link.strength = Number(strength.toFixed(4));
            link.conflict = Number(conflict.toFixed(4));
            link.support = Number(support.toFixed(4));
            link.resonance = Number(resonance.toFixed(4));

            return link;
        });
    }

    function applyAttractorToCollective(collective, state) {
        const attractor = state || window.mtosAttractorState || {
            type: "unknown",
            intensity: 0
        };

        const type = attractor.type || "unknown";
        const intensity = clamp(safeNumber(attractor.intensity, 0), 0, 1);

        const base = collective && typeof collective === "object" ? { ...collective } : {};

        base.stability = safeNumber(base.stability, 0.5);
        base.tension = safeNumber(base.tension, 0.5);
        base.coherence = safeNumber(base.coherence, 0.5);
        base.activity = safeNumber(base.activity, 0.5);
        base.resonance = safeNumber(base.resonance, 0.5);

        if (type === "chaos") {
            base.tension = clamp(base.tension + 0.25 * intensity, 0, 1);
            base.stability = clamp(base.stability - 0.22 * intensity, 0, 1);
            base.coherence = clamp(base.coherence - 0.18 * intensity, 0, 1);
            base.activity = clamp(base.activity + 0.10 * intensity, 0, 1);
        }

        else if (type === "cycle") {
            base.coherence = clamp(base.coherence + 0.18 * intensity, 0, 1);
            base.resonance = clamp(base.resonance + 0.20 * intensity, 0, 1);
            base.stability = clamp(base.stability + 0.12 * intensity, 0, 1);
        }

        else if (type === "trend") {
            base.activity = clamp(base.activity + 0.20 * intensity, 0, 1);
            base.coherence = clamp(base.coherence + 0.08 * intensity, 0, 1);
            base.tension = clamp(base.tension + 0.12 * intensity, 0, 1);
        }

        else if (type === "stable") {
            base.stability = clamp(base.stability + 0.18 * intensity, 0, 1);
            base.tension = clamp(base.tension - 0.15 * intensity, 0, 1);
            base.coherence = clamp(base.coherence + 0.15 * intensity, 0, 1);
        }

        base.attractorType = type;
        base.attractorIntensity = intensity;

        return base;
    }

    function applyCollectiveToAttractorState(state, collective) {
    const baseState = state && typeof state === "object"
        ? { ...state }
        : {
            type: "unknown",
            intensity: 0,
            score: 0
        };

    const c = collective && typeof collective === "object" ? collective : {};

    const supportRatio = clamp(safeNumber(c.supportRatio, 0), 0, 1);
    const conflictRatio = clamp(safeNumber(c.conflictRatio, 0), 0, 1);
    const temperature = clamp(safeNumber(c.temperature, 0.5), 0, 1);
    const coherence = clamp(safeNumber(c.coherence, 0.5), 0, 1);
    const tension = clamp(safeNumber(c.tension, 0.5), 0, 1);
    const stability = clamp(safeNumber(c.stability, 0.5), 0, 1);
    const resonance = clamp(safeNumber(c.resonance, 0.5), 0, 1);

    let nextType = String(baseState.type || "unknown").toLowerCase();
    let nextIntensity = clamp(safeNumber(baseState.intensity, 0), 0, 1);
    let nextScore = safeNumber(baseState.score, 0);

    const collectivePush =
        conflictRatio * 0.28 +
        tension * 0.22 +
        Math.max(0, temperature - 0.5) * 0.20 -
        supportRatio * 0.18 -
        coherence * 0.14 -
        stability * 0.12 +
        resonance * 0.04;

    nextIntensity = clamp(nextIntensity + collectivePush, 0, 1);
    nextScore = Number((nextScore + collectivePush * 0.5).toFixed(4));

    if (conflictRatio >= 0.52 || tension >= 0.68 || temperature >= 0.78) {
        nextType = "chaos";
    }
    else if (supportRatio >= 0.55 && coherence >= 0.58 && resonance >= 0.55) {
        nextType = "cycle";
    }
    else if (supportRatio >= 0.42 && stability >= 0.58 && conflictRatio <= 0.22) {
        nextType = "stable";
    }
    else if (Math.abs(supportRatio - conflictRatio) >= 0.18 || temperature >= 0.62) {
        nextType = "trend";
    }

    return {
        ...baseState,
        type: nextType,
        intensity: Number(nextIntensity.toFixed(4)),
        score: nextScore
    };
}

    function syncAttractorWithSystem(payload) {
        const result = payload && typeof payload === "object" ? payload : {};

        const collective = result.collective && typeof result.collective === "object"
    ? result.collective
    : (window.mtosCollective || window.mtosCollectiveState || {});

const collectiveAdjustedState = applyCollectiveToAttractorState({
    type: result.type || "unknown",
    intensity: result.intensity || 0,
    score: result.score || 0
}, collective);

const state = setAttractorState(
    collectiveAdjustedState.type,
    collectiveAdjustedState.intensity,
    collectiveAdjustedState.score
);

        const networkLinks = Array.isArray(result.networkLinks)
            ? result.networkLinks
            : (Array.isArray(window.mtosNetworkLinks) ? window.mtosNetworkLinks : []);

        const collectiveForSync = collective;

        const updatedLinks = applyAttractorToLinks(networkLinks, state);
        const updatedCollective = applyAttractorToCollective(collectiveForSync, state);

        window.mtosNetworkLinks = updatedLinks;
        window.mtosCollective = updatedCollective;

        return {
            attractor: state,
            networkLinks: updatedLinks,
            collective: updatedCollective
        };
    }

    window.MTOSBridge = {
    clamp,
    safeNumber,
    setAttractorState,
    applyAttractorToLinks,
    applyAttractorToCollective,
    applyCollectiveToAttractorState,
    syncAttractorWithSystem
};
})();