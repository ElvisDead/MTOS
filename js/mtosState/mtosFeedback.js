export const MTOS_AUTO_FEEDBACK_KEY = "mtos_auto_feedback_v1";
export const MTOS_RELATION_FEEDBACK_KEY = "mtos_relation_feedback_v1";
export const MTOS_FEEDBACK_ACK_KEY = "mtos_feedback_ack_v1";

export function loadHumanFeedback(storageKey = MTOS_AUTO_FEEDBACK_KEY) {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        return {};
    }
}

export function saveHumanFeedback(state, storageKey = MTOS_AUTO_FEEDBACK_KEY) {
    localStorage.setItem(storageKey, JSON.stringify(state || {}));
}

export function getHumanFeedbackFor(day, name, deps = {}) {
    const {
        storageKey = MTOS_AUTO_FEEDBACK_KEY,
        getAnonId = (value) => {
            if (typeof window.getStableAnonId === "function") {
                return window.getStableAnonId(value);
            }
            return String(value || "").trim();
        }
    } = deps;

    const db = loadHumanFeedback(storageKey);
    const userId = getAnonId(name) || String(name || "").trim();
    return db[`${day}__${userId}`] || null;
}

export function setHumanFeedbackFor(day, name, value, deps = {}) {
    const {
        storageKey = MTOS_AUTO_FEEDBACK_KEY,
        getAnonId = (v) => (typeof window.getStableAnonId === "function" ? window.getStableAnonId(v) : String(v || "").trim()),
        computeFeedbackStateSignature = (ds) => ds || {},
        enrichSnapshotsWithFeedbackContext = () => {},
        getDayState = () => window.mtosDayState || {},
        getDecision = () => window.mtosDecision || {},
        getAttractorState = () => window.mtosAttractorState || {},
        getTimePressureSummary = () => window.mtosTimePressureSummary || {},
        getUserKin = () => Number(window._userKin || 0),
        getTodayKin = () => Number(window._todayKin || 0)
    } = deps;

    if (!day || !name) return null;

    const userId = getAnonId(name);
    if (!userId) return null;

    const allowed = ["good", "neutral", "bad"];
    const safeValue = allowed.includes(String(value).toLowerCase())
        ? String(value).toLowerCase()
        : "neutral";

    const db = loadHumanFeedback(storageKey);
    const key = `${day}__${userId}`;

    const ds = getDayState() || {};
    const decision = getDecision() || {};
    const attractor = getAttractorState() || {};
    const tp = getTimePressureSummary() || {};

    db[key] = {
        ...(db[key] || {}),
        day,
        user_id: userId,
        value: safeValue,
        t: Date.now(),

        userKin: Number(getUserKin() || 0),
        todayKin: Number(getTodayKin() || 0),

        label: String(ds.dayLabel || "UNKNOWN"),
        mode: String(decision.mode || "UNKNOWN"),

        attention: Math.pow(Number(ds.attention ?? 0.5), 1.5),
        activity: Number(ds.activity ?? 0.5),
        pressure: Math.pow(Number(ds.pressure ?? 0), 1.5),
        conflict: Math.pow(Number(ds.conflict ?? 0), 1.5),
        field: Math.pow(Number(ds.field ?? 0.5), 1.5),
        stability: Number(ds.stability ?? 0.5),

        attractorType: String(attractor.type || "unknown"),
        attractorIntensity: Number(attractor.intensity ?? 0),

        temporalMode: String(tp.temporalMode || "EXPLORE"),
        timePressure: Number(tp.value ?? 0),

        auto: false,

        ...computeFeedbackStateSignature(ds)
    };

    saveHumanFeedback(db, storageKey);
    enrichSnapshotsWithFeedbackContext();

    return db[key];
}

export function loadRelationFeedback(storageKey = MTOS_RELATION_FEEDBACK_KEY) {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        return {};
    }
}

export function saveRelationFeedback(state, storageKey = MTOS_RELATION_FEEDBACK_KEY) {
    localStorage.setItem(storageKey, JSON.stringify(state || {}));
}

