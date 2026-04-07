export function renderHumanLayerV2(ds, ctx = {}) {
    const root = document.getElementById("humanLayer")
    if (!root) return

    if (!ds) {
        root.innerHTML = `
            <div class="mobile-decision-root">
                <div class="mobile-main-card glow-card">
                    <div class="mobile-main-mode">NO DATA</div>
                    <div class="mobile-main-text-big">WAIT</div>
                    <div class="mobile-main-text">Run MTOS to build the day state.</div>
                </div>
            </div>
        `
        return
    }

    const {
        name = "",
        decision = {},
        attractorState = {},
        timePressureSummary = {},
        forecastStats = {},
        snapshots = [],
        feedback = null,
        metabolic = {}
    } = ctx

    const state = getSimpleHumanState(ds, attractorState)
    const stateColor = getStateColor(state)

    const focus = clamp01(Number(ds.attention ?? 0.5))
    const pressure = clamp01(
        Number(ds.pressure ?? 0) * 0.65 +
        Number(ds.conflict ?? 0) * 0.35
    )
    const stability = clamp01(Number(ds.stability ?? 0.5))

    const mode = String(
        decision?.mode || getRecommendedModeFallback(ds) || "BALANCED"
    ).toUpperCase()

    const action = getPlainAction(mode)
    const whyTags = getWhyTags(ds, attractorState, timePressureSummary)
    const risk = getRisk(ds, decision, attractorState)
    const trust = getTrust(decision, forecastStats)
    const yesterday = Array.isArray(snapshots) && snapshots.length > 1 ? snapshots[1] : null
    const deltaText = getDeltaText(ds, yesterday)
    const oneLine = getOneLineAnswer(mode, risk.label, action.now)

    root.innerHTML = `
        <div class="mobile-decision-root">

            <div>
                <div class="mobile-top-pill">
                    <span style="color:#9ca3af;">Today:</span>
                    <b style="color:${stateColor}; letter-spacing:0.04em;">${escapeHtml(state)}</b>
                </div>
            </div>

            <div class="mobile-main-card glow-card">
                <div class="mobile-main-mode">BEST ACTION NOW</div>
                <div class="mobile-main-text-big">${escapeHtml(mode)}</div>
                <div class="mobile-main-text">${escapeHtml(shortText(action.now))}</div>
                <div class="mobile-main-avoid">
                    <b style="color:#e5e7eb;">Avoid:</b> ${escapeHtml(shortText(action.avoid))}
                </div>
            </div>

            <div class="mobile-dual">
                <div class="mobile-mini-card">
                    <div class="mobile-mini-label">RISK</div>
                    <div class="mobile-mini-value" style="color:${risk.color};">${escapeHtml(risk.label)}</div>
                    <div class="mobile-mini-sub">${escapeHtml(risk.text)}</div>
                </div>

                <div class="mobile-mini-card">
                    <div class="mobile-mini-label">TRUST</div>
                    <div class="mobile-mini-value">${escapeHtml(trust.label)}</div>
                    <div class="mobile-mini-sub">Advice confidence ${Number(trust.value).toFixed(2)}</div>
                </div>
            </div>

            <div class="mobile-tags-card">
                <div class="mobile-mini-label">WHY</div>
                <div class="mobile-tags">
                    ${whyTags.map(tag => `<span class="mobile-tag">${escapeHtml(tag)}</span>`).join("")}
                </div>
            </div>

            <div class="mobile-bars-card">
                <div class="mobile-mini-label">ONE-LINE ANSWER</div>
                <div class="mobile-answer-text">${escapeHtml(oneLine)}</div>

                <div class="mobile-bars" style="margin-top:18px;">
                    ${metricBarMobile("FOCUS", focus, "linear-gradient(90deg, #123642 0%, #f0d24c 52%, #18d38a 100%)")}
                    ${metricBarMobile("PRESSURE", pressure, "linear-gradient(90deg, #243447 0%, #f0a94a 100%)")}
                    ${metricBarMobile("STABILITY", stability, "linear-gradient(90deg, #203246 0%, #63b8ff 100%)")}
                </div>
            </div>

            <div class="mobile-answer-card">
                <div class="mobile-mini-label">COMPARED TO YESTERDAY</div>
                <div class="mobile-answer-text">${escapeHtml(deltaText)}</div>

                <div class="mobile-answer-note">
                    Auto-evaluation:
                    <b style="color:${
                        feedback?.value === "good"
                            ? "#00ff88"
                            : feedback?.value === "bad"
                                ? "#ff6666"
                                : "#d1d5db"
                    };">
                        ${(feedback?.value || "neutral").toUpperCase()}
                    </b>
                    · score ${Number(feedback?.autoScore ?? 0.5).toFixed(2)}
                    · goal ${(feedback?.goal || "stability").toUpperCase()}
                </div>
            </div>

        </div>
    `
}

