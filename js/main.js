import { drawWeatherMap } from "./weatherMap.js"
import { drawNetwork } from "./network.js"
import { drawSeries } from "./series260.js"
import { drawPhaseSpace } from "./phaseSpace.js"
import { drawAttractor } from "./attractor.js"
import "./attractorBridge.js";
import { drawCollective } from "./collective.js"
import { drawActivity } from "./activity.js"
import { initTimeControls } from "./timeController.js"
import {
    logEvent,
    addForecast,
    resolveForecasts,
    getForecastStats,
    alreadyLoggedDailySnapshot,
    logDailySnapshot
} from "./mtos_log.js"
import { exportLog } from "./exportExperiment.js"
import { drawAttractorMap } from "./attractorMap.js"
import { drawClimateAtlas } from "./climateAtlasMap.js"
import {
    replayPlay,
    replayPause,
    replayStep,
    replaySeek,
    initReplay
} from "./replay.js"
import { drawField } from "./field.js"
window.drawField = drawField
import { KinRegistry } from "./kinRegistry.js"
import { saveNetworkState } from "./networkHistory.js"
import { drawHelix } from "./helix.js"
import { classifyUserDay } from "./dayClassifier.js"
import {
    resolveTimePressure,
    getTimePressureSummary,
    applyTimePressureToDayState,
    applyTimePressureToAttractorState
} from "./timePressure.js"
import { drawFieldLinear } from "./fieldLinear.js"
import { drawFieldTorus } from "./fieldTorus.js"
import "./stateBus.js"
import "./eventEngine.js"
import "./memoryLoop.js"
import { renderDecisionSummaryPanel } from "./decisionSummaryPanel.js"
import { resolveTodayMode } from "./decisionEngine.js"
import { renderTodayPanel } from "./todayPanel.js"
import { renderHumanLayerV2 } from "./humanLayer.js"
import { resolveStateIndex, buildAdaptiveModelDynamic } from "./stateResolution.js"
import {
  interpretMTOSState,
  renderInterpretationPanel,
  renderLiteInterpretationPanel
} from "./interpretationEngine.js";
import { renderSystemDecisionMetrics } from "./systemDecisionMetrics.js"
import { renderDecisionMetrics } from "./decisionMetrics.js"
import {
  MTOS_LANG_KEY,
  mtosTranslations,
  updateStaticTexts,
  loadMTOSLang,
  saveMTOSLang,
  MTOS_I18N,
  t,
  setStatusText,
  translateModeLabel,
  translateRelationLabel,
  translateRiskLabel,
  formatI18n,
  applyMTOSLang
} from "./mtosUI/mtosI18n.js";
import {
  MTOS_VIEW_MODE_KEY,
  loadMTOSViewMode,
  saveMTOSViewMode,
  applyMTOSViewMode
} from "./mtosUI/mtosViewMode.js";
import {
  MTOS_ATTRACTOR_MODE_KEY,
  loadAttractorMode,
  saveAttractorMode,
  ensureAttractorToggle
} from "./mtosUI/mtosAttractorMode.js";
import {
  getStableAnonId,
  getIdentityMap,
  getUserId,
  getUserNameById,
  getRelationIdsFromNames,
  findUserById,
  findUserByNameOrId,
  sanitizeLogUsers,
  sanitizeLogRelationId,
  safeLogEvent,
  sanitizeStoredUserList,
  sanitizeTodayContactsDB,
  sanitizeHumanFeedbackDB,
  sanitizeRelationFeedbackDB,
  sanitizeDailySnapshots,
  sanitizeMemoryLayers,
  migratePrivacyStorage
} from "./mtosState/mtosPrivacy.js";
import {
  loadUsers,
  saveUsers,
  addUser,
  removeUser,
  undo
} from "./mtosState/mtosUsers.js";
import {
  removeConnectionHard,
  removeConnection,
  addConnection,
  lockConnection
} from "./mtosState/mtosRelations.js";
import {
  MTOS_TODAY_CONTACTS_KEY,
  MTOS_CONTACT_TTL_MS,
  getDayKeyFromParts,
  loadTodayContactsDB,
  saveTodayContactsDB,
  makePairKey,
  cleanupExpiredTodayContacts,
  findActiveTodayContactRecord,
  loadTodayContacts,
  isTodayContact,
  markTodayContact,
  unmarkTodayContact,
  buildEffectiveRelationMemory
} from "./mtosState/mtosContacts.js";
import {
  MTOS_AUTO_FEEDBACK_KEY,
  MTOS_RELATION_FEEDBACK_KEY,
  MTOS_FEEDBACK_ACK_KEY,
  loadHumanFeedback,
  saveHumanFeedback,
  getHumanFeedbackFor,
  setHumanFeedbackFor,
  loadRelationFeedback,
  saveRelationFeedback,
  getRelationFeedbackKey,
  setRelationFeedbackFor,
  getRelationFeedbackFor,
  getRelationFeedbackScalar,
  getFeedbackAck,
  registerMTOSOutcome
} from "./mtosState/mtosFeedback.js";
import {
  MTOS_MEMORY_KEY,
  loadMemoryLayers,
  saveMemoryLayers,
  getUserMemoryEntry,
  updateMemoryLayers,
  getMemoryInfluence,
  loadDayEvolutionMemory,
  saveDayEvolutionMemory
} from "./mtosState/mtosMemory.js";
import {
  MODE_ADAPT_KEY,
  AUTO_MODE_FEEDBACK_KEY,
  clampBias,
  loadModeAdaptation,
  saveModeAdaptation,
  getAdaptiveRecommendedMode,
  registerModeFeedback,
  loadAutoModeFeedbackState,
  saveAutoModeFeedbackState,
  getAutoModeStamp,
  inferAutomaticModeFeedback,
  applyAutomaticModeFeedback,
  applyFeedbackToDecision,
  getRecommendedMode,
  getModeDescription,
  getModeActionGuide,
  getDecisionOutput
} from "./mtosState/mtosAdaptive.js";
import {
  MTOS_SELECTED_TARGET_KEY,
  getSelectedDecisionTarget,
  setSelectedDecisionTarget
} from "./mtosState/mtosSelection.js";
import {
  resolveDecisionTargetsLocal,
  renderFieldTensionPanel,
  renderDecisionTargetsPanel,
  renderActionTracePanel,
  renderSystemEventsPanel,
  renderSystemDecisionPanel,
  renderHistoryEfficiencyPanel
} from "./mtosUI/mtosPanels.js";
import {
  clamp01,
  safeText,
  safeNum,
  wrapPhaseDelta,
  phaseAlignmentScore,
  phaseLinkMod,
  clampMetric
} from "./mtosUtils/mtosMath.js";
import {
  toPython,
  runPythonJson,
  loadEngineCode
} from "./mtosUtils/mtosPython.js";
import {
  interpretMetric,
  buildUnifiedMetrics,
  buildMetabolicMetrics
} from "./mtosUtils/mtosMetrics.js";
import {
  renderMTOSInterpretation,
  renderCognitiveState,
  renderAll
} from "./mtosCore/mtosRender.js";
import {
  shiftWeatherArray,
  createTimeStepRunner
} from "./mtosCore/mtosTimeStep.js";
import { createMainRunCore } from "./mtosCore/mtosRunner.js";
import { createMTOSInitializer } from "./mtosCore/mtosInit.js";
import {
  MTOS_GLOBALS,
  bindGlobalLog,
  bindGlobalHistoryStack,
  getPyodide,
  setPyodide,
  getHistoryStack,
  setHistoryStack,
  getFieldState,
  setFieldState,
  getFieldMode,
  setFieldMode,
  getUsers,
  setUsers,
  getSelectedAgent,
  setSelectedAgent,
  getSelectedKin,
  setSelectedKin,
  getSelectionMemory,
  setSelectionMemory
} from "./mtosCore/mtosGlobals.js";

window.rebuildNetworkRelations = function () {
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")

    const users = Array.isArray(window.currentUsers) ? window.currentUsers : []

    const relations = []

    for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
            const a = users[i].name
            const b = users[j].name

            const val = Number(memory[a + "->" + b] ?? 0)

            if (val !== 0) {
                relations.push({
                    source: a,
                    target: b,
                    value: val
                })
            }
        }
    }

    window.currentNetworkRelations = relations
}

window.renderDecisionMetrics = renderDecisionMetrics;

bindGlobalLog(logEvent);
bindGlobalHistoryStack(MTOS_GLOBALS);

function getCurrentUserName() {
    const el = document.getElementById("name")
    return (el?.value || "").trim()
}

function getCurrentRunDay() {
    const year = Number(document.getElementById("year")?.value || 0)
    const month = Number(document.getElementById("month")?.value || 0)
    const day = Number(document.getElementById("day")?.value || 0)

    if (!year || !month || !day) {
        return new Date().toISOString().slice(0, 10)
    }

    const mm = String(month).padStart(2, "0")
    const dd = String(day).padStart(2, "0")

    return `${year}-${mm}-${dd}`
}

window.getCurrentUserName = getCurrentUserName
window.getCurrentRunDay = getCurrentRunDay
window.getUsers = () => getUsers(MTOS_GLOBALS)

window.MTOS_TODAY_CONTACTS_KEY = MTOS_TODAY_CONTACTS_KEY
window.MTOS_CONTACT_TTL_MS = MTOS_CONTACT_TTL_MS
window.isTodayContact = isTodayContact
window.loadTodayContacts = loadTodayContacts
window.getRelationIdsFromNames = getRelationIdsFromNames
window.getUserId = getUserId

function computeFeedbackStateSignature() {
    const day = getCurrentRunDay()
    const name = getCurrentUserName()

    let human = null
    let relation = null
    let auto = null
    let selectedTarget = null

    try {
        human = typeof getHumanFeedbackFor === "function"
            ? getHumanFeedbackFor(day, name)
            : null
    } catch (e) {
        human = null
    }

    try {
        selectedTarget = typeof getSelectedDecisionTarget === "function"
            ? getSelectedDecisionTarget()
            : null
    } catch (e) {
        selectedTarget = null
    }

    try {
        relation = (
            selectedTarget &&
            typeof getRelationFeedbackFor === "function"
        )
            ? getRelationFeedbackFor(name, selectedTarget, day)
            : null
    } catch (e) {
        relation = null
    }

    try {
        auto = window.mtosAutoFeedbackRow || null
    } catch (e) {
        auto = null
    }

    return JSON.stringify({
        day,
        name,
        selectedTarget: selectedTarget || null,
        humanScore: Number(human?.score ?? human?.value ?? 0),
        humanLabel: String(human?.label ?? human?.state ?? ""),
        relationScore: Number(relation?.score ?? relation?.value ?? 0),
        relationLabel: String(relation?.label ?? relation?.state ?? ""),
        autoScore: Number(auto?.autoScore ?? 0),
        autoLabel: String(auto?.label ?? auto?.result ?? "")
    })
}

function enrichSnapshotsWithFeedbackContext(rows = []) {
    if (!Array.isArray(rows)) return []

    return rows.map(row => {
        const safeRow = row && typeof row === "object" ? { ...row } : {}

        const day =
            safeRow.day ||
            safeRow.date ||
            getCurrentRunDay()

        const userName =
            safeRow.name ||
            safeRow.user ||
            getCurrentUserName()

        let feedback = null
        try {
            feedback = typeof getHumanFeedbackFor === "function"
                ? getHumanFeedbackFor(day, userName)
                : null
        } catch (e) {
            feedback = null
        }

        return {
            ...safeRow,
            feedbackLabel: String(feedback?.label ?? feedback?.state ?? ""),
            feedbackScore: Number(feedback?.score ?? feedback?.value ?? 0),
            feedbackAt: Number(feedback?.t ?? 0)
        }
    })
}

function calcModeStats(rows = []) {
    const stats = {
        FOCUS: { total: 0, good: 0, neutral: 0, bad: 0 },
        ADJUST: { total: 0, good: 0, neutral: 0, bad: 0 },
        REST: { total: 0, good: 0, neutral: 0, bad: 0 },
        EXPLORE: { total: 0, good: 0, neutral: 0, bad: 0 },
        INTERACT: { total: 0, good: 0, neutral: 0, bad: 0 },
        UNKNOWN: { total: 0, good: 0, neutral: 0, bad: 0 }
    }

    if (!Array.isArray(rows)) return stats

    rows.forEach(row => {
        const mode = String(
            row?.recommendedMode ||
            row?.decisionMode ||
            "UNKNOWN"
        ).toUpperCase()

        const bucket = stats[mode] || stats.UNKNOWN
        bucket.total += 1

        const label = String(
            row?.feedbackLabel ||
            row?.feedback ||
            ""
        ).toLowerCase()

        const score = Number(row?.feedbackScore ?? row?.behaviorEfficiency ?? 0)

        if (label.includes("good") || label.includes("хорош") || score > 0.2) {
            bucket.good += 1
        } else if (label.includes("bad") || label.includes("плох") || score < -0.2) {
            bucket.bad += 1
        } else {
            bucket.neutral += 1
        }
    })

    return stats
}

window.computeFeedbackStateSignature = computeFeedbackStateSignature
window.enrichSnapshotsWithFeedbackContext = enrichSnapshotsWithFeedbackContext
window.calcModeStats = calcModeStats

