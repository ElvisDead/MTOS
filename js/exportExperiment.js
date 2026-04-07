// exportExperiment.js

function safeParseLS(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : fallback
    } catch (err) {
        console.warn(`Failed to parse localStorage key: ${key}`, err)
        return fallback
    }
}

function safeClone(value, fallback = null) {
    try {
        if (value === undefined) return fallback
        return JSON.parse(JSON.stringify(value))
    } catch (err) {
        console.warn("Failed to clone value", err)
        return fallback
    }
}

const MTOS_EXPORT_ANON_MAP_KEY = "mtos_export_anon_map_v1"

function loadAnonMap() {
    try {
        const raw = localStorage.getItem(MTOS_EXPORT_ANON_MAP_KEY)
        const parsed = raw ? JSON.parse(raw) : {}
        return parsed && typeof parsed === "object" ? parsed : {}
    } catch (err) {
        console.warn("Failed to load anon map", err)
        return {}
    }
}

function saveAnonMap(map) {
    try {
        localStorage.setItem(MTOS_EXPORT_ANON_MAP_KEY, JSON.stringify(map))
    } catch (err) {
        console.warn("Failed to save anon map", err)
    }
}

function getAnonId(name) {
    const clean = String(name || "").trim()
    if (!clean) return null

    const map = loadAnonMap()

    if (map[clean]) return map[clean]

    const used = new Set(Object.values(map))
    let i = 1
    let nextId = ""

    while (true) {
        nextId = `u${String(i).padStart(3, "0")}`
        if (!used.has(nextId)) break
        i++
    }

    map[clean] = nextId
    saveAnonMap(map)
    return nextId
}

window.getAnonIdForExport = getAnonId

function anonymizeFreeText(value) {
    if (typeof value !== "string") return value
    return "[redacted]"
}

function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value)
}

function isDateLikeString(value) {
    if (typeof value !== "string") return false
    return (
        /^\d{4}-\d{2}-\d{2}$/.test(value) ||
        /^\d{4}-\d{2}-\d{2}T/.test(value)
    )
}

function maybeAnonId(value) {
    if (typeof value !== "string") return value

    const clean = value.trim()
    if (!clean) return value

    if (/^u\d{3,}$/.test(clean)) return clean
    if (isDateLikeString(clean)) return clean

    return getAnonId(clean)
}

function anonymizeCompositeRuntimeKey(key) {
    const clean = String(key || "").trim()
    if (!clean) return clean

    const parts = clean.split("_")
    const first = parts[0] || ""

    const anon = getAnonId(first) || "u000"
    return `${anon}_session`
}

function anonymizeRelationId(id) {
    const clean = String(id || "").trim()
    if (!clean) return clean

    if (clean.includes("->")) {
        const [a, b] = clean.split("->")
        return `${getAnonId(a)}->${getAnonId(b)}`
    }

    if (clean.includes("::")) {
        const [a, b] = clean.split("::")
        return `${getAnonId(a)}::${getAnonId(b)}`
    }

    const anon = maybeAnonId(clean)

if (typeof anon === "string" && /^u\d{3,}$/.test(anon)) {
    return `evt_${anon}`
}

return anon
}

function anonymizeUserObject(user) {
    if (!user || typeof user !== "object") return user

    const anonId = getAnonId(user.name || user.user_id || user.id)

    return {
        user_id: anonId,
        kin: Number(user.kin ?? user.baseKin ?? 0) || null,
        baseKin: Number(user.baseKin ?? user.kin ?? 0) || null,
        goal: user.goal ?? null,
        goalWeight: Number(user.goalWeight ?? 0) || null,
        goalScore: Number(user.goalScore ?? 0) || null,
        goalFeedback: user.goalFeedback ?? null,
        weight: Number(user.weight ?? 0) || null,
        phase: Number(user.phase ?? 0) || null
    }
}

