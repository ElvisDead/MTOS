export function shiftWeatherArray(weather, offsetDays = 0) {
    const src = Array.isArray(weather) ? weather : [];
    if (!src.length) return [];

    const n = src.length;
    const shift = ((offsetDays % n) + n) % n;

    return src.map((_, i) => {
        const from = (i + shift) % n;
        const w = src[from] || {};
        return {
            attention: Number(w.attention ?? 0.5),
            activity: Number(w.activity ?? 0.5),
            pressure: Number(w.pressure ?? 0),
            conflict: Number(w.conflict ?? 0),
            phase: Number(w.phase ?? 0),
            resonance: Number(w.resonance ?? 0),
            interference: Number(w.interference ?? 0),
            noise: Number(w.noise ?? 0.1),
            entropy: Number(w.entropy ?? 1.2),
            lyapunov: Number(w.lyapunov ?? 0.2),
            prediction: Number(w.prediction ?? 0.5),
            predictability: Number(w.predictability ?? 120)
        };
    });
}

export function createTimeStepRunner(ctx = {}) {
    const {
        pyodide,
        name,
        baseYear,
        baseMonth,
        baseDay,
        getCachedBaseWeather,
        getCachedBasePressure,

        getUsers,
        setUsers,

        getFieldState,
        setFieldState,
        getFieldMode,
        setFieldMode,

        toPython,
        logEvent,
        safeLogEvent,
        saveNetworkState,

        getDayKeyFromParts,
        buildEffectiveRelationMemory,
        classifyUserDay,
        resolveDynamicDayState,
        applyTodayContactsToAttractorField,
        applyTodayContactsToDayState,

        updateMemoryLayers,
        getMemoryInfluence,
        buildUnifiedMetrics,
        resolveTimePressure,
        getTimePressureSummary,
        applyTimePressureToDayState,
        applyTimePressureToAttractorState,

        buildAdaptiveModelDynamic,
        resolveStateIndex,
        resolveTodayMode,
        applyFeedbackToDecision,

        findUserByNameOrId,
        storeAutoFeedbackForCurrentRun,
        getForecastStats,
        updateSelfLearningLoop,
        registerModeFeedback,

        getDaySyncInfo,
        renderCognitiveState,
        renderAll,

        getCurrentUserName,
        getCurrentRunDay,
        getHumanFeedbackFor,
        getSelectedDecisionTarget,
        setSelectedDecisionTarget,

        getTimePressureSummaryState = () => window.mtosTimePressureSummary || {},
        getNetworkFeedback = () => window.mtosNetworkFeedback || {
            totalLinks: 0,
            density: 0,
            meanStrength: 0,
            conflictRatio: 0,
            supportRatio: 0
        },
        getAttractorState = () => window.mtosAttractorState || {
            type: "unknown",
            intensity: 0,
            score: 0
        },
        getCollectiveState = () => window.mtosCollectiveState || {},
        getAdaptiveMode = () => window.mtosAdaptiveMode?.mode || "UNKNOWN",
        getRenderAllDeps = () => ({
            getFieldState: () => null,
            getSelectedAgent: () => null,
            getAttractorField: () => window._attractorField,
            getUsers: () => [],
            getMatrix: () => window._matrix || null,
            renderAttractorOnly: () => window.renderAttractorOnly && window.renderAttractorOnly(),
            renderHistoryEfficiencyPanel: typeof window.renderHistoryEfficiencyPanel === "function"
                ? window.renderHistoryEfficiencyPanel
                : null
        }),
        getRenderCognitiveDeps = () => ({
            renderHumanLayer: typeof renderHumanLayer !== "undefined" ? renderHumanLayer : null,
            getCurrentUserName,
            getCurrentRunDay,
            getDecision: () => window.mtosDecision || {},
            getRunAttractorState: () => window.mtosRunAttractorState || window.mtosAttractorState || {},
            getTimePressureSummary: () => window.mtosTimePressureSummary || {},
            getForecastStats: () => window.mtosForecastStats || {},
            getFeedback: () => getHumanFeedbackFor(getCurrentRunDay(), getCurrentUserName()),
            getMetabolic: () => window.mtosMetabolicMetrics || {}
        })
    } = ctx;

    return function step(offset) {
        const d = new Date(baseYear, baseMonth - 1, baseDay);
        d.setDate(d.getDate() + offset);

        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const dd = d.getDate();

        const currentKin = JSON.parse(pyodide.runPython(`
import json, datetime
current_date = datetime.date(${y}, ${m}, ${dd})
current_kin, _, _, _ = kin_from_date(current_date)
json.dumps(current_kin)
`));

        const weather = shiftWeatherArray(getCachedBaseWeather(), offset);
        const pressure = shiftWeatherArray(getCachedBasePressure(), offset);

        window._date = { year: y, month: m, day: dd };

        const currentWeatherPoint =
            Array.isArray(weather) && weather[currentKin - 1]
                ? weather[currentKin - 1]
                : {};

        const result = {
            weather,
            pressure,
            kin: currentKin,
            attention: Number(currentWeatherPoint.attention ?? 0.5),
            noise: Number(currentWeatherPoint.noise ?? 0.1),
            entropy: Number(currentWeatherPoint.entropy ?? 1.2),
            lyapunov: Number(currentWeatherPoint.lyapunov ?? 0.2),
            prediction: Number(currentWeatherPoint.prediction ?? 0.5),
            predictability: Number(currentWeatherPoint.predictability ?? 120)
        };

        logEvent("time_step", {
            year: y,
            month: m,
            day: dd,
            kin: currentKin
        });

        let users = (getUsers() || []).map((u) => {
            const kinForPhase = u.baseKin || u.kin;
            const phaseFromWeather =
                Array.isArray(weather) && weather[kinForPhase - 1]
                    ? Number(weather[kinForPhase - 1].phase ?? 0)
                    : 0;

            return {
                ...u,
                kin: kinForPhase,
                baseKin: kinForPhase,
                phase: phaseFromWeather
            };
        });

        const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}");
        const baseMemory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}");
        const memory = buildEffectiveRelationMemory(baseMemory, getDayKeyFromParts(y, m, dd));

        const networkFeedback = getNetworkFeedback();
        const attractorState = getAttractorState();

        const prevUsers = JSON.parse(JSON.stringify(users));
        const fieldResult = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(
    users,
    ${y},
    ${m},
    ${dd},
    ${getFieldState() ? toPython(getFieldState()) : "None"},
    ${getFieldMode() ? toPython(getFieldMode()) : "None"},
    ${toPython(locked)},
    ${toPython(memory)},
    ${toPython(networkFeedback)},
    ${toPython(attractorState)}
)
json.dumps([f,s,u])
`));

        setFieldState(fieldResult[0]);
        setFieldMode(fieldResult[1]);
        const updated = fieldResult[2];

        const dayState = classifyUserDay(
            currentKin,
            weather,
            pressure,
            getFieldState(),
            window.mtosNetworkFeedback,
            window.mtosAttractorState
        );

        const evolvedDayState = resolveDynamicDayState(
            dayState,
            window.mtosNetworkFeedback,
            window.mtosAttractorState
        );

        window._attractorField = applyTodayContactsToAttractorField(
            window._attractorField,
            users,
            getDayKeyFromParts(y, m, dd)
        );

        const evolvedDayStateWithContacts = applyTodayContactsToDayState(
            evolvedDayState,
            users,
            getDayKeyFromParts(y, m, dd)
        );

        window.mtosDayState = evolvedDayStateWithContacts;

        const attractorAtUser =
            Array.isArray(window._attractorField) && currentKin >= 1 && currentKin <= 260
                ? Number(window._attractorField[currentKin - 1] ?? 0.5)
                : 0.5;

        evolvedDayState.attractorField = attractorAtUser;
        evolvedDayState.dayIndex = Number(
            Math.max(-1, Math.min(1, evolvedDayState.dayIndex + (attractorAtUser - 0.5) * 0.25)).toFixed(3)
        );

        if (attractorAtUser > 0.72) {
            evolvedDayState.dayDesc += " Strong attractor pull is present.";
        } else if (attractorAtUser < 0.28) {
            evolvedDayState.dayDesc += " Weak attractor pull reduces coherence.";
        }

        updateMemoryLayers(
            name,
            currentKin,
            window.mtosDayState,
            weather,
            window._attractorField
        );

        window.mtosMemoryInfluence = getMemoryInfluence(name, currentKin);

        const uiMetrics = buildUnifiedMetrics(result, evolvedDayState);
        window.mtosUnifiedMetrics = uiMetrics;

        const timePressure = resolveTimePressure({
            attention: window.mtosDayState.attention,
            activity: window.mtosDayState.activity,
            pressure: window.mtosDayState.pressure,
            conflict: window.mtosDayState.conflict,
            stability: window.mtosDayState.stability,
            field: window.mtosDayState.field,
            entropy: uiMetrics.entropy,
            noise: uiMetrics.noise,
            prediction: uiMetrics.prediction,
            predictability: uiMetrics.predictability,
            attractorIntensity: Number(window.mtosAttractorState?.intensity ?? 0),
            attractorType: String(window.mtosAttractorState?.type ?? "unknown"),
            networkConflict: Number(window.mtosNetworkFeedback?.conflictRatio ?? 0),
            networkDensity: Number(window.mtosNetworkFeedback?.density ?? 0),
            networkSupport: Number(window.mtosNetworkFeedback?.supportRatio ?? 0),
            realContacts: Number(window.mtosDayState?.realContacts ?? 0),
            realContactWeight: Number(window.mtosDayState?.realContactWeight ?? 0)
        });

        window.mtosTimePressure = timePressure;
        window.mtosTimePressureSummary = getTimePressureSummary(timePressure);

        window.mtosSystemState = {
            users: JSON.parse(JSON.stringify(users || [])),
            weather: Array.isArray(weather) ? weather : [],
            pressureMap: Array.isArray(pressure) ? pressure : [],
            attractorField: Array.isArray(window._attractorField) ? window._attractorField : [],
            dayState: window.mtosDayState || null,
            timePressure: window.mtosTimePressure || null,
            timePressureSummary: window.mtosTimePressureSummary || null,
            attractorState: window.mtosAttractorState || null,
            networkFeedback: window.mtosNetworkFeedback || null,
            memoryLayers: window.mtosMemoryLayers || null,
            todayKin: window._todayKin || null,
            userKin: window._userKin || null,
            date: window._date || null
        };

        window.mtosDayState = applyTimePressureToDayState(window.mtosDayState, timePressure);

        if (window.mtosAttractorState) {
            window.mtosAttractorState = applyTimePressureToAttractorState(
                window.mtosAttractorState,
                timePressure
            );
        }

        const resolutionMode = "adaptive";

        if (!window._adaptiveModel && Array.isArray(weather) && weather.length) {
            window._adaptiveModel = buildAdaptiveModelDynamic(weather, {
                entropy: Number(window.mtosUnifiedMetrics?.entropy ?? 0.5),
                T: Number(window.mtosMetabolicMetrics?.T ?? 0.5),
                pressure: Number(window.mtosDayState?.pressure ?? 0.5),
                conflict: Number(window.mtosDayState?.conflict ?? 0)
            });
        }

        window.mtosResolvedState = resolveStateIndex({
            kin: currentKin,
            attention: Number(window.mtosDayState?.attention ?? 0.5),
            pressure: Number(window.mtosDayState?.pressure ?? 0),
            conflict: Number(window.mtosDayState?.conflict ?? 0),
            field: Number(window.mtosDayState?.field ?? 0.5),
            mode: resolutionMode,
            adaptiveCache: window._adaptiveModel
        });

        window.mtosResolutionMode = resolutionMode;
        window.mtosRunAttractorState = window.deriveAttractorFromResolvedState
            ? window.deriveAttractorFromResolvedState()
            : window.mtosRunAttractorState;

        if (window.mtosRunAttractorState) {
            window.mtosAttractorState = window.mtosRunAttractorState;
        }

        const baseDecision = resolveTodayMode(
            window.mtosDayState,
            window.mtosTimePressureSummary,
            window.mtosMemoryLayers
        );

        const decision = applyFeedbackToDecision(
            baseDecision,
            name,
            window.mtosDayState
        );

        window.mtosDecision = decision;
        Object.freeze(window.mtosDecision);
        window.mtosRisk = decision?.risk || null;

        window.updateMTOSBranch("decision", {
            mode: String(decision?.mode || "EXPLORE"),
            action: String(
                decision?.text ||
                decision?.action ||
                "Observe the field and avoid impulsive actions."
            ),
            reason: String(
                decision?.feedbackReason ||
                decision?.reason ||
                decision?.why ||
                "derivedFromDayState"
            ),
            confidence: Math.round(
                Math.max(0, Math.min(1, Number(decision?.confidence ?? 0.5))) * 100
            ),
            extraMetrics: window.mtosDecision?.extraMetrics || [
                {
                    labelKey: "metrics_step2_title",
                    valueKey: "metrics_step2_value",
                    noteKey: "metrics_step2_note"
                }
            ],
            targets: { primary: [], avoid: [], neutral: [] },
            selectedTarget: null,
            source: "human_decision_layer",
            createdAt: new Date().toISOString()
        });

        const currentUserAgent = findUserByNameOrId(users, name) || null;
        const autoFeedbackRow = storeAutoFeedbackForCurrentRun(
            name,
            currentUserAgent,
            window.mtosDayState,
            decision
        );

        window.mtosAutoFeedbackRow = autoFeedbackRow;

        const metrics = typeof window.computeBehaviorMetrics === "function"
            ? window.computeBehaviorMetrics(window.MTOS_LOG)
            : { runCount: 0, interactions: 0, kinSelects: 0, timeSteps: 0 };

        const truth = typeof window.computeAutoTruth === "function"
            ? window.computeAutoTruth(metrics)
            : {
                unstable: false,
                chaotic: false,
                lowActivity: true,
                overload: false,
                exploratory: false
            };

        const autoModeFeedback =
            typeof window.applyAutomaticModeFeedback === "function"
                ? window.applyAutomaticModeFeedback(
                    name,
                    evolvedDayState,
                    metrics,
                    truth
                )
                : {
                    mode: String(window.mtosDecision?.mode || "EXPLORE"),
                    applied: false,
                    wasHelpful: null,
                    reason: "applyAutomaticModeFeedback unavailable"
                };

        window.mtosAutoModeFeedback = autoModeFeedback;

        const forecastStats = getForecastStats();
        window.mtosForecastStats = forecastStats;

        const learningUpdate = updateSelfLearningLoop({
            name,
            dayState: evolvedDayState,
            mode: getAdaptiveMode(),
            attractorType: window.mtosAttractorState?.type || "unknown",
            forecastStats,
            autoModeFeedback
        });

        window.mtosLearningState = learningUpdate.state;
        window.mtosLearningSignal = learningUpdate.signal;

        if (learningUpdate.signal >= 0.20 && window.mtosAdaptiveMode?.mode) {
            registerModeFeedback(window.mtosAdaptiveMode.mode, true, evolvedDayState);
        } else if (learningUpdate.signal <= -0.20 && window.mtosAdaptiveMode?.mode) {
            registerModeFeedback(window.mtosAdaptiveMode.mode, false, evolvedDayState);
        }

        logEvent("day_state", {
            userKin: currentKin,
            dayIndex: evolvedDayState.dayIndex,
            dayLabel: evolvedDayState.dayLabel,
            dayScore: evolvedDayState.dayScore,
            attention: evolvedDayState.attention,
            activity: evolvedDayState.activity,
            pressure: evolvedDayState.pressure,
            conflict: evolvedDayState.conflict,
            field: evolvedDayState.field,
            stability: evolvedDayState.stability
        });

        const prevMap = {};
        prevUsers.forEach(u => {
            prevMap[u.name] = u;
        });

        users = updated.map(u => {
            const prev = (prevUsers || []).find(x => x.name === u.name) || {};
            const kinForPhase = Number(u.baseKin ?? u.kin);

            return {
                name: u.name,
                kin: Number(u.kin),
                baseKin: Number(u.baseKin ?? u.kin),
                weight: Number(u.weight ?? 1),
                goal: String(u.goal || prev.goal || "stability").toLowerCase(),
                goalWeight: Number(u.goalWeight ?? prev.goalWeight ?? 0.65),
                goalScore: Number(u.goalScore ?? prev.goalScore ?? 0.5),
                goalFeedback: String(u.goalFeedback || prev.goalFeedback || "neutral"),
                location: u.location || prev.location || "",
                city: u.city || prev.city || "",
                country: u.country || prev.country || ""
            };
        });

        setUsers(users);
        window.currentUsers = users;
        window.mtosDaySync = getDaySyncInfo(users, currentKin);

        try {
            saveNetworkState(users, memory);
        } catch (e) {
            console.warn("saveNetworkState skipped", e);
        }

        safeLogEvent("agents_update", {
            users: users,
            fieldState: getFieldState(),
            weather: weather,
            pressure: pressure,
            userKin: currentKin,
            todayKin: currentKin
        });

        renderCognitiveState(
            currentKin,
            currentKin,
            uiMetrics.attention,
            uiMetrics.noise,
            uiMetrics.entropy,
            uiMetrics.lyapunov,
            uiMetrics.prediction,
            uiMetrics.predictability,
            window.mtosDaySync,
            window.mtosDayState,
            getRenderCognitiveDeps()
        );

        renderAll(
            weather,
            weather,
            pressure,
            currentKin,
            currentKin,
            y,
            m,
            dd,
            getRenderAllDeps()
        );

        const netRelations = Array.isArray(window.currentNetworkRelations)
            ? window.applyMTOSMemoryToRelations(window.currentNetworkRelations)
            : [];

        const relationSummary = {
            supportCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("support")).length,
            conflictCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("conflict")).length,
            ultraCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("ultra")).length
        };

        window.updateMTOSBranch("network", {
            relations: netRelations,
            relationSummary,
            timePressure: Number(window.mtosTimePressureSummary?.value ?? 0)
        });

        const resolvedStepTargets = typeof window.resolveDecisionTargets === "function"
            ? window.resolveDecisionTargets()
            : { primary: [], avoid: [], neutral: [] };

        const stepSelectedName = getSelectedDecisionTarget();

        const allStepTargets = [
            ...(Array.isArray(resolvedStepTargets.primary) ? resolvedStepTargets.primary : []),
            ...(Array.isArray(resolvedStepTargets.neutral) ? resolvedStepTargets.neutral : []),
            ...(Array.isArray(resolvedStepTargets.avoid) ? resolvedStepTargets.avoid : [])
        ];

        const stepSelectedTarget =
            allStepTargets.find(x => x.name === stepSelectedName) ||
            (resolvedStepTargets.primary?.[0] || resolvedStepTargets.neutral?.[0] || null);

        if (stepSelectedTarget?.name) {
            setSelectedDecisionTarget(stepSelectedTarget.name);
        }

        window.updateMTOSBranch("decision", {
            ...(window.MTOS_STATE?.decision || {}),
            targets: resolvedStepTargets,
            selectedTarget: stepSelectedTarget || null
        });

        renderDecisionSummaryPanel("humanLayer");

        window.updateMTOSBranch("collective", {
            ...(window.mtosCollectiveState || {}),
            stability: Number(window.mtosDayState?.stability ?? window.mtosCollectiveState?.stability ?? 0.5),
            timePressure: Number(window.mtosTimePressureSummary?.value ?? window.mtosCollectiveState?.timePressure ?? 0)
        });

        renderDecisionTargetsPanel();
        renderFieldTensionPanel();
        renderActionTracePanel();
    };
}