function storeAutoFeedbackForCurrentRun(payload = {}) {
    try {
        window.mtosAutoFeedbackRow = {
            ...(window.mtosAutoFeedbackRow || {}),
            ...payload,
            savedAt: Date.now()
        }
        return window.mtosAutoFeedbackRow
    } catch (e) {
        return null
    }
}

window.storeAutoFeedbackForCurrentRun = storeAutoFeedbackForCurrentRun

function deriveAttractorFromResolvedState(){
    const state = Number(window.mtosResolvedState ?? 0)
    const N = Math.max(1, Number(window._adaptiveModel?.N ?? 36))
    const diversity = Math.max(0, Math.min(1, Number(window._adaptiveModel?.diversity ?? 0)))

    const ratio = Math.max(0, Math.min(1, state / N))

    let type = "unknown"

    if (ratio <= 0.20) {
        type = "stable"
    } else if (ratio <= 0.45) {
        type = "trend"
    } else if (ratio <= 0.75) {
        type = "cycle"
    } else {
        type = "chaos"
    }

    let intensity =
        0.30 +
        diversity * 0.45 +
        Math.abs(ratio - 0.5) * 0.50

    intensity = Math.max(0, Math.min(1, intensity))

    return {
        type,
        intensity: Number(intensity.toFixed(3)),
        score: Number(ratio.toFixed(3)),
        updatedAt: new Date().toISOString()
    }
}

function applyResolvedStateToAttractorMatrix(matrix, attractor = window.mtosAttractorState){
    if (!Array.isArray(matrix) || !matrix.length) return matrix

    const type = String(attractor?.type || "unknown").toLowerCase()
    const intensity = Math.max(0, Math.min(1, Number(attractor?.intensity ?? 0)))

    return matrix.map((value, i) => {
        let x = Number(value ?? 0)
        const colBand = (i % 20) / 19
        const rowBand = Math.floor(i / 20) / 19

        if (type === "stable") {
            x = x * (0.94 - 0.18 * intensity) + 0.05 * intensity
        }
        else if (type === "trend") {
            const push = ((colBand * 0.7) + (rowBand * 0.3)) - 0.5
            x = x + push * 0.25 * intensity
        }
        else if (type === "cycle") {
            x = x + Math.sin((i / 20) * Math.PI * 2) * 0.14 * intensity
        }
        else if (type === "chaos") {
            x = x + (0.5 - 0.5) * 0.28 * intensity
        }

        return Math.max(0, Math.min(1, x))
    })
}

const MTOS_WEATHER_MEMORY_KEY = "mtos_weather_memory_v1"

function loadWeatherMemory() {
    try {
        const raw = localStorage.getItem(MTOS_WEATHER_MEMORY_KEY)
        const parsed = raw ? JSON.parse(raw) : null

        if (Array.isArray(parsed) && parsed.length === 260) {
            return parsed.map(cell => ({
                attention: Math.max(0, Math.min(1, Number(cell?.attention ?? 0.5))),
                activity: Math.max(0, Math.min(1, Number(cell?.activity ?? 0.5))),
                pressure: Math.max(0, Math.min(1, Number(cell?.pressure ?? 0))),
                conflict: Math.max(0, Math.min(1, Number(cell?.conflict ?? 0)))
            }))
        }
    } catch (e) {}

    return new Array(260).fill(0).map(() => ({
        attention: 0.5,
        activity: 0.5,
        pressure: 0,
        conflict: 0
    }))
}

function saveWeatherMemory(memory) {
    try {
        if (!Array.isArray(memory) || memory.length !== 260) return
        localStorage.setItem(MTOS_WEATHER_MEMORY_KEY, JSON.stringify(memory))
    } catch (e) {}
}

function wrapWeatherIndex(i) {
    let x = i % 260
    if (x < 0) x += 260
    return x
}

function evolveWeatherWithMemory(newWeather, prevMemory = null) {
    if (!Array.isArray(newWeather) || newWeather.length !== 260) return newWeather

    const prev = Array.isArray(prevMemory) && prevMemory.length === 260
        ? prevMemory
        : loadWeatherMemory()

    return newWeather.map((cell, i) => {
        const oldCell = prev[i] || {}

        const attention =
            Number(oldCell.attention ?? 0.5) * 0.85 +
            Number(cell?.attention ?? 0.5) * 0.15

        const activity =
            Number(oldCell.activity ?? 0.5) * 0.82 +
            Number(cell?.activity ?? cell?.attention ?? 0.5) * 0.18

        const pressure =
            Number(oldCell.pressure ?? 0) * 0.88 +
            Number(cell?.pressure ?? 0) * 0.12

        const conflict =
            Number(oldCell.conflict ?? 0) * 0.90 +
            Number(cell?.conflict ?? 0) * 0.10

        return {
            attention: Math.max(0, Math.min(1, attention)),
            activity: Math.max(0, Math.min(1, activity)),
            pressure: Math.max(0, Math.min(1, pressure)),
            conflict: Math.max(0, Math.min(1, conflict))
        }
    })
}

function diffuseWeather(weather) {
    if (!Array.isArray(weather) || weather.length !== 260) return weather

    return weather.map((cell, i) => {
        const left = weather[wrapWeatherIndex(i - 1)] || cell
        const right = weather[wrapWeatherIndex(i + 1)] || cell
        const jump13a = weather[wrapWeatherIndex(i - 13)] || cell
        const jump13b = weather[wrapWeatherIndex(i + 13)] || cell
        const jump20a = weather[wrapWeatherIndex(i - 20)] || cell
        const jump20b = weather[wrapWeatherIndex(i + 20)] || cell

        function mix(key, fallback = 0) {
            const self = Number(cell?.[key] ?? fallback)
            return (
                self * 0.58 +
                Number(left?.[key] ?? self) * 0.10 +
                Number(right?.[key] ?? self) * 0.10 +
                Number(jump13a?.[key] ?? self) * 0.07 +
                Number(jump13b?.[key] ?? self) * 0.07 +
                Number(jump20a?.[key] ?? self) * 0.04 +
                Number(jump20b?.[key] ?? self) * 0.04
            )
        }

        return {
            attention: Math.max(0, Math.min(1, mix("attention", 0.5))),
            activity: Math.max(0, Math.min(1, mix("activity", 0.5))),
            pressure: Math.max(0, Math.min(1, mix("pressure", 0))),
            conflict: Math.max(0, Math.min(1, mix("conflict", 0)))
        }
    })
}

function buildFeedbackBias(name, todayKin, weather) {
    if (!Array.isArray(weather) || weather.length !== 260) return weather

    const day = getCurrentRunDay()
    const feedback = getHumanFeedbackFor(day, name)

    const score = Number(
        feedback?.score ??
        feedback?.value ??
        window.mtosAutoFeedbackRow?.autoScore ??
        0
    )

    if (Math.abs(score) < 0.01) return weather

    const center = Math.max(0, Math.min(259, Number(todayKin) - 1))

    return weather.map((cell, i) => {
        const dist = Math.min(
            Math.abs(i - center),
            260 - Math.abs(i - center)
        )

        const local = Math.max(0, 1 - dist / 12)

        let attention = Number(cell?.attention ?? 0.5)
        let activity = Number(cell?.activity ?? 0.5)
        let pressure = Number(cell?.pressure ?? 0)
        let conflict = Number(cell?.conflict ?? 0)

        if (score > 0) {
            attention += 0.20 * local * score
            activity += 0.18 * local * score
            pressure -= 0.12 * local * score
            conflict -= 0.15 * local * score
        } else {
            const s = Math.abs(score)
            attention -= 0.03 * local * s
            activity -= 0.02 * local * s
            pressure += 0.05 * local * s
            conflict += 0.06 * local * s
        }

        return {
            attention: Math.max(0, Math.min(1, attention)),
            activity: Math.max(0, Math.min(1, activity)),
            pressure: Math.max(0, Math.min(1, pressure)),
            conflict: Math.max(0, Math.min(1, conflict))
        }
    })
}

// ===============================
// INIT
// ===============================
export async function initMTOS() {
    const initResult = await createMTOSInitializer({
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

    historyStack: getHistoryStack(MTOS_GLOBALS),
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

    getRelationFeedbackKey,
    inferAutomaticModeFeedback,
    getAutoModeStamp
});

setPyodide(initResult.pyodide, MTOS_GLOBALS);
}

function applyTodayContactsToAttractorField(field, users, dayKey = null) {
    if (!Array.isArray(field) || !users || !window.loadTodayContacts) {
        return field
    }

    const boosted = [...field]
    const contacts = window.loadTodayContacts(dayKey)
    const byId = new Map()

    users.forEach(u => {
        const id = typeof window.getUserId === "function" ? window.getUserId(u.name) : u.name
        if (id) byId.set(id, u)
    })

    Object.values(contacts || {}).forEach(item => {
        const a = byId.get(item.user_a_id)
        const b = byId.get(item.user_b_id)

        if (a && Number.isFinite(a.kin) && a.kin >= 1 && a.kin <= 260) {
            boosted[a.kin - 1] = Math.min(1, Number(boosted[a.kin - 1] ?? 0.5) + 0.12)
        }

        if (b && Number.isFinite(b.kin) && b.kin >= 1 && b.kin <= 260) {
            boosted[b.kin - 1] = Math.min(1, Number(boosted[b.kin - 1] ?? 0.5) + 0.12)
        }
    })

    return boosted
}

function classifyRelation(score){
    if (score >= 0.6) return "ultra"
    if (score >= 0.15) return "support"
    if (score <= -0.15) return "conflict"
    return "neutral"
}

window.classifyRelation = classifyRelation

function applyTodayContactsToDayState(dayState, users, dayKey = null){
    const ds = dayState && typeof dayState === "object"
        ? { ...dayState }
        : {}

    const contacts = loadTodayContacts(dayKey)
    const activePairs = Object.values(contacts || {}).filter(Boolean)

    if (!activePairs.length) {
        ds.realContacts = 0
        ds.realContactWeight = 0
        return ds
    }

    let totalWeight = 0
    let hits = 0

    activePairs.forEach(item => {
        const weight = Number(item?.weight ?? 1)
        totalWeight += weight

        const a = String(item?.user_a_id || item?.a || "")
        const b = String(item?.user_b_id || item?.b || "")

if (
    findUserById(users, a) &&
    findUserById(users, b)
) {
    hits += 1
}
    })

    ds.realContacts = hits
    ds.realContactWeight = Number(totalWeight.toFixed(3))

    ds.field = Math.max(0, Math.min(1, Number(ds.field ?? 0.5) + hits * 0.04 + totalWeight * 0.03))
    ds.stability = Math.max(0, Math.min(1, Number(ds.stability ?? 0.5) + hits * 0.03))
    ds.dayIndex = Number(Math.max(-1, Math.min(1, Number(ds.dayIndex ?? 0) + hits * 0.05)).toFixed(3))

    if (hits > 0) {
        ds.dayDesc = String(ds.dayDesc || "") + ` Real contacts today: ${hits}.`
    }

    return ds
}

window.applyTodayContactsToDayState = applyTodayContactsToDayState

window.applyTodayContactsToAttractorField = applyTodayContactsToAttractorField

function saveAutoDailySnapshot({
    name,
    userKin,
    todayKin,
    uiMetrics,
    dayState,
    users,
    fieldState
}) {
    const day = new Date().toISOString().slice(0, 10)

    const userId = getStableAnonId(name)
const feedback = getHumanFeedbackFor(day, name)

if (!name || !userId || !userKin || !todayKin || !uiMetrics || !dayState) {
    return
}

if (alreadyLoggedDailySnapshot(day, userId, userKin)) {
    return
}

const snapshot = {
    t: Date.now(),
    day,
    user_id: userId,

        userKin,
        todayKin,

        dayLabel: dayState.dayLabel ?? "UNKNOWN",
        dayIndex: Number(dayState.dayIndex ?? 0),
        dayScore: Number(dayState.dayScore ?? 0),

        recommendedMode:
    window.mtosAdaptiveMode?.mode ||
    (typeof window.getRecommendedMode === "function"
        ? window.getRecommendedMode(dayState)
        : "UNKNOWN"),

decisionMode: String(window.mtosDecision?.mode || "UNKNOWN"),
decisionRisk: String(window.mtosDecision?.risk || "LOW"),
decisionText: String(window.mtosDecision?.text || ""),
feedbackAdjusted: Boolean(window.mtosDecision?.feedbackAdjusted || false),
feedbackReason: String(window.mtosDecision?.feedbackReason || ""),
feedbackAt: Number(feedback?.t || 0),

attention: Number(uiMetrics.attention ?? 0),
noise: Number(uiMetrics.noise ?? 0),
entropy: Number(uiMetrics.entropy ?? 0),
lyapunov: Number(uiMetrics.lyapunov ?? 0),
prediction: Number(uiMetrics.prediction ?? 0),

systemPredictability: Number(uiMetrics.predictability ?? 0),
behaviorEfficiency: Number(
    feedback?.autoScore ??
    window.mtosAutoFeedbackRow?.autoScore ??
    0
),
predictability: Number(uiMetrics.predictability ?? 0),

        attractorType: String(window.mtosAttractorState?.type ?? "unknown"),
        attractorIntensity: Number(window.mtosAttractorState?.intensity ?? 0),
        attractorScore: Number(window.mtosAttractorState?.score ?? 0),

        networkTotalLinks: Number(window.mtosNetworkFeedback?.totalLinks ?? 0),
        networkDensity: Number(window.mtosNetworkFeedback?.density ?? 0),
        networkMeanStrength: Number(window.mtosNetworkFeedback?.meanStrength ?? 0),
        networkConflictRatio: Number(window.mtosNetworkFeedback?.conflictRatio ?? 0),
        networkSupportRatio: Number(window.mtosNetworkFeedback?.supportRatio ?? 0),

        timePressure: Number(window.mtosTimePressureSummary?.value ?? 0),
        timePressureLabel: String(window.mtosTimePressureSummary?.label ?? "low"),
        temporalMode: String(window.mtosTimePressureSummary?.temporalMode ?? "EXPLORE"),

        usersCount: Array.isArray(users) ? users.length : 0,
        fieldMode: fieldState ? "active" : "none"
    }

    logDailySnapshot(snapshot)
}

