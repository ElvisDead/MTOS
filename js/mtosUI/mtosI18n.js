import {
  interpretMTOSState,
  renderInterpretationPanel,
  renderLiteInterpretationPanel
} from "../interpretationEngine.js";

export const MTOS_LANG_KEY = "mtos_lang_v1";

export const mtosTranslations = {

  en: {
    weather_title: "METABOLIC WEATHER",
    mtos_about_title: "ABOUT MTOS",
mtos_about_what: "<b>What it is:</b> MTOS is a Metabolic Tzolkin Operating System that reads the structure of the day through a 260-state field and shows the current cognitive and behavioral climate.",
mtos_about_how: "<b>How to use:</b> Enter your name and birth date, press START, then follow the recommended mode, risk, next move, and observe the maps and signals.",
mtos_about_essence: "<b>Core idea:</b> MTOS is not prediction. It is a structural interface for observing pressure, attention, stability, and interaction patterns inside a cyclic system.",
  },
  ru: {
    weather_title: "МЕТАБОЛИЧЕСКАЯ ПОГОДА",

    mtos_about_title: "О MTOS",
mtos_about_what: "<b>Что это:</b> MTOS — это Metabolic Tzolkin Operating System, система, которая читает структуру дня через поле из 260 состояний и показывает текущее когнитивное и поведенческое состояние.",
mtos_about_how: "<b>Как пользоваться:</b> Введи имя и дату рождения, нажми СТАРТ, затем смотри режим, риск, следующий шаг и наблюдай карты и сигналы.",
mtos_about_essence: "<b>Суть:</b> MTOS — это не предсказание, а структурный интерфейс для наблюдения давления, внимания, стабильности и паттернов взаимодействия внутри циклической системы.",
  }
};

function getActiveMTOSLang() {
  const lang =
    window.mtosLang === "ru" || window.MTOS_LANG === "ru"
      ? "ru"
      : "en";

  window.mtosLang = lang;
  window.MTOS_LANG = lang;

  return lang;
}

export function updateStaticTexts() {
  const el = document.getElementById("weatherTitle");
  if (el) el.innerText = t("weather_title");
}

export function loadMTOSLang() {
  try {
    const raw = localStorage.getItem(MTOS_LANG_KEY);
    const lang = raw === "ru" ? "ru" : "en";

    window.mtosLang = lang;
    window.MTOS_LANG = lang;

    return lang;
  } catch (e) {
    window.mtosLang = "en";
    window.MTOS_LANG = "en";
    return "en";
  }
}

export function saveMTOSLang(lang) {
  try {
    const value = lang === "ru" ? "ru" : "en";

    localStorage.setItem(MTOS_LANG_KEY, value);
    window.mtosLang = value;
    window.MTOS_LANG = value;
  } catch (e) {}
}

