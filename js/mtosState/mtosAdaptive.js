export const MODE_ADAPT_KEY = "mtos_mode_adaptation";
export const AUTO_MODE_FEEDBACK_KEY = "mtos_auto_mode_feedback";

function clampLocal01(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

export function clampBias(v) {
    return Math.max(-0.25, Math.min(0.25, Number(v) || 0));
}

export function loadModeAdaptation(storageKey = MODE_ADAPT_KEY) {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : null;

        if (parsed && typeof parsed === "object") {
            return {
                focusBias: Number(parsed.focusBias ?? 0),
                adjustBias: Number(parsed.adjustBias ?? 0),
                restBias: Number(parsed.restBias ?? 0),
                exploreBias: Number(parsed.exploreBias ?? 0),
                interactBias: Number(parsed.interactBias ?? 0),
                history: Array.isArray(parsed.history) ? parsed.history : []
            };
        }
    } catch (e) {
        console.warn("Mode adaptation load failed", e);
    }

    return {
        focusBias: 0,
        adjustBias: 0,
        restBias: 0,
        exploreBias: 0,
        interactBias: 0,
        history: []
    };
}

export function saveModeAdaptation(state, storageKey = MODE_ADAPT_KEY) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
        console.warn("Mode adaptation save failed", e);
    }
}

export function getAdaptiveRecommendedMode(ds = {}, deps = {}) {
    const {
        loadModeAdaptationFn = loadModeAdaptation
    } = deps;

    const adapt = loadModeAdaptationFn();
    const attractor = Number(ds.attractorField ?? 0.5);

    const scores = {
        REST:
            (Number(ds.pressure ?? 0) * 0.9) +
            ((1 - Number(ds.stability ?? 0.5)) * 0.8) +
            (Number(ds.conflict ?? 0) * 0.2) +
            adapt.restBias,

        INTERACT:
            (Number(ds.conflict ?? 0) * 0.95) +
            (Number(ds.field ?? 0.5) * 0.35) +
            (attractor * 0.15) +
            adapt.interactBias,

        FOCUS:
            (Number(ds.attention ?? 0.5) * 0.9) +
            (Number(ds.stability ?? 0.5) * 0.7) +
            (attractor * 0.45) -
            (Number(ds.pressure ?? 0) * 0.45) -
            (Number(ds.conflict ?? 0) * 0.25) +
            adapt.focusBias,

        ADJUST:
            (Number(ds.attention ?? 0.5) * 0.55) +
            (Number(ds.stability ?? 0.5) * 0.35) +
            (Number(ds.pressure ?? 0) * 0.22) +
            (Math.abs(Number(ds.field ?? 0.5) - 0.58) < 0.18 ? 0.12 : 0) +
            adapt.adjustBias,

        EXPLORE:
            (Number(ds.field ?? 0.5) * 0.7) +
            (attractor * 0.65) +
            ((1 - Math.abs(Number(ds.attention ?? 0.5) - 0.58)) * 0.25) -
            (Number(ds.pressure ?? 0) * 0.2) +
            adapt.exploreBias
    };

    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const mode = ranked[0][0];

    return {
        mode,
        scores,
        adaptation: adapt
    };
}

export function registerModeFeedback(mode, wasHelpful, ds = {}, deps = {}) {
    const {
        loadModeAdaptationFn = loadModeAdaptation,
        saveModeAdaptationFn = saveModeAdaptation,
        logEventFn = null
    } = deps;

    const adapt = loadModeAdaptationFn();
    const delta = wasHelpful ? 0.025 : -0.025;

    if (mode === "FOCUS") adapt.focusBias = clampBias(adapt.focusBias + delta);
    if (mode === "ADJUST") adapt.adjustBias = clampBias(adapt.adjustBias + delta);
    if (mode === "REST") adapt.restBias = clampBias(adapt.restBias + delta);
    if (mode === "EXPLORE") adapt.exploreBias = clampBias(adapt.exploreBias + delta);
    if (mode === "INTERACT") adapt.interactBias = clampBias(adapt.interactBias + delta);

    adapt.history.push({
        t: Date.now(),
        mode,
        wasHelpful: !!wasHelpful,
        attention: Number(ds?.attention ?? 0.5),
        activity: Number(ds?.activity ?? 0.5),
        pressure: Number(ds?.pressure ?? 0),
        conflict: Number(ds?.conflict ?? 0),
        field: Number(ds?.field ?? 0.5),
        stability: Number(ds?.stability ?? 0.5),
        attractorField: Number(ds?.attractorField ?? 0.5)
    });

    if (adapt.history.length > 300) {
        adapt.history.shift();
    }

    saveModeAdaptationFn(adapt);
    window.mtosModeAdaptation = adapt;

    if (typeof logEventFn === "function") {
        logEventFn("mode_feedback", {
            mode,
            wasHelpful: !!wasHelpful,
            focusBias: adapt.focusBias,
            adjustBias: adapt.adjustBias,
            restBias: adapt.restBias,
            exploreBias: adapt.exploreBias,
            interactBias: adapt.interactBias
        });
    }

    return adapt;
}

