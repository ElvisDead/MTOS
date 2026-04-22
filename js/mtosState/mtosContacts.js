export const MTOS_TODAY_CONTACTS_KEY = "mtos_today_contacts_v2";
export const MTOS_CONTACT_TTL_MS = 24 * 60 * 60 * 1000;

export function getDayKeyFromParts(year, month, day) {
    const y = Number(year || 0);
    const m = String(Number(month || 0)).padStart(2, "0");
    const d = String(Number(day || 0)).padStart(2, "0");

    if (!y || m === "00" || d === "00") {
        return new Date().toISOString().slice(0, 10);
    }

    return `${y}-${m}-${d}`;
}

export function loadTodayContactsDB(storageKey = MTOS_TODAY_CONTACTS_KEY) {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        return {};
    }
}

export function saveTodayContactsDB(db, storageKey = MTOS_TODAY_CONTACTS_KEY) {
    localStorage.setItem(storageKey, JSON.stringify(db));
}

export function makePairKey(a, b) {
    return [String(a || "").trim(), String(b || "").trim()].sort().join("::");
}

export function cleanupExpiredTodayContacts(db = null, deps = {}) {
    const {
        storageKey = MTOS_TODAY_CONTACTS_KEY,
        ttlMs = MTOS_CONTACT_TTL_MS
    } = deps;

    const source = db && typeof db === "object"
        ? db
        : loadTodayContactsDB(storageKey);

    if (!window.__mtos_time) {
        window.__mtos_time = Date.now();
    }

    const now = window.__mtos_time;
    const next = {};
    let changed = false;

    Object.keys(source).forEach(dayKey => {
        const row = source[dayKey];
        if (!row || typeof row !== "object") {
            changed = true;
            return;
        }

        const cleanedRow = {};

        Object.entries(row).forEach(([pairKey, item]) => {
            const t = Number(item?.t ?? 0);

            if (!t || (now - t) > ttlMs) {
                changed = true;
                return;
            }

            cleanedRow[pairKey] = item;
        });

        if (Object.keys(cleanedRow).length > 0) {
            next[dayKey] = cleanedRow;
        } else if (Object.keys(row).length > 0) {
            changed = true;
        }
    });

    if (changed) {
        saveTodayContactsDB(next, storageKey);
    }

    return next;
}

export function findActiveTodayContactRecord(a, b, deps = {}) {
    const {
        getRelationIds = (x, y) => {
            if (typeof window.getRelationIdsFromNames === "function") {
                return window.getRelationIdsFromNames(x, y);
            }
            return {
                aId: String(x || "").trim(),
                bId: String(y || "").trim()
            };
        },
        storageKey = MTOS_TODAY_CONTACTS_KEY,
        ttlMs = MTOS_CONTACT_TTL_MS
    } = deps;

    const db = cleanupExpiredTodayContacts(null, { storageKey, ttlMs });

    const { aId, bId } = getRelationIds(a, b);
    const left = aId || String(a || "").trim();
    const right = bId || String(b || "").trim();
    const pairKey = makePairKey(left, right);

    for (const dayKey of Object.keys(db)) {
        const row = db[dayKey];
        if (row && row[pairKey]) {
            return {
                dayKey,
                item: row[pairKey]
            };
        }
    }

    return null;
}

export function loadTodayContacts(dayKey = null, deps = {}) {
    const {
        storageKey = MTOS_TODAY_CONTACTS_KEY,
        ttlMs = MTOS_CONTACT_TTL_MS
    } = deps;

    const db = cleanupExpiredTodayContacts(null, { storageKey, ttlMs });

    if (dayKey) {
        const row = db[dayKey];
        return row && typeof row === "object" ? row : {};
    }

    const merged = {};

    Object.values(db).forEach(row => {
        if (!row || typeof row !== "object") return;

        Object.entries(row).forEach(([pairKey, item]) => {
            if (!merged[pairKey] || Number(item?.t ?? 0) > Number(merged[pairKey]?.t ?? 0)) {
                merged[pairKey] = item;
            }
        });
    });

    return merged;
}

export function isTodayContact(a, b, deps = {}) {
    return !!findActiveTodayContactRecord(a, b, deps);
}

