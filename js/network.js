import { KinRegistry } from "./kinRegistry.js"
import { getRecommendedTemporalMode } from "./timePressure.js"
import { loadNetworkHistory, saveNetworkState } from "./networkHistory.js"
import { getRelationLabel } from "./relationTypes.js"
import { t } from "./mtosUI/mtosI18n.js"

let historyIndex = null

function clamp(value, min, max) {
    const n = Number(value)
    if (!Number.isFinite(n)) return min
    return Math.max(min, Math.min(max, n))
}

function getTimePressureState() {
    const tp = window.mtosTimePressure || window.mtosTimePressureSummary || {}

    return {
        pressure: clamp(tp.pressure ?? tp.value ?? 0, 0, 1),
        urgency: clamp(tp.urgency ?? 0, 0, 1),
        momentum: clamp(tp.momentum ?? 0, -1, 1),
        overload: clamp(tp.overload ?? 0, 0, 1),
        fatigue: clamp(tp.fatigue ?? 0, 0, 1),
        label: typeof tp.label === "string" ? tp.label : "low",
        temporalMode: typeof tp.temporalMode === "string" ? tp.temporalMode : "EXPLORE"
    }
}

function getTemporalBand(pressure, urgency, score, isTodayRealContact) {
    const negative = Number(score) < 0
    const magnitude = Math.abs(Number(score) || 0)

    if (pressure >= 0.90) return negative ? "BREAK RISK" : "OVERRIDE"
    if (pressure >= 0.78) return negative ? "CONFLICT SPIKE" : "SURGE"
    if (pressure >= 0.64) return negative ? "TENSE FOCUS" : "LOCK-IN"
    if (pressure >= 0.50) return negative ? "FRICTION" : "FOCUS"
    if (pressure >= 0.36) return isTodayRealContact ? "ACTIVE CONTACT" : "FLOW"
    if (pressure >= 0.20) return magnitude >= 0.45 ? "SOFT PULL" : "DRIFT"
    return isTodayRealContact ? "LIGHT CONTACT" : "EXPLORE"
}

function getEdgePressureProfile(score, adjustedScore, isTodayRealContact, attractorValue = null) {
    const tp = getTimePressureState()

    const signIntensity = clamp(Math.abs(Number(adjustedScore ?? score ?? 0)), 0, 1)
    const polarity = Number(adjustedScore ?? score ?? 0) < 0 ? 1 : 0
    const contactBoost = isTodayRealContact ? 0.10 : 0
    const attractorBoost = attractorValue == null ? 0 : Math.abs(Number(attractorValue) - 0.5) * 0.45

    const localPressure = clamp(
        tp.pressure * 0.58 +
        tp.urgency * 0.16 +
        signIntensity * 0.16 +
        polarity * 0.08 +
        contactBoost +
        attractorBoost,
        0,
        1
    )

    const localUrgency = clamp(
        tp.urgency * 0.54 +
        signIntensity * 0.18 +
        polarity * 0.10 +
        contactBoost * 0.8 +
        attractorBoost * 0.6,
        0,
        1
    )

    return {
        pressure: Number(localPressure.toFixed(3)),
        urgency: Number(localUrgency.toFixed(3)),
        temporalMode: getRecommendedTemporalMode(localPressure),
        band: getTemporalBand(localPressure, localUrgency, Number(adjustedScore ?? score ?? 0), isTodayRealContact)
    }
}

function translateBandLabel(band) {
    const key = "band_" + String(band || "EXPLORE")
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
    return t(key)
}

function getRelationVisual(scoreAB, scoreBA, isTodayRealContact) {
    const labelAB = getRelationLabel(scoreAB)
    const labelBA = getRelationLabel(scoreBA)

    const absAB = Math.abs(Number(scoreAB || 0))
    const absBA = Math.abs(Number(scoreBA || 0))

    const dominant = absAB >= absBA ? labelAB : labelBA
    const dominantScore = absAB >= absBA ? scoreAB : scoreBA

    return {
        label: isTodayRealContact ? `${dominant.label} + Contact` : dominant.label,
        color: dominant.color,
        dominantScore
    }
}

function resolveNetworkScore(rawScore) {
    const attractorState = window.mtosAttractorState || {
        type: "unknown",
        intensity: 0
    }

    const timePressureState = getTimePressureState()

    return window.resolveSharedRelationScore
        ? window.resolveSharedRelationScore(rawScore, attractorState, timePressureState)
        : Math.max(-1, Math.min(1, Number(rawScore || 0)))
}

function isTodayContactResolved(aName, bName) {
    const aId = typeof window.getUserId === "function" ? window.getUserId(aName) : aName
    const bId = typeof window.getUserId === "function" ? window.getUserId(bName) : bName

    if (!aId || !bId) return false

    const pairKey = [String(aId), String(bId)].sort().join("::")
    const dayKey = typeof window.getCurrentRunDay === "function"
        ? window.getCurrentRunDay()
        : new Date().toISOString().slice(0, 10)

    const storageKey = String(window.MTOS_TODAY_CONTACTS_KEY || "mtos_today_contacts_v2")
    let db = {}

    try {
        db = JSON.parse(localStorage.getItem(storageKey) || "{}")
    } catch (e) {
        db = {}
    }

    const row = db && typeof db === "object" ? db[dayKey] : null
    if (!row || typeof row !== "object") return false

    return !!row[pairKey]
}

function getRelationBucket(scoreAB, scoreBA, isTodayRealContact) {
    if (isTodayRealContact) return "contact"

    const displayScore = (Number(scoreAB || 0) + Number(scoreBA || 0)) / 2
    const label = String(getRelationLabel(displayScore)?.label || "").toLowerCase()

    if (label.includes("strong conflict")) return "strong_conflict"
    if (label.includes("conflict")) return "conflict"
    if (label.includes("tension")) return "tension"
    if (label.includes("neutral")) return "neutral"
    if (label.includes("weak support")) return "weak_support"
    if (label.includes("support")) return "strong_support"

    return "other"
}

function relationPassesFilter(scoreAB, scoreBA, isTodayRealContact) {
    const filter = String(window.networkRelationFilter || "all")
    if (filter === "all") return true
    return getRelationBucket(scoreAB, scoreBA, isTodayRealContact) === filter
}

function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2)

    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

function getTouchDistance(t1, t2) {
    const dx = t2.clientX - t1.clientX
    const dy = t2.clientY - t1.clientY
    return Math.sqrt(dx * dx + dy * dy)
}

function getTouchCenter(t1, t2) {
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
    }
}

