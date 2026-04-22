export function renderDecisionSummaryPanel(targetId = "todayPanel"){
    const root = document.getElementById(targetId)
    if(!root) return

    const ds = window.mtosDayState || {}
    const decision = window.mtosDecision || {}

    const currentDay = window.getCurrentRunDay ? window.getCurrentRunDay() : ""
    const currentUser = window.getCurrentUserName ? window.getCurrentUserName() : ""
    const selectedTarget = window.MTOS_STATE?.decision?.selectedTarget || null

    const decisionTargets =
        window.MTOS_STATE?.decision?.targets && typeof window.MTOS_STATE.decision.targets === "object"
            ? window.MTOS_STATE.decision.targets
            : (typeof window.resolveDecisionTargets === "function"
                ? window.resolveDecisionTargets()
                : { primary: [], avoid: [], neutral: [] })

    const currentFeedback = typeof window.getHumanFeedbackFor === "function"
        ? window.getHumanFeedbackFor(currentDay, currentUser)
        : null

    const currentFeedbackValue = String(currentFeedback?.value || "").toLowerCase()
    const currentRelationFeedbackValue = String(currentFeedbackValue || "").toLowerCase()

    const feedbackAck = typeof window.getFeedbackAck === "function"
        ? window.getFeedbackAck()
        : null

    const showAck =
        feedbackAck &&
        (Date.now() - Number(feedbackAck.t || 0)) < 7000

    const mode = String(decision.mode || "EXPLORE").toUpperCase()
    const risk = decision.risk || {}
    const riskLabel = String(risk.label || "LOW").toUpperCase()
    const modeLabel = getModeLabel(mode)
    const riskLabelText = getRiskLabelText(riskLabel)
    const riskColor = String(risk.color || "#00ff88")
    const primaryDriver = String(risk.topVectors?.[0] || "none")
    const secondDriver = String(risk.topVectors?.[1] || "")

        function getLang(){
        return window.mtosLang === "ru" ? "ru" : "en"
    }

    const interpretation =
    typeof window.interpretMTOSState === "function"
        ? window.interpretMTOSState({
            pressure: Number(ds?.pressure ?? 0) * 100,
            attention: Number(ds?.attention ?? 0.5) * 100,
            activity: Number(ds?.activity ?? 0.5) * 100,
            entropy: Number(window.mtosUnifiedMetrics?.entropy ?? 0),
            predictability: Number(window.mtosUnifiedMetrics?.predictability ?? 0),
            timePressure: Number(window.mtosTimePressureSummary?.value ?? 0) * 100,
                noise: Number(window.mtosUnifiedMetrics?.noise ?? 0),
                relationTension: Number(window.mtosNetworkFeedback?.conflictRatio ?? 0) * 100,
                mode: mode,
                risk: riskLabel,
                attractorType: String(
    window.mtosRunAttractorState?.type ||
    window.mtosAttractorState?.type ||
    "neutral"
),
                deltaPredictability: 0,
                deltaEntropy: 0,
                deltaPressure: 0,
                deltaActivity: 0
            }, getLang())
            : null

    const attractorSource = window.mtosRunAttractorState || window.mtosAttractorState || {}
const attractorType = String(attractorSource?.type || "unknown").toLowerCase()
const attractorIntensity = Number(attractorSource?.intensity ?? 0)
    const systemStateIndex = Number(window.mtosResolvedState ?? 0)
    const systemN = Number(window._adaptiveModel?.N ?? 0)

    function getSystemStateLabel(type){
    const x = String(type || "unknown").toLowerCase()
    if (x === "chaos") return getLang() === "ru" ? "ХАОС" : "CHAOTIC"
    if (x === "trend") return getLang() === "ru" ? "НАПРАВЛЕНИЕ" : "TREND"
    if (x === "cycle") return getLang() === "ru" ? "ЦИКЛ" : "CYCLIC"
    if (x === "stable") return getLang() === "ru" ? "СТАБИЛЬНОСТЬ" : "STABLE"
    return getLang() === "ru" ? "НЕИЗВЕСТНО" : "UNKNOWN"
}

function getAttractorTypeLabel(type){
    const x = String(type || "unknown").toLowerCase()
    const ru = getLang() === "ru"

    if (x === "chaos") return ru ? "ХАОС" : "CHAOS"
    if (x === "trend") return ru ? "ТРЕНД" : "TREND"
    if (x === "cycle") return ru ? "ЦИКЛ" : "CYCLE"
    if (x === "stable") return ru ? "СТАБИЛЬНОСТЬ" : "STABLE"
    return ru ? "НЕИЗВЕСТНО" : "UNKNOWN"
}

    function getSystemStateColor(type){
        const x = String(type || "unknown").toLowerCase()
        if (x === "chaos") return "#ff6666"
        if (x === "trend") return "#ffb347"
        if (x === "cycle") return "#66ccff"
        if (x === "stable") return "#00ff88"
        return "#d1d5db"
    }

    function getBehaviorStateLabel(mode, riskLabel){
    if (interpretation?.title) {
        return String(interpretation.title).toUpperCase()
    }

    const m = String(mode || "EXPLORE").toUpperCase()
    const r = String(riskLabel || "LOW").toUpperCase()
    const ru = getLang() === "ru"

    if (m === "REST" && r === "HIGH") return ru ? "ЗАЩИТА" : "PROTECTIVE"
    if (m === "ADJUST") return ru ? "АДАПТИВНОСТЬ" : "ADAPTIVE"
    if (m === "FOCUS") return ru ? "КОНТРОЛЬ" : "CONTROLLED"
    if (m === "INTERACT") return ru ? "ОТКРЫТОСТЬ" : "OPEN"
    return ru ? "ИССЛЕДОВАНИЕ" : "EXPLORATORY"
}

    function getBehaviorStateColor(mode, riskLabel){
    const key = String(interpretation?.stateKey || "").toLowerCase()

    if (key === "recovery") return "#c084fc"
    if (key === "compression") return "#ffb347"
    if (key === "overheating") return "#ff6666"
    if (key === "contactwindow") return "#66ccff"
    if (key === "focusflow") return "#00ff88"
    if (key === "transition") return "#d1d5db"
    if (key === "exploration") return "#00ff88"

    const m = String(mode || "EXPLORE").toUpperCase()
    const r = String(riskLabel || "LOW").toUpperCase()

    if (m === "REST" && r === "HIGH") return "#ff6666"
    if (m === "ADJUST") return "#00ff88"
    if (m === "FOCUS") return "#00ff88"
    if (m === "INTERACT") return "#66ccff"
    return "#d1d5db"
}

    function getLayerBridgeText(systemType, mode, riskScore){
    const sys = String(systemType || "unknown").toLowerCase()
    const m = String(mode || "EXPLORE").toUpperCase()
    const r = Number(riskScore ?? 0)

    if (sys === "chaos" && r < 0.30) {
        return getText("bridgeSystemChaosControlled")
    }
    if (sys === "chaos" && m === "ADJUST") {
        return getText("bridgeSystemChaosAdaptive")
    }
    if (sys === "trend" && m === "ADJUST") {
        return getText("bridgeSystemTrendAdaptive")
    }
    if (sys === "cycle" && m === "INTERACT") {
        return getText("bridgeSystemCycleInteract")
    }
    if (sys === "stable" && m === "FOCUS") {
        return getText("bridgeSystemStableFocus")
    }

    return getText("bridgeSystemBehaviorRelated")
}

    const systemStateLabel = getSystemStateLabel(attractorType)
    const systemStateColor = getSystemStateColor(attractorType)
    const behaviorStateLabel = getBehaviorStateLabel(mode, riskLabel)
    const behaviorStateColor = getBehaviorStateColor(mode, riskLabel)
    const layerBridgeText = interpretation?.trajectoryText || getLayerBridgeText(attractorType, mode, Number(risk.score ?? 0))

    function resolveNextStepKey(mode){
    if (mode === "FOCUS") return "doFocus"
    if (mode === "ADJUST") return "doAdjust"
    if (mode === "REST") return "doRest"
    if (mode === "INTERACT") return "doInteract"
    return "doExplore"
}

const nextStep = interpretation?.lite?.do?.[0] || getText(resolveNextStepKey(mode))

    function resolveAvoidKey(mode){
    if (mode === "FOCUS") return "avoidFocus"
    if (mode === "ADJUST") return "avoidAdjust"
    if (mode === "REST") return "avoidRest"
    if (mode === "INTERACT") return "avoidInteract"
    return "avoidExplore"
}

const avoidNow = interpretation?.lite?.avoid?.[0] || getText(resolveAvoidKey(mode))

    function t(key){
        if (typeof window.t === "function") return window.t(key)
        return getText(key)
    }

    function getText(key){
        const lang = getLang()

        const TEXT = {
            en: {
                learningSignal: "Learning Signal",
                feedback: "Feedback",
                mode: "Mode",
                risk: "Risk",
                nextMove: "Next Move",
                avoid: "Avoid",
                do: "Do",
                currentBestPosture: "Current best posture",
                adjustedByLearning: "Adjusted by learning",
                primary: "Primary",
                secondary: "Secondary",
                noSecondaryDriver: "No secondary driver",
                modeRiskAligned: "Mode / risk aligned",
                learningAdjusted: "Learning-adjusted",
                selectedTarget: "Selected target",
                wasContactUseful: "Was contact with this person actually useful today?",
                wasModeUseful: "Was today's mode actually useful for you?",
                feedbackSaved: "Feedback saved",
                manualFeedbackNote: "Manual feedback updates learning for similar states and also modifies the selected relation in Network / Collective.",
                good: "Good",
                neutral: "Neutral",
                bad: "Bad",
                todaySummary: "Today Summary",
                modeFocus: "FOCUS",
                modeAdjust: "ADJUST",
                modeRest: "REST",
                modeExplore: "EXPLORE",
                modeInteract: "INTERACT",

                riskLow: "LOW",
                riskMedium: "MEDIUM",
                riskHigh: "HIGH",
                riskCritical: "CRITICAL",

                holdPosition: "hold position",
                avoidUnnecessaryActions: "avoid unnecessary actions",

                rigidity: "tendency to lock into one idea too early",
                drift: "attention may scatter across multiple paths",
                overload: "too many active pressures",
                social: "reactivity in interactions",
                backgroundDynamics: "background dynamics",

                bridgeAdjustRigidity: "Risk is low, but fixation is rising. Best posture: adjust, not tighten.",
                bridgeFocusLowDrift: "Risk is low, but attention may scatter. Best posture: focus.",
                bridgeRestLow: "Overall risk is low, but overload is still the main driver. Better to simplify than expand.",
                bridgeInteractLow: "Risk is low and the field is socially open. One clean contact is favored.",
                bridgeExploreLow: "Risk is low and no single hard constraint dominates. Exploration is acceptable.",
                bridgeFocusMedium: "The field is not dangerous, but it loses efficiency when split into many branches.",
                bridgeRest: "The safest move is load reduction and reversible action.",
                bridgeInteract: "The field supports contact, but only if interaction stays narrow and clean.",
                bridgeFallback: "Mode derived from the dominant risk vector.",

                earlyWorks: "Early feedback suggests this mode may work well in similar states.",
                earlyUnderperform: "Early feedback suggests this mode may underperform in similar states.",
                earlyMixed: "The pattern is still mixed and not stable yet.",
                altLearnedMode: "Alternative learned mode",

                primaryDriverLabel: "Primary driver",
                secondaryDriverLabel: "Secondary driver",
                overallRisk: "Overall risk",
                stabilityGood: "Stability is good",
                stabilityWeak: "Stability is weak",
                noDominantReason: "No dominant reason detected.",

                doFocus: "finish one concrete task",
                avoidFocus: "avoid multitasking",
                doAdjust: "reopen one alternative before committing",
                avoidAdjust: "avoid forcing certainty too early",
                doRest: "switch to maintenance and recovery",
                avoidRest: "avoid pressure-based decisions",
                doInteract: "choose one safe contact only",
                avoidInteract: "avoid emotional overreach",
                doExplore: "test without full commitment",
                avoidExplore: "avoid premature final decisions",

                notEnoughFeedback1: "Not enough feedback yet.",
                notEnoughFeedback2: "Use Good / Neutral / Bad for several days so the system can adapt to your real patterns.",

                systemVsBehavior: "System State vs Behavior State",
systemState: "System State",
behaviorState: "Behavior State",
attractor: "Attractor",
state: "State",
intensity: "Intensity",
behaviorRisk: "Behavior Risk",
nextMoveLabel: "Next move",

bridgeSystemChaosControlled: "System field is unstable, but behavior is still controlled.",
bridgeSystemChaosAdaptive: "System field is unstable, so behavior shifts to adaptive control.",
bridgeSystemTrendAdaptive: "System pushes in one direction, so behavior stays flexible instead of locking in.",
bridgeSystemCycleInteract: "System is in a cyclic resonance window, and behavior is open for coordination.",
bridgeSystemStableFocus: "System is stable enough for concentrated behavior.",
bridgeSystemBehaviorRelated: "System state and behavior are related, but not identical.",

            },
            ru: {
                learningSignal: "Сигнал обучения",
                feedback: "Обратная связь",
                mode: "Режим",
                risk: "Риск",
                nextMove: "Следующий шаг",
                avoid: "Избегать",
                do: "Делать",
                currentBestPosture: "Лучшее текущее положение",
                adjustedByLearning: "Скорректировано обучением",
                primary: "Основной",
                secondary: "Вторичный",
                noSecondaryDriver: "Нет вторичного фактора",
                learningAdjusted: "Скорректировано обучением",
                selectedTarget: "Выбранная цель",
                wasContactUseful: "Был ли контакт с этим человеком полезен сегодня?",
                wasModeUseful: "Был ли сегодняшний режим полезен для тебя?",
                feedbackSaved: "Оценка сохранена",
                manualFeedbackNote: "Ручная оценка обновляет обучение для похожих состояний и также меняет выбранную связь в Network / Collective.",
                good: "Хорошо",
                neutral: "Нейтрально",
                bad: "Плохо",
                todaySummary: "Сводка дня",
                modeFocus: "ФОКУС",
                modeAdjust: "КОРРЕКЦИЯ",
                modeRest: "ОТДЫХ",
                modeExplore: "ИССЛЕДОВАНИЕ",
                modeInteract: "КОНТАКТ",

                riskLow: "НИЗКИЙ",
                riskMedium: "СРЕДНИЙ",
                riskHigh: "ВЫСОКИЙ",
                riskCritical: "КРИТИЧЕСКИЙ",

                holdPosition: "удерживать позицию",
                avoidUnnecessaryActions: "избегать лишних действий",

                rigidity: "склонность слишком рано зафиксироваться на одной идее",
                drift: "внимание может расползтись по нескольким направлениям",
                overload: "слишком много активных давлений",
                social: "реактивность во взаимодействиях",
                backgroundDynamics: "фоновая динамика",

                bridgeAdjustRigidity: "Риск низкий, но фиксация растёт. Лучшее положение: корректировать курс, а не зажиматься.",
                bridgeFocusLowDrift: "Риск низкий, но внимание может распасться. Лучшее положение: фокус.",
                bridgeRestLow: "Общий риск низкий, но главным фактором всё ещё остаётся перегрузка. Лучше упростить, чем расширять.",
                bridgeInteractLow: "Риск низкий, и поле открыто для контакта. Предпочтителен один чистый контакт.",
                bridgeExploreLow: "Риск низкий, и ни одно жёсткое ограничение не доминирует. Исследование допустимо.",
                bridgeFocusMedium: "Поле не опасное, но теряет эффективность, когда делится на слишком много ветвей.",
                bridgeRest: "Самый безопасный ход — снизить нагрузку и сохранять обратимость действий.",
                bridgeInteract: "Поле поддерживает контакт, но только если взаимодействие остаётся узким и чистым.",
                bridgeFallback: "Режим выведен из доминирующего вектора риска.",

                earlyWorks: "Ранние оценки подсказывают, что этот режим может хорошо работать в похожих состояниях.",
                earlyUnderperform: "Ранние оценки подсказывают, что этот режим может работать слабее в похожих состояниях.",
                earlyMixed: "Паттерн пока смешанный и ещё не стабилизировался.",
                altLearnedMode: "Альтернативный выученный режим",

                primaryDriverLabel: "Основной фактор",
                secondaryDriverLabel: "Вторичный фактор",
                overallRisk: "Общий риск",
                stabilityGood: "Стабильность хорошая",
                stabilityWeak: "Стабильность слабая",
                noDominantReason: "Доминирующая причина не выявлена.",

                doFocus: "завершить одну конкретную задачу",
                avoidFocus: "избегать многозадачности",
                doAdjust: "переоткрыть одну альтернативу перед фиксацией",
                avoidAdjust: "не форсировать определённость слишком рано",
                doRest: "переключиться на поддержку и восстановление",
                avoidRest: "избегать решений под давлением",
                doInteract: "выбрать только один безопасный контакт",
                avoidInteract: "избегать эмоционального перебора",
                doExplore: "проверять без полной фиксации",
                avoidExplore: "избегать преждевременных финальных решений",

                notEnoughFeedback1: "Пока недостаточно обратной связи.",
                notEnoughFeedback2: "Используй Хорошо / Нейтрально / Плохо несколько дней, чтобы система подстроилась под твои паттерны.",

                systemVsBehavior: "Состояние системы vs состояние поведения",
systemState: "Состояние системы",
behaviorState: "Состояние поведения",
attractor: "Аттрактор",
state: "Состояние",
intensity: "Интенсивность",
behaviorRisk: "Риск поведения",
nextMoveLabel: "Следующий ход",

bridgeSystemChaosControlled: "Системное поле нестабильно, но поведение всё ещё остаётся управляемым.",
bridgeSystemChaosAdaptive: "Системное поле нестабильно, поэтому поведение смещается в адаптивный режим.",
bridgeSystemTrendAdaptive: "Система толкает в одном направлении, поэтому поведение остаётся гибким и не фиксируется слишком рано.",
bridgeSystemCycleInteract: "Система вошла в циклическое окно резонанса, и поведение открыто для координации.",
bridgeSystemStableFocus: "Система достаточно стабильна для концентрированного поведения.",
bridgeSystemBehaviorRelated: "Состояние системы и поведение связаны, но не тождественны.",

            }
        }

        return TEXT[lang]?.[key] ?? TEXT.en[key] ?? key
    }

    function getModeLabel(mode){
    if (mode === "FOCUS") return getText("modeFocus")
    if (mode === "ADJUST") return getText("modeAdjust")
    if (mode === "REST") return getText("modeRest")
    if (mode === "INTERACT") return getText("modeInteract")
    return getText("modeExplore")
}

function getRiskLabelText(riskLabel){
    if (riskLabel === "LOW") return getText("riskLow")
    if (riskLabel === "MEDIUM") return getText("riskMedium")
    if (riskLabel === "HIGH") return getText("riskHigh")
    if (riskLabel === "CRITICAL") return getText("riskCritical")
    return riskLabel
}

    function explainDriver(driver){
        if (driver === "rigidity") return getText("rigidity")
        if (driver === "drift") return getText("drift")
        if (driver === "overload") return getText("overload")
        if (driver === "social") return getText("social")
        return getText("backgroundDynamics")
    }

    function explainModeConflict(mode, riskLabel, primaryDriver){
        if (String(window.mtosAttractorState?.type || "").toLowerCase() === "chaos" && String(riskLabel || "").toUpperCase() === "LOW") {
            return getText("bridgeSystemChaosControlled")
        }
        if (mode === "ADJUST" && primaryDriver === "rigidity") return getText("bridgeAdjustRigidity")
        if (mode === "FOCUS" && riskLabel === "LOW" && primaryDriver === "drift") return getText("bridgeFocusLowDrift")
        if (mode === "REST" && riskLabel === "LOW") return getText("bridgeRestLow")
        if (mode === "INTERACT" && riskLabel === "LOW") return getText("bridgeInteractLow")
        if (mode === "EXPLORE" && riskLabel === "LOW") return getText("bridgeExploreLow")
        if (mode === "FOCUS" && riskLabel === "MEDIUM") return getText("bridgeFocusMedium")
        if (mode === "REST") return getText("bridgeRest")
        if (mode === "INTERACT") return getText("bridgeInteract")
        return getText("bridgeFallback")
    }

    const feedbackLearning = decision.feedbackLearning || null
    const currentLearning = feedbackLearning?.current || null
    const bestLearning = feedbackLearning?.best || null
    const hasLearning = currentLearning && Number(currentLearning.total ?? 0) > 0

    const learningTone = (() => {
        if (!feedbackLearning || !currentLearning) return ""

        const currentScore = Number(currentLearning.score ?? 0)
        const currentTotal = Number(currentLearning.total ?? 0)
        const bestMode = String(bestLearning?.mode || "")
        const currentMode = String(currentLearning.mode || mode)

        if (decision.feedbackAdjusted && decision.feedbackReason) {
            return String(decision.feedbackReason)
        }

        if (currentTotal >= 3 && currentScore >= 0.35) return getText("earlyWorks")
        if (currentTotal >= 3 && currentScore <= -0.25) return getText("earlyUnderperform")

        if (
            bestLearning &&
            Number(bestLearning.total ?? 0) >= 3 &&
            bestMode &&
            bestMode !== currentMode &&
            Number(bestLearning.score ?? 0) - currentScore >= 0.30
        ) {
            const bestModeLabel = getModeLabel(String(bestLearning.mode || "").toUpperCase())

return (getLang() === "ru")
    ? `Ранние оценки подсказывают, что здесь лучше может сработать другой режим: ${bestModeLabel}.`
    : `Early feedback suggests another mode may work better here: ${bestModeLabel}.`
        }

        return ""
    })()

    const bridgeText = [
        explainModeConflict(mode, riskLabel, primaryDriver),
        learningTone,
        primaryDriver && primaryDriver !== "none"
            ? `${getText("primaryDriverLabel")}: ${explainDriver(primaryDriver)}.`
            : "",
        secondDriver
            ? `${getText("secondaryDriverLabel")}: ${explainDriver(secondDriver)}.`
            : ""
    ].filter(Boolean).join(" ")

    const whyList = []
    if (primaryDriver && primaryDriver !== "none") {
        whyList.push(`${getText("primaryDriverLabel")}: ${explainDriver(primaryDriver)}`)
    }
    if (secondDriver) {
        whyList.push(`${getText("secondaryDriverLabel")}: ${explainDriver(secondDriver)}`)
    }
    if (riskLabel) {
        whyList.push(`${getText("overallRisk")}: ${getRiskLabelText(riskLabel)}`)
    }
    if (Number(ds.stability ?? 0.5) >= 0.62) {
        whyList.push(getText("stabilityGood"))
    } else if (Number(ds.stability ?? 0.5) <= 0.42) {
        whyList.push(getText("stabilityWeak"))
    }

    let doList = Array.isArray(risk.doNow) && risk.doNow.length ? risk.doNow.slice(0, 3) : [nextStep]
    let avoidList = Array.isArray(risk.avoid) && risk.avoid.length ? risk.avoid.slice(0, 3) : [avoidNow]

    if (mode === "FOCUS") {
        doList = [getText("doFocus")]
        avoidList = [getText("avoidFocus")]
    } else if (mode === "ADJUST") {
        doList = [getText("doAdjust")]
        avoidList = [getText("avoidAdjust")]
    } else if (mode === "REST") {
        doList = [getText("doRest")]
        avoidList = [getText("avoidRest")]
    } else if (mode === "INTERACT") {
        doList = [getText("doInteract")]
        avoidList = [getText("avoidInteract")]
    } else if (mode === "EXPLORE") {
        doList = [getText("doExplore")]
        avoidList = [getText("avoidExplore")]
    }

    const learningHtml = hasLearning
        ? `
            <div style="
                border:1px solid rgba(255,255,255,0.08);
                border-radius:20px;
                padding:16px;
                background:rgba(255,255,255,0.03);
                box-sizing:border-box;
            ">
                <div style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#8b949e; margin-bottom:10px;">
                    ${getText("learningSignal")}
                </div>

                <div style="font-size:14px; color:#e5e7eb; line-height:1.8;">
                    ${
                        Number(currentLearning.score ?? 0) >= 0.35
                            ? getText("earlyWorks")
                            : Number(currentLearning.score ?? 0) <= -0.25
                                ? getText("earlyUnderperform")
                                : getText("earlyMixed")
                    }
                </div>

                ${
                    bestLearning &&
                    String(bestLearning.mode || "") &&
                    String(bestLearning.mode || "").toUpperCase() !== String(currentLearning.mode || mode).toUpperCase()
                        ? `
                            <div style="
                                margin-top:10px;
                                padding-top:10px;
                                border-top:1px solid rgba(255,255,255,0.06);
                                font-size:13px;
                                color:#cbd5e1;
                                line-height:1.7;
                            ">
                                ${getText("altLearnedMode")}: <b>${String(bestLearning.mode || "UNKNOWN")}</b>
                            </div>
                        `
                        : ""
                }
            </div>
        `
        : `
            <div style="
                border:1px solid rgba(255,255,255,0.08);
                border-radius:20px;
                padding:16px;
                background:rgba(255,255,255,0.03);
                box-sizing:border-box;
            ">
                <div style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#8b949e; margin-bottom:10px;">
                    ${getText("learningSignal")}
                </div>

                <div style="font-size:13px; color:#94a3b8; line-height:1.75;">
                    ${getText("notEnoughFeedback1")}<br>
                    ${getText("notEnoughFeedback2")}
                </div>
            </div>
        `

    root.innerHTML = `
        <div style="
            max-width: 980px;
            margin: 28px auto 0;
            padding: 22px;
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 28px;
            background:
                radial-gradient(circle at 12% 100%, rgba(0,255,136,0.07), transparent 25%),
                radial-gradient(circle at 88% 100%, rgba(255,210,80,0.06), transparent 22%),
                linear-gradient(180deg, rgba(8,10,14,0.98) 0%, rgba(4,6,9,1) 100%);
            box-shadow:
                0 24px 60px rgba(0,0,0,0.34),
                inset 0 0 0 1px rgba(255,255,255,0.02);
            box-sizing: border-box;
            color: #f8fafc;
            font-family: Arial, sans-serif;
            position: relative;
            overflow: hidden;
        ">
            <div style="
                font-size: 11px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: #7f8792;
                text-align: center;
                margin-bottom: 18px;
            ">${getText("todaySummary")}</div>

            <div style="
                display:grid;
                grid-template-columns: repeat(12, minmax(0, 1fr));
                gap: 14px;
                align-items: stretch;
            ">
                <div style="
                    grid-column: span 4;
                    border:1px solid rgba(255,255,255,0.08);
                    border-radius:20px;
                    padding:16px;
                    background:rgba(255,255,255,0.03);
                    min-height: 126px;
                    box-sizing:border-box;
                ">
                    <div style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#8b949e; margin-bottom:8px;">
                        ${getText("mode")}
                    </div>
                    <div style="font-size:28px; font-weight:800; color:#00ff88; line-height:1.1;">
                        ${modeLabel}
                    </div>
                    <div style="margin-top:10px; color:#cbd5e1; font-size:13px; line-height:1.75;">
                        ${decision.feedbackAdjusted ? getText("adjustedByLearning") : getText("currentBestPosture")}
                    </div>
                </div>

                <div style="
                    grid-column: span 4;
                    border:1px solid rgba(255,255,255,0.08);
                    border-radius:20px;
                    padding:16px;
                    background:rgba(255,255,255,0.03);
                    min-height: 126px;
                    box-sizing:border-box;
                ">
                    <div style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#8b949e; margin-bottom:8px;">
                        ${getText("risk")}
                    </div>
                    <div style="font-size:28px; font-weight:800; color:${riskColor}; line-height:1.1;">
                        ${riskLabelText}
                    </div>
                    <div style="margin-top:10px; color:#cbd5e1; font-size:13px; line-height:1.75;">
                        ${getText("primary")}: <b>${explainDriver(primaryDriver)}</b><br>
                        ${secondDriver ? `${getText("secondary")}: <b>${explainDriver(secondDriver)}</b>` : `${getText("noSecondaryDriver")}`}
                    </div>
                </div>

                <div style="
                    grid-column: span 4;
                    border:1px solid rgba(255,255,255,0.08);
                    border-radius:20px;
                    padding:16px;
                    background:rgba(255,255,255,0.03);
                    min-height: 126px;
                    box-sizing:border-box;
                ">
                    <div style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#8b949e; margin-bottom:8px;">
                        ${getText("nextMove")}
                    </div>
                    <div style="font-size:20px; font-weight:800; color:#ffffff; line-height:1.2;">
                        ${nextStep}
                    </div>
                    <div style="margin-top:10px; color:#cbd5e1; font-size:13px; line-height:1.75;">
                        ${getText("avoid")}: <b>${avoidNow}</b>
                    </div>
                </div>

                                <div style="
                    grid-column: span 12;
                    border:1px solid rgba(255,255,255,0.08);
                    border-radius:22px;
                    padding:18px;
                    background:rgba(255,255,255,0.03);
                    box-sizing:border-box;
                ">
                    <div style="
                        font-size:11px;
                        letter-spacing:0.14em;
                        text-transform:uppercase;
                        color:#8b949e;
                        margin-bottom:12px;
                        text-align:center;
                    ">
                        ${getText("systemVsBehavior")}
                    </div>

                    <div style="
                        display:grid;
                        grid-template-columns:repeat(12, minmax(0, 1fr));
                        gap:14px;
                        align-items:stretch;
                    ">
                        <div style="
                            grid-column:span 6;
                            border:1px solid rgba(255,255,255,0.06);
                            border-radius:18px;
                            padding:16px;
                            background:rgba(255,255,255,0.02);
                            box-sizing:border-box;
                            min-height:120px;
                        ">
                            <div style="
                                font-size:11px;
                                letter-spacing:0.12em;
                                text-transform:uppercase;
                                color:#8b949e;
                                margin-bottom:8px;
                            ">
                                ${getText("systemState")}
                            </div>

                            <div style="
                                font-size:24px;
                                font-weight:800;
                                color:${systemStateColor};
                                line-height:1.1;
                            ">
                                ${systemStateLabel}
                            </div>

                            <div style="
                                margin-top:10px;
                                color:#cbd5e1;
                                font-size:13px;
                                line-height:1.8;
                            ">
                                ${getText("attractor")}: <b>${getAttractorTypeLabel(attractorType)}</b><br>
${getText("state")}: <b>${systemStateIndex}</b>${systemN > 0 ? ` / ${systemN}` : ""}<br>
${getText("intensity")}: <b>${(attractorIntensity * 100).toFixed(0)}%</b>
                            </div>
                        </div>

                        <div style="
                            grid-column:span 6;
                            border:1px solid rgba(255,255,255,0.06);
                            border-radius:18px;
                            padding:16px;
                            background:rgba(255,255,255,0.02);
                            box-sizing:border-box;
                            min-height:120px;
                        ">
                            <div style="
                                font-size:11px;
                                letter-spacing:0.12em;
                                text-transform:uppercase;
                                color:#8b949e;
                                margin-bottom:8px;
                            ">
                                ${getText("behaviorState")}
                            </div>

                            <div style="
                                font-size:24px;
                                font-weight:800;
                                color:${behaviorStateColor};
                                line-height:1.1;
                            ">
                                ${behaviorStateLabel}
                            </div>

                            <div style="
                                margin-top:10px;
                                color:#cbd5e1;
                                font-size:13px;
                                line-height:1.8;
                            ">
                                ${getText("mode")}: <b>${modeLabel}</b><br>
${getText("behaviorRisk")}: <b style="color:${riskColor};">${riskLabelText}</b><br>
${getText("nextMoveLabel")}: <b>${nextStep}</b>
                            </div>
                        </div>
                    </div>

                    <div style="
                        margin-top:14px;
                        padding-top:14px;
                        border-top:1px solid rgba(255,255,255,0.06);
                        color:#dbe4ee;
                        font-size:14px;
                        line-height:1.8;
                        text-align:center;
                    ">
                        ${layerBridgeText}
                    </div>
                </div>
            </div>

            <div style="
                display:grid;
                grid-template-columns: 1.2fr 1fr;
                gap: 14px;
                margin-top: 14px;
            ">
                <div style="
                    border:1px solid rgba(255,255,255,0.08);
                    border-radius:20px;
                    padding:16px;
                    background:rgba(255,255,255,0.03);
                    box-sizing:border-box;
                ">
                    <div style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#8b949e; margin-bottom:10px;">
                        ${getText("do")} / ${getText("avoid")}
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                        <div>
                            <div style="font-weight:700; color:#00ff88; margin-bottom:8px;">${getText("do")}</div>
                            ${doList.map(x => `<div style="color:#e5e7eb; font-size:13px; line-height:1.7;">• ${x}</div>`).join("")}
                        </div>
                        <div>
                            <div style="font-weight:700; color:#ffb347; margin-bottom:8px;">${getText("avoid")}</div>
                            ${avoidList.map(x => `<div style="color:#e5e7eb; font-size:13px; line-height:1.7;">• ${x}</div>`).join("")}
                        </div>
                    </div>
                </div>
            </div>

            <div style="margin-top:14px;">
                ${learningHtml}
            </div>

            <div style="
                margin-top:14px;
                border:1px solid rgba(255,255,255,0.08);
                border-radius:20px;
                padding:16px;
                background:rgba(255,255,255,0.03);
                box-sizing:border-box;
                text-align:left;
            ">
                <div style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#8b949e; margin-bottom:10px;">
                    ${getText("feedback")}
                </div>

                <div style="font-size:14px; color:#cbd5e1; line-height:1.65; margin-bottom:12px;">
                    ${selectedTarget
                        ? `${getText("selectedTarget")}: <b style="color:#00ff88;">${selectedTarget.name}</b><br>${getText("wasContactUseful")}`
                        : `${getText("wasModeUseful")}`
                    }
                </div>
            </div>

            <div class="human-feedback">
                <button
                    type="button"
                    onclick="
                        window.setHumanFeedbackFor(window.getCurrentRunDay(), window.getCurrentUserName(), 'good');
                        if(window.MTOS_STATE?.decision?.selectedTarget){
                            window.setRelationFeedbackFor(
                                window.getCurrentRunDay(),
                                window.getCurrentUserName(),
                                window.MTOS_STATE.decision.selectedTarget.name,
                                'good'
                            );
                        }
                        window._rerenderDecisionOnly && window._rerenderDecisionOnly();
                    "
                    class="${currentRelationFeedbackValue === "good" ? "active" : ""}"
                    style="${currentRelationFeedbackValue === "good" ? "border-color:#00ff88;color:#00ff88;" : ""}"
                >${getText("good")}</button>

                <button
                    type="button"
                    onclick="
                        window.setHumanFeedbackFor(window.getCurrentRunDay(), window.getCurrentUserName(), 'neutral');
                        if(window.MTOS_STATE?.decision?.selectedTarget){
                            window.setRelationFeedbackFor(
                                window.getCurrentRunDay(),
                                window.getCurrentUserName(),
                                window.MTOS_STATE.decision.selectedTarget.name,
                                'neutral'
                            );
                        }
                        window._rerenderDecisionOnly && window._rerenderDecisionOnly();
                    "
                    class="${currentRelationFeedbackValue === "neutral" ? "active" : ""}"
                    style="${currentRelationFeedbackValue === "neutral" ? "border-color:#d1d5db;color:#ffffff;" : ""}"
                >${getText("neutral")}</button>

                <button
                    type="button"
                    onclick="
                        window.setHumanFeedbackFor(window.getCurrentRunDay(), window.getCurrentUserName(), 'bad');
                        if(window.MTOS_STATE?.decision?.selectedTarget){
                            window.setRelationFeedbackFor(
                                window.getCurrentRunDay(),
                                window.getCurrentUserName(),
                                window.MTOS_STATE.decision.selectedTarget.name,
                                'bad'
                            );
                        }
                        window._rerenderDecisionOnly && window._rerenderDecisionOnly();
                    "
                    class="${currentRelationFeedbackValue === "bad" ? "active" : ""}"
                    style="${currentRelationFeedbackValue === "bad" ? "border-color:#ff6666;color:#ff6666;" : ""}"
                >${getText("bad")}</button>
            </div>

            <div class="human-feedback-note">
                ${getText("manualFeedbackNote")}
            </div>

            ${showAck ? `
                <div style="
                    margin-top:12px;
                    display:inline-flex;
                    align-items:center;
                    gap:8px;
                    padding:8px 12px;
                    border:1px solid rgba(0,255,136,0.22);
                    border-radius:999px;
                    background:rgba(0,255,136,0.08);
                    color:#00ff88;
                    font-size:12px;
                    font-weight:700;
                ">
                    ✓ ${getText("feedbackSaved")}
                    <span style="color:#cbd5e1;font-weight:400;">
                        ${feedbackAck.a && feedbackAck.b ? `${feedbackAck.a} ↔ ${feedbackAck.b}` : ""}
                        ${feedbackAck.value ? ` • ${String(feedbackAck.value).toUpperCase()}` : ""}
                    </span>
                </div>
            ` : ""}
        </div>
    `
}