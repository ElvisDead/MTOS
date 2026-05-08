function resolveTranslator(t) {
    if (typeof window.t === "function") {
        return window.t;
    }

    if (typeof t === "function") {
        return t;
    }

    return (x) => x;
}

function safeTranslated(t, key, fallback) {
    const tr = resolveTranslator(t);
    const value = tr(key);

    if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== "" &&
        value !== key
    ) {
        return value;
    }

    if (typeof window.t === "function") {
        const winValue = window.t(key);
        if (
            winValue !== undefined &&
            winValue !== null &&
            String(winValue).trim() !== "" &&
            winValue !== key
        ) {
            return winValue;
        }
    }

    return fallback;
}

function translateModeLocal(mode, t) {
    const x = String(mode || "").trim().toUpperCase();

    if (x === "FOCUS") return safeTranslated(t, "modeFocus", "FOCUS");
    if (x === "ADJUST") return safeTranslated(t, "modeAdjust", "ADJUST");
    if (x === "REST") return safeTranslated(t, "modeRest", "REST");
    if (x === "INTERACT") return safeTranslated(t, "modeInteract", "INTERACT");
    if (x === "EXPLORE") return safeTranslated(t, "modeExplore", "EXPLORE");
    if (x === "FLOW") return safeTranslated(t, "modeExplore", "EXPLORE");
    if (x === "UNKNOWN") return safeTranslated(t, "unknownWord", "UNKNOWN");

    return x || safeTranslated(t, "unknownWord", "UNKNOWN");
}

function translateRiskLocal(level, t) {
    const x = String(level || "").trim().toUpperCase();

    if (x === "LOW") return safeTranslated(t, "riskLow", "LOW");
    if (x === "MEDIUM") return safeTranslated(t, "riskMedium", "MEDIUM");
    if (x === "HIGH") return safeTranslated(t, "riskHigh", "HIGH");
    if (x === "CRITICAL") return safeTranslated(t, "riskCritical", "CRITICAL");

    return x || safeTranslated(t, "unknownWord", "UNKNOWN");
}

function normalizeEventType(item, t) {
    const rawType = String(item?.type || item?.eventType || "").trim().toLowerCase();

    if (!rawType || rawType.includes("background")) {
        return safeTranslated(t, "eventTypeBackground", "BACKGROUND");
    }

    if (rawType.includes("contact")) {
        return safeTranslated(t, "eventTypeContact", "CONTACT");
    }

    if (rawType.includes("conflict")) {
        return safeTranslated(t, "eventTypeConflict", "CONFLICT");
    }

    return rawType.toUpperCase();
}

function normalizeRiskLevel(item, t) {
    const rawLevel = String(item?.level || item?.risk || "").trim().toLowerCase();

    if (rawLevel.includes("low")) return safeTranslated(t, "riskLow", "LOW");
    if (rawLevel.includes("medium")) return safeTranslated(t, "riskMedium", "MEDIUM");
    if (rawLevel.includes("high")) return safeTranslated(t, "riskHigh", "HIGH");
    if (rawLevel.includes("critical")) return safeTranslated(t, "riskCritical", "CRITICAL");

    return safeTranslated(t, "unknownWord", "UNKNOWN");
}

function normalizeEventText(item, t) {
    const rawText = String(
        item?.text ||
        item?.reason ||
        item?.message ||
        item?.description ||
        ""
    ).trim();

    if (
        !rawText ||
        rawText === "No major event threshold reached." ||
        rawText === "Сильный порог события не достигнут." ||
        rawText === "noMajorEvent"
    ) {
        return safeTranslated(t, "noMajorEvent", "No major event threshold reached.");
    }

    if (
        rawText === "High metabolic activation with low stability." ||
        rawText === "Высокая метаболическая активация при низкой стабильности."
    ) {
        return safeTranslated(t, "eventDescInstability", "High metabolic activation with low stability.");
    }

    if (
        rawText === "Time pressure amplifies unstable ties." ||
        rawText === "Давление времени усиливает нестабильные связи."
    ) {
        return safeTranslated(t, "eventDescConflict", "Time pressure amplifies unstable ties.");
    }

    if (
        rawText === "Good conditions for stable cooperation." ||
        rawText === "Хорошие условия для стабильного сотрудничества."
    ) {
        return safeTranslated(t, "eventDescSupport", "Good conditions for stable cooperation.");
    }

    if (
        rawText === "Strong relation potential under manageable pressure." ||
        rawText === "Сильный потенциал связи при управляемом давлении."
    ) {
        return safeTranslated(t, "eventDescOpportunity", "Strong relation potential under manageable pressure.");
    }

    return rawText;
}

function normalizeDecisionAction(decision, t) {
    const mode = String(decision?.mode || "").trim().toUpperCase();
    const rawAction = String(decision?.action || decision?.text || "").trim();

    if (mode === "INTERACT") {
        return safeTranslated(
            t,
            "decisionActionInteract",
            "Good moment for one constructive contact or clean coordination."
        );
    }

    if (mode === "FOCUS") {
        return safeTranslated(
            t,
            "decisionActionFocus",
            "Reduce noise, narrow tasks, finish one concrete thing."
        );
    }

    if (mode === "EXPLORE" || mode === "FLOW") {
        return safeTranslated(
            t,
            "decisionActionExplore",
            "Test a move without full commitment and observe response."
        );
    }

    if (mode === "REST") {
        return safeTranslated(
            t,
            "decisionActionRest",
            "Do not expand commitments today. Protect energy and simplify."
        );
    }

    if (mode === "ADJUST") {
    return safeTranslated(
        t,
        "decisionActionAdjust",
        "Loosen fixation, reopen one alternative, and continue without forcing certainty."
    );
}

    if (
        rawAction === "Observe the field." ||
        rawAction === "Observe the field and avoid impulsive actions." ||
        !rawAction
    ) {
        return safeTranslated(t, "observeField", "Observe the field.");
    }

    return rawAction;
}

