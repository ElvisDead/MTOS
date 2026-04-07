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

const MTOS_VIEW_MODE_KEY = "mtos_view_mode_v1"

const MTOS_LANG_KEY = "mtos_lang_v1"

const mtosTranslations = {
  en: {
    weather_title: "METABOLIC WEATHER"
  },
  ru: {
    weather_title: "МЕТАБОЛИЧЕСКАЯ ПОГОДА"
  }
}

function updateStaticTexts(){
  const el = document.getElementById("weatherTitle")
  if(el) el.innerText = t("weather_title")
}

function loadMTOSLang(){
    try{
        const raw = localStorage.getItem(MTOS_LANG_KEY)
        return raw === "ru" ? "ru" : "en"
    }catch(e){
        return "en"
    }
}

function saveMTOSLang(lang){
    try{
        localStorage.setItem(MTOS_LANG_KEY, lang === "ru" ? "ru" : "en")
    }catch(e){}
}

const MTOS_I18N = {
    en: {
        ready: "Ready",
        running: "Running...",
        done: "Done",
        doneCache: "Done (cache)",
        error: "ERROR",
        enterDate: "Enter date",

        editOn: "EDIT ON",
        editOff: "EDIT OFF",

        confidence: "Confidence",
        do: "Do",
        avoid: "Avoid",

        todaySummary: "Today Summary",
        mode: "Mode",
        risk: "Risk",
        nextMove: "Next Move",
        currentBestPosture: "Current best posture",
        adjustedByLearning: "Adjusted by learning history",
        primary: "Primary",
        secondary: "Secondary",
        noSecondaryDriver: "No secondary driver",

        decisionBridge: "Decision Bridge",
        modeRiskAligned: "Mode / risk aligned",
        learningAdjusted: "Learning-adjusted",

        whyThisDay: "Why This Day",
        learningSignal: "Learning Signal",
        feedback: "Feedback",

        selectedTarget: "Selected target",
        wasContactUseful: "Was contact with this person actually useful today?",
        wasModeUseful: "Was today's mode actually useful for you?",

        good: "Good",
        neutral: "Neutral",
        bad: "Bad",

        feedbackSaved: "Feedback saved",
        manualFeedbackNote: "Manual feedback updates learning for similar states and also modifies the selected relation in Network / Collective.",

        decisionTargets: "Decision Targets",
        chooseOneTarget: "Choose one target for today",
        bestContactNow: "Best contact now",
        possibleContacts: "Possible contacts",
        avoidToday: "Avoid today",
        allAgents: "All agents",
        noPrimaryTargets: "No primary targets",
        noNeutralTargets: "No neutral targets",
        noAvoidTargets: "No avoid targets",
        noAgentsFound: "No agents found",
        inNetwork: "In network",
        selected: "Selected",
        select: "Select",
        contact: "Contact",
        unmark: "Unmark",
        selectedTargetBadge: "Selected target",
        manualTarget: "manual target",
        realContact: "real contact",

        systemOutput: "System Output",
        reason: "Reason",
        bestTargetNow: "Best target now",

        backgroundMode: "Background Mode",
        noMajorEvent: "No major event threshold reached.",
        type: "Type",
        level: "Level",
        score: "Score",

        fieldTension: "Field Tension",
        pressure: "Pressure",
        stability: "Stability",
        consistency: "Consistency",
        gradient: "Gradient",
        interpretation: "Interpretation",
        highTension: "HIGH TENSION",
        mediumTension: "MEDIUM TENSION",
        lowTension: "LOW TENSION",
        uneven: "uneven",
        mixed: "mixed",
        stable: "stable",
        fieldCompressed: "Field is compressed. Actions amplify consequences.",
        fieldActive: "Field is active. Choose direction carefully.",
        fieldOpen: "Field is open enough for soft movement.",

        actionTrace: "Action Trace",

        historyEfficiency: "History Efficiency",
        noHistoryYet: "No history yet. Run MTOS on different days and leave feedback.",
        days: "Days",
        avgPredictability: "Avg Predictability",
        antiFail: "Anti-Fail",
        modeEfficiency: "Mode Efficiency",
        dayTypeEfficiency: "Day Type Efficiency",
        recentDays: "Recent Days",
        averageTimePressure: "Average time pressure",

        noSnapshotsYet: "No snapshots yet",
        runDifferentDays: "Run MTOS on different days to build history",
        predictabilityWord: "predictability",
        feedbackWord: "feedback",

        deepWork: "Deep work. Work alone.",
        distractions: "Distractions. Social noise.",
        communicate: "Communicate. Build connections.",
        isolation: "Isolation.",
        tryNewThings: "Try new things.",
        routineLoops: "Routine loops.",
        recoverSlowDown: "Recover. Slow down.",
        overload: "Overload.",

        systemEventsTitle: "SYSTEM EVENTS",
systemDecisionTitle: "SYSTEM DECISION",

modeFocus: "FOCUS",
modeAdjust: "ADJUST",
modeRest: "REST",
modeExplore: "EXPLORE",
modeInteract: "INTERACT",

riskLow: "LOW",
riskMedium: "MEDIUM",
riskHigh: "HIGH",
riskCritical: "CRITICAL",

noStrongFeedbackPattern: "No strong feedback pattern yet.",
derivedFromCachedDayState: "Derived from cached day state.",
derivedFromDayState: "Derived from day state, time pressure, and memory.",

decisionTextFocusBetter: "FOCUS — this mode has worked better for you in similar states.",
decisionTextAdjustBetter: "ADJUST — past feedback suggests flexibility works better here than tightening.",
decisionTextRestSafer: "REST — past feedback suggests recovery is safer here.",
decisionTextExploreBetter: "EXPLORE — flexible mode fits better than forcing execution.",
decisionTextInteractBetter: "INTERACT — social/action mode has better past response here.",

pastFeedbackBadSwitched: "Past feedback says {from} performs badly in similar states; switched to {to}.",
pastFeedbackBadReduced: "Past feedback says {mode} often performs badly in similar states; confidence reduced.",
pastFeedbackGoodIncreased: "Past feedback says {mode} performs well in similar states; confidence increased.",

ultraSynergy: "Ultra Synergy",
strongSupport: "Strong Support",
support: "Support",
neutral: "Neutral",
conflict: "Conflict",
strongConflict: "Strong Conflict",

adjust: "Adjust",

eventTypeBackground: "background",
levelLow: "low",
levelMedium: "medium",
levelHigh: "high",
noSystemDecisionYet: "No system decision yet",
observeField: "Observe the field.",
noReason: "No reason",

scoreWord: "score",
realContactWord: "real contact",
manualTargetWord: "manual target",
kinWord: "kin",

tensionWord: "TENSION",
temporalModeLabel: "Temporal Mode",

ifModePrefix: "If",
ifContactPrefix: "If you contact",
ifChoosePrimary: "If you choose one of the primary contacts:",

veryStrongAlignmentToday: "This target has very strong alignment today",
supportiveNeedsCleanTiming: "This target is supportive, but needs clean timing",
keepInteractionShort: "Keep the interaction short and precise",
oneDirectContactBetter: "One direct contact is better than multiple parallel contacts",

strongestAlignment: "strongest alignment",
stableExpansion: "stable expansion",
safeReinforcement: "safe reinforcement",

networkMayExpand: "Network may expand",
stabilityMayDipReactive: "Stability may dip if contact becomes reactive",
constructiveAlignmentLikely: "Constructive alignment is likely if contact stays clean",
parallelContactsOverload: "Parallel contacts may create overload",
oneDirectContactFavored: "One direct contact is favored over many weak contacts",

focusNarrowExecution: "Stability can improve through narrower execution",
focusNetworkCompress: "Network activity will likely compress",
focusBranchesReduce: "New external branches may reduce coherence",

adjustFixationRising: "Fixation is rising, so flexibility is safer than tightening",
adjustReopenAlternative: "Reopen one alternative before hard commitment",
adjustSmallCorrection: "A small course correction is better than forcing certainty",

restPressureDecrease: "Pressure can decrease if commitments are reduced",
restOpportunitiesRemain: "Opportunities remain, but active expansion slows down",
restMaintenanceBest: "Best effect comes from maintenance, not push",

exploreSignalsDiversify: "Signals may diversify before they stabilize",
exploreUsefulPaths: "Useful paths can appear, but certainty stays low",
exploreTooManyExperiments: "Too many experiments may scatter energy",

today_mode: "Today Mode",
day_type: "Day Type",
energy: "Energy",
trust: "Trust",
time_pressure: "Time pressure",
real_contacts: "Real contacts",
attractor: "Attractor",

map_mode: "Map Mode",
mode_full: "Full",
mode_users_field: "Users / Field",
mode_pressure: "Pressure",

desc_full: "Overall cognitive climate.",
desc_users: "Where participants and active zones are concentrated.",
desc_pressure: "Where overload and tension accumulate.",

legend: "Legend",
low_field: "Low field",
balanced: "Balanced",
high_field: "High field",

quick_reading: "Quick reading",
hot_zone: "Hot zone",
cold_zone: "Cold zone",
risk_zone: "Risk zone",
white_frame: "White frame",
yellow_frame: "Yellow frame",

hot_zone_desc: "Better for movement, focus, and active steps.",
cold_zone_desc: "Better for rest, observation, and low-pressure tasks.",
risk_zone_desc: "Tension, overload, or conflict may rise here.",
white_frame_desc: "your current kin.",
yellow_frame_desc: "today's kin.",

about_map: "About this map",
map_desc: "13×20 cognitive field (260 states).",
horizontal: "Horizontal",
vertical: "Vertical",
click_hint: "Click any cell to inspect the current state.",

advice_default: "Observe the zone.",
avoid_default: "Avoid overreaction.",
advice_hot: "Good zone for action, movement, and active decisions.",
avoid_hot: "Avoid wasting the window.",
advice_cold: "Better for rest, observation, or low-pressure tasks.",
avoid_cold: "Avoid forcing output.",
advice_risk: "Tension is high here. Move carefully.",
avoid_risk: "Avoid conflict, overload, and irreversible moves.",
advice_balanced: "Balanced zone for moderate work.",
avoid_balanced: "Avoid reading too much into weak signals.",

no_participants_in_kin: "No participants in this kin",
no_users: "No users",
what_to_do_here: "What to do here",
participants: "Participants",
your_day_type: "Your day type",
current_mode: "Current mode",
day_index: "Day index",
tone: "Tone",
seal: "Seal",
users: "Users",

"Balanced zone": "Balanced zone",
"Risk zone": "Risk zone",
"Hot zone": "Hot zone",
"Cold zone": "Cold zone",

High: "High",
Medium: "Medium",
Low: "Low",
Overload: "Overload",
Conflict: "Conflict",
Chaotic: "Chaotic",
Compressed: "Compressed",
Manageable: "Manageable",

attention: "Attention",
conflict: "Conflict",

collectiveSectionTitle: "COLLECTIVE",
collectiveRelationsTitle: "Collective Relations",
systemTemperature: "System Temperature",
attractorWord: "Attractor",
unknownWord: "unknown",
notEnoughParticipants: "Not enough participants",
scoreLabel: "Score",
systemMetricsTitle: "SYSTEM METRICS",

leftClickSupport: "Left click → Support (+)",
rightClickConflict: "Right click → Conflict (−)",
shiftClickNeutral: "Shift + Click → Neutral (0)",

collectiveDescLine1: "The system reveals dynamic relationships between participants.",
collectiveDescLine2: "Connections evolve over time, influenced by user actions, internal dynamics, time pressure, and random events.",

metricPhiDesc: "Φ (energy) → strength of meaningful interactions",
metricKDesc: "k (coherence) → how structured the system is",
metricConsistencyDesc: "consistency → system stability (0 = balanced, >0 = unstable)",
attractorDynamicPattern: "Attractor → dynamic pattern:",
attractorModesLine: "stable / cycle / trend / chaos / unknown",

attractorStable: "stable",
attractorCycle: "cycle",
attractorTrend: "trend",
attractorChaos: "chaos",

leftClickSupport: "Left click → Support (+)",
rightClickConflict: "Right click → Conflict (−)",
shiftClickNeutral: "Shift + Click → Neutral (0)",

collectiveDescLine1: "The system reveals dynamic relationships between participants.",
collectiveDescLine2: "Connections evolve over time, influenced by user actions, internal dynamics, time pressure, and random events.",

systemMetricsTitle: "SYSTEM METRICS",

metricPhiDesc: "Φ (energy) → strength of meaningful interactions",
metricKDesc: "k (coherence) → how structured the system is",
metricConsistencyDesc: "consistency → system stability (0 = balanced, >0 = unstable)",

attractorDynamicPattern: "Attractor → dynamic pattern:",
attractorModesLine: "stable / cycle / trend / chaos / unknown",

collaborate: "Collaborate",
tension: "Tension",
collectiveSectionTitle: "COLLECTIVE",
strong: "Strong",

attractorSectionTitle: "ATTRACTOR",
historyEfficiencySectionTitle: "HISTORY EFFICIENCY",
seriesSectionTitle: "SERIES",
toolsSectionTitle: "TOOLS",

collaborate: "Collaborate",
tension: "Tension",

attractorMapTitle: "ATTRACTOR MAP",
attractorCellTitle: "ATTRACTOR CELL",
clickAnyCellInspect: "Click any cell to inspect local structure.",

rowSeal: "Row seal",
columnSeal: "Column seal",
kinLabel: "Kin",
segmentLabel: "Segment",
localIndexLabel: "Local index",

heatLabel: "Heat",
memoryBoostLabel: "Memory boost",
segmentFieldLabel: "Segment field",
pressureMulLabel: "Pressure ×",
tempMulLabel: "Temp ×",
memoryGainLabel: "Memory gain",
diffusionLabel: "Diffusion",
pullMulLabel: "Pull ×",
flowXLabel: "Flow X",
flowYLabel: "Flow Y",
strengthLabel: "Strength",
directionLabel: "Direction",
laplacianLabel: "Laplacian",
contrastLabel: "Contrast",

zoneTypeLabel: "Zone type",
supportAvgLabel: "Support avg",
conflictAvgLabel: "Conflict avg",
usersLabel: "Users",

archetypePolarityLabel: "Archetype polarity",
userPolarityLabel: "User polarity",
alignmentLabel: "Alignment",
tensionLabel: "Tension",

sealMemoryLabel: "Seal memory",
userMemoryLabel: "User memory",
membersLabel: "Members",

noUsersWord: "No users",
noSocialLayerData: "No social layer data for this cell",
noPolarityData: "No polarity data",
noAccumulatedMemorySignal: "No accumulated memory signal",

sealMemoryDesc: "Seal memory = long-term archetype reinforcement.",
userMemoryDesc: "User memory = personal accumulated reinforcement.",

zonePeakBasinDesc: "High-value pocket with low local drift. Stable synergy center.",
zoneWeakBasinDesc: "Low-energy pocket. Weak basin or depleted zone.",
zoneRidgeDesc: "Steep transition. Strong directional pull nearby.",
zoneChannelDesc: "Energy is moving through this zone.",
zoneUnstablePocketDesc: "Local curvature is unstable. Watch for sudden flips.",
zoneNeutralFieldDesc: "Balanced local field without dominant pull.",

heatmapFlowField: "Heatmap + Flow Field",
brightStrongSynergy: "Bright = strong synergy / attractor",
arrowsDirectionField: "Arrows = local direction of field movement",
clickCellMiniAnalysis: "Click cell = mini-analysis at right",

attractorDescTitle: "MTOS Attractor Heatmap + Flow Field",
eachCellShows: "Each cell shows interaction intensity between row archetype A and column archetype B.",
heatLabelTitle: "Heat",
flowLabelTitle: "Flow",
phaseOverlayTitle: "4×65 phase overlay",
rightPanelTitle: "Right panel",

heatDarkDesc: "dark = weak zone",
heatBrightDesc: "bright = strong synergy / pull",
heatRedOutlineDesc: "red outline = unstable / weak basin",
heatSoftGlowDesc: "soft glow = peak attractor zone",

flowArrowDirectionDesc: "arrow direction = local gradient direction",
flowArrowSizeDesc: "arrow size = gradient strength",

phaseBlueDesc: "blue frame = initiation",
phaseGreenDesc: "green frame = growth",
phaseAmberDesc: "amber frame = peak",
phaseRedDesc: "red frame = release",

rightPanelClickedDesc: "clicked cell mini-analysis",
rightPanelLocalDesc: "local field structure",
rightPanelSegmentDesc: "segment profile",
rightPanelSupportDesc: "support / conflict",
rightPanelMembersDesc: "member list",

pauseBtn: "Pause",
resumeBtn: "Resume",
slowBtn: "Slow",
normalBtn: "Normal",
boostBtn: "Boost",
resetFieldBtn: "Reset Field",

attractorDynamicFieldTitle: "MTOS Attractor — Dynamic Cognitive Field Visualization",
attractorDynamicFieldLine1: "This system represents a 260-node cyclic field evolving under metabolic dynamics.",
attractorDynamicFieldLine2: "Each point corresponds to a node in the field:",
attractorXAxis: "X-axis — position in the 260-cycle",
attractorYAxis: "Y-axis — signal intensity",
attractorCoreDynamics: "Core dynamics:",
attractorMemory: "Memory — stabilizes recurring patterns (attractor formation)",
attractorPressure: "Pressure — suppresses unstable signals (skepticism)",
attractorTemperature: "Temperature — introduces variability (activity / noise)",
attractorPhase: "Phase — modulates behavior across 13-cycle temporal states",
attractorPersistent: "Persistent field memory — yesterday’s field continues influencing today",
attractorEvolves: "The attractor evolves in real time, showing:",
attractorFormation: "formation of patterns",
attractorCollapse: "collapse of unstable structures",
attractorEmergence: "emergence of coherent clusters",
attractorNotStatic: "This is not a static graph, but a living system.",
systemWord: "system",
behaviorWord: "behavior",

seriesLegend: `These charts represent temporal dynamics inside the 260-state cognitive cycle.

• 7 days — short-term attention dynamics
• 30 days — medium-range behavioral drift
• 260 days — full-cycle attention structure

• Φ series — metabolic intensity / integrated cognitive load
• T series — processing temperature / activation intensity
• Consistency series — internal coherence of the current regime

All charts are displayed on a fixed 0..1 scale for visual comparison.`
    },

    ru: {
        ready: "Готово",
        running: "Запуск...",
        done: "Готово",
        doneCache: "Готово (кэш)",
        error: "ОШИБКА",
        enterDate: "Введите дату",

        editOn: "РЕДАКТ. ВКЛ",
        editOff: "РЕДАКТ. ВЫКЛ",

        confidence: "Уверенность",
        do: "Делать",
        avoid: "Избегать",

        todaySummary: "Сводка дня",
        mode: "Режим",
        risk: "Риск",
        nextMove: "Следующий шаг",
        currentBestPosture: "Лучшее текущее положение",
        adjustedByLearning: "Скорректировано обучением",
        primary: "Основной",
        secondary: "Вторичный",
        noSecondaryDriver: "Нет вторичного фактора",

        modeRiskAligned: "Режим / риск согласованы",
        learningAdjusted: "Скорректировано обучением",

        whyThisDay: "Почему такой день",
        learningSignal: "Сигнал обучения",
        feedback: "Обратная связь",

        selectedTarget: "Выбранная цель",
        wasContactUseful: "Был ли контакт с этим человеком полезен сегодня?",
        wasModeUseful: "Был ли сегодняшний режим полезен для тебя?",

        good: "Хорошо",
        neutral: "Нейтрально",
        bad: "Плохо",

        feedbackSaved: "Оценка сохранена",
        manualFeedbackNote: "Ручная оценка обновляет обучение для похожих состояний и также меняет выбранную связь в Network / Collective.",

        decisionTargets: "Цели решения",
        chooseOneTarget: "Выбери одну цель на сегодня",
        bestContactNow: "Лучший контакт сейчас",
        possibleContacts: "Возможные контакты",
        avoidToday: "Избегать сегодня",
        allAgents: "Все агенты",
        noPrimaryTargets: "Нет основных целей",
        noNeutralTargets: "Нет нейтральных целей",
        noAvoidTargets: "Нет целей на избегание",
        noAgentsFound: "Агенты не найдены",
        inNetwork: "В сети",
        selected: "Выбран",
        select: "Выбрать",
        contact: "Контакт",
        unmark: "Снять",
        selectedTargetBadge: "Выбранная цель",
        manualTarget: "ручная цель",
        realContact: "реальный контакт",

        systemOutput: "Выход системы",
        reason: "Причина",
        bestTargetNow: "Лучшая цель сейчас",

        backgroundMode: "Фоновый режим",
        noMajorEvent: "Сильный порог события не достигнут.",
        type: "Тип",
        level: "Уровень",
        score: "Оценка",

        fieldTension: "Напряжение поля",
        pressure: "Давление",
        stability: "Стабильность",
        consistency: "Согласованность",
        gradient: "Градиент",
        interpretation: "Интерпретация",
        highTension: "ВЫСОКОЕ НАПРЯЖЕНИЕ",
        mediumTension: "СРЕДНЕЕ НАПРЯЖЕНИЕ",
        lowTension: "НИЗКОЕ НАПРЯЖЕНИЕ",
        uneven: "неровный",
        mixed: "смешанный",
        stable: "стабильный",
        fieldCompressed: "Поле сжато. Действия сильнее усиливают последствия.",
        fieldActive: "Поле активно. Выбирай направление аккуратно.",
        fieldOpen: "Поле достаточно открыто для мягкого движения.",

        actionTrace: "Траектория действия",

        historyEfficiency: "Эффективность истории",
        noHistoryYet: "Истории пока нет. Запускай MTOS в разные дни и оставляй оценку.",
        days: "Дней",
        avgPredictability: "Средн. предсказуемость",
        antiFail: "Анти-провал",
        modeEfficiency: "Эффективность режимов",
        dayTypeEfficiency: "Эффективность типов дня",
        recentDays: "Последние дни",
        averageTimePressure: "Среднее давление времени",

        noSnapshotsYet: "Снимков пока нет",
        runDifferentDays: "Запускай MTOS в разные дни, чтобы собрать историю",
        predictabilityWord: "предсказуемость",
        feedbackWord: "оценка",

        deepWork: "Глубокая работа. Работай один.",
        distractions: "Отвлечения. Социальный шум.",
        communicate: "Общайся. Укрепляй связи.",
        isolation: "Изоляция.",
        tryNewThings: "Пробуй новое.",
        routineLoops: "Рутинные петли.",
        recoverSlowDown: "Восстановление. Сбавь темп.",
        overload: "Перегрузка.",

        systemEventsTitle: "СИСТЕМНЫЕ СОБЫТИЯ",
        systemDecisionTitle: "СИСТЕМНОЕ РЕШЕНИЕ",

        modeFocus: "ФОКУС",
        modeAdjust: "ПОДСТРОЙКА",
        modeRest: "ОТДЫХ",
        modeExplore: "ИССЛЕДОВАНИЕ",
        modeInteract: "КОНТАКТ",

        riskLow: "НИЗКИЙ",
        riskMedium: "СРЕДНИЙ",
        riskHigh: "ВЫСОКИЙ",
        riskCritical: "КРИТИЧЕСКИЙ",

        noStrongFeedbackPattern: "Пока нет сильного паттерна обратной связи.",
        derivedFromCachedDayState: "Выведено из кэшированного состояния дня.",
        derivedFromDayState: "Выведено из состояния дня, давления времени и памяти.",

        decisionTextFocusBetter: "ФОКУС — этот режим раньше работал у тебя лучше в похожих состояниях.",
        decisionTextAdjustBetter: "ПОДСТРОЙКА — прошлые оценки подсказывают, что здесь гибкость лучше, чем зажатие.",
        decisionTextRestSafer: "ОТДЫХ — прошлые оценки подсказывают, что восстановление здесь безопаснее.",
        decisionTextExploreBetter: "ИССЛЕДОВАНИЕ — гибкий режим здесь лучше, чем форсировать исполнение.",
        decisionTextInteractBetter: "КОНТАКТ — социальный/действенный режим здесь раньше давал лучший отклик.",

        pastFeedbackBadSwitched: "Прошлые оценки показывают, что режим {from} плохо работает в похожих состояниях; переключено на {to}.",
        pastFeedbackBadReduced: "Прошлые оценки показывают, что режим {mode} часто плохо работает в похожих состояниях; уверенность снижена.",
        pastFeedbackGoodIncreased: "Прошлые оценки показывают, что режим {mode} хорошо работает в похожих состояниях; уверенность повышена.",

        ultraSynergy: "Ультра-синергия",
        strongSupport: "Сильная поддержка",
        support: "Поддержка",
        neutral: "Нейтрально",
        conflict: "Конфликт",
        strongConflict: "Сильный конфликт",

        adjust_desc: "Ослабь фиксацию, открой одну альтернативу и продолжай без попытки всё зафиксировать.",
        eventTypeBackground: "фоновый",
        levelLow: "низкий",
        levelMedium: "средний",
        levelHigh: "высокий",
        noSystemDecisionYet: "Системного решения пока нет",
        observeField: "Наблюдай за полем.",
        noReason: "Нет причины",

        scoreWord: "оценка",
realContactWord: "реальный контакт",
manualTargetWord: "ручная цель",
kinWord: "кин",

tensionWord: "НАПРЯЖЕНИЕ",
temporalModeLabel: "Временной режим",

ifModePrefix: "Если",
ifContactPrefix: "Если связаться с",
ifChoosePrimary: "Если выбрать один из основных контактов:",

veryStrongAlignmentToday: "У этой цели сегодня очень сильное совпадение",
supportiveNeedsCleanTiming: "Цель поддерживающая, но требует чистого тайминга",
keepInteractionShort: "Контакт лучше держать коротким и точным",
oneDirectContactBetter: "Один прямой контакт лучше, чем несколько параллельных",

strongestAlignment: "самое сильное совпадение",
stableExpansion: "стабильное расширение",
safeReinforcement: "безопасное усиление",

networkMayExpand: "Сеть может расшириться",
stabilityMayDipReactive: "Стабильность может просесть, если контакт станет реактивным",
constructiveAlignmentLikely: "Конструктивное совпадение вероятно, если контакт останется чистым",
parallelContactsOverload: "Параллельные контакты могут создать перегрузку",
oneDirectContactFavored: "Один прямой контакт предпочтительнее множества слабых",

focusNarrowExecution: "Стабильность может вырасти через более узкое исполнение",
focusNetworkCompress: "Сетевая активность, вероятно, сожмётся",
focusBranchesReduce: "Новые внешние ветви могут снизить цельность",

adjustFixationRising: "Фиксация растёт, поэтому гибкость безопаснее, чем зажатие",
adjustReopenAlternative: "Переоткрой одну альтернативу перед жёсткой фиксацией",
adjustSmallCorrection: "Небольшая коррекция курса лучше, чем форсировать определённость",

restPressureDecrease: "Давление может снизиться, если сократить обязательства",
restOpportunitiesRemain: "Возможности остаются, но активное расширение замедляется",
restMaintenanceBest: "Лучший эффект сейчас даёт поддержание, а не нажим",

exploreSignalsDiversify: "Сигналы могут разойтись, прежде чем стабилизироваться",
exploreUsefulPaths: "Полезные пути могут появиться, но определённость пока низкая",
exploreTooManyExperiments: "Слишком много экспериментов может рассеять энергию",

today_mode: "Режим дня",
day_type: "Тип дня",
energy: "Энергия",
trust: "Доверие",
time_pressure: "Давление времени",
real_contacts: "Реальные контакты",
attractor: "Аттрактор",

map_mode: "Режим карты",
mode_full: "Поле",
mode_users_field: "Пользователи / Поле",
mode_pressure: "Давление",

desc_full: "Общее состояние поля.",
desc_users: "Где сосредоточены участники и активные зоны.",
desc_pressure: "Где накапливается перегрузка и напряжение.",

legend: "Легенда",
low_field: "Низкое поле",
balanced: "Сбалансированное",
high_field: "Высокое поле",

quick_reading: "Быстрое чтение",
hot_zone: "Горячая зона",
cold_zone: "Холодная зона",
risk_zone: "Рисковая зона",
white_frame: "Белая рамка",
yellow_frame: "Жёлтая рамка",

hot_zone_desc: "Лучше подходит для движения, фокуса и активных шагов.",
cold_zone_desc: "Лучше подходит для отдыха, наблюдения и задач с низким давлением.",
risk_zone_desc: "Здесь может расти напряжение, перегрузка или конфликт.",
white_frame_desc: "твой текущий кин.",
yellow_frame_desc: "сегодняшний кин.",

about_map: "О карте",
map_desc: "Поле 13×20 (260 состояний).",
horizontal: "Горизонталь",
vertical: "Вертикаль",
click_hint: "Нажмите на клетку для анализа состояния.",

advice_default: "Наблюдай зону.",
avoid_default: "Избегай переоценки.",
advice_hot: "Хорошая зона для действий, движения и активных решений.",
avoid_hot: "Избегай траты окна.",
advice_cold: "Лучше для отдыха, наблюдения или задач с низким давлением.",
avoid_cold: "Избегай принудительного вывода.",
advice_risk: "Здесь высокое напряжение. Двигайся осторожно.",
avoid_risk: "Избегай конфликта, перегрузки и необратимых действий.",
advice_balanced: "Сбалансированная зона для умеренной работы.",
avoid_balanced: "Избегай чрезмерной интерпретации слабых сигналов.",

no_participants_in_kin: "В этом кине нет участников",
no_users: "Нет пользователей",
what_to_do_here: "Что делать здесь",
participants: "Участники",
your_day_type: "Тип твоего дня",
current_mode: "Текущий режим",
day_index: "Индекс дня",
tone: "Тон",
seal: "Печать",
users: "Пользователи",

"Balanced zone": "Сбалансированная зона",
"Risk zone": "Рисковая зона",
"Hot zone": "Горячая зона",
"Cold zone": "Холодная зона",

High: "Высокая",
Medium: "Средняя",
Low: "Низкая",
Overload: "Перегрузка",
Conflict: "Конфликт",
Chaotic: "Хаотично",
Compressed: "Сжато",
Manageable: "Управляемо",

attention: "Внимание",
conflict: "Конфликт",

collectiveSectionTitle: "КОЛЛЕКТИВ",
collectiveRelationsTitle: "Коллективные связи",
systemTemperature: "Температура системы",
attractorWord: "Аттрактор",
unknownWord: "неизвестно",
notEnoughParticipants: "Недостаточно участников",
scoreLabel: "Оценка",
systemMetricsTitle: "СИСТЕМНЫЕ МЕТРИКИ",

leftClickSupport: "Левый клик → Поддержка (+)",
rightClickConflict: "Правый клик → Конфликт (−)",
shiftClickNeutral: "Shift + Клик → Нейтрально (0)",

collectiveDescLine1: "Система показывает динамические отношения между участниками.",
collectiveDescLine2: "Связи меняются со временем под влиянием действий пользователя, внутренней динамики, давления времени и случайных событий.",

metricPhiDesc: "Φ (энергия) → сила значимых взаимодействий",
metricKDesc: "k (когерентность) → насколько система структурирована",
metricConsistencyDesc: "согласованность → стабильность системы (0 = баланс, >0 = нестабильность)",
attractorDynamicPattern: "Аттрактор → динамический режим:",
attractorModesLine: "стабильность / цикл / тренд / хаос / неизвестно",

attractorStable: "стабильность",
attractorCycle: "цикл",
attractorTrend: "тренд",
attractorChaos: "хаос",

leftClickSupport: "Левый клик → Поддержка (+)",
rightClickConflict: "Правый клик → Конфликт (−)",
shiftClickNeutral: "Shift + Клик → Нейтрально (0)",

collectiveDescLine1: "Система показывает динамические отношения между участниками.",
collectiveDescLine2: "Связи меняются со временем под влиянием действий пользователя, внутренней динамики, давления времени и случайных событий.",

systemMetricsTitle: "СИСТЕМНЫЕ МЕТРИКИ",

metricPhiDesc: "Φ (энергия) → сила значимых взаимодействий",
metricKDesc: "k (когерентность) → насколько система структурирована",
metricConsistencyDesc: "согласованность → стабильность системы (0 = баланс, >0 = нестабильность)",

attractorDynamicPattern: "Аттрактор → динамический режим:",
attractorModesLine: "стабильность / цикл / тренд / хаос / неизвестно",

collaborate: "Сотрудничество",
tension: "Напряжение",
collectiveSectionTitle: "КОЛЛЕКТИВ",
strong: "Сильное",

attractorSectionTitle: "АТТРАКТОР",
historyEfficiencySectionTitle: "ЭФФЕКТИВНОСТЬ ИСТОРИИ",
seriesSectionTitle: "СЕРИИ",
toolsSectionTitle: "ИНСТРУМЕНТЫ",

collaborate: "Сотрудничество",
tension: "Напряжение",

attractorMapTitle: "КАРТА АТТРАКТОРА",
attractorCellTitle: "ЯЧЕЙКА АТТРАКТОРА",
clickAnyCellInspect: "Нажми на любую ячейку, чтобы посмотреть локальную структуру.",

rowSeal: "Печать строки",
columnSeal: "Печать столбца",
kinLabel: "Кин",
segmentLabel: "Сегмент",
localIndexLabel: "Локальный индекс",

heatLabel: "Нагрев",
memoryBoostLabel: "Усиление памяти",
segmentFieldLabel: "Поле сегмента",
pressureMulLabel: "Давление ×",
tempMulLabel: "Температура ×",
memoryGainLabel: "Прирост памяти",
diffusionLabel: "Диффузия",
pullMulLabel: "Тяга ×",
flowXLabel: "Поток X",
flowYLabel: "Поток Y",
strengthLabel: "Сила",
directionLabel: "Направление",
laplacianLabel: "Лапласиан",
contrastLabel: "Контраст",

zoneTypeLabel: "Тип зоны",
supportAvgLabel: "Средняя поддержка",
conflictAvgLabel: "Средний конфликт",
usersLabel: "Пользователи",

archetypePolarityLabel: "Полярность архетипа",
userPolarityLabel: "Полярность пользователя",
alignmentLabel: "Совпадение",
tensionLabel: "Напряжение",

sealMemoryLabel: "Память печати",
userMemoryLabel: "Память пользователя",
membersLabel: "Участники",

noUsersWord: "Нет пользователей",
noSocialLayerData: "Для этой ячейки нет данных социального слоя",
noPolarityData: "Нет данных полярности",
noAccumulatedMemorySignal: "Нет накопленного сигнала памяти",

sealMemoryDesc: "Память печати = долгосрочное усиление архетипа.",
userMemoryDesc: "Память пользователя = личное накопленное усиление.",

zonePeakBasinDesc: "Зона высокого значения с низким локальным дрейфом. Стабильный центр синергии.",
zoneWeakBasinDesc: "Зона низкой энергии. Слабый бассейн или истощённая область.",
zoneRidgeDesc: "Резкий переход. Рядом сильная направленная тяга.",
zoneChannelDesc: "Энергия движется через эту зону.",
zoneUnstablePocketDesc: "Локальная кривизна нестабильна. Возможны резкие перевороты.",
zoneNeutralFieldDesc: "Сбалансированное локальное поле без доминирующей тяги.",

heatmapFlowField: "Тепловая карта + поле потока",
brightStrongSynergy: "Яркое = сильная синергия / аттрактор",
arrowsDirectionField: "Стрелки = локальное направление движения поля",
clickCellMiniAnalysis: "Клик по ячейке = мини-анализ справа",

attractorDescTitle: "Тепловая карта аттрактора MTOS + поле потока",
eachCellShows: "Каждая ячейка показывает интенсивность взаимодействия между архетипом строки A и архетипом столбца B.",
heatLabelTitle: "Нагрев",
flowLabelTitle: "Поток",
phaseOverlayTitle: "Фазовый слой 4×65",
rightPanelTitle: "Правая панель",

heatDarkDesc: "тёмное = слабая зона",
heatBrightDesc: "яркое = сильная синергия / тяга",
heatRedOutlineDesc: "красная обводка = нестабильная / слабая впадина",
heatSoftGlowDesc: "мягкое свечение = пиковая зона аттрактора",

flowArrowDirectionDesc: "направление стрелки = локальное направление градиента",
flowArrowSizeDesc: "размер стрелки = сила градиента",

phaseBlueDesc: "синяя рамка = инициация",
phaseGreenDesc: "зелёная рамка = рост",
phaseAmberDesc: "янтарная рамка = пик",
phaseRedDesc: "красная рамка = спад",

rightPanelClickedDesc: "мини-анализ выбранной ячейки",
rightPanelLocalDesc: "локальная структура поля",
rightPanelSegmentDesc: "профиль сегмента",
rightPanelSupportDesc: "поддержка / конфликт",
rightPanelMembersDesc: "список участников",

pauseBtn: "Пауза",
resumeBtn: "Продолжить",
slowBtn: "Медленно",
normalBtn: "Нормально",
boostBtn: "Ускорить",
resetFieldBtn: "Сбросить поле",

attractorDynamicFieldTitle: "MTOS Аттрактор — визуализация динамического когнитивного поля",
attractorDynamicFieldLine1: "Эта система показывает 260-узловое циклическое поле, развивающееся под метаболической динамикой.",
attractorDynamicFieldLine2: "Каждая точка соответствует узлу поля:",
attractorXAxis: "Ось X — положение в цикле из 260",
attractorYAxis: "Ось Y — интенсивность сигнала",
attractorCoreDynamics: "Основная динамика:",
attractorMemory: "Память — стабилизирует повторяющиеся паттерны (формирование аттрактора)",
attractorPressure: "Давление — подавляет нестабильные сигналы (скепсис)",
attractorTemperature: "Температура — вносит изменчивость (активность / шум)",
attractorPhase: "Фаза — модулирует поведение через временные состояния 13-цикла",
attractorPersistent: "Постоянная память поля — вчерашнее поле продолжает влиять на сегодня",
attractorEvolves: "Аттрактор развивается в реальном времени, показывая:",
attractorFormation: "формирование паттернов",
attractorCollapse: "схлопывание нестабильных структур",
attractorEmergence: "появление когерентных кластеров",
attractorNotStatic: "Это не статичный график, а живая система.",

systemWord: "система",
behaviorWord: "поведение",

seriesLegend: `Эти графики показывают временную динамику внутри 260-состояний когнитивного цикла.

• 7 дней — краткосрочная динамика внимания
• 30 дней — среднесрочный поведенческий дрейф
• 260 дней — полная структура цикла внимания

• Φ серия — метаболическая интенсивность / интегральная когнитивная нагрузка
• T серия — температура обработки / интенсивность активации
• Серия согласованности — внутренняя целостность текущего режима

Все графики отображаются в фиксированном диапазоне 0..1 для наглядного сравнения.`
    }
}