function anonymizeRelationObject(rel) {
    if (!rel || typeof rel !== "object") return rel

    const sourceName =
        rel.source ??
        rel.from ??
        rel.a ??
        rel.sourceName ??
        rel.user_a ??
        rel.userA ??
        ""

    const targetName =
        rel.target ??
        rel.to ??
        rel.b ??
        rel.targetName ??
        rel.user_b ??
        rel.userB ??
        ""

    const clean = { ...rel }

    delete clean.source
    delete clean.target
    delete clean.from
    delete clean.to
    delete clean.a
    delete clean.b
    delete clean.sourceName
    delete clean.targetName
    delete clean.name
    delete clean.user
    delete clean.userName
    delete clean.targetUser
    delete clean.contactName

    clean.source_id = maybeAnonId(sourceName)
    clean.target_id = maybeAnonId(targetName)

    if ("id" in clean) {
        clean.id = anonymizeRelationId(clean.id)
    }

    return clean
}

function anonymizeFeedbackMap(obj) {
    if (!obj || typeof obj !== "object") return {}

    const out = {}

    for (const value of Object.values(obj)) {
        if (!value || typeof value !== "object") continue

        const anonId = getAnonId(value.name || value.user_id)
        const safeDay = "session_day"
        const anonKey = `${safeDay}__${anonId || "u000"}`

        out[anonKey] = {
            ...value,
            day: safeDay,
            user_id: anonId
        }

        delete out[anonKey].name
    }

    return out
}

function anonymizeRelationFeedbackMap(obj) {
    if (!obj || typeof obj !== "object") return {}

    const out = {}

    for (const value of Object.values(obj)) {
        if (!value || typeof value !== "object") continue

        const aId = getAnonId(value.a || value.user_a_id)
        const bId = getAnonId(value.b || value.user_b_id)
        const anonKey = `${value.day || "unknown"}__${[aId, bId].filter(Boolean).sort().join("::")}`

        out[anonKey] = {
            ...value,
            user_a_id: aId,
            user_b_id: bId
        }

        delete out[anonKey].a
        delete out[anonKey].b
        delete out[anonKey].name
    }

    return out
}

function anonymizeTodayContacts(obj) {
    if (!obj || typeof obj !== "object") return {}

    const out = {}

    for (const [dayKey, row] of Object.entries(obj)) {
        if (!row || typeof row !== "object") continue

        out[dayKey] = {}

        for (const item of Object.values(row)) {
            if (!item || typeof item !== "object") continue

            const aId = getAnonId(item.a || item.user_a_id)
            const bId = getAnonId(item.b || item.user_b_id)
            const pairKey = [aId, bId].filter(Boolean).sort().join("::")

            out[dayKey][pairKey] = {
                user_a_id: aId,
                user_b_id: bId,
                t: Number(item.t ?? 0) || 0,
                expiresAt: Number(item.expiresAt ?? 0) || 0,
                weight: Number(item.weight ?? 0) || 0
            }
        }
    }

    return out
}

function anonymizeRelationMemory(obj) {
    if (!obj || typeof obj !== "object") return {}

    const out = {}

    for (const [key, value] of Object.entries(obj)) {
        const textKey = String(key)

        if (textKey.includes("->")) {
            const parts = textKey.split("->")
            if (parts.length === 2) {
                const aId = getAnonId(parts[0])
                const bId = getAnonId(parts[1])
                out[`${aId}->${bId}`] = value
            }
            continue
        }

        if (textKey.includes("::")) {
            const parts = textKey.split("::")
            if (parts.length === 2) {
                const aId = getAnonId(parts[0])
                const bId = getAnonId(parts[1])
                out[`${aId}::${bId}`] = value
            }
            continue
        }

        out[textKey] = value
    }

    return out
}

function anonymizeUserMemory(obj) {
    if (!obj || typeof obj !== "object") return {}

    const out = {}

    for (const [key, value] of Object.entries(obj)) {
        out[getAnonId(key)] = value
    }

    return out
}