function ensurePopup() {
    let edgePopup = document.getElementById("networkEdgePopup")

    if (edgePopup) return edgePopup

    edgePopup = document.createElement("div")
    edgePopup.id = "networkEdgePopup"
    edgePopup.style.position = "fixed"
    edgePopup.style.display = "none"
    edgePopup.style.zIndex = "9999"
    edgePopup.style.minWidth = "220px"
    edgePopup.style.maxWidth = "280px"
    edgePopup.style.background =
        "radial-gradient(circle at 10% 100%, rgba(0,255,136,0.08), transparent 34%)," +
        "radial-gradient(circle at 90% 100%, rgba(255,210,80,0.08), transparent 26%)," +
        "linear-gradient(180deg, rgba(11,13,18,0.98) 0%, rgba(6,8,12,0.98) 100%)"
    edgePopup.style.border = "1px solid rgba(255,255,255,0.10)"
    edgePopup.style.borderRadius = "14px"
    edgePopup.style.padding = "12px 14px"
    edgePopup.style.color = "#f3f4f6"
    edgePopup.style.fontFamily = "Arial, sans-serif"
    edgePopup.style.fontSize = "12px"
    edgePopup.style.lineHeight = "1.55"
    edgePopup.style.boxShadow = "0 16px 40px rgba(0,0,0,0.38)"
    edgePopup.style.backdropFilter = "blur(8px)"

    document.body.appendChild(edgePopup)
    return edgePopup
}

function getWeatherForKin(kin) {
    if (!Array.isArray(window._weather)) {
        return {
            attention: 0.5,
            activity: 0.5,
            pressure: 0,
            conflict: 0
        }
    }

    const idx = Number(kin) - 1
    if (idx < 0 || idx >= window._weather.length) {
        return {
            attention: 0.5,
            activity: 0.5,
            pressure: 0,
            conflict: 0
        }
    }

    const w = window._weather[idx] || {}

    return {
        attention: clamp(w.attention ?? 0.5, 0, 1),
        activity: clamp(w.activity ?? w.attention ?? 0.5, 0, 1),
        pressure: clamp(w.pressure ?? 0, 0, 1),
        conflict: clamp(w.conflict ?? 0, 0, 1)
    }
}

function getNodeVisualState(user) {
    const w = getWeatherForKin(user?.kin)

    const energy =
        w.attention * 0.38 +
        w.activity * 0.22 +
        (1 - w.pressure) * 0.18 +
        (1 - w.conflict) * 0.22

    let state = "balanced"
    if (w.pressure >= 0.66 || w.conflict >= 0.52) state = "stress"
    else if (w.attention >= 0.72 && w.pressure <= 0.42 && w.conflict <= 0.28) state = "focus"
    else if (w.activity >= 0.68 && w.pressure <= 0.55) state = "active"
    else if (w.attention <= 0.38 || w.activity <= 0.38) state = "low"

    return {
        ...w,
        energy: clamp(energy, 0, 1),
        state
    }
}

function getNodeRadius(user, isSelected, isHover) {
    const visual = getNodeVisualState(user)
    let radius = 18 + visual.energy * 16 + Number(user?.weight ?? 1) * 2

    if (visual.state === "focus") radius += 4
    if (visual.state === "stress") radius += 2
    if (isSelected) radius += 7
    if (isHover) radius += 4

    return clamp(radius, 18, 42)
}

function getNodeStrokeColor(state) {
    if (state === "focus") return "#00ff88"
    if (state === "active") return "#66ccff"
    if (state === "stress") return "#ff7a59"
    if (state === "low") return "#8b949e"
    return "rgba(255,255,255,0.16)"
}

window._networkInvalidate = () => {
    window._networkEdgesCache = {
        key: "",
        edges: null,
        allKey: "",
        allEdges: null
    }
}

function buildEdges(users, memory, locked, matrix) {
    const edges = []

    for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
            const u1 = users[i]
            const u2 = users[j]

            const key1 = `${u1.name}->${u2.name}`
            const key2 = `${u2.name}->${u1.name}`

            //if (locked[key1] || locked[key2]) continue

let rawAB = Number(memory[key1] ?? 0)
let rawBA = Number(memory[key2] ?? 0)

const isTodayRealContact = isTodayContactResolved(u1.name, u2.name)

if (rawAB === 0 && rawBA === 0 && !isTodayRealContact) {
    continue
}

const effectiveAB = rawAB !== 0 ? rawAB : (isTodayRealContact ? 0.01 : rawBA)
const effectiveBA = rawBA !== 0 ? rawBA : (isTodayRealContact ? 0.01 : rawAB)

const baseScoreAB = resolveNetworkScore(effectiveAB)
const baseScoreBA = resolveNetworkScore(effectiveBA)

const feedbackDay = typeof window.getCurrentRunDay === "function"
    ? window.getCurrentRunDay()
    : new Date().toISOString().slice(0, 10)

const relationFeedbackScalar =
    typeof window.getRelationFeedbackScalar === "function"
        ? Number(window.getRelationFeedbackScalar(feedbackDay, u1.name, u2.name) || 0)
        : 0

const scoreAB = clamp(baseScoreAB + relationFeedbackScalar, -1, 1)
const scoreBA = clamp(baseScoreBA + relationFeedbackScalar, -1, 1)

const displayScore = (scoreAB + scoreBA) / 2

            if (!relationPassesFilter(scoreAB, scoreBA, isTodayRealContact)) continue

            let attractorValue = null
            if (Array.isArray(matrix) && matrix.length >= 400) {
                const sealA = KinRegistry.toIndex(u1.kin) % 20
                const sealB = KinRegistry.toIndex(u2.kin) % 20
                attractorValue = matrix[sealA * 20 + sealB]
            }

edges.push({
    i,
    j,
    a: u1.name,
    b: u2.name,
    scoreAB,
    scoreBA,
    baseScoreAB,
    baseScoreBA,
    relationFeedbackScalar,
    displayScore,
    adjustedScore: (scoreAB + scoreBA) / 2,
    isTodayRealContact,
    attractorValue
})
        }
    }

    return edges
}