function normalizeDecisionReason(reasonText, t, decision = null) {
    let raw = String(reasonText || "").trim();
    const mode = String(decision?.mode || "").trim().toUpperCase();

    raw = raw.replace(/^Причина:\s*/i, "").replace(/^Reason:\s*/i, "").trim();

    if (raw === "No reason" || raw === "Нет причины" || !raw) {
        if (mode === "INTERACT") {
            return safeTranslated(
                t,
                "decisionReasonUsefulContact",
                "The field is open enough for one useful contact."
            );
        }

        if (mode === "FOCUS") {
            return safeTranslated(
                t,
                "decisionReasonFocusCleanest",
                "Focused execution is currently the cleanest path."
            );
        }

        if (mode === "REST") {
            return safeTranslated(
                t,
                "decisionReasonRecoverySafer",
                "Recovery and simplification are safer than expansion."
            );
        }

        if (mode === "ADJUST") {
            return safeTranslated(
                t,
                "decisionReasonNeedFlexibility",
                "The system needs flexibility before strong commitment."
            );
        }

        if (mode === "EXPLORE" || mode === "FLOW") {
            return safeTranslated(
                t,
                "decisionReasonExploreViable",
                "No single hard constraint dominates. Exploration stays viable."
            );
        }

        return safeTranslated(t, "noReason", "No reason");
    }

    if (
        raw === "No strong feedback pattern yet." ||
        raw === "Пока нет сильного паттерна обратной связи."
    ) {
        return safeTranslated(t, "noStrongFeedbackPattern", "No strong feedback pattern yet.");
    }

    if (
        raw === "Derived from cached day state." ||
        raw === "Выведено из кэшированного состояния дня."
    ) {
        return safeTranslated(t, "derivedFromCachedDayState", "Derived from cached day state.");
    }

    if (
        raw === "Derived from day state, time pressure, and memory." ||
        raw === "Выведено из состояния дня, давления времени и памяти."
    ) {
        return safeTranslated(t, "derivedFromDayState", "Derived from day state, time pressure, and memory.");
    }

    if (
        raw === "Social dynamics are active. Interaction works best when kept clean and narrow." ||
        raw === "Социальная динамика активна. Взаимодействие работает лучше, если держать его чистым и узким."
    ) {
        return safeTranslated(t, "decisionReasonSocialDynamics", "Social dynamics are active. Interaction works best when kept clean and narrow.");
    }

    if (
        raw === "No single hard constraint dominates. Exploration stays viable." ||
        raw === "Ни одно жёсткое ограничение не доминирует. Исследование остаётся жизнеспособным."
    ) {
        return safeTranslated(t, "decisionReasonExploreViable", "No single hard constraint dominates. Exploration stays viable.");
    }

    if (
        raw === "System unstable, but behavior still controlled." ||
        raw === "Система нестабильна, но поведение всё ещё остаётся управляемым."
    ) {
        return safeTranslated(t, "decisionReasonChaosControlled", "System unstable, but behavior still controlled.");
    }

    if (
        raw === "High risk overrides softer signals." ||
        raw === "Высокий риск перекрывает более мягкие сигналы."
    ) {
        return safeTranslated(t, "decisionReasonHighRiskOverride", "High risk overrides softer signals.");
    }

    if (
        raw === "The system needs flexibility before strong commitment." ||
        raw === "Системе нужна гибкость перед жёсткой фиксацией."
    ) {
        return safeTranslated(t, "decisionReasonNeedFlexibility", "The system needs flexibility before strong commitment.");
    }

    if (
        raw === "Focused execution is currently the cleanest path." ||
        raw === "Сейчас самый чистый путь — сфокусированное исполнение."
    ) {
        return safeTranslated(t, "decisionReasonFocusCleanest", "Focused execution is currently the cleanest path.");
    }

    if (
        raw === "Recovery and simplification are safer than expansion." ||
        raw === "Восстановление и упрощение сейчас безопаснее расширения."
    ) {
        return safeTranslated(t, "decisionReasonRecoverySafer", "Recovery and simplification are safer than expansion.");
    }

    if (
        raw === "The field is open enough for one useful contact." ||
        raw === "Поле достаточно открыто для одного полезного контакта."
    ) {
        return safeTranslated(t, "decisionReasonUsefulContact", "The field is open enough for one useful contact.");
    }

    return raw;
}

function normalizeDecisionStep(stepText, t) {
    const raw = String(stepText || "").trim();

    if (!raw) {
        return safeTranslated(t, "unknownWord", "—");
    }

    if (raw === "reopen one alternative before committing") {
        return safeTranslated(t, "stepReopenAlternative", raw);
    }

    if (raw === "finish one concrete task") {
        return safeTranslated(t, "stepFinishTask", raw);
    }

    if (raw === "reduce load") {
        return safeTranslated(t, "stepReduceLoad", raw);
    }

    if (raw === "choose one safe contact only") {
        return safeTranslated(t, "stepSafeContact", raw);
    }

    if (raw === "test safely") {
        return safeTranslated(t, "stepTestSafely", raw);
    }

    if (raw === "hold position") {
        return safeTranslated(t, "stepHoldPosition", raw);
    }

    if (raw === "avoid multitasking") {
        return safeTranslated(t, "stepAvoidMultitasking", raw);
    }

    if (raw === "avoid forcing certainty too early") {
        return safeTranslated(t, "stepAvoidEarlyCertainty", raw);
    }

    if (raw === "avoid pressure decisions") {
        return safeTranslated(t, "stepAvoidPressureDecisions", raw);
    }

    if (raw === "avoid emotional escalation") {
        return safeTranslated(t, "stepAvoidEmotionalEscalation", raw);
    }

    if (raw === "avoid rigid commitments") {
        return safeTranslated(t, "stepAvoidRigidCommitments", raw);
    }

    if (raw === "keep communication narrow and direct") {
        return safeTranslated(t, "stepInteractNarrow", raw);
    }

    if (
        raw === "observe the field and avoid impulsive actions" ||
        raw === "Observe the field and avoid impulsive actions." ||
        raw === "Observe the field."
    ) {
        return safeTranslated(t, "observeField", "Observe the field.");
    }

    return raw;
}