function t(key){
    const lang = window.mtosLang || window.MTOS_LANG || loadMTOSLang()

    const external =
        window.MTOS_TRANSLATIONS?.[lang]?.[key] ??
        window.MTOS_TRANSLATIONS?.en?.[key]

    if (external != null) return external

    return MTOS_I18N[lang]?.[key] ?? MTOS_I18N.en[key] ?? key
}

function setStatusText(key){
    const status = document.getElementById("status")
    if (status) status.innerText = t(key)
}

window.t = t

window.translateModeLabel = translateModeLabel
window.translateRelationLabel = translateRelationLabel
window.translateRiskLabel = translateRiskLabel

function translateModeLabel(mode){
    const m = String(mode || "").toUpperCase()
    if (m === "FOCUS") return t("modeFocus")
    if (m === "ADJUST") return t("modeAdjust")
    if (m === "REST") return t("modeRest")
    if (m === "INTERACT") return t("modeInteract")
    return t("modeExplore")
}

function translateRelationLabel(label){
    const x = String(label || "").toLowerCase().trim()

    if (x.includes("ultra synergy")) return t("ultraSynergy")
    if (x.includes("strong support")) return t("strongSupport")
    if (x.includes("strong conflict")) return t("strongConflict")

    if (x.includes("collaborate")) return t("collaborate")
    if (x.includes("support")) return t("support")
    if (x.includes("tension")) return t("tension")
    if (x.includes("conflict")) return t("conflict")
    if (x.includes("neutral")) return t("neutral")
    if (x === "strong") return t("strong")

    if (x.includes("manual target")) return t("manualTargetWord")
    if (x.includes("real contact")) return t("realContactWord")

    return label || ""
}

function translateRiskLabel(label){
    const r = String(label || "").toUpperCase()
    if (r === "LOW") return t("riskLow")
    if (r === "MEDIUM") return t("riskMedium")
    if (r === "HIGH") return t("riskHigh")
    if (r === "CRITICAL") return t("riskCritical")
    return r
}

function formatI18n(template, vars = {}){
    return String(template || "").replace(/\{(\w+)\}/g, (_, key) => {
        return vars[key] != null ? String(vars[key]) : `{${key}}`
    })
}

function applyMTOSLang(lang){
    const safeLang = lang === "ru" ? "ru" : "en"

    const enBtn = document.getElementById("langEnBtn")
    const ruBtn = document.getElementById("langRuBtn")

    if (enBtn) enBtn.classList.toggle("active", safeLang === "en")
    if (ruBtn) ruBtn.classList.toggle("active", safeLang === "ru")

    window.mtosLang = safeLang

    const systemEventsTitle = document.getElementById("systemEventsTitle")
const systemDecisionTitle = document.getElementById("systemDecisionTitle")
const weatherTitle = document.getElementById("weatherTitle")
const collectiveSectionTitle = document.getElementById("collectiveSectionTitle")
const attractorSectionTitle = document.getElementById("attractorSectionTitle")
const historyEfficiencySectionTitle = document.getElementById("historyEfficiencySectionTitle")
const seriesSectionTitle = document.getElementById("seriesSectionTitle")
const toolsSectionTitle = document.getElementById("toolsSectionTitle")

    if (systemEventsTitle) systemEventsTitle.innerText = t("systemEventsTitle")
    if (systemDecisionTitle) systemDecisionTitle.innerText = t("systemDecisionTitle")
    if (collectiveSectionTitle) collectiveSectionTitle.innerText = t("collectiveSectionTitle")
    if (attractorSectionTitle) attractorSectionTitle.innerText = t("attractorSectionTitle")
if (historyEfficiencySectionTitle) historyEfficiencySectionTitle.innerText = t("historyEfficiencySectionTitle")
if (seriesSectionTitle) seriesSectionTitle.innerText = t("seriesSectionTitle")
if (toolsSectionTitle) toolsSectionTitle.innerText = t("toolsSectionTitle")

    if (weatherTitle) {
        weatherTitle.innerText = safeLang === "ru"
            ? "МЕТАБОЛИЧЕСКАЯ ПОГОДА"
            : "METABOLIC WEATHER"
    }

    if (typeof window.applyStaticTranslations === "function") {
        window.applyStaticTranslations()
    }
}

if (typeof window.applyStaticTranslations === "function") {
    window.applyStaticTranslations()
}

window.setMTOSLang = function(lang){
    const safeLang = lang === "ru" ? "ru" : "en"
    saveMTOSLang(safeLang)
    applyMTOSLang(safeLang)

    if (window._rerenderMTOS) {
        window._rerenderMTOS()
    } else if (window._weather) {
        renderAll(
            window._weather,
            window._weatherToday,
            window._pressure,
            window._userKin,
            window._todayKin,
            window._date?.year,
            window._date?.month,
            window._date?.day
        )
    }
}

function loadMTOSViewMode(){
    try{
        const raw = localStorage.getItem(MTOS_VIEW_MODE_KEY)
        return raw === "full" ? "full" : "lite"
    }catch(e){
        return "lite"
    }
}

function saveMTOSViewMode(mode){
    try{
        localStorage.setItem(MTOS_VIEW_MODE_KEY, mode === "full" ? "full" : "lite")
    }catch(e){}
}

function applyMTOSViewMode(mode){
    const safeMode = mode === "full" ? "full" : "lite"
    const isLite = safeMode === "lite"

    document.querySelectorAll(".research-block").forEach(el => {
        el.classList.toggle("mtos-hidden", isLite)
    })

    const liteBtn = document.getElementById("viewLiteBtn")
    const fullBtn = document.getElementById("viewFullBtn")

    if (liteBtn) liteBtn.classList.toggle("active", safeMode === "lite")
    if (fullBtn) fullBtn.classList.toggle("active", safeMode === "full")

    window.mtosViewMode = safeMode
}

window.setMTOSViewMode = function(mode){
    const safeMode = mode === "full" ? "full" : "lite"
    saveMTOSViewMode(safeMode)
    applyMTOSViewMode(safeMode)
}

function toPython(obj) {
    return JSON.stringify(obj)
        .replace(/true/g, "True")
        .replace(/false/g, "False")
        .replace(/null/g, "None")
}

let pyodide = null
let historyStack = []
let fieldState = null
let fieldMode = null
let users = []
let selectedAgent = null
let selectedKin = null
let selectionMemory = new Array(260).fill(0)

function clamp01(x){
    return Math.max(0, Math.min(1, Number(x)))
}

// ===============================
// INIT
// ===============================
export async function initMTOS() {

    pyodide = await loadPyodide()
    await pyodide.loadPackage("numpy")

    const code = await fetch("./MTOS_Engine.py").then(r => r.text())
    pyodide.runPython(code)

    applyMTOSLang(loadMTOSLang())
    setStatusText("ready")

    window.mtosViewMode = loadMTOSViewMode()
    applyMTOSViewMode(window.mtosViewMode)
    window.exportLog = exportLog
    window.fieldMode = "hybrid"
    window.fieldViewMode = "grid"
    window._logListener = (entry) => {

        const el = document.getElementById("logStream")
        if (!el) return

        const row = document.createElement("div")

        row.textContent =
            new Date(entry.t).toLocaleTimeString() +
            " | " +
            entry.type +
            " | " +
            JSON.stringify(entry)

        el.prepend(row)

        // ограничение UI
        if (el.children.length > 200) {
            el.removeChild(el.lastChild)
        }
    }
    window.removeUser = removeUser
    window.removeConnection = removeConnection
    window.removeConnectionHard = removeConnectionHard
    window.addConnection = addConnection
    window.attractorMode = "map"
    window.networkMode = "interaction"

    window.toggleEditMode = () => {
        window.networkMode = window.networkMode === "edit" ? "interaction" : "edit"

        const btn = document.getElementById("editBtn")
        if (btn) {
            btn.innerText = window.networkMode === "edit" ? t("editOn") : t("editOff")
        }

        console.log("Mode:", window.networkMode)
    }

    window.replayPlay = replayPlay
    window.replayPause = replayPause
    window.replayStep = replayStep
    window.replaySeek = replaySeek
    window.networkMode = "interaction"
    setTimeout(() => setNetworkMode("interaction"), 0)

    initReplay()

    window.addEventListener("mtos:state-updated", () => {
    })
}

function applyTodayContactsToAttractorField(field, users){
    if (!Array.isArray(field) || !users || !window.isTodayContact) {
        return field
    }

    const boosted = [...field]

    for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < users.length; j++) {
            if (i === j) continue

            const u1 = users[i]
            const u2 = users[j]

            if (!u1 || !u2 || !window.isTodayContact(u1.name, u2.name)) continue

            const kinA = Number(u1.kin)
            const kinB = Number(u2.kin)

            if (Number.isFinite(kinA) && kinA >= 1 && kinA <= 260) {
                boosted[kinA - 1] = Math.min(1, Number(boosted[kinA - 1] ?? 0.5) + 0.12)
            }

            if (Number.isFinite(kinB) && kinB >= 1 && kinB <= 260) {
                boosted[kinB - 1] = Math.min(1, Number(boosted[kinB - 1] ?? 0.5) + 0.12)
            }
        }
    }

    return boosted
}

function classifyRelation(score){
    if (score >= 0.6) return "ultra"
    if (score >= 0.15) return "support"
    if (score <= -0.15) return "conflict"
    return "neutral"
}