export const MTOS_I18N = {
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
    modeRiskAligned: "Mode / risk aligned",
    learningAdjusted: "Learning-adjusted",

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

    eventTypeBackground: "BACKGROUND",
    eventTypeContact: "CONTACT",
    eventTypeConflict: "CONFLICT",
    levelLow: "LOW",
    levelMedium: "MEDIUM",
    levelHigh: "HIGH",
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
    unknownWord: "UNKNOWN",
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

    collaborate: "Collaborate",
    tension: "Tension",
    strong: "Strong",

    attractorSectionTitle: "ATTRACTOR",
    historyEfficiencySectionTitle: "HISTORY EFFICIENCY",
    seriesSectionTitle: "SERIES",
    toolsSectionTitle: "TOOLS",

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

    stateLabel: "State",
    stateCountLabel: "States (N)",
    diversityLabel: "Diversity",

    recovery_phase: "Recovery Phase",
    direction: "Direction",
    meaning: "Meaning",

    metrics_block_title: "Extra metrics",
    metrics_money: "money",
    metrics_productivity: "productivity",
    metrics_errors: "errors",
    metrics_conflicts: "conflicts",

    metrics_step2_title: "Step 2 — Add a metric",
    metrics_step2_value: "Not “how you feel”",
    metrics_step2_note: "A: money · productivity · errors · conflicts",

    fieldTension: "FIELD TENSION",
pressure: "pressure",
stability: "stability",
consistency: "consistency",
gradient: "gradient",
interpretation: "interpretation",
lowTension: "low tension",
mediumTension: "medium tension",
highTension: "high tension",
fieldOpen: "field open",
fieldActive: "field active",
fieldCompressed: "field compressed",
uneven: "uneven",
mixed: "mixed",
stable: "stable",

actionTrace: "ACTION TRACE",
decisionTargets: "DECISION TARGETS",
bestContactNow: "BEST CONTACT NOW",
possibleContacts: "POSSIBLE CONTACTS",
avoidToday: "AVOID TODAY",
selected: "SELECTED",
select: "SELECT",
scoreWord: "score",
realContact: "real contact",
manualTarget: "manual target",

systemOutput: "SYSTEM OUTPUT",
reason: "Reason",
confidence: "Confidence",
bestTargetNow: "Best target now",
score: "Score",

extraMetrics: "EXTRA METRICS",
resetAll: "Reset all",
money: "MONEY",
productivity: "PRODUCTIVITY",
errors: "ERRORS",
conflicts: "CONFLICTS",
valueWord: "Value",
normalizedWord: "Normalized",
metricsSummary: "Metrics summary",
activeMetrics: "Active metrics",
totalScore: "Total score",
noValue: "No value",
metricsBottomEmpty: "Enter at least one metric. It is not written to the log and lives only within the current day.",

metricHintMoney: "any number, e.g. -250 / 1200",
metricHintProductivity: "0 ... 100 (%)",
metricHintErrors: "any number >= 0",
metricHintConflicts: "any number >= 0",

stepInteractNarrow: "keep communication narrow and direct",
stepReopenAlternative: "reopen one alternative before committing",
stepFinishTask: "finish one concrete task",
stepReduceLoad: "reduce load",
stepSafeContact: "choose one safe contact only",
stepTestSafely: "test safely",
stepHoldPosition: "hold position",
stepAvoidMultitasking: "avoid multitasking",
stepAvoidEarlyCertainty: "avoid forcing certainty too early",
stepAvoidPressureDecisions: "avoid pressure decisions",
stepAvoidEmotionalEscalation: "avoid emotional escalation",
stepAvoidRigidCommitments: "avoid rigid commitments",

network: "NETWORK",
edit: "Edit",
link: "Link",
all: "All",
weak_support: "Weak Support",
strong_conflict: "Strong Conflict",

nodes_desc: "Nodes = participants.",
colors_desc: "Colors match Collective.",
zoom_desc: "Wheel / pinch = zoom, drag = move.",
inspect_desc: "Tap / click node = inspect.",
edit_desc: "Edit = remove node or relation.",
link_desc: "Link = tap first node, then second node to connect.",
contact_desc: "Contact = mark two nodes as today's real contact.",

history_efficiency: "HISTORY EFFICIENCY",

start_btn: "START",

network: "NETWORK",
edit: "Edit",
link: "Link",
all: "All",
weak_support: "Weak Support",
strong_conflict: "Strong Conflict",

nodes_desc: "Nodes = participants.",
colors_desc: "Colors match Collective.",
zoom_desc: "Wheel / pinch = zoom, drag = move.",
inspect_desc: "Tap / click node = inspect.",
edit_desc: "Edit = remove node or relation.",
link_desc: "Link = tap first node, then second node to connect.",
contact_desc: "Contact = mark two nodes as today's real contact.",

history_efficiency: "HISTORY EFFICIENCY",

decisionActionInteract: "Good moment for one constructive contact or clean coordination.",
decisionActionExplore: "Test a move without full commitment and observe response.",
decisionActionFocus: "Reduce noise, narrow tasks, finish one concrete thing.",
decisionActionAdjust: "Loosen fixation, reopen one alternative, and continue without forcing certainty.",
decisionActionRest: "Do not expand commitments today. Protect energy and simplify.",

decisionReasonSocialDynamics: "Social dynamics are active. Interaction works best when kept clean and narrow.",
decisionReasonExploreViable: "No single hard constraint dominates. Exploration stays viable.",
decisionReasonChaosControlled: "System unstable, but behavior still controlled.",
decisionReasonHighRiskOverride: "High risk overrides softer signals.",
decisionReasonNeedFlexibility: "The system needs flexibility before strong commitment.",
decisionReasonFocusCleanest: "Focused execution is currently the cleanest path.",
decisionReasonRecoverySafer: "Recovery and simplification are safer than expansion.",
decisionReasonUsefulContact: "The field is open enough for one useful contact.",
unknownWord: "UNKNOWN",

eventDescInstability: "High metabolic activation with low stability.",
eventDescConflict: "Time pressure amplifies unstable ties.",
eventDescSupport: "Good conditions for stable cooperation.",
eventDescOpportunity: "Strong relation potential under manageable pressure.",

weather_title: "METABOLIC WEATHER",

fieldSectionTitle: "FIELD",

field_about_title: "ABOUT FIELD",
field_about_what: "Field is a 13×20 kin map (260 states). Each cell is one kin.",
field_about_reading: "Fill shows state intensity. Inner frame shows field type. White outer frame marks selected kin. Number inside shows participant count. Dashed diagonal shows the kin trace.",
field_about_click: "Click a kin to inspect people and values inside it.",

field_mode_global: "Global",
field_mode_activity: "Activity",
field_mode_pressure: "Pressure",
field_mode_hybrid: "Hybrid",
field_mode_landscape: "Landscape",
field_mode_attractor: "Attractor",

field_mode_global_desc: "Shows where participants are located.",
field_mode_activity_desc: "Shows where attention and activation are alive.",
field_mode_pressure_desc: "Shows where tension, overload, and conflict accumulate.",
field_mode_hybrid_desc: "Shows the strongest synthetic zones of the whole system.",
field_mode_landscape_desc: "Shows the field itself, regardless of participant positions.",
field_mode_attractor_desc: "Shows where attention is naturally pulled.",

field_state_types: "State types",
field_cluster: "Cluster",
field_pressure_label: "Pressure",
field_active_label: "Active",
field_resonance: "Resonance",
field_stable_label: "Stable",
field_event_label: "Event",

field_cluster_desc: "dense multi-user concentration",
field_pressure_desc2: "high pressure / conflict / tension",
field_active_desc2: "high attention / activation",
field_resonance_desc: "strong hybrid combination",
field_stable_desc2: "neutral stable presence",
field_event_desc2: "spike / threshold event",

field_kin: "Kin",
field_tone: "Tone",
field_seal: "Seal",
field_mode: "Mode",
field_users_in_kin: "Users in kin",
field_users_none: "No users",
field_state: "State",
field_attention: "Attention",
field_activity: "Activity",
field_pressure: "Pressure",
field_hybrid: "Hybrid",
field_field: "Field",
field_attractor: "Attractor",
field_spike: "Spike",

field_viridis_scale: "Viridis: low intensity → high intensity.",
field_weather_sync: "In Global mode the scale is synchronized with Weather and combines attention + activity + field + attractor.",

mtos_about_title: "ABOUT MTOS",
mtos_about_what: "<b>What it is:</b> MTOS is a Metabolic Tzolkin Operating System — a system that reads day structure through a 260-state field and shows the current cognitive and behavioral climate.",
mtos_about_how: "<b>How to use it:</b> Enter name and birth date, press START, then read the recommended mode, risk, next move, weather map, network, and collective signals for the selected day.",
mtos_about_essence: "<b>Core idea:</b> MTOS is not fortune telling. It is a structural interface for observing pressure, attention, stability, rhythm, and interaction patterns inside a living cyclic field.",

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

    learningAdjusted: "Скорректировано обучением",

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

    history_efficiency: "ЭФФЕКТИВНОСТЬ ИСТОРИИ",
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
    modeAdjust: "КОРРЕКЦИЯ",
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
    decisionTextAdjustBetter: "КОРРЕКЦИЯ — прошлые оценки подсказывают, что здесь гибкость лучше, чем зажатие.",
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
    eventTypeBackground: "ФОН",
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

    collaborate: "Сотрудничество",
    tension: "Напряжение",
    strong: "Сильное",

    attractorSectionTitle: "АТТРАКТОР",
    historyEfficiencySectionTitle: "ЭФФЕКТИВНОСТЬ ИСТОРИИ",
    seriesSectionTitle: "СЕРИИ",
    toolsSectionTitle: "ИНСТРУМЕНТЫ",

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

    stateLabel: "Состояние",
    stateCountLabel: "Активных состояний (N)",
    diversityLabel: "Разнообразие",

    recovery_phase: "Фаза восстановления",
    direction: "Направление",
    meaning: "Смысл",

    metrics_block_title: "Доп. метрики",
    metrics_money: "деньги",
    metrics_productivity: "продуктивность",
    metrics_errors: "ошибки",
    metrics_conflicts: "конфликты",

    metrics_step2_title: "Шаг 2 — Добавь метрику",
    metrics_step2_value: "Не «как ты себя чувствуешь»",
    metrics_step2_note: "A: деньги · продуктивность · ошибки · конфликты",

    fieldTension: "НАПРЯЖЕНИЕ ПОЛЯ",
pressure: "давление",
stability: "стабильность",
consistency: "согласованность",
gradient: "градиент",
interpretation: "интерпретация",
lowTension: "низкое напряжение",
mediumTension: "среднее напряжение",
highTension: "высокое напряжение",
fieldOpen: "поле открыто",
fieldActive: "поле активно",
fieldCompressed: "поле сжато",
uneven: "неравномерный",
mixed: "смешанный",
stable: "стабильный",

actionTrace: "ТРАЕКТОРИЯ ДЕЙСТВИЯ",
decisionTargets: "ЦЕЛИ РЕШЕНИЯ",
bestContactNow: "ЛУЧШИЙ КОНТАКТ СЕЙЧАС",
possibleContacts: "ВОЗМОЖНЫЕ КОНТАКТЫ",
avoidToday: "ИЗБЕГАТЬ СЕГОДНЯ",
selected: "ВЫБРАНО",
select: "ВЫБРАТЬ",
scoreWord: "оценка",
realContact: "реальный контакт",
manualTarget: "ручная цель",

systemOutput: "СИСТЕМНЫЙ ВЫВОД",
reason: "Причина",
confidence: "Уверенность",
bestTargetNow: "Лучшая цель сейчас",
score: "Оценка",

extraMetrics: "ДОП. МЕТРИКИ",
resetAll: "Сбросить всё",
money: "ДЕНЬГИ",
productivity: "ПРОДУКТИВНОСТЬ",
errors: "ОШИБКИ",
conflicts: "КОНФЛИКТЫ",
valueWord: "Значение",
normalizedWord: "Нормировка",
metricsSummary: "Сводка метрик",
activeMetrics: "Активных метрик",
totalScore: "Общая оценка",
noValue: "Нет значения",
metricsBottomEmpty: "Введи хотя бы одну метрику. Это не пишется в лог и живёт только в текущем дне.",

metricHintMoney: "любое число, например: -250 / 1200",
metricHintProductivity: "0 ... 100 (%)",
metricHintErrors: "любое число от 0 и выше",
metricHintConflicts: "любое число от 0 и выше",

stepInteractNarrow: "держать коммуникацию узкой и прямой",
stepReopenAlternative: "переоткрыть одну альтернативу перед фиксацией",
stepFinishTask: "завершить одну конкретную задачу",
stepReduceLoad: "снизить нагрузку",
stepSafeContact: "выбрать только один безопасный контакт",
stepTestSafely: "проверить без жёсткой фиксации",
stepHoldPosition: "удерживать позицию",
stepAvoidMultitasking: "избегать многозадачности",
stepAvoidEarlyCertainty: "не форсировать определённость слишком рано",
stepAvoidPressureDecisions: "избегать решений под давлением",
stepAvoidEmotionalEscalation: "избегать эмоциональной эскалации",
stepAvoidRigidCommitments: "избегать жёсткой фиксации",

network: "СЕТЬ",
edit: "Редактировать",
link: "Связать",
all: "Все",
weak_support: "Слабая поддержка",
strong_conflict: "Сильный конфликт",

nodes_desc: "Узлы = участники.",
colors_desc: "Цвета соответствуют Collective.",
zoom_desc: "Колесо / pinch = масштаб, drag = перемещение.",
inspect_desc: "Клик по узлу = просмотр.",
edit_desc: "Редактирование = удалить узел или связь.",
link_desc: "Связать = выбрать два узла.",
contact_desc: "Контакт = отметить реальный контакт за сегодня.",

history_efficiency: "ЭФФЕКТИВНОСТЬ ИСТОРИИ",

start_btn: "СТАРТ",

network: "СЕТЬ",
edit: "Редактировать",
link: "Связать",
all: "Все",
weak_support: "Слабая поддержка",
strong_conflict: "Сильный конфликт",

nodes_desc: "Узлы = участники.",
colors_desc: "Цвета соответствуют Collective.",
zoom_desc: "Колесо / pinch = масштаб, drag = перемещение.",
inspect_desc: "Клик по узлу = просмотр.",
edit_desc: "Редактирование = удалить узел или связь.",
link_desc: "Связать = выбрать два узла.",
contact_desc: "Контакт = отметить реальный контакт за сегодня.",

history_efficiency: "ЭФФЕКТИВНОСТЬ ИСТОРИИ",

eventTypeContact: "КОНТАКТ",
eventTypeConflict: "КОНФЛИКТ",

decisionActionInteract: "Хороший момент для одного конструктивного контакта или чистой координации.",
decisionActionExplore: "Проверь ход без полной фиксации и наблюдай за откликом.",
decisionActionFocus: "Сузь шум, сократи задачи и доведи до конца одно конкретное дело.",
decisionActionAdjust: "Ослабь фиксацию, переоткрой одну альтернативу и продолжай без форсирования определённости.",
decisionActionRest: "Не расширяй обязательства сегодня. Сохрани энергию и упростись.",

decisionReasonSocialDynamics: "Социальная динамика активна. Взаимодействие работает лучше, если держать его чистым и узким.",
decisionReasonExploreViable: "Ни одно жёсткое ограничение не доминирует. Исследование остаётся жизнеспособным.",
decisionReasonChaosControlled: "Система нестабильна, но поведение всё ещё остаётся управляемым.",
decisionReasonHighRiskOverride: "Высокий риск перекрывает более мягкие сигналы.",
decisionReasonNeedFlexibility: "Системе нужна гибкость перед жёсткой фиксацией.",
decisionReasonFocusCleanest: "Сейчас самый чистый путь — сфокусированное исполнение.",
decisionReasonRecoverySafer: "Восстановление и упрощение сейчас безопаснее расширения.",
decisionReasonUsefulContact: "Поле достаточно открыто для одного полезного контакта.",

eventDescInstability: "Высокая метаболическая активация при низкой стабильности.",
eventDescConflict: "Давление времени усиливает нестабильные связи.",
eventDescSupport: "Хорошие условия для стабильного сотрудничества.",
eventDescOpportunity: "Сильный потенциал связи при управляемом давлении.",

fieldSectionTitle: "ПОЛЕ",

field_about_title: "О ПОЛЕ",
field_about_what: "Поле — это карта кинов 13×20 (260 состояний). Каждая клетка — один кин.",
field_about_reading: "Заливка показывает интенсивность состояния. Внутренняя рамка показывает тип поля. Белая внешняя рамка — выбранный кин. Число внутри — количество участников. Пунктирная диагональ показывает кин-след.",
field_about_click: "Нажми на кин, чтобы посмотреть людей и значения внутри.",

field_mode_global: "Глобальный",
field_mode_activity: "Активность",
field_mode_pressure: "Давление",
field_mode_hybrid: "Гибрид",
field_mode_landscape: "Ландшафт",
field_mode_attractor: "Аттрактор",

field_mode_global_desc: "Показывает, где расположены участники.",
field_mode_activity_desc: "Показывает, где живы внимание и активация.",
field_mode_pressure_desc: "Показывает, где накапливаются напряжение, перегрузка и конфликт.",
field_mode_hybrid_desc: "Показывает самые сильные синтетические зоны всей системы.",
field_mode_landscape_desc: "Показывает само поле, независимо от позиций участников.",
field_mode_attractor_desc: "Показывает, куда естественно тянется внимание.",

field_state_types: "Типы состояний",
field_cluster: "Кластер",
field_pressure_label: "Давление",
field_active_label: "Активность",
field_resonance: "Резонанс",
field_stable_label: "Стабильность",
field_event_label: "Событие",

field_cluster_desc: "плотная многопользовательская концентрация",
field_pressure_desc2: "высокое давление / конфликт / напряжение",
field_active_desc2: "высокое внимание / активация",
field_resonance_desc: "сильная гибридная комбинация",
field_stable_desc2: "нейтральное стабильное присутствие",
field_event_desc2: "всплеск / пороговое событие",

field_kin: "Кин",
field_tone: "Тон",
field_seal: "Печать",
field_mode: "Режим",
field_users_in_kin: "Пользователей в кине",
field_users_none: "Нет пользователей",
field_state: "Состояние",
field_attention: "Внимание",
field_activity: "Активность",
field_pressure: "Давление",
field_hybrid: "Гибрид",
field_field: "Поле",
field_attractor: "Аттрактор",
field_spike: "Всплеск",

field_viridis_scale: "Viridis: низкая интенсивность → высокая интенсивность.",
field_weather_sync: "В режиме Global шкала синхронизирована с Weather и объединяет внимание + активность + поле + аттрактор.",

weather_title: "МЕТАБОЛИЧЕСКАЯ ПОГОДА",

mtos_about_title: "О MTOS",
mtos_about_what: "<b>Что это:</b> MTOS — это Metabolic Tzolkin Operating System, система, которая читает структуру дня через поле из 260 состояний и показывает текущее когнитивное и поведенческое состояние.",
mtos_about_how: "<b>Как пользоваться:</b> Введи имя и дату рождения, нажми СТАРТ, после чего смотри рекомендуемый режим, риск, следующий шаг, карту погоды, сеть и коллективные сигналы на выбранный день.",
mtos_about_essence: "<b>Суть:</b> MTOS — это не гадание, а структурный интерфейс для наблюдения давления, внимания, стабильности, ритма и паттернов взаимодействия внутри живого циклического поля.",

seriesLegend: `Эти графики показывают временную динамику внутри 260-состояний когнитивного цикла.

• 7 дней — краткосрочная динамика внимания
• 30 дней — среднесрочный поведенческий дрейф
• 260 дней — полная структура цикла внимания

• Φ серия — метаболическая интенсивность / интегральная когнитивная нагрузка
• T серия — температура обработки / интенсивность активации
• Серия согласованности — внутренняя целостность текущего режима

Все графики отображаются в фиксированном диапазоне 0..1 для наглядного сравнения.`
  }
};