function metricCard(label, value) {
    return `
        <div style="
            border:1px solid rgba(255,255,255,0.07);
            border-radius:14px;
            padding:12px;
            background:rgba(255,255,255,0.02);
            text-align:center;
        ">
            <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">${label}</div>
            <div style="font-size:16px;color:#e8edf5;"><b>${value}</b></div>
        </div>
    `;
}

export function resolveDecisionTargetsLocal(deps = {}) {
    const {
        getCurrentUserName = () => "",
        getSelectedDecisionTarget = () => "",
        getState = () => window.MTOS_STATE || {},
        getDecision = () => window.mtosDecision || {},
        getRelations = () => window.currentNetworkRelations || []
    } = deps;

    const currentName = getCurrentUserName();
    const state = getState();
    const decision = state?.decision || getDecision() || {};
    const mode = String(decision?.mode || "EXPLORE").toUpperCase();
    const relations = Array.isArray(getRelations()) ? getRelations() : [];

    if (!currentName || !relations.length) {
        return {
            primary: [],
            avoid: [],
            neutral: []
        };
    }

    const mapped = relations
        .filter((r) => r && (r.source === currentName || r.target === currentName))
        .map((r) => {
            const other = r.source === currentName ? r.target : r.source;
            const score = Number(r.adjustedScore ?? r.score ?? r.displayScore ?? r.strength ?? 0);
            const label = String(r.label || r.type || "neutral");
            const isContact = !!r.isTodayRealContact;
            const urgency = Number(r.urgency ?? 0);
            const timePressure = Number(r.timePressure ?? 0);

            let priority = score;

            if (mode === "INTERACT") {
                priority += isContact ? 0.22 : 0;
                priority += score > 0 ? 0.18 : -0.12;
            } else if (mode === "FOCUS") {
                priority += score > 0 ? 0.08 : -0.18;
                priority -= urgency * 0.08;
            } else if (mode === "ADJUST") {
                priority += score > 0 ? 0.04 : -0.08;
                priority -= Math.abs(score) * 0.04;
                priority -= urgency * 0.10;
            } else if (mode === "REST") {
                priority -= Math.abs(score) * 0.18;
                priority -= urgency * 0.12;
            } else {
                priority += score > 0 ? 0.06 : -0.06;
            }

            return {
                name: other,
                score: Number(score.toFixed(3)),
                label,
                isTodayRealContact: isContact,
                urgency: Number(urgency.toFixed(3)),
                timePressure: Number(timePressure.toFixed(3)),
                priority: Number(priority.toFixed(3))
            };
        });

    const primary = mapped
        .filter((x) => x.score > 0.12)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);

    const avoid = mapped
        .filter((x) => x.score < -0.12)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3);

    const used = new Set([
        ...primary.map((x) => x.name),
        ...avoid.map((x) => x.name)
    ]);

    const neutral = mapped
        .filter((x) => !used.has(x.name))
        .sort((a, b) => Math.abs(a.score) - Math.abs(b.score))
        .slice(0, 3);

    return { primary, avoid, neutral };
}

