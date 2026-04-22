export const MTOS_MEMORY_KEY = "mtos_memory_layers_v1";

function safeClamp01(x) {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

function fallbackGetUserId(name) {
    if (typeof window.getUserId === "function") {
        return window.getUserId(name);
    }
    return String(name || "").trim();
}

function fallbackGetStableAnonId(name) {
    if (typeof window.getStableAnonId === "function") {
        return window.getStableAnonId(name);
    }
    return String(name || "").trim();
}

export function loadMemoryLayers(clamp01 = safeClamp01, storageKey = MTOS_MEMORY_KEY) {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : null;

        if (parsed && typeof parsed === "object") {
            return {
                sealMemory: Array.isArray(parsed.sealMemory)
                    ? parsed.sealMemory.slice(0, 20).map(v => clamp01(v))
                    : new Array(20).fill(0),

                kinMemory: Array.isArray(parsed.kinMemory)
                    ? parsed.kinMemory.slice(0, 260).map(v => clamp01(v))
                    : new Array(260).fill(0),

                userMemory: parsed.userMemory && typeof parsed.userMemory === "object"
                    ? parsed.userMemory
                    : {},

                pairMemory: parsed.pairMemory && typeof parsed.pairMemory === "object"
                    ? parsed.pairMemory
                    : {},

                dayMemory: parsed.dayMemory && typeof parsed.dayMemory === "object"
                    ? parsed.dayMemory
                    : {
                        FOCUS: 0,
                        ADJUST: 0,
                        INTERACT: 0,
                        EXPLORE: 0,
                        REST: 0
                    },

                decisionMemory: Array.isArray(parsed.decisionMemory)
                    ? parsed.decisionMemory.slice(-300)
                    : [],

                fieldMemory: Array.isArray(parsed.fieldMemory)
                    ? parsed.fieldMemory.slice(0, 260).map(v => clamp01(v))
                    : new Array(260).fill(0)
            };
        }
    } catch (e) {
        console.warn("memory load failed", e);
    }

    return {
        sealMemory: new Array(20).fill(0),
        kinMemory: new Array(260).fill(0),
        userMemory: {},
        pairMemory: {},
        dayMemory: {
            FOCUS: 0,
            ADJUST: 0,
            INTERACT: 0,
            EXPLORE: 0,
            REST: 0
        },
        decisionMemory: [],
        fieldMemory: new Array(260).fill(0)
    };
}

export function saveMemoryLayers(state, storageKey = MTOS_MEMORY_KEY) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
        console.warn("memory save failed", e);
    }
}

export function getUserMemoryEntry(userMemory, name, clamp01 = safeClamp01) {
    const entry = userMemory?.[name];

    if (entry && typeof entry === "object") {
        return {
            score: clamp01(entry.score ?? 0),
            streak: Math.max(0, Number(entry.streak ?? 0)),
            lastKin: Number(entry.lastKin ?? 0),
            lastSeal: Number(entry.lastSeal ?? 0),
            updatedAt: entry.updatedAt || null
        };
    }

    return {
        score: 0,
        streak: 0,
        lastKin: 0,
        lastSeal: 0,
        updatedAt: null
    };
}