export function getRelationFeedbackKey(day, a, b, deps = {}) {
    const {
        getRelationIds = (x, y) => {
            if (typeof window.getRelationIdsFromNames === "function") {
                return window.getRelationIdsFromNames(x, y);
            }
            return {
                aId: String(x || "").trim(),
                bId: String(y || "").trim()
            };
        }
    } = deps;

    const { aId, bId } = getRelationIds(a, b);
    const left = aId || String(a || "").trim();
    const right = bId || String(b || "").trim();

    if (!day || !left || !right) return "";
    return `${day}__${[left, right].sort().join("::")}`;
}

export function setRelationFeedbackFor(day, a, b, value, deps = {}) {
    const {
        storageKey = MTOS_RELATION_FEEDBACK_KEY,
        ackKey = MTOS_FEEDBACK_ACK_KEY,
        getAnonId = (v) => (typeof window.getStableAnonId === "function" ? window.getStableAnonId(v) : String(v || "").trim()),
        getRelationFeedbackKeyFn = getRelationFeedbackKey
    } = deps;

    const safeValue = ["good", "neutral", "bad"].includes(String(value).toLowerCase())
        ? String(value).toLowerCase()
        : "neutral";

    const aId = getAnonId(a);
    const bId = getAnonId(b);
    if (!aId || !bId) return null;

    const key = getRelationFeedbackKeyFn(day, aId, bId, {
        getRelationIds: (x, y) => ({ aId: x, bId: y })
    });
    if (!key) return null;

    const db = loadRelationFeedback(storageKey);

    db[key] = {
        day,
        user_a_id: aId,
        user_b_id: bId,
        value: safeValue,
        t: Date.now()
    };

    saveRelationFeedback(db, storageKey);

    try {
        localStorage.setItem(ackKey, JSON.stringify({
            t: Date.now(),
            value: safeValue,
            user_a_id: aId,
            user_b_id: bId
        }));
    } catch (e) {}

    return db[key];
}

export function getRelationFeedbackFor(day, a, b, deps = {}) {
    const {
        storageKey = MTOS_RELATION_FEEDBACK_KEY,
        getRelationFeedbackKeyFn = getRelationFeedbackKey
    } = deps;

    const key = getRelationFeedbackKeyFn(day, a, b, deps);
    if (!key) return null;

    const db = loadRelationFeedback(storageKey);
    return db[key] || null;
}

export function getRelationFeedbackScalar(day, a, b, deps = {}) {
    const row = getRelationFeedbackFor(day, a, b, deps);
    if (!row) return 0;

    if (row.value === "good") return 0.22;
    if (row.value === "bad") return -0.22;
    return 0;
}

export function getFeedbackAck(ackKey = MTOS_FEEDBACK_ACK_KEY) {
    try {
        const raw = localStorage.getItem(ackKey);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
        return null;
    }
}

export function registerMTOSOutcome(payload = {}, deps = {}) {
    const {
        getCurrentRunDay = () => {
            if (typeof window.getCurrentRunDay === "function") {
                return window.getCurrentRunDay();
            }
            return new Date().toISOString().slice(0, 10);
        },
        getCurrentUserName = () => {
            if (typeof window.getCurrentUserName === "function") {
                return window.getCurrentUserName();
            }
            return "";
        },
        setHumanFeedbackForFn = setHumanFeedbackFor,
        safeLogEvent = (type, body) => {
            if (typeof window.safeLogEvent === "function") {
                window.safeLogEvent(type, body);
            }
        },
        rerenderDecision = () => {
            if (typeof window._rerenderDecisionOnly === "function") {
                window._rerenderDecisionOnly();
            } else if (typeof window.renderDecisionSummaryPanel === "function") {
                window.renderDecisionSummaryPanel("humanLayer");
            }
        }
    } = deps;

    const day = getCurrentRunDay();
const name = getCurrentUserName();

if (!day || !name) return;

const outcome = String(payload.outcome || "neutral").toLowerCase();

setHumanFeedbackForFn(day, name, outcome);

const userId =
    typeof window.getStableAnonId === "function"
        ? window.getStableAnonId(name)
        : String(name || "").trim();

safeLogEvent("mtos_outcome_feedback", {
    day,
    user_id: userId,
    outcome,
    relationId: String(payload.relationId || ""),
    value: Number(payload.value ?? 0)
});

    rerenderDecision();
}