let __mtosRunning = false

window.requestMTOSRun = function (reason = "manual") {
    if (__mtosRunning) return

    __mtosRunning = true

    Promise.resolve().then(() => {
        runMTOS(reason)
    }).finally(() => {
        __mtosRunning = false
    })
}

export async function runMTOS() {

    // --- FIX: стабилизация состояния ---
if (!window.__mtos_state) {
  window.__mtos_state = null;
}

window.mtosMetabolicMetrics = {
    P: 0.5,
    V: 1.0,
    T: 0.5,
    phi: 0.5,
    k: 1.0,
    consistency: 0.5,
    stability: 0.5,
    pressureSeries: [],
    temperatureSeries: [],
    phiSeries: [],
    kSeries: [],
    consistencySeries: [],
    stabilitySeries: []
}

    const name = document.getElementById("name").value.trim()
    const year = +document.getElementById("year").value
    const month = +document.getElementById("month").value
    const day = +document.getElementById("day").value

    const persistedUsers = Array.isArray(loadUsers()) ? loadUsers() : []

;[...persistedUsers, name]
    .map(x => String(x || "").trim())
    .filter(Boolean)
    .forEach(userName => {
        getStableAnonId(userName)
        getUserId(userName)
    })

const runtimeKey = `${name}_${year}_${month}_${day}`

window._mtosRunCache = window._mtosRunCache || {}

const forceFreshRun = !!window.__mtos_force_fresh_run;
window.__mtos_force_fresh_run = false;

if (window._mtosRunCache[runtimeKey] && !forceFreshRun) {
        const cached = window._mtosRunCache[runtimeKey]

        window._weather = cached.weather
        window._weatherToday = cached.weatherToday
        window._pressure = cached.pressure
        window._userKin = cached.userKin
        window._todayKin = cached.todayKin
        window._date = { year, month, day }
        window._attractorField = cached.attractorField || []
        window.mtosDayState = cached.dayState || null

        window.mtosDecision = cached.decision
    ? JSON.parse(JSON.stringify(cached.decision))
    : applyFeedbackToDecision(
        resolveTodayMode(
            cached.dayState || {},
            cached.timePressureSummary || window.mtosTimePressureSummary || {},
            window.mtosMemoryLayers || loadMemoryLayers()
        ),
        name,
        cached.dayState || {}
    )

window.mtosRisk = window.mtosDecision?.risk || null

        const resolutionMode = "adaptive" // "iching" | "tzolkin" | "adaptive"

if (!window._adaptiveModel && Array.isArray(cached.weather) && cached.weather.length) {
    window._adaptiveModel = buildAdaptiveModelDynamic(cached.weather, {
        entropy: Number(cached.uiMetrics?.entropy ?? 0.5),
        T: Number(cached.metabolicMetrics?.T ?? 0.5),
        pressure: Number(window.mtosDayState?.pressure ?? 0.5),
        conflict: Number(window.mtosDayState?.conflict ?? 0)
    })
}

window.mtosResolvedState = resolveStateIndex({
    kin: cached.userKin,
    attention: Number(window.mtosDayState?.attention ?? 0.5),
    pressure: Number(window.mtosDayState?.pressure ?? 0),
    conflict: Number(window.mtosDayState?.conflict ?? 0),
    field: Number(window.mtosDayState?.field ?? 0.5),
    mode: resolutionMode,
    adaptiveCache: window._adaptiveModel
})

        window.mtosResolutionMode = resolutionMode
window.mtosRunAttractorState = cached.runAttractorState || deriveAttractorFromResolvedState()
window.mtosAttractorState = window.mtosRunAttractorState
window.mtosUnifiedMetrics = cached.uiMetrics || null
        window.mtosDaySync = cached.daySync || null
        window.currentUsers = JSON.parse(JSON.stringify(Array.isArray(cached.users) ? cached.users : []))

        const safeCachedFieldMode = typeof cached.fieldMode === "string" && cached.fieldMode
    ? cached.fieldMode
    : "global";

drawField(
    "fieldMap",
    Array.isArray(cached.users) ? cached.users : [],
    safeCachedFieldMode,
    Array.isArray(cached.weather) ? cached.weather : [],
    Array.isArray(cached.attractorField) ? cached.attractorField : []
);

        window.mtosMetabolicMetrics = cached.metabolicMetrics || {
    P: 0.5,
    V: 1.0,
    T: 0.5,
    phi: 0.5,
    k: 1.0,
    consistency: 0.5,
    stability: 0.5,
    pressureSeries: [],
    temperatureSeries: [],
    phiSeries: [],
    kSeries: [],
    consistencySeries: [],
    stabilitySeries: []
}

        window.mtosTimePressure = cached.timePressure || null
        window.mtosTimePressureSummary = cached.timePressureSummary || {
        value: 0,
        label: "low",
        temporalMode: "EXPLORE"
    }

        window.mtosUserMeta = cached.userMeta || null
        window.mtosTodayMeta = cached.todayMeta || null

        setFieldState(cached.fieldState || null, MTOS_GLOBALS)
        setFieldMode(cached.fieldMode || null, MTOS_GLOBALS)
        setUsers(cached.users || [], MTOS_GLOBALS)

        renderCognitiveState(
    cached.userKin,
    cached.todayKin,
    cached.uiMetrics?.attention,
    cached.uiMetrics?.noise,
    cached.uiMetrics?.entropy,
    cached.uiMetrics?.lyapunov,
    cached.uiMetrics?.prediction,
    cached.uiMetrics?.predictability,
    window.mtosDaySync,
    window.mtosDayState,
    {
        renderHumanLayer: typeof renderHumanLayer !== "undefined" ? renderHumanLayer : null,
        getCurrentUserName,
        getCurrentRunDay,
        getDecision: () => window.mtosDecision || {},
        getRunAttractorState: () => window.mtosRunAttractorState || window.mtosAttractorState || {},
        getTimePressureSummary: () => window.mtosTimePressureSummary || {},
        getForecastStats: () => window.mtosForecastStats || {},
        getFeedback: () => getHumanFeedbackFor(getCurrentRunDay(), getCurrentUserName()),
        getMetabolic: () => window.mtosMetabolicMetrics || {}
    }
)

        renderAll(
    cached.weather,
    cached.weatherToday,
    cached.pressure,
    cached.userKin,
    cached.todayKin,
    year,
    month,
    day,
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
)

if (window.mtosDecision) {
    window.updateMTOSBranch("decision", {
        mode: String(window.mtosDecision?.mode || "EXPLORE"),
action: String(window.mtosDecision?.action || window.mtosDecision?.text || ""),
reason: String(
    window.mtosDecision?.feedbackReason ||
    window.mtosDecision?.reason ||
    window.mtosDecision?.why ||
    ""
),
        confidence: Math.round(
            Math.max(0, Math.min(1, Number(window.mtosDecision?.confidence ?? 0.5))) * 100
        ),
        extraMetrics: window.mtosDecision?.extraMetrics || [
    {
        labelKey: "metrics_step2_title",
        valueKey: "metrics_step2_value",
        noteKey: "metrics_step2_note"
    }
],
        targets: { primary: [], avoid: [], neutral: [] },
        source: "human_decision_layer_cache",
        createdAt: new Date().toISOString()
    })
}

        const netRelations = Array.isArray(window.currentNetworkRelations)
    ? window.applyMTOSMemoryToRelations(window.currentNetworkRelations)
    : []

const relationSummary = {
    supportCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("support")).length,
    conflictCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("conflict")).length,
    ultraCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("ultra")).length
}

window.updateMTOSBranch("network", {
    relations: netRelations,
    relationSummary,
    timePressure: Number(window.mtosTimePressureSummary?.value ?? 0)
})

const resolvedCacheTargets = typeof window.resolveDecisionTargets === "function"
    ? window.resolveDecisionTargets()
    : { primary: [], avoid: [], neutral: [] }

const cacheSelectedName = getSelectedDecisionTarget()

const allCacheTargets = [
    ...(Array.isArray(resolvedCacheTargets.primary) ? resolvedCacheTargets.primary : []),
    ...(Array.isArray(resolvedCacheTargets.neutral) ? resolvedCacheTargets.neutral : []),
    ...(Array.isArray(resolvedCacheTargets.avoid) ? resolvedCacheTargets.avoid : [])
]

const cacheSelectedTarget =
    allCacheTargets.find(x => x.name === cacheSelectedName) ||
    (resolvedCacheTargets.primary?.[0] || resolvedCacheTargets.neutral?.[0] || null)

if (cacheSelectedTarget?.name) {
    setSelectedDecisionTarget(cacheSelectedTarget.name)
}

window.updateMTOSBranch("decision", {
    ...(window.MTOS_STATE?.decision || {}),
    targets: resolvedCacheTargets,
    selectedTarget: cacheSelectedTarget || null
})

renderDecisionSummaryPanel("humanLayer")

window.updateMTOSBranch("collective", {
    ...(window.mtosCollectiveState || {}),
    stability: Number(window.mtosDayState?.stability ?? window.mtosCollectiveState?.stability ?? 0.5),
    timePressure: Number(window.mtosTimePressureSummary?.value ?? window.mtosCollectiveState?.timePressure ?? 0)
})

window.evaluateMTOSEvents()
window.commitMTOSDecisionToMemory()

const i18n = getLiveI18nDeps();

renderSystemEventsPanel({
    ...i18n,
    getState: () => window.MTOS_STATE || {}
});

renderSystemDecisionPanel({
    ...i18n,
    renderSystemDecisionMetrics,
    getState: () => window.MTOS_STATE || {}
});

renderDecisionTargetsPanel({
    t: i18n.t,
    getState: () => window.MTOS_STATE || {},
    getSelectedDecisionTarget,
    setSelectedDecisionTarget,
    resolveDecisionTargets: () => resolveDecisionTargetsLocal({
        t: i18n.t,
        getCurrentUserName,
        getSelectedDecisionTarget,
        getState: () => window.MTOS_STATE || {},
        getDecision: () => window.mtosDecision || {},
        getRelations: () => window.currentNetworkRelations || []
    }),
    renderDecisionSummaryPanel: (targetId = "humanLayer") => renderDecisionSummaryPanel(targetId),
    renderSystemDecisionPanel: () => renderSystemDecisionPanel({
        ...i18n,
        renderSystemDecisionMetrics,
        getState: () => window.MTOS_STATE || {}
    }),
    renderActionTracePanel: () => renderActionTracePanel({
        ...i18n,
        getDecision: () => window.mtosDecision || {},
        getDayState: () => window.mtosDayState || {},
        getTimePressureSummary: () => window.mtosTimePressureSummary || {},
        getState: () => window.MTOS_STATE || {}
    })
});

renderFieldTensionPanel({
    t: i18n.t,
    getDayState: () => window.mtosDayState || {},
    getTimePressureSummary: () => window.mtosTimePressureSummary || {},
    getMetabolicMetrics: () => window.mtosMetabolicMetrics || {},
    getCollectiveState: () => window.mtosCollectiveState || {}
});

renderActionTracePanel({
    ...i18n,
    getDecision: () => window.mtosDecision || {},
    getDayState: () => window.mtosDayState || {},
    getTimePressureSummary: () => window.mtosTimePressureSummary || {},
    getState: () => window.MTOS_STATE || {}
});

