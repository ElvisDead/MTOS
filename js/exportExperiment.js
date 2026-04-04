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
            runtimeFieldMode: safeClone(window.fieldMode || window.fieldMode, null),
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
            rawLogBackup: safeParseLS("mtos_log", [])
        }
    }
}

export function exportLog() {
    try {
        const payload = collectRuntimeState()

        const blob = new Blob(
            [JSON.stringify(payload, null, 2)],
            { type: "application/json" }
        )

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url

        const date = new Date().toISOString().slice(0, 10)
        const name =
            payload?.input?.name
                ? String(payload.input.name).replace(/[^a-zA-Z0-9_-]+/g, "_")
                : "anon"

        a.download = `mtos_export_${name}_${date}.json`

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)

        console.log("MTOS export:", payload)
        return payload
    } catch (err) {
        console.error("Export error:", err)
        return null
    }
}

export function getExportPayload() {
    return collectRuntimeState()
}