window.classifyRelation = classifyRelation

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

        const a = String(item?.a || "")
        const b = String(item?.b || "")

        if (Array.isArray(users) && users.some(u => u?.name === a) && users.some(u => u?.name === b)) {
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

// ===============================
// USER MEMORY
// ===============================
function loadUsers() {
    try {
        const saved = localStorage.getItem("mtos_user_list")
        if (!saved) return []

        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : []
    } catch (e) {
        return []
    }
}

function saveUsers(list) {
    localStorage.setItem("mtos_user_list", JSON.stringify(list))
}

function addUser(list, name) {

    // страховка
    if (!Array.isArray(list)) {
        list = []
    }

    if (name && !list.includes(name)) {
        list.push(name)
    }

    return list
}

function removeUser(name) {

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    })

    // 1. удаляем из списка имён
    let list = loadUsers()
    list = list.filter(u => u !== name)
    saveUsers(list)

    // 2. чистим память связей
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const newMemory = {}

    Object.keys(memory).forEach(key => {
        const [a, b] = key.split("->")
        if (a !== name && b !== name) {
            newMemory[key] = memory[key]
        }
    })

    localStorage.setItem("collective_relations_memory", JSON.stringify(newMemory))

    // 3. чистим жёсткие блокировки
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
    const newLocked = {}

    Object.keys(locked).forEach(key => {
        const [a, b] = key.split("->")
        if (a !== name && b !== name) {
            newLocked[key] = locked[key]
        }
    })

    localStorage.setItem("mtos_locked_relations", JSON.stringify(newLocked))
    window._lockedCache = newLocked

    // 4. перезапуск
    runMTOS()
}

function removeConnectionHard(a, b) {

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    })

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")

    delete memory[a + "->" + b]
    delete memory[b + "->" + a]

    memory[a + "->" + b] = 0
    memory[b + "->" + a] = 0

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory))

    // 🔴 КЛЮЧ: ЖЁСТКАЯ БЛОКИРОВКА
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    locked[a + "->" + b] = true
    locked[b + "->" + a] = true

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked))

    window._lockedCache = locked

    runMTOS()
}

function removeConnection(a, b) {

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    })

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")

    delete memory[a + "->" + b]
    delete memory[b + "->" + a]

    memory[a + "->" + b] = 0
    memory[b + "->" + a] = 0

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory))

    // мягкое удаление — НЕ блокируем
    window._lockedCache = null

    runMTOS()
}

function addConnection(a, b, value = 1) {

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    // 🔴 КЛЮЧЕВОЙ ФИЛЬТР
    if (locked[a + "->" + b] || locked[b + "->" + a]) {
        console.log("BLOCKED:", a, b)
        return
    }

    memory[a + "->" + b] = value
    memory[b + "->" + a] = value

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory))

    delete locked[a + "->" + b]
    delete locked[b + "->" + a]

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked))

    window._lockedCache = null

    runMTOS()
}

window.addConnection = addConnection

function lockConnection(a, b) {

    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    locked[a + "->" + b] = true
    locked[b + "->" + a] = true

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked))
}

function undo() {

    const last = historyStack.pop()
    if (!last) return

    localStorage.setItem("mtos_user_list", JSON.stringify(last.users))
    localStorage.setItem("collective_relations_memory", JSON.stringify(last.memory))

    runMTOS()
}

window.undoMTOS = undo

// ===============================
// RUN
// ===============================

function shiftWeatherArray(weather, offsetDays = 0) {
    const src = Array.isArray(weather) ? weather : []
    if (!src.length) return []

    const n = src.length
    const shift = ((offsetDays % n) + n) % n

    return src.map((_, i) => {
        const from = (i + shift) % n
        const w = src[from] || {}
        return {
            attention: Number(w.attention ?? 0.5),
            activity: Number(w.activity ?? 0.5),
            pressure: Number(w.pressure ?? 0),
            conflict: Number(w.conflict ?? 0)
        }
    })
}

const MTOS_MEMORY_KEY = "mtos_memory_layers_v1"
const MTOS_AUTO_FEEDBACK_KEY = "mtos_auto_feedback_v1"

const MTOS_TODAY_CONTACTS_KEY = "mtos_today_contacts_v2"
const MTOS_RELATION_FEEDBACK_KEY = "mtos_relation_feedback_v1"
const MTOS_FEEDBACK_ACK_KEY = "mtos_feedback_ack_v1"

const MTOS_CONTACT_TTL_MS = 24 * 60 * 60 * 1000

function getDayKeyFromParts(year, month, day){
    const y = Number(year || 0)
    const m = String(Number(month || 0)).padStart(2, "0")
    const d = String(Number(day || 0)).padStart(2, "0")

    if (!y || m === "00" || d === "00") {
        return new Date().toISOString().slice(0, 10)
    }

    return `${y}-${m}-${d}`
}

function loadTodayContactsDB(){
    try{
        const raw = localStorage.getItem(MTOS_TODAY_CONTACTS_KEY)
        const parsed = raw ? JSON.parse(raw) : {}
        return parsed && typeof parsed === "object" ? parsed : {}
    }catch(e){
        return {}
    }
}

function saveTodayContactsDB(db){
    localStorage.setItem(MTOS_TODAY_CONTACTS_KEY, JSON.stringify(db))
}

function makePairKey(a, b){
    return [String(a || "").trim(), String(b || "").trim()].sort().join("::")
}

function cleanupExpiredTodayContacts(db = null){
    const source = db && typeof db === "object" ? db : loadTodayContactsDB()
    const now = Date.now()
    const next = {}
    let changed = false

    Object.keys(source).forEach(dayKey => {
        const row = source[dayKey]
        if (!row || typeof row !== "object") {
            changed = true
            return
        }

        const cleanedRow = {}

        Object.entries(row).forEach(([pairKey, item]) => {
            const t = Number(item?.t ?? 0)

            if (!t || (now - t) > MTOS_CONTACT_TTL_MS) {
                changed = true
                return
            }

            cleanedRow[pairKey] = item
        })

        if (Object.keys(cleanedRow).length > 0) {
            next[dayKey] = cleanedRow
        } else if (Object.keys(row).length > 0) {
            changed = true
        }
    })

    if (changed) {
        saveTodayContactsDB(next)
    }

    return next
}

function findActiveTodayContactRecord(a, b){
    const db = cleanupExpiredTodayContacts()
    const pairKey = makePairKey(a, b)

    for (const dayKey of Object.keys(db)) {
        const row = db[dayKey]
        if (row && row[pairKey]) {
            return {
                dayKey,
                item: row[pairKey]
            }
        }
    }

    return null
}

function loadTodayContacts(dayKey = null){
    const db = cleanupExpiredTodayContacts()

    if (dayKey) {
        const row = db[dayKey]
        return row && typeof row === "object" ? row : {}
    }

    const merged = {}

    Object.values(db).forEach(row => {
        if (!row || typeof row !== "object") return

        Object.entries(row).forEach(([pairKey, item]) => {
            if (!merged[pairKey] || Number(item?.t ?? 0) > Number(merged[pairKey]?.t ?? 0)) {
                merged[pairKey] = item
            }
        })
    })

    return merged
}

function isTodayContact(a, b){
    return !!findActiveTodayContactRecord(a, b)
}

function markTodayContact(a, b, dayKey = getCurrentRunDay()){
    if (!a || !b || a === b) return

    const db = cleanupExpiredTodayContacts()

    const existing = findActiveTodayContactRecord(a, b)
    if (existing?.dayKey && db[existing.dayKey]) {
        delete db[existing.dayKey][makePairKey(a, b)]
        if (!Object.keys(db[existing.dayKey]).length) {
            delete db[existing.dayKey]
        }
    }

    if (!db[dayKey] || typeof db[dayKey] !== "object") {
        db[dayKey] = {}
    }

    const key = makePairKey(a, b)

    db[dayKey][key] = {
        a,
        b,
        t: Date.now(),
        expiresAt: Date.now() + MTOS_CONTACT_TTL_MS,
        weight: 1
    }

    saveTodayContactsDB(db)

    if (typeof window.registerMTOSOutcome === "function") {
        window.registerMTOSOutcome({
            relationId: `${a}->${b}`,
            outcome: "good",
            value: 0.15
        })
    }

    runMTOS()
}

function unmarkTodayContact(a, b){
    const db = cleanupExpiredTodayContacts()
    const pairKey = makePairKey(a, b)
    let changed = false

    Object.keys(db).forEach(dayKey => {
        if (db[dayKey] && db[dayKey][pairKey]) {
            delete db[dayKey][pairKey]
            changed = true

            if (!Object.keys(db[dayKey]).length) {
                delete db[dayKey]
            }
        }
    })

    if (changed) {
        saveTodayContactsDB(db)
        runMTOS()
    }
}

function buildEffectiveRelationMemory(baseMemory, dayKey = getCurrentRunDay()){
    const memory = { ...(baseMemory || {}) }
    const contacts = loadTodayContacts(dayKey)

    Object.values(contacts).forEach(item => {
        if (!item?.a || !item?.b) return

        const a = item.a
        const b = item.b
        const boost = 1.75

        const k1 = `${a}->${b}`
        const k2 = `${b}->${a}`

        memory[k1] = Math.max(Number(memory[k1] ?? 0), boost)
        memory[k2] = Math.max(Number(memory[k2] ?? 0), boost)
    })

    return memory
}

window.markTodayContact = markTodayContact
window.unmarkTodayContact = unmarkTodayContact
window.isTodayContact = isTodayContact
window.loadTodayContacts = loadTodayContacts

function resolveSharedRelationScore(baseScore, attractorState = null, timePressureState = null){
    let score = Number(baseScore ?? 0)

    const tp = timePressureState || window.mtosTimePressureSummary || window.mtosTimePressure || {
        pressure: 0,
        urgency: 0,
        label: "low",
        temporalMode: "EXPLORE"
    }

    const pressure = Number(tp.pressure ?? tp.value ?? 0)
    const attractor = attractorState || window.mtosAttractorState || {
        type: "unknown",
        intensity: 0
    }

    if (pressure >= 0.82) {
        if (score > 0) {
            score *= (1 - 0.22 * pressure)
        } else if (score < 0) {
            score *= (1 + 0.26 * pressure)
        }

        if (Math.abs(score) < 0.2) {
            score *= (1 - 0.14 * pressure)
        }
    }
    else if (pressure >= 0.62) {
        if (score > 0) {
            score *= (1 - 0.12 * pressure)
        } else if (score < 0) {
            score *= (1 + 0.16 * pressure)
        }
    }
    else if (pressure < 0.34) {
        if (score > 0) {
            score *= (1 + 0.05 * (1 - pressure))
        }
    }

    const type = String(attractor?.type || "unknown")
    const intensity = Number(attractor?.intensity ?? 0)

    if (type === "chaos") {
        if (score > 0) {
            score *= (1 - 0.15 * intensity)
        } else if (score < 0) {
            score *= (1 + 0.18 * intensity)
        }
    } else if (type === "cycle") {
        score *= (1 + 0.08 * intensity)
    } else if (type === "trend") {
        if (Math.abs(score) > 0.3) {
            score *= (1 + 0.12 * intensity)
        }
    } else if (type === "stable") {
        score *= (1 - 0.05 * intensity)
    }

    return Math.max(-1, Math.min(1, Number(score.toFixed(4))))
}

window.resolveSharedRelationScore = resolveSharedRelationScore

window.cleanupExpiredTodayContacts = cleanupExpiredTodayContacts

function clampHuman01(v){
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function getCurrentUserName(){
    return document.getElementById("name")?.value?.trim() || ""
}

window.getCurrentUserName = getCurrentUserName

function getCurrentRunDay(){
    const y = Number(window._date?.year || 0)
    const m = Number(window._date?.month || 0)
    const d = Number(window._date?.day || 0)

    if (!y || !m || !d) {
        return new Date().toISOString().slice(0, 10)
    }

    const dt = new Date(Date.UTC(y, m - 1, d))
    return dt.toISOString().slice(0, 10)
}

window.getCurrentRunDay = getCurrentRunDay

function loadHumanFeedback(){
    try{
        const raw = localStorage.getItem(MTOS_AUTO_FEEDBACK_KEY)
        const parsed = raw ? JSON.parse(raw) : {}
        return parsed && typeof parsed === "object" ? parsed : {}
    }catch(e){
        return {}
    }
}

function saveHumanFeedback(state){
    localStorage.setItem(MTOS_AUTO_FEEDBACK_KEY, JSON.stringify(state))
}

function getHumanFeedbackFor(day, name){
    const db = loadHumanFeedback()
    return db[`${day}__${name}`] || null
}

function setHumanFeedbackFor(day, name, value){
    if (!day || !name) return null

    const allowed = ["good", "neutral", "bad"]
    const safeValue = allowed.includes(String(value).toLowerCase())
        ? String(value).toLowerCase()
        : "neutral"

    const db = loadHumanFeedback()
    const key = `${day}__${name}`

    db[key] = {
        ...(db[key] || {}),
        day,
        name,
        value: safeValue,
        t: Date.now(),

        userKin: Number(window._userKin || 0),
        todayKin: Number(window._todayKin || 0),

        label: String(window.mtosDayState?.dayLabel || "UNKNOWN"),
        mode: String(window.mtosDecision?.mode || "UNKNOWN"),

        attention: Number(window.mtosDayState?.attention ?? 0.5),
        activity: Number(window.mtosDayState?.activity ?? 0.5),
        pressure: Number(window.mtosDayState?.pressure ?? 0),
        conflict: Number(window.mtosDayState?.conflict ?? 0),
        stability: Number(window.mtosDayState?.stability ?? 0.5),
        field: Number(window.mtosDayState?.field ?? 0.5),

        attractorType: String(window.mtosAttractorState?.type || "unknown"),
        attractorIntensity: Number(window.mtosAttractorState?.intensity ?? 0),

        temporalMode: String(window.mtosTimePressureSummary?.temporalMode || "EXPLORE"),
        timePressure: Number(window.mtosTimePressureSummary?.value ?? 0),

        auto: false,

        ...computeFeedbackStateSignature(window.mtosDayState || {})
    }

    saveHumanFeedback(db)
    enrichSnapshotsWithFeedbackContext()

    return db[key]
}

window.setHumanFeedbackFor = setHumanFeedbackFor
window.enrichSnapshotsWithFeedbackContext = enrichSnapshotsWithFeedbackContext

function loadRelationFeedback(){
    try{
        const raw = localStorage.getItem(MTOS_RELATION_FEEDBACK_KEY)
        const parsed = raw ? JSON.parse(raw) : {}
        return parsed && typeof parsed === "object" ? parsed : {}
    }catch(e){
        return {}
    }
}

function saveRelationFeedback(state){
    localStorage.setItem(MTOS_RELATION_FEEDBACK_KEY, JSON.stringify(state))
}

function getRelationFeedbackKey(day, a, b){
    const left = String(a || "").trim()
    const right = String(b || "").trim()
    if (!day || !left || !right) return ""
    return `${day}__${[left, right].sort().join("::")}`
}

function setRelationFeedbackFor(day, a, b, value){
    const safeValue = ["good", "neutral", "bad"].includes(String(value).toLowerCase())
        ? String(value).toLowerCase()
        : "neutral"

    const key = getRelationFeedbackKey(day, a, b)
    if (!key) return null

    const db = loadRelationFeedback()

    db[key] = {
        day,
        a: String(a || "").trim(),
        b: String(b || "").trim(),
        value: safeValue,
        t: Date.now()
    }

    saveRelationFeedback(db)

    try{
        localStorage.setItem(MTOS_FEEDBACK_ACK_KEY, JSON.stringify({
            t: Date.now(),
            value: safeValue,
            a: String(a || "").trim(),
            b: String(b || "").trim()
        }))
    }catch(e){}

    return db[key]
}

function getRelationFeedbackFor(day, a, b){
    const key = getRelationFeedbackKey(day, a, b)
    if (!key) return null
    const db = loadRelationFeedback()
    return db[key] || null
}

function getRelationFeedbackScalar(day, a, b){
    const row = getRelationFeedbackFor(day, a, b)
    if (!row) return 0

    if (row.value === "good") return 0.22
    if (row.value === "bad") return -0.22
    return 0
}

function getFeedbackAck(){
    try{
        const raw = localStorage.getItem(MTOS_FEEDBACK_ACK_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        return parsed && typeof parsed === "object" ? parsed : null
    }catch(e){
        return null
    }
}

window.setRelationFeedbackFor = setRelationFeedbackFor
window.getRelationFeedbackFor = getRelationFeedbackFor
window.getRelationFeedbackScalar = getRelationFeedbackScalar
window.getFeedbackAck = getFeedbackAck

window.registerMTOSOutcome = function(payload = {}){
    const day = getCurrentRunDay()
    const name = getCurrentUserName()

    if (!day || !name) return

    const outcome = String(payload.outcome || "neutral").toLowerCase()
    setHumanFeedbackFor(day, name, outcome)

    logEvent("mtos_outcome_feedback", {
        day,
        name,
        outcome,
        relationId: String(payload.relationId || ""),
        value: Number(payload.value ?? 0)
    })

    if (window._rerenderMTOS) {
        window._rerenderMTOS()
    } else {
        renderDecisionSummaryPanel("humanLayer")
    }
}

function evaluateGoalAutoFeedback(user, ds, decision){
    const goal = String(user?.goal || "stability").toLowerCase()
    const goalWeight = Math.max(0, Math.min(1, Number(user?.goalWeight ?? 0.65)))

    const attention = clampHuman01(Number(ds?.attention ?? 0.5))
    const pressure = clampHuman01(Number(ds?.pressure ?? 0))
    const conflict = clampHuman01(Number(ds?.conflict ?? 0))
    const stability = clampHuman01(Number(ds?.stability ?? 0.5))
    const field = clampHuman01(Number(ds?.field ?? 0.5))
    const support = clampHuman01(Number(window.mtosNetworkFeedback?.supportRatio ?? 0))
    const conflictRatio = clampHuman01(Number(window.mtosNetworkFeedback?.conflictRatio ?? 0))

    let score = 0.5

    if (goal === "stability") {
        score =
            stability * 0.42 +
            (1 - pressure) * 0.24 +
            (1 - conflict) * 0.18 +
            field * 0.16
    } else if (goal === "growth") {
        score =
            attention * 0.34 +
            field * 0.26 +
            Math.min(pressure, 0.62) * 0.14 +
            stability * 0.14 +
            (1 - conflict) * 0.12
    } else if (goal === "social") {
        score =
            support * 0.34 +
            (1 - conflictRatio) * 0.24 +
            attention * 0.18 +
            field * 0.12 +
            (1 - conflict) * 0.12
    } else if (goal === "explore") {
        score =
            field * 0.28 +
            attention * 0.22 +
            (1 - conflict) * 0.14 +
            Math.min(pressure, 0.68) * 0.16 +
            stability * 0.20
    }

    const mode = String(decision?.mode || "").toUpperCase()

    if (goal === "stability" && mode === "REST") score += 0.08 * goalWeight
    if (goal === "growth" && mode === "FOCUS") score += 0.08 * goalWeight
    if (goal === "social" && mode === "INTERACT") score += 0.08 * goalWeight
    if (goal === "explore" && mode === "EXPLORE") score += 0.08 * goalWeight

    score = Math.max(0, Math.min(1, score))

    let value = "neutral"
    if (score >= 0.68) value = "good"
    else if (score <= 0.42) value = "bad"

    return {
        value,
        score: Number(score.toFixed(3)),
        goal,
        goalWeight: Number(goalWeight.toFixed(3))
    }
}

function storeAutoFeedbackForCurrentRun(name, user, ds, decision){
    const day = getCurrentRunDay()
    if (!name || !day || !user || !ds) return null

    const db = loadHumanFeedback()
    const key = `${day}__${name}`

    const auto = evaluateGoalAutoFeedback(user, ds, decision)

    db[key] = {
        day,
        name,
        value: auto.value,
        t: Date.now(),

        userKin: Number(window._userKin || 0),
        todayKin: Number(window._todayKin || 0),

        label: String(window.mtosDayState?.dayLabel || "UNKNOWN"),
        mode: String(decision?.mode || "UNKNOWN"),

        attention: Number(ds.attention ?? 0.5),
        activity: Number(ds.activity ?? 0.5),
        pressure: Number(ds.pressure ?? 0),
        conflict: Number(ds.conflict ?? 0),
        stability: Number(ds.stability ?? 0.5),
        field: Number(ds.field ?? 0.5),

        attractorType: String(window.mtosAttractorState?.type || "unknown"),
        attractorIntensity: Number(window.mtosAttractorState?.intensity ?? 0),

        temporalMode: String(window.mtosTimePressureSummary?.temporalMode || "EXPLORE"),
        timePressure: Number(window.mtosTimePressureSummary?.value ?? 0),

        goal: auto.goal,
        goalWeight: auto.goalWeight,
        autoScore: auto.score,
        auto: true,

        ...computeFeedbackStateSignature(ds)
    }

    saveHumanFeedback(db)
    enrichSnapshotsWithFeedbackContext()

    return db[key]
}

function getSimpleHumanState(ds){
    const label = String(ds?.dayLabel || "EXPLORE").toUpperCase()
    const pressure = Number(ds?.pressure ?? 0)
    const conflict = Number(ds?.conflict ?? 0)
    const stability = Number(ds?.stability ?? 0.5)
    const attention = Number(ds?.attention ?? 0.5)
    const attractorType = String(window.mtosAttractorState?.type || "unknown")

    if (label === "REST") return "RECOVERY"
    if (attractorType === "chaos" || conflict >= 0.52 || pressure >= 0.70) return "CHAOTIC"
    if (label === "FOCUS" || (attention >= 0.70 && stability >= 0.60)) return "FOCUSED"
    if (label === "INTERACT") return "LIGHT"
    if (label === "ADJUST") return "BALANCED"
    return "BALANCED"
}

function getSimpleHumanColor(state){
    if (state === "FOCUSED") return "#00ff88"
    if (state === "LIGHT") return "#66ccff"
    if (state === "HEAVY") return "#ffb347"
    if (state === "CHAOTIC") return "#ff6666"
    if (state === "RECOVERY") return "#c084fc"
    return "#d1d5db"
}

function getSimpleWhy(ds){
    const parts = []

    const pressure = Number(ds?.pressure ?? 0)
    const conflict = Number(ds?.conflict ?? 0)
    const stability = Number(ds?.stability ?? 0.5)
    const attention = Number(ds?.attention ?? 0.5)
    const attractorType = String(window.mtosAttractorState?.type || "unknown")
    const timePressure = Number(window.mtosTimePressureSummary?.value ?? 0)

    if (attention >= 0.68) parts.push("attention is strong")
    else if (attention <= 0.40) parts.push("attention is scattered")

    if (pressure >= 0.62) parts.push("pressure is elevated")
    if (conflict >= 0.42) parts.push("internal conflict is visible")
    if (stability >= 0.62) parts.push("stability is good")
    else if (stability <= 0.42) parts.push("stability is weak")

    if (attractorType && attractorType !== "unknown") {
        parts.push(`attractor is ${attractorType}`)
    }

    if (timePressure >= 0.62) {
        parts.push("time pressure is high")
    }

    if (!parts.length) {
        parts.push("system is in a moderate balanced state")
    }

    return parts.join(" · ")
}

function loadDailySnapshotsForUser(name){
    try{
        const rows = JSON.parse(localStorage.getItem("mtos_daily_snapshots") || "[]")
        if (!Array.isArray(rows)) return []

        return rows
            .filter(row => row && row.name === name)
            .slice()
            .sort((a, b) => String(b.day || "").localeCompare(String(a.day || "")))
    }catch(e){
        return []
    }
}

function renderHumanHistory(name){
    const rows = loadDailySnapshotsForUser(name).slice(0, 7)

    if (!rows.length) {
        return `
            <div class="human-history-row">
                <div class="human-history-date">—</div>
                <div class="human-history-state">${t("noSnapshotsYet")}</div>
                <div class="human-history-mode">${t("runDifferentDays")}</div>
            </div>
        `
    }

    return rows.map(row => {
        const fb = getHumanFeedbackFor(row.day, name)
        const fbText = fb ? ` · feedback: ${fb.value}` : ""

        return `
            <div class="human-history-row">
                <div class="human-history-date">${row.day || "?"}</div>
                <div class="human-history-state">${row.dayLabel || "UNKNOWN"}${fbText}</div>
                <div class="human-history-mode">${row.recommendedMode || "UNKNOWN"} · ${t("predictabilityWord")} ${Number(row.predictability ?? 0).toFixed(0)} • ${t("pressure")} ${Number(row.timePressure ?? 0).toFixed(2)}</div>
            </div>
        `
    }).join("")
}

function renderHumanLayer(data){

    const el = document.getElementById("humanLayer")
    if(!el) return

    const mode = data.recommendedMode || "UNKNOWN"
    const confidence = (data.trust || 0.5)

    let action = ""
    let avoid = ""

    if(mode === "FOCUS"){
    action = t("deepWork")
    avoid = t("distractions")
}
else if(mode === "SOCIAL"){
    action = t("communicate")
    avoid = t("isolation")
}
else if(mode === "EXPLORE"){
    action = t("tryNewThings")
    avoid = t("routineLoops")
}
else if(mode === "REST"){
    action = t("recoverSlowDown")
    avoid = t("overload")
}

    el.innerHTML = `
        <div class="mobile-card">

            <div class="mobile-title">${mode}</div>
            <div class="mobile-sub">${t("confidence")}: ${confidence.toFixed(2)}</div>

            <div class="mobile-section">
                <div class="mobile-label">${t("do")}</div>
                <div class="mobile-text">${action}</div>
            </div>

            <div class="mobile-section">
                <div class="mobile-label">${t("avoid")}</div>
                <div class="mobile-text">${avoid}</div>
            </div>

        </div>
    `
}

function feedbackValueToScore(value){
    if (value === "good") return 1
    if (value === "bad") return -1
    return 0
}

function calcModeStats(rows){
    const map = {}

    ;(Array.isArray(rows) ? rows : []).forEach(row => {
        const mode = String(row?.decisionMode || row?.recommendedMode || "UNKNOWN").toUpperCase()

        if (!map[mode]) {
            map[mode] = {
                mode,
                total: 0,
                good: 0,
                neutral: 0,
                bad: 0,
                score: 0
            }
        }

        map[mode].total += 1

        const fb = String(row?.feedbackValue || "").toLowerCase()

        if (fb === "good") map[mode].good += 1
        else if (fb === "bad") map[mode].bad += 1
        else map[mode].neutral += 1
    })

    const list = Object.values(map)

    list.forEach(item => {
        item.score = item.total
            ? Number((
                (item.good * 1.0 + item.neutral * 0.15 - item.bad * 1.2) / item.total
            ).toFixed(3))
            : 0
    })

    return list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.total - a.total
    })
}