export function renderFieldTensionPanel(deps = {}) {
    const {
        t = (x) => x,
        getDayState = () => window.mtosDayState || {},
        getTimePressureSummary = () => window.mtosTimePressureSummary || {},
        getMetabolicMetrics = () => window.mtosMetabolicMetrics || {},
        getCollectiveState = () => window.mtosCollectiveState || {}
    } = deps;

    const root = document.getElementById("fieldTensionPanel");
    if (!root) return;

    const ds = getDayState();
    const tp = getTimePressureSummary();
    const metabolic = getMetabolicMetrics();
    const collective = getCollectiveState();

    const pressure = Number(tp.value ?? ds.pressure ?? 0);
    const stability = Number(ds.stability ?? collective.stability ?? 0.5);
    const phi = Number(metabolic.phi ?? collective.phi ?? 0);
    const k = Number(metabolic.k ?? collective.k ?? 0);
    const consistency = Number(metabolic.consistency ?? collective.consistency ?? 0);
    const temp = Number(metabolic.T ?? collective.temperature ?? 0.5);

    const tensionLevel =
        pressure >= 0.75 ? safeTranslated(t, "highTension", "High") :
        pressure >= 0.45 ? safeTranslated(t, "mediumTension", "Medium") :
        safeTranslated(t, "lowTension", "Low");

    const gradientText =
        consistency >= 0.22 ? safeTranslated(t, "uneven", "Uneven") :
        consistency >= 0.10 ? safeTranslated(t, "mixed", "Mixed") :
        safeTranslated(t, "stable", "Stable");

    const interpretationText =
        pressure >= 0.75 ? safeTranslated(t, "fieldCompressed", "The field is compressed.") :
        pressure >= 0.45 ? safeTranslated(t, "fieldActive", "The field is active.") :
        safeTranslated(t, "fieldOpen", "The field is open.");

    root.innerHTML = `
        <div style="
            border:1px solid rgba(255,255,255,0.08);
            border-radius:18px;
            padding:14px;
            background:rgba(0,0,0,0.18);
        ">
            <div style="
                font-size:13px;
                letter-spacing:0.10em;
                text-transform:uppercase;
                color:#aab4c3;
                margin-bottom:14px;
                text-align:center;
            ">
                ${safeTranslated(t, "fieldTension", "FIELD TENSION")}
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(3, minmax(0, 1fr));
                gap:12px;
                margin-bottom:14px;
            ">
                ${metricCard(safeTranslated(t, "pressure", "Pressure"), pressure.toFixed(2))}
                ${metricCard(safeTranslated(t, "stability", "Stability"), stability.toFixed(2))}
                ${metricCard(safeTranslated(t, "consistency", "Consistency"), consistency.toFixed(2))}
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(3, minmax(0, 1fr));
                gap:12px;
                margin-bottom:14px;
            ">
                ${metricCard("Φ", phi.toFixed(2))}
                ${metricCard("k", k.toFixed(2))}
                ${metricCard("T", temp.toFixed(2))}
            </div>

            <div style="
                border:1px solid rgba(255,255,255,0.07);
                border-radius:14px;
                padding:12px;
                background:rgba(255,255,255,0.02);
                text-align:center;
                margin-bottom:10px;
            ">
                <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">${safeTranslated(t, "gradient", "Gradient")}</div>
                <div style="font-size:15px;color:#e8edf5;"><b>${gradientText}</b></div>
            </div>

            <div style="
                border:1px solid rgba(255,255,255,0.07);
                border-radius:14px;
                padding:12px;
                background:rgba(255,255,255,0.02);
                text-align:center;
                margin-bottom:10px;
            ">
                <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">${safeTranslated(t, "interpretation", "Interpretation")}</div>
                <div style="font-size:15px;color:#e8edf5;"><b>${tensionLevel}</b></div>
            </div>

            <div style="
                font-size:13px;
                color:#cbd5e1;
                text-align:center;
                line-height:1.45;
                margin-top:8px;
            ">
                ${interpretationText}
            </div>
        </div>
    `;
}

