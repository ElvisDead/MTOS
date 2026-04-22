export function getStableAnonId(name) {
    const clean = String(name || "").trim();
    if (!clean) return null;

    if (typeof window.getAnonIdForExport === "function") {
        return window.getAnonIdForExport(clean);
    }

    try {
        const raw = localStorage.getItem("mtos_export_anon_map_v1");
        const map = raw ? JSON.parse(raw) : {};

        if (map && map[clean]) return map[clean];

        const used = new Set(Object.values(map || {}));
        let i = 1;
        let nextId = "";

        while (true) {
            nextId = `u${String(i).padStart(3, "0")}`;
            if (!used.has(nextId)) break;
            i++;
        }

        const nextMap = { ...(map || {}), [clean]: nextId };
        localStorage.setItem("mtos_export_anon_map_v1", JSON.stringify(nextMap));
        return nextId;
    } catch (e) {
        return null;
    }
}

export function getIdentityMap() {
    try {
        const raw = localStorage.getItem("mtos_export_anon_map_v1");
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        return {};
    }
}

export function getUserId(name) {
    return getStableAnonId(name);
}

export function getUserNameById(userId) {
    const cleanId = String(userId || "").trim();
    if (!cleanId) return "";

    const map = getIdentityMap();

    for (const [name, id] of Object.entries(map)) {
        if (String(id) === cleanId) return String(name);
    }

    return "";
}

export function getRelationIdsFromNames(a, b) {
    const aId = getUserId(a);
    const bId = getUserId(b);

    return {
        aId,
        bId,
        pairKey: (aId && bId) ? [aId, bId].sort().join("::") : ""
    };
}

export function findUserById(users, userId) {
    const cleanId = String(userId || "").trim();
    if (!cleanId || !Array.isArray(users)) return null;

    return users.find(u => getUserId(u?.name) === cleanId) || null;
}

export function findUserByNameOrId(users, value) {
    const clean = String(value || "").trim();
    if (!clean || !Array.isArray(users)) return null;

    if (/^u\d{3,}$/.test(clean)) {
        return findUserById(users, clean);
    }

    return users.find(u => String(u?.name || "").trim() === clean) || null;
}

export function sanitizeLogUsers(list) {
    if (!Array.isArray(list)) return [];

    return list.map(u => ({
        user_id: getStableAnonId(u?.name || u?.user_id || ""),
        kin: Number(u?.kin ?? 0) || 0,
        baseKin: Number(u?.baseKin ?? u?.kin ?? 0) || 0,
        weight: Number(u?.weight ?? 1) || 1,
        goal: String(u?.goal || ""),
        goalWeight: Number(u?.goalWeight ?? 0) || 0,
        goalScore: Number(u?.goalScore ?? 0) || 0,
        goalFeedback: String(u?.goalFeedback || ""),
        phase: Number(u?.phase ?? 0) || 0
    }));
}

export function sanitizeLogRelationId(relationId) {
    const raw = String(relationId || "").trim();
    if (!raw) return "";

    if (raw.includes("->")) {
        const [a, b] = raw.split("->");
        const aId = getUserId(a) || a;
        const bId = getUserId(b) || b;
        return `${aId}->${bId}`;
    }

    return getStableAnonId(raw) || raw;
}

export function safeLogEvent(type, payload = {}) {
    const clean = { ...(payload || {}) };

    delete clean.name;
    delete clean.year;
    delete clean.month;
    delete clean.day;
    delete clean.birth;
    delete clean.birthdate;
    delete clean.birthday;
    delete clean.location;
    delete clean.city;
    delete clean.country;

    if (payload?.name) {
        clean.user_id = getUserId(payload.name);
    }

    if (Array.isArray(payload?.users)) {
        clean.users = sanitizeLogUsers(payload.users);
    }

    if (payload?.relationId) {
        clean.relationId = sanitizeLogRelationId(payload.relationId);
    }

    if (typeof window.logEvent === "function") {
        window.logEvent(type, clean);
    }
}

export function sanitizeStoredUserList(list) {
    if (!Array.isArray(list)) return [];
    return list
        .map(x => getStableAnonId(x))
        .filter(Boolean);
}

export function sanitizeTodayContactsDB(db) {
    if (!db || typeof db !== "object") return {};

    const out = {};

    Object.entries(db).forEach(([dayKey, row]) => {
        if (!row || typeof row !== "object") return;

        out[dayKey] = {};

        Object.values(row).forEach(item => {
            if (!item || typeof item !== "object") return;

            const aId = getStableAnonId(item.a || item.user_a_id);
            const bId = getStableAnonId(item.b || item.user_b_id);
            if (!aId || !bId) return;

            const pairKey = [aId, bId].sort().join("::");

            out[dayKey][pairKey] = {
                user_a_id: aId,
                user_b_id: bId,
                t: Number(item.t ?? 0),
                expiresAt: Number(item.expiresAt ?? 0),
                weight: Number(item.weight ?? 1)
            };
        });

        if (!Object.keys(out[dayKey]).length) {
            delete out[dayKey];
        }
    });

    return out;
}