function metricBarMobile(label, value, gradient) {
    const width = `${Math.round(clamp01(value) * 100)}%`
    return `
        <div class="mobile-bar-row">
            <div class="mobile-bar-label">${label}</div>
            <div class="mobile-bar-track">
                <div class="mobile-bar-fill" style="width:${width}; background:${gradient};"></div>
            </div>
            <div class="mobile-bar-value">${Number(value).toFixed(2)}</div>
        </div>
    `
}

function metricBar(label, value, gradient) {
    const width = `${Math.round(clamp01(value) * 100)}%`
    return `
        <div style="display:grid;grid-template-columns:80px 1fr 40px;gap:10px;align-items:center;margin-bottom:12px;">
            <div style="font-size:13px;color:#e5e7eb;">${label}</div>
            <div style="height:10px;border-radius:999px;background:#111827;border:1px solid #1f2937;overflow:hidden;">
                <div style="height:100%;width:${width};border-radius:999px;background:${gradient};"></div>
            </div>
            <div style="text-align:right;font-size:12px;color:#9ca3af;">${Number(value).toFixed(2)}</div>
        </div>
    `
}

function clamp01(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function safeNum(v, fallback = 0) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
}

function getSimpleHumanState(ds, attractorState = {}) {
    const label = String(ds?.dayLabel || "NEUTRAL").toUpperCase()
    const pressure = safeNum(ds?.pressure, 0)
    const conflict = safeNum(ds?.conflict, 0)
    const stability = safeNum(ds?.stability, 0.5)
    const attention = safeNum(ds?.attention, 0.5)
    const attractorType = String(attractorState?.type || "unknown").toLowerCase()

    if (label === "REST") return "RECOVERY"
    if (attractorType === "chaos" || conflict >= 0.52 || pressure >= 0.70) return "CHAOTIC"
    if (label === "FOCUS" || (attention >= 0.70 && stability >= 0.60)) return "FOCUSED"
    if (label === "INTERACT") return "LIGHT"
    if (label === "ADJUST") return "BALANCED"
    return "BALANCED"
}

function getStateColor(state) {
    if (state === "FOCUSED") return "#00ff88"
    if (state === "LIGHT") return "#66ccff"
    if (state === "HEAVY") return "#ffb347"
    if (state === "CHAOTIC") return "#ff6666"
    if (state === "RECOVERY") return "#c084fc"
    return "#d1d5db"
}

function getPlainAction(mode) {
    const m = String(mode || "").toUpperCase()

    if (m === "FOCUS") {
        return {
            now: "Do one core task and finish it.",
            avoid: "Avoid multitasking and avoid noisy communication."
        }
    }

    if (m === "ADJUST") {
        return {
            now: "Reopen one alternative before committing.",
            avoid: "Avoid forcing certainty too early."
        }
    }

    if (m === "REST" || m === "RECOVER") {
        return {
            now: "Reduce load and recover the system.",
            avoid: "Avoid forcing output or heavy decisions."
        }
    }

    if (m === "EXPLORE") {
        return {
            now: "Research, test, and keep options open.",
            avoid: "Avoid locking into one rigid path too early."
        }
    }

    if (m === "INTERACT" || m === "SOCIAL") {
        return {
            now: "Use the day for alignment and communication.",
            avoid: "Avoid isolation if coordination matters."
        }
    }

    return {
        now: "Work in a moderate, balanced way.",
        avoid: "Avoid overreacting to weak signals."
    }
}

