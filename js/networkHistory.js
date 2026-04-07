export const saveNetworkHistory = saveNetworkState

const NETWORK_HISTORY_KEY = "mtos_network_history";
const NETWORK_HISTORY_MAX_ITEMS = 40;
const NETWORK_HISTORY_MAX_USERS = 120;
const NETWORK_HISTORY_MAX_MEMORY_KEYS = 240;
const NETWORK_HISTORY_MAX_CHARS = 180000;

function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function getSafeAnonId(name) {
    const clean = String(name || "").trim()
    if (!clean) return null

    if (typeof window.getAnonIdForExport === "function") {
        return window.getAnonIdForExport(clean)
    }

    try {
        const raw = localStorage.getItem("mtos_export_anon_map_v1")
        const map = raw ? JSON.parse(raw) : {}
        if (map && map[clean]) return map[clean]

        const used = new Set(Object.values(map || {}))
        let i = 1
        let nextId = ""

        while (true) {
            nextId = `u${String(i).padStart(3, "0")}`
            if (!used.has(nextId)) break
            i++
        }

        const nextMap = { ...(map || {}), [clean]: nextId }
        localStorage.setItem("mtos_export_anon_map_v1", JSON.stringify(nextMap))
        return nextId
    } catch (e) {
        return null
    }
}

function trimUsers(users) {
    if (!Array.isArray(users)) return []

    return users
        .slice(0, NETWORK_HISTORY_MAX_USERS)
        .map((u) => ({
            user_id: getSafeAnonId(u?.name || ""),
            kin: safeNum(u?.kin, 0),
            baseKin: safeNum(u?.baseKin ?? u?.kin, 0),
            weight: safeNum(u?.weight, 1),
            goal: String(u?.goal || ""),
            goalWeight: safeNum(u?.goalWeight, 0),
            goalScore: safeNum(u?.goalScore, 0),
            goalFeedback: String(u?.goalFeedback || ""),
            phase: safeNum(u?.phase, 0)
        }))
}

function trimMemory(memory) {
    if (!memory || typeof memory !== "object") return {};

    const entries = Object.entries(memory)
        .filter(([key, value]) => {
            if (!key) return false;
            const n = Number(value);
            return Number.isFinite(n) && Math.abs(n) > 0.0001;
        })
        .sort((a, b) => Math.abs(Number(b[1])) - Math.abs(Number(a[1])))
        .slice(0, NETWORK_HISTORY_MAX_MEMORY_KEYS)
        .map(([key, value]) => [key, Number(Number(value).toFixed(4))]);

    return Object.fromEntries(entries);
}

export function loadNetworkHistory() {
    try {
        const raw = localStorage.getItem(NETWORK_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveHistoryWithFallback(history) {
    let next = Array.isArray(history) ? history.slice() : [];

    while (next.length) {
        try {
            const json = JSON.stringify(next);
            if (json.length > NETWORK_HISTORY_MAX_CHARS) {
                next.shift();
                continue;
            }
            localStorage.setItem(NETWORK_HISTORY_KEY, json);
            return true;
        } catch (e) {
            next.shift();
        }
    }

    try {
        localStorage.removeItem(NETWORK_HISTORY_KEY);
    } catch (e) {}

    return false;
}

export function saveNetworkState(users, memory) {
    const history = loadNetworkHistory();

    const row = {
        t: Date.now(),
        users: trimUsers(users),
        memory: trimMemory(memory)
    };

    history.push(row);

    const trimmed = history.slice(-NETWORK_HISTORY_MAX_ITEMS);
    saveHistoryWithFallback(trimmed);
}

export function loadLastNetworkState() {
    const history = loadNetworkHistory();
    return history.length ? history[history.length - 1] : null;
}

export function clearNetworkHistory() {
    try {
        localStorage.removeItem(NETWORK_HISTORY_KEY);
    } catch (e) {}
}