export function updateMemoryLayers(name, userKin, dayState, weather, attractorField, deps = {}) {
    const {
        clamp01 = safeClamp01,
        loadMemoryLayersFn = loadMemoryLayers,
        saveMemoryLayersFn = saveMemoryLayers,
        getUserId = fallbackGetUserId,
        getStableAnonId = fallbackGetStableAnonId,
        getAdaptiveMode = () => window.mtosAdaptiveMode?.mode || "UNKNOWN"
    } = deps;

    const memory = loadMemoryLayersFn(clamp01);

    const kinIndex = Math.max(0, Math.min(259, Number(userKin) - 1));
    const sealIndex = ((Number(userKin) - 1) % 20 + 20) % 20;

    const ds = dayState || {};
    const w = Array.isArray(weather) ? weather[kinIndex] || {} : {};

    const attention = Number(ds.attention ?? w.attention ?? 0.5);
    const activity = Number(ds.activity ?? w.activity ?? attention);
    const pressure = Number(ds.pressure ?? w.pressure ?? 0);
    const conflict = Number(ds.conflict ?? w.conflict ?? 0);
    const stability = Number(ds.stability ?? 0.5);
    const field = Number(ds.field ?? 0.5);
    const attractor = Array.isArray(attractorField)
        ? Number(attractorField[kinIndex] ?? 0.5)
        : 0.5;

    const reinforcement =
        attention * 0.22 +
        activity * 0.18 +
        stability * 0.18 +
        field * 0.14 +
        attractor * 0.16 -
        pressure * 0.10 -
        conflict * 0.08;

    const signal = clamp01(reinforcement);
    const dayLabel = String(dayState?.dayLabel || "NEUTRAL").toUpperCase();

    const SEAL_DECAY = 0.985;
    const KIN_DECAY = 0.992;
    const USER_DECAY = 0.990;

    for (let i = 0; i < 20; i++) {
        memory.sealMemory[i] = clamp01(memory.sealMemory[i] * SEAL_DECAY);
    }

    for (let i = 0; i < 260; i++) {
        memory.kinMemory[i] = clamp01(memory.kinMemory[i] * KIN_DECAY);
    }

    const userId = getUserId(name) || name;
    const userEntry = getUserMemoryEntry(memory.userMemory, userId, clamp01);
    userEntry.score = clamp01(userEntry.score * USER_DECAY);

    const now = window.__mtos_time || Date.now();
    const lastUpdate = userEntry.updatedAt ? new Date(userEntry.updatedAt).getTime() : now;
    const hoursIdle = (now - lastUpdate) / (1000 * 60 * 60);

    if (hoursIdle > 12) {
        const decayFactor = Math.min(0.25, (hoursIdle - 12) / 48);
        userEntry.score = clamp01(userEntry.score * (1 - decayFactor));
    }

    if (hoursIdle > 48) {
        userEntry.streak = 0;
    }

    memory.sealMemory[sealIndex] = clamp01(
        memory.sealMemory[sealIndex] + signal * 0.18
    );

    memory.kinMemory[kinIndex] = clamp01(
        memory.kinMemory[kinIndex] + signal * 0.22
    );

    userEntry.score = clamp01(userEntry.score + signal * 0.24);

    if (!memory.dayMemory[dayLabel]) {
        memory.dayMemory[dayLabel] = 0;
    }
    memory.dayMemory[dayLabel] += 1;

    if (Array.isArray(attractorField) && attractorField.length === 260) {
        for (let i = 0; i < 260; i++) {
            const prev = Number(memory.fieldMemory[i] ?? 0);
            const next = Number(attractorField[i] ?? 0);
            memory.fieldMemory[i] = clamp01(prev * 0.96 + next * 0.04);
        }
    }

    const decisionMode = getAdaptiveMode();

    memory.decisionMemory.push({
        t: Date.now(),
        user_id: getStableAnonId(name),
        kin: userKin,
        dayLabel,
        decisionMode,
        attention: Number(attention.toFixed(3)),
        activity: Number(activity.toFixed(3)),
        pressure: Number(pressure.toFixed(3)),
        conflict: Number(conflict.toFixed(3)),
        stability: Number(stability.toFixed(3)),
        field: Number(field.toFixed(3)),
        attractor: Number(attractor.toFixed(3))
    });

    if (memory.decisionMemory.length > 300) {
        memory.decisionMemory.shift();
    }

    if (userEntry.lastKin === userKin) {
        userEntry.streak += 1;
    } else {
        userEntry.streak = 1;
    }

    userEntry.lastKin = userKin;
    userEntry.lastSeal = sealIndex + 1;
    userEntry.updatedAt = new Date().toISOString();

    memory.userMemory[userId] = userEntry;

    saveMemoryLayersFn(memory);
    window.mtosMemoryLayers = memory;

    return memory;
}

export function getMemoryInfluence(name, kin, deps = {}) {
    const {
        clamp01 = safeClamp01,
        loadMemoryLayersFn = loadMemoryLayers,
        getUserId = fallbackGetUserId
    } = deps;

    const memory = window.mtosMemoryLayers || loadMemoryLayersFn(clamp01);

    const kinIndex = Math.max(0, Math.min(259, Number(kin) - 1));
    const sealIndex = ((Number(kin) - 1) % 20 + 20) % 20;

    const userId = getUserId(name || "") || "";
    const userEntry = getUserMemoryEntry(memory.userMemory, userId, clamp01);

    const sealValue = Number(memory.sealMemory[sealIndex] ?? 0);
    const kinValue = Number(memory.kinMemory[kinIndex] ?? 0);
    const userValue = Number(userEntry.score ?? 0);

    return {
        seal: sealValue,
        kin: kinValue,
        user: userValue,
        total: clamp01(
            sealValue * 0.30 +
            kinValue * 0.35 +
            userValue * 0.35
        )
    };
}

export function loadDayEvolutionMemory(name = "", deps = {}) {
    const {
        getCurrentUserName = () => {
            if (typeof window.getCurrentUserName === "function") {
                return window.getCurrentUserName();
            }
            return "";
        }
    } = deps;

    const safeName = String(name || getCurrentUserName() || "").trim() || "__global__";
    const key = `mtos_day_evolution__${safeName}`;

    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;

        if (parsed && typeof parsed === "object") {
            return {
                lastLabel: typeof parsed.lastLabel === "string" ? parsed.lastLabel : "NEUTRAL",
                lastScore: Number(parsed.lastScore ?? 0),
                momentum: Number(parsed.momentum ?? 0),
                streak: Number(parsed.streak ?? 0),
                updatedAt: parsed.updatedAt || null
            };
        }
    } catch (e) {
        console.warn("day evolution memory load failed", e);
    }

    return {
        lastLabel: "NEUTRAL",
        lastScore: 0,
        momentum: 0,
        streak: 0,
        updatedAt: null
    };
}

export function saveDayEvolutionMemory(state, name = "", deps = {}) {
    const {
        getCurrentUserName = () => {
            if (typeof window.getCurrentUserName === "function") {
                return window.getCurrentUserName();
            }
            return "";
        }
    } = deps;

    const safeName = String(name || getCurrentUserName() || "").trim() || "__global__";
    const key = `mtos_day_evolution__${safeName}`;

    try {
        localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
        console.warn("day evolution memory save failed", e);
    }
}