function getWhyTags(ds, attractorState = {}, timePressureSummary = {}) {
    const tags = []

    const attention = safeNum(ds?.attention, 0.5)
    const pressure = safeNum(ds?.pressure, 0)
    const conflict = safeNum(ds?.conflict, 0)
    const stability = safeNum(ds?.stability, 0.5)
    const attractorType = String(attractorState?.type || "unknown").toLowerCase()
    const timePressure = safeNum(timePressureSummary?.value, 0)

    if (attention >= 0.68) tags.push("strong attention")
    else if (attention <= 0.40) tags.push("scattered attention")

    if (pressure >= 0.62) tags.push("high pressure")
    if (conflict >= 0.42) tags.push("visible conflict")
    if (stability >= 0.62) tags.push("good stability")
    else if (stability <= 0.42) tags.push("weak stability")

    if (attractorType !== "unknown") tags.push(`attractor: ${attractorType}`)
    if (timePressure >= 0.62) tags.push("high time pressure")

    if (!tags.length) tags.push("moderate balance")
    return tags
}

function getReadableWhy(ds, mode, attractorState = {}, timePressureSummary = {}) {
    const parts = []

    const stability = safeNum(ds?.stability, 0.5)
    const pressure = safeNum(ds?.pressure, 0)
    const conflict = safeNum(ds?.conflict, 0)
    const attention = safeNum(ds?.attention, 0.5)
    const attractorType = String(attractorState?.type || "unknown").toLowerCase()
    const timePressure = safeNum(timePressureSummary?.value, 0)

    if (mode === "INTERACT" || mode === "SOCIAL") {
        if (stability >= 0.62) parts.push("stability supports contact")
        if (conflict <= 0.22) parts.push("conflict remains low")
        if (pressure <= 0.42) parts.push("pressure is controlled enough for interaction")
    } else if (mode === "FOCUS") {
        if (attention >= 0.58) parts.push("attention is available for concentrated work")
        if (stability >= 0.58) parts.push("stability supports execution")
        if (conflict <= 0.30) parts.push("internal noise is limited")
    } else if (mode === "EXPLORE") {
        parts.push("the system is better at flexible movement than rigid commitment")
    } else if (mode === "REST" || mode === "RECOVER") {
        parts.push("the system benefits more from recovery than from force")
    }

    if (attractorType === "chaos") parts.push("the attractor is unstable")
    if (timePressure >= 0.62) parts.push("time pressure is elevated")

    if (!parts.length) {
        parts.push("current conditions are moderate and balanced")
    }

    return parts.join(" · ")
}

function getRisk(ds, decision = {}, attractorState = {}) {
    const pressure = safeNum(ds?.pressure, 0)
    const conflict = safeNum(ds?.conflict, 0)
    const stability = safeNum(ds?.stability, 0.5)
    const attractorType = String(attractorState?.type || "unknown").toLowerCase()

    let risk = pressure * 0.42 + conflict * 0.33 + (1 - stability) * 0.25

    if (attractorType === "chaos") risk += 0.10
    if (attractorType === "stable") risk -= 0.05

    risk = clamp01(risk)

    if (risk >= 0.68) {
        return {
            label: "HIGH",
            color: "#ff6666",
            text: "Avoid large decisions and avoid forcing the day."
        }
    }

    if (risk >= 0.38) {
        return {
            label: "MEDIUM",
            color: "#ffb347",
            text: "Proceed carefully and keep the scope narrow."
        }
    }

    return {
        label: "LOW",
        color: "#00ff88",
        text: "The day is stable enough for controlled action."
    }
}