function anonymizeSnapshots(rows) {
    if (!Array.isArray(rows)) return []

    return rows.map(row => {
        if (!row || typeof row !== "object") return row

        const anonId = getAnonId(row.name || row.user_id)

        const clean = {
            ...row,
            user_id: anonId
        }

        delete clean.name
        return clean
    })
}

function anonymizeRunCache(obj) {
    if (!obj || typeof obj !== "object") return {}

    const out = {}

    for (const [key, value] of Object.entries(obj)) {
        const anonKey = anonymizeCompositeRuntimeKey(key)
        out[anonKey] = anonymizeDeep(value, "mtosRunCacheEntry")
    }

    return out
}

function anonymizeLogs(rows) {
    if (!Array.isArray(rows)) return []
    return rows.map(row => anonymizeDeep(row))
}

function anonymizeDeep(value, keyName = "") {
    if (value === null || value === undefined) return value

    if (Array.isArray(value)) {
        return value.map(item => anonymizeDeep(item, keyName))
    }

    if (!isPlainObject(value)) {
        if (typeof value === "string") {
            const lowerKey = String(keyName || "").toLowerCase()

            if (
                lowerKey.includes("note") ||
                lowerKey.includes("comment") ||
                lowerKey.includes("text") ||
                lowerKey.includes("reason") ||
                lowerKey.includes("description")
            ) {
                return anonymizeFreeText(value)
            }

            return value
        }

        return value
    }

    if (
        ("source" in value || "target" in value || "a" in value || "b" in value) &&
        ("score" in value || "label" in value || "type" in value || "strength" in value)
    ) {
        return anonymizeRelationObject(value)
    }

    if ("name" in value && ("kin" in value || "baseKin" in value || "goal" in value || "phase" in value)) {
        return anonymizeUserObject(value)
    }

    const out = {}

    for (const [k, v] of Object.entries(value)) {
        const lowerKey = String(k).toLowerCase()

        if (
            lowerKey === "name" ||
            lowerKey === "birth" ||
            lowerKey === "birthdate" ||
            lowerKey === "birthday" ||
            lowerKey === "dateofbirth" ||
            lowerKey === "location" ||
            lowerKey === "city" ||
            lowerKey === "country" ||
            lowerKey === "source" ||
            lowerKey === "target" ||
            lowerKey === "from" ||
            lowerKey === "to" ||
            lowerKey === "a" ||
            lowerKey === "b" ||
            lowerKey === "sourceName".toLowerCase() ||
            lowerKey === "targetName".toLowerCase()
        ) {
            continue
        }

        if (lowerKey === "currentrunday") {
            continue
        }

        if (
    (lowerKey === "year" || lowerKey === "month" || lowerKey === "day") &&
    value &&
    typeof value === "object" &&
    value.type === "run_start"
) {
    continue
}

        if (lowerKey === "date" && isPlainObject(v)) {
            continue
        }

        if (lowerKey === "selectedtarget" && isPlainObject(v)) {
            const anonTarget = anonymizeDeep(v, k)
            if (isPlainObject(anonTarget) && v.name) {
                anonTarget.user_id = getAnonId(v.name)
            }
            out[k] = anonTarget
            continue
        }

        if (lowerKey === "currentusers" && Array.isArray(v)) {
            out[k] = v.map(anonymizeUserObject)
            continue
        }

        if (lowerKey === "currentnetworkrelations" && Array.isArray(v)) {
            out[k] = v.map(anonymizeRelationObject)
            continue
        }

        if (lowerKey === "userlist" && Array.isArray(v)) {
            out[k] = v.map(name => getAnonId(name))
            continue
        }

        if (lowerKey === "humanfeedback" && isPlainObject(v)) {
            out[k] = anonymizeFeedbackMap(v)
            continue
        }

        if (lowerKey === "relationfeedback" && isPlainObject(v)) {
            out[k] = anonymizeRelationFeedbackMap(v)
            continue
        }

        if (lowerKey === "todaycontacts" && isPlainObject(v)) {
            out[k] = anonymizeTodayContacts(v)
            continue
        }

        if (
    (lowerKey === "relationmemory" ||
     lowerKey === "lockedrelations" ||
     lowerKey === "pairmemory" ||
     lowerKey === "memory") &&
    isPlainObject(v)
) {
    out[k] = anonymizeRelationMemory(v)
    continue
}

        if (lowerKey === "usermemory" && isPlainObject(v)) {
            out[k] = anonymizeUserMemory(v)
            continue
        }

        if (lowerKey === "memorylayers" && isPlainObject(v)) {
            const cloned = anonymizeDeep(v, k)
            if (isPlainObject(cloned)) {
                if (isPlainObject(v.pairMemory)) cloned.pairMemory = anonymizeRelationMemory(v.pairMemory)
                if (isPlainObject(v.userMemory)) cloned.userMemory = anonymizeUserMemory(v.userMemory)
            }
            out[k] = cloned
            continue
        }

        if (lowerKey === "mtosruncache" && isPlainObject(v)) {
            out[k] = anonymizeRunCache(v)
            continue
        }

        if (lowerKey === "mtosruncachekeys" && Array.isArray(v)) {
            out[k] = v.map(anonymizeCompositeRuntimeKey)
            continue
        }

        if (lowerKey === "dailysnapshots" && Array.isArray(v)) {
            out[k] = anonymizeSnapshots(v)
            continue
        }

        if (lowerKey === "mtoslog" && Array.isArray(v)) {
            out[k] = anonymizeLogs(v)
            continue
        }

        if (lowerKey === "rawlogbackup" && Array.isArray(v)) {
            out[k] = anonymizeLogs(v)
            continue
        }

        if (lowerKey === "id" && typeof v === "string") {
            out[k] = anonymizeRelationId(v)
            continue
        }

        if (lowerKey === "laststamp" && typeof v === "string") {
    const parts = String(v).split("_")
    if (parts.length >= 3) {
        const originalName = parts[0]
        const rest = parts.slice(1).join("_")
        out[k] = `${getAnonId(originalName)}_${rest}`
    } else {
        out[k] = maybeAnonId(v)
    }
    continue
}

        if (typeof v === "string") {
    if (
        lowerKey === "user_id" ||
        lowerKey === "userid" ||
        lowerKey === "user" ||
        lowerKey === "username" ||
        lowerKey === "selectedtarget" ||
        lowerKey === "selectedagent"
    ) {
        out[k] = maybeAnonId(v)
        continue
    }

            if (
                lowerKey.includes("note") ||
                lowerKey.includes("comment") ||
                lowerKey.includes("text") ||
                lowerKey.includes("description")
            ) {
                out[k] = anonymizeFreeText(v)
                continue
            }

            if (isDateLikeString(v) && (
                lowerKey.includes("birth") ||
                lowerKey.includes("dob")
            )) {
                continue
            }

            out[k] = v
            continue
        }

        out[k] = anonymizeDeep(v, k)
    }

    if ("name" in value && !("user_id" in out)) {
        out.user_id = getAnonId(value.name)
    }

    if ("source" in value && !("source_id" in out)) {
        out.source_id = getAnonId(value.source)
    }

    if ("target" in value && !("target_id" in out)) {
        out.target_id = getAnonId(value.target)
    }

    if ("a" in value && !("user_a_id" in out)) {
        out.user_a_id = getAnonId(value.a)
    }

    if ("b" in value && !("user_b_id" in out)) {
        out.user_b_id = getAnonId(value.b)
    }

    if ("userName" in value && !("user_id" in out)) {
        out.user_id = getAnonId(value.userName)
    }

    if ("targetName" in value && !("target_id" in out)) {
        out.target_id = getAnonId(value.targetName)
    }

    if ("id" in value && !("id" in out) && typeof value.id === "string") {
        out.id = anonymizeRelationId(value.id)
    }

    return out

}

