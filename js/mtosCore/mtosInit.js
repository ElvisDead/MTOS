export async function createMTOSInitializer(ctx = {}) {
    const {
        loadPyodide,
        loadEngineCode,

        applyMTOSLang,
        loadMTOSLang,
        migratePrivacyStorage,
        setStatusText,

        MTOS_TODAY_CONTACTS_KEY,
        MTOS_AUTO_FEEDBACK_KEY,
        MTOS_RELATION_FEEDBACK_KEY,
        MTOS_MEMORY_KEY,

        loadMTOSViewMode,
        applyMTOSViewMode,
        exportLog,

        removeUser,
        removeConnection,
        removeConnectionHard,
        addConnection,
        markTodayContact,
        unmarkTodayContact,
        isTodayContact,
        loadTodayContacts,
        cleanupExpiredTodayContacts,

        setHumanFeedbackFor,
        getHumanFeedbackFor,
        setRelationFeedbackFor,
        getRelationFeedbackFor,
        getRelationFeedbackScalar,
        getFeedbackAck,
        registerMTOSOutcome,

        loadMemoryLayers,
        saveMemoryLayers,
        getUserMemoryEntry,
        updateMemoryLayers,
        getMemoryInfluence,
        loadDayEvolutionMemory,
        saveDayEvolutionMemory,

        loadModeAdaptation,
        saveModeAdaptation,
        getAdaptiveRecommendedMode,
        registerModeFeedback,
        loadAutoModeFeedbackState,
        saveAutoModeFeedbackState,
        applyAutomaticModeFeedback,
        getRecommendedMode,
        getModeDescription,
        getModeActionGuide,
        getDecisionOutput,

        getSelectedDecisionTarget,
        setSelectedDecisionTarget,
        resolveDecisionTargetsLocal,

        renderFieldTensionPanel,
        renderDecisionTargetsPanel,
        renderActionTracePanel,
        renderSystemEventsPanel,
        renderSystemDecisionPanel,
        renderHistoryEfficiencyPanel,

        loadAttractorMode,
        ensureAttractorToggle,

        replayPlay,
        replayPause,
        replayStep,
        replaySeek,
        initReplay,

        runMTOS,

        historyStack,
        loadUsers,
        saveUsers,

        getRelationIdsFromNames,
        getCurrentRunDay,
        getCurrentUserName,

        MTOS_CONTACT_TTL_MS,
        MTOS_FEEDBACK_ACK_KEY,
        MODE_ADAPT_KEY,
        AUTO_MODE_FEEDBACK_KEY,
        MTOS_SELECTED_TARGET_KEY,

        clamp01,
        getStableAnonId,
        getUserId,

        computeFeedbackStateSignature,
        enrichSnapshotsWithFeedbackContext,

        safeLogEvent,
        logEvent,
        t,
        translateModeLabel,
        translateRelationLabel,
        translateRiskLabel,
        renderSystemDecisionMetrics,
        calcModeStats,
        renderDecisionSummaryPanel,
        renderAll,
        renderCognitiveState,

        getHumanFeedbackForFn = null
    } = ctx;

    const pyodide = await loadPyodide();
    await pyodide.loadPackage("numpy");

    const code = await loadEngineCode("./MTOS_Engine.py");
    pyodide.runPython(code);

    applyMTOSLang(loadMTOSLang());

    migratePrivacyStorage({
        todayContactsKey: MTOS_TODAY_CONTACTS_KEY,
        autoFeedbackKey: MTOS_AUTO_FEEDBACK_KEY,
        relationFeedbackKey: MTOS_RELATION_FEEDBACK_KEY,
        memoryKey: MTOS_MEMORY_KEY
    });

    setStatusText("ready");

    window.mtosViewMode = loadMTOSViewMode();
    applyMTOSViewMode(window.mtosViewMode);

    window.exportLog = exportLog;
    window.fieldMode = "hybrid";
    window.fieldViewMode = "grid";

    window._logListener = (entry) => {
        const el = document.getElementById("logStream");
        if (!el) return;

        const row = document.createElement("div");
        row.textContent =
            new Date(entry.t).toLocaleTimeString() +
            " | " +
            entry.type +
            " | " +
            JSON.stringify(entry);

        el.prepend(row);

        if (el.children.length > 200) {
            el.removeChild(el.lastChild);
        }
    };

    window.removeUser = (name) => removeUser(name, {
        historyStack,
        loadUsersFn: loadUsers,
        saveUsersFn: saveUsers,
        rerun: runMTOS
    });

    window.removeConnection = (a, b) => removeConnection(a, b, {
        historyStack,
        rerun: runMTOS,
        invalidateNetwork: () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        }
    });

    window.removeConnectionHard = (a, b) => removeConnectionHard(a, b, {
        historyStack,
        rerun: runMTOS,
        invalidateNetwork: () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        }
    });

    window.addConnection = (a, b, value = 1) => addConnection(a, b, value, {
        rerun: runMTOS,
        invalidateNetwork: () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        }
    });

    window.markTodayContact = (a, b, dayKey = getCurrentRunDay()) => markTodayContact(a, b, dayKey, {
        getRelationIds: getRelationIdsFromNames,
        getCurrentRunDay,
        storageKey: MTOS_TODAY_CONTACTS_KEY,
        ttlMs: MTOS_CONTACT_TTL_MS,
        rerun: runMTOS,
        invalidateNetwork: () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        },
        registerOutcome: (payload) => {
            if (typeof window.registerMTOSOutcome === "function") {
                window.registerMTOSOutcome(payload);
            }
        }
    });

    window.unmarkTodayContact = (a, b) => unmarkTodayContact(a, b, {
        getRelationIds: getRelationIdsFromNames,
        storageKey: MTOS_TODAY_CONTACTS_KEY,
        ttlMs: MTOS_CONTACT_TTL_MS,
        rerun: runMTOS,
        invalidateNetwork: () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        }
    });

    window.isTodayContact = (a, b) => isTodayContact(a, b, {
        getRelationIds: getRelationIdsFromNames,
        storageKey: MTOS_TODAY_CONTACTS_KEY,
        ttlMs: MTOS_CONTACT_TTL_MS
    });

    window.loadTodayContacts = (dayKey = null) => loadTodayContacts(dayKey, {
        storageKey: MTOS_TODAY_CONTACTS_KEY,
        ttlMs: MTOS_CONTACT_TTL_MS
    });

    window.cleanupExpiredTodayContacts = () => cleanupExpiredTodayContacts(null, {
        storageKey: MTOS_TODAY_CONTACTS_KEY,
        ttlMs: MTOS_CONTACT_TTL_MS
    });

    window.setHumanFeedbackFor = (day, name, value) => setHumanFeedbackFor(day, name, value, {
        storageKey: MTOS_AUTO_FEEDBACK_KEY,
        getAnonId: getStableAnonId,
        computeFeedbackStateSignature,
        enrichSnapshotsWithFeedbackContext,
        getDayState: () => window.mtosDayState || {},
        getDecision: () => window.mtosDecision || {},
        getAttractorState: () => window.mtosAttractorState || {},
        getTimePressureSummary: () => window.mtosTimePressureSummary || {},
        getUserKin: () => Number(window._userKin || 0),
        getTodayKin: () => Number(window._todayKin || 0)
    });

    window.getHumanFeedbackFor = (day, name) => getHumanFeedbackFor(day, name, {
        storageKey: MTOS_AUTO_FEEDBACK_KEY,
        getAnonId: getStableAnonId
    });

    window.setRelationFeedbackFor = (day, a, b, value) => setRelationFeedbackFor(day, a, b, value, {
        storageKey: MTOS_RELATION_FEEDBACK_KEY,
        ackKey: MTOS_FEEDBACK_ACK_KEY,
        getAnonId: getStableAnonId,
        getRelationFeedbackKeyFn: ctx.getRelationFeedbackKey
    });

    window.getRelationFeedbackFor = (day, a, b) => getRelationFeedbackFor(day, a, b, {
        storageKey: MTOS_RELATION_FEEDBACK_KEY,
        getRelationFeedbackKeyFn: ctx.getRelationFeedbackKey,
        getRelationIds: getRelationIdsFromNames
    });

    window.getRelationFeedbackScalar = (day, a, b) => getRelationFeedbackScalar(day, a, b, {
        storageKey: MTOS_RELATION_FEEDBACK_KEY,
        getRelationFeedbackKeyFn: ctx.getRelationFeedbackKey,
        getRelationIds: getRelationIdsFromNames
    });

    window.getFeedbackAck = () => getFeedbackAck(MTOS_FEEDBACK_ACK_KEY);

    window.registerMTOSOutcome = (payload = {}) => registerMTOSOutcome(payload, {
        getCurrentRunDay,
        getCurrentUserName,
        setHumanFeedbackForFn: (day, name, value) => setHumanFeedbackFor(day, name, value, {
            storageKey: MTOS_AUTO_FEEDBACK_KEY,
            getAnonId: getStableAnonId,
            computeFeedbackStateSignature,
            enrichSnapshotsWithFeedbackContext,
            getDayState: () => window.mtosDayState || {},
            getDecision: () => window.mtosDecision || {},
            getAttractorState: () => window.mtosAttractorState || {},
            getTimePressureSummary: () => window.mtosTimePressureSummary || {},
            getUserKin: () => Number(window._userKin || 0),
            getTodayKin: () => Number(window._todayKin || 0)
        }),
        safeLogEvent,
        rerenderDecision: () => {
            if (typeof window._rerenderDecisionOnly === "function") {
                window._rerenderDecisionOnly();
            } else {
                renderDecisionSummaryPanel("humanLayer");
            }
        }
    });

    window.loadMemoryLayers = () => loadMemoryLayers(clamp01, MTOS_MEMORY_KEY);
    window.saveMemoryLayers = (state) => saveMemoryLayers(state, MTOS_MEMORY_KEY);
    window.getUserMemoryEntry = (userMemory, name) => getUserMemoryEntry(userMemory, name, clamp01);

    window.updateMemoryLayers = (name, userKin, dayState, weather, attractorField) => updateMemoryLayers(
        name,
        userKin,
        dayState,
        weather,
        attractorField,
        {
            clamp01,
            loadMemoryLayersFn: (clamp) => loadMemoryLayers(clamp, MTOS_MEMORY_KEY),
            saveMemoryLayersFn: (state) => saveMemoryLayers(state, MTOS_MEMORY_KEY),
            getUserId,
            getStableAnonId,
            getAdaptiveMode: () => window.mtosAdaptiveMode?.mode || "UNKNOWN"
        }
    );

    window.getMemoryInfluence = (name, kin) => getMemoryInfluence(name, kin, {
        clamp01,
        loadMemoryLayersFn: (clamp) => loadMemoryLayers(clamp, MTOS_MEMORY_KEY),
        getUserId
    });

    window.loadDayEvolutionMemory = (name = getCurrentUserName()) => loadDayEvolutionMemory(name, {
        getCurrentUserName
    });

    window.saveDayEvolutionMemory = (state, name = getCurrentUserName()) => saveDayEvolutionMemory(state, name, {
        getCurrentUserName
    });

    window.loadModeAdaptation = () => loadModeAdaptation(MODE_ADAPT_KEY);
    window.saveModeAdaptation = (state) => saveModeAdaptation(state, MODE_ADAPT_KEY);

    window.getAdaptiveRecommendedMode = (ds) => getAdaptiveRecommendedMode(ds, {
        loadModeAdaptationFn: () => loadModeAdaptation(MODE_ADAPT_KEY)
    });

    window.registerModeFeedback = (wasHelpful) => {
        const ds = window.mtosDayState || null;
        const adaptive = window.mtosAdaptiveMode || null;
        const mode = adaptive?.mode || getRecommendedMode(ds || {}, {
            getAdaptiveRecommendedModeFn: (safeDs) => getAdaptiveRecommendedMode(safeDs, {
                loadModeAdaptationFn: () => loadModeAdaptation(MODE_ADAPT_KEY)
            })
        });

        registerModeFeedback(mode, wasHelpful, ds, {
            loadModeAdaptationFn: () => loadModeAdaptation(MODE_ADAPT_KEY),
            saveModeAdaptationFn: (state) => saveModeAdaptation(state, MODE_ADAPT_KEY),
            logEventFn: logEvent
        });

        if (window._weather) {
            renderAll(
                window._weather,
                window._weatherToday,
                window._pressure,
                window._userKin,
                window._todayKin,
                window._date.year,
                window._date.month,
                window._date.day,
                {
                    renderCognitiveState,
                    renderWeather: typeof renderWeather !== "undefined" ? renderWeather : null,
                    renderNetwork: typeof renderNetwork !== "undefined" ? renderNetwork : null,
                    renderCollective: typeof renderCollective !== "undefined" ? renderCollective : null,
                    renderSeries: typeof renderSeries !== "undefined" ? renderSeries : null,
                    renderAttractor: typeof renderAttractor !== "undefined" ? renderAttractor : null,
                    renderAttractorMap: typeof renderAttractorMap !== "undefined" ? renderAttractorMap : null,
                    renderHumanLayer: typeof renderHumanLayer !== "undefined" ? renderHumanLayer : null
                }
            );
        }
    };

    window.loadAutoModeFeedbackState = () => loadAutoModeFeedbackState(AUTO_MODE_FEEDBACK_KEY);
    window.saveAutoModeFeedbackState = (state) => saveAutoModeFeedbackState(state, AUTO_MODE_FEEDBACK_KEY);

    window.applyAutomaticModeFeedback = (name, ds, metrics, truth) => applyAutomaticModeFeedback(name, ds, metrics, truth, {
        getAdaptiveRecommendedModeFn: (safeDs) => getAdaptiveRecommendedMode(safeDs, {
            loadModeAdaptationFn: () => loadModeAdaptation(MODE_ADAPT_KEY)
        }),
        inferAutomaticModeFeedbackFn: ctx.inferAutomaticModeFeedback,
        getAutoModeStampFn: ctx.getAutoModeStamp,
        loadAutoModeFeedbackStateFn: () => loadAutoModeFeedbackState(AUTO_MODE_FEEDBACK_KEY),
        saveAutoModeFeedbackStateFn: (state) => saveAutoModeFeedbackState(state, AUTO_MODE_FEEDBACK_KEY),
        registerModeFeedbackFn: (mode, wasHelpful, safeDs) => registerModeFeedback(mode, wasHelpful, safeDs, {
            loadModeAdaptationFn: () => loadModeAdaptation(MODE_ADAPT_KEY),
            saveModeAdaptationFn: (state) => saveModeAdaptation(state, MODE_ADAPT_KEY),
            logEventFn: logEvent
        }),
        logEventFn: logEvent
    });

    window.getRecommendedMode = (ds) => getRecommendedMode(ds, {
        getAdaptiveRecommendedModeFn: (safeDs) => getAdaptiveRecommendedMode(safeDs, {
            loadModeAdaptationFn: () => loadModeAdaptation(MODE_ADAPT_KEY)
        })
    });

    window.getModeDescription = getModeDescription;
    window.getModeActionGuide = getModeActionGuide;

    window.getDecisionOutput = (ds, metrics) => getDecisionOutput(ds, metrics, {
        getRecommendedModeFn: (safeDs) => getRecommendedMode(safeDs, {
            getAdaptiveRecommendedModeFn: (safeDs2) => getAdaptiveRecommendedMode(safeDs2, {
                loadModeAdaptationFn: () => loadModeAdaptation(MODE_ADAPT_KEY)
            })
        })
    });

    window.getSelectedDecisionTarget = () => getSelectedDecisionTarget(MTOS_SELECTED_TARGET_KEY);
    window.setSelectedDecisionTarget = (name) => setSelectedDecisionTarget(name, MTOS_SELECTED_TARGET_KEY);

    window.resolveDecisionTargets = () => resolveDecisionTargetsLocal({
        getCurrentUserName,
        getSelectedDecisionTarget: () => getSelectedDecisionTarget(MTOS_SELECTED_TARGET_KEY),
        t,
        getState: () => window.MTOS_STATE || {},
        getDecision: () => window.mtosDecision || {},
        getRelations: () => window.currentNetworkRelations || []
    });

    window.renderFieldTensionPanel = () => renderFieldTensionPanel({
        t,
        getDayState: () => window.mtosDayState || {},
        getTimePressureSummary: () => window.mtosTimePressureSummary || {},
        getMetabolicMetrics: () => window.mtosMetabolicMetrics || {},
        getCollectiveState: () => window.mtosCollectiveState || {}
    });

    window.renderDecisionTargetsPanel = () => renderDecisionTargetsPanel({
        t,
        getState: () => window.MTOS_STATE || {},
        getSelectedDecisionTarget: () => getSelectedDecisionTarget(MTOS_SELECTED_TARGET_KEY),
        setSelectedDecisionTarget: (name) => setSelectedDecisionTarget(name, MTOS_SELECTED_TARGET_KEY),
        resolveDecisionTargets: () => resolveDecisionTargetsLocal({
            getCurrentUserName,
            getSelectedDecisionTarget: () => getSelectedDecisionTarget(MTOS_SELECTED_TARGET_KEY),
            t,
            getState: () => window.MTOS_STATE || {},
            getDecision: () => window.mtosDecision || {},
            getRelations: () => window.currentNetworkRelations || []
        }),
        renderDecisionSummaryPanel,
        renderSystemDecisionPanel: () => window.renderSystemDecisionPanel(),
        renderActionTracePanel: () => window.renderActionTracePanel()
    });

    window.renderActionTracePanel = () => renderActionTracePanel({
        t,
        getDecision: () => window.mtosDecision || {},
        getDayState: () => window.mtosDayState || {},
        getTimePressureSummary: () => window.mtosTimePressureSummary || {},
        getState: () => window.MTOS_STATE || {}
    });

    window.renderSystemEventsPanel = () => renderSystemEventsPanel({
        t,
        translateRelationLabel,
        translateRiskLabel,
        getState: () => window.MTOS_STATE || {}
    });

    window.renderSystemDecisionPanel = () => renderSystemDecisionPanel({
        t,
        translateModeLabel,
        translateRelationLabel,
        renderSystemDecisionMetrics,
        getState: () => window.MTOS_STATE || {}
    });

    window.renderHistoryEfficiencyPanel = (targetId = "historyEfficiencyPanel") => renderHistoryEfficiencyPanel(targetId, {
        t,
        translateRiskLabel,
        getCurrentUserName,
        calcModeStats
    });

    window.attractorMode = loadAttractorMode();
    window.networkMode = "interaction";

    window.toggleEditMode = () => {
        window.networkMode = window.networkMode === "edit" ? "interaction" : "edit";

        const btn = document.getElementById("editBtn");
        if (btn) {
            btn.innerText = window.networkMode === "edit" ? t("editOn") : t("editOff");
        }
    };

    window.replayPlay = replayPlay;
    window.replayPause = replayPause;
    window.replayStep = replayStep;
    window.replaySeek = replaySeek;

    initReplay();
    ensureAttractorToggle();

    return { pyodide };
}