function getTrust(decision = {}, forecastStats = {}) {
    const confidence = safeNum(decision?.confidence, 0.5)
    const resolved = safeNum(forecastStats?.resolved, 0)
    const correct = safeNum(forecastStats?.correct, 0)
    const hitRate = resolved > 0 ? correct / resolved : 0.5

    const value = clamp01(confidence * 0.68 + hitRate * 0.32)

    if (value >= 0.72) return { label: "HIGH", value }
    if (value >= 0.48) return { label: "MEDIUM", value }
    return { label: "LOW", value }
}

function getDeltaText(today = {}, yesterday = null) {
    if (!yesterday) return "No previous snapshot yet."

    const pNow = safeNum(today?.pressure, 0)
    const pPrev = safeNum(yesterday?.pressure, 0)
    const sNow = safeNum(today?.stability, 0.5)
    const sPrev = safeNum(yesterday?.stability, 0.5)
    const aNow = safeNum(today?.attention, 0.5)
    const aPrev = safeNum(yesterday?.attention, 0.5)

    const parts = []

    if (aNow > aPrev + 0.04) parts.push("more focused than yesterday")
    else if (aNow < aPrev - 0.04) parts.push("less focused than yesterday")

    if (pNow > pPrev + 0.04) parts.push("more pressure than yesterday")
    else if (pNow < pPrev - 0.04) parts.push("less pressure than yesterday")

    if (sNow > sPrev + 0.04) parts.push("more stable than yesterday")
    else if (sNow < sPrev - 0.04) parts.push("less stable than yesterday")

    if (!parts.length) return "Very close to yesterday."
    return parts.join(" · ")
}

function renderHumanHistoryRows(rows, name) {
    const safeRows = Array.isArray(rows) ? rows.filter(r => !name || r?.name === name).slice(0, 7) : []

    if (!safeRows.length) {
        return `
            <div style="
                border:1px solid #1f1f1f;
                border-radius:12px;
                background:#040404;
                padding:12px;
                color:#9ca3af;
                font-size:13px;
            ">
                No snapshots yet.
            </div>
        `
    }

    return safeRows.map(row => `
        <div style="
            display:grid;
            grid-template-columns:100px 1fr auto;
            gap:10px;
            align-items:center;
            border:1px solid #1f1f1f;
            border-radius:12px;
            background:#040404;
            padding:10px 12px;
        ">
            <div style="font-size:12px;color:#9ca3af;">${escapeHtml(row?.day || "?")}</div>
            <div style="font-size:13px;color:#f3f4f6;">${escapeHtml(row?.dayLabel || "UNKNOWN")}</div>
            <div style="font-size:11px;color:#8b8b8b;">
    ${escapeHtml(row?.recommendedMode || "UNKNOWN")}
    · system ${Number(row?.systemPredictability ?? row?.predictability ?? 0).toFixed(0)}
    · behavior ${Number(row?.behaviorEfficiency ?? 0).toFixed(2)}
</div>
        </div>
    `).join("")
}

function getOneLineAnswer(mode, riskLabel, actionText) {
    if (riskLabel === "HIGH") {
        return `Risk is high. ${actionText} Do not force major decisions.`
    }

    if (riskLabel === "MEDIUM") {
        return `${actionText} Move carefully and keep the scope narrow.`
    }

    return `${actionText} This is a workable window.`
}

function getRecommendedModeFallback(ds) {
    const label = String(ds?.dayLabel || "NEUTRAL").toUpperCase()

    if (label === "FOCUS") return "FOCUS"
if (label === "ADJUST") return "ADJUST"
if (label === "INTERACT") return "INTERACT"
if (label === "REST") return "REST"
return "EXPLORE"
}

function shortText(str) {
    return String(str ?? "")
        .replace(/^Use the day for\s+/i, "")
        .replace(/^Do one core task and finish it\./i, "Finish one core task.")
        .replace(/^Reduce load and recover the system\./i, "Reduce load. Recover.")
        .replace(/^Research, test, and keep options open\./i, "Research. Test. Stay open.")
        .replace(/^Work in a moderate, balanced way\./i, "Work in a balanced way.")
        .replace(/^Avoid\s+/i, "")
        .trim()
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;")
}