export function renderDecisionTargetsPanel(deps = {}) {
    const {
        t = (x) => x,
        getState = () => window.MTOS_STATE || {},
        getSelectedDecisionTarget = () => "",
        setSelectedDecisionTarget = () => {},
        resolveDecisionTargets = () => ({ primary: [], avoid: [], neutral: [] }),
        renderDecisionSummaryPanel = () => {},
        renderSystemDecisionPanel = () => {},
        renderActionTracePanel = () => {}
    } = deps;

    const root = document.getElementById("mtosTargetsPanel");
    if (!root) return;

    const state = getState();
const targets =
    state?.decision?.targets && typeof state.decision.targets === "object"
        ? state.decision.targets
        : resolveDecisionTargets();

const selectedName = getSelectedDecisionTarget();

const groupedAgents = [
    ...(Array.isArray(targets.primary) ? targets.primary : []),
    ...(Array.isArray(targets.neutral) ? targets.neutral : []),
    ...(Array.isArray(targets.avoid) ? targets.avoid : [])
];

const relationAgents = Array.isArray(window.currentNetworkRelations)
    ? window.currentNetworkRelations.flatMap((rel) => {
        const items = [];
        const source = String(rel?.source || "").trim();
        const target = String(rel?.target || "").trim();

        if (source) {
            items.push({
                name: source,
                score: 0,
                label: ""
            });
        }

        if (target) {
            items.push({
                name: target,
                score: 0,
                label: ""
            });
        }

        return items;
    })
    : [];

const allAgents = [...groupedAgents, ...relationAgents];

const uniqueAgents = [];
const seenAgents = new Set();

allAgents.forEach((item) => {
    const name = String(item?.name || "").trim();
    if (!name || seenAgents.has(name)) return;
    seenAgents.add(name);

    const existing =
        groupedAgents.find((x) => String(x?.name || "").trim() === name) ||
        item;

    uniqueAgents.push({
        ...existing,
        name,
        score: Number(existing?.score ?? 0),
        label: existing?.label || ""
    });
    uniqueAgents.sort((a, b) =>
    String(a.name).localeCompare(String(b.name), "ru", { sensitivity: "base" })
);
});

    const topGroups = [
        {
            title: safeTranslated(t, "bestContactNow", "BEST CONTACT NOW"),
            items: Array.isArray(targets.primary) ? targets.primary : [],
            color: "#00ff88",
            empty: safeTranslated(t, "noPrimaryTargets", "No primary targets")
        },
        {
            title: safeTranslated(t, "possibleContacts", "POSSIBLE CONTACTS"),
            items: Array.isArray(targets.neutral) ? targets.neutral : [],
            color: "#cbd5e1",
            empty: safeTranslated(t, "noNeutralTargets", "No neutral targets")
        },
        {
            title: safeTranslated(t, "avoidToday", "AVOID TODAY"),
            items: Array.isArray(targets.avoid) ? targets.avoid : [],
            color: "#ff7a7a",
            empty: safeTranslated(t, "noAvoidTargets", "No avoid targets")
        }
    ];

    const allAgentsGroup = {
        title: safeTranslated(t, "allAgents", "ALL AGENTS"),
        items: uniqueAgents,
        color: "#9aa4b2",
        empty: safeTranslated(t, "noAgentsFound", "No agents found")
    };

    const renderItem = (item, color) => {
        const isSelected = item.name === selectedName;

        return `
            <button
                type="button"
                data-target-name="${item.name}"
                style="
                    width:100%;
                    height:100%;
                    text-align:left;
                    padding:10px 12px;
                    border-radius:12px;
                    border:1px solid ${isSelected ? "rgba(0,255,136,0.24)" : "rgba(255,255,255,0.07)"};
                    background:${isSelected ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.02)"};
                    color:#e8edf5;
                    cursor:pointer;
                    margin-bottom:0;
                "
            >
                <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:10px;
                    align-items:center;
                ">
                    <div style="
                        font-size:14px;
                        font-weight:700;
                        color:${color};
                        line-height:1.2;
                        word-break:break-word;
                    ">
                        ${item.name}
                    </div>

                    <div style="
                        font-size:11px;
                        color:${isSelected ? "#00ff88" : "#94a3b8"};
                        text-transform:uppercase;
                        letter-spacing:0.08em;
                        white-space:nowrap;
                        flex-shrink:0;
                    ">
                        ${isSelected ? safeTranslated(t, "selected", "SELECTED") : safeTranslated(t, "select", "SELECT")}
                    </div>
                </div>

                <div style="
                    margin-top:5px;
                    font-size:12px;
                    color:#94a3b8;
                    line-height:1.3;
                ">
                    ${safeTranslated(t, "scoreWord", "Score")}: ${Number(item.score ?? 0).toFixed(2)}
                    ${item.isTodayRealContact ? ` · ${safeTranslated(t, "realContact", "Real contact")}` : ""}
                </div>
            </button>
        `;
    };

    root.innerHTML = `
        <div style="
            border:1px solid rgba(255,255,255,0.08);
            border-radius:18px;
            padding:14px;
            background:rgba(0,0,0,0.18);
        ">
            <div style="
                font-size:13px;
                letter-spacing:0.10em;
                text-transform:uppercase;
                color:#aab4c3;
                margin-bottom:14px;
                text-align:center;
            ">
                ${safeTranslated(t, "decisionTargets", "DECISION TARGETS")}
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(3, minmax(0, 1fr));
                gap:12px;
                margin-bottom:14px;
            ">
                ${topGroups.map((group) => `
                    <div style="
                        border:1px solid rgba(255,255,255,0.06);
                        border-radius:14px;
                        padding:10px;
                        background:rgba(255,255,255,0.01);
                        min-width:0;
                    ">
                        <div style="
                            font-size:12px;
                            color:${group.color};
                            margin-bottom:10px;
                            text-transform:uppercase;
                            letter-spacing:0.08em;
                            text-align:center;
                        ">
                            ${group.title}
                        </div>

                        <div style="
                            display:grid;
                            grid-template-columns:1fr;
                            gap:8px;
                        ">
                            ${
                                group.items.length
                                    ? group.items.map((item) => renderItem(item, group.color)).join("")
                                    : `
                                        <div style="
                                            color:#94a3b8;
                                            font-size:13px;
                                            text-align:center;
                                            padding:10px 6px;
                                        ">
                                            ${group.empty}
                                        </div>
                                    `
                            }
                        </div>
                    </div>
                `).join("")}
            </div>

            <div style="
                border:1px solid rgba(255,255,255,0.06);
                border-radius:14px;
                padding:12px;
                background:rgba(255,255,255,0.01);
            ">
                <div style="
                    font-size:12px;
                    color:${allAgentsGroup.color};
                    margin-bottom:10px;
                    text-transform:uppercase;
                    letter-spacing:0.08em;
                    text-align:center;
                ">
                    ${allAgentsGroup.title}
                </div>

                ${
                    allAgentsGroup.items.length
                        ? `
                            <div style="
                                display:grid;
                                grid-template-columns:repeat(3, minmax(0, 1fr));
                                gap:12px;
                                align-items:start;
                            ">
                                ${allAgentsGroup.items.map((item) => renderItem(item, allAgentsGroup.color)).join("")}
                            </div>
                        `
                        : `
                            <div style="
                                color:#94a3b8;
                                font-size:13px;
                                text-align:center;
                                padding:10px 6px;
                            ">
                                ${allAgentsGroup.empty}
                            </div>
                        `
                }
            </div>
        </div>
    `;

    root.querySelectorAll("[data-target-name]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const name = String(btn.getAttribute("data-target-name") || "").trim();
            if (!name) return;

            setSelectedDecisionTarget(name);

            const stateNow = getState();
            const currentTargets =
                stateNow?.decision?.targets ||
                resolveDecisionTargets();

            const allTargets = [
                ...(Array.isArray(currentTargets.primary) ? currentTargets.primary : []),
                ...(Array.isArray(currentTargets.neutral) ? currentTargets.neutral : []),
                ...(Array.isArray(currentTargets.avoid) ? currentTargets.avoid : [])
            ];

            const selectedTarget =
                allTargets.find((x) => x.name === name) || {
                    name,
                    score: 0,
                    label: safeTranslated(t, "manualTarget", "Manual target")
                };

            if (typeof window.updateMTOSBranch === "function") {
                window.updateMTOSBranch("decision", {
                    ...(stateNow?.decision || {}),
                    targets: currentTargets,
                    selectedTarget
                });
            }

            renderDecisionSummaryPanel("humanLayer");
            renderSystemDecisionPanel();
            renderDecisionTargetsPanel(deps);
            renderActionTracePanel();
        });
    });
}