export function markTodayContact(a, b, dayKey, deps = {}) {
    const {
        getRelationIds = (x, y) => {
            if (typeof window.getRelationIdsFromNames === "function") {
                return window.getRelationIdsFromNames(x, y);
            }
            return {
                aId: String(x || "").trim(),
                bId: String(y || "").trim()
            };
        },
        getCurrentRunDay = () => {
            if (typeof window.getCurrentRunDay === "function") {
                return window.getCurrentRunDay();
            }
            return new Date().toISOString().slice(0, 10);
        },
        storageKey = MTOS_TODAY_CONTACTS_KEY,
        ttlMs = MTOS_CONTACT_TTL_MS,
        rerun = () => {
            if (typeof window.runMTOS === "function") {
                window.runMTOS();
            }
        },
        invalidateNetwork = () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        },
        registerOutcome = (payload) => {
            if (typeof window.registerMTOSOutcome === "function") {
                window.registerMTOSOutcome(payload);
            }
        }
    } = deps;

    if (!a || !b || a === b) return;

    const safeDayKey = dayKey || getCurrentRunDay();

    const { aId, bId } = getRelationIds(a, b);
    if (!aId || !bId || aId === bId) return;

    const db = cleanupExpiredTodayContacts(null, { storageKey, ttlMs });

    const existing = findActiveTodayContactRecord(aId, bId, {
        getRelationIds: (x, y) => ({ aId: x, bId: y }),
        storageKey,
        ttlMs
    });

    if (existing?.dayKey && db[existing.dayKey]) {
        delete db[existing.dayKey][makePairKey(aId, bId)];
        if (!Object.keys(db[existing.dayKey]).length) {
            delete db[existing.dayKey];
        }
    }

    if (!db[safeDayKey] || typeof db[safeDayKey] !== "object") {
        db[safeDayKey] = {};
    }

    const key = makePairKey(aId, bId);

    db[safeDayKey][key] = {
        user_a_id: aId,
        user_b_id: bId,
        t: Date.now(),
        expiresAt: Date.now() + ttlMs,
        weight: 1
    };

    saveTodayContactsDB(db, storageKey);

    registerOutcome({
        relationId: `${aId}->${bId}`,
        outcome: "good",
        value: 0.15
    });

    window._lockedCache = null;
    invalidateNetwork();
    rerun();
}

export function unmarkTodayContact(a, b, deps = {}) {
    const {
        getRelationIds = (x, y) => {
            if (typeof window.getRelationIdsFromNames === "function") {
                return window.getRelationIdsFromNames(x, y);
            }
            return {
                aId: String(x || "").trim(),
                bId: String(y || "").trim()
            };
        },
        storageKey = MTOS_TODAY_CONTACTS_KEY,
        ttlMs = MTOS_CONTACT_TTL_MS,
        rerun = () => {
            if (typeof window.runMTOS === "function") {
                window.runMTOS();
            }
        },
        invalidateNetwork = () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        }
    } = deps;

    const { aId, bId } = getRelationIds(a, b);
    const left = aId || String(a || "").trim();
    const right = bId || String(b || "").trim();

    const db = cleanupExpiredTodayContacts(null, { storageKey, ttlMs });
    const pairKey = makePairKey(left, right);
    let changed = false;

    Object.keys(db).forEach(dayKey => {
        if (db[dayKey] && db[dayKey][pairKey]) {
            delete db[dayKey][pairKey];
            changed = true;

            if (!Object.keys(db[dayKey]).length) {
                delete db[dayKey];
            }
        }
    });

    if (changed) {
        saveTodayContactsDB(db, storageKey);

        window._lockedCache = null;
        invalidateNetwork();
        rerun();
    }
}

export function buildEffectiveRelationMemory(baseMemory, dayKey, deps = {}) {
    const {
        getCurrentRunDay = () => {
            if (typeof window.getCurrentRunDay === "function") {
                return window.getCurrentRunDay();
            }
            return new Date().toISOString().slice(0, 10);
        },
        storageKey = MTOS_TODAY_CONTACTS_KEY,
        ttlMs = MTOS_CONTACT_TTL_MS
    } = deps;

    const safeDayKey = dayKey || getCurrentRunDay();
    const memory = { ...(baseMemory || {}) };
    const contacts = loadTodayContacts(safeDayKey, { storageKey, ttlMs });

    Object.values(contacts).forEach(item => {
        const a = item?.user_a_id || item?.a;
        const b = item?.user_b_id || item?.b;
        if (!a || !b) return;

        const boost = 1.75;
        const k1 = `${a}->${b}`;
        const k2 = `${b}->${a}`;

        memory[k1] = Math.max(Number(memory[k1] ?? 0), boost);
        memory[k2] = Math.max(Number(memory[k2] ?? 0), boost);
    });

    return memory;
}