function computeNetworkFeedback(users, edges) {
    let total = 0
    let positive = 0
    let negative = 0
    let absSum = 0

    edges.forEach(edge => {
        total++
        absSum += Math.abs(edge.displayScore)
        if (edge.displayScore > 0) positive++
        else if (edge.displayScore < 0) negative++
    })

    const possible = (users.length * (users.length - 1)) / 2
    const density = possible > 0 ? total / possible : 0
    const meanStrength = total > 0 ? absSum / total : 0
    const conflictRatio = total > 0 ? negative / total : 0
    const supportRatio = total > 0 ? positive / total : 0

    const tp = getTimePressureState()

        window.currentNetworkRelations = edges.map(edge => {
        const relationVisual = getRelationVisual(
            edge.scoreAB,
            edge.scoreBA,
            edge.isTodayRealContact
        )

        const profile = getEdgePressureProfile(
            edge.displayScore,
            edge.adjustedScore,
            edge.isTodayRealContact,
            edge.attractorValue
        )

        const dominant = String(relationVisual.label || "")
        const dominantLower = dominant.toLowerCase()

        let type = "neutral"
        if (dominantLower.includes("ultra")) type = "ultra"
        else if (dominantLower.includes("support")) type = "support"
        else if (dominantLower.includes("conflict")) type = "conflict"
        else if (dominantLower.includes("tension")) type = "conflict"
        else if (dominantLower.includes("contact")) type = "contact"

        return {
            id: `${edge.a}->${edge.b}`,
            source: edge.a,
            target: edge.b,
            a: edge.a,
            b: edge.b,
            from: edge.i,
            to: edge.j,
            scoreAB: Number(edge.scoreAB ?? 0),
            scoreBA: Number(edge.scoreBA ?? 0),
            baseScoreAB: Number(edge.baseScoreAB ?? 0),
            baseScoreBA: Number(edge.baseScoreBA ?? 0),
            relationFeedbackScalar: Number(edge.relationFeedbackScalar ?? 0),
            score: Number(edge.displayScore ?? 0),
            displayScore: Number(edge.displayScore ?? 0),
            adjustedScore: Number(edge.adjustedScore ?? edge.displayScore ?? 0),
            strength: Number(edge.displayScore ?? 0),
            weight: Number(edge.displayScore ?? 0),
            type,
            label: relationVisual.label,
            color: relationVisual.color,
            isTodayRealContact: !!edge.isTodayRealContact,
            attractorValue: edge.attractorValue == null ? null : Number(edge.attractorValue),
            timePressure: Number(profile.pressure ?? 0),
            urgency: Number(profile.urgency ?? 0),
            temporalMode: String(profile.temporalMode || "EXPLORE"),
            band: String(profile.band || "EXPLORE")
        }
    })

    window.mtosNetworkFeedback = {
        totalLinks: total,
        density,
        meanStrength,
        conflictRatio,
        supportRatio,
        timePressure: tp.pressure,
        temporalMode: tp.temporalMode,
        updatedAt: new Date().toISOString()
    }
}

function ensureRelationFilterSetter() {
    window.setNetworkRelationFilter = (filter) => {
        window.networkRelationFilter = filter || "all"

        if (typeof window._networkRedraw === "function") {
            window._networkRedraw()
        } else if (typeof window._rerenderNetworkOnly === "function") {
            window._rerenderNetworkOnly()
        }
    }
}

function ensureNetworkModeSetter() {
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
            btnEdit.style.background = isEdit ? "#00ff88" : "rgba(255,255,255,0.04)"
            btnEdit.style.color = isEdit ? "#04110d" : "#e5e7eb"
            btnEdit.style.borderColor = isEdit ? "transparent" : "rgba(255,255,255,0.12)"
            btnEdit.style.boxShadow = isEdit
                ? "0 0 20px rgba(0,255,136,0.20)"
                : "0 8px 24px rgba(0,0,0,0.22)"
        }

        if (btnLink) {
            const isLink = window.networkMode === "link"
            btnLink.style.background = isLink ? "#66ccff" : "rgba(255,255,255,0.04)"
            btnLink.style.color = isLink ? "#041018" : "#e5e7eb"
            btnLink.style.borderColor = isLink ? "transparent" : "rgba(255,255,255,0.12)"
            btnLink.style.boxShadow = isLink
                ? "0 0 20px rgba(102,204,255,0.18)"
                : "0 8px 24px rgba(0,0,0,0.22)"
        }

        if (btnContact) {
            const isContact = window.networkMode === "contact"
            btnContact.style.background = isContact ? "#ffd166" : "rgba(255,255,255,0.04)"
            btnContact.style.color = isContact ? "#1a1405" : "#e5e7eb"
            btnContact.style.borderColor = isContact ? "transparent" : "rgba(255,255,255,0.12)"
            btnContact.style.boxShadow = isContact
                ? "0 0 20px rgba(255,209,102,0.20)"
                : "0 8px 24px rgba(0,0,0,0.22)"
        }

        if (typeof window._networkRedraw === "function") {
            window._networkRedraw()
        } else if (typeof window._rerenderNetworkOnly === "function") {
    window._rerenderNetworkOnly()
}
    }
}