export function renderActionTracePanel(deps = {}) {
    const {
        t = (x) => x,
        translateModeLabel = null,
        translateRiskLabel = null,
        getDecision = () => window.mtosDecision || {},
        getDayState = () => window.mtosDayState || {},
        getTimePressureSummary = () => window.mtosTimePressureSummary || {},
        getState = () => window.MTOS_STATE || {}
    } = deps;

    const root = document.getElementById("actionTracePanel");
    if (!root) return;

    const decision = getDecision();
    const ds = getDayState();
    const tp = getTimePressureSummary();
    const selectedTarget = getState()?.decision?.selectedTarget || null;

    const modeTranslator =
    typeof window.translateModeLabel === "function"
        ? window.translateModeLabel
        : typeof translateModeLabel === "function"
            ? translateModeLabel
            : (value) => translateModeLocal(value, t);

const riskTranslator =
    typeof window.translateRiskLabel === "function"
        ? window.translateRiskLabel
        : typeof translateRiskLabel === "function"
            ? translateRiskLabel
            : (value) => translateRiskLocal(value, t);

    const safeTraceValue = (value, fallback = "—") => {
        if (value === null || value === undefined) return fallback;

        if (typeof value === "object") {
            if ("label" in value && value.label) return String(value.label);
            if ("level" in value && value.level) return String(value.level);
            if ("name" in value && value.name) return String(value.name);
            if ("text" in value && value.text) return String(value.text);
            if ("value" in value && value.value !== undefined && value.value !== null) {
                return String(value.value);
            }
            return fallback;
        }

        const str = String(value).trim();
        return str ? str : fallback;
    };

    const rows = [
        {
            label: safeTranslated(t, "mode", "Mode"),
            value: modeTranslator(safeTraceValue(decision.mode))
        },
        {
            label: safeTranslated(t, "risk", "Risk"),
            value: riskTranslator(
                String(
                    typeof decision.risk === "object"
                        ? (decision.risk.level || decision.risk.label || "LOW")
                        : (decision.risk || decision.riskLabel || "LOW")
                ).toUpperCase()
            )
        },
        {
            label: safeTranslated(t, "nextMove", "Next move"),
            value: normalizeDecisionStep(
                safeTraceValue(decision.nextStep || decision.text || decision.action),
                t
            )
        },
        {
            label: safeTranslated(t, "day_type", "Day type"),
            value: modeTranslator(safeTraceValue(ds.dayLabel))
        },
        {
            label: safeTranslated(t, "temporalModeLabel", "Temporal mode"),
            value: modeTranslator(safeTraceValue(tp.temporalMode))
        },
        {
            label: safeTranslated(t, "selectedTarget", "Selected target"),
            value: safeTraceValue(selectedTarget?.name)
        }
    ];

    root.innerHTML = `
        <div style="
            border:1px solid rgba(255,255,255,0.08);
            border-radius:18px;
            padding:14px;
            background:rgba(0,0,0,0.18);
        ">
            <div style="
                font-size:13px;
                letter-spacing:0.10em;
                text-transform:uppercase;
                color:#aab4c3;
                margin-bottom:14px;
                text-align:center;
            ">
                ${safeTranslated(t, "actionTrace", "ACTION TRACE")}
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(2, minmax(0, 1fr));
                gap:10px;
            ">
                ${rows.map((row) => `
                    <div style="
                        border:1px solid rgba(255,255,255,0.07);
                        border-radius:12px;
                        padding:10px 12px;
                        background:rgba(255,255,255,0.02);
                    ">
                        <div style="
                            font-size:11px;
                            color:#94a3b8;
                            letter-spacing:0.08em;
                            text-transform:uppercase;
                            margin-bottom:6px;
                        ">${row.label}</div>

                        <div style="
                            font-size:14px;
                            color:#e8edf5;
                            line-height:1.35;
                            word-break:break-word;
                        ">${row.value}</div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

export function renderSystemEventsPanel(deps = {}) {
    const {
        t = (x) => x,
        getState = () => window.MTOS_STATE || {}
    } = deps;

    const root = document.getElementById("mtosEventPanel");
    if (!root) return;

    const events = Array.isArray(getState()?.events) ? getState().events : [];
    const latest = events.slice(-5).reverse();

    const renderEventCard = (item) => `
        <div style="
            border:1px solid rgba(255,255,255,0.07);
            border-radius:14px;
            padding:12px 14px;
            background:rgba(255,255,255,0.02);
            margin-bottom:8px;
        ">
            <div style="
                display:flex;
                justify-content:center;
                align-items:center;
                gap:8px;
                flex-wrap:wrap;
                margin-bottom:10px;
            ">
                <span style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    padding:5px 10px;
                    border-radius:999px;
                    border:1px solid rgba(255,255,255,0.10);
                    background:rgba(255,255,255,0.03);
                    font-size:11px;
                    color:#cbd5e1;
                    text-transform:uppercase;
                    letter-spacing:0.08em;
                    white-space:nowrap;
                ">
                    ${normalizeEventType(item, t)}
                </span>

                <span style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    padding:5px 10px;
                    border-radius:999px;
                    border:1px solid rgba(255,255,255,0.10);
                    background:rgba(255,255,255,0.03);
                    font-size:11px;
                    color:#cbd5e1;
                    text-transform:uppercase;
                    letter-spacing:0.08em;
                    white-space:nowrap;
                ">
                    ${normalizeRiskLevel(item, t)}
                </span>
            </div>

            <div style="
                font-size:15px;
                color:#e8edf5;
                line-height:1.45;
                text-align:center;
            ">
                ${normalizeEventText(item, t)}
            </div>
        </div>
    `;

    root.innerHTML = `
        <div style="
            border:1px solid rgba(255,255,255,0.08);
            border-radius:18px;
            padding:14px;
            background:rgba(0,0,0,0.18);
        ">
            ${
                latest.length
                    ? latest.map((item) => renderEventCard(item)).join("")
                    : renderEventCard({
                        type: "background",
                        level: "low",
                        text: "No major event threshold reached."
                    })
            }
        </div>
    `;
}

export function renderSystemDecisionPanel(deps = {}) {
    const {
        t = (x) => x,
        translateModeLabel = null,
        translateRelationLabel = (x) => x,
        getState = () => window.MTOS_STATE || {}
    } = deps;

    const root = document.getElementById("mtosDecisionPanel");
    if (!root) return;

    const state = getState();
    const decision = state?.decision || null;
    const selectedTarget = decision?.selectedTarget || null;

    if (!decision) {
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
                ${safeTranslated(t, "noSystemDecisionYet", "No system decision yet")}
            </div>
        `;
        return;
    }

    const fallbackTranslateMode = (value) => {
        const mode = String(value || "").toUpperCase();

        if (mode === "FOCUS") return safeTranslated(t, "modeFocus", "FOCUS");
        if (mode === "ADJUST") return safeTranslated(t, "modeAdjust", "ADJUST");
        if (mode === "REST") return safeTranslated(t, "modeRest", "REST");
        if (mode === "INTERACT") return safeTranslated(t, "modeInteract", "INTERACT");
        if (mode === "EXPLORE") return safeTranslated(t, "modeExplore", "EXPLORE");

        return value || "—";
    };

    const modeLabel =
    typeof window.translateModeLabel === "function"
        ? window.translateModeLabel(decision?.mode || "EXPLORE")
        : typeof translateModeLabel === "function"
            ? translateModeLabel(decision?.mode || "EXPLORE")
            : fallbackTranslateMode(decision?.mode || "EXPLORE");

    const rawAction =
        decision?.action ||
        decision?.text ||
        "";

    const rawReason =
        decision?.reason ||
        decision?.feedbackReason ||
        decision?.why ||
        "";

    const actionText = normalizeDecisionAction({ ...decision, action: rawAction }, t);
    const reasonText = normalizeDecisionReason(rawReason, t, decision);

    const confidenceRaw = Number(decision?.confidence ?? 50);
    const confidenceValue = Number.isFinite(confidenceRaw)
        ? Math.round(
            confidenceRaw <= 1
                ? Math.max(0, Math.min(1, confidenceRaw)) * 100
                : Math.max(0, Math.min(100, confidenceRaw))
        )
        : 50;

    const targetScore = Number(selectedTarget?.score ?? 0);
    const safeTargetScore = Number.isFinite(targetScore) ? targetScore.toFixed(2) : "0.00";

    const targetLabel =
    selectedTarget?.label
        ? (
            typeof window.translateRelationLabel === "function"
                ? window.translateRelationLabel(selectedTarget.label)
                : translateRelationLabel(selectedTarget.label)
          )
        : "";

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
            <div style="
                font-size:11px;
                letter-spacing:0.16em;
                text-transform:uppercase;
                color:#8b949e;
                margin-bottom:8px;
            ">
                ${safeTranslated(t, "systemOutput", "SYSTEM OUTPUT")}
            </div>

            <div style="
                font-size:28px;
                font-weight:800;
                color:#00ff88;
                line-height:1.1;
            ">
                ${modeLabel}
            </div>

            <div style="
                font-size:16px;
                line-height:1.7;
                color:#e5e7eb;
                margin-top:12px;
            ">
                ${actionText}
            </div>

            <div style="
                font-size:13px;
                color:#9ca3af;
                margin-top:12px;
            ">
                ${safeTranslated(t, "reason", "Reason")}: ${reasonText}
            </div>

            <div style="
                font-size:13px;
                color:#9ca3af;
                margin-top:6px;
            ">
                ${safeTranslated(t, "confidence", "Confidence")}: ${confidenceValue}%
            </div>

            ${
                selectedTarget
                    ? `
                        <div style="
                            font-size:13px;
                            color:#9ca3af;
                            margin-top:6px;
                        ">
                            ${safeTranslated(t, "bestTargetNow", "Best target now")}: <span style="color:#00ff88;font-weight:700;">${selectedTarget.name}</span>${targetLabel ? ` • ${targetLabel}` : ""} • ${safeTranslated(t, "score", "Score")}: ${safeTargetScore}
                        </div>
                    `
                    : ""
            }
        </div>
    `;
}

export function renderHistoryEfficiencyPanel(targetId = "historyEfficiencyPanel", deps = {}) {
    const {
        t = (x) => x,
        translateRiskLabel = (x) => x,
        getCurrentUserName = () => "",
        calcModeStats = () => []
    } = deps;

    const historyModeLabel = (mode) => {
        const m = String(mode || "").toUpperCase();
        if (m === "FOCUS") return safeTranslated(t, "modeFocus", "FOCUS");
        if (m === "FLOW") return safeTranslated(t, "modeExplore", "EXPLORE");
        if (m === "EXPLORE") return safeTranslated(t, "modeExplore", "EXPLORE");
        if (m === "REST") return safeTranslated(t, "modeRest", "REST");
        if (m === "INTERACT") return safeTranslated(t, "modeInteract", "INTERACT");
        if (m === "ADJUST") return safeTranslated(t, "modeAdjust", "ADJUST");
        if (m === "UNKNOWN") return safeTranslated(t, "unknownWord", "UNKNOWN");
        return m;
    };

    const root = document.getElementById(targetId);
    if (!root) return;

    const name = getCurrentUserName();
    if (!name) {
        root.innerHTML = "";
        return;
    }

    let rows = [];
    try {
        rows = JSON.parse(localStorage.getItem("mtos_daily_snapshots") || "[]")
            .filter((x) => x && x.name === name)
            .sort((a, b) => String(b.day || "").localeCompare(String(a.day || "")));
    } catch (e) {
        rows = [];
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
                    ${safeTranslated(t, "noHistoryYet", "No history yet")}
                </div>
            </div>
        `;
        return;
    }

    const total = rows.length;
    const good = rows.filter((x) => String(x.feedbackValue || "").toLowerCase() === "good").length;
    const neutral = rows.filter((x) => String(x.feedbackValue || "").toLowerCase() === "neutral").length;
    const bad = rows.filter((x) => String(x.feedbackValue || "").toLowerCase() === "bad").length;

    const hitRate = total ? ((good / total) * 100).toFixed(1) : "0.0";
    const antiFailRate = total ? (((good + neutral) / total) * 100).toFixed(1) : "0.0";

    const avgPredictability = total
        ? (
            rows.reduce((sum, row) => sum + Number(row.systemPredictability ?? row.predictability ?? 0), 0) / total
        ).toFixed(1)
        : "0.0";

    const avgTimePressure = total
        ? (
            rows.reduce((sum, row) => sum + Number(row.timePressure ?? 0), 0) / total
        ).toFixed(2)
        : "0.00";

    const rawModeStats = calcModeStats(rows);
    const modeStats = Array.isArray(rawModeStats)
        ? rawModeStats
        : Object.entries(rawModeStats || {}).map(([mode, item]) => {
            const safeItem = item || {};
            const totalLocal = Number(safeItem.total ?? 0);
            const goodLocal = Number(safeItem.good ?? 0);
            const neutralLocal = Number(safeItem.neutral ?? 0);
            const badLocal = Number(safeItem.bad ?? 0);
            const score = totalLocal
                ? Number(((goodLocal * 1.0 + neutralLocal * 0.15 - badLocal * 1.2) / totalLocal).toFixed(3))
                : 0;

            return {
                mode,
                total: totalLocal,
                good: goodLocal,
                neutral: neutralLocal,
                bad: badLocal,
                score
            };
        });

    const dayTypeStatsMap = {};
    rows.forEach((row) => {
        const label = String(row.dayLabel || "UNKNOWN").toUpperCase();

        if (!dayTypeStatsMap[label]) {
            dayTypeStatsMap[label] = {
                label,
                total: 0,
                good: 0,
                neutral: 0,
                bad: 0,
                score: 0
            };
        }

        dayTypeStatsMap[label].total += 1;

        const fb = String(row.feedbackValue || "").toLowerCase();

        if (fb === "good") dayTypeStatsMap[label].good += 1;
        else if (fb === "bad") dayTypeStatsMap[label].bad += 1;
        else dayTypeStatsMap[label].neutral += 1;
    });

    const dayTypeStats = Object.values(dayTypeStatsMap);
    dayTypeStats.forEach((item) => {
        item.score = item.total
            ? Number(((item.good * 1.0 + item.neutral * 0.15 - item.bad * 1.2) / item.total).toFixed(3))
            : 0;
    });

    dayTypeStats.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.total - a.total;
    });

    const recentRows = rows.slice(0, 7);

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
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${safeTranslated(t, "days", "Days")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;">${total}</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${safeTranslated(t, "good", "Good")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#00ff88;">${good}</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${safeTranslated(t, "bad", "Bad")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#ff6666;">${bad}</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${safeTranslated(t, "hit_rate", "Hit rate")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#66ccff;">${hitRate}%</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${safeTranslated(t, "antiFail", "Anti-fail")}</div>
                    <div style="font-size:24px;font-weight:800;margin-top:6px;color:#c084fc;">${antiFailRate}%</div>
                </div>

                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px;color:#8b949e;text-transform:uppercase;">${safeTranslated(t, "avgPredictability", "Avg predictability")}</div>
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
                    <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:10px;">${safeTranslated(t, "modeEfficiency", "Mode efficiency")}</div>
                    ${
                        Array.isArray(modeStats)
                            ? modeStats.map((item) => `
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
                                    <div style="color:${item.score >= 0 ? "#00ff88" : "#ff6666"};">${Number(item.score ?? 0).toFixed(2)}</div>
                                </div>
                            `).join("")
                            : ""
                    }
                </div>

                <div style="padding:16px;border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:10px;">${safeTranslated(t, "dayTypeEfficiency", "Day type efficiency")}</div>
                    ${dayTypeStats.map((item) => `
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
                <div style="font-size:12px;font-weight:700;color:#ffffff;margin-bottom:10px;">${safeTranslated(t, "recentDays", "Recent days")}</div>

                ${recentRows.map((row) => `
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
                                ${historyModeLabel(row.decisionMode || row.recommendedMode || "UNKNOWN")} · ${safeTranslated(t, "systemWord", "System")} ${Number(row.systemPredictability ?? row.predictability ?? 0).toFixed(0)} · ${safeTranslated(t, "behaviorWord", "Behavior")} ${Number(row.behaviorEfficiency ?? 0).toFixed(2)}
                            </div>
                        </div>

                        <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">
                            ${historyModeLabel(row.decisionMode || row.recommendedMode || "UNKNOWN")} · ${translateRiskLabel(row.decisionRisk || "LOW")} · ${row.feedbackValue ? String(row.feedbackValue).toUpperCase() : safeTranslated(t, "unknownWord", "UNKNOWN")}
                        </div>

                        <div style="font-size:12px;color:${
                            row.feedbackValue === "good" ? "#00ff88" :
                            row.feedbackValue === "bad" ? "#ff6666" : "#d1d5db"
                        };margin-top:4px;">
                            ${row.feedbackValue ? String(row.feedbackValue).toUpperCase() : safeTranslated(t, "no_feedback", "NO FEEDBACK")}
                        </div>
                    </div>
                `).join("")}

                <div style="margin-top:10px;font-size:12px;color:#94a3b8;">
                    ${safeTranslated(t, "averageTimePressure", "Average time pressure")}: <b style="color:#e5e7eb;">${avgTimePressure}</b>
                </div>
            </div>
        </div>
    `;
}