export function t(key) {
  const lang = getActiveMTOSLang();
  return MTOS_I18N[lang]?.[key] ?? MTOS_I18N.en?.[key] ?? key;
}

export function setStatusText(key) {
  const status = document.getElementById("status");
  if (status) status.innerText = t(key);
}

export function translateModeLabel(mode) {
  const m = String(mode || "").toUpperCase();
  if (m === "FOCUS") return t("modeFocus");
  if (m === "ADJUST") return t("modeAdjust");
  if (m === "REST") return t("modeRest");
  if (m === "INTERACT") return t("modeInteract");
  return t("modeExplore");
}

export function translateRelationLabel(label) {
  const x = String(label || "").toLowerCase().trim();

  if (x.includes("ultra synergy")) return t("ultraSynergy");
  if (x.includes("strong support")) return t("strongSupport");
  if (x.includes("strong conflict")) return t("strongConflict");

  if (x.includes("collaborate")) return t("collaborate");
  if (x.includes("support")) return t("support");
  if (x.includes("tension")) return t("tension");
  if (x.includes("conflict")) return t("conflict");
  if (x.includes("neutral")) return t("neutral");
  if (x === "strong") return t("strong");

  if (x.includes("manual target")) return t("manualTargetWord");
  if (x.includes("real contact")) return t("realContactWord");

  return label || "";
}