if (typeof window.applyMTOSLang === "function") {
    window.applyMTOSLang(window.mtosLang || window.MTOS_LANG || "en");
}

        setStatusText("doneCache")
        return
    }

    if (!year || !month || !day) {
        setStatusText("enterDate")
        return
    }

    try {
        const pyodide = getPyodide(MTOS_GLOBALS)
        setStatusText("running")
        safeLogEvent("run_start", {
    name,
    birth_ymd_redacted: true
})

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

logEvent("auto_truth", truth);

const runPayload = await createMainRunCore({
    pyodide,
    name,
    year,
    month,
    day,

    getHistoryStack: () => getHistoryStack(MTOS_GLOBALS),
getUsers: () => getUsers(MTOS_GLOBALS),
setUsers: (nextUsers) => {
    setUsers(nextUsers, MTOS_GLOBALS);
},

getFieldState: () => getFieldState(MTOS_GLOBALS),
setFieldState: (nextFieldState) => {
    setFieldState(nextFieldState, MTOS_GLOBALS);
},

getFieldMode: () => getFieldMode(MTOS_GLOBALS),
setFieldMode: (nextFieldMode) => {
    setFieldMode(nextFieldMode, MTOS_GLOBALS);
},

getSelectedAgent: () => getSelectedAgent(MTOS_GLOBALS),

    logEvent,
    safeLogEvent,
    addForecast,
    getForecastStats,
    saveNetworkState,

    loadUsers,
    saveUsers,
    addUser,

    getStableAnonId,
    getDayKeyFromParts,
    buildEffectiveRelationMemory,
    findUserByNameOrId,
    findUserById,
    getRelationIdsFromNames,

    loadMemoryLayers,
    updateMemoryLayers,
    getMemoryInfluence,

    getHumanFeedbackFor,
    getSelectedDecisionTarget,
    setSelectedDecisionTarget,

    toPython,
    classifyUserDay,
    resolveDynamicDayState,
    applyTodayContactsToAttractorField,
    applyTodayContactsToDayState,
    saveAutoDailySnapshot,

    buildUnifiedMetrics,
    buildMetabolicMetrics,

    resolveTimePressure,
    getTimePressureSummary,
    applyTimePressureToDayState,

    buildAdaptiveModelDynamic,
    resolveStateIndex,
    resolveTodayMode,
    applyFeedbackToDecision,
    storeAutoFeedbackForCurrentRun,
    registerModeFeedback,
    applyAutomaticModeFeedback:
        typeof window.applyAutomaticModeFeedback === "function"
            ? window.applyAutomaticModeFeedback
            : null,
    updateSelfLearningLoop,

    getDaySyncInfo,
    renderCognitiveState,
    renderAll,
    renderDecisionSummaryPanel,
    renderDecisionTargetsPanel,
    renderFieldTensionPanel,
    renderActionTracePanel,

    deriveAttractorFromResolvedState,

    t,

    getCurrentUserName,
    getCurrentRunDay,

    getRenderAllDeps: () => ({
    getFieldState: () => getFieldState(MTOS_GLOBALS),
    getSelectedAgent: () => getSelectedAgent(MTOS_GLOBALS),
    getAttractorField: () => window._attractorField,
    getUsers: () => getUsers(MTOS_GLOBALS),
    getMatrix: () => window._matrix || null,
    renderAttractorOnly: () => window.renderAttractorOnly && window.renderAttractorOnly(),
    renderHistoryEfficiencyPanel: typeof window.renderHistoryEfficiencyPanel === "function"
        ? window.renderHistoryEfficiencyPanel
        : null
}),

    getRenderCognitiveDeps: () => ({
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
});

const {
    weather,
    weatherToday,
    pressure,
    userKin,
    todayKin,
    attractorField,
    attractorState,
    runAttractorState,
    dayState,
    decision,
    risk,
    uiMetrics,
    metabolicMetrics,
    daySync,
    timePressure,
    timePressureSummary,
    userMeta,
    todayMeta,
    users: runUsers,
    fieldState: runFieldState,
    fieldMode: runFieldMode
} = runPayload;

const prevWeatherMemory = loadWeatherMemory()
const weatherWithMemory = evolveWeatherWithMemory(weather, prevWeatherMemory)
const weatherWithDiffusion = diffuseWeather(weatherWithMemory)
const evolvedWeather = buildFeedbackBias(name, todayKin, weatherWithDiffusion)

saveWeatherMemory(evolvedWeather)

window._weather = evolvedWeather
window._weatherToday = weatherToday
window._pressure = pressure
window._userKin = userKin
window._todayKin = todayKin
window._date = { year, month, day }
window._attractorField = attractorField || []

setUsers(runUsers, MTOS_GLOBALS);
setFieldState(runFieldState, MTOS_GLOBALS);
setFieldMode(runFieldMode, MTOS_GLOBALS);

window.currentUsers = JSON.parse(JSON.stringify(Array.isArray(runUsers) ? runUsers : []));

const safeFieldMode = typeof runFieldMode === "string" && runFieldMode
    ? runFieldMode
    : "global";

drawField(
    "fieldMap",
    Array.isArray(runUsers) ? runUsers : [],
    safeFieldMode,
    Array.isArray(evolvedWeather) ? evolvedWeather : [],
    Array.isArray(attractorField) ? attractorField : []
);

window._mtosRunCache[runtimeKey] = {
    weather: evolvedWeather,
    weatherToday,
    pressure,
    userKin,
    todayKin,
    attractorField,
    attractorState,
    runAttractorState,
    dayState,
    decision,
    risk,
    uiMetrics,
    metabolicMetrics,
    daySync,
    timePressure,
    timePressureSummary,
    fieldState: runFieldState,
    fieldMode: runFieldMode,
    userMeta,
    todayMeta,
    users: JSON.parse(JSON.stringify(getUsers(MTOS_GLOBALS) || []))
};

if (window.mtosDecision) {
    window.updateMTOSBranch("decision", {
        mode: String(window.mtosDecision?.mode || "EXPLORE"),
action: String(window.mtosDecision?.action || window.mtosDecision?.text || ""),
reason: String(
    window.mtosDecision?.feedbackReason ||
    window.mtosDecision?.reason ||
    window.mtosDecision?.why ||
    ""
),
        confidence: Math.round(
            Math.max(0, Math.min(1, Number(window.mtosDecision?.confidence ?? 0.5))) * 100
        ),
        extraMetrics: window.mtosDecision?.extraMetrics || [
            {
                labelKey: "metrics_step2_title",
                valueKey: "metrics_step2_value",
                noteKey: "metrics_step2_note"
            }
        ],
        targets: { primary: [], avoid: [], neutral: [] },
        source: "human_decision_layer_run",
        createdAt: new Date().toISOString()
    })
}

const runNetRelations = Array.isArray(window.currentNetworkRelations)
    ? window.applyMTOSMemoryToRelations(window.currentNetworkRelations)
    : []

const runRelationSummary = {
    supportCount: runNetRelations.filter(x => String(x.type || "").toLowerCase().includes("support")).length,
    conflictCount: runNetRelations.filter(x => String(x.type || "").toLowerCase().includes("conflict")).length,
    ultraCount: runNetRelations.filter(x => String(x.type || "").toLowerCase().includes("ultra")).length
}

window.updateMTOSBranch("network", {
    relations: runNetRelations,
    relationSummary: runRelationSummary,
    timePressure: Number(window.mtosTimePressureSummary?.value ?? 0)
})

const resolvedRunTargets = typeof window.resolveDecisionTargets === "function"
    ? window.resolveDecisionTargets()
    : { primary: [], avoid: [], neutral: [] }

const runSelectedName = getSelectedDecisionTarget()

const allRunTargets = [
    ...(Array.isArray(resolvedRunTargets.primary) ? resolvedRunTargets.primary : []),
    ...(Array.isArray(resolvedRunTargets.neutral) ? resolvedRunTargets.neutral : []),
    ...(Array.isArray(resolvedRunTargets.avoid) ? resolvedRunTargets.avoid : [])
]

const runSelectedTarget =
    allRunTargets.find(x => x.name === runSelectedName) ||
    (resolvedRunTargets.primary?.[0] || resolvedRunTargets.neutral?.[0] || null)

if (runSelectedTarget?.name) {
    setSelectedDecisionTarget(runSelectedTarget.name)
}

window.updateMTOSBranch("decision", {
    ...(window.MTOS_STATE?.decision || {}),
    targets: resolvedRunTargets,
    selectedTarget: runSelectedTarget || null
})

window.updateMTOSBranch("collective", {
    ...(window.mtosCollectiveState || {}),
    stability: Number(window.mtosDayState?.stability ?? window.mtosCollectiveState?.stability ?? 0.5),
    timePressure: Number(window.mtosTimePressureSummary?.value ?? window.mtosCollectiveState?.timePressure ?? 0)
})

window.evaluateMTOSEvents()
window.commitMTOSDecisionToMemory()

const i18n = getLiveI18nDeps();

renderSystemEventsPanel({
    ...i18n,
    getState: () => window.MTOS_STATE || {}
});

renderSystemDecisionPanel({
    ...i18n,
    renderSystemDecisionMetrics,
    getState: () => window.MTOS_STATE || {}
});

renderDecisionTargetsPanel({
    t: i18n.t,
    getState: () => window.MTOS_STATE || {},
    getSelectedDecisionTarget,
    setSelectedDecisionTarget,
    resolveDecisionTargets: () => resolveDecisionTargetsLocal({
        t: i18n.t,
        getCurrentUserName,
        getSelectedDecisionTarget,
        getState: () => window.MTOS_STATE || {},
        getDecision: () => window.mtosDecision || {},
        getRelations: () => window.currentNetworkRelations || []
    }),
    renderDecisionSummaryPanel: (targetId = "humanLayer") => renderDecisionSummaryPanel(targetId),
    renderSystemDecisionPanel: () => renderSystemDecisionPanel({
        ...i18n,
        renderSystemDecisionMetrics,
        getState: () => window.MTOS_STATE || {}
    }),
    renderActionTracePanel: () => renderActionTracePanel({
        ...i18n,
        getDecision: () => window.mtosDecision || {},
        getDayState: () => window.mtosDayState || {},
        getTimePressureSummary: () => window.mtosTimePressureSummary || {},
        getState: () => window.MTOS_STATE || {}
    })
});

renderFieldTensionPanel({
    t: i18n.t,
    getDayState: () => window.mtosDayState || {},
    getTimePressureSummary: () => window.mtosTimePressureSummary || {},
    getMetabolicMetrics: () => window.mtosMetabolicMetrics || {},
    getCollectiveState: () => window.mtosCollectiveState || {}
});

renderActionTracePanel({
    ...i18n,
    getDecision: () => window.mtosDecision || {},
    getDayState: () => window.mtosDayState || {},
    getTimePressureSummary: () => window.mtosTimePressureSummary || {},
    getState: () => window.MTOS_STATE || {}
});

if (typeof window.applyMTOSLang === "function") {
    window.applyMTOSLang(window.mtosLang || window.MTOS_LANG || "en");
}

        // ===============================
        // TIME CONTROL
        // ===============================
        let baseYear = year
        let baseMonth = month
        let baseDay = day

        let cachedBaseWeather = Array.isArray(evolvedWeather) ? evolvedWeather : []
        let cachedBasePressure = Array.isArray(pressure) ? pressure : []

        const step = createTimeStepRunner({
    pyodide: getPyodide(MTOS_GLOBALS),
    name,
    baseYear,
    baseMonth,
    baseDay,

    getCachedBaseWeather: () => cachedBaseWeather,
    getCachedBasePressure: () => cachedBasePressure,

    getUsers: () => getUsers(MTOS_GLOBALS),
setUsers: (nextUsers) => {
    setUsers(nextUsers, MTOS_GLOBALS);
},

getFieldState: () => getFieldState(MTOS_GLOBALS),
setFieldState: (nextFieldState) => {
    setFieldState(nextFieldState, MTOS_GLOBALS);
},

getFieldMode: () => getFieldMode(MTOS_GLOBALS),
setFieldMode: (nextFieldMode) => {
    setFieldMode(nextFieldMode, MTOS_GLOBALS);
},

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
    storeAutoFeedbackForCurrentRun,
    findUserByNameOrId,
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

    getRenderAllDeps: () => ({
    getFieldState: () => getFieldState(MTOS_GLOBALS),
    getSelectedAgent: () => getSelectedAgent(MTOS_GLOBALS),
    getAttractorField: () => window._attractorField,
    getUsers: () => getUsers(MTOS_GLOBALS),
    getMatrix: () => window._matrix || null,
    renderAttractorOnly: () => window.renderAttractorOnly && window.renderAttractorOnly(),
    renderHistoryEfficiencyPanel: typeof window.renderHistoryEfficiencyPanel === "function"
        ? window.renderHistoryEfficiencyPanel
        : null
}),

    getRenderCognitiveDeps: () => ({
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
});

        initTimeControls(step)

    } catch (e) {
        console.error(e)
        setStatusText("error")
    }

    window.onKinSelect = (kin) => {
    logEvent("kin_select", {
        kin,
        memory: getSelectionMemory(MTOS_GLOBALS)[KinRegistry.toIndex(kin)]
    })

    setSelectedKin(kin, MTOS_GLOBALS)
    window.selectedKin = getSelectedKin(MTOS_GLOBALS)

    renderAttractorOnly()
}

applyMTOSViewMode(window.mtosViewMode || loadMTOSViewMode())
}

function updateMTOSLogo() {
    const logo = document.getElementById("mtosLogo")
    if (!logo) return

    const lang = window.mtosLang || window.MTOS_LANG || "en"
    logo.textContent = lang === "ru" ? "МТОС" : "MTOS"
}

updateMTOSLogo()

function getDaySyncInfo(users, todayKin) {
    const safeUsers = Array.isArray(users) ? users : []

    const exact = []
    const sameSeal = []
    const sameTone = []

    const todaySeal = ((todayKin - 1) % 20) + 1
    const todayTone = ((todayKin - 1) % 13) + 1

    safeUsers.forEach(u => {
        const kin = Number(u.kin)
        if (!Number.isFinite(kin)) return

        const seal = ((kin - 1) % 20) + 1
        const tone = ((kin - 1) % 13) + 1

        if (kin === todayKin) {
            exact.push(u)
        } else {
            if (seal === todaySeal) sameSeal.push(u)
            if (tone === todayTone) sameTone.push(u)
        }
    })

    return {
        todayKin,
        todaySeal,
        todayTone,
        exact,
        sameSeal,
        sameTone
    }
}

function formatSyncUsers(list) {
    if (!Array.isArray(list) || !list.length) return "—"

    return list
        .map(u => `${u.name} (${u.kin})`)
        .join(", ")
}

function resolveDynamicDayState(dayState, networkFeedback, attractorState, collectiveState = null) {
    const ds = dayState ? { ...dayState } : {}

    const attention = Number(ds.attention ?? 0.5)
    const activity = Number(ds.activity ?? attention)
    const pressure = Number(ds.pressure ?? 0)
    const conflict = Number(ds.conflict ?? 0)
    const stability = Number(ds.stability ?? 0.5)
    const field = Number(ds.field ?? 0.5)

    const network = networkFeedback || {
        density: 0,
        meanStrength: 0,
        conflictRatio: 0,
        supportRatio: 0
    }

    const attractor = attractorState || {
    type: "unknown",
    intensity: 0,
    score: 0
}

const collective = collectiveState || {
    temperature: 0.5,
    relationsCount: 0
}

const memory = loadDayEvolutionMemory(getCurrentUserName())

let score =
    attention * 0.28 +
    activity * 0.18 +
    stability * 0.22 +
    field * 0.16 -
    pressure * 0.22 -
    conflict * 0.18

    score += Number(network.supportRatio ?? 0) * 0.12
    score -= Number(network.conflictRatio ?? 0) * 0.16
    score += Number(network.meanStrength ?? 0) * 0.05

    if (attractor.type === "cycle") score += 0.08 * Number(attractor.intensity ?? 0)
    if (attractor.type === "stable") score += 0.06 * Number(attractor.intensity ?? 0)
    if (attractor.type === "chaos") score -= 0.14 * Number(attractor.intensity ?? 0)
    if (attractor.type === "trend") score += 0.03 * Number(attractor.intensity ?? 0)

        score += (0.5 - Number(collective.temperature ?? 0.5)) * 0.10
        score += Math.min(0.08, Number(collective.relationsCount ?? 0) * 0.002)

    const rawScore = score

    const memoryInfluence = getMemoryInfluence(
    document.getElementById("name")?.value?.trim() || "",
    window._userKin || 1
)

score += memoryInfluence.seal * 0.10
score += memoryInfluence.kin * 0.14
score += memoryInfluence.user * 0.16

    const delta = rawScore - Number(memory.lastScore ?? 0)
    const momentum = Number(
        (
            Number(memory.momentum ?? 0) * 0.55 +
            delta * 0.45
        ).toFixed(4)
    )

    score += momentum * 0.7

    let label = "EXPLORE"

if (score >= 0.34) label = "FOCUS"
else if (score <= -0.34) label = "REST"
else if (score >= 0.08) label = "INTERACT"
else label = "EXPLORE"

if (
    conflict >= 0.48 ||
    pressure >= 0.68 ||
    attractor.type === "chaos"
) {
    if (score < 0.20) {
        label = "REST"
    }
}

if (
    attention >= 0.72 &&
    stability >= 0.64 &&
    conflict <= 0.22 &&
    pressure <= 0.42
) {
    label = "FOCUS"
}

if (
    field >= 0.58 &&
    attention >= 0.48 &&
    attention <= 0.72 &&
    pressure <= 0.52 &&
    conflict <= 0.32 &&
    label === "EXPLORE"
) {
    label = "INTERACT"
}

if (
    pressure >= 0.62 &&
    stability <= 0.42 &&
    label !== "REST"
) {
    label = "REST"
}

if (
    attractor.type === "trend" &&
    attention >= 0.46 &&
    pressure <= 0.58 &&
    conflict <= 0.38 &&
    label === "EXPLORE"
) {
    label = "ADJUST"
}

if (
    attention >= 0.72 &&
    stability >= 0.68 &&
    pressure >= 0.52 &&
    label === "FOCUS"
) {
    label = "ADJUST"
}

    let streak = 1
    if (memory.lastLabel === label) {
        streak = Number(memory.streak ?? 0) + 1
    }

    const evolved = {
        ...ds,
        rawDayScore: Number(rawScore.toFixed(3)),
        dayScore: Number(score.toFixed(3)),
        momentum: Number(momentum.toFixed(3)),
        dayLabel: label,
        dayIndex: Number(Math.max(-1, Math.min(1, score)).toFixed(3))
    }

    const descMap = {
    FOCUS: "High coherence. Best for execution and decisive work.",
    ADJUST: "Direction exists, but rigidity is rising. Correct course before hard commitment.",
    INTERACT: "The field is open for one clean contact or coordination.",
    EXPLORE: "Open movement. Good for testing and light exploration.",
    REST: "Load exceeds stable capacity. Reduce pressure and recover."
}

    evolved.dayDesc = descMap[label]

    const colorMap = {
    FOCUS: "#00ff88",
    ADJUST: "#ffd166",
    INTERACT: "#66ccff",
    EXPLORE: "#bbbbbb",
    REST: "#ff6666"
}

    evolved.dayColor = colorMap[label]

    saveDayEvolutionMemory({
    lastLabel: label,
    lastScore: evolved.dayScore,
    momentum,
    streak,
    updatedAt: new Date().toISOString()
}, getCurrentUserName())

    evolved.streak = streak

    return evolved
}

function getSimpleDayType(ds, tpSummary){
    const pressure = Number(ds?.pressure ?? 0)
    const conflict = Number(ds?.conflict ?? 0)
    const attention = Number(ds?.attention ?? 0.5)
    const stability = Number(ds?.stability ?? 0.5)
    const activity = Number(ds?.activity ?? 0.5)
    const timePressure = Number(tpSummary?.value ?? ds?.timePressure ?? 0)

    if (timePressure >= 0.82 || pressure >= 0.78) {
        return { label: "HEAVY", color: "#ff7a59" }
    }

    if (conflict >= 0.52) {
        return { label: "TENSE", color: "#ff5c7a" }
    }

    if (attention >= 0.72 && stability >= 0.62 && pressure <= 0.42) {
        return { label: "FOCUSED", color: "#00ff88" }
    }

    if (activity >= 0.64 && conflict <= 0.32 && pressure <= 0.52) {
        return { label: "ACTIVE FLOW", color: "#66ccff" }
    }

    if (timePressure <= 0.28 && pressure <= 0.34 && conflict <= 0.24) {
        return { label: "LIGHT", color: "#c084fc" }
    }

    return { label: "BALANCED", color: "#d1d5db" }
}

function getEnergyBand(ds){
    const attention = Number(ds?.attention ?? 0.5)
    const activity = Number(ds?.activity ?? attention)
    const pressure = Number(ds?.pressure ?? 0)
    const conflict = Number(ds?.conflict ?? 0)

    const energy =
        attention * 0.40 +
        activity * 0.30 +
        (1 - pressure) * 0.18 +
        (1 - conflict) * 0.12

    if (energy >= 0.72) return { label: "High", value: energy }
    if (energy >= 0.48) return { label: "Medium", value: energy }
    return { label: "Low", value: energy }
}

function getRiskBand(ds, tpSummary, attractorState, networkFeedback){
    const pressure = Number(ds?.pressure ?? 0)
    const conflict = Number(ds?.conflict ?? 0)
    const tp = Number(tpSummary?.value ?? 0)
    const attractorType = String(attractorState?.type || "unknown")
    const netConflict = Number(networkFeedback?.conflictRatio ?? 0)

    if (tp >= 0.82 || pressure >= 0.78) return "Overload risk"
    if (conflict >= 0.52 || netConflict >= 0.45) return "Conflict spike"
    if (attractorType === "chaos") return "Chaotic drift"
    if (tp >= 0.62) return "Compression risk"
    return "Manageable"
}

function getTodayAction(decision, ds, tpSummary, networkFeedback){
    const mode = String(decision?.mode || "EXPLORE").toUpperCase()
    const pressure = Number(ds?.pressure ?? 0)
    const conflict = Number(ds?.conflict ?? 0)
    const support = Number(networkFeedback?.supportRatio ?? 0)
    const conflictRatio = Number(networkFeedback?.conflictRatio ?? 0)
    const tp = Number(tpSummary?.value ?? 0)

    if (mode === "FOCUS") {
        return {
            title: "FOCUS",
            doList: [
                "Finish one main task",
                "Work in one direction only",
                "Close side branches"
            ],
            avoidList: [
                "Multitasking",
                "Random new commitments",
                "Noisy communication"
            ]
        }
    }

        if (mode === "ADJUST") {
        return {
            title: "ADJUST",
            doList: [
                "Reopen one alternative",
                "Correct direction before commitment",
                "Keep the next move reversible"
            ],
            avoidList: [
                "Rigid certainty",
                "Overcommitting too early",
                "Turning one signal into a final conclusion"
            ]
        }
    }

    if (mode === "REST") {
        return {
            title: "REST",
            doList: [
                "Reduce load",
                "Do maintenance only",
                "Keep decisions reversible"
            ],
            avoidList: [
                "Pressure-driven promises",
                "Conflict escalation",
                "Heavy planning"
            ]
        }
    }

    if (mode === "INTERACT") {
        return {
            title: "INTERACT",
            doList: [
                support >= 0.5 ? "Use strong connections today" : "Choose one safe contact",
                "Clarify agreements",
                "Resolve one social bottleneck"
            ],
            avoidList: [
                conflictRatio >= 0.35 ? "Reactive arguments" : "Too many parallel contacts",
                "Overexplaining",
                "Emotional overreach"
            ]
        }
    }

    return {
        title: "EXPLORE",
        doList: [
            tp >= 0.5 ? "Explore carefully, not widely" : "Try one new path",
            "Collect signals",
            "Test without full commitment"
        ],
        avoidList: [
            pressure >= 0.62 ? "Hard commitments" : "Rigid routine",
            "Forcing certainty too early",
            conflict >= 0.42 ? "Sharp reactions" : "Overplanning"
        ]
    }
}

function buildWhyList(ds, tpSummary, attractorState, networkFeedback){
    const items = []

    const pressure = Number(ds?.pressure ?? 0)
    const conflict = Number(ds?.conflict ?? 0)
    const attention = Number(ds?.attention ?? 0.5)
    const stability = Number(ds?.stability ?? 0.5)
    const field = Number(ds?.field ?? 0.5)

    const tpValue = Number(tpSummary?.value ?? 0)
    const tpLabel = String(tpSummary?.label || "low")
    const tpMode = String(tpSummary?.temporalMode || "EXPLORE")

    const attractorType = String(attractorState?.type || "unknown")
    const attractorIntensity = Number(attractorState?.intensity ?? 0)

    const support = Number(networkFeedback?.supportRatio ?? 0)
    const netConflict = Number(networkFeedback?.conflictRatio ?? 0)
    const density = Number(networkFeedback?.density ?? 0)

    if (tpValue >= 0.34) {
        items.push(`Time pressure is ${tpLabel} (${tpValue.toFixed(2)}), mode ${tpMode}`)
    }

    if (pressure >= 0.58) {
        items.push(`Internal pressure is elevated (${pressure.toFixed(2)})`)
    } else if (pressure <= 0.30) {
        items.push(`Pressure is relatively low (${pressure.toFixed(2)})`)
    }

    if (conflict >= 0.42 || netConflict >= 0.35) {
        items.push(`Conflict is visible (${Math.max(conflict, netConflict).toFixed(2)})`)
    }

    if (attention >= 0.68) {
        items.push(`Attention is strong (${attention.toFixed(2)})`)
    } else if (attention <= 0.40) {
        items.push(`Attention is scattered (${attention.toFixed(2)})`)
    }

    if (stability >= 0.62) {
        items.push(`Stability is good (${stability.toFixed(2)})`)
    } else if (stability <= 0.42) {
        items.push(`Stability is weak (${stability.toFixed(2)})`)
    }

    if (field >= 0.60) {
        items.push(`Field coherence is strong (${field.toFixed(2)})`)
    }

    if (attractorType !== "unknown") {
        items.push(`Attractor is ${attractorType} (${attractorIntensity.toFixed(2)})`)
    }

    if (support >= 0.55) {
        items.push(`Network support is favorable (${support.toFixed(2)})`)
    } else if (density > 0 && netConflict >= 0.35) {
        items.push(`Network friction is elevated (${netConflict.toFixed(2)})`)
    }

    return items.slice(0, 5)
}

function getEntropyDescription(e) {

        if (e > 2.5) return "high chaos, low structure"
        if (e > 2.0) return "dynamic system, flexible"
        if (e > 1.5) return "moderate complexity"
        if (e > 1.0) return "structured, stable"

        return "low entropy, rigid system"
    }

    const SEALS = [
        "Dragon", "Wind", "Night", "Seed", "Serpent",
        "Worldbridger", "Hand", "Star", "Moon", "Dog",
        "Monkey", "Human", "Skywalker", "Wizard", "Eagle",
        "Warrior", "Earth", "Mirror", "Storm", "Sun"
    ]

    const SEAL_MEANING = [
        "initiation, birth",
        "breath, communication",
        "inner world, intuition",
        "growth, potential",
        "instinct, life force",
        "transition, letting go",
        "action, healing",
        "harmony, beauty",
        "purification, flow",
        "loyalty, heart",
        "play, spontaneity",
        "choice, free will",
        "exploration, expansion",
        "time, depth",
        "vision, perspective",
        "strategy, intelligence",
        "synchronization, navigation",
        "structure, reflection",
        "transformation, energy",
        "clarity, center"
    ]

    window.SEALS = SEALS

    // ===============================
    // METRIC INTERPRETATION
    // ===============================

    function interpretAttention(a) {
        if (a > 0.7) return "high focus, stable attention"
        if (a < 0.4) return "low focus, scattered attention"
        return "balanced attention"
    }

    function interpretNoise(n) {
        if (n < 0.1) return "low noise, stable system"
        if (n > 0.3) return "high noise, unstable dynamics"
        return "moderate variability"
    }

    function interpretLyapunov(l) {
        if (l < 0.05) return "high stability"
        if (l > 0.2) return "chaotic behavior"
        return "sensitive but controlled"
    }

    function interpretPrediction(p) {
        if (p > 0.7) return "high predictability"
        if (p < 0.4) return "low predictability"
        return "moderate predictability"
    }

    function interpretPredictability(days) {
        if (days > 200) return "long stable horizon"
        if (days < 50) return "short unstable horizon"
        return "medium-term stability"
    }

    // ===============================
    // FIELD MODE UI
    // ===============================

    window.setFieldMode = (mode) => {

        window.fieldMode = mode

        const buttons = ["btnActivity", "btnPressure", "btnHybrid", "btnLandscape", "btnAttractor"]

        buttons.forEach(id => {
            const b = document.getElementById(id)
            if (b) {
                b.style.background = "#111"
                b.style.color = "#fff"
            }
        })

        const activeMap = {
            activity: "btnActivity",
            pressure: "btnPressure",
            hybrid: "btnHybrid",
            landscape: "btnLandscape",
            attractor: "btnAttractor"
        }

        const active = document.getElementById(activeMap[mode])

        if (active) {
            active.style.background = "#00ff88"
            active.style.color = "#000"
        }

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
    }

    window.setFieldViewMode = (view) => {
        window.fieldViewMode = view

        const buttons = ["btnViewGrid", "btnViewLinear", "btnViewTorus"]

        buttons.forEach(id => {
            const b = document.getElementById(id)
            if (b) {
                b.style.background = "#111"
                b.style.color = "#fff"
            }
        })

        const activeMap = {
            grid: "btnViewGrid",
            linear: "btnViewLinear",
            torus: "btnViewTorus"
        }

        const active = document.getElementById(activeMap[view])

        if (active) {
            active.style.background = "#00ff88"
            active.style.color = "#000"
        }

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
    }

    function analyzeInteractions(matrix, seal) {

        const size = 20
        const start = seal * size
        const row = matrix.slice(start, start + size)

        const ranked = row
            .map((v, i) => ({ seal: i, value: v }))
            .sort((a, b) => b.value - a.value)

        return {
            best: ranked.slice(0, 3),
            worst: ranked.slice(-3).reverse()
        }
    }

window.networkRelationFilter = window.networkRelationFilter || "all"

function buildDailyArchetypePolarity(todayKin, weather, attractorField) {
    const todaySeal = (todayKin - 1) % 20
    const todayTone = (todayKin - 1) % 13

    const polarity = new Array(20).fill(0).map((_, seal) => {
        let sum = 0
        let count = 0

        for (let tone = 0; tone < 13; tone++) {
            let kin = seal * 13 + tone + 1
            while (kin > 260) kin -= 260

            const i = kin - 1
            const w = weather?.[i] || {}
            const attention = Number(w.attention ?? 0.5)
            const activity = Number(w.activity ?? attention)
            const pressure = Number(w.pressure ?? 0)
            const conflict = Number(w.conflict ?? 0)
            const attractor = Array.isArray(attractorField)
                ? Number(attractorField[i] ?? 0.5)
                : 0.5

            let v =
                attention * 0.24 +
                activity * 0.22 +
                attractor * 0.24 -
                pressure * 0.18 -
                conflict * 0.12

            const sealDistance = Math.min(
                Math.abs(seal - todaySeal),
                20 - Math.abs(seal - todaySeal)
            )

            const toneDistance = Math.min(
                Math.abs(tone - todayTone),
                13 - Math.abs(tone - todayTone)
            )

            const dayResonance =
                (1 - sealDistance / 10) * 0.18 +
                (1 - toneDistance / 6.5) * 0.10

            v += dayResonance

            sum += v
            count++
        }

        const avg = count ? sum / count : 0
        return Number(Math.max(-1, Math.min(1, (avg - 0.35) * 1.9)).toFixed(3))
    })

    window.mtosArchetypePolarity = polarity
    return polarity
}

function buildTodayInfluenceMatrix(userKin, users) {
    const size = 20
    const matrix = new Array(size * size).fill(0.5)

    const relationMemory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const memoryLayers = window.mtosMemoryLayers || loadMemoryLayers()
    if (!memoryLayers.pairMemory || typeof memoryLayers.pairMemory !== "object") {
        memoryLayers.pairMemory = {}
    }
    const userName = document.getElementById("name")?.value?.trim() || ""

    const userSeal = (userKin - 1) % 20
    const memoryInfluence = getMemoryInfluence(userName, userKin)

    const polarity = buildDailyArchetypePolarity(
        window._todayKin,
        window._weather,
        window._attractorField
    )

    const attractorAtUser = Array.isArray(window._attractorField)
        ? Number(window._attractorField[userKin - 1] ?? 0.5)
        : 0.5

    const networkFeedback = window.mtosNetworkFeedback || {
        density: 0,
        meanStrength: 0,
        conflictRatio: 0,
        supportRatio: 0
    }

    for (let colSeal = 0; colSeal < 20; colSeal++) {
        let supportSum = 0
        let conflictSum = 0
        let count = 0
        let members = []

        for (const u of (getUsers(MTOS_GLOBALS) || [])) {
            if (!u || !Number.isFinite(Number(u.kin))) continue

            const uSeal = (Number(u.kin) - 1) % 20
            if (uSeal !== colSeal) continue
            if (u.name === userName) continue

            const key1 = `${userName}->${u.name}`
            const key2 = `${u.name}->${userName}`

            const s1 = Number(relationMemory[key1] ?? 0)
const s2 = Number(relationMemory[key2] ?? 0)
const rel = (s1 + s2) / 2

const userObj = (getUsers(MTOS_GLOBALS) || []).find(x => x.name === userName) || null
const targetObj = u || null

const userPhase = Number(userObj?.phase ?? 0)
const targetPhase = Number(targetObj?.phase ?? 0)

const phaseLink = phaseLinkMod(userPhase, targetPhase)

// phase-aware relation
const relPhaseAdjusted =
    rel * (1 + phaseLink.align * 0.35)

            const pairKey = [userName, u.name].sort().join("::")
if(!memoryLayers.pairMemory[pairKey]){
    memoryLayers.pairMemory[pairKey] = 0
}
memoryLayers.pairMemory[pairKey] =
    Math.max(-1, Math.min(1,
        Number(memoryLayers.pairMemory[pairKey]) * 0.98 + rel * 0.02
    ))

            if (relPhaseAdjusted >= 0) {
    supportSum += relPhaseAdjusted + phaseLink.supportBoost * 0.12
} else {
    conflictSum += Math.abs(relPhaseAdjusted) + phaseLink.conflictBoost * 0.12
}

            count++
            members.push({
    name: u.name,
    kin: Number(u.kin),
    score: relPhaseAdjusted,
    rawScore: rel,
    phase: targetPhase,
    phaseDelta: Number(phaseLink.delta.toFixed(3)),
    phaseAlign: Number(phaseLink.align.toFixed(3))
})
        }

        const supportAvg = count ? supportSum / count : 0
        const conflictAvg = count ? conflictSum / count : 0

        const userPolarity = Number(polarity[userSeal] ?? 0)
const targetPolarity = Number(polarity[colSeal] ?? 0)
const polarityAlignment = 1 - Math.min(2, Math.abs(userPolarity - targetPolarity)) / 2
const polarityTension = Math.abs(userPolarity - targetPolarity)

const sealMemoryValue = Number(memoryLayers.sealMemory[colSeal] ?? 0)
const userMemoryValue = Number(memoryInfluence.user ?? 0)
const kinMemoryValue = Number(memoryInfluence.kin ?? 0)

const fieldKin = ((colSeal * 13) % 260)
const fieldMemoryValue = Number(memoryLayers.fieldMemory[fieldKin] ?? 0)

let phaseSupportMean = 0
let phaseConflictMean = 0

if (members.length) {
    phaseSupportMean =
        members.reduce((sum, m) => sum + Math.max(0, Number(m.phaseAlign ?? 0)), 0) / members.length

    phaseConflictMean =
        members.reduce((sum, m) => sum + Math.max(0, -Number(m.phaseAlign ?? 0)), 0) / members.length
}

let v =
    0.5 +
    supportAvg * 0.22 -
    conflictAvg * 0.24 +
    phaseSupportMean * 0.14 -
    phaseConflictMean * 0.16 +
    (attractorAtUser - 0.5) * 0.12 +
    networkFeedback.supportRatio * 0.08 -
    networkFeedback.conflictRatio * 0.10 +
    targetPolarity * 0.16 +
    polarityAlignment * 0.08 -
    polarityTension * 0.10 +
    sealMemoryValue * 0.14 +
    userMemoryValue * 0.08 +
    kinMemoryValue * 0.06 +
    fieldMemoryValue * 0.10

        v = Math.max(0, Math.min(1, v))

        matrix[userSeal * size + colSeal] = v

        // симметрия, если хочешь видеть и обратное влияние
        matrix[colSeal * size + userSeal] = v

        // сохраняем детали для tooltip
        window._todaySealInfluence = window._todaySealInfluence || {}
        window._todaySealInfluence[colSeal] = {
    value: v,
    supportAvg,
    conflictAvg,
    count,
    members,
    phaseSupportMean: Number(phaseSupportMean.toFixed(3)),
    phaseConflictMean: Number(phaseConflictMean.toFixed(3)),
    polarity: Number(targetPolarity.toFixed(3)),
    userPolarity: Number(userPolarity.toFixed(3)),
    polarityAlignment: Number(polarityAlignment.toFixed(3)),
    polarityTension: Number(polarityTension.toFixed(3))
}
    }

    saveMemoryLayers(memoryLayers)
    window.mtosMemoryLayers = memoryLayers

    return matrix
}

function buildDecisionRecommendations(userKin, users) {

    const influence = window._todaySealInfluence || {}
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const userName = document.getElementById("name")?.value?.trim() || ""

    const results = []

    for (let seal = 0; seal < 20; seal++) {

        const info = influence[seal]
        if (!info || !info.members.length) continue

        let score = info.value

        // усиливаем через реальные связи
        let networkBoost = 0

        for (const m of info.members) {

            const key1 = `${userName}->${m.name}`
            const key2 = `${m.name}->${userName}`

            const rel = (Number(memory[key1] ?? 0) + Number(memory[key2] ?? 0)) / 2

            networkBoost += rel
        }

        networkBoost /= info.members.length || 1

        const finalScore = score + networkBoost * 0.3

        results.push({
            seal,
            value: finalScore,
            members: info.members
        })
    }

    results.sort((a, b) => b.value - a.value)

    return {
        best: results.slice(0, 3),
        worst: results.slice(-3).reverse()
    }
}

function getAttractorSummaryForUser(activeKin, users){
    const decisions = buildDecisionRecommendations(activeKin, users)
    const attractor = window.mtosAttractorState || { type: "unknown", intensity: 0, score: 0 }
    const tp = window.mtosTimePressureSummary || { value: 0, label: "low", temporalMode: "EXPLORE" }

    const bestSeals = decisions.best.map(x => ({
        seal: SEALS[x.seal],
        score: Number(x.value.toFixed(2)),
        members: x.members.map(m => m.name)
    }))

    const worstSeals = decisions.worst.map(x => ({
        seal: SEALS[x.seal],
        score: Number(x.value.toFixed(2)),
        members: x.members.map(m => m.name)
    }))

    const bestPeople = []
    const worstPeople = []

    decisions.best.forEach(x => {
        x.members.forEach(m => {
            bestPeople.push({
                name: m.name,
                kin: m.kin,
                score: Number((m.score ?? x.value).toFixed(2))
            })
        })
    })

    decisions.worst.forEach(x => {
        x.members.forEach(m => {
            worstPeople.push({
                name: m.name,
                kin: m.kin,
                score: Number((m.score ?? x.value).toFixed(2))
            })
        })
    })

    bestPeople.sort((a, b) => b.score - a.score)
    worstPeople.sort((a, b) => a.score - b.score)

    return {
        bestSeals: bestSeals.slice(0, 3),
        worstSeals: worstSeals.slice(0, 3),
        bestPeople: bestPeople.slice(0, 3),
        worstPeople: worstPeople.slice(0, 3),
        attractorType: attractor.type,
        attractorIntensity: Number((attractor.intensity ?? 0).toFixed(2)),
        timePressure: Number((tp.value ?? 0).toFixed(2)),
        timePressureLabel: tp.label || "low",
        temporalMode: tp.temporalMode || "EXPLORE"
    }
}

function renderAttractorDecisionBoard(targetId, summary){
    const el = document.getElementById(targetId)
    if(!el) return

    const positiveSeals = summary.bestSeals.length
        ? summary.bestSeals.map(x => `
            <div class="attr-item positive">
                <div class="attr-name">${x.seal}</div>
                <div class="attr-meta">${x.members.join(", ") || "—"}</div>
            </div>
        `).join("")
        : `<div class="attr-empty">Нет данных</div>`

    const negativeSeals = summary.worstSeals.length
        ? summary.worstSeals.map(x => `
            <div class="attr-item negative">
                <div class="attr-name">${x.seal}</div>
                <div class="attr-meta">${x.members.join(", ") || "—"}</div>
            </div>
        `).join("")
        : `<div class="attr-empty">Нет данных</div>`

    const positivePeople = summary.bestPeople.length
        ? summary.bestPeople.map(x => `
            <div class="attr-item positive">
                <div class="attr-name">${x.name}</div>
                <div class="attr-meta">Kin ${x.kin}</div>
            </div>
        `).join("")
        : `<div class="attr-empty">Нет данных</div>`

    const negativePeople = summary.worstPeople.length
        ? summary.worstPeople.map(x => `
            <div class="attr-item negative">
                <div class="attr-name">${x.name}</div>
                <div class="attr-meta">Kin ${x.kin}</div>
            </div>
        `).join("")
        : `<div class="attr-empty">Нет данных</div>`

    const attractorTypeMap = {
    stable: "stable field",
    cycle: "cyclic pattern",
    trend: "directed flow",
    chaos: "unstable field",
    unknown: "undefined",
    undefined: "undefined"
}

const timePressureText =
    summary.timePressure < 0.34 ? "low" :
    summary.timePressure < 0.62 ? "medium" :
    summary.timePressure < 0.82 ? "high" :
    "critical"

const modeTextMap = {
    EXPLORE: "exploration",
    FOCUS: "focused execution",
    FLOW: "natural flow",
    CRISIS: "overload state"
}

const shortAdvice =
    summary.timePressure >= 0.62
        ? "Reduce spread. Stay with stable connections and avoid unnecessary actions."
        : "Good moment to explore, reinforce useful connections and try new paths."

    el.innerHTML = `
                <div class="attr-subline">
                    Field: <b>${attractorTypeMap[summary.attractorType] || summary.attractorType}</b> ·
                    Time pressure: <b>${timePressureText}</b> ·
                    Mode: <b>${modeTextMap[summary.temporalMode] || summary.temporalMode}</b>
                </div>
            </div>

            <div class="attr-advice">
                ${shortAdvice}
            </div>

            <div class="attr-sections">
                <div class="attr-box">
                    <div class="attr-title positive-title">Positive zones</div>
                    ${positiveSeals}
                </div>

                <div class="attr-box">
                    <div class="attr-title negative-title">Risk zones</div>
                    ${negativeSeals}
                </div>

                <div class="attr-box">
                    <div class="attr-title positive-title">Best connections</div>
                    ${positivePeople}
                </div>

                <div class="attr-box">
                    <div class="attr-title negative-title">Avoid interactions</div>
                    ${negativePeople}
                </div>
            </div>
        </div>
    `
}

function renderAttractorOnly() {
    const mapEl = document.getElementById("attractorMap")
    const panelEl = document.getElementById("interactionAnalysis")

    if (!mapEl || !panelEl) return
    if (!window._weather) return

    ensureAttractorToggle()

    const activeKin = getSelectedKin(MTOS_GLOBALS) || window._userKin
    if (!activeKin) {
        mapEl.innerHTML = ""
        panelEl.innerHTML = ""
        return
    }

    let matrix = buildTodayInfluenceMatrix(activeKin, getUsers(MTOS_GLOBALS))

    if (typeof applyTodayContactsToAttractorField === "function") {
    matrix = applyTodayContactsToAttractorField(matrix, getUsers(MTOS_GLOBALS))
}

    matrix = applyResolvedStateToAttractorMatrix(matrix, window.mtosAttractorState)

    window._matrix = matrix

    mapEl.style.display = ""
    mapEl.innerHTML = ""
    panelEl.innerHTML = ""

    if (window._attractorRAF) {
        cancelAnimationFrame(window._attractorRAF)
        window._attractorRAF = null
    }

    const safeMode = window.attractorMode === "classic" ? "classic" : "map"

    if (safeMode === "classic") {
        drawAttractor(
    "attractorMap",
    Array.isArray(getUsers(MTOS_GLOBALS)) ? getUsers(MTOS_GLOBALS) : [],
    Array.isArray(window.currentNetworkRelations) ? window.currentNetworkRelations : [],
    activeKin
)

        const lang = window.mtosLang || window.MTOS_LANG || "en";

const attractorTitle = lang === "ru" ? "Аттрактор" : "Attractor";
const attractorLine1 = lang === "ru"
    ? "Живое поле аттрактора включено."
    : "Live attractor field is active.";
const attractorLine2 = lang === "ru"
    ? "Карта скрыта, работает динамический режим."
    : "Map is hidden, dynamic mode is running.";

panelEl.innerHTML = `
    <div style="padding:12px; border:1px solid #1f2937; background:#080808; color:#9ca3af; font-family:monospace; line-height:1.7;">
        <b style="color:#fff;">${attractorTitle}</b><br>
        ${attractorLine1}<br>
        ${attractorLine2}
    </div>
`
        return
    }

    drawAttractorMap("attractorMap", matrix, {
        size: 20,
        labels: window.SEALS || null,
        meanings: window.SEAL_MEANING || null,
        selectedSeal: ((Number(activeKin) - 1) % 20 + 20) % 20
    })
}

window.renderAttractorOnly = renderAttractorOnly

    function updateFieldLegend(mode) {
        const el = document.getElementById("fieldLegend")
        if (!el) return

        const modeTitle = {
            activity: "Activity",
            pressure: "Pressure",
            global: "Global",
            hybrid: "Hybrid",
            landscape: "Landscape",
            attractor: "Attractor Field"
        }[mode] || "Global"

        const modeText = {
            activity: "Shows where attention and activation are alive.",
            pressure: "Shows where tension, overload, and conflict accumulate.",
            hybrid: "Shows the strongest combined zones of the system.",
            landscape: "Shows the field itself, independent of participants.",
            attractor: "Shows where attention is naturally pulled."
        }[mode] || "Global mode reads the field as participant distribution across kin."

        el.innerHTML = `
    <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        text-align:center;
    ">
    
    <div style="margin-bottom:8px;"><b>About Field</b></div>
    
    <div style="margin-bottom:8px; max-width:700px;">
        Field is a 13×20 toroidal kin map (260 states). Each cell is one kin.
        The sequence is not linear: kin moves diagonally and wraps across the edges.
        The right edge connects to the left, and the bottom connects to the top, so the structure behaves like a torus.
    </div>

    <div style="margin-bottom:8px; max-width:700px;">
        <b>How to read the map</b><br>
        • Fill color = participant density in the kin.<br>
        • Inner frame = state type derived from real field/weather values.<br>
        • White outer frame = selected kin.<br>
        • Number inside cell = participant count.<br>
        • Dashed diagonal = 20-kin toroidal trace (10 back, selected, 9 forward).<br>
        • Click a kin to see full information about the people and values inside it.
    </div>

    <div style="margin-bottom:8px;">
        <b>Current mode: ${modeTitle}</b><br>
        ${modeText}
    </div>

    <div style="max-width:700px;">
        <b>State types</b><br>
        <span style="color:#22c55e;">Cluster</span> — dense multi-user concentration.<br>
        <span style="color:#ef4444;">Pressure</span> — high pressure / conflict / tension.<br>
        <span style="color:#38bdf8;">Active</span> — high attention / activation.<br>
        <span style="color:#a855f7;">Resonance</span> — strong hybrid combination.<br>
        <span style="color:#f59e0b;">Stable</span> — neutral stable presence.<br>
        <span style="color:#ffffff;">Event</span> — spike / threshold event.
    </div>

    </div>
    `
    }

    function hashCode(str) {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i)
            hash |= 0
        }
        return hash
    }

    function computeBehaviorMetrics(log) {
        const safeLog = Array.isArray(log) ? log : []

        const now = window.__mtos_time;
        const dayAgo = now - 24 * 60 * 60 * 1000

        const recent = safeLog.filter(e => e && e.t > dayAgo)

        let runCount = 0
        let interactions = 0
        let kinSelects = 0
        let timeSteps = 0

        for (const e of recent) {
            if (e.type === "run_start") runCount++

            if (
                e.type === "interaction" ||
                e.type === "kin_select" ||
                e.type === "time_step"
            ) {
                interactions++
            }

            if (e.type === "kin_select") kinSelects++
            if (e.type === "time_step") timeSteps++
        }

        return {
            runCount,
            interactions,
            kinSelects,
            timeSteps
        }
    }

    function computeAutoTruth(metrics) {

        const chaotic = metrics.interactions > 20
        const lowActivity = metrics.runCount <= 1 && metrics.interactions < 3
        const overload = metrics.interactions > 60
        const exploratory = metrics.kinSelects > 10 || metrics.timeSteps > 10

        const unstable =
            overload ||
            chaotic ||
            lowActivity

        return {
            unstable,
            chaotic,
            lowActivity,
            overload,
            exploratory
        }
    }

    window.computeBehaviorMetrics = computeBehaviorMetrics
    window.computeAutoTruth = computeAutoTruth

function getScientificConfidence(ds, metrics) {
    const safeDs = ds || {}
    const safeMetrics = metrics || {}

    const attention = clamp01Local(safeDs.attention ?? safeMetrics.attention ?? 0.5)
    const stability = clamp01Local(safeDs.stability ?? 0.5)
    const pressure = clamp01Local(safeDs.pressure ?? 0)
    const conflict = clamp01Local(safeDs.conflict ?? 0)
    const field = clamp01Local(safeDs.field ?? 0.5)

    const prediction = clamp01Local(safeMetrics.prediction ?? 0.5)
    const noise = clamp01Local(safeMetrics.noise ?? 0.2)
    const entropyNorm = clamp01Local((safeNum(safeMetrics.entropy, 1.5)) / 3.0)

    const attractor = window.mtosAttractorState || {}
    const attractorIntensity = clamp01Local(attractor.intensity ?? 0)

    const forecastStats = window.mtosForecastStats || {}
    const resolved = safeNum(forecastStats.resolved ?? 0, 0)
    const correct = safeNum(forecastStats.correct ?? 0, 0)
    const hitRate = resolved > 0 ? correct / resolved : 0.5

    let confidence =
        attention * 0.18 +
        stability * 0.22 +
        field * 0.10 +
        prediction * 0.18 +
        hitRate * 0.18 -
        pressure * 0.12 -
        conflict * 0.10 -
        noise * 0.08 -
        entropyNorm * 0.08 -
        attractorIntensity * 0.04

    confidence = clamp01Local(confidence)

    let calibration = "weak"
    if (resolved >= 8 && hitRate >= 0.68) calibration = "good"
    else if (resolved >= 4 && hitRate >= 0.52) calibration = "medium"

    return {
        value: Number(confidence.toFixed(2)),
        calibration,
        hitRate: Number(hitRate.toFixed(2)),
        resolved,
        correct
    }
}

function getScientificExplanation(ds, metrics) {
    const safeDs = ds || {}
    const safeMetrics = metrics || {}

    const attention = clamp01Local(safeDs.attention ?? safeMetrics.attention ?? 0.5)
    const stability = clamp01Local(safeDs.stability ?? 0.5)
    const pressure = clamp01Local(safeDs.pressure ?? 0)
    const conflict = clamp01Local(safeDs.conflict ?? 0)
    const field = clamp01Local(safeDs.field ?? 0.5)
    const prediction = clamp01Local(safeMetrics.prediction ?? 0.5)
    const noise = clamp01Local(safeMetrics.noise ?? 0.2)

    const attractor = window.mtosAttractorState || {}
    const network = window.mtosNetworkFeedback || {}
    const mem = window.mtosMemoryInfluence || { seal: 0, kin: 0, user: 0, total: 0 }

    const lines = []

    if (attention >= 0.62) lines.push(`Attention is high (${attention.toFixed(2)})`)
    else if (attention <= 0.38) lines.push(`Attention is low (${attention.toFixed(2)})`)
    else lines.push(`Attention is balanced (${attention.toFixed(2)})`)

    if (stability >= 0.62) lines.push(`Stability supports action (${stability.toFixed(2)})`)
    else if (stability <= 0.38) lines.push(`Stability is fragile (${stability.toFixed(2)})`)
    else lines.push(`Stability is moderate (${stability.toFixed(2)})`)

    if (pressure >= 0.55) lines.push(`Pressure is elevated (${pressure.toFixed(2)})`)
    else lines.push(`Pressure remains controlled (${pressure.toFixed(2)})`)

    if (conflict >= 0.42) lines.push(`Conflict signal is meaningful (${conflict.toFixed(2)})`)
    else lines.push(`Conflict remains low (${conflict.toFixed(2)})`)

    if (field >= 0.60) lines.push(`Field coherence is supportive (${field.toFixed(2)})`)
    else if (field <= 0.40) lines.push(`Field coherence is weak (${field.toFixed(2)})`)
    else lines.push(`Field coherence is neutral (${field.toFixed(2)})`)

    lines.push(
        `Attractor: ${safeText(attractor.type, "unknown")} (${clamp01Local(attractor.intensity ?? 0).toFixed(2)})`
    )

    lines.push(
        `Network support/conflict: ${safeNum(network.supportRatio ?? 0, 0).toFixed(2)} / ${safeNum(network.conflictRatio ?? 0, 0).toFixed(2)}`
    )

    lines.push(
        `Memory influence: seal ${safeNum(mem.seal, 0).toFixed(2)} • kin ${safeNum(mem.kin, 0).toFixed(2)} • user ${safeNum(mem.user, 0).toFixed(2)}`
    )

    lines.push(
        `Prediction / noise: ${prediction.toFixed(2)} / ${noise.toFixed(2)}`
    )

    return lines
}

function getScientificValidation() {
    const stats = window.mtosForecastStats || {}
    const auto = window.mtosAutoModeFeedback || {}

    const total = safeNum(stats.total ?? 0, 0)
    const resolved = safeNum(stats.resolved ?? 0, 0)
    const correct = safeNum(stats.correct ?? 0, 0)
    const pending = Math.max(0, total - resolved)
    const hitRate = resolved > 0 ? correct / resolved : 0

    return {
        total,
        resolved,
        correct,
        pending,
        hitRate: Number(hitRate.toFixed(2)),
        autoFeedback: safeText(auto.label ?? auto.result ?? auto.feedback ?? "not available", "not available")
    }
}

function getAttractorLabel() {
    const a = window.mtosAttractorState || {}
    return `${safeText(a.type, "unknown")} (${clamp01Local(a.intensity ?? 0).toFixed(2)})`
}

const MTOS_LEARNING_KEY = "mtos_learning_loop_v1"

function loadLearningState() {
    try {
        const raw = localStorage.getItem(MTOS_LEARNING_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed && typeof parsed === "object") return parsed
    } catch (e) {
        console.warn("learning load failed", e)
    }

    return {
        totalSteps: 0,
        successfulSteps: 0,
        failedSteps: 0,
        modeStats: {
            FOCUS: { ok: 0, bad: 0 },
            REST: { ok: 0, bad: 0 },
            EXPLORE: { ok: 0, bad: 0 },
            INTERACT: { ok: 0, bad: 0 },
            UNKNOWN: { ok: 0, bad: 0 }
        },
        attractorStats: {
            stable: { ok: 0, bad: 0 },
            cycle: { ok: 0, bad: 0 },
            trend: { ok: 0, bad: 0 },
            chaos: { ok: 0, bad: 0 },
            unknown: { ok: 0, bad: 0 }
        },
        history: []
    }
}

function saveLearningState(state) {
    try {
        localStorage.setItem(MTOS_LEARNING_KEY, JSON.stringify(state))
    } catch (e) {
        console.warn("learning save failed", e)
    }
}

function computeLearningSignal({ forecastHit, autoHelpful, stability, pressure, conflict }) {
    let score = 0

    score += (forecastHit ? 1 : 0) * 0.45
    score += (autoHelpful ? 1 : 0) * 0.30
    score += Math.max(0, Math.min(1, Number(stability ?? 0.5))) * 0.20
    score -= Math.max(0, Math.min(1, Number(pressure ?? 0))) * 0.10
    score -= Math.max(0, Math.min(1, Number(conflict ?? 0))) * 0.10

    return Math.max(-1, Math.min(1, score))
}

function updateSelfLearningLoop({
    name,
    dayState,
    mode,
    attractorType,
    forecastStats,
    autoModeFeedback
}) {
    const state = loadLearningState()

    const safeMode = mode || "UNKNOWN"
    const safeAttractor = attractorType || "unknown"

    if (!state.modeStats[safeMode]) {
        state.modeStats[safeMode] = { ok: 0, bad: 0 }
    }

    if (!state.attractorStats[safeAttractor]) {
        state.attractorStats[safeAttractor] = { ok: 0, bad: 0 }
    }

    const resolved = Number(forecastStats?.resolved ?? 0)
    const correct = Number(forecastStats?.correct ?? 0)

    const forecastHit = resolved > 0 ? (correct / resolved) >= 0.5 : false
    const autoHelpful = !!autoModeFeedback?.wasHelpful

    const signal = computeLearningSignal({
        forecastHit,
        autoHelpful,
        stability: dayState?.stability ?? 0.5,
        pressure: dayState?.pressure ?? 0,
        conflict: dayState?.conflict ?? 0
    })

    const success = signal >= 0.15
    const failure = signal <= -0.15

    state.totalSteps += 1
    if (success) state.successfulSteps += 1
    if (failure) state.failedSteps += 1

    if (success) {
        state.modeStats[safeMode].ok += 1
        state.attractorStats[safeAttractor].ok += 1
    } else if (failure) {
        state.modeStats[safeMode].bad += 1
        state.attractorStats[safeAttractor].bad += 1
    }

    state.history.push({
        t: Date.now(),
        user: name || "anon",
        mode: safeMode,
        attractorType: safeAttractor,
        signal: Number(signal.toFixed(3)),
        forecastHit,
        autoHelpful,
        stability: Number(dayState?.stability ?? 0.5),
        pressure: Number(dayState?.pressure ?? 0),
        conflict: Number(dayState?.conflict ?? 0)
    })

    if (state.history.length > 500) state.history.shift()

    saveLearningState(state)

    return { state, signal }
}

window.updateSelfLearningLoop = updateSelfLearningLoop

function getLearningSummary() {
    const s = loadLearningState()
    const total = Number(s.totalSteps ?? 0)
    const ok = Number(s.successfulSteps ?? 0)
    const bad = Number(s.failedSteps ?? 0)
    const rate = total > 0 ? ok / total : 0

    return {
        total,
        ok,
        bad,
        rate: Number(rate.toFixed(2))
    }
}

function renderTodayBlock(data){

    const el = document.getElementById("todayBlock")

    const modeMap = {
        FOCUS: "Deep Work",
        FLOW: "Creative Flow",
        NEUTRAL: "Balanced",
        FATIGUE: "Low Energy",
        RECOVERY: "Recovery"
    }

    el.innerHTML = `
    <div class="today-card">

        <div class="today-top">
            <div class="today-user">
                <div class="label">USER</div>
                <div class="value">
                    Kin ${data.kin} — ${data.seal} (Tone ${data.tone})
                </div>
            </div>

            <div class="today-day">
                <div class="label">TODAY</div>
                <div class="value">
                    Kin ${data.today_kin} — ${data.today_seal} (Tone ${data.today_tone})
                </div>
            </div>
        </div>

        <div class="today-state">
            <div class="state-main">
                ${data.state} — ${modeMap[data.state] || ""}
            </div>

            <div class="state-sub">
                Attention: ${data.attention.toFixed(2)} |
                Entropy: ${data.entropy.toFixed(2)} |
                Predictability: ${data.predictability}
            </div>
        </div>

    </div>
    `
}

window.getAccuracy = function(){

    const logs = window.MTOS_LOG || []

    const feedback = logs.filter(e => e.type === "user_feedback")

    if(!feedback.length) return "0%"

    const correct = feedback.filter(
        e => e.predictedState === e.realState
    ).length

    return (correct / feedback.length * 100).toFixed(1) + "%"
}

function alreadyConfirmedYesterday(){

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const day = yesterday.toISOString().slice(0,10)

    const logs = window.MTOS_LOG || []

    return logs.some(e =>
        e.type === "user_feedback" &&
        e.day === day
    )
}

function showSimplePrompt(){
    return
}

window.confirmYesterday = function(realState){

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const day = yesterday.toISOString().slice(0,10)

    const logs = window.MTOS_LOG || []

    const predicted = logs
        .filter(e => e.type === "daily_snapshot" && e.day === day)
        .slice(-1)[0]?.dayLabel || "UNKNOWN"

    logEvent("user_feedback", {
        day,
        predictedState: predicted,
        realState
    })

    const el = document.getElementById("mtosPrompt")
    if(el) el.remove()
}

function updateMTOSLogoVisual(){

    const logo = document.querySelector(".mtos-logo")
    if(!logo) return

    const state = window.mtosCollectiveState || {}

    const attractor = state.attractorType || "unknown"
    const pressure = state.pressure || 0

    logo.style.filter = ""
    logo.style.transform = ""

    if(attractor === "chaos"){
        logo.style.filter = "hue-rotate(120deg) brightness(1.4)"
        logo.style.transform = "scale(1.08)"
    }
    else if(attractor === "stable"){
        logo.style.filter = "brightness(0.9)"
    }
    else if(attractor === "trend"){
        logo.style.filter = "hue-rotate(40deg)"
    }
    else if(attractor === "cycle"){
        logo.style.filter = "hue-rotate(200deg)"
    }

    if(pressure > 0.6){
        logo.style.boxShadow = "0 0 20px rgba(255,80,80,0.6)"
    } else {
        logo.style.boxShadow = "none"
    }
}

function blendStates(prev, next, alpha) {
  return {
    ...next,
    mode: alpha > 0.5 ? prev.mode : next.mode,
    risk: prev.risk * alpha + next.risk * (1 - alpha)
  };
}

window._rerenderNetworkOnly = () => {
    if (window.__suppressNetworkRerender) return

    const liveUsers =
        Array.isArray(getUsers(MTOS_GLOBALS)) && getUsers(MTOS_GLOBALS).length
            ? getUsers(MTOS_GLOBALS)
            : (Array.isArray(window.currentUsers) ? window.currentUsers : [])

    window.currentUsers = JSON.parse(JSON.stringify(Array.isArray(liveUsers) ? liveUsers : []))

    const netRelations = Array.isArray(window.currentNetworkRelations)
        ? window.applyMTOSMemoryToRelations(window.currentNetworkRelations)
        : []

    const relationSummary = {
        supportCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("support")).length,
        conflictCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("conflict")).length,
        ultraCount: netRelations.filter(x => String(x.type || "").toLowerCase().includes("ultra")).length
    }

    window.updateMTOSBranch("network", {
        relations: netRelations,
        relationSummary,
        timePressure: Number(window.mtosTimePressureSummary?.value ?? 0)
    })

    if (
    typeof window._networkRedraw === "function" &&
    Array.isArray(window.currentUsers) &&
    Array.isArray(getUsers(MTOS_GLOBALS)) &&
    window.currentUsers.length === getUsers(MTOS_GLOBALS).length
) {
    window._networkRedraw()
    return
}

    drawNetwork(
        "networkMap",
        window.currentUsers,
        window.onUserSelect || null,
        window._matrix || null
    )
}