export function loadAutoModeFeedbackState(storageKey = AUTO_MODE_FEEDBACK_KEY) {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === "object") {
            return parsed;
        }
    } catch (e) {
        console.warn("Auto mode feedback load failed", e);
    }

    return {
        lastStamp: null,
        lastResult: null
    };
}

export function saveAutoModeFeedbackState(state, storageKey = AUTO_MODE_FEEDBACK_KEY) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
        console.warn("Auto mode feedback save failed", e);
    }
}

export function getAutoModeStamp(name, mode) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${name || "anon"}_${y}-${m}-${d}_${mode}`;
}

export function inferAutomaticModeFeedback(mode, ds = {}, metrics = {}, truth = {}) {
    const attention = Number(ds.attention ?? 0.5);
    const pressure = Number(ds.pressure ?? 0);
    const conflict = Number(ds.conflict ?? 0);
    const field = Number(ds.field ?? 0.5);
    const stability = Number(ds.stability ?? 0.5);
    const attractor = Number(ds.attractorField ?? 0.5);

    const interactions = Number(metrics.interactions ?? 0);
    const kinSelects = Number(metrics.kinSelects ?? 0);
    const timeSteps = Number(metrics.timeSteps ?? 0);

    if (mode === "FOCUS") {
        if (
            attention >= 0.52 &&
            pressure <= 0.50 &&
            stability >= 0.58 &&
            conflict <= 0.25 &&
            kinSelects <= 6 &&
            timeSteps <= 6
        ) {
            return {
                wasHelpful: true,
                reason: "focus conditions matched actual calm/stable usage"
            };
        }

        if (
            pressure >= 0.62 ||
            stability <= 0.40 ||
            truth.chaotic ||
            kinSelects >= 10
        ) {
            return {
                wasHelpful: false,
                reason: "focus was contradicted by pressure/instability/excess switching"
            };
        }

        return null;
    }

    if (mode === "ADJUST") {
        if (
            attention >= 0.56 &&
            pressure >= 0.42 &&
            pressure <= 0.68 &&
            stability >= 0.52 &&
            conflict <= 0.38 &&
            kinSelects >= 2 &&
            kinSelects <= 8
        ) {
            return {
                wasHelpful: true,
                reason: "adjust matched controlled correction under moderate pressure"
            };
        }

        if (
            pressure <= 0.28 &&
            stability >= 0.72 &&
            attention >= 0.72
        ) {
            return {
                wasHelpful: false,
                reason: "adjust was unnecessary in a clean stable focus state"
            };
        }

        if (
            pressure >= 0.78 ||
            stability <= 0.38 ||
            truth.overload
        ) {
            return {
                wasHelpful: false,
                reason: "adjust was too weak for overload or unstable collapse"
            };
        }

        return null;
    }

    if (mode === "REST") {
        if (
            pressure >= 0.58 ||
            stability <= 0.45 ||
            truth.lowActivity ||
            truth.overload
        ) {
            return {
                wasHelpful: true,
                reason: "rest matched overload or unstable recovery conditions"
            };
        }

        if (
            attention >= 0.65 &&
            pressure <= 0.35 &&
            stability >= 0.65
        ) {
            return {
                wasHelpful: false,
                reason: "rest was too passive for a stable productive state"
            };
        }

        return null;
    }

    if (mode === "EXPLORE") {
        if (
            kinSelects >= 4 ||
            timeSteps >= 4 ||
            truth.exploratory ||
            (field >= 0.58 && attractor >= 0.52)
        ) {
            return {
                wasHelpful: true,
                reason: "explore matched open search / navigation behavior"
            };
        }

        if (
            attention >= 0.72 &&
            stability >= 0.68 &&
            pressure <= 0.35
        ) {
            return {
                wasHelpful: false,
                reason: "explore was weaker than a clear focus state"
            };
        }

        return null;
    }

    if (mode === "INTERACT") {
        if (
            interactions >= 6 ||
            conflict >= 0.35
        ) {
            return {
                wasHelpful: true,
                reason: "interact matched social/conflict-driven activity"
            };
        }

        if (
            interactions <= 1 &&
            conflict <= 0.15 &&
            attention >= 0.60
        ) {
            return {
                wasHelpful: false,
                reason: "interact was unnecessary in a quiet focused state"
            };
        }

        return null;
    }

    return null;
}

export function applyAutomaticModeFeedback(name, ds = {}, metrics = {}, truth = {}, deps = {}) {
    const {
        getAdaptiveRecommendedModeFn = getAdaptiveRecommendedMode,
        inferAutomaticModeFeedbackFn = inferAutomaticModeFeedback,
        getAutoModeStampFn = getAutoModeStamp,
        loadAutoModeFeedbackStateFn = loadAutoModeFeedbackState,
        saveAutoModeFeedbackStateFn = saveAutoModeFeedbackState,
        registerModeFeedbackFn = registerModeFeedback,
        logEventFn = null
    } = deps;

    const adaptive = getAdaptiveRecommendedModeFn(ds);
    const mode = adaptive.mode;
    const inferred = inferAutomaticModeFeedbackFn(mode, ds, metrics, truth);

    if (!inferred) {
        const state = loadAutoModeFeedbackStateFn();
        const result = {
            mode,
            applied: false,
            wasHelpful: null,
            reason: "not enough evidence for automatic feedback"
        };
        state.lastResult = result;
        saveAutoModeFeedbackStateFn(state);
        window.mtosAutoModeFeedback = result;
        return result;
    }

    const stamp = getAutoModeStampFn(name, mode);
    const state = loadAutoModeFeedbackStateFn();

    if (state.lastStamp === stamp) {
        window.mtosAutoModeFeedback = state.lastResult || {
            mode,
            applied: false,
            wasHelpful: null,
            reason: "already evaluated today"
        };
        return window.mtosAutoModeFeedback;
    }

    registerModeFeedbackFn(mode, inferred.wasHelpful, ds);

    const result = {
        mode,
        applied: true,
        wasHelpful: inferred.wasHelpful,
        reason: inferred.reason
    };

    state.lastStamp = stamp;
    state.lastResult = result;
    saveAutoModeFeedbackStateFn(state);

    window.mtosAutoModeFeedback = result;

    if (typeof logEventFn === "function") {
        logEventFn("auto_mode_feedback", {
            mode,
            wasHelpful: inferred.wasHelpful,
            reason: inferred.reason
        });
    }

    return result;
}

export function getRecommendedMode(ds = {}, deps = {}) {
    const {
        getAdaptiveRecommendedModeFn = getAdaptiveRecommendedMode
    } = deps;

    const adaptive = getAdaptiveRecommendedModeFn(ds);
    window.mtosAdaptiveMode = adaptive;
    return adaptive.mode;
}

export function getModeDescription(mode) {
    if (mode === "FOCUS") return "Deep work, high efficiency, auto-adaptive mode";
    if (mode === "REST") return "Recovery, reduce load, auto-adaptive mode";
    if (mode === "EXPLORE") return "Open exploration, learning, auto-adaptive mode";
    if (mode === "INTERACT") return "Communication, social dynamics, auto-adaptive mode";
    if (mode === "ADJUST") return "Correction, recalibration, auto-adaptive mode";
    return "";
}

export function getModeActionGuide(mode) {
    if (mode === "FOCUS") {
        return {
            doText: "Deep work, key decisions, execution, coding, structured writing",
            avoidText: "Context switching, chats, multitasking, random browsing",
            riskText: "Overload if pressure starts rising during the day"
        };
    }

    if (mode === "REST") {
        return {
            doText: "Recovery, routine, sleep, food, walking, reduce stimulus",
            avoidText: "Heavy decisions, conflict, forcing concentration",
            riskText: "False guilt from trying to push against the system"
        };
    }

    if (mode === "EXPLORE") {
        return {
            doText: "Research, testing, idea generation, open exploration, prototypes",
            avoidText: "Premature final decisions, rigid plans",
            riskText: "Scattering energy across too many directions"
        };
    }

    if (mode === "INTERACT") {
        return {
            doText: "Conversations, coordination, negotiation, messaging, feedback loops",
            avoidText: "Isolation, silent frustration, solo overcontrol",
            riskText: "Escalation if conflict is already high"
        };
    }

    if (mode === "ADJUST") {
        return {
            doText: "Correct direction, retune, make one reversible change",
            avoidText: "Rigid fixation, premature closure, overcommitment",
            riskText: "Stalling if you keep adjusting without committing"
        };
    }

    return {
        doText: "",
        avoidText: "",
        riskText: ""
    };
}

export function getDecisionOutput(ds = {}, metrics = {}, deps = {}) {
    const {
        getRecommendedModeFn = getRecommendedMode
    } = deps;

    if (!ds) {
        return {
            text: "NO DATA",
            confidence: 0
        };
    }

    const mode = getRecommendedModeFn(ds);

    let action = "";
    let confidence = 0;

    const stability = Number(ds.stability ?? 0.5);
    const attention = Number(ds.attention ?? 0.5);
    const pressure = Number(ds.pressure ?? 0);
    const conflict = Number(ds.conflict ?? 0);
    const field = Number(ds.field ?? 0.5);

    if (mode === "FOCUS") {
        action = "Build / Execute core tasks";
        confidence =
            attention * 0.5 +
            stability * 0.4 -
            pressure * 0.3 -
            conflict * 0.2;
    } else if (mode === "REST") {
        action = "Recover / reduce load";
        confidence =
            pressure * 0.5 +
            (1 - stability) * 0.4 +
            conflict * 0.2;
    } else if (mode === "EXPLORE") {
        action = "Explore / test / prototype";
        confidence =
            field * 0.5 +
            (1 - Math.abs(attention - 0.55)) * 0.3 -
            pressure * 0.2;
    } else if (mode === "INTERACT") {
        action = "Communicate / resolve / align";
        confidence =
            conflict * 0.6 +
            field * 0.3 +
            pressure * 0.1;
    } else if (mode === "ADJUST") {
        action = "Adjust / correct / recalibrate";
        confidence =
            attention * 0.28 +
            stability * 0.24 +
            field * 0.16 +
            pressure * 0.08 -
            conflict * 0.10;
    }

    confidence = clampLocal01(confidence);

    return {
        text: `${mode} → ${action}`,
        confidence: Number(confidence.toFixed(2))
    };
}

export function applyFeedbackToDecision(decision = {}, name = "", dayState = {}) {

    const base = decision && typeof decision === "object"
        ? { ...decision }
        : {}

    const feedback =
        typeof window.getHumanFeedbackFor === "function"
            ? window.getHumanFeedbackFor(
                typeof window.getCurrentRunDay === "function"
                    ? window.getCurrentRunDay()
                    : "",
                name
            )
            : null

    const relationTarget =
        typeof window.getSelectedDecisionTarget === "function"
            ? window.getSelectedDecisionTarget()
            : null

    const relationFeedback =
        relationTarget && typeof window.getRelationFeedbackFor === "function"
            ? window.getRelationFeedbackFor(name, relationTarget)
            : null

    let adjusted = false
    let reason = ""

    const humanScore = Number(feedback?.score ?? feedback?.value ?? 0)
    const relationScore = Number(relationFeedback?.score ?? relationFeedback?.value ?? 0)

    // --- ЛОГИКА КОРРЕКЦИИ ---
    if (humanScore < -0.3) {
        base.mode = "REST"
        base.risk = "HIGH"
        adjusted = true
        reason = "negative human feedback override"
    }

    if (relationScore < -0.3 && base.mode === "INTERACT") {
        base.mode = "ADJUST"
        adjusted = true
        reason = "conflict relation override"
    }

    if (humanScore > 0.4 && base.mode === "REST") {
        base.mode = "EXPLORE"
        adjusted = true
        reason = "positive feedback unlock"
    }

    return {
        ...base,
        feedbackAdjusted: adjusted,
        feedbackReason: reason
    }
}