function anonymizePayload(payload) {
    const clone = safeClone(payload, {})

    if (!clone || typeof clone !== "object") return {}

    const inputName = clone?.input?.name || ""
    const inputAnonId = getAnonId(inputName)

    const cleaned = anonymizeDeep(clone)

    if (!cleaned.input || typeof cleaned.input !== "object") {
        cleaned.input = {}
    }

    cleaned.input.user_id = inputAnonId
    delete cleaned.input.name
    delete cleaned.input.date
    delete cleaned.input.currentRunDay

    cleaned.anonymized = true
    cleaned.anonymization = {
        namesRemoved: true,
        birthDatesRemoved: true,
        inputDateRemoved: true,
        runtimeDateRemoved: true,
        stablePseudoIds: true,
        stateTreeSanitized: true,
        relationsSanitized: true,
        cacheKeysSanitized: true
    }

    return cleaned
}

function collectRuntimeState() {
    const currentDecisionState = window.MTOS_STATE?.decision || null
    const currentNetworkState = window.MTOS_STATE?.network || null
    const currentCollectiveState = window.MTOS_STATE?.collective || null
    const currentWeatherState = window.MTOS_STATE?.weather || null
    const currentEventsState = window.MTOS_STATE?.events || []

    return {
        appVersion: "mtos-new-ui",
        exportedAt: new Date().toISOString(),

        input: {
            name: typeof window.getCurrentUserName === "function"
                ? window.getCurrentUserName()
                : (document.getElementById("name")?.value?.trim() || ""),

            date: safeClone(window._date || null, null),
            userKin: Number(window._userKin ?? 0) || null,
            todayKin: Number(window._todayKin ?? 0) || null,
            currentRunDay: typeof window.getCurrentRunDay === "function"
                ? window.getCurrentRunDay()
                : null
        },

        stateTree: {
            root: safeClone(window.MTOS_STATE || {}, {}),
            decision: safeClone(currentDecisionState, null),
            events: safeClone(currentEventsState, []),
            weather: safeClone(currentWeatherState, null),
            network: safeClone(currentNetworkState, null),
            collective: safeClone(currentCollectiveState, null)
        },

        decisionLayer: {
            mtosDecision: safeClone(window.mtosDecision || null, null),
            selectedTarget: safeClone(currentDecisionState?.selectedTarget || null, null),
            targets: safeClone(currentDecisionState?.targets || null, null),
            feedbackLearning: safeClone(window.mtosDecision?.feedbackLearning || null, null),
            feedbackAdjusted: Boolean(window.mtosDecision?.feedbackAdjusted || false),
            feedbackReason: String(window.mtosDecision?.feedbackReason || "")
        },

        dayState: {
            mtosDayState: safeClone(window.mtosDayState || null, null),
            mtosDaySync: safeClone(window.mtosDaySync || null, null),
            mtosUnifiedMetrics: safeClone(window.mtosUnifiedMetrics || null, null),
            mtosMetabolicMetrics: safeClone(window.mtosMetabolicMetrics || null, null),
            mtosTimePressure: safeClone(window.mtosTimePressure || null, null),
            mtosTimePressureSummary: safeClone(window.mtosTimePressureSummary || null, null),
            mtosAttractorState: safeClone(window.mtosAttractorState || null, null),
            mtosForecastStats: safeClone(window.mtosForecastStats || null, null),
            mtosLearningState: safeClone(window.mtosLearningState || null, null),
            mtosLearningSignal: safeClone(window.mtosLearningSignal || null, null),
            mtosAutoModeFeedback: safeClone(window.mtosAutoModeFeedback || null, null),
            mtosAutoFeedbackRow: safeClone(window.mtosAutoFeedbackRow || null, null)
        },

        userMeta: {
            mtosUserMeta: safeClone(window.mtosUserMeta || null, null),
            mtosTodayMeta: safeClone(window.mtosTodayMeta || null, null),
            currentUsers: safeClone(window.currentUsers || [], []),
            selectedKin: safeClone(window.selectedKin || null, null),
            selectedAgent: safeClone(window.selectedAgent || null, null)
        },

        fieldAndNetwork: {
            weather260: safeClone(window._weather || [], []),
            weatherToday: safeClone(window._weatherToday || [], []),
            pressureMap: safeClone(window._pressure || [], []),
            attractorField: safeClone(window._attractorField || [], []),
            phaseField: safeClone(window._phaseField || [], []),
            resonanceField: safeClone(window._resonanceField || [], []),
            interferenceField: safeClone(window._interferenceField || [], []),
            matrix: safeClone(window._matrix || null, null),
            currentNetworkRelations: safeClone(window.currentNetworkRelations || [], []),
            mtosNetworkFeedback: safeClone(window.mtosNetworkFeedback || null, null),
            mtosCollectiveState: safeClone(window.mtosCollectiveState || null, null),
            mtosSystemState: safeClone(window.mtosSystemState || null, null),
            todaySealInfluence: safeClone(window._todaySealInfluence || null, null),
            archetypePolarity: safeClone(window.mtosArchetypePolarity || null, null)
        },

        replayAndCache: {
            mtosRunCacheKeys: Object.keys(window._mtosRunCache || {}),
            mtosRunCache: safeClone(window._mtosRunCache || {}, {}),
            fieldState: safeClone(window.fieldState || null, null),
            fieldMode: safeClone(window.fieldMode || null, null),
            runtimeFieldMode: safeClone(window.fieldMode || null, null),
            runtimeFieldViewMode: safeClone(window.fieldViewMode || null, null),
            networkMode: safeClone(window.networkMode || null, null),
            networkRelationFilter: safeClone(window.networkRelationFilter || "all", "all")
        },

        logs: {
            mtosLog: safeClone(window.MTOS_LOG || [], []),
            logSize: Array.isArray(window.MTOS_LOG) ? window.MTOS_LOG.length : 0
        },

        localStorageState: {
            dailySnapshots: safeParseLS("mtos_daily_snapshots", []),
            memoryLayers: safeParseLS("mtos_memory_layers_v1", null),
            humanFeedback: safeParseLS("mtos_auto_feedback_v1", {}),
            relationFeedback: safeParseLS("mtos_relation_feedback_v1", {}),
            feedbackAck: safeParseLS("mtos_feedback_ack_v1", null),
            todayContacts: safeParseLS("mtos_today_contacts_v2", {}),
            userList: safeParseLS("mtos_user_list", []),
            relationMemory: safeParseLS("collective_relations_memory", {}),
            lockedRelations: safeParseLS("mtos_locked_relations", {}),
            networkHistory: safeParseLS("mtos_network_history", []),
            dayEvolution: safeParseLS("mtos_day_evolution", null),
            modeAdaptation: safeParseLS("mtos_mode_adaptation", null),
            autoModeFeedbackState: safeParseLS("mtos_auto_mode_feedback", null),
            selectedTarget: localStorage.getItem("mtos_selected_target_v1") || "",
            rawLogBackup: []
        }
    }
}

export function exportLog() {
    try {
        const rawPayload = collectRuntimeState()
        const payload = anonymizePayload(rawPayload)

        const blob = new Blob(
            [JSON.stringify(payload, null, 2)],
            { type: "application/json" }
        )

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url

        const date = new Date().toISOString().slice(0, 10)
        const anonId = payload?.input?.user_id || "anon"

        a.download = `mtos_export_${anonId}_${date}.json`

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)

        console.log("MTOS anonymized export:", payload)
        return payload
    } catch (err) {
        console.error("Export error:", err)
        return null
    }
}

export function getExportPayload() {
    return anonymizePayload(collectRuntimeState())
}