function normalizeModeName(mode){
    const m = String(mode || "").trim().toUpperCase()

    if (m === "FOCUS") return "FOCUS"
    if (m === "REST") return "REST"
    if (m === "ADJUST") return "ADJUST"
    if (m === "EXPLORE") return "EXPLORE"
    if (m === "INTERACT") return "INTERACT"
    if (m === "FLOW") return "EXPLORE"
    if (m === "RECOVERY") return "REST"
    if (m === "FATIGUE") return "REST"
    if (m === "NEUTRAL") return "EXPLORE"

    return m || "EXPLORE"
}

function loadAllHumanFeedbackRows(){
    const db = loadHumanFeedback()
    return Object.values(db || {}).filter(Boolean)
}

function computeFeedbackStateSignature(ds){
    const attention = clampHuman01(Number(ds?.attention ?? 0.5))
    const pressure = clampHuman01(Number(ds?.pressure ?? 0))
    const conflict = clampHuman01(Number(ds?.conflict ?? 0))
    const stability = clampHuman01(Number(ds?.stability ?? 0.5))
    const attractorType = String(window.mtosAttractorState?.type || "unknown")
    const temporalMode = String(window.mtosTimePressureSummary?.temporalMode || "EXPLORE").toUpperCase()

    return {
        attentionBand: Math.round(attention * 4),
        pressureBand: Math.round(pressure * 4),
        conflictBand: Math.round(conflict * 4),
        stabilityBand: Math.round(stability * 4),
        attractorType,
        temporalMode
    }
}

function isSimilarFeedbackState(a, b){
    if (!a || !b) return false

    const close =
        Math.abs(Number(a.attentionBand ?? 0) - Number(b.attentionBand ?? 0)) <= 1 &&
        Math.abs(Number(a.pressureBand ?? 0) - Number(b.pressureBand ?? 0)) <= 1 &&
        Math.abs(Number(a.conflictBand ?? 0) - Number(b.conflictBand ?? 0)) <= 1 &&
        Math.abs(Number(a.stabilityBand ?? 0) - Number(b.stabilityBand ?? 0)) <= 1

    const sameAttractor =
        String(a.attractorType || "unknown") === String(b.attractorType || "unknown")

    const sameTemporal =
        String(a.temporalMode || "EXPLORE") === String(b.temporalMode || "EXPLORE")

    return close && sameAttractor && sameTemporal
}

function getFeedbackLearningSummary(name, ds){
    const rows = loadAllHumanFeedbackRows()
    const signature = computeFeedbackStateSignature(ds)

    const summary = {
        FOCUS: { good: 0, bad: 0, neutral: 0, total: 0, score: 0 },
    ADJUST: { good: 0, bad: 0, neutral: 0, total: 0, score: 0 },
    REST: { good: 0, bad: 0, neutral: 0, total: 0, score: 0 },
    EXPLORE: { good: 0, bad: 0, neutral: 0, total: 0, score: 0 },
    INTERACT: { good: 0, bad: 0, neutral: 0, total: 0, score: 0 }
    }

    rows.forEach(row => {
        if (!row || row.name !== name) return

        const rowMode = normalizeModeName(row.mode)
        if (!summary[rowMode]) return

        const rowSignature = {
            attentionBand: Math.round(clampHuman01(Number(row.attention ?? 0.5)) * 4),
            pressureBand: Math.round(clampHuman01(Number(row.pressure ?? 0)) * 4),
            conflictBand: Math.round(clampHuman01(Number(row.conflict ?? 0)) * 4),
            stabilityBand: Math.round(clampHuman01(Number(row.stability ?? 0.5)) * 4),
            attractorType: String(row.attractorType || "unknown"),
            temporalMode: String(row.temporalMode || "EXPLORE").toUpperCase()
        }

        if (!isSimilarFeedbackState(signature, rowSignature)) return

        const value = String(row.value || "neutral")
        summary[rowMode].total += 1

        if (value === "good") summary[rowMode].good += 1
        else if (value === "bad") summary[rowMode].bad += 1
        else summary[rowMode].neutral += 1
    })

    Object.keys(summary).forEach(mode => {
        const item = summary[mode]
        if (!item.total) {
            item.score = 0
            return
        }

        item.score =
            (
                item.good * 1.0 +
                item.neutral * 0.15 -
                item.bad * 1.2
            ) / item.total
    })

    return summary
}

function enrichSnapshotsWithFeedbackContext(){
    try{
        const rows = JSON.parse(localStorage.getItem("mtos_daily_snapshots") || "[]")
        if (!Array.isArray(rows) || !rows.length) return

        const feedbackDb = loadHumanFeedback()
        let changed = false

        const next = rows.map(row => {
            if (!row || !row.day || !row.name) return row

            const key = `${row.day}__${row.name}`
            const fb = feedbackDb[key]
            if (!fb) return row

            if (
                row.feedbackValue === fb.value &&
                row.feedbackAt &&
                row.feedbackAt === fb.t
            ) {
                return row
            }

            changed = true

            return {
                ...row,
                feedbackValue: fb.value,
                feedbackAt: fb.t,
                feedbackMode: fb.mode,
                feedbackLabel: fb.label
            }
        })

        if (changed) {
            localStorage.setItem("mtos_daily_snapshots", JSON.stringify(next))
        }
    }catch(e){
        console.warn("snapshot feedback enrich failed", e)
    }
}

function applyFeedbackToDecision(baseDecision, name, ds){
    const decision = baseDecision && typeof baseDecision === "object"
        ? { ...baseDecision }
        : { mode: "EXPLORE", text: "No decision", confidence: 0.5 }

    const currentMode = normalizeModeName(decision.mode)
    const summary = getFeedbackLearningSummary(name, ds)

    const candidates = ["FOCUS", "ADJUST", "REST", "EXPLORE", "INTERACT"].map(mode => {
        const score = Number(summary[mode]?.score ?? 0)
        return {
            mode,
            score,
            total: Number(summary[mode]?.total ?? 0),
            good: Number(summary[mode]?.good ?? 0),
            bad: Number(summary[mode]?.bad ?? 0)
        }
    })

    const currentCandidate = candidates.find(c => c.mode === currentMode) || {
        mode: currentMode,
        score: 0,
        total: 0,
        good: 0,
        bad: 0
    }

    const bestCandidate = candidates
        .slice()
        .sort((a, b) => b.score - a.score)[0]

    decision.feedbackLearning = {
        current: currentCandidate,
        best: bestCandidate,
        candidates
    }

        decision.feedbackAdjusted = false
    decision.feedbackReason = t("noStrongFeedbackPattern")

    const enoughEvidenceForCurrent = currentCandidate.total >= 2
    const strongNegativeCurrent = currentCandidate.score <= -0.35
    const strongPositiveCurrent = currentCandidate.score >= 0.35

    const alternativeBetter =
        bestCandidate &&
        bestCandidate.mode !== currentMode &&
        bestCandidate.total >= 2 &&
        bestCandidate.score >= 0.25 &&
        (bestCandidate.score - currentCandidate.score) >= 0.40

    if (enoughEvidenceForCurrent && strongNegativeCurrent && alternativeBetter) {
        decision.mode = bestCandidate.mode
        decision.feedbackAdjusted = true
        decision.feedbackReason = formatI18n(
            t("pastFeedbackBadSwitched"),
            {
                from: translateModeLabel(currentMode),
                to: translateModeLabel(bestCandidate.mode)
            }
        )
    } else if (enoughEvidenceForCurrent && strongNegativeCurrent) {
        decision.confidence = Math.max(0.18, Number(decision.confidence ?? 0.5) - 0.22)
        decision.feedbackAdjusted = true
        decision.feedbackReason = formatI18n(
            t("pastFeedbackBadReduced"),
            {
                mode: translateModeLabel(currentMode)
            }
        )
    } else if (enoughEvidenceForCurrent && strongPositiveCurrent) {
        decision.confidence = Math.min(0.98, Number(decision.confidence ?? 0.5) + 0.10)
        decision.feedbackAdjusted = true
        decision.feedbackReason = formatI18n(
            t("pastFeedbackGoodIncreased"),
            {
                mode: translateModeLabel(currentMode)
            }
        )
    }

    if (decision.feedbackAdjusted) {
        if (decision.mode === "FOCUS") {
            decision.text = t("decisionTextFocusBetter")
        } else if (decision.mode === "ADJUST") {
            decision.text = t("decisionTextAdjustBetter")
        } else if (decision.mode === "REST") {
            decision.text = t("decisionTextRestSafer")
        } else if (decision.mode === "EXPLORE") {
            decision.text = t("decisionTextExploreBetter")
        } else if (decision.mode === "INTERACT") {
            decision.text = t("decisionTextInteractBetter")
        }
    }

    return decision
}

function loadMemoryLayers() {
    try {
        const raw = localStorage.getItem(MTOS_MEMORY_KEY)
        const parsed = raw ? JSON.parse(raw) : null

        if (parsed && typeof parsed === "object") {
            return {
    sealMemory: Array.isArray(parsed.sealMemory)
        ? parsed.sealMemory.slice(0, 20).map(v => clamp01(v))
        : new Array(20).fill(0),

    kinMemory: Array.isArray(parsed.kinMemory)
        ? parsed.kinMemory.slice(0, 260).map(v => clamp01(v))
        : new Array(260).fill(0),

    userMemory: parsed.userMemory && typeof parsed.userMemory === "object"
        ? parsed.userMemory
        : {},

    pairMemory: parsed.pairMemory && typeof parsed.pairMemory === "object"
        ? parsed.pairMemory
        : {},

    dayMemory: parsed.dayMemory && typeof parsed.dayMemory === "object"
    ? parsed.dayMemory
    : {
        FOCUS: 0,
        ADJUST: 0,
        INTERACT: 0,
        EXPLORE: 0,
        REST: 0
    },

    decisionMemory: Array.isArray(parsed.decisionMemory)
        ? parsed.decisionMemory.slice(-300)
        : [],

    fieldMemory: Array.isArray(parsed.fieldMemory)
        ? parsed.fieldMemory.slice(0, 260).map(v => clamp01(v))
        : new Array(260).fill(0)
}
        }
    } catch (e) {
        console.warn("memory load failed", e)
    }

    return {
    sealMemory: new Array(20).fill(0),
    kinMemory: new Array(260).fill(0),
    userMemory: {},
    pairMemory: {},
    dayMemory: {
    FOCUS: 0,
    ADJUST: 0,
    INTERACT: 0,
    EXPLORE: 0,
    REST: 0
},
    decisionMemory: [],
    fieldMemory: new Array(260).fill(0)
}
}

function saveMemoryLayers(state) {
    try {
        localStorage.setItem(MTOS_MEMORY_KEY, JSON.stringify(state))
    } catch (e) {
        console.warn("memory save failed", e)
    }
}

function getUserMemoryEntry(userMemory, name) {
    const entry = userMemory?.[name]
    if (entry && typeof entry === "object") {
        return {
            score: clamp01(entry.score ?? 0),
            streak: Math.max(0, Number(entry.streak ?? 0)),
            lastKin: Number(entry.lastKin ?? 0),
            lastSeal: Number(entry.lastSeal ?? 0),
            updatedAt: entry.updatedAt || null
        }
    }

    return {
        score: 0,
        streak: 0,
        lastKin: 0,
        lastSeal: 0,
        updatedAt: null
    }
}

function updateMemoryLayers(name, userKin, dayState, weather, attractorField) {
    const memory = loadMemoryLayers()

    const kinIndex = Math.max(0, Math.min(259, Number(userKin) - 1))
    const sealIndex = ((Number(userKin) - 1) % 20 + 20) % 20

    const ds = dayState || {}
    const w = Array.isArray(weather) ? weather[kinIndex] || {} : {}

    const attention = Number(ds.attention ?? w.attention ?? 0.5)
    const activity = Number(ds.activity ?? w.activity ?? attention)
    const pressure = Number(ds.pressure ?? w.pressure ?? 0)
    const conflict = Number(ds.conflict ?? w.conflict ?? 0)
    const stability = Number(ds.stability ?? 0.5)
    const field = Number(ds.field ?? 0.5)
    const attractor = Array.isArray(attractorField)
        ? Number(attractorField[kinIndex] ?? 0.5)
        : 0.5

    const reinforcement =
        attention * 0.22 +
        activity * 0.18 +
        stability * 0.18 +
        field * 0.14 +
        attractor * 0.16 -
        pressure * 0.10 -
        conflict * 0.08

    const signal = clamp01(reinforcement)

    const dayLabel = String(dayState?.dayLabel || "NEUTRAL").toUpperCase()

    const SEAL_DECAY = 0.985
    const KIN_DECAY = 0.992
    const USER_DECAY = 0.990

    for (let i = 0; i < 20; i++) {
        memory.sealMemory[i] = clamp01(memory.sealMemory[i] * SEAL_DECAY)
    }

    for (let i = 0; i < 260; i++) {
        memory.kinMemory[i] = clamp01(memory.kinMemory[i] * KIN_DECAY)
    }

    const userEntry = getUserMemoryEntry(memory.userMemory, name)
    userEntry.score = clamp01(userEntry.score * USER_DECAY)

// ===============================
// TIME DECAY (если пользователь не появлялся)
// ===============================

const now = Date.now()
const lastUpdate = userEntry.updatedAt ? new Date(userEntry.updatedAt).getTime() : now

const hoursIdle = (now - lastUpdate) / (1000 * 60 * 60)

// если человек не активен — память начинает "рассыпаться"
if (hoursIdle > 12) {
    const decayFactor = Math.min(0.25, (hoursIdle - 12) / 48) // максимум -25%
    userEntry.score = clamp01(userEntry.score * (1 - decayFactor))
}

if (hoursIdle > 48) {
    userEntry.streak = 0
}

    memory.sealMemory[sealIndex] = clamp01(
        memory.sealMemory[sealIndex] + signal * 0.18
    )

    memory.kinMemory[kinIndex] = clamp01(
        memory.kinMemory[kinIndex] + signal * 0.22
    )

    userEntry.score = clamp01(userEntry.score + signal * 0.24)

// ===============================
// DAY MEMORY
// ===============================
if (!memory.dayMemory[dayLabel]) {
    memory.dayMemory[dayLabel] = 0
}
memory.dayMemory[dayLabel] += 1

// ===============================
// FIELD MEMORY
// ===============================
if (Array.isArray(attractorField) && attractorField.length === 260) {
    for (let i = 0; i < 260; i++) {
        const prev = Number(memory.fieldMemory[i] ?? 0)
        const next = Number(attractorField[i] ?? 0)
        memory.fieldMemory[i] = clamp01(prev * 0.96 + next * 0.04)
    }
}

// ===============================
// DECISION MEMORY
// ===============================
const decisionMode = window.mtosAdaptiveMode?.mode || "UNKNOWN"

memory.decisionMemory.push({
    t: Date.now(),
    user: name,
    kin: userKin,
    dayLabel,
    decisionMode,
    attention: Number(attention.toFixed(3)),
    activity: Number(activity.toFixed(3)),
    pressure: Number(pressure.toFixed(3)),
    conflict: Number(conflict.toFixed(3)),
    stability: Number(stability.toFixed(3)),
    field: Number(field.toFixed(3)),
    attractor: Number(attractor.toFixed(3))
})

if (memory.decisionMemory.length > 300) {
    memory.decisionMemory.shift()
}

    if (userEntry.lastKin === userKin) {
        userEntry.streak += 1
    } else {
        userEntry.streak = 1
    }

    userEntry.lastKin = userKin
    userEntry.lastSeal = sealIndex + 1
    userEntry.updatedAt = new Date().toISOString()

    memory.userMemory[name] = userEntry

    saveMemoryLayers(memory)
    window.mtosMemoryLayers = memory

    return memory
}

