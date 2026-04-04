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

function trimUsers(users) {
    if (!Array.isArray(users)) return [];

    return users
        .slice(0, NETWORK_HISTORY_MAX_USERS)
        .map((u) => ({
            name: String(u?.name || ""),
            kin: safeNum(u?.kin, 0),
            baseKin: safeNum(u?.baseKin ?? u?.kin, 0),
            weight: safeNum(u?.weight, 1),
            goal: String(u?.goal || ""),
            goalWeight: safeNum(u?.goalWeight, 0),
            goalScore: safeNum(u?.goalScore, 0),
            goalFeedback: String(u?.goalFeedback || ""),
            phase: safeNum(u?.phase, 0),
            location: String(u?.location || ""),
            city: String(u?.city || ""),
            country: String(u?.country || "")
        }));
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