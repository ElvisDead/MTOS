export async function createMainRunCore(ctx = {}) {
    const {
        pyodide,

        name,
        year,
        month,
        day,

        getHistoryStack = () => [],
        getUsers = () => [],
        setUsers = () => {},
        getFieldState = () => null,
        setFieldState = () => {},
        getFieldMode = () => null,
        setFieldMode = () => {},

        getSelectedAgent = () => null,

        logEvent = () => {},
        safeLogEvent = () => {},
        addForecast = () => {},
        getForecastStats = () => ({}),
        saveNetworkState = () => {},

        loadUsers = () => [],
        saveUsers = () => {},
        addUser = (users, nextName) => {
            const list = Array.isArray(users) ? users.slice() : [];
            if (!list.includes(nextName)) list.push(nextName);
            return list;
        },

        getStableAnonId = () => null,
        getDayKeyFromParts = () => "",
        buildEffectiveRelationMemory = (base) => base || {},
        findUserByNameOrId = () => null,
        findUserById = () => null,
        getRelationIdsFromNames = () => [],

        loadMemoryLayers = () => null,
        updateMemoryLayers = () => {},
        getMemoryInfluence = () => null,

        getHumanFeedbackFor = () => null,
        getSelectedDecisionTarget = () => null,
        setSelectedDecisionTarget = () => {},

        toPython = (value) => JSON.stringify(value),
        classifyUserDay = () => ({}),
        resolveDynamicDayState = (state) => state,
        applyTodayContactsToAttractorField = (field) => field,
        applyTodayContactsToDayState = (state) => state,
        saveAutoDailySnapshot = () => {},

        buildUnifiedMetrics = () => ({}),
        buildMetabolicMetrics = () => ({}),

        resolveTimePressure = () => ({}),
        getTimePressureSummary = () => ({}),
        applyTimePressureToDayState = (state) => state,

        buildAdaptiveModelDynamic = () => null,
        resolveStateIndex = () => null,
        resolveTodayMode = () => ({}),
        applyFeedbackToDecision = (decision) => decision,

        storeAutoFeedbackForCurrentRun = () => null,
        registerModeFeedback = () => {},
        applyAutomaticModeFeedback = () => ({}),
        updateSelfLearningLoop = () => ({ state: null, signal: 0 }),

        getDaySyncInfo = () => null,
        renderCognitiveState = () => {},
        renderAll = () => {},
        renderDecisionSummaryPanel = () => {},
        renderSystemDecisionPanel = () => {},
        renderDecisionTargetsPanel = () => {},
        renderFieldTensionPanel = () => {},
        renderActionTracePanel = () => {},
        deriveAttractorFromResolvedState = () => ({ type: "unknown", intensity: 0, score: 0 }),

        t = (key) => key,

        getCurrentUserName = () => name,
        getCurrentRunDay = () => ({ year, month, day }),

        getRenderAllDeps = () => ({}),
        getRenderCognitiveDeps = () => ({})
    } = ctx;

    function safeNumber(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function deepClone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    }

    function getSafeDecisionTargets() {
        const targets = window.MTOS_STATE?.decision?.targets;

        if (targets && typeof targets === "object") {
            return {
                primary: Array.isArray(targets.primary) ? targets.primary : [],
                avoid: Array.isArray(targets.avoid) ? targets.avoid : [],
                neutral: Array.isArray(targets.neutral) ? targets.neutral : []
            };
        }

        return {
            primary: [],
            avoid: [],
            neutral: []
        };
    }

    function translateMode(value) {
        const m = String(value || "").toUpperCase();

        if (m === "FOCUS") return t("modeFocus");
        if (m === "ADJUST") return t("modeAdjust");
        if (m === "REST") return t("modeRest");
        if (m === "INTERACT") return t("modeInteract");
        if (m === "EXPLORE") return t("modeExplore");

        return value || "—";
    }

    function translateRisk(value) {
        const r = String(value || "").toUpperCase();

        if (r === "LOW") return t("riskLow");
        if (r === "MEDIUM") return t("riskMedium");
        if (r === "HIGH") return t("riskHigh");
        if (r === "CRITICAL") return t("riskCritical");

        return value || "—";
    }

    function callIfFn(fn, ...args) {
        if (typeof fn === "function") {
            return fn(...args);
        }
        return undefined;
    }

    function buildPanelDeps() {
        return {
            decisionTargetsDeps: {
                t,
                getState: () => window.MTOS_STATE || {},
                getSelectedDecisionTarget,
                setSelectedDecisionTarget,
                resolveDecisionTargets: () => ({
                    primary: Array.isArray(window.MTOS_STATE?.decision?.targets?.primary)
                        ? window.MTOS_STATE.decision.targets.primary
                        : [],
                    neutral: Array.isArray(window.MTOS_STATE?.decision?.targets?.neutral)
                        ? window.MTOS_STATE.decision.targets.neutral
                        : [],
                    avoid: Array.isArray(window.MTOS_STATE?.decision?.targets?.avoid)
                        ? window.MTOS_STATE.decision.targets.avoid
                        : []
                }),
                renderDecisionSummaryPanel: (targetId = "humanLayer") => {
                    if (typeof renderDecisionSummaryPanel === "function") {
                        renderDecisionSummaryPanel(targetId);
                    }
                },
                renderSystemDecisionPanel,
                renderActionTracePanel: () => {
                    if (typeof renderActionTracePanel === "function") {
                        renderActionTracePanel({
                            t,
                            translateModeLabel: translateMode,
                            translateRiskLabel: translateRisk,
                            getDecision: () => window.mtosDecision || {},
                            getDayState: () => window.mtosDayState || {},
                            getTimePressureSummary: () => window.mtosTimePressureSummary || {},
                            getState: () => window.MTOS_STATE || {}
                        });
                    }
                }
            },

            fieldTensionDeps: {
                t,
                getDayState: () => window.mtosDayState || {},
                getTimePressureSummary: () => window.mtosTimePressureSummary || {},
                getMetabolicMetrics: () => window.mtosMetabolicMetrics || {},
                getCollectiveState: () => window.mtosCollectiveState || {}
            },

            actionTraceDeps: {
                t,
                translateModeLabel: translateMode,
                translateRiskLabel: translateRisk,
                getDecision: () => window.mtosDecision || {},
                getDayState: () => window.mtosDayState || {},
                getTimePressureSummary: () => window.mtosTimePressureSummary || {},
                getState: () => window.MTOS_STATE || {}
            }
        };
    }

    function renderDecisionPanels() {
        const { decisionTargetsDeps, fieldTensionDeps, actionTraceDeps } = buildPanelDeps();

        if (typeof renderDecisionSummaryPanel === "function") {
            renderDecisionSummaryPanel("humanLayer");
        }

        if (typeof renderSystemDecisionPanel === "function") {
            renderSystemDecisionPanel({
                t,
                translateModeLabel: (value) => {
                    const m = String(value || "").toUpperCase();
                    if (m === "FOCUS") return t("modeFocus");
                    if (m === "ADJUST") return t("modeAdjust");
                    if (m === "REST") return t("modeRest");
                    if (m === "INTERACT") return t("modeInteract");
                    if (m === "EXPLORE") return t("modeExplore");
                    return value || "—";
                }
            });
        }

        if (typeof window.renderDecisionMetrics === "function") {
            window.renderDecisionMetrics();
        }

        if (typeof renderDecisionTargetsPanel === "function") {
            renderDecisionTargetsPanel(decisionTargetsDeps);
        }

        if (typeof renderFieldTensionPanel === "function") {
            renderFieldTensionPanel(fieldTensionDeps);
        }

        if (typeof renderActionTracePanel === "function") {
            renderActionTracePanel(actionTraceDeps);
        }
    }

    const userList0 = loadUsers();
    const userList = addUser(userList0, name);
    saveUsers(userList);

    pyodide.runPython(`
import datetime

birth = datetime.date(${year}, ${month}, ${day})
kin, tone, seal, i = kin_from_date(birth)
register_user(${JSON.stringify(name)}, None, kin, tone, seal)
`);

    const result = JSON.parse(pyodide.runPython(`
import json
import datetime
import numpy as np

weather = mtos_260_weather(${JSON.stringify(name)}, ${year}, ${month}, ${day})
kin = mtos_current_kin_NEW(${JSON.stringify(name)}, ${year}, ${month}, ${day})
pressure = mtos_pressure_map()

safe_weather = [
    w if isinstance(w, dict) and "attention" in w else {
        "attention": 0.5,
        "activity": 0.5,
        "pressure": 0,
        "conflict": 0
    }
    for w in weather
]

birth = datetime.date(${year}, ${month}, ${day})
_, tone, _, i = kin_from_date(birth)
today = datetime.datetime.now(datetime.timezone.utc).date()

metabolic = simulate(i, tone, today, 260, ${JSON.stringify(name)})

series = metabolic["attention"].tolist()
pressure_series = metabolic["pressure"].tolist()
temperature_series = metabolic["temperature"].tolist()
phi_series = metabolic["phi"].tolist()
k_series = metabolic["k"].tolist()
consistency_series = metabolic["consistency"].tolist()
stability_series = metabolic["stability"].tolist()

series_len = max(1, len(series))
attention = sum(series) / series_len
noise = sum([abs(v - 0.5) for v in series]) / series_len
series_entropy = entropy(series)
series_lyapunov = lyapunov(series)
prediction = attention * (1 - noise)
series_predictability = predictability(series)

phase_values = [float(w.get("phase", 0)) if isinstance(w, dict) else 0.0 for w in safe_weather]
resonance_values = [float(w.get("resonance", 0)) if isinstance(w, dict) else 0.0 for w in safe_weather]
interference_values = [float(w.get("interference", 0)) if isinstance(w, dict) else 0.0 for w in safe_weather]

json.dumps({
    "weather": safe_weather,
    "pressure": pressure,
    "kin": kin,
    "attention": attention,
    "noise": noise,
    "entropy": series_entropy,
    "lyapunov": series_lyapunov,
    "prediction": prediction,
    "predictability": series_predictability,

    "metabolic_pressure": pressure_series,
    "metabolic_temperature": temperature_series,
    "metabolic_phi": phi_series,
    "metabolic_k": k_series,
    "metabolic_consistency": consistency_series,
    "metabolic_stability": stability_series,

    "mean_phi": float(np.mean(metabolic["phi"])),
    "mean_k": float(np.mean(metabolic["k"])),
    "mean_temperature": float(np.mean(metabolic["temperature"])),
    "mean_pressure": float(np.mean(metabolic["pressure"])),
    "mean_consistency": float(np.mean(metabolic["consistency"])),
    "mean_stability": float(np.mean(metabolic["stability"])),

    "mean_phase": float(np.mean(phase_values)) if len(phase_values) else 0.0,
    "mean_resonance": float(np.mean(resonance_values)) if len(resonance_values) else 0.0,
    "mean_interference": float(np.mean(interference_values)) if len(interference_values) else 0.0
})
`));

    const weather = Array.isArray(result.weather) ? result.weather : [];
    const weatherToday = weather;
    const pressure = Array.isArray(result.pressure) ? result.pressure : [];
    const userKin = safeNumber(result.kin, 1);

    const attractorField = weather.map((w) => {
        const a = safeNumber(w?.attention, 0.5);
        const act = safeNumber(w?.activity, a);
        const p = safeNumber(w?.pressure, 0);
        const c = safeNumber(w?.conflict, 0);

        const value =
            a * 0.45 +
            act * 0.30 +
            (1 - p) * 0.15 +
            (1 - c) * 0.10;

        return clamp(value, 0, 1);
    });

    window._attractorField = attractorField;

    logEvent("python_result", {
        kin: result.kin,
        attention: result.attention,
        noise: result.noise,
        predictability: result.predictability
    });

    const todayKin = JSON.parse(pyodide.runPython(`
import json, datetime

today = datetime.datetime.now(datetime.timezone.utc).date()
kin, _, _, _ = kin_from_date(today)

json.dumps(kin)
`));

    window._weather = weather;
    window._phaseField = weather.map((w) => safeNumber(w?.phase, 0));
    window._resonanceField = weather.map((w) => safeNumber(w?.resonance, 0));
    window._interferenceField = weather.map((w) => safeNumber(w?.interference, 0));

    window.mtosPhaseSummary = {
        meanPhase: safeNumber(result.mean_phase, 0),
        meanResonance: safeNumber(result.mean_resonance, 0),
        meanInterference: safeNumber(result.mean_interference, 0)
    };

    window._weatherToday = weatherToday;
    window._pressure = pressure;
    window._userKin = userKin;
    window._todayKin = todayKin;
    window._date = { year, month, day };

    if (typeof window.setMTOSState === "function") {
        window.setMTOSState({
            todayKin,
            selectedKin: userKin,
            weather: {
                phi: safeNumber(result.mean_phi, 0),
                stability: safeNumber(result.mean_stability, 0),
                timePressure: 0,
                raw: weather
            },
            events: [],
            decision: null
        });
    }

    const userMeta = JSON.parse(pyodide.runPython(`
import json, datetime
birth = datetime.date(${year}, ${month}, ${day})
kin, tone, seal, i = kin_from_date(birth)
json.dumps({
    "kin": kin,
    "tone": tone,
    "seal": seal,
    "sealIndex": i + 1
})
`));

    const todayMeta = JSON.parse(pyodide.runPython(`
import json, datetime
today = datetime.datetime.now(datetime.timezone.utc).date()
kin, tone, seal, i = kin_from_date(today)
json.dumps({
    "kin": kin,
    "tone": tone,
    "seal": seal,
    "sealIndex": i + 1
})
`));

    window.mtosUserMeta = userMeta;
    window.mtosTodayMeta = todayMeta;

    const usersSnapshot = JSON.parse(pyodide.runPython(`
import json
users_db = load_users()
json.dumps(users_db)
`));

    let users = userList.map((uName) => {
        let userData = usersSnapshot?.[uName] || {};

        if ((!userData || !Object.keys(userData).length) && /^u\\d{3,}$/.test(String(uName))) {
            const currentName = String(name || "").trim();
            const currentAnonId = getStableAnonId(currentName);

            if (currentAnonId && uName === currentAnonId) {
                userData = usersSnapshot?.[currentName] || {};
            }
        }

        let baseKin = null;

        if (userData && userData.kin != null) {
            baseKin = safeNumber(userData.kin, null);
        }

        if (!Number.isFinite(baseKin) || baseKin < 1 || baseKin > 260) {
            console.warn("BAD USER DATA:", uName, userData);
            return null;
        }

        const phase =
            Array.isArray(result.weather) && result.weather[baseKin - 1]
                ? safeNumber(result.weather[baseKin - 1].phase, 0)
                : 0;

        return {
            name: uName,
            kin: baseKin,
            baseKin,
            phase,
            weight: safeNumber(userData.weight, 1),
            goal: String(userData.goal || (uName === name ? "stability" : "social")).toLowerCase(),
            goalWeight: safeNumber(userData.goalWeight, (uName === name ? 0.72 : 0.58)),
            location: userData.location || userData.city || userData.country || "",
            city: userData.city || "",
            country: userData.country || ""
        };
    }).filter(Boolean);

    window._attractorField = applyTodayContactsToAttractorField(
        window._attractorField,
        users,
        getDayKeyFromParts(year, month, day)
    );

    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}");
    const baseMemory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}");
    const memory = buildEffectiveRelationMemory(baseMemory, getDayKeyFromParts(year, month, day));

    const networkFeedback = window.mtosNetworkFeedback || {
        totalLinks: 0,
        density: 0,
        meanStrength: 0,
        conflictRatio: 0,
        supportRatio: 0
    };

    const attractorState = window.mtosAttractorState || {
        type: "unknown",
        intensity: 0,
        score: 0
    };

    const prevUsers = deepClone(users);

    const fieldResult = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(
    users,
    ${year},
    ${month},
    ${day},
    None,
    None,
    ${toPython(locked)},
    ${toPython(memory)},
    ${toPython(networkFeedback)},
    ${toPython(attractorState)}
)
json.dumps([f,s,u])
`));

    setFieldState(fieldResult[0]);
    setFieldMode(fieldResult[1]);
    const updated = Array.isArray(fieldResult[2]) ? fieldResult[2] : [];

    const dayState = classifyUserDay(
        userKin,
        weather,
        pressure,
        getFieldState(),
        window.mtosNetworkFeedback,
        window.mtosAttractorState
    );

    const evolvedDayState = resolveDynamicDayState(
        dayState,
        window.mtosNetworkFeedback,
        window.mtosAttractorState,
        window.mtosCollectiveState
    );

    const evolvedDayStateWithContacts = applyTodayContactsToDayState(
        evolvedDayState,
        users,
        getDayKeyFromParts(year, month, day)
    );

    window.mtosDayState = evolvedDayStateWithContacts || {};

    updateMemoryLayers(
        name,
        userKin,
        window.mtosDayState,
        weather,
        window._attractorField
    );

    window.mtosMemoryInfluence = getMemoryInfluence(name, userKin);

    const attractorAtUser =
        Array.isArray(window._attractorField) && userKin >= 1 && userKin <= 260
            ? safeNumber(window._attractorField[userKin - 1], 0.5)
            : 0.5;

    window.mtosDayState.attractorField = attractorAtUser;
    window.mtosDayState.dayIndex = Number(
        clamp(
            safeNumber(window.mtosDayState.dayIndex, 0) + (attractorAtUser - 0.5) * 0.25,
            -1,
            1
        ).toFixed(3)
    );

    if (attractorAtUser > 0.72) {
        window.mtosDayState.dayDesc = String(window.mtosDayState.dayDesc || "") + " Strong attractor pull is present.";
    } else if (attractorAtUser < 0.28) {
        window.mtosDayState.dayDesc = String(window.mtosDayState.dayDesc || "") + " Weak attractor pull reduces coherence.";
    }

    const uiMetrics = buildUnifiedMetrics(result, window.mtosDayState);
    window.mtosUnifiedMetrics = uiMetrics || {};

    const metabolicMetrics = buildMetabolicMetrics(result, window.mtosDayState, {
        getUserKin: () => Number(window._userKin || result?.kin || 1)
    });
    window.mtosMetabolicMetrics = metabolicMetrics || {};

    window.mtosUnifiedMetrics = {
        ...(uiMetrics || {}),
        phi: safeNumber(metabolicMetrics?.phi, 0),
        k: safeNumber(metabolicMetrics?.k, 0),
        temperature: safeNumber(metabolicMetrics?.T, 0),
        pressureScalar: safeNumber(metabolicMetrics?.P, 0),
        volume: safeNumber(metabolicMetrics?.V, 0),
        consistency: safeNumber(metabolicMetrics?.consistency, 0),
        metabolicStability: safeNumber(metabolicMetrics?.stability, 0)
    };

    const timePressure = resolveTimePressure({
        attention: safeNumber(window.mtosDayState.attention, 0.5),
        activity: safeNumber(window.mtosDayState.activity, 0.5),
        pressure: safeNumber(window.mtosDayState.pressure, 0),
        conflict: safeNumber(window.mtosDayState.conflict, 0),
        stability: safeNumber(window.mtosDayState.stability, 0.5),
        field: safeNumber(window.mtosDayState.field, 0.5),
        entropy: safeNumber(uiMetrics?.entropy, 0),
        noise: safeNumber(uiMetrics?.noise, 0),
        prediction: safeNumber(uiMetrics?.prediction, 0),
        predictability: safeNumber(uiMetrics?.predictability, 0),
        attractorIntensity: safeNumber(window.mtosAttractorState?.intensity, 0),
        attractorType: String(window.mtosAttractorState?.type ?? "unknown"),
        networkConflict: safeNumber(window.mtosNetworkFeedback?.conflictRatio, 0),
        networkDensity: safeNumber(window.mtosNetworkFeedback?.density, 0),
        networkSupport: safeNumber(window.mtosNetworkFeedback?.supportRatio, 0),
        realContacts: safeNumber(window.mtosDayState?.realContacts, 0),
        realContactWeight: safeNumber(window.mtosDayState?.realContactWeight, 0)
    });

    window.mtosTimePressure = timePressure;
    window.mtosTimePressureSummary = getTimePressureSummary(timePressure);

    if (typeof window.updateMTOSBranch === "function") {
        window.updateMTOSBranch("weather", {
            phi: safeNumber(result.mean_phi, 0),
            stability: safeNumber(result.mean_stability, safeNumber(window.mtosDayState?.stability, 0.5)),
            timePressure: safeNumber(window.mtosTimePressureSummary?.value, 0),
            raw: weather
        });
    }

    window.mtosSystemState = {
        users: deepClone(users || []),
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

    window.mtosDayState = applyTimePressureToDayState(window.mtosDayState, timePressure) || window.mtosDayState;

    const resolutionMode = "adaptive";

    if (!window._adaptiveModel && Array.isArray(weather) && weather.length) {
        window._adaptiveModel = buildAdaptiveModelDynamic(weather, {
            entropy: safeNumber(window.mtosUnifiedMetrics?.entropy, 0.5),
            T: safeNumber(window.mtosMetabolicMetrics?.T, 0.5),
            pressure: safeNumber(window.mtosDayState?.pressure, 0.5),
            conflict: safeNumber(window.mtosDayState?.conflict, 0)
        });
    }

    window.mtosResolvedState = resolveStateIndex({
        kin: userKin,
        attention: safeNumber(window.mtosDayState?.attention, 0.5),
        pressure: safeNumber(window.mtosDayState?.pressure, 0),
        conflict: safeNumber(window.mtosDayState?.conflict, 0),
        field: safeNumber(window.mtosDayState?.field, 0.5),
        mode: resolutionMode,
        adaptiveCache: window._adaptiveModel
    });

    window.mtosResolutionMode = resolutionMode;
    window.mtosRunAttractorState = deriveAttractorFromResolvedState();
    window.mtosAttractorState = window.mtosRunAttractorState;

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

    if (typeof window.updateMTOSBranch === "function") {
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
                t("derivedFromDayState")
            ),
            confidence: Math.round(
                clamp(safeNumber(decision?.confidence, 0.5), 0, 1) * 100
            ),
            extraMetrics: [
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
    }

    const currentUserAgent = findUserByNameOrId(users, name) || null;
    const autoFeedbackRow = storeAutoFeedbackForCurrentRun(
        name,
        currentUserAgent,
        window.mtosDayState,
        decision
    );

    window.mtosAutoFeedbackRow = autoFeedbackRow;

    const metrics =
        typeof window.computeBehaviorMetrics === "function"
            ? window.computeBehaviorMetrics(window.MTOS_LOG)
            : { runCount: 0, interactions: 0, kinSelects: 0, timeSteps: 0 };

    const truth =
        typeof window.computeAutoTruth === "function"
            ? window.computeAutoTruth(metrics)
            : {
                unstable: false,
                chaotic: false,
                lowActivity: true,
                overload: false,
                exploratory: false
            };

    const autoModeFeedback =
        typeof applyAutomaticModeFeedback === "function"
            ? applyAutomaticModeFeedback(name, evolvedDayState, metrics, truth)
            : {
                mode: String(window.mtosDecision?.mode || "EXPLORE"),
                applied: false,
                wasHelpful: null,
                reason: "applyAutomaticModeFeedback unavailable"
            };

    window.mtosAutoModeFeedback = autoModeFeedback;

    const baseDateUtc = new Date(Date.UTC(year, month - 1, day));
    const forecasts =
        typeof window.makeForecastsFromWeather === "function"
            ? window.makeForecastsFromWeather(name, userKin, weather, baseDateUtc, evolvedDayState)
            : [];

    forecasts.forEach((f) => addForecast(f));

    if (typeof window.resolveCurrentForecasts === "function") {
        window.resolveCurrentForecasts(name, userKin, result.attention, evolvedDayState);
    }

    const forecastStats = getForecastStats();
    window.mtosForecastStats = forecastStats;
    logEvent("forecast_stats", forecastStats);

    const learningUpdate =
        typeof updateSelfLearningLoop === "function"
            ? updateSelfLearningLoop({
                name,
                dayState: evolvedDayState,
                mode: window.mtosAdaptiveMode?.mode || "UNKNOWN",
                attractorType: window.mtosAttractorState?.type || "unknown",
                forecastStats,
                autoModeFeedback
            })
            : {
                state: window.mtosLearningState || {
                    totalSteps: 0,
                    successfulSteps: 0,
                    failedSteps: 0,
                    modeStats: {},
                    attractorStats: {},
                    history: []
                },
                signal: 0
            };

    window.mtosLearningState = learningUpdate.state;
    window.mtosLearningSignal = learningUpdate.signal;

    if (learningUpdate.signal >= 0.20 && window.mtosAdaptiveMode?.mode) {
        registerModeFeedback(window.mtosAdaptiveMode.mode, true, evolvedDayState);
    } else if (learningUpdate.signal <= -0.20 && window.mtosAdaptiveMode?.mode) {
        registerModeFeedback(window.mtosAdaptiveMode.mode, false, evolvedDayState);
    }

    logEvent("day_state", {
        userKin,
        dayIndex: evolvedDayState?.dayIndex,
        dayLabel: evolvedDayState?.dayLabel,
        dayScore: evolvedDayState?.dayScore,
        attention: evolvedDayState?.attention,
        activity: evolvedDayState?.activity,
        pressure: evolvedDayState?.pressure,
        conflict: evolvedDayState?.conflict,
        field: evolvedDayState?.field,
        stability: evolvedDayState?.stability
    });

    saveAutoDailySnapshot({
        name,
        userKin,
        todayKin,
        uiMetrics,
        dayState: evolvedDayState,
        users,
        fieldState: getFieldState()
    });

    users = updated.map((u) => {
        const prev = (prevUsers || []).find((x) => x.name === u.name) || {};
        const nextKin = safeNumber(u.baseKin ?? u.kin, safeNumber(prev.baseKin ?? prev.kin, 0));

        return {
            name: u.name,
            kin: nextKin,
            baseKin: nextKin,
            phase: safeNumber(u.phase, safeNumber(prev.phase, 0)),
            weight: safeNumber(u.weight, safeNumber(prev.weight, 1)),
            goal: String(u.goal || prev.goal || "stability").toLowerCase(),
            goalWeight: safeNumber(u.goalWeight, safeNumber(prev.goalWeight, 0.65)),
            goalScore: safeNumber(u.goalScore, safeNumber(prev.goalScore, 0.5)),
            goalFeedback: String(u.goalFeedback || prev.goalFeedback || "neutral"),
            location: u.location || prev.location || "",
            city: u.city || prev.city || "",
            country: u.country || prev.country || ""
        };
    });

    setUsers(users);
    window.currentUsers = users;
    window.mtosDaySync = getDaySyncInfo(users, todayKin);

    try {
        const memoryFingerprint = JSON.stringify(Object.entries(memory).slice(0, 80));
        const usersFingerprint = JSON.stringify(
            users.map((u) => [u.name, u.kin, safeNumber(u.weight, 1), safeNumber(u.phase, 0)])
        );
        const nextNetworkSnapshotKey = usersFingerprint + "::" + memoryFingerprint;

        if (window._lastNetworkSnapshotKey !== nextNetworkSnapshotKey) {
            try {
                saveNetworkState(users, memory);
                window._lastNetworkSnapshotKey = nextNetworkSnapshotKey;
            } catch (e) {
                console.warn("saveNetworkState skipped", e);
            }
        }
    } catch (e) {
        console.warn("saveNetworkState skipped", e);
    }

    safeLogEvent("agents_update", {
        users: users,
        fieldState: getFieldState(),
        weather: weather,
        pressure: pressure,
        userKin: userKin,
        todayKin: todayKin
    });

    renderCognitiveState(
        userKin,
        todayKin,
        safeNumber(uiMetrics?.attention, 0.5),
        safeNumber(uiMetrics?.noise, 0),
        safeNumber(uiMetrics?.entropy, 0),
        safeNumber(uiMetrics?.lyapunov, 0),
        safeNumber(uiMetrics?.prediction, 0),
        safeNumber(uiMetrics?.predictability, 0),
        window.mtosDaySync,
        window.mtosDayState,
        getRenderCognitiveDeps()
    );

    renderAll(
        weather,
        weatherToday,
        pressure,
        userKin,
        todayKin,
        year,
        month,
        day,
        getRenderAllDeps()
    );

    const netRelations = Array.isArray(window.currentNetworkRelations)
        ? window.applyMTOSMemoryToRelations(window.currentNetworkRelations)
        : [];

    const relationSummary = {
        supportCount: netRelations.filter((x) => String(x.type || "").toLowerCase().includes("support")).length,
        conflictCount: netRelations.filter((x) => String(x.type || "").toLowerCase().includes("conflict")).length,
        ultraCount: netRelations.filter((x) => String(x.type || "").toLowerCase().includes("ultra")).length
    };

    if (typeof window.updateMTOSBranch === "function") {
        window.updateMTOSBranch("network", {
            relations: netRelations,
            relationSummary,
            timePressure: safeNumber(window.mtosTimePressureSummary?.value, 0)
        });
    }

    const resolvedTargets = getSafeDecisionTargets();
    const selectedTargetName = getSelectedDecisionTarget();

    const allResolvedTargets = [
        ...(Array.isArray(resolvedTargets.primary) ? resolvedTargets.primary : []),
        ...(Array.isArray(resolvedTargets.neutral) ? resolvedTargets.neutral : []),
        ...(Array.isArray(resolvedTargets.avoid) ? resolvedTargets.avoid : [])
    ];

    const selectedTarget =
        allResolvedTargets.find((x) => x.name === selectedTargetName) ||
        (resolvedTargets.primary?.[0] || resolvedTargets.neutral?.[0] || null);

    if (selectedTarget?.name) {
        setSelectedDecisionTarget(selectedTarget.name);
    }

    if (typeof window.updateMTOSBranch === "function") {
        window.updateMTOSBranch("decision", {
            ...(window.MTOS_STATE?.decision || {}),
            targets: resolvedTargets,
            selectedTarget: selectedTarget || null
        });

        window.updateMTOSBranch("collective", {
            ...(window.mtosCollectiveState || {}),
            stability: safeNumber(
                window.mtosDayState?.stability,
                safeNumber(window.mtosCollectiveState?.stability, 0.5)
            ),
            timePressure: safeNumber(
                window.mtosTimePressureSummary?.value,
                safeNumber(window.mtosCollectiveState?.timePressure, 0)
            )
        });
    }

    renderDecisionPanels();

    window._rerenderMTOS = () => {
        renderCognitiveState(
            window._userKin,
            window._todayKin,
            safeNumber(window.mtosUnifiedMetrics?.attention, 0.5),
            safeNumber(window.mtosUnifiedMetrics?.noise, 0),
            safeNumber(window.mtosUnifiedMetrics?.entropy, 0),
            safeNumber(window.mtosUnifiedMetrics?.lyapunov, 0),
            safeNumber(window.mtosUnifiedMetrics?.prediction, 0),
            safeNumber(window.mtosUnifiedMetrics?.predictability, 0),
            window.mtosDaySync || null,
            window.mtosDayState || null,
            getRenderCognitiveDeps()
        );

        renderAll(
            window._weather,
            window._weatherToday,
            window._pressure,
            window._userKin,
            window._todayKin,
            window._date.year,
            window._date.month,
            window._date.day,
            getRenderAllDeps()
        );

        const rerenderNetRelations = Array.isArray(window.currentNetworkRelations)
            ? window.applyMTOSMemoryToRelations(window.currentNetworkRelations)
            : [];

        const rerenderRelationSummary = {
            supportCount: rerenderNetRelations.filter((x) => String(x.type || "").toLowerCase().includes("support")).length,
            conflictCount: rerenderNetRelations.filter((x) => String(x.type || "").toLowerCase().includes("conflict")).length,
            ultraCount: rerenderNetRelations.filter((x) => String(x.type || "").toLowerCase().includes("ultra")).length
        };

        if (typeof window.updateMTOSBranch === "function") {
            window.updateMTOSBranch("network", {
                relations: rerenderNetRelations,
                relationSummary: rerenderRelationSummary,
                timePressure: safeNumber(window.mtosTimePressureSummary?.value, 0)
            });
        }

        const rerenderTargets = getSafeDecisionTargets();
        const rerenderSelectedName = getSelectedDecisionTarget();

        const allRerenderTargets = [
            ...(Array.isArray(rerenderTargets.primary) ? rerenderTargets.primary : []),
            ...(Array.isArray(rerenderTargets.neutral) ? rerenderTargets.neutral : []),
            ...(Array.isArray(rerenderTargets.avoid) ? rerenderTargets.avoid : [])
        ];

        const rerenderSelectedTarget =
            allRerenderTargets.find((x) => x.name === rerenderSelectedName) ||
            (rerenderTargets.primary?.[0] || rerenderTargets.neutral?.[0] || null);

        if (rerenderSelectedTarget?.name) {
            setSelectedDecisionTarget(rerenderSelectedTarget.name);
        }

        if (typeof window.updateMTOSBranch === "function") {
            window.updateMTOSBranch("decision", {
                ...(window.MTOS_STATE?.decision || {}),
                targets: rerenderTargets,
                selectedTarget: rerenderSelectedTarget || null
            });

            window.updateMTOSBranch("collective", {
                ...(window.mtosCollectiveState || {}),
                stability: safeNumber(
                    window.mtosDayState?.stability,
                    safeNumber(window.mtosCollectiveState?.stability, 0.5)
                ),
                timePressure: safeNumber(
                    window.mtosTimePressureSummary?.value,
                    safeNumber(window.mtosCollectiveState?.timePressure, 0)
                )
            });
        }

        renderDecisionPanels();

        if (typeof window.renderHistoryEfficiencyPanel === "function") {
            window.renderHistoryEfficiencyPanel("historyEfficiencyPanel");
        }
    };

    return {
        result,
        weather,
        weatherToday,
        pressure,
        userKin,
        todayKin,
        uiMetrics: window.mtosUnifiedMetrics,
        metabolicMetrics: window.mtosMetabolicMetrics,
        attractorField: window._attractorField,
        attractorState: window.mtosAttractorState,
        runAttractorState: window.mtosRunAttractorState,
        dayState: window.mtosDayState,
        decision: deepClone(window.mtosDecision || null),
        risk: deepClone(window.mtosRisk || null),
        daySync: window.mtosDaySync,
        timePressure: window.mtosTimePressure || null,
        timePressureSummary: window.mtosTimePressureSummary || null,
        fieldState: getFieldState(),
        fieldMode: getFieldMode(),
        userMeta,
        todayMeta,
        users: deepClone(users || [])
    };
}