export function translateRiskLabel(label) {
  const r = String(label || "").toUpperCase();
  if (r === "LOW") return t("riskLow");
  if (r === "MEDIUM") return t("riskMedium");
  if (r === "HIGH") return t("riskHigh");
  if (r === "CRITICAL") return t("riskCritical");
  return r;
}

export function formatI18n(template, vars = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] != null ? String(vars[key]) : `{${key}}`;
  });
}

export function applyMTOSLang(lang) {
  const safeLang = lang === "ru" ? "ru" : "en";

  window.mtosLang = safeLang;
  window.MTOS_LANG = safeLang;

  const enBtn = document.getElementById("langEnBtn");
  const ruBtn = document.getElementById("langRuBtn");

  if (enBtn) enBtn.classList.toggle("active", safeLang === "en");
  if (ruBtn) ruBtn.classList.toggle("active", safeLang === "ru");

  const systemEventsTitle = document.getElementById("systemEventsTitle");
  const systemDecisionTitle = document.getElementById("systemDecisionTitle");
  const weatherTitle = document.getElementById("weatherTitle");
  const collectiveSectionTitle = document.getElementById("collectiveSectionTitle");
  const attractorSectionTitle = document.getElementById("attractorSectionTitle");
  const historyEfficiencySectionTitle = document.getElementById("historyEfficiencySectionTitle");
  const seriesSectionTitle = document.getElementById("seriesSectionTitle");
  const toolsSectionTitle = document.getElementById("toolsSectionTitle");

  if (systemEventsTitle) systemEventsTitle.innerText = t("systemEventsTitle");
  if (systemDecisionTitle) systemDecisionTitle.innerText = t("systemDecisionTitle");
  if (collectiveSectionTitle) collectiveSectionTitle.innerText = t("collectiveSectionTitle");
  if (attractorSectionTitle) attractorSectionTitle.innerText = t("attractorSectionTitle");
  if (historyEfficiencySectionTitle) historyEfficiencySectionTitle.innerText = t("historyEfficiencySectionTitle");
  if (seriesSectionTitle) seriesSectionTitle.innerText = t("seriesSectionTitle");
  if (toolsSectionTitle) toolsSectionTitle.innerText = t("toolsSectionTitle");

  updateStaticTexts();

  if (weatherTitle) {
    weatherTitle.innerText = t("weather_title");
  }

  if (typeof window.applyStaticTranslations === "function") {
    window.applyStaticTranslations();
  }

  if (typeof window.renderSystemEventsPanel === "function") {
    window.renderSystemEventsPanel({
      t: window.t,
      getState: () => window.MTOS_STATE || {}
    });
  }

  if (typeof window.renderSystemDecisionPanel === "function") {
    window.renderSystemDecisionPanel({
      t: window.t,
      translateModeLabel: window.translateModeLabel,
      translateRelationLabel: window.translateRelationLabel,
      getState: () => window.MTOS_STATE || {}
    });
  }

  if (typeof window.renderDecisionTargetsPanel === "function") {
    window.renderDecisionTargetsPanel({
      t: window.t,
      getState: () => window.MTOS_STATE || {},
      getSelectedDecisionTarget: window.getSelectedDecisionTarget || (() => ""),
      setSelectedDecisionTarget: window.setSelectedDecisionTarget || (() => {}),
      resolveDecisionTargets: () =>
        typeof window.resolveDecisionTargets === "function"
          ? window.resolveDecisionTargets()
          : { primary: [], avoid: [], neutral: [] },
      renderDecisionSummaryPanel: (targetId = "humanLayer") =>
        typeof window.renderDecisionSummaryPanel === "function"
          ? window.renderDecisionSummaryPanel(targetId)
          : null,
      renderSystemDecisionPanel: () =>
        typeof window.renderSystemDecisionPanel === "function"
          ? window.renderSystemDecisionPanel({
              t: window.t,
              translateModeLabel: window.translateModeLabel,
              translateRelationLabel: window.translateRelationLabel,
              getState: () => window.MTOS_STATE || {}
            })
          : null,
      renderActionTracePanel: () =>
        typeof window.renderActionTracePanel === "function"
          ? window.renderActionTracePanel({
              t: window.t,
              translateModeLabel: window.translateModeLabel,
              translateRiskLabel: window.translateRiskLabel,
              getDecision: () => window.mtosDecision || {},
              getDayState: () => window.mtosDayState || {},
              getTimePressureSummary: () => window.mtosTimePressureSummary || {},
              getState: () => window.MTOS_STATE || {}
            })
          : null
    });
  }

  if (typeof window.renderActionTracePanel === "function") {
    window.renderActionTracePanel({
      t: window.t,
      translateModeLabel: window.translateModeLabel,
      translateRiskLabel: window.translateRiskLabel,
      getDecision: () => window.mtosDecision || {},
      getDayState: () => window.mtosDayState || {},
      getTimePressureSummary: () => window.mtosTimePressureSummary || {},
      getState: () => window.MTOS_STATE || {}
    });
  }
    if (typeof window.drawField === "function" && window._weather) {
    window.drawField(
      "fieldMap",
      Array.isArray(window.currentUsers) ? window.currentUsers : [],
      window.fieldMode || "global",
      Array.isArray(window._weather) ? window._weather : [],
      Array.isArray(window._attractorField) ? window._attractorField : []
    );
  }
}

if (typeof window.applyStaticTranslations === "function") {
  window.applyStaticTranslations();
}

window.t = t;
window.translateModeLabel = translateModeLabel;
window.translateRelationLabel = translateRelationLabel;
window.translateRiskLabel = translateRiskLabel;
window.MTOS_I18N = MTOS_I18N;
window.__mtos_i18n_t = t;
window.interpretMTOSState = interpretMTOSState;
window.renderInterpretationPanel = renderInterpretationPanel;
window.renderLiteInterpretationPanel = renderLiteInterpretationPanel;

window.setMTOSLang = function(lang) {
  const safeLang = lang === "ru" ? "ru" : "en";

  saveMTOSLang(safeLang);
  applyMTOSLang(safeLang);

  if (typeof window.renderDecisionMetrics === "function") {
    window.renderDecisionMetrics();
  }

  if (typeof window._rerenderMTOS === "function") {
    window._rerenderMTOS();
  }

  applyMTOSLang(safeLang);
};

window.__mtos_i18n_debug = {
  lang: () => (window.mtosLang || window.MTOS_LANG || loadMTOSLang()),
  test: (key) => t(key)
};

applyMTOSLang(window.mtosLang || window.MTOS_LANG || loadMTOSLang());