window._rerenderDecisionOnly = function () {
    if (typeof window.renderDecisionSummaryPanel === "function") {
        window.renderDecisionSummaryPanel("todayPanel");
    }
};

function getLiveI18nDeps() {
    return {
        t: typeof window.t === "function" ? window.t : t,
        translateModeLabel:
            typeof window.translateModeLabel === "function"
                ? window.translateModeLabel
                : translateModeLabel,
        translateRelationLabel:
            typeof window.translateRelationLabel === "function"
                ? window.translateRelationLabel
                : translateRelationLabel,
        translateRiskLabel:
            typeof window.translateRiskLabel === "function"
                ? window.translateRiskLabel
                : translateRiskLabel
    };
}

window._rerenderMTOS = function () {
    try {
        const i18n = getLiveI18nDeps();

        renderSystemEventsPanel({
            ...i18n,
            getState: () => window.MTOS_STATE || {}
        });

        renderSystemDecisionPanel({
            ...i18n,
            renderSystemDecisionMetrics,
            getState: () => window.MTOS_STATE || {}
        });

        renderDecisionTargetsPanel({
            t: i18n.t,
            getState: () => window.MTOS_STATE || {},
            getSelectedDecisionTarget,
            setSelectedDecisionTarget,
            resolveDecisionTargets: () => resolveDecisionTargetsLocal({
                t: i18n.t,
                getCurrentUserName,
                getSelectedDecisionTarget,
                getState: () => window.MTOS_STATE || {},
                getDecision: () => window.mtosDecision || {},
                getRelations: () => window.currentNetworkRelations || []
            }),
            renderDecisionSummaryPanel: (targetId = "humanLayer") => renderDecisionSummaryPanel(targetId),
            renderSystemDecisionPanel: () => renderSystemDecisionPanel({
                ...i18n,
                renderSystemDecisionMetrics,
                getState: () => window.MTOS_STATE || {}
            }),
            renderActionTracePanel: () => renderActionTracePanel({
                ...i18n,
                getDecision: () => window.mtosDecision || {},
                getDayState: () => window.mtosDayState || {},
                getTimePressureSummary: () => window.mtosTimePressureSummary || {},
                getState: () => window.MTOS_STATE || {}
            })
        });

        renderFieldTensionPanel({
            t: i18n.t,
            getDayState: () => window.mtosDayState || {},
            getTimePressureSummary: () => window.mtosTimePressureSummary || {},
            getMetabolicMetrics: () => window.mtosMetabolicMetrics || {},
            getCollectiveState: () => window.mtosCollectiveState || {}
        });

        renderActionTracePanel({
            ...i18n,
            getDecision: () => window.mtosDecision || {},
            getDayState: () => window.mtosDayState || {},
            getTimePressureSummary: () => window.mtosTimePressureSummary || {},
            getState: () => window.MTOS_STATE || {}
        });

        renderDecisionMetrics();

        if (typeof window.applyMTOSLang === "function") {
            window.applyMTOSLang(window.mtosLang || window.MTOS_LANG || "en");
        }
    } catch (e) {
        console.error("MTOS rerender failed:", e);
    }
};