export function drawNetwork(id, users, onSelect, matrix = null) {

    if (window._networkRAF) {
        cancelAnimationFrame(window._networkRAF)
        window._networkRAF = null
    }

    if (window._networkDocClickHandler) {
        document.removeEventListener("click", window._networkDocClickHandler)
        window._networkDocClickHandler = null
    }

    ensureRelationFilterSetter()
    ensureNetworkModeSetter()

    const root = document.getElementById(id)
    if (!root) return

    root.innerHTML = ""
    root.style.maxWidth = "760px"
    root.style.margin = "0 auto"
    root.style.padding = "0 12px"
    root.style.boxSizing = "border-box"

    let memory = {}
try {
    memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
} catch (e) {
    memory = {}
}
window._memoryCache = memory

function reloadMemoryFromStorage() {
    try {
        memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    } catch (e) {
        memory = {}
    }
    window._memoryCache = memory
    reloadLockedFromStorage()
}

    let activeUsers = Array.isArray(users) ? users.slice() : []

    window.currentUsers = JSON.parse(JSON.stringify(activeUsers))

    if (historyIndex !== null) {
        const history = loadNetworkHistory()
        const state = history?.[historyIndex]
        if (state) {
            memory = state.memory || memory
            activeUsers = Array.isArray(state.users) ? state.users : activeUsers
        }
    }

    let locked = {}

function reloadLockedFromStorage() {
    try {
        locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
    } catch (e) {
        locked = {}
    }
    window._lockedCache = locked
}

reloadLockedFromStorage()

    const N = activeUsers.length

    const panel = document.createElement("div")
    panel.style.display = "flex"
    panel.style.justifyContent = "center"
    panel.style.gap = "10px"
    panel.style.flexWrap = "wrap"
    panel.style.marginBottom = "14px"

    window._networkEdgesCache = window._networkEdgesCache || {
    key: "",
    edges: null,
    allKey: "",
    allEdges: null
}

function makeAllEdgesKey() {
    const sortedMemory = Object.keys(memory || {})
        .sort()
        .map(key => [key, Number(memory[key] ?? 0)])

    const sortedLocked = Object.keys(locked || {})
        .sort()
        .map(key => [key, !!locked[key]])

    return JSON.stringify({
        users: activeUsers.map(u => ({
            name: u.name,
            kin: u.kin,
            weight: u.weight
        })),
        day: typeof window.getCurrentRunDay === "function"
            ? window.getCurrentRunDay()
            : "",
        tp: Number(window.mtosTimePressureSummary?.value ?? 0),
        attractorType: String(window.mtosAttractorState?.type || "unknown"),
        attractorIntensity: Number(window.mtosAttractorState?.intensity ?? 0),
        memory: sortedMemory,
        locked: sortedLocked
    })
}

function getAllEdges() {
    return buildEdges(activeUsers, memory, locked, matrix)
}

function getEdges() {
    const filter = String(window.networkRelationFilter || "all")
    const cacheKey = makeAllEdgesKey() + "::filter=" + filter

    if (
        window._networkEdgesCache &&
        window._networkEdgesCache.key === cacheKey &&
        Array.isArray(window._networkEdgesCache.edges)
    ) {
        return window._networkEdgesCache.edges
    }

    const edges = getAllEdges()

    window._networkEdgesCache.key = cacheKey
    window._networkEdgesCache.edges = edges

    return edges
}

function invalidateEdgesCache() {
    window._networkEdgesCache = {
        key: "",
        edges: null,
        allKey: "",
        allEdges: null
    }
    physicsEdges = []
}

    function styleModeBtn(btn) {
        btn.style.background = "rgba(255,255,255,0.04)"
        btn.style.color = "#e5e7eb"
        btn.style.border = "1px solid rgba(255,255,255,0.12)"
        btn.style.padding = "10px 16px"
        btn.style.cursor = "pointer"
        btn.style.fontFamily = "Arial, sans-serif"
        btn.style.fontSize = "13px"
        btn.style.borderRadius = "999px"
        btn.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)"
    }

    let selected = null
    let hover = null
    let hoverEdge = null

    const edgePopup = ensurePopup()

    function hideEdgePopup() {
        edgePopup.style.display = "none"
    }

    function makeModeBtn(label, mode, btnId) {
        const btn = document.createElement("button")
        btn.id = btnId
        btn.innerText = label
        styleModeBtn(btn)

        btn.onclick = () => {
            if (!window.setNetworkMode) return

            if (mode === "edit") {
                window.setNetworkMode(window.networkMode === "edit" ? "interaction" : "edit")
            } else if (mode === "link") {
                window.setNetworkMode(window.networkMode === "link" ? "interaction" : "link")
            } else if (mode === "contact") {
                window.setNetworkMode(window.networkMode === "contact" ? "interaction" : "contact")
            } else {
                window.setNetworkMode("interaction")
            }

            selected = null
            hoverEdge = null
            hideEdgePopup()
        }

        return btn
    }

    panel.appendChild(makeModeBtn(t("edit"), "edit", "modeEdit"))
    panel.appendChild(makeModeBtn(t("link"), "link", "modeLink"))
    panel.appendChild(makeModeBtn(t("contact"), "contact", "modeContact"))
    root.appendChild(panel)

    const relationPanel = document.createElement("div")
    relationPanel.style.display = "flex"
    relationPanel.style.justifyContent = "center"
    relationPanel.style.gap = "8px"
    relationPanel.style.flexWrap = "wrap"
    relationPanel.style.marginBottom = "14px"

    function makeRelationBtn(label, filter, btnId) {
        const btn = document.createElement("button")
        btn.id = btnId
        btn.innerText = label
        styleModeBtn(btn)

        btn.onclick = () => {
            window.setNetworkRelationFilter(filter)
            hoverEdge = null
            hideEdgePopup()
        }

        return btn
    }

    relationPanel.appendChild(makeRelationBtn(t("all"), "all", "relFilterAll"))
    relationPanel.appendChild(makeRelationBtn(t("support"), "strong_support", "relFilterStrongSupport"))
    relationPanel.appendChild(makeRelationBtn(t("weak_support"), "weak_support", "relFilterWeakSupport"))
    relationPanel.appendChild(makeRelationBtn(t("neutral"), "neutral", "relFilterNeutral"))
    relationPanel.appendChild(makeRelationBtn(t("tension"), "tension", "relFilterTension"))
    relationPanel.appendChild(makeRelationBtn(t("conflict"), "conflict", "relFilterConflict"))
    relationPanel.appendChild(makeRelationBtn(t("strong_conflict"), "strong_conflict", "relFilterStrongConflict"))
    relationPanel.appendChild(makeRelationBtn(t("contact"), "contact", "relFilterContact"))
    root.appendChild(relationPanel)

    function paintRelationButtons() {
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

        const activeBtn = document.getElementById(activeMap[String(window.networkRelationFilter || "all")])
        if (!activeBtn) return

        activeBtn.style.background = "linear-gradient(90deg, rgba(0,255,136,0.90), rgba(110,255,190,0.86))"
        activeBtn.style.color = "#04110d"
        activeBtn.style.borderColor = "transparent"
        activeBtn.style.boxShadow = "0 0 20px rgba(0,255,136,0.20)"
    }

    function paintModeButtons() {
        ;["modeEdit", "modeLink", "modeContact"].forEach(id => {
            const btn = document.getElementById(id)
            if (!btn) return
            btn.style.background = "rgba(255,255,255,0.04)"
            btn.style.color = "#e5e7eb"
            btn.style.borderColor = "rgba(255,255,255,0.12)"
            btn.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)"
        })

        if (window.networkMode === "edit") {
            const btn = document.getElementById("modeEdit")
            if (btn) {
                btn.style.background = "linear-gradient(90deg, rgba(0,255,136,0.90), rgba(110,255,190,0.86))"
                btn.style.color = "#04110d"
                btn.style.borderColor = "transparent"
                btn.style.boxShadow = "0 0 20px rgba(0,255,136,0.20)"
            }
        }

        if (window.networkMode === "link") {
            const btn = document.getElementById("modeLink")
            if (btn) {
                btn.style.background = "linear-gradient(90deg, rgba(102,204,255,0.92), rgba(140,225,255,0.86))"
                btn.style.color = "#041018"
                btn.style.borderColor = "transparent"
                btn.style.boxShadow = "0 0 20px rgba(102,204,255,0.18)"
            }
        }

        if (window.networkMode === "contact") {
            const btn = document.getElementById("modeContact")
            if (btn) {
                btn.style.background = "linear-gradient(90deg, rgba(255,209,102,0.95), rgba(255,230,160,0.88))"
                btn.style.color = "#1a1405"
                btn.style.borderColor = "transparent"
                btn.style.boxShadow = "0 0 20px rgba(255,209,102,0.20)"
            }
        }
    }

    paintRelationButtons()
    paintModeButtons()

    const frame = document.createElement("div")
    frame.style.maxWidth = "760px"
    frame.style.margin = "0 auto"
    frame.style.padding = "14px"
    frame.style.border = "1px solid rgba(255,255,255,0.10)"
    frame.style.borderRadius = "28px"
    frame.style.background =
        "radial-gradient(circle at 12% 100%, rgba(0,255,136,0.08), transparent 26%)," +
        "radial-gradient(circle at 88% 100%, rgba(255,210,80,0.06), transparent 22%)," +
        "linear-gradient(180deg, rgba(7,9,13,0.98) 0%, rgba(3,5,8,1) 100%)"
    frame.style.boxShadow = "0 24px 60px rgba(0,0,0,0.40), inset 0 0 0 1px rgba(255,255,255,0.02)"
    frame.style.position = "relative"
    frame.style.boxSizing = "border-box"

    const frameLabel = document.createElement("div")
    frameLabel.innerText = t("interaction_map")
    frameLabel.style.position = "absolute"
    frameLabel.style.top = "10px"
    frameLabel.style.left = "18px"
    frameLabel.style.fontSize = "11px"
    frameLabel.style.letterSpacing = "0.16em"
    frameLabel.style.color = "#7f8792"
    frameLabel.style.textTransform = "uppercase"
    frame.appendChild(frameLabel)

    const canvas = document.createElement("canvas")
    const isMobile = window.innerWidth < 768
    const rootWidth = Math.max(280, root.clientWidth || window.innerWidth)
    const size = isMobile ? Math.min(rootWidth - 16, 420) : Math.min(rootWidth - 40, 720)

    canvas.width = size
    canvas.height = isMobile ? Math.round(size * 0.82) : Math.round(size * 0.88)
    canvas.style.width = `${canvas.width}px`
    canvas.style.height = `${canvas.height}px`
    canvas.style.display = "block"
    canvas.style.margin = "0 auto"
    canvas.style.border = "1px solid rgba(255,255,255,0.08)"
    canvas.style.borderRadius = "24px"
    canvas.style.background =
        "radial-gradient(circle at 20% 100%, rgba(0,255,136,0.08), transparent 28%)," +
        "radial-gradient(circle at 85% 100%, rgba(255,200,64,0.06), transparent 24%)," +
        "linear-gradient(180deg, rgba(8,10,14,0.98) 0%, rgba(4,6,9,1) 100%)"
    canvas.style.boxShadow = "0 20px 50px rgba(0,0,0,0.35)"
    canvas.style.touchAction = "none"

    frame.appendChild(canvas)
    root.appendChild(frame)

    const desc = document.createElement("div")
    desc.innerText =
        t("nodes_desc") + "\n" +
        t("colors_desc") + "\n" +
        t("zoom_desc") + "\n" +
        t("inspect_desc") + "\n" +
        t("edit_desc") + "\n" +
        t("link_desc") + "\n" +
        t("contact_desc")
    desc.style.whiteSpace = "pre-line"
    desc.style.color = "#9aa4b2"
    desc.style.textAlign = "center"
    desc.style.marginTop = "12px"
    desc.style.fontSize = "13px"
    desc.style.lineHeight = "1.6"
    desc.style.maxWidth = "620px"
    desc.style.marginLeft = "auto"
    desc.style.marginRight = "auto"
    root.appendChild(desc)

    const ctx = canvas.getContext("2d")
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    const cols = Math.max(4, Math.ceil(Math.sqrt(Math.max(1, N))))
    const rows = Math.max(1, Math.ceil(Math.max(1, N) / cols))
    const innerPadX = 110
    const innerPadY = 90
    const usableW = Math.max(180, canvas.width - innerPadX * 2)
    const usableH = Math.max(180, canvas.height - innerPadY * 2)
    const cellW = usableW / Math.max(1, cols - 1)
    const cellH = usableH / Math.max(1, rows - 1)

    const positions = activeUsers.map((u, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const jitterX = (((i * 37) % 21) - 10) * 3.2
        const jitterY = (((i * 53) % 17) - 8) * 3.2

        return {
            x: innerPadX + col * cellW + jitterX,
            y: innerPadY + row * cellH + jitterY
        }
    })

    const velocities = activeUsers.map(() => ({ x: 0, y: 0 }))

    let scale = 1
    let offsetX = 0
    let offsetY = 0

    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0
    let dragMoved = false
    const dragThreshold = 6

    let touchMode = null
    let pinchStartDistance = 0
    let pinchStartScale = 1

    function moveEdgePopup(clientX, clientY) {
        const x = Math.min(clientX + 12, window.innerWidth - 300)
        const y = Math.min(clientY + 12, window.innerHeight - 220)
        edgePopup.style.left = `${x}px`
        edgePopup.style.top = `${y}px`
    }

    function showEdgePopup(clientX, clientY, payload) {
        if (!payload) return

        const score = Number(payload.score ?? 0)
        const adjustedScore = Number(payload.adjustedScore ?? score)
        const baseScoreAB = Number(payload.baseScoreAB ?? payload.scoreAB ?? 0)
        const baseScoreBA = Number(payload.baseScoreBA ?? payload.scoreBA ?? 0)
        const relationFeedbackScalar = Number(payload.relationFeedbackScalar ?? 0)
        const attractorValue = payload.attractorValue
        const timePressure = Number(payload.timePressure ?? 0)
        const temporalMode = payload.temporalMode || "EXPLORE"
        const isTodayRealContact = !!payload.isTodayRealContact
        const relationVisual = getRelationVisual(
    payload.scoreAB,
    payload.scoreBA,
    isTodayRealContact
)
const relationType = relationVisual.label
const finalPairScore = Number(payload.score ?? 0)

        const localVolume = clamp(Math.abs(score), 0, 1)
        const localPhi = localVolume
        const localK = localPhi / Math.max(0.001, 0.22 + localVolume * 0.55)
        const localConsistency = Math.abs(localPhi - localK * (0.22 + localVolume * 0.55))

        const relationTypeLabel = window.translateRelationLabel
    ? window.translateRelationLabel(relationType)
    : relationType
    
    const temporalModeLabel = window.translateModeLabel
    ? window.translateModeLabel(temporalMode)
    : t("mode_" + String(temporalMode || "").toLowerCase())

edgePopup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div style="font-weight:bold;">${t("relation")}</div>
        <button id="closeNetworkEdgePopup" style="
            background:#111827;
            color:#cbd5e1;
            border:1px solid #334155;
            border-radius:6px;
            cursor:pointer;
            font-size:11px;
            padding:2px 6px;
        ">×</button>
    </div>

    <div><b>${payload.a}</b> ↔ <b>${payload.b}</b></div>
    <div style="margin-top:6px;">${t("type")}: <b>${relationTypeLabel}</b></div>
    <div>${t("base_ab")}: ${baseScoreAB.toFixed(3)}</div>
    <div>${t("base_ba")}: ${baseScoreBA.toFixed(3)}</div>
    <div>${t("feedback")}: ${relationFeedbackScalar >= 0 ? "+" : ""}${relationFeedbackScalar.toFixed(3)}</div>
    <div>${t("final")}: ${score.toFixed(3)}</div>
    <div>${t("final_pair")}: ${finalPairScore.toFixed(3)}</div>
    <div>${t("pressure")}: ${timePressure.toFixed(3)}</div>
    <div>${t("phi")}: ${localPhi.toFixed(3)}</div>
    <div>${t("k")}: ${localK.toFixed(3)}</div>
    <div>${t("consistency")}: ${localConsistency.toFixed(4)}</div>
<div>${t("urgency")}: ${Number(payload.urgency ?? 0).toFixed(3)}</div>
<div>${t("temporal")}: ${temporalModeLabel}</div>
<div>${t("band")}: ${translateBandLabel(payload.temporalBand)}</div>
    ${isTodayRealContact ? `<div style="color:#ffd166;">${t("today_contact")}: ${t("yes")}</div>` : ``}
    ${
        attractorValue !== null && attractorValue !== undefined
            ? `<div>${t("field")}: ${Number(attractorValue).toFixed(3)}</div>`
            : ``
    }
`

        const closeBtn = document.getElementById("closeNetworkEdgePopup")
        if (closeBtn) {
            closeBtn.onclick = () => hideEdgePopup()
        }

        moveEdgePopup(clientX, clientY)
        edgePopup.style.display = "block"
    }

    function getEdgeAt(mx, my) {
        const edges = getEdges()

        for (const edge of edges) {
    const p1 = positions[edge.i]
    const p2 = positions[edge.j]

    if (!p1 || !p2) continue

    const x1 = p1.x
    const y1 = p1.y
    const x2 = p2.x
    const y2 = p2.y

            const A = mx - x1
            const B = my - y1
            const C = x2 - x1
            const D = y2 - y1

            const dot = A * C + B * D
            const lenSq = C * C + D * D
            const param = lenSq > 0 ? dot / lenSq : -1

            if (param < 0 || param > 1) continue

            const xx = x1 + param * C
            const yy = y1 + param * D
            const dx = mx - xx
            const dy = my - yy
            const dist = Math.sqrt(dx * dx + dy * dy)

            const threshold = Math.max(10, Math.abs(edge.displayScore) * 8)
            if (dist > threshold) continue

            const edgePressure = getEdgePressureProfile(
                edge.displayScore,
                edge.adjustedScore,
                edge.isTodayRealContact,
                edge.attractorValue
            )

            return {
    a: edge.a,
    b: edge.b,

    score: edge.displayScore,
    scoreAB: edge.scoreAB,
    scoreBA: edge.scoreBA,
    baseScoreAB: edge.baseScoreAB,
    baseScoreBA: edge.baseScoreBA,
    relationFeedbackScalar: edge.relationFeedbackScalar,

    adjustedScore: edge.adjustedScore,
    attractorValue: edge.attractorValue,

    timePressure: edgePressure.pressure,
    temporalMode: edgePressure.temporalMode,
    temporalBand: edgePressure.band,
    urgency: edgePressure.urgency,

    isTodayRealContact: edge.isTodayRealContact
}
        }

        return null
    }

    let physicsEdges = []
    window.physicsEdges = physicsEdges

function rebuildPhysicsEdges() {
    const edges = getEdges()

    physicsEdges = edges
    window.physicsEdges = physicsEdges
}

    function applyClustering() {
    const tp = getTimePressureState()
    const clusterThreshold = 0.3 + tp.pressure * 0.12

    physicsEdges.forEach(edge => {
        const score = edge.displayScore
        if (score <= clusterThreshold) return

        const dx = positions[edge.j].x - positions[edge.i].x
        const dy = positions[edge.j].y - positions[edge.i].y

        const clusterMul =
            tp.pressure >= 0.62
                ? (1 - tp.pressure * 0.35)
                : (1 + (1 - tp.pressure) * 0.08)

        positions[edge.i].x += dx * 0.01 * score * clusterMul
        positions[edge.i].y += dy * 0.01 * score * clusterMul
        positions[edge.j].x -= dx * 0.01 * score * clusterMul
        positions[edge.j].y -= dy * 0.01 * score * clusterMul
    })
}

    function applyForces() {
        const tp = getTimePressureState()

        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const dx = positions[j].x - positions[i].x
                const dy = positions[j].y - positions[i].y
                const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
                const forceBase = 42 / dist

                const isTodayRealContact = isTodayContactResolved(
    activeUsers[i].name,
    activeUsers[j].name
)

                let contactBoost = 1
                if (isTodayRealContact) {
                    contactBoost = 1.6 + tp.urgency * 0.4
                }

                const force =
                    forceBase *
                    (1 + tp.pressure * 0.18 + tp.urgency * 0.08) *
                    contactBoost

                const fx = force * dx / dist
                const fy = force * dy / dist

                velocities[i].x -= fx
                velocities[i].y -= fy
                velocities[j].x += fx
                velocities[j].y += fy
            }
        }

        for (let i = 0; i < N; i++) {
            velocities[i].x += (cx - positions[i].x) * 0.00045
            velocities[i].y += (cy - positions[i].y) * 0.00045
        }

        for (let i = 0; i < N; i++) {
            positions[i].x += velocities[i].x
            positions[i].y += velocities[i].y

            const damping = 0.90 - tp.pressure * 0.06
            velocities[i].x *= damping
            velocities[i].y *= damping
        }
    }

    let lastFeedbackTime = 0

function draw() {
    const edges = physicsEdges
    if (!Array.isArray(edges)) return

    const now = performance.now()

if (
    !Array.isArray(window.currentNetworkRelations) ||
    window.currentNetworkRelations.length !== edges.length ||
    now - lastFeedbackTime > 1200
) {
    computeNetworkFeedback(activeUsers, edges)
    lastFeedbackTime = now
}

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.translate(offsetX, offsetY)
        ctx.scale(scale, scale)

        for (const edge of edges) {
    const p1 = positions[edge.i]
    const p2 = positions[edge.j]

    if (!p1 || !p2) continue
            const isHover =
                hoverEdge &&
                (
                    (hoverEdge.a === edge.a && hoverEdge.b === edge.b) ||
                    (hoverEdge.a === edge.b && hoverEdge.b === edge.a)
                )

            const relationVisual = getRelationVisual(
    edge.scoreAB,
    edge.scoreBA,
    edge.isTodayRealContact
)

const adjustedScore = relationVisual.dominantScore
const normalizedScore = adjustedScore

                ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)

            if (selected !== null && edge.i !== selected && edge.j !== selected) {
                ctx.globalAlpha = 0.05
            } else {
                ctx.globalAlpha =
                    0.07 +
                    Math.abs(adjustedScore) * 0.82 +
                    (edge.isTodayRealContact ? 0.10 : 0)
            }

            ctx.strokeStyle = edge.isTodayRealContact ? "#ffd166" : relationVisual.color

if (edge.isTodayRealContact) {
    ctx.shadowBlur = isHover ? 10 : 6
    ctx.shadowColor = "#ffd166"
} else {
    ctx.shadowBlur = 0
    ctx.shadowColor = "transparent"
}

const negativeBoost = adjustedScore < 0 ? 1.15 : 1

if (edge.isTodayRealContact) {
    ctx.lineWidth = isHover ? 6.5 : 4.2
} else {
    ctx.lineWidth = isHover
        ? Math.max(4.2, Math.abs(normalizedScore) * 8.5 * negativeBoost + 2)
        : Math.max(1.1, Math.abs(normalizedScore) * 4.8 * negativeBoost + 0.6)
}

            if (isHover) ctx.globalAlpha = 1
            ctx.stroke()

            ctx.shadowBlur = 0
            ctx.shadowColor = "transparent"
        }

        ctx.globalAlpha = 1

        for (let i = 0; i < N; i++) {
            const user = activeUsers[i]
            const p = positions[i]

            const isSelected = i === selected
            const isHover = i === hover
            const visual = getNodeVisualState(user)
            const radius = getNodeRadius(user, isSelected, isHover)

            const fontSize = Math.max(11, Math.min(15, radius * 0.42))
            ctx.font = `600 ${fontSize}px Arial`
            const textWidth = ctx.measureText(user.name).width

            const bubbleWidth = Math.max(radius * 2.1, textWidth + 22)
            const bubbleHeight = Math.max(28, radius * 1.35)
            const x = p.x - bubbleWidth / 2
            const y = p.y - bubbleHeight / 2

            roundRectPath(ctx, x, y, bubbleWidth, bubbleHeight, bubbleHeight / 2)

            ctx.fillStyle = "rgba(10,12,18,0.96)"
            ctx.fill()

            ctx.strokeStyle = getNodeStrokeColor(visual.state)
            ctx.lineWidth = isSelected ? 3 : isHover ? 2.2 : 1.4
            ctx.stroke()

            ctx.fillStyle = "#f8fafc"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(user.name, p.x + 4, p.y)
        }

        ctx.restore()
    }

    window._networkRedraw = () => {
    hideEdgePopup()

    paintRelationButtons()
    paintModeButtons()

    rebuildPhysicsEdges()
    computeNetworkFeedback(activeUsers, physicsEdges)
    draw()

    if (typeof window.updateMTOSBranch === "function") {
        window.updateMTOSBranch("network", {
            relations: window.currentNetworkRelations || [],
            relationSummary: {
                supportCount: physicsEdges.filter(e => e.displayScore > 0).length,
                conflictCount: physicsEdges.filter(e => e.displayScore < 0).length,
                ultraCount: physicsEdges.filter(e => Math.abs(e.displayScore) > 0.8).length
            },
            timePressure: Number(window.mtosTimePressureSummary?.value ?? 0)
        })
    }
}

window._networkInvalidate = () => {
    invalidateEdgesCache()
}

    function getNodeAt(mx, my) {
        for (let i = 0; i < N; i++) {
            const dx = mx - positions[i].x
            const dy = my - positions[i].y
            const hitRadius = getNodeRadius(activeUsers[i], selected === i, hover === i) + 6
            if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
                return i
            }
        }
        return null
    }

    canvas.onclick = (e) => {
        if (dragMoved) {
            dragMoved = false
            return
        }

        const rect = canvas.getBoundingClientRect()
        const mx = (e.clientX - rect.left - offsetX) / scale
        const my = (e.clientY - rect.top - offsetY) / scale

        const currentMode = window.networkMode
        const nodeIndex = getNodeAt(mx, my)

        const linkMode = window.networkMode === "link"
        const shiftLink = !!e.shiftKey
        const contactMode = window.networkMode === "contact"

        if (linkMode || shiftLink) {
    if (nodeIndex !== null) {
        if (selected !== null && selected !== nodeIndex) {
            const a = activeUsers[selected].name
            const b = activeUsers[nodeIndex].name

            {
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const lockedNow = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    memory[`${a}->${b}`] = 1
    memory[`${b}->${a}`] = 1

    delete lockedNow[`${a}->${b}`]
    delete lockedNow[`${b}->${a}`]

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory))
    localStorage.setItem("mtos_locked_relations", JSON.stringify(lockedNow))

    window._lockedCache = null
}

window.__mtos_force_fresh_run = true

reloadMemoryFromStorage()
invalidateEdgesCache()
rebuildPhysicsEdges()
computeNetworkFeedback(activeUsers, physicsEdges)
draw()

            selected = null
            hoverEdge = null
            hideEdgePopup()
            return
        }

        selected = nodeIndex
        hideEdgePopup()
        draw()
    }
    return
}

        if (contactMode) {
    if (nodeIndex !== null) {
        if (selected !== null && selected !== nodeIndex) {
            const a = activeUsers[selected].name
            const b = activeUsers[nodeIndex].name

            const dayKey = typeof window.getCurrentRunDay === "function"
    ? window.getCurrentRunDay()
    : new Date().toISOString().slice(0, 10)

const alreadyMarked =
    typeof window.isTodayContact === "function"
        ? window.isTodayContact(a, b)
        : false

        if (typeof window.getUserId === "function") {
    window.getUserId(a)
    window.getUserId(b)
}

window.currentUsers = JSON.parse(JSON.stringify(activeUsers))

window.__mtos_force_fresh_run = true;

if (alreadyMarked) {
    if (typeof window.unmarkTodayContact === "function") {
        window.unmarkTodayContact(a, b)
    }
} else {
    if (typeof window.markTodayContact === "function") {
        window.markTodayContact(a, b, dayKey)
    }
}

window.__mtos_force_fresh_run = true;

window.networkRelationFilter = "contact"
paintRelationButtons()
selected = null
hoverEdge = null
hideEdgePopup()

activeUsers = Array.isArray(window.currentUsers) ? window.currentUsers.slice() : activeUsers
reloadMemoryFromStorage()
invalidateEdgesCache()
rebuildPhysicsEdges()
computeNetworkFeedback(activeUsers, physicsEdges)
draw()

return

        }

        selected = nodeIndex
        hideEdgePopup()
        draw()
    }
    return
}

        if (currentMode === "edit") {
    if (nodeIndex !== null) {
        const name = activeUsers[nodeIndex].name
        if (confirm(`Удалить ${name}?`)) {
            const nextUsers = activeUsers.filter(u => u && u.name !== name)

window.currentUsers = JSON.parse(JSON.stringify(nextUsers))

selected = null
hoverEdge = null
hideEdgePopup()

if (typeof window._networkInvalidate === "function") {
    window._networkInvalidate()
}

window._networkRedraw = null

if (typeof window._rerenderNetworkOnly === "function") {
    window._rerenderNetworkOnly()
}

if (window.removeUser) {
    window.removeUser(name)
}

window.__mtos_force_fresh_run = true

            selected = null
            hoverEdge = null
            hideEdgePopup()

            if (typeof window._networkInvalidate === "function") {
    window._networkInvalidate()
}

window._networkRedraw = null

if (typeof window._rerenderNetworkOnly === "function") {
    window._rerenderNetworkOnly()
}
        }
        return
    }

            const edge = getEdgeAt(mx, my)
            if (edge) {
                if (confirm(`Удалить связь ${edge.a} ↔ ${edge.b}?`)) {
                    {
    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    const lockedNow = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")

    memory[`${edge.a}->${edge.b}`] = 0
    memory[`${edge.b}->${edge.a}`] = 0

    if (e.shiftKey) {
        lockedNow[`${edge.a}->${edge.b}`] = true
        lockedNow[`${edge.b}->${edge.a}`] = true
    } else {
        delete lockedNow[`${edge.a}->${edge.b}`]
        delete lockedNow[`${edge.b}->${edge.a}`]
    }

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory))
    localStorage.setItem("mtos_locked_relations", JSON.stringify(lockedNow))

    window._lockedCache = null
}

window.__mtos_force_fresh_run = true

window._networkRedraw = null
window._rerenderNetworkOnly()
                }
            }

            return
        }

        const edge = getEdgeAt(mx, my)
        if (edge) {
            hoverEdge = edge
            showEdgePopup(e.clientX, e.clientY, edge)
            draw()
            return
        }

        if (nodeIndex !== null) {
            selected = selected === nodeIndex ? null : nodeIndex
            hideEdgePopup()

            if (onSelect) {
                onSelect(selected !== null ? activeUsers[selected] : null)
            }

            draw()
            return
        }

        selected = null
        hoverEdge = null
        hideEdgePopup()
        draw()
    }

    canvas.onwheel = (e) => {
        e.preventDefault()

        const zoom = e.deltaY < 0 ? 1.1 : 0.9
        const mx = e.offsetX
        const my = e.offsetY

        offsetX = mx - (mx - offsetX) * zoom
        offsetY = my - (my - offsetY) * zoom
        scale = clamp(scale * zoom, 0.4, 3)

        draw()
    }

    canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            touchMode = "drag"
            isDragging = true
            dragMoved = false
            dragStartX = e.touches[0].clientX
            dragStartY = e.touches[0].clientY
        } else if (e.touches.length === 2) {
            touchMode = "pinch"
            isDragging = false
            pinchStartDistance = getTouchDistance(e.touches[0], e.touches[1])
            pinchStartScale = scale
        }
    }, { passive: false })

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault()

        if (touchMode === "drag" && e.touches.length === 1) {
            const dxScreen = e.touches[0].clientX - dragStartX
            const dyScreen = e.touches[0].clientY - dragStartY

            if (!dragMoved && Math.sqrt(dxScreen * dxScreen + dyScreen * dyScreen) > dragThreshold) {
                dragMoved = true
            }

            if (dragMoved) {
                offsetX += dxScreen
                offsetY += dyScreen
                dragStartX = e.touches[0].clientX
                dragStartY = e.touches[0].clientY
                draw()
            }
        } else if (touchMode === "pinch" && e.touches.length === 2) {
            const newDistance = getTouchDistance(e.touches[0], e.touches[1])
            if (!pinchStartDistance) return

            const newScale = clamp(pinchStartScale * (newDistance / pinchStartDistance), 0.4, 3)
            const center = getTouchCenter(e.touches[0], e.touches[1])
            const rect = canvas.getBoundingClientRect()
            const mx = center.x - rect.left
            const my = center.y - rect.top

            offsetX = mx - (mx - offsetX) * (newScale / scale)
            offsetY = my - (my - offsetY) * (newScale / scale)
            scale = newScale

            draw()
        }
    }, { passive: false })

    canvas.addEventListener("touchend", () => {
        if (touchMode === "drag") {
            isDragging = false
        }

        if (touchMode === "pinch") {
            pinchStartDistance = 0
            pinchStartScale = scale
        }

        touchMode = null
    }, { passive: false })

    canvas.onmousedown = (e) => {
        isDragging = true
        dragMoved = false
        dragStartX = e.clientX
        dragStartY = e.clientY
    }

    canvas.onmouseup = () => {
        isDragging = false
    }

    canvas.onmouseleave = () => {
        isDragging = false
        hover = null
        hoverEdge = null
        canvas.style.cursor = "grab"
        draw()
    }

    let prevHoverEdgeKey = null

    let lastHoverCheck = 0
const HOVER_INTERVAL = 60

canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left - offsetX) / scale
    const my = (e.clientY - rect.top - offsetY) / scale

    const oldHover = hover
    const oldHoverEdgeKey = prevHoverEdgeKey

    hover = null
    hoverEdge = null

    const nodeIndex = getNodeAt(mx, my)
if (nodeIndex !== null) {
    hover = nodeIndex
    canvas.style.cursor = "pointer"
} else {
    const now = performance.now()

    if (now - lastHoverCheck > HOVER_INTERVAL) {
        hoverEdge = getEdgeAt(mx, my)
        lastHoverCheck = now
    }

    if (hoverEdge) {
        canvas.style.cursor = "pointer"
    } else {
        canvas.style.cursor = isDragging ? "grabbing" : "grab"
    }
}

    const newHoverEdgeKey = hoverEdge ? `${hoverEdge.a}|${hoverEdge.b}` : null
    prevHoverEdgeKey = newHoverEdgeKey

    if (isDragging) {
        const dxScreen = e.clientX - dragStartX
        const dyScreen = e.clientY - dragStartY

        if (!dragMoved && Math.sqrt(dxScreen * dxScreen + dyScreen * dyScreen) > dragThreshold) {
            dragMoved = true
        }

        if (dragMoved) {
            offsetX += dxScreen
            offsetY += dyScreen
            dragStartX = e.clientX
            dragStartY = e.clientY
            draw()
        }

        return
    }

    //if (oldHover !== hover || oldHoverEdgeKey !== newHoverEdgeKey) {
        //draw()
    //}
}

    window._networkDocClickHandler = (evt) => {
        const popupHit = evt.target.closest("#networkEdgePopup")
        const canvasHit = evt.target === canvas
        if (!popupHit && !canvasHit) {
            hideEdgePopup()
        }
    }

    document.addEventListener("click", window._networkDocClickHandler)

    let frameCount = 0

    function relaxNetwork(iterations = 1) {
        for (let k = 0; k < iterations; k++) {
            applyClustering()
            applyForces()
        }
    }


function loop() {
    if (frameCount % 3 === 0) {
    relaxNetwork(1)
}
    frameCount++
        draw()
        window._networkRAF = requestAnimationFrame(loop)
    }

    if (!window.setNetworkHistoryIndex) {
        window.setNetworkHistoryIndex = (i) => {
            historyIndex = i
        }
    }

    rebuildPhysicsEdges()

    draw()
    loop()
}