export function sanitizeHumanFeedbackDB(db) {
    if (!db || typeof db !== "object") return {};

    const out = {};

    Object.values(db).forEach(item => {
        if (!item || typeof item !== "object") return;

        const userId = getStableAnonId(item.name || item.user_id);
        if (!userId) return;

        const day = String(item.day || "session_day");
        const key = `${day}__${userId}`;

        out[key] = {
            ...item,
            day,
            user_id: userId
        };

        delete out[key].name;
    });

    return out;
}

export function sanitizeRelationFeedbackDB(db) {
    if (!db || typeof db !== "object") return {};

    const out = {};

    Object.values(db).forEach(item => {
        if (!item || typeof item !== "object") return;

        const aId = getStableAnonId(item.a || item.user_a_id);
        const bId = getStableAnonId(item.b || item.user_b_id);
        if (!aId || !bId) return;

        const day = String(item.day || "session_day");
        const key = `${day}__${[aId, bId].sort().join("::")}`;

        out[key] = {
            ...item,
            day,
            user_a_id: aId,
            user_b_id: bId
        };

        delete out[key].a;
        delete out[key].b;
        delete out[key].name;
    });

    return out;
}

export function sanitizeDailySnapshots(rows) {
    if (!Array.isArray(rows)) return [];

    return rows.map(row => {
        if (!row || typeof row !== "object") return row;

        const userId = getStableAnonId(row.name || row.user_id);

        const clean = {
            ...row,
            user_id: userId || null
        };

        delete clean.name;
        return clean;
    });
}

export function sanitizeMemoryLayers(state) {
    if (!state || typeof state !== "object") return state;

    const next = { ...state };

    if (next.userMemory && typeof next.userMemory === "object") {
        const safeUserMemory = {};

        Object.entries(next.userMemory).forEach(([name, value]) => {
            const userId = getStableAnonId(name);
            if (userId) {
                safeUserMemory[userId] = value;
            }
        });

        next.userMemory = safeUserMemory;
    }

    return next;
}

export function migratePrivacyStorage(keys = {}) {
    const {
        todayContactsKey = "mtos_today_contacts_v2",
        autoFeedbackKey = "mtos_auto_feedback_v1",
        relationFeedbackKey = "mtos_relation_feedback_v1",
        memoryKey = "mtos_memory_layers_v1"
    } = keys;

    try {
        const rawUserList = JSON.parse(localStorage.getItem("mtos_user_list") || "[]");
        // localStorage.setItem("mtos_user_list", JSON.stringify(sanitizeStoredUserList(rawUserList)));
        void rawUserList;
    } catch (e) {}

    try {
        const rawContacts = JSON.parse(localStorage.getItem(todayContactsKey) || "{}");
        localStorage.setItem(todayContactsKey, JSON.stringify(sanitizeTodayContactsDB(rawContacts)));
    } catch (e) {}

    try {
        const rawHumanFeedback = JSON.parse(localStorage.getItem(autoFeedbackKey) || "{}");
        localStorage.setItem(autoFeedbackKey, JSON.stringify(sanitizeHumanFeedbackDB(rawHumanFeedback)));
    } catch (e) {}

    try {
        const rawRelationFeedback = JSON.parse(localStorage.getItem(relationFeedbackKey) || "{}");
        localStorage.setItem(relationFeedbackKey, JSON.stringify(sanitizeRelationFeedbackDB(rawRelationFeedback)));
    } catch (e) {}

    try {
        const rawSnapshots = JSON.parse(localStorage.getItem("mtos_daily_snapshots") || "[]");
        localStorage.setItem("mtos_daily_snapshots", JSON.stringify(sanitizeDailySnapshots(rawSnapshots)));
    } catch (e) {}

    try {
        const rawMemoryLayers = JSON.parse(localStorage.getItem(memoryKey) || "null");
        if (rawMemoryLayers && typeof rawMemoryLayers === "object") {
            localStorage.setItem(memoryKey, JSON.stringify(sanitizeMemoryLayers(rawMemoryLayers)));
        }
    } catch (e) {}

    try {
        localStorage.removeItem("mtos_network_history");
    } catch (e) {}
}

window.getUserId = getUserId;
window.getUserNameById = getUserNameById;
window.findUserById = findUserById;
window.findUserByNameOrId = findUserByNameOrId;