function getMemoryInfluence(name, kin) {
    const memory = window.mtosMemoryLayers || loadMemoryLayers()

    const kinIndex = Math.max(0, Math.min(259, Number(kin) - 1))
    const sealIndex = ((Number(kin) - 1) % 20 + 20) % 20

    const nameSafe = name || ""
    const userEntry = getUserMemoryEntry(memory.userMemory, nameSafe)

    const sealValue = Number(memory.sealMemory[sealIndex] ?? 0)
    const kinValue = Number(memory.kinMemory[kinIndex] ?? 0)
    const userValue = Number(userEntry.score ?? 0)

    return {
        seal: sealValue,
        kin: kinValue,
        user: userValue,
        total: clamp01(
            sealValue * 0.30 +
            kinValue * 0.35 +
            userValue * 0.35
        )
    }
}

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

    const feedback = getHumanFeedbackFor(day, name)

    if (!name || !userKin || !todayKin || !uiMetrics || !dayState) {
        return
    }

    if (alreadyLoggedDailySnapshot(day, name, userKin)) {
        return
    }

    const snapshot = {
        t: Date.now(),
        day,
        name,

        userKin,
        todayKin,

        dayLabel: dayState.dayLabel ?? "UNKNOWN",
        dayIndex: Number(dayState.dayIndex ?? 0),
        dayScore: Number(dayState.dayScore ?? 0),

        recommendedMode: window.mtosAdaptiveMode?.mode || getRecommendedMode(dayState) || "UNKNOWN",

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

export async function runMTOS() {

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

        const runtimeKey = `${name}_${year}_${month}_${day}`

window._mtosRunCache = window._mtosRunCache || {}

if (window._mtosRunCache[runtimeKey]) {
        const cached = window._mtosRunCache[runtimeKey]

        window._weather = cached.weather
        window._weatherToday = cached.weatherToday
        window._pressure = cached.pressure
        window._userKin = cached.userKin
        window._todayKin = cached.todayKin
        window._date = { year, month, day }
        window._attractorField = cached.attractorField || []
        window.mtosDayState = cached.dayState || null
        window.mtosUnifiedMetrics = cached.uiMetrics || null
        window.mtosDaySync = cached.daySync || null
        window.currentUsers = cached.users || []

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

        fieldState = cached.fieldState || null
        fieldMode = cached.fieldMode || null
        users = cached.users || []

        renderCognitiveState(
            cached.userKin,
            cached.todayKin,
            cached.uiMetrics?.attention ?? 0.5,
            cached.uiMetrics?.noise ?? 0.1,
            cached.uiMetrics?.entropy ?? 1.0,
            cached.uiMetrics?.lyapunov ?? 0.0,
            cached.uiMetrics?.prediction ?? 0.5,
            cached.uiMetrics?.predictability ?? 120,
            cached.daySync || null,
            cached.dayState || null
        )

        renderAll(
            cached.weather,
            cached.weatherToday,
            cached.pressure,
            cached.userKin,
            cached.todayKin,
            year,
            month,
            day
        )

if (window.mtosDecision) {
    window.updateMTOSBranch("decision", {
        mode: String(window.mtosDecision?.mode || "EXPLORE"),
        action: String(
            window.mtosDecision?.text ||
            window.mtosDecision?.action ||
            "Observe the field and avoid impulsive actions."
        ),
        reason: String(
            window.mtosDecision?.feedbackReason ||
            window.mtosDecision?.reason ||
            window.mtosDecision?.why ||
            t("derivedFromCachedDayState")
        ),
        confidence: Math.round(
            Math.max(0, Math.min(1, Number(window.mtosDecision?.confidence ?? 0.5))) * 100
        ),
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

renderSystemEventsPanel()
renderSystemDecisionPanel()
renderDecisionTargetsPanel()
renderFieldTensionPanel()
renderActionTracePanel()


window._rerenderMTOS = () => {
    renderAll(
        window._weather,
        window._weatherToday,
        window._pressure,
        window._userKin,
        window._todayKin,
        window._date.year,
        window._date.month,
        window._date.day
    )

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

    const rerenderTargets = typeof window.resolveDecisionTargets === "function"
    ? window.resolveDecisionTargets()
    : { primary: [], avoid: [], neutral: [] }

const rerenderSelectedName = getSelectedDecisionTarget()

const allRerenderTargets = [
    ...(Array.isArray(rerenderTargets.primary) ? rerenderTargets.primary : []),
    ...(Array.isArray(rerenderTargets.neutral) ? rerenderTargets.neutral : []),
    ...(Array.isArray(rerenderTargets.avoid) ? rerenderTargets.avoid : [])
]

const rerenderSelectedTarget =
    allRerenderTargets.find(x => x.name === rerenderSelectedName) ||
    (rerenderTargets.primary?.[0] || rerenderTargets.neutral?.[0] || null)

if (rerenderSelectedTarget?.name) {
    setSelectedDecisionTarget(rerenderSelectedTarget.name)
}

window.updateMTOSBranch("decision", {
    ...(window.MTOS_STATE?.decision || {}),
    targets: rerenderTargets,
    selectedTarget: rerenderSelectedTarget || null
})

renderDecisionSummaryPanel("humanLayer")

    window.updateMTOSBranch("collective", {
        ...(window.mtosCollectiveState || {}),
        stability: Number(window.mtosDayState?.stability ?? window.mtosCollectiveState?.stability ?? 0.5),
        timePressure: Number(window.mtosTimePressureSummary?.value ?? window.mtosCollectiveState?.timePressure ?? 0)
    })

    window.evaluateMTOSEvents()
    window.commitMTOSDecisionToMemory()

    renderSystemEventsPanel()
    renderSystemDecisionPanel()
    renderDecisionTargetsPanel()
    renderFieldTensionPanel()
    renderActionTracePanel()
    renderHistoryEfficiencyPanel("historyEfficiencyPanel")
}

        setStatusText("doneCache")
        return
    }

    if (!year || !month || !day) {
        setStatusText("enterDate")
        return
    }

    try {

        setStatusText("running")
        logEvent("run_start", { name, year, month, day })

        const metrics = computeBehaviorMetrics(window.MTOS_LOG)
        const truth = computeAutoTruth(metrics)

        logEvent("auto_truth", truth)

        // ===============================
        // USERS MEMORY
        // ===============================
        let userList = loadUsers()
        userList = addUser(userList, name)
        saveUsers(userList)

        pyodide.runPython(`
        import datetime
        
        birth = datetime.date(${year}, ${month}, ${day})
        kin, tone, seal, i = kin_from_date(birth)
        register_user(${JSON.stringify(name)}, birth, kin, tone, seal)
        `)

        // ===============================
        // PYTHON CORE
        // ===============================
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
    "mean_stability": float(np.mean(metabolic["stability"]))
})
`))

        const weather = result.weather
        const now = new Date()
        const weatherToday = weather

        // ===============================
        // ATTRACTOR FIELD
        // ===============================
        const attractorField = weather.map(w => {
            const a = Number(w.attention ?? 0.5)
            const act = Number(w.activity ?? a)
            const p = Number(w.pressure ?? 0)
            const c = Number(w.conflict ?? 0)

            const value =
                a * 0.45 +
                act * 0.30 +
                (1 - p) * 0.15 +
                (1 - c) * 0.10

            return Math.max(0, Math.min(1, value))
        })

        window._attractorField = attractorField

        //const weatherToday = JSON.parse(pyodide.runPython(`
        //import json
        //weather = mtos_260_weather("today",${now.getFullYear()},${now.getMonth()+1},${now.getDate()})
        //json.dumps(weather)
        //`))

        logEvent("python_result", {
            kin: result.kin,
            attention: result.attention,
            noise: result.noise,
            predictability: result.predictability
        })

        const pressure = result.pressure
        const userKin = result.kin

        // ===============================
        // TODAY
        // ===============================

        const todayKin = JSON.parse(pyodide.runPython(`
import json, datetime

today = datetime.datetime.now(datetime.timezone.utc).date()
kin, _, _, _ = kin_from_date(today)

json.dumps(kin)
`))

        window._weather = weather

        window._phaseField = weather.map(w => Number(w.phase ?? 0))
window._resonanceField = weather.map(w => Number(w.resonance ?? 0))
window._interferenceField = weather.map(w => Number(w.interference ?? 0))

window.mtosPhaseSummary = {
    meanPhase: Number(result.mean_phase ?? 0),
    meanResonance: Number(result.mean_resonance ?? 0),
    meanInterference: Number(result.mean_interference ?? 0)
}
        window._weatherToday = weatherToday
        window._pressure = pressure
        window._userKin = userKin
        window._todayKin = todayKin
        window._date = { year, month, day }

        window.setMTOSState({
            todayKin,
            selectedKin: userKin,
            weather: {
                phi: Number(result.mean_phi ?? 0),
                stability: Number(result.mean_stability ?? 0),
                timePressure: 0,
                raw: weather
            },
            events: [],
            decision: null
        })

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
`))

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
`))

        window.mtosUserMeta = userMeta
        window.mtosTodayMeta = todayMeta

        // ===============================
        // BUILD USERS
        // ===============================
        const usersSnapshot = JSON.parse(pyodide.runPython(`
import json
users_db = load_users()
json.dumps(users_db)
`))

users = userList.map((uName) => {
    const userData = usersSnapshot?.[uName] || {}

    let baseKin = null

    if (userData && userData.kin != null) {
        baseKin = Number(userData.kin)
    }

    if ((!Number.isFinite(baseKin) || baseKin < 1 || baseKin > 260) && userData && userData.birth) {
        const computedKin = Number(pyodide.runPython(`
import datetime
birth = datetime.date.fromisoformat(${JSON.stringify(userData.birth)})
kin, tone, seal, i = kin_from_date(birth)
kin
`))

        if (Number.isFinite(computedKin)) {
            baseKin = computedKin
        }
    }

    if (!Number.isFinite(baseKin) || baseKin < 1 || baseKin > 260) {
        console.warn("BAD USER DATA:", uName, userData)
        return null
    }

    const phase =
        Array.isArray(result.weather) && result.weather[baseKin - 1]
            ? Number(result.weather[baseKin - 1].phase ?? 0)
            : 0

    return {
        name: uName,
        kin: baseKin,
        baseKin,
        phase,
        weight: 1,

        goal: String(userData.goal || (uName === name ? "stability" : "social")).toLowerCase(),
        goalWeight: Number(userData.goalWeight ?? (uName === name ? 0.72 : 0.58)),

        location: userData.location || userData.city || userData.country || "",
        city: userData.city || "",
        country: userData.country || ""
    }
}).filter(Boolean)

        window._attractorField = applyTodayContactsToAttractorField(
    window._attractorField,
    users,
    getDayKeyFromParts(year, month, day)
)

        // 1. Посмотрим в консоли, как РЕАЛЬНО выглядит один юзе
                // debug logs disabled for speed

        // ===============================
        // FIELD
        // ===============================
        const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
        const baseMemory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
        const memory = buildEffectiveRelationMemory(baseMemory, getDayKeyFromParts(year, month, day))

        const networkFeedback = window.mtosNetworkFeedback || {
            totalLinks: 0,
            density: 0,
            meanStrength: 0,
            conflictRatio: 0,
            supportRatio: 0
        }

        const attractorState = window.mtosAttractorState || {
            type: "unknown",
            intensity: 0,
            score: 0
        }

        const prevUsers = JSON.parse(JSON.stringify(users))
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
`))

        fieldState = fieldResult[0]
        fieldMode = fieldResult[1]
        const updated = fieldResult[2]

        const dayState = classifyUserDay(
            userKin,
            weather,
            pressure,
            fieldState,
            window.mtosNetworkFeedback,
            window.mtosAttractorState
        )

        const evolvedDayState = resolveDynamicDayState(
    dayState,
    window.mtosNetworkFeedback,
    window.mtosAttractorState,
    window.mtosCollectiveState
)

const evolvedDayStateWithContacts = applyTodayContactsToDayState(
    evolvedDayState,
    users,
    getDayKeyFromParts(year, month, day)
)

window.mtosDayState = evolvedDayStateWithContacts

const memoryLayers = updateMemoryLayers(
    name,
    userKin,
    window.mtosDayState,
    weather,
    window._attractorField
)

window.mtosMemoryInfluence = getMemoryInfluence(name, userKin)

        const attractorAtUser =
            Array.isArray(window._attractorField) && userKin >= 1 && userKin <= 260
                ? Number(window._attractorField[userKin - 1] ?? 0.5)
                : 0.5

       window.mtosDayState.attractorField = attractorAtUser
window.mtosDayState.dayIndex = Number(
    Math.max(-1, Math.min(1, window.mtosDayState.dayIndex + (attractorAtUser - 0.5) * 0.25)).toFixed(3)
)

if (attractorAtUser > 0.72) {
    window.mtosDayState.dayDesc += " Strong attractor pull is present."
} else if (attractorAtUser < 0.28) {
    window.mtosDayState.dayDesc += " Weak attractor pull reduces coherence."
}

const uiMetrics = buildUnifiedMetrics(result, window.mtosDayState)
window.mtosUnifiedMetrics = uiMetrics

const metabolicMetrics = buildMetabolicMetrics(result, window.mtosDayState)
window.mtosMetabolicMetrics = metabolicMetrics

window.mtosUnifiedMetrics = {
    ...uiMetrics,
    phi: metabolicMetrics.phi,
    k: metabolicMetrics.k,
    temperature: metabolicMetrics.T,
    pressureScalar: metabolicMetrics.P,
    volume: metabolicMetrics.V,
    consistency: metabolicMetrics.consistency,
    metabolicStability: metabolicMetrics.stability
}

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
})

window.mtosTimePressure = timePressure
window.mtosTimePressureSummary = getTimePressureSummary(timePressure)

window.updateMTOSBranch("weather", {
    phi: Number(result.mean_phi ?? 0),
    stability: Number(result.mean_stability ?? window.mtosDayState?.stability ?? 0.5),
    timePressure: Number(window.mtosTimePressureSummary?.value ?? 0),
    raw: weather
})

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
}

window.mtosDayState = applyTimePressureToDayState(window.mtosDayState, timePressure)

const baseDecision = resolveTodayMode(
    window.mtosDayState,
    window.mtosTimePressureSummary,
    window.mtosMemoryLayers
)

const decision = applyFeedbackToDecision(
    baseDecision,
    name,
    window.mtosDayState
)

window.mtosDecision = decision

window.mtosRisk = decision?.risk || null

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
        Math.max(0, Math.min(1, Number(decision?.confidence ?? 0.5))) * 100
    ),
    targets: { primary: [], avoid: [], neutral: [] },
    selectedTarget: null,
    source: "human_decision_layer",
    createdAt: new Date().toISOString()
})

const currentUserAgent = users.find(u => u.name === name) || null
const autoFeedbackRow = storeAutoFeedbackForCurrentRun(
    name,
    currentUserAgent,
    window.mtosDayState,
    decision
)

window.mtosAutoFeedbackRow = autoFeedbackRow

if (window.mtosAttractorState) {
    window.mtosAttractorState = applyTimePressureToAttractorState(
        window.mtosAttractorState,
        timePressure
    )
}

const autoModeFeedback = applyAutomaticModeFeedback(
    name,
    evolvedDayState,
    metrics,
    truth
)

        window.mtosAutoModeFeedback = autoModeFeedback

        // ===============================
        // FORECAST VALIDATION
        // ===============================
        const baseDateUtc = new Date(Date.UTC(year, month - 1, day))

        const forecasts = makeForecastsFromWeather(
    name,
    userKin,
    weather,
    baseDateUtc,
    evolvedDayState
)

        forecasts.forEach(f => addForecast(f))

        const forecastValidation = resolveCurrentForecasts(
    name,
    userKin,
    result.attention,
    evolvedDayState
)

        const forecastStats = getForecastStats()
        window.mtosForecastStats = forecastStats

        logEvent("forecast_stats", forecastStats)

        const learningUpdate = updateSelfLearningLoop({
    name,
    dayState: evolvedDayState,
    mode: window.mtosAdaptiveMode?.mode || "UNKNOWN",
    attractorType: window.mtosAttractorState?.type || "unknown",
    forecastStats,
    autoModeFeedback
})

window.mtosLearningState = learningUpdate.state
window.mtosLearningSignal = learningUpdate.signal

if (learningUpdate.signal >= 0.20 && window.mtosAdaptiveMode?.mode) {
    registerModeFeedback(window.mtosAdaptiveMode.mode, true, evolvedDayState)
} else if (learningUpdate.signal <= -0.20 && window.mtosAdaptiveMode?.mode) {
    registerModeFeedback(window.mtosAdaptiveMode.mode, false, evolvedDayState)
}

        logEvent("day_state", {
    userKin,
    dayIndex: evolvedDayState.dayIndex,
    dayLabel: evolvedDayState.dayLabel,
    dayScore: evolvedDayState.dayScore,
    attention: evolvedDayState.attention,
    activity: evolvedDayState.activity,
    pressure: evolvedDayState.pressure,
    conflict: evolvedDayState.conflict,
    field: evolvedDayState.field,
    stability: evolvedDayState.stability
})

saveAutoDailySnapshot({
    name,
    userKin,
    todayKin,
    uiMetrics,
    dayState: evolvedDayState,
    users,
    fieldState
})

        const prevMap = {}
        prevUsers.forEach(u => {
            prevMap[u.name] = u
        })

        users = updated.map(u => {
    const prev = (prevUsers || []).find(x => x.name === u.name) || {}

    return {
    name: u.name,
    kin: Number(u.baseKin ?? u.kin),
    baseKin: Number(u.baseKin ?? u.kin),

    goal: String(u.goal || prev.goal || "stability").toLowerCase(),
    goalWeight: Number(u.goalWeight ?? prev.goalWeight ?? 0.65),
    goalScore: Number(u.goalScore ?? prev.goalScore ?? 0.5),
    goalFeedback: String(u.goalFeedback || prev.goalFeedback || "neutral"),

    location: u.location || prev.location || "",
    city: u.city || prev.city || "",
    country: u.country || prev.country || ""
}
})

        window.currentUsers = users

        window.mtosDaySync = getDaySyncInfo(users, todayKin)

        try {
    saveNetworkState(users, memory)
} catch (e) {
    console.warn("saveNetworkState skipped", e)
}

        logEvent("agents_update", {
            users: users,
            fieldState: fieldState,
            weather: weather,
            pressure: pressure,
            userKin: userKin,
            todayKin: todayKin
        })

        // ===============================
        // UI STATE
        // ===============================
        renderCognitiveState(
    userKin,
    todayKin,
    uiMetrics.attention,
    uiMetrics.noise,
    uiMetrics.entropy,
    uiMetrics.lyapunov,
    uiMetrics.prediction,
    uiMetrics.predictability,
    window.mtosDaySync,
    window.mtosDayState
)

        // ===============================
        // RENDER ВСЕГО
        // ===============================
        renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day)

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

const resolvedTargets = typeof window.resolveDecisionTargets === "function"
    ? window.resolveDecisionTargets()
    : { primary: [], avoid: [], neutral: [] }

const selectedTargetName = getSelectedDecisionTarget()

const allResolvedTargets = [
    ...(Array.isArray(resolvedTargets.primary) ? resolvedTargets.primary : []),
    ...(Array.isArray(resolvedTargets.neutral) ? resolvedTargets.neutral : []),
    ...(Array.isArray(resolvedTargets.avoid) ? resolvedTargets.avoid : [])
]

const selectedTarget =
    allResolvedTargets.find(x => x.name === selectedTargetName) ||
    (resolvedTargets.primary?.[0] || resolvedTargets.neutral?.[0] || null)

if (selectedTarget?.name) {
    setSelectedDecisionTarget(selectedTarget.name)
}

window.updateMTOSBranch("decision", {
    ...(window.MTOS_STATE?.decision || {}),
    targets: resolvedTargets,
    selectedTarget: selectedTarget || null
})

renderDecisionSummaryPanel("humanLayer")

window.updateMTOSBranch("collective", {
    ...(window.mtosCollectiveState || {}),
    stability: Number(window.mtosDayState?.stability ?? window.mtosCollectiveState?.stability ?? 0.5),
    timePressure: Number(window.mtosTimePressureSummary?.value ?? window.mtosCollectiveState?.timePressure ?? 0)
})

window.evaluateMTOSEvents()
window.commitMTOSDecisionToMemory()

renderSystemEventsPanel()
renderSystemDecisionPanel()
renderDecisionTargetsPanel()
renderFieldTensionPanel()
renderActionTracePanel()

window._rerenderMTOS = () => {
    renderAll(
        window._weather,
        window._weatherToday,
        window._pressure,
        window._userKin,
        window._todayKin,
        window._date.year,
        window._date.month,
        window._date.day
    )

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

    const rerenderTargets = typeof window.resolveDecisionTargets === "function"
    ? window.resolveDecisionTargets()
    : { primary: [], avoid: [], neutral: [] }

const rerenderSelectedName = getSelectedDecisionTarget()

const allRerenderTargets = [
    ...(Array.isArray(rerenderTargets.primary) ? rerenderTargets.primary : []),
    ...(Array.isArray(rerenderTargets.neutral) ? rerenderTargets.neutral : []),
    ...(Array.isArray(rerenderTargets.avoid) ? rerenderTargets.avoid : [])
]

const rerenderSelectedTarget =
    allRerenderTargets.find(x => x.name === rerenderSelectedName) ||
    (rerenderTargets.primary?.[0] || rerenderTargets.neutral?.[0] || null)

if (rerenderSelectedTarget?.name) {
    setSelectedDecisionTarget(rerenderSelectedTarget.name)
}

window.updateMTOSBranch("decision", {
    ...(window.MTOS_STATE?.decision || {}),
    targets: rerenderTargets,
    selectedTarget: rerenderSelectedTarget || null
})

renderDecisionSummaryPanel("humanLayer")

    window.updateMTOSBranch("collective", {
        ...(window.mtosCollectiveState || {}),
        stability: Number(window.mtosDayState?.stability ?? window.mtosCollectiveState?.stability ?? 0.5),
        timePressure: Number(window.mtosTimePressureSummary?.value ?? window.mtosCollectiveState?.timePressure ?? 0)
    })

    window.evaluateMTOSEvents()
    window.commitMTOSDecisionToMemory()

    renderSystemEventsPanel()
    renderSystemDecisionPanel()
    renderDecisionTargetsPanel()
    renderFieldTensionPanel()
    renderActionTracePanel()
    renderHistoryEfficiencyPanel("historyEfficiencyPanel")
}

window._mtosRunCache[runtimeKey] = {
    weather,
    weatherToday,
    pressure,
    userKin,
    todayKin,
    attractorField: window._attractorField,
    dayState: window.mtosDayState,
    uiMetrics: window.mtosUnifiedMetrics,
    metabolicMetrics: window.mtosMetabolicMetrics,
    daySync: window.mtosDaySync,
    timePressure: window.mtosTimePressure || null,
    timePressureSummary: window.mtosTimePressureSummary || null,
    fieldState,
    fieldMode,
    userMeta,
    todayMeta,
    users: JSON.parse(JSON.stringify(users || []))
}

        setStatusText("done")

        // ===============================
        // TIME CONTROL
        // ===============================
        let baseYear = year
        let baseMonth = month
        let baseDay = day

        let cachedBaseWeather = Array.isArray(weather) ? weather : []
        let cachedBasePressure = Array.isArray(pressure) ? pressure : []

        function step(offset) {

            const d = new Date(baseYear, baseMonth - 1, baseDay)
            d.setDate(d.getDate() + offset)

            const y = d.getFullYear()
            const m = d.getMonth() + 1
            const dd = d.getDate()

            const currentKin = JSON.parse(pyodide.runPython(`
import json, datetime
current_date = datetime.date(${y}, ${m}, ${dd})
current_kin, _, _, _ = kin_from_date(current_date)
json.dumps(current_kin)
`))

            const weather = shiftWeatherArray(cachedBaseWeather, offset)
            const pressure = cachedBasePressure

            const result = {
                weather,
                pressure,
                kin: currentKin,
                attention: 0.5,
                noise: 0.1,
                entropy: 1.2,
                lyapunov: 0.2,
                prediction: 0.5,
                predictability: 120
            }
            logEvent("time_step", {
                year: y,
                month: m,
                day: dd,
                kin: currentKin
            })

users = users.map((u) => {

    const kinForPhase = u.baseKin || u.kin

    const phaseFromWeather =
        Array.isArray(weather) && weather[kinForPhase - 1]
            ? Number(weather[kinForPhase - 1].phase ?? 0)
            : 0

    return {
        ...u,
        kin: kinForPhase,
        baseKin: kinForPhase,
        phase: phaseFromWeather
    }
})

            const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
            const baseMemory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
            const memory = buildEffectiveRelationMemory(baseMemory, getDayKeyFromParts(y, m, dd))

            const networkFeedback = window.mtosNetworkFeedback || {
                totalLinks: 0,
                density: 0,
                meanStrength: 0,
                conflictRatio: 0,
                supportRatio: 0
            }

            const attractorState = window.mtosAttractorState || {
                type: "unknown",
                intensity: 0,
                score: 0
            }

            const prevUsers = JSON.parse(JSON.stringify(users))
            const fieldResult = JSON.parse(pyodide.runPython(`
import json
users = ${JSON.stringify(users)}
f,s,u = mtos_multi_agents_field(
    users,
    ${y},
    ${m},
    ${dd},
    ${fieldState ? toPython(fieldState) : "None"},
    ${fieldMode ? toPython(fieldMode) : "None"},
    ${toPython(locked)},
    ${toPython(memory)},
    ${toPython(networkFeedback)},
    ${toPython(attractorState)}
)
json.dumps([f,s,u])
`))

            fieldState = fieldResult[0]
            fieldMode = fieldResult[1]
            const updated = fieldResult[2]

            const dayState = classifyUserDay(
                currentKin,
                weather,
                pressure,
                fieldState,
                window.mtosNetworkFeedback,
                window.mtosAttractorState
            )

            const evolvedDayState = resolveDynamicDayState(
    dayState,
    window.mtosNetworkFeedback,
    window.mtosAttractorState
)

window._attractorField = applyTodayContactsToAttractorField(
    window._attractorField,
    users,
    getDayKeyFromParts(y, m, dd)
)

const evolvedDayStateWithContacts = applyTodayContactsToDayState(
    evolvedDayState,
    users,
    getDayKeyFromParts(y, m, dd)
)

window.mtosDayState = evolvedDayStateWithContacts

            const attractorAtUser =
                Array.isArray(window._attractorField) && userKin >= 1 && userKin <= 260
                    ? Number(window._attractorField[userKin - 1] ?? 0.5)
                    : 0.5

            evolvedDayState.attractorField = attractorAtUser
            evolvedDayState.dayIndex = Number(
                Math.max(-1, Math.min(1, evolvedDayState.dayIndex + (attractorAtUser - 0.5) * 0.25)).toFixed(3)
            )

            if (attractorAtUser > 0.72) {
                evolvedDayState.dayDesc += " Strong attractor pull is present."
            } else if (attractorAtUser < 0.28) {
                evolvedDayState.dayDesc += " Weak attractor pull reduces coherence."
            }

            const memoryLayers = updateMemoryLayers(
    name,
    currentKin,
    window.mtosDayState,
    weather,
    window._attractorField
)

window.mtosMemoryInfluence = getMemoryInfluence(name, currentKin)

const uiMetrics = buildUnifiedMetrics(result, evolvedDayState)
window.mtosUnifiedMetrics = uiMetrics

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
})

window.mtosTimePressure = timePressure
window.mtosTimePressureSummary = getTimePressureSummary(timePressure)

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
}

window.mtosDayState = applyTimePressureToDayState(window.mtosDayState, timePressure)

if (window.mtosAttractorState) {
    window.mtosAttractorState = applyTimePressureToAttractorState(
        window.mtosAttractorState,
        timePressure
    )
}

const baseDecision = resolveTodayMode(
    window.mtosDayState,
    window.mtosTimePressureSummary,
    window.mtosMemoryLayers
)

const stepDecision = applyFeedbackToDecision(
    baseDecision,
    name,
    window.mtosDayState
)

window.mtosDecision = stepDecision

window.updateMTOSBranch("decision", {
    mode: String(stepDecision?.mode || "EXPLORE"),
    action: String(
        stepDecision?.text ||
        stepDecision?.action ||
        "Observe the field and avoid impulsive actions."
    ),
    reason: String(
        stepDecision?.feedbackReason ||
        stepDecision?.reason ||
        stepDecision?.why ||
        "Derived from day state, time pressure, and memory."
    ),
    confidence: Math.round(
        Math.max(0, Math.min(1, Number(stepDecision?.confidence ?? 0.5))) * 100
    ),
    targets: { primary: [], avoid: [], neutral: [] },
    source: "human_decision_layer",
    createdAt: new Date().toISOString()
})

const currentStepUserAgent = users.find(u => u.name === name) || null
const autoFeedbackRow = storeAutoFeedbackForCurrentRun(
    name,
    currentStepUserAgent,
    window.mtosDayState,
    stepDecision
)

window.mtosAutoFeedbackRow = autoFeedbackRow

const stepMetrics = computeBehaviorMetrics(window.MTOS_LOG)
const stepTruth = computeAutoTruth(stepMetrics)

const autoModeFeedback = applyAutomaticModeFeedback(
    name,
    evolvedDayState,
    stepMetrics,
    stepTruth
)

            window.mtosAutoModeFeedback = autoModeFeedback

            const baseDateUtc = new Date(Date.UTC(y, m - 1, dd))

const forecasts = makeForecastsFromWeather(
    name,
    currentKin,
    weather,
    baseDateUtc,
    evolvedDayState
)

forecasts.forEach(f => addForecast(f))

resolveCurrentForecasts(
    name,
    currentKin,
    uiMetrics.attention,
    evolvedDayState
)

const forecastStats = getForecastStats()
window.mtosForecastStats = forecastStats

const learningUpdate = updateSelfLearningLoop({
    name,
    dayState: evolvedDayState,
    mode: window.mtosAdaptiveMode?.mode || "UNKNOWN",
    attractorType: window.mtosAttractorState?.type || "unknown",
    forecastStats,
    autoModeFeedback
})

window.mtosLearningState = learningUpdate.state
window.mtosLearningSignal = learningUpdate.signal

if (learningUpdate.signal >= 0.20 && window.mtosAdaptiveMode?.mode) {
    registerModeFeedback(window.mtosAdaptiveMode.mode, true, evolvedDayState)
} else if (learningUpdate.signal <= -0.20 && window.mtosAdaptiveMode?.mode) {
    registerModeFeedback(window.mtosAdaptiveMode.mode, false, evolvedDayState)
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
})

saveAutoDailySnapshot({
    name,
    userKin,
    todayKin,
    uiMetrics,
    dayState: evolvedDayState,
    users,
    fieldState
})

            const prevMap = {}
            prevUsers.forEach(u => {
                prevMap[u.name] = u
            })

            users = updated.map(u => {

    const prev = (prevUsers || []).find(x => x.name === u.name) || {}

    const kinForPhase = Number(u.baseKin ?? u.kin)

    const phaseFromWeather =
        Array.isArray(weather) && weather[kinForPhase - 1]
            ? Number(weather[kinForPhase - 1].phase ?? 0)
            : 0

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
}
})
            window.currentUsers = users

            window.mtosDaySync = getDaySyncInfo(users, currentKin)

            try {
    saveNetworkState(users, memory)
} catch (e) {
    console.warn("saveNetworkState skipped", e)
}

            logEvent("agents_update", {
                users: users,
                fieldState: fieldState,
                weather: weather,
                pressure: pressure,
                userKin: currentKin,
                todayKin: currentKin
            })

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
    window.mtosDayState
)

            renderAll(weather, weatherToday, pressure, currentKin, currentKin, y, m, dd)

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

const resolvedStepTargets = typeof window.resolveDecisionTargets === "function"
    ? window.resolveDecisionTargets()
    : { primary: [], avoid: [], neutral: [] }

const stepSelectedName = getSelectedDecisionTarget()

const allStepTargets = [
    ...(Array.isArray(resolvedStepTargets.primary) ? resolvedStepTargets.primary : []),
    ...(Array.isArray(resolvedStepTargets.neutral) ? resolvedStepTargets.neutral : []),
    ...(Array.isArray(resolvedStepTargets.avoid) ? resolvedStepTargets.avoid : [])
]

const stepSelectedTarget =
    allStepTargets.find(x => x.name === stepSelectedName) ||
    (resolvedStepTargets.primary?.[0] || resolvedStepTargets.neutral?.[0] || null)

if (stepSelectedTarget?.name) {
    setSelectedDecisionTarget(stepSelectedTarget.name)
}

window.updateMTOSBranch("decision", {
    ...(window.MTOS_STATE?.decision || {}),
    targets: resolvedStepTargets,
    selectedTarget: stepSelectedTarget || null
})

renderDecisionSummaryPanel("humanLayer")

window.updateMTOSBranch("collective", {
    ...(window.mtosCollectiveState || {}),
    stability: Number(window.mtosDayState?.stability ?? window.mtosCollectiveState?.stability ?? 0.5),
    timePressure: Number(window.mtosTimePressureSummary?.value ?? window.mtosCollectiveState?.timePressure ?? 0)
})

window.evaluateMTOSEvents()
window.commitMTOSDecisionToMemory()

renderSystemEventsPanel()
renderSystemDecisionPanel()
renderDecisionTargetsPanel()
renderFieldTensionPanel()
renderActionTracePanel()

        }

        initTimeControls(step)

    } catch (e) {
        console.error(e)
        status.innerText = t("error")
    }

    window.onKinSelect = (kin) => {
    logEvent("kin_select", {
        kin,
        memory: selectionMemory[KinRegistry.toIndex(kin)]
    })

    selectedKin = kin
    window.selectedKin = kin

    renderAttractorOnly()
}

applyMTOSViewMode(window.mtosViewMode || loadMTOSViewMode())
}

updateMTOSLogo()

// ===============================
// RENDER ALL
// ===============================

function renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day) {
    drawWeatherMap(
        "weatherMap",
        weather,
        userKin,
        todayKin,
        pressure,
        fieldState,
        selectedAgent,
        window._attractorField
    )

    const now = new Date()
    drawSeries(
        "seriesBlock",
        weatherToday,
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
    )

    drawNetwork("networkMap", users, () => {}, window._matrix || null)
    drawCollective("collective", users)

    renderAttractorOnly()
    renderHistoryEfficiencyPanel("historyEfficiencyPanel")
}

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
// ===============================
// UI STATE
// ===============================
function interpretMetric(name, value) {
    if (value > 0.75) return "high"
    if (value < 0.3) return "low"
    return "moderate"
}

function clampMetric(v, min = 0, max = 1) {
    const n = Number(v)
    if (!Number.isFinite(n)) return min
    return Math.max(min, Math.min(max, n))
}

function buildUnifiedMetrics(result, dayState) {
    const ds = dayState || {}
    const r = result || {}

    const attention = clampMetric(ds.attention ?? r.attention ?? 0.5, 0, 1)

    const noise = clampMetric(
        (Number(ds.conflict ?? 0) * 0.65) +
        (Number(ds.pressure ?? 0) * 0.35),
        0,
        1
    )

    const entropy = clampMetric(
        (
            Number(ds.pressure ?? 0) * 0.9 +
            Number(ds.conflict ?? 0) * 0.9 +
            (1 - Number(ds.stability ?? 0.5)) * 1.2
        ),
        0,
        1
    ) * 3.0

    const lyapunov = Number(
        (
            Number(ds.stability ?? 0.5) -
            Number(ds.pressure ?? 0) * 0.8 -
            Number(ds.conflict ?? 0) * 0.6
        ).toFixed(3)
    )

    const prediction = clampMetric(
        Number(ds.stability ?? 0.5) * 0.5 +
        Number(ds.attention ?? 0.5) * 0.35 +
        Number(ds.field ?? 0.5) * 0.15 -
        Number(ds.pressure ?? 0) * 0.2 -
        Number(ds.conflict ?? 0) * 0.1,
        0,
        1
    )

    const predictability = Math.round(
        5 + 255 * clampMetric(
            Number(ds.stability ?? 0.5) * 0.55 +
            Number(ds.attention ?? 0.5) * 0.20 +
            Number(ds.field ?? 0.5) * 0.15 -
            Number(ds.pressure ?? 0) * 0.10 -
            Number(ds.conflict ?? 0) * 0.10,
            0,
            1
        )
    )

    return {
        attention,
        noise,
        entropy,
        lyapunov,
        prediction,
        predictability
    }
}

function buildMetabolicMetrics(result, ds){
    const userKin = Number(window._userKin || result?.kin || 1)
    const idx = Math.max(0, Math.min(259, userKin - 1))

    const pressureSeries = Array.isArray(result?.metabolic_pressure) ? result.metabolic_pressure : []
    const temperatureSeries = Array.isArray(result?.metabolic_temperature) ? result.metabolic_temperature : []
    const phiSeries = Array.isArray(result?.metabolic_phi) ? result.metabolic_phi : []
    const kSeries = Array.isArray(result?.metabolic_k) ? result.metabolic_k : []
    const consistencySeries = Array.isArray(result?.metabolic_consistency) ? result.metabolic_consistency : []
    const stabilitySeries = Array.isArray(result?.metabolic_stability) ? result.metabolic_stability : []

    const safe = (arr, fallback = 0) => {
        const v = Number(arr?.[idx])
        return Number.isFinite(v) ? v : fallback
    }

    const P = safe(pressureSeries, Number(ds?.pressure ?? 0))
    const V = Math.max(0, Math.min(1, Number(ds?.attention ?? result?.attention ?? 0.5)))
    const T = safe(temperatureSeries, 0.5)
    const phi = safe(phiSeries, P * V)
    const k = safe(kSeries, phi / Math.max(T, 1e-6))
    const consistency = safe(consistencySeries, Math.abs(phi - k * T))
    const stability = safe(stabilitySeries, Number(ds?.stability ?? 0.5))

    return {
    P: Number(result.mean_pressure ?? ds?.pressure ?? 0.5),
    V: Number(ds?.attention ?? 0.5),
    T: Number(result.mean_temperature ?? 0.5),
    phi: Number(result.mean_phi ?? 0),
    k: Number(result.mean_k ?? 0),
    consistency: Number(result.mean_consistency ?? 0),

    // ВОТ ЭТО ГЛАВНОЕ ↓↓↓

    phiSeries: Array.isArray(result.metabolic_phi)
        ? result.metabolic_phi.map(Number)
        : [],

    temperatureSeries: Array.isArray(result.metabolic_temperature)
        ? result.metabolic_temperature.map(Number)
        : [],

    consistencySeries: Array.isArray(result.metabolic_consistency)
        ? result.metabolic_consistency.map(Number)
        : []
}
}

function loadDayEvolutionMemory() {
    try {
        const raw = localStorage.getItem("mtos_day_evolution")
        const parsed = raw ? JSON.parse(raw) : null

        if (parsed && typeof parsed === "object") {
            return {
                lastLabel: typeof parsed.lastLabel === "string" ? parsed.lastLabel : "NEUTRAL",
                lastScore: Number(parsed.lastScore ?? 0),
                momentum: Number(parsed.momentum ?? 0),
                streak: Number(parsed.streak ?? 0),
                updatedAt: parsed.updatedAt || null
            }
        }
    } catch (e) {
        console.warn("day evolution memory load failed", e)
    }

    return {
        lastLabel: "NEUTRAL",
        lastScore: 0,
        momentum: 0,
        streak: 0,
        updatedAt: null
    }
}

function saveDayEvolutionMemory(state) {
    try {
        localStorage.setItem("mtos_day_evolution", JSON.stringify(state))
    } catch (e) {
        console.warn("day evolution memory save failed", e)
    }
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

const memory = loadDayEvolutionMemory()

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
    })

    evolved.streak = streak

    return evolved
}

function renderCognitiveState(
    userKin,
    todayKin,
    attention,
    noise,
    entropy,
    lyapunov,
    prediction,
    predictability,
    sync,
    ds
){
    const el = document.getElementById("todayBlock")
    const quick = document.getElementById("quickMetrics")

    if (!el) return

    if (!ds) {
        el.innerHTML = ""
        if (quick) quick.innerHTML = ""
        renderHumanLayer(null)
        return
    }

    // скрываем старый научный верхний блок
    el.innerHTML = ""

    // скрываем карточки ATTENTION / NOISE / ENTROPY / PREDICTABILITY / TIME PRESSURE / MODEL VALIDATION
    if (quick) {
        quick.innerHTML = ""
    }

    // оставляем только большой Human Mode
    renderHumanLayerV2(ds, {
    name: getCurrentUserName(),
    day: getCurrentRunDay(),
    decision: window.mtosDecision || {},
    attractorState: window.mtosAttractorState || {},
    timePressureSummary: window.mtosTimePressureSummary || {},
    forecastStats: window.mtosForecastStats || {},
    snapshots: JSON.parse(localStorage.getItem("mtos_daily_snapshots") || "[]"),
    feedback: getHumanFeedbackFor(getCurrentRunDay(), getCurrentUserName()),
    metabolic: window.mtosMetabolicMetrics || {}
})
renderDecisionSummaryPanel("humanLayer")
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

function renderSystemEventsPanel(){
    const root = document.getElementById("mtosEventPanel")
    if(!root) return

    const events = Array.isArray(window.MTOS_STATE?.events)
        ? window.MTOS_STATE.events
        : []

    function translateEventTitle(title){
        const s = String(title || "").trim()

        if (!s) return t("backgroundMode")
        if (s === "Background Mode") return t("backgroundMode")

        return s
    }

    function translateEventLevel(level){
        const s = String(level || "").trim().toLowerCase()

        if (s === "low") return t("levelLow")
        if (s === "medium") return t("levelMedium")
        if (s === "high") return t("levelHigh")

        return String(level || "")
    }

    function translateEventDescription(desc){
        const s = String(desc || "").trim()

        if (!s) return t("noMajorEvent")
        if (s === "No major event threshold reached.") return t("noMajorEvent")

        return s
    }

    function translateEventType(type, title){
        const raw = String(type || "").trim()
        const titleSafe = String(title || "").trim()

        if (raw.toLowerCase() === "background") return t("eventTypeBackground")
        if (titleSafe === "Background Mode" && !raw) return t("eventTypeBackground")

        return translateRelationLabel(raw) || raw
    }

    if(!events.length){
        root.innerHTML = `
            <div style="
                max-width:860px;
                margin:0 auto;
                padding:14px;
                border:1px solid rgba(255,255,255,0.08);
                border-radius:16px;
                background:rgba(255,255,255,0.03);
                color:#e5e7eb;
                text-align:left;
            ">
                <div style="font-size:18px;font-weight:700;color:#fff;">${t("backgroundMode")}</div>
                <div style="font-size:13px;color:#9ca3af;margin-top:6px;">
                    ${t("type")}: ${t("eventTypeBackground")} • ${t("level")}: ${t("levelLow")} • ${t("score")}: 0.18
                </div>
                <div style="font-size:14px;line-height:1.6;margin-top:8px;">
                    ${t("noMajorEvent")}
                </div>
            </div>
        `
        return
    }

    root.innerHTML = `
        <div style="
            max-width:860px;
            margin:0 auto;
            display:grid;
            gap:10px;
        ">
            ${events.map(e => `
                <div style="
                    padding:14px;
                    border:1px solid rgba(255,255,255,0.08);
                    border-radius:16px;
                    background:rgba(255,255,255,0.03);
                    color:#e5e7eb;
                    text-align:left;
                ">
                    <div style="font-size:18px;font-weight:700;color:#fff;">
                        ${translateEventTitle(e.title)}
                    </div>

                    <div style="font-size:13px;color:#9ca3af;margin-top:6px;">
                        ${t("type")}: ${translateEventType(e.type || e.label || "", e.title || "")}
                        • ${t("level")}: ${translateEventLevel(e.level || "")}
                        • ${t("score")}: ${Number(e.score || 0).toFixed(2)}
                    </div>

                    <div style="font-size:14px;line-height:1.6;margin-top:8px;">
                        ${translateEventDescription(e.description)}
                    </div>
                </div>
            `).join("")}
        </div>
    `
}

function renderSystemDecisionPanel(){
    const root = document.getElementById("mtosDecisionPanel")
    if(!root) return

    const decision = window.MTOS_STATE?.decision || null
    const selectedTarget = decision?.selectedTarget || null

    const modeText = translateModeLabel(decision?.mode || "EXPLORE")

    let actionText = String(decision?.action || "").trim()
    if (decision?.mode === "ADJUST") {
        actionText = t("adjust_desc")
    }
    if (actionText === "Observe the field." || !actionText) {
        actionText = t("observeField")
    }

    let reasonText = String(decision?.reason || "").trim()

if (
    reasonText === "No reason" ||
    !reasonText
) {
    reasonText = t("noReason")
} else if (reasonText === "No strong feedback pattern yet.") {
    reasonText = t("noStrongFeedbackPattern")
} else if (reasonText === "Derived from cached day state.") {
    reasonText = t("derivedFromCachedDayState")
} else if (reasonText === "Derived from day state, time pressure, and memory.") {
    reasonText = t("derivedFromDayState")
}

    const targetLabelText = selectedTarget?.label
        ? translateRelationLabel(selectedTarget.label)
        : ""

    if(!decision){
        root.innerHTML = `
            <div style="
                max-width:860px;
                margin:0 auto;
                padding:14px;
                border:1px solid rgba(255,255,255,0.08);
                border-radius:16px;
                background:rgba(255,255,255,0.03);
                color:#9ca3af;
            ">
                ${t("noSystemDecisionYet")}
            </div>
        `
        return
    }

    root.innerHTML = `
        <div style="
            max-width:860px;
            margin:0 auto;
            padding:18px;
            border:1px solid rgba(255,255,255,0.10);
            border-radius:20px;
            background:
                radial-gradient(circle at 12% 100%, rgba(0,255,136,0.08), transparent 25%),
                radial-gradient(circle at 88% 100%, rgba(255,210,80,0.06), transparent 22%),
                linear-gradient(180deg, rgba(8,10,14,0.98) 0%, rgba(4,6,9,1) 100%);
            color:#f8fafc;
            text-align:left;
        ">
            <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b949e;margin-bottom:8px;">
                ${t("systemOutput")}
            </div>
            <div style="font-size:28px;font-weight:800;color:#00ff88;line-height:1.1;">
                ${modeText}
            </div>
            <div style="font-size:16px;line-height:1.7;color:#e5e7eb;margin-top:12px;">
                ${actionText}
            </div>
            <div style="font-size:13px;color:#9ca3af;margin-top:12px;">
                ${t("reason")}: ${reasonText}
            </div>
            <div style="font-size:13px;color:#9ca3af;margin-top:6px;">
                ${t("confidence")}: ${decision.confidence || 50}%
            </div>
            ${selectedTarget ? `
                <div style="font-size:13px;color:#9ca3af;margin-top:6px;">
                    ${t("bestTargetNow")}: <span style="color:#00ff88;font-weight:700;">${selectedTarget.name}</span>
                    • ${targetLabelText}
                    • ${t("score")} ${Number(selectedTarget.score ?? 0).toFixed(2)}
                </div>
            ` : ""}
        </div>
    `
}

function resolveDecisionTargetsLocal(){
    const currentName = getCurrentUserName()
    const decision = window.MTOS_STATE?.decision || window.mtosDecision || {}
    const mode = String(decision?.mode || "EXPLORE").toUpperCase()
    const relations = Array.isArray(window.currentNetworkRelations)
        ? window.currentNetworkRelations
        : []

    if (!currentName || !relations.length) {
        return {
            primary: [],
            avoid: [],
            neutral: []
        }
    }

    const mapped = relations
        .filter(r => r && (r.source === currentName || r.target === currentName))
        .map(r => {
            const other = r.source === currentName ? r.target : r.source
            const score = Number(r.adjustedScore ?? r.score ?? r.displayScore ?? r.strength ?? 0)
            const label = String(r.label || r.type || "neutral")
            const isContact = !!r.isTodayRealContact
            const urgency = Number(r.urgency ?? 0)
            const timePressure = Number(r.timePressure ?? 0)

            let priority = score

            if (mode === "INTERACT") {
    priority += isContact ? 0.22 : 0
    priority += score > 0 ? 0.18 : -0.12
}
else if (mode === "FOCUS") {
    priority += score > 0 ? 0.08 : -0.18
    priority -= urgency * 0.08
}
else if (mode === "ADJUST") {
    priority += score > 0 ? 0.04 : -0.08
    priority -= Math.abs(score) * 0.04
    priority -= urgency * 0.10
}
else if (mode === "REST") {
    priority -= Math.abs(score) * 0.18
    priority -= urgency * 0.12
}
else {
    priority += score > 0 ? 0.06 : -0.06
}

            return {
                name: other,
                score: Number(score.toFixed(3)),
                label,
                isTodayRealContact: isContact,
                urgency: Number(urgency.toFixed(3)),
                timePressure: Number(timePressure.toFixed(3)),
                priority: Number(priority.toFixed(3))
            }
        })

    const primary = mapped
        .filter(x => x.score > 0.12)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3)

    const avoid = mapped
        .filter(x => x.score < -0.12)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3)

    const used = new Set([
        ...primary.map(x => x.name),
        ...avoid.map(x => x.name)
    ])

    const neutral = mapped
        .filter(x => !used.has(x.name))
        .sort((a, b) => Math.abs(a.score) - Math.abs(b.score))
        .slice(0, 3)

    return { primary, avoid, neutral }
}

window.resolveDecisionTargets = resolveDecisionTargetsLocal

const MTOS_SELECTED_TARGET_KEY = "mtos_selected_target_v1"

function getSelectedDecisionTarget(){
    try{
        return localStorage.getItem(MTOS_SELECTED_TARGET_KEY) || ""
    }catch(e){
        return ""
    }
}

function setSelectedDecisionTarget(name){
    try{
        if(!name){
            localStorage.removeItem(MTOS_SELECTED_TARGET_KEY)
            return
        }
        localStorage.setItem(MTOS_SELECTED_TARGET_KEY, String(name))
    }catch(e){}
}

window.getSelectedDecisionTarget = getSelectedDecisionTarget
window.setSelectedDecisionTarget = setSelectedDecisionTarget

function renderDecisionTargetsPanel(){
    const root = document.getElementById("mtosTargetsPanel")
    if (!root) return

    const targets =
        window.MTOS_STATE?.decision?.targets && typeof window.MTOS_STATE.decision.targets === "object"
            ? window.MTOS_STATE.decision.targets
            : resolveDecisionTargetsLocal()

    const currentName = window.getCurrentUserName ? window.getCurrentUserName() : ""
    const selectedName = getSelectedDecisionTarget()

        const allAgents = Array.isArray(window.currentUsers)
        ? window.currentUsers
            .map(u => ({
                name: String(u?.name || "").trim(),
                kin: Number(u?.kin || 0)
            }))
            .filter(u => u.name && u.name !== currentName)
            .sort((a, b) => a.name.localeCompare(b.name, "ru"))
        : []

    const currentTargetsFlat = [
        ...(Array.isArray(targets.primary) ? targets.primary : []),
        ...(Array.isArray(targets.neutral) ? targets.neutral : []),
        ...(Array.isArray(targets.avoid) ? targets.avoid : [])
    ]

    const targetMap = new Map(
        currentTargetsFlat.map(item => [item.name, item])
    )

    const allAgentsList = allAgents.map(agent => {
        const found = targetMap.get(agent.name)

        return {
            name: agent.name,
            kin: agent.kin,
            score: Number(found?.score ?? 0),
            label: String(found?.label || t("inNetwork")),
            isTodayRealContact: typeof window.isTodayContact === "function"
                ? window.isTodayContact(currentName, agent.name)
                : false,
            isSelected: agent.name === selectedName
        }
    })

    const renderList = (items, color, emptyText, groupName) => {
        if (!Array.isArray(items) || !items.length) {
            return `<div style="color:#94a3b8;font-size:13px;">${emptyText}</div>`
        }

        return items.map((item) => {
            const isSelected = item.name === selectedName

            return `
                <div style="
                    padding:10px 12px;
                    border-radius:14px;
                    background:${isSelected ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)"};
                    border:1px solid ${isSelected ? "rgba(0,255,136,0.24)" : "rgba(255,255,255,0.07)"};
                    margin-bottom:8px;
                    box-shadow:${isSelected ? "0 0 0 1px rgba(0,255,136,0.08) inset" : "none"};
                ">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                        <div>
                            <div style="font-size:15px;font-weight:700;color:${color};">
                                ${item.name}
                            </div>
                            ${isSelected ? `
                                <div style="font-size:11px;color:#00ff88;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">
                                    ${t("selectedTargetBadge")}
                                </div>
                            ` : ""}
                        </div>

                        <div style="display:flex;align-items:center;gap:8px;">
                            ${
                                groupName === "avoid"
                                    ? ""
                                    : `
                                <button
                                    type="button"
                                    class="mtos-select-target-btn"
                                    data-target-name="${String(item.name).replace(/"/g, "&quot;")}"
                                    style="
                                        padding:6px 10px;
                                        border-radius:10px;
                                        border:1px solid ${isSelected ? "rgba(0,255,136,0.35)" : "rgba(255,255,255,0.10)"};
                                        background:${isSelected ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.05)"};
                                        color:${isSelected ? "#00ff88" : "#f8fafc"};
                                        cursor:pointer;
                                        font-size:12px;
                                        font-weight:700;
                                    "
                                >${isSelected ? t("selected") : t("select")}</button>

                                <button
                                    type="button"
                                    class="mtos-contact-btn"
                                    data-contact-name="${String(item.name).replace(/"/g, "&quot;")}"
                                    data-current-name="${String(currentName).replace(/"/g, "&quot;")}"
                                    style="
                                        padding:6px 10px;
                                        border-radius:10px;
                                        border:1px solid ${item.isTodayRealContact ? "rgba(0,255,136,0.35)" : "rgba(255,255,255,0.10)"};
                                        background:${item.isTodayRealContact ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.05)"};
                                        color:${item.isTodayRealContact ? "#00ff88" : "#f8fafc"};
                                        cursor:pointer;
                                        font-size:12px;
                                        font-weight:700;
                                    "
                                >${item.isTodayRealContact ? t("unmark") : t("contact")}</button>
                            `
                            }
                        </div>
                    </div>

                    <div style="font-size:12px;color:#cbd5e1;margin-top:6px;">
                        ${translateRelationLabel(item.label)} • ${t("scoreWord")} ${Number(item.score ?? 0).toFixed(2)}
                        ${item.isTodayRealContact ? ` • ${t("realContactWord")}` : ""}
                    </div>
                </div>
            `
        }).join("")
    }

        const renderAllAgentsList = (items) => {
        if (!Array.isArray(items) || !items.length) {
            return `<div style="color:#94a3b8;font-size:13px;">${t("noAgentsFound")}</div>`
        }

        return `
            <div style="
                display:grid;
                grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));
                gap:10px;
            ">
                ${items.map((item) => `
                    <div style="
                        padding:10px 12px;
                        border-radius:14px;
                        background:${item.isSelected ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)"};
                        border:1px solid ${item.isSelected ? "rgba(0,255,136,0.24)" : "rgba(255,255,255,0.07)"};
                        box-shadow:${item.isSelected ? "0 0 0 1px rgba(0,255,136,0.08) inset" : "none"};
                    ">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
                            <div>
                                <div style="font-size:15px;font-weight:700;color:#e5e7eb;">
                                    ${item.name}
                                </div>
                                <div style="font-size:12px;color:#94a3b8;margin-top:4px;">
                                    ${t("kinWord")} ${Number(item.kin || 0)}
${item.label ? ` • ${translateRelationLabel(item.label)}` : ""}
${Number.isFinite(item.score) ? ` • ${t("scoreWord")} ${item.score.toFixed(2)}` : ""}
${item.isTodayRealContact ? ` • ${t("realContactWord")}` : ""}
                                </div>
                            </div>

                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
                                <button
                                    type="button"
                                    class="mtos-select-target-btn"
                                    data-target-name="${String(item.name).replace(/"/g, "&quot;")}"
                                    style="
                                        padding:6px 10px;
                                        border-radius:10px;
                                        border:1px solid ${item.isSelected ? "rgba(0,255,136,0.35)" : "rgba(255,255,255,0.10)"};
                                        background:${item.isSelected ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.05)"};
                                        color:${item.isSelected ? "#00ff88" : "#f8fafc"};
                                        cursor:pointer;
                                        font-size:12px;
                                        font-weight:700;
                                    "
                                >${item.isSelected ? t("selected") : t("select")}</button>

                                <button
                                    type="button"
                                    class="mtos-contact-btn"
                                    data-contact-name="${String(item.name).replace(/"/g, "&quot;")}"
                                    data-current-name="${String(currentName).replace(/"/g, "&quot;")}"
                                    style="
                                        padding:6px 10px;
                                        border-radius:10px;
                                        border:1px solid ${item.isTodayRealContact ? "rgba(0,255,136,0.35)" : "rgba(255,255,255,0.10)"};
                                        background:${item.isTodayRealContact ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.05)"};
                                        color:${item.isTodayRealContact ? "#00ff88" : "#f8fafc"};
                                        cursor:pointer;
                                        font-size:12px;
                                        font-weight:700;
                                    "
                                >${item.isTodayRealContact ? t("unmark") : t("contact")}</button>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `
    }

    root.innerHTML = `
        <div style="
            max-width:860px;
            margin:0 auto;
            padding:18px;
            border:1px solid rgba(255,255,255,0.10);
            border-radius:20px;
            background:
                radial-gradient(circle at 12% 100%, rgba(0,255,136,0.08), transparent 25%),
                radial-gradient(circle at 88% 100%, rgba(255,210,80,0.06), transparent 22%),
                linear-gradient(180deg, rgba(8,10,14,0.98) 0%, rgba(4,6,9,1) 100%);
            color:#f8fafc;
            text-align:left;
        ">
            <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b949e;margin-bottom:12px;">
                ${t("decisionTargets")}
            </div>

            <div style="font-size:13px;color:#cbd5e1;margin-bottom:14px;">
                ${t("chooseOneTarget")}
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));
                gap:14px;
            ">
                <div>
                    <div style="font-size:13px;font-weight:700;color:#00ff88;margin-bottom:10px;">${t("bestContactNow")}</div>
                    ${renderList(targets.primary, "#00ff88", `${t("noPrimaryTargets")}`, "primary")}
                </div>

                <div>
                    <div style="font-size:13px;font-weight:700;color:#ffb347;margin-bottom:10px;">${t("possibleContacts")}</div>
                    ${renderList(targets.neutral, "#ffb347", `${t("noNeutralTargets")}`, "neutral")}
                </div>

                <div>
                    <div style="font-size:13px;font-weight:700;color:#ff6666;margin-bottom:10px;">${t("avoidToday")}</div>
                    ${renderList(targets.avoid, "#ff6666", `${t("noAvoidTargets")}`, "avoid")}
                </div>
            </div>

            <div style="margin-top:18px;">
                <div style="font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:10px;">
                    ${t("allAgents")}
                </div>
                ${renderAllAgentsList(allAgentsList)}
            </div>
        </div>
    `

    root.querySelectorAll(".mtos-select-target-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const targetName = btn.dataset.targetName || ""
        if (!targetName) return

        setSelectedDecisionTarget(targetName)

        const currentTargets =
            window.MTOS_STATE?.decision?.targets ||
            resolveDecisionTargetsLocal()

        const allTargets = [
            ...(Array.isArray(currentTargets.primary) ? currentTargets.primary : []),
            ...(Array.isArray(currentTargets.neutral) ? currentTargets.neutral : []),
            ...(Array.isArray(currentTargets.avoid) ? currentTargets.avoid : [])
        ]

        const selectedTarget =
    allTargets.find(x => x.name === targetName) || {
        name: targetName,
        score: 0,
        label: "manual target"
    }

        window.updateMTOSBranch("decision", {
            ...(window.MTOS_STATE?.decision || {}),
            targets: currentTargets,
            selectedTarget
        })

        renderDecisionSummaryPanel("humanLayer")
        renderSystemDecisionPanel()
        renderDecisionTargetsPanel()
        renderActionTracePanel()
    })
})

    root.querySelectorAll(".mtos-contact-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const a = btn.dataset.currentName || (window.getCurrentUserName ? window.getCurrentUserName() : "")
        const b = btn.dataset.contactName || ""
        const actionText = String(btn.textContent || "").trim().toLowerCase()
        const isMarked = actionText === "marked" || actionText === "unmark"

        if (!a || !b || a === b) return

        const currentTargets =
            window.MTOS_STATE?.decision?.targets ||
            resolveDecisionTargetsLocal()

        const allTargets = [
            ...(Array.isArray(currentTargets.primary) ? currentTargets.primary : []),
            ...(Array.isArray(currentTargets.neutral) ? currentTargets.neutral : []),
            ...(Array.isArray(currentTargets.avoid) ? currentTargets.avoid : [])
        ]

        const selectedTarget =
            allTargets.find(x => x.name === b) || {
                name: b,
                score: 0,
                label: t("realContact")
            }

        setSelectedDecisionTarget(b)

        window.updateMTOSBranch("decision", {
            ...(window.MTOS_STATE?.decision || {}),
            targets: currentTargets,
            selectedTarget
        })

        if (isMarked) {
            if (typeof window.unmarkTodayContact === "function") {
                window.unmarkTodayContact(a, b)
            }
        } else {
            if (typeof window.markTodayContact === "function") {
                window.markTodayContact(a, b)
            }
        }

        renderDecisionSummaryPanel("humanLayer")
        renderSystemDecisionPanel()
        renderDecisionTargetsPanel()
        renderActionTracePanel()
    })
})
}

function renderFieldTensionPanel(){
    const root = document.getElementById("mtosTensionPanel")
    if (!root) return

    const ds = window.mtosDayState || {}
    const tp = window.mtosTimePressureSummary || {}
    const metabolic = window.mtosMetabolicMetrics || {}
    const collective = window.mtosCollectiveState || {}

    const pressure = Number(tp.value ?? ds.pressure ?? 0)
    const stability = Number(ds.stability ?? collective.stability ?? 0.5)
    const phi = Number(metabolic.phi ?? collective.phi ?? 0)
    const k = Number(metabolic.k ?? collective.k ?? 0)
    const consistency = Number(metabolic.consistency ?? collective.consistency ?? 0)
    const temp = Number(metabolic.T ?? collective.temperature ?? 0.5)

    const tensionLevel =
        pressure >= 0.75 ? t("highTension") :
        pressure >= 0.45 ? t("mediumTension") : t("lowTension")

    const gradientText =
        consistency >= 0.22 ? t("uneven") :
        consistency >= 0.10 ? t("mixed") : t("stable")

    const toneColor =
        pressure >= 0.75 ? "#ff6666" :
        pressure >= 0.45 ? "#ffb347" : "#00ff88"

    root.innerHTML = `
        <div style="
            max-width:860px;
            margin:0 auto;
            padding:18px;
            border:1px solid rgba(255,255,255,0.10);
            border-radius:20px;
            background:
                radial-gradient(circle at 12% 100%, rgba(0,255,136,0.08), transparent 25%),
                radial-gradient(circle at 88% 100%, rgba(255,210,80,0.06), transparent 22%),
                linear-gradient(180deg, rgba(8,10,14,0.98) 0%, rgba(4,6,9,1) 100%);
            color:#f8fafc;
            text-align:left;
        ">
            <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b949e;margin-bottom:12px;">
                ${t("fieldTension")}
            </div>

            <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:14px;">
                <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:10px;color:#8b949e;letter-spacing:0.12em;text-transform:uppercase;">${t("pressure")}</div>
                    <div style="margin-top:4px;font-size:18px;font-weight:700;color:${toneColor};">${pressure.toFixed(2)}</div>
                </div>
                <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:10px;color:#8b949e;letter-spacing:0.12em;text-transform:uppercase;">${t("stability")}</div>
                    <div style="margin-top:4px;font-size:18px;font-weight:700;">${stability.toFixed(2)}</div>
                </div>
                <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:10px;color:#8b949e;letter-spacing:0.12em;text-transform:uppercase;">Φ</div>
                    <div style="margin-top:4px;font-size:18px;font-weight:700;">${phi.toFixed(3)}</div>
                </div>
                <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:10px;color:#8b949e;letter-spacing:0.12em;text-transform:uppercase;">k</div>
                    <div style="margin-top:4px;font-size:18px;font-weight:700;">${k.toFixed(3)}</div>
                </div>
                <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:10px;color:#8b949e;letter-spacing:0.12em;text-transform:uppercase;">T</div>
                    <div style="margin-top:4px;font-size:18px;font-weight:700;">${temp.toFixed(2)}</div>
                </div>
                <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
                    <div style="font-size:10px;color:#8b949e;letter-spacing:0.12em;text-transform:uppercase;">${t("consistency")}</div>
                    <div style="margin-top:4px;font-size:18px;font-weight:700;">${consistency.toFixed(3)}</div>
                </div>
            </div>

            <div style="font-size:15px;font-weight:700;color:${toneColor};">
    ${tensionLevel} ${t("tensionWord")}
</div>
<div style="font-size:13px;line-height:1.7;color:#cbd5e1;margin-top:8px;">
    ${t("gradient")}: <b>${gradientText}</b><br>
    ${t("temporalModeLabel")}: <b>${translateModeLabel(tp.temporalMode || "EXPLORE")}</b><br>
    ${t("interpretation")}: ${
        pressure >= 0.75
            ? t("fieldCompressed")
            : pressure >= 0.45
            ? t("fieldActive")
            : t("fieldOpen")
    }
</div>
        </div>
    `
}

function renderActionTracePanel(){
    const root = document.getElementById("mtosTracePanel")
    if (!root) return

const decision = window.MTOS_STATE?.decision || window.mtosDecision || {}
const mode = String(decision.mode || "EXPLORE").toUpperCase()
const ds = window.mtosDayState || {}
const net = window.mtosNetworkFeedback || {}
const tp = window.mtosTimePressureSummary || {}
const targets = window.MTOS_STATE?.decision?.targets || { primary: [], avoid: [], neutral: [] }
const selectedTarget = window.MTOS_STATE?.decision?.selectedTarget || null

    let title = `${t("ifModePrefix")} ${translateModeLabel(mode)}`
    let lines = []
    let confidence = "medium"

    if (mode === "INTERACT") {
    title = selectedTarget
        ? `${t("ifContactPrefix")} ${selectedTarget.name}:`
        : t("ifChoosePrimary")

        if (selectedTarget) {
    lines = [
    `${selectedTarget.name} → ${translateRelationLabel(selectedTarget.label)}`,
    Number(selectedTarget.score ?? 0) >= 0.75
        ? t("veryStrongAlignmentToday")
        : t("supportiveNeedsCleanTiming"),
    Number(tp.value ?? 0) >= 0.6
        ? t("keepInteractionShort")
        : t("oneDirectContactBetter")
]
} else {
    const primaryNames = Array.isArray(targets.primary)
        ? targets.primary.map(x => x.name).slice(0, 3)
        : []

    if (primaryNames.length) {
        lines = primaryNames.map((name, i) => {
            if (i === 0) return `${name} → ${t("strongestAlignment")}`
if (i === 1) return `${name} → ${t("stableExpansion")}`
return `${name} → ${t("safeReinforcement")}`
        })
    } else {
        lines = [
    `${t("networkMayExpand")} (${Number(net.supportRatio ?? 0).toFixed(2)})`,
    Number(ds.stability ?? 0.5) < 0.5
        ? t("stabilityMayDipReactive")
        : t("constructiveAlignmentLikely"),
    Number(tp.value ?? 0) >= 0.6
        ? t("parallelContactsOverload")
        : t("oneDirectContactFavored")
]
    }
}

        confidence = Number(tp.value ?? 0) >= 0.6 ? "medium" : "good"
    } else if (mode === "FOCUS") {
        lines = [
    t("focusNarrowExecution"),
    t("focusNetworkCompress"),
    t("focusBranchesReduce")
]
        confidence = "good"
    }
    else if (mode === "ADJUST") {
    lines = [
    t("adjustFixationRising"),
    t("adjustReopenAlternative"),
    t("adjustSmallCorrection")
]
    confidence = "good"

    } else if (mode === "REST") {
        lines = [
    t("restPressureDecrease"),
    t("restOpportunitiesRemain"),
    t("restMaintenanceBest")
]
        confidence = "good"
    } else {
        lines = [
    t("exploreSignalsDiversify"),
    t("exploreUsefulPaths"),
    t("exploreTooManyExperiments")
]
        confidence = "medium"
    }

    root.innerHTML = `
        <div style="
            max-width:860px;
            margin:0 auto;
            padding:18px;
            border:1px solid rgba(255,255,255,0.10);
            border-radius:20px;
            background:
                radial-gradient(circle at 12% 100%, rgba(0,255,136,0.08), transparent 25%),
                radial-gradient(circle at 88% 100%, rgba(255,210,80,0.06), transparent 22%),
                linear-gradient(180deg, rgba(8,10,14,0.98) 0%, rgba(4,6,9,1) 100%);
            color:#f8fafc;
            text-align:left;
        ">
            <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b949e;margin-bottom:12px;">
                ${t("actionTrace")}
            </div>

            <div style="font-size:20px;font-weight:800;color:#00ff88;line-height:1.15;margin-bottom:10px;">
                ${title}
            </div>

            <div style="display:grid;gap:8px;">
                ${lines.map(line => `
                    <div style="
                        padding:10px 12px;
                        border-radius:14px;
                        background:rgba(255,255,255,0.03);
                        border:1px solid rgba(255,255,255,0.07);
                        font-size:14px;
                        line-height:1.6;
                        color:#e5e7eb;
                    ">→ ${line}</div>
                `).join("")}
            </div>

            <div style="font-size:13px;color:#9ca3af;margin-top:12px;">
                ${t("confidence")}: ${confidence}
            </div>
        </div>
    `
}

function renderHistoryEfficiencyPanel(targetId = "historyEfficiencyPanel"){
    const historyModeLabel = (mode) => {
        const m = String(mode || "").toUpperCase()

        if (m === "FOCUS") return t("modeFocus")
        if (m === "FLOW") return t("modeExplore")
        if (m === "EXPLORE") return t("modeExplore")
        if (m === "REST") return t("modeRest")
        if (m === "INTERACT") return t("modeInteract")
        if (m === "ADJUST") return t("modeAdjust")
        if (m === "UNKNOWN") return t("unknownWord")

        return m
    }

    const root = document.getElementById(targetId)
    if (!root) return

    const name = getCurrentUserName()
    if (!name) {
        root.innerHTML = ""
        return
    }

    let rows = []
    try {
        rows = JSON.parse(localStorage.getItem("mtos_daily_snapshots") || "[]")
            .filter(x => x && x.name === name)
            .sort((a, b) => String(b.day || "").localeCompare(String(a.day || "")))
    } catch (e) {
        rows = []
    }

    if (!rows.length) {
        root.innerHTML = `
            <div style="
                max-width:980px;
                margin:0 auto;
                padding:18px;
                border:1px solid rgba(255,255,255,0.08);
                border-radius:20px;
                background:rgba(255,255,255,0.03);
                color:#cbd5e1;
                text-align:left;
            ">
                <div style="font-size:14px;color:#94a3b8;">
                    ${t("noHistoryYet")}
                </div>
            </div>
        `
        return
    }

    const total = rows.length
    const good = rows.filter(x => String(x.feedbackValue || "").toLowerCase() === "good").length
    const neutral = rows.filter(x => String(x.feedbackValue || "").toLowerCase() === "neutral").length
    const bad = rows.filter(x => String(x.feedbackValue || "").toLowerCase() === "bad").length

    const hitRate = total ? ((good / total) * 100).toFixed(1) : "0.0"
    const antiFailRate = total ? (((good + neutral) / total) * 100).toFixed(1) : "0.0"

    const avgPredictability = total
    ? (
        rows.reduce((sum, row) => sum + Number(row.systemPredictability ?? row.predictability ?? 0), 0) / total
    ).toFixed(1)
    : "0.0"

    const avgTimePressure = total
        ? (
            rows.reduce((sum, row) => sum + Number(row.timePressure ?? 0), 0) / total
        ).toFixed(2)
        : "0.00"

    const modeStats = calcModeStats(rows)

    const dayTypeStatsMap = {}
    rows.forEach(row => {
        const label = String(row.dayLabel || "UNKNOWN").toUpperCase()

        if (!dayTypeStatsMap[label]) {
            dayTypeStatsMap[label] = {
                label,
                total: 0,
                good: 0,
                neutral: 0,
                bad: 0,
                score: 0
            }
        }

        dayTypeStatsMap[label].total += 1

        const fb = String(row.feedbackValue || "").toLowerCase()

        if (fb === "good") dayTypeStatsMap[label].good += 1
        else if (fb === "bad") dayTypeStatsMap[label].bad += 1
        else dayTypeStatsMap[label].neutral += 1
    })

    const dayTypeStats = Object.values(dayTypeStatsMap)
    dayTypeStats.forEach(item => {
        item.score = item.total
            ? Number((
                (item.good * 1.0 + item.neutral * 0.15 - item.bad * 1.2) / item.total
            ).toFixed(3))
            : 0
    })

    dayTypeStats.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.total - a.total
    })

    const recentRows = rows.slice(0, 7)

    root.innerHTML = `
        <div style="
            max-width:980px;
            margin:0 auto;
            padding:22px;
            border:1px solid rgba(255,255,255,0.10);
            border-radius:28px;
            background:
                radial-gradient(circle at 12% 100%, rgba(0,255,136,0.07), transparent 25%),
                radial-gradient(circle at 88% 100%, rgba(255,210,80,0.06), transparent 22%),
                linear-gradient(180deg, rgba(8,10,14,0.98) 0%, rgba(4,6,9,1) 100%);
            color:#f8fafc;
            box-sizing:border-box;
            text-align:left;
        ">
            <div style="
                display:grid;
                grid-template-columns:repeat(6, minmax(0,1fr));
                gap:12px;
                margin-bottom:16px;
            ">
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${t("days")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;">${total}</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${t("good")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#00ff88;">${good}</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${t("bad")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#ff6666;">${bad}</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${t("hit_rate")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#66ccff;">${hitRate}%</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${t("antiFail")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#c084fc;">${antiFailRate}%</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${t("avgPredictability")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#f8fafc;">${avgPredictability}</div>
                </div>
            </div>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:14px;
                margin-bottom:14px;
            ">
                <div style="padding:16px;border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:10px;">${t("modeEfficiency")}</div>
                    ${modeStats.map(item => `
                        <div style="
                            display:grid;
                            grid-template-columns:1fr auto auto auto;
                            gap:12px;
                            padding:8px 0;
                            border-bottom:1px solid rgba(255,255,255,0.05);
                            font-size:13px;
                            color:#e5e7eb;
                        ">
                            <div><b>${historyModeLabel(item.mode)}</b></div>
                            <div>${item.good}/${item.neutral}/${item.bad}</div>
                            <div>${item.total}</div>
                            <div style="color:${item.score >= 0 ? "#00ff88" : "#ff6666"};">${item.score.toFixed(2)}</div>
                        </div>
                    `).join("")}
                </div>

                <div style="padding:16px;border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:10px;">${t("dayTypeEfficiency")}</div>
                    ${dayTypeStats.map(item => `
                        <div style="
                            display:grid;
                            grid-template-columns:1fr auto auto auto;
                            gap:12px;
                            padding:8px 0;
                            border-bottom:1px solid rgba(255,255,255,0.05);
                            font-size:13px;
                            color:#e5e7eb;
                        ">
                            <div><b>${historyModeLabel(item.label)}</b></div>
                            <div>${item.good}/${item.neutral}/${item.bad}</div>
                            <div>${item.total}</div>
                            <div style="color:${item.score >= 0 ? "#00ff88" : "#ff6666"};">${item.score.toFixed(2)}</div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div style="
                padding:16px;
                border-radius:20px;
                background:rgba(255,255,255,0.03);
                border:1px solid rgba(255,255,255,0.08);
            ">
                <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:10px;">${t("recentDays")}</div>

                ${recentRows.map(row => `
                    <div style="
                        padding:10px 12px;
                        margin-bottom:8px;
                        border-radius:14px;
                        background:rgba(0,0,0,0.18);
                        border:1px solid rgba(255,255,255,0.06);
                    ">
                        <div style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            gap:12px;
                            flex-wrap:wrap;
                        ">
                            <div style="font-size:13px;font-weight:700;color:#fff;">${row.day}</div>
                            <div style="font-size:12px;color:#9ca3af;">
    ${historyModeLabel(row.decisionMode || row.recommendedMode || "UNKNOWN")} · ${t("systemWord")} ${Number(row.systemPredictability ?? row.predictability ?? 0).toFixed(0)} · ${t("behaviorWord")} ${Number(row.behaviorEfficiency ?? 0).toFixed(2)}
</div>
                        </div>

                        <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">
    ${historyModeLabel(row.decisionMode || row.recommendedMode || "UNKNOWN")} · ${translateRiskLabel(row.decisionRisk || "LOW")} · ${row.feedbackValue ? String(row.feedbackValue).toUpperCase() : t("unknownWord")}
</div>

                        <div style="font-size:12px;color:${
                            row.feedbackValue === "good" ? "#00ff88" :
                            row.feedbackValue === "bad" ? "#ff6666" : "#d1d5db"
                        };margin-top:4px;">
                            ${row.feedbackValue ? String(row.feedbackValue).toUpperCase() : t("no_feedback")}
                        </div>
                    </div>
                `).join("")}

                <div style="margin-top:10px;font-size:12px;color:#94a3b8;">
                    ${t("averageTimePressure")}: <b style="color:#e5e7eb;">${avgTimePressure}</b>
                </div>
            </div>
        </div>
    `
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
                window._date.day
            )
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
                window._date.day
            )
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

    window.setNetworkMode = (mode) => {

    if (mode === "edit") {
        window.networkMode = "edit"
    } else if (mode === "link") {
        window.networkMode = "link"
    } else if (mode === "contact") {
        window.networkMode = "contact"
    } else {
        window.networkMode = "interaction"
    }

    const btnEdit = document.getElementById("modeEdit")
    const btnLink = document.getElementById("modeLink")
    const btnContact = document.getElementById("modeContact")

    if (btnEdit) {
        const isEdit = window.networkMode === "edit"
        btnEdit.style.background = isEdit ? "#00ff88" : "#111"
        btnEdit.style.color = isEdit ? "#000" : "#fff"
    }

    if (btnLink) {
        const isLink = window.networkMode === "link"
        btnLink.style.background = isLink ? "#66ccff" : "#111"
        btnLink.style.color = isLink ? "#000" : "#fff"
    }

    if (btnContact) {
        const isContact = window.networkMode === "contact"
        btnContact.style.background = isContact ? "#ffd166" : "#111"
        btnContact.style.color = isContact ? "#111" : "#fff"
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
            window._date.day
        )
    }
}

window.networkRelationFilter = window.networkRelationFilter || "all"

window.setNetworkRelationFilter = (filter) => {
    window.networkRelationFilter = filter || "all"

    if (window._rerenderMTOS) {
        window._rerenderMTOS()
    }
}

window.networkRelationFilter = window.networkRelationFilter || "all"

window.setNetworkRelationFilter = (filter) => {
    window.networkRelationFilter = filter || "all"

    const ids = [
        "relFilterAll",
        "relFilterStrongSupport",
        "relFilterWeakSupport",
        "relFilterNeutral",
        "relFilterTension",
        "relFilterConflict",
        "relFilterStrongConflict",
        "relFilterContact"
    ]

    ids.forEach(id => {
        const btn = document.getElementById(id)
        if (!btn) return

        btn.style.background = "rgba(255,255,255,0.04)"
        btn.style.color = "#e5e7eb"
        btn.style.borderColor = "rgba(255,255,255,0.12)"
        btn.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)"
    })

    const activeMap = {
        all: "relFilterAll",
        strong_support: "relFilterStrongSupport",
        weak_support: "relFilterWeakSupport",
        neutral: "relFilterNeutral",
        tension: "relFilterTension",
        conflict: "relFilterConflict",
        strong_conflict: "relFilterStrongConflict",
        contact: "relFilterContact"
    }

    const active = document.getElementById(activeMap[window.networkRelationFilter])
    if (active) {
        active.style.background = "linear-gradient(90deg, rgba(0,255,136,0.90), rgba(110,255,190,0.86))"
        active.style.color = "#04110d"
        active.style.borderColor = "transparent"
        active.style.boxShadow = "0 0 20px rgba(0,255,136,0.20)"
    }

    if (window._rerenderMTOS) {
        window._rerenderMTOS()
    }
}

window.setNetworkRelationFilter = (filter) => {
    window.networkRelationFilter = filter || "all"

    const ids = [
        "relFilterAll",
        "relFilterStrongSupport",
        "relFilterWeakSupport",
        "relFilterNeutral",
        "relFilterTension",
        "relFilterConflict",
        "relFilterStrongConflict",
        "relFilterContact"
    ]

    ids.forEach(id => {
        const btn = document.getElementById(id)
        if (!btn) return

        btn.style.background = "rgba(255,255,255,0.04)"
        btn.style.color = "#e5e7eb"
        btn.style.borderColor = "rgba(255,255,255,0.12)"
        btn.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)"
    })

    const activeMap = {
        all: "relFilterAll",
        strong_support: "relFilterStrongSupport",
        weak_support: "relFilterWeakSupport",
        neutral: "relFilterNeutral",
        tension: "relFilterTension",
        conflict: "relFilterConflict",
        strong_conflict: "relFilterStrongConflict",
        contact: "relFilterContact"
    }

    const active = document.getElementById(activeMap[window.networkRelationFilter])
    if (active) {
        active.style.background = "linear-gradient(90deg, rgba(0,255,136,0.90), rgba(110,255,190,0.86))"
        active.style.color = "#04110d"
        active.style.borderColor = "transparent"
        active.style.boxShadow = "0 0 20px rgba(0,255,136,0.20)"
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
            window._date.day
        )
    }
}

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

        for (const u of (users || [])) {
            if (!u || !Number.isFinite(Number(u.kin))) continue

            const uSeal = (Number(u.kin) - 1) % 20
            if (uSeal !== colSeal) continue
            if (u.name === userName) continue

            const key1 = `${userName}->${u.name}`
            const key2 = `${u.name}->${userName}`

            const s1 = Number(relationMemory[key1] ?? 0)
const s2 = Number(relationMemory[key2] ?? 0)
const rel = (s1 + s2) / 2

const userObj = (users || []).find(x => x.name === userName) || null
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

    const activeKin = selectedKin || window._userKin
    if (!activeKin) {
        mapEl.innerHTML = ""
        panelEl.innerHTML = ""
        return
    }

    let matrix = buildTodayInfluenceMatrix(activeKin, users)

    if (typeof applyTodayContactsToAttractorField === "function") {
        matrix = applyTodayContactsToAttractorField(matrix, users)
    }

    window._matrix = matrix

    mapEl.style.display = ""
    mapEl.innerHTML = ""

    drawAttractorMap("attractorMap", matrix, {
        size: 20,
        labels: window.SEALS || null,
        meanings: window.SEAL_MEANING || null,
        selectedSeal: ((Number(activeKin) - 1) % 20 + 20) % 20
    })

    panelEl.innerHTML = ""
}

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

        const now = Date.now()
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

    const MODE_ADAPT_KEY = "mtos_mode_adaptation"

    function loadModeAdaptation() {
        try {
            const raw = localStorage.getItem(MODE_ADAPT_KEY)
            const parsed = raw ? JSON.parse(raw) : null

            if (parsed && typeof parsed === "object") {
                return {
                    focusBias: Number(parsed.focusBias ?? 0),
                    restBias: Number(parsed.restBias ?? 0),
                    exploreBias: Number(parsed.exploreBias ?? 0),
                    interactBias: Number(parsed.interactBias ?? 0),
                    history: Array.isArray(parsed.history) ? parsed.history : []
                }
            }
        } catch (e) {
            console.warn("Mode adaptation load failed", e)
        }

        return {
    focusBias: 0,
    adjustBias: 0,
    restBias: 0,
    exploreBias: 0,
    interactBias: 0,
    history: []
}
    }

    function saveModeAdaptation(state) {
        try {
            localStorage.setItem(MODE_ADAPT_KEY, JSON.stringify(state))
        } catch (e) {
            console.warn("Mode adaptation save failed", e)
        }
    }

    function clampBias(v) {
        return Math.max(-0.25, Math.min(0.25, Number(v) || 0))
    }

    function getAdaptiveRecommendedMode(ds) {
        const adapt = loadModeAdaptation()
        const attractor = Number(ds.attractorField ?? 0.5)

                const scores = {
            REST:
                (ds.pressure * 0.9) +
                ((1 - ds.stability) * 0.8) +
                (ds.conflict * 0.2) +
                adapt.restBias,

            INTERACT:
                (ds.conflict * 0.95) +
                (ds.field * 0.35) +
                (attractor * 0.15) +
                adapt.interactBias,

            FOCUS:
                (ds.attention * 0.9) +
                (ds.stability * 0.7) +
                (attractor * 0.45) -
                (ds.pressure * 0.45) -
                (ds.conflict * 0.25) +
                adapt.focusBias,

            ADJUST:
                (ds.attention * 0.55) +
                (ds.stability * 0.35) +
                (ds.pressure * 0.22) +
                (Math.abs(ds.field - 0.58) < 0.18 ? 0.12 : 0) +
                adapt.adjustBias,

            EXPLORE:
                (ds.field * 0.7) +
                (attractor * 0.65) +
                ((1 - Math.abs(ds.attention - 0.58)) * 0.25) -
                (ds.pressure * 0.2) +
                adapt.exploreBias
        }

        const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
        const mode = ranked[0][0]

        return {
            mode,
            scores,
            adaptation: adapt
        }
    }

    function registerModeFeedback(mode, wasHelpful, ds) {
        const adapt = loadModeAdaptation()

        const delta = wasHelpful ? 0.025 : -0.025

        if (mode === "FOCUS") adapt.focusBias = clampBias(adapt.focusBias + delta)
        if (mode === "ADJUST") adapt.adjustBias = clampBias(adapt.adjustBias + delta)
        if (mode === "REST") adapt.restBias = clampBias(adapt.restBias + delta)
        if (mode === "EXPLORE") adapt.exploreBias = clampBias(adapt.exploreBias + delta)
        if (mode === "INTERACT") adapt.interactBias = clampBias(adapt.interactBias + delta)

        adapt.history.push({
            t: Date.now(),
            mode,
            wasHelpful: !!wasHelpful,
            attention: Number(ds?.attention ?? 0.5),
            activity: Number(ds?.activity ?? 0.5),
            pressure: Number(ds?.pressure ?? 0),
            conflict: Number(ds?.conflict ?? 0),
            field: Number(ds?.field ?? 0.5),
            stability: Number(ds?.stability ?? 0.5),
            attractorField: Number(ds?.attractorField ?? 0.5)
        })

        if (adapt.history.length > 300) {
            adapt.history.shift()
        }

        saveModeAdaptation(adapt)
        window.mtosModeAdaptation = adapt

        logEvent("mode_feedback", {
    mode,
    wasHelpful: !!wasHelpful,
    focusBias: adapt.focusBias,
    adjustBias: adapt.adjustBias,
    restBias: adapt.restBias,
    exploreBias: adapt.exploreBias,
    interactBias: adapt.interactBias
})
    }

    window.registerModeFeedback = function (wasHelpful) {
        const ds = window.mtosDayState || null
        const adaptive = window.mtosAdaptiveMode || null
        const mode = adaptive?.mode || getRecommendedMode(ds || {})

        registerModeFeedback(mode, wasHelpful, ds)

        if (window._weather) {
            renderAll(
                window._weather,
                window._weatherToday,
                window._pressure,
                window._userKin,
                window._todayKin,
                window._date.year,
                window._date.month,
                window._date.day
            )
        }
    }

    const AUTO_MODE_FEEDBACK_KEY = "mtos_auto_mode_feedback"

    function loadAutoModeFeedbackState() {
        try {
            const raw = localStorage.getItem(AUTO_MODE_FEEDBACK_KEY)
            const parsed = raw ? JSON.parse(raw) : null
            if (parsed && typeof parsed === "object") {
                return parsed
            }
        } catch (e) {
            console.warn("Auto mode feedback load failed", e)
        }

        return {
            lastStamp: null,
            lastResult: null
        }
    }

    function saveAutoModeFeedbackState(state) {
        try {
            localStorage.setItem(AUTO_MODE_FEEDBACK_KEY, JSON.stringify(state))
        } catch (e) {
            console.warn("Auto mode feedback save failed", e)
        }
    }

    function getAutoModeStamp(name, mode) {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, "0")
        const d = String(now.getDate()).padStart(2, "0")
        return `${name || "anon"}_${y}-${m}-${d}_${mode}`
    }

    function inferAutomaticModeFeedback(mode, ds, metrics, truth) {
        const safeDs = ds || {}
        const safeMetrics = metrics || {}
        const safeTruth = truth || {}

        const attention = Number(safeDs.attention ?? 0.5)
        const pressure = Number(safeDs.pressure ?? 0)
        const conflict = Number(safeDs.conflict ?? 0)
        const field = Number(safeDs.field ?? 0.5)
        const stability = Number(safeDs.stability ?? 0.5)
        const attractor = Number(safeDs.attractorField ?? 0.5)

        const interactions = Number(safeMetrics.interactions ?? 0)
        const kinSelects = Number(safeMetrics.kinSelects ?? 0)
        const timeSteps = Number(safeMetrics.timeSteps ?? 0)

        if (mode === "FOCUS") {
            if (
                attention >= 0.52 &&
                pressure <= 0.50 &&
                stability >= 0.58 &&
                conflict <= 0.25 &&
                kinSelects <= 6 &&
                timeSteps <= 6
            ) {
                return {
                    wasHelpful: true,
                    reason: "focus conditions matched actual calm/stable usage"
                }
            }

            if (
                pressure >= 0.62 ||
                stability <= 0.40 ||
                safeTruth.chaotic ||
                kinSelects >= 10
            ) {
                return {
                    wasHelpful: false,
                    reason: "focus was contradicted by pressure/instability/excess switching"
                }
            }

            return null
        }

                if (mode === "ADJUST") {
            if (
                attention >= 0.56 &&
                pressure >= 0.42 &&
                pressure <= 0.68 &&
                stability >= 0.52 &&
                conflict <= 0.38 &&
                kinSelects >= 2 &&
                kinSelects <= 8
            ) {
                return {
                    wasHelpful: true,
                    reason: "adjust matched controlled correction under moderate pressure"
                }
            }

            if (
                pressure <= 0.28 &&
                stability >= 0.72 &&
                attention >= 0.72
            ) {
                return {
                    wasHelpful: false,
                    reason: "adjust was unnecessary in a clean stable focus state"
                }
            }

            if (
                pressure >= 0.78 ||
                stability <= 0.38 ||
                safeTruth.overload
            ) {
                return {
                    wasHelpful: false,
                    reason: "adjust was too weak for overload or unstable collapse"
                }
            }

            return null
        }

        if (mode === "REST") {
            if (
                pressure >= 0.58 ||
                stability <= 0.45 ||
                safeTruth.lowActivity ||
                safeTruth.overload
            ) {
                return {
                    wasHelpful: true,
                    reason: "rest matched overload or unstable recovery conditions"
                }
            }

            if (
                attention >= 0.65 &&
                pressure <= 0.35 &&
                stability >= 0.65
            ) {
                return {
                    wasHelpful: false,
                    reason: "rest was too passive for a stable productive state"
                }
            }

            return null
        }

        if (mode === "EXPLORE") {
            if (
                kinSelects >= 4 ||
                timeSteps >= 4 ||
                safeTruth.exploratory ||
                (field >= 0.58 && attractor >= 0.52)
            ) {
                return {
                    wasHelpful: true,
                    reason: "explore matched open search / navigation behavior"
                }
            }

            if (
                attention >= 0.72 &&
                stability >= 0.68 &&
                pressure <= 0.35
            ) {
                return {
                    wasHelpful: false,
                    reason: "explore was weaker than a clear focus state"
                }
            }

            return null
        }

        if (mode === "INTERACT") {
            if (
                interactions >= 6 ||
                conflict >= 0.35
            ) {
                return {
                    wasHelpful: true,
                    reason: "interact matched social/conflict-driven activity"
                }
            }

            if (
                interactions <= 1 &&
                conflict <= 0.15 &&
                attention >= 0.60
            ) {
                return {
                    wasHelpful: false,
                    reason: "interact was unnecessary in a quiet focused state"
                }
            }

            return null
        }

        return null
    }

    function applyAutomaticModeFeedback(name, ds, metrics, truth) {
        const adaptive = getAdaptiveRecommendedMode(ds)
        const mode = adaptive.mode
        const inferred = inferAutomaticModeFeedback(mode, ds, metrics, truth)

        if (!inferred) {
            const state = loadAutoModeFeedbackState()
            const result = {
                mode,
                applied: false,
                wasHelpful: null,
                reason: "not enough evidence for automatic feedback"
            }
            state.lastResult = result
            saveAutoModeFeedbackState(state)
            window.mtosAutoModeFeedback = result
            return result
        }

        const stamp = getAutoModeStamp(name, mode)
        const state = loadAutoModeFeedbackState()

        if (state.lastStamp === stamp) {
            window.mtosAutoModeFeedback = state.lastResult || {
                mode,
                applied: false,
                wasHelpful: null,
                reason: "already evaluated today"
            }
            return window.mtosAutoModeFeedback
        }

        registerModeFeedback(mode, inferred.wasHelpful, ds)

        const result = {
            mode,
            applied: true,
            wasHelpful: inferred.wasHelpful,
            reason: inferred.reason
        }

        state.lastStamp = stamp
        state.lastResult = result
        saveAutoModeFeedbackState(state)

        window.mtosAutoModeFeedback = result

        logEvent("auto_mode_feedback", {
            mode,
            wasHelpful: inferred.wasHelpful,
            reason: inferred.reason
        })

        return result
    }

    function futureDateParts(baseDate, offsetDays) {
        const d = new Date(baseDate)
        d.setUTCDate(d.getUTCDate() + offsetDays)

        return {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
            time: d.getTime()
        }
    }

    function buildForecastRow(name, baseKin, horizonDays, predictedAttention, predictedState, targetParts) {
        return {
            id: `${name}_${Date.now()}_${horizonDays}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: Date.now(),
            targetTime: targetParts.time,
            horizonDays,
            user: name,
            baseKin,
            predictedAttention,
            predictedState,
            targetYear: targetParts.year,
            targetMonth: targetParts.month,
            targetDay: targetParts.day
        }
    }

    function makeForecastsFromWeather(name, userKin, weather, baseDate, dayState) {
        const horizons = [1, 3, 7]
        const rows = []

        for (const h of horizons) {
            const idx = Math.min(259, h)
            const w = weather[idx] || weather[0] || {
                attention: 0.5,
                activity: 0.5,
                pressure: 0,
                conflict: 0
            }

            const predictedAttention = Number(w.attention ?? 0.5)

            let predictedState = "NEUTRAL"
            if (predictedAttention > 0.72) {
                predictedState = "FOCUS"
            } else if (predictedAttention > 0.58) {
                predictedState = "FLOW"
            } else if (predictedAttention < 0.34) {
                predictedState = "RECOVERY"
            } else if ((w.pressure ?? 0) > 0.6 || (w.conflict ?? 0) > 0.45) {
                predictedState = "PRESSURE"
            }

            const target = futureDateParts(baseDate, h)

            rows.push(
                buildForecastRow(
                    name,
                    userKin,
                    h,
                    predictedAttention,
                    predictedState,
                    target
                )
            )
        }

        return rows
    }

    function resolveCurrentForecasts(name, userKin, currentAttention, currentDayState) {
        return resolveForecasts((forecast) => {
            if (forecast.user !== name) {
                return null
            }

            return {
                actualAttention: currentAttention,
                actualState: currentDayState?.dayLabel?.toUpperCase?.() || "NEUTRAL"
            }
        })
    }

    function getDayExplanation(ds) {

        const parts = []

        if (ds.field > 0.75) {
            parts.push("Strong alignment with environment")
        } else if (ds.field < 0.3) {
            parts.push("Weak connection to environment")
        }

        if (ds.pressure > 0.6) {
            parts.push("High pressure load")
        } else if (ds.pressure < 0.3) {
            parts.push("Low stress level")
        }

        if (ds.conflict > 0.4) {
            parts.push("Internal conflict present")
        }

        if (ds.stability > 0.7) {
            parts.push("Stable system state")
        } else if (ds.stability < 0.4) {
            parts.push("Unstable condition")
        }

        if (ds.attention > 0.7) {
            parts.push("High focus")
        } else if (ds.attention < 0.3) {
            parts.push("Scattered attention")
        }

        return parts.join(" • ")
    }

    function getRecommendedMode(ds) {
        const adaptive = getAdaptiveRecommendedMode(ds)
        window.mtosAdaptiveMode = adaptive
        return adaptive.mode
    }

    function getModeDescription(mode) {
        if (mode === "FOCUS") return "Deep work, high efficiency, auto-adaptive mode"
        if (mode === "REST") return "Recovery, reduce load, auto-adaptive mode"
        if (mode === "EXPLORE") return "Open exploration, learning, auto-adaptive mode"
        if (mode === "INTERACT") return "Communication, social dynamics, auto-adaptive mode"

        return ""
    }

    function getModeActionGuide(mode) {
        if (mode === "FOCUS") {
            return {
                doText: "Deep work, key decisions, execution, coding, structured writing",
                avoidText: "Context switching, chats, multitasking, random browsing",
                riskText: "Overload if pressure starts rising during the day"
            }
        }

        if (mode === "REST") {
            return {
                doText: "Recovery, routine, sleep, food, walking, reduce stimulus",
                avoidText: "Heavy decisions, conflict, forcing concentration",
                riskText: "False guilt from trying to push against the system"
            }
        }

        if (mode === "EXPLORE") {
            return {
                doText: "Research, testing, idea generation, open exploration, prototypes",
                avoidText: "Premature final decisions, rigid plans",
                riskText: "Scattering energy across too many directions"
            }
        }

        if (mode === "INTERACT") {
            return {
                doText: "Conversations, coordination, negotiation, messaging, feedback loops",
                avoidText: "Isolation, silent frustration, solo overcontrol",
                riskText: "Escalation if conflict is already high"
            }
        }

        return {
            doText: "",
            avoidText: "",
            riskText: ""
        }
    }

    function getDecisionOutput(ds, metrics){

    if(!ds){
        return {
            text: "NO DATA",
            confidence: 0
        }
    }

    const mode = getRecommendedMode(ds)

    let action = ""
    let confidence = 0

    const stability = Number(ds.stability ?? 0.5)
    const attention = Number(ds.attention ?? 0.5)
    const pressure = Number(ds.pressure ?? 0)
    const conflict = Number(ds.conflict ?? 0)
    const field = Number(ds.field ?? 0.5)

    // ===============================
    // DECISION LOGIC
    // ===============================

    if(mode === "FOCUS"){
        action = "Build / Execute core tasks"
        confidence =
            attention * 0.5 +
            stability * 0.4 -
            pressure * 0.3 -
            conflict * 0.2
    }

    else if(mode === "REST"){
        action = "Recover / reduce load"
        confidence =
            pressure * 0.5 +
            (1 - stability) * 0.4 +
            conflict * 0.2
    }

    else if(mode === "EXPLORE"){
        action = "Explore / test / prototype"
        confidence =
            field * 0.5 +
            (1 - Math.abs(attention - 0.55)) * 0.3 -
            pressure * 0.2
    }

    else if(mode === "INTERACT"){
        action = "Communicate / resolve / align"
        confidence =
            conflict * 0.6 +
            field * 0.3 +
            pressure * 0.1
    }

    confidence = Math.max(0, Math.min(1, confidence))

    return {
        text: `${mode} → ${action}`,
        confidence: Number(confidence.toFixed(2))
    }
}

function safeText(value, fallback = "unknown") {
    if (value === null || value === undefined) return fallback
    const s = String(value).trim()
    return s ? s : fallback
}

function safeNum(value, fallback = 0) {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

function wrapPhaseDelta(a, b) {
    const TAU = Math.PI * 2
    let d = Math.abs(Number(a || 0) - Number(b || 0)) % TAU
    if (d > Math.PI) d = TAU - d
    return d
}

function phaseAlignmentScore(a, b) {
    return Math.cos(wrapPhaseDelta(a, b))
}

function phaseLinkMod(a, b) {
    const align = phaseAlignmentScore(a, b)

    return {
        delta: wrapPhaseDelta(a, b),
        align,                          // -1 .. 1
        supportBoost: Math.max(0, align),
        conflictBoost: Math.max(0, -align)
    }
}

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

    console.log("Yesterday confirmed:", realState)

    const el = document.getElementById("mtosPrompt")
    if(el) el.remove()
}

function updateMTOSLogo(){

    const logo = document.querySelector(".mtos-logo")
    if(!logo) return

    const state = window.mtosCollectiveState || {}

    const attractor = state.attractorType || "unknown"
    const pressure = state.pressure || 0

    // СБРОС
    logo.style.filter = ""
    logo.style.transform = ""

    // 🔴 CHAOS
    if(attractor === "chaos"){
        logo.style.filter = "hue-rotate(120deg) brightness(1.4)"
        logo.style.transform = "scale(1.08)"
    }

    // 🔵 STABLE
    else if(attractor === "stable"){
        logo.style.filter = "brightness(0.9)"
    }

    // 🟡 TREND
    else if(attractor === "trend"){
        logo.style.filter = "hue-rotate(40deg)"
    }

    // 🟣 CYCLE
    else if(attractor === "cycle"){
        logo.style.filter = "hue-rotate(200deg)"
    }

    // 🔥 давление системы
    if(pressure > 0.6){
        logo.style.boxShadow = "0 0 20px rgba(255,80,80,0.6)"
    } else {
        logo.style.boxShadow = "none"
    }
}