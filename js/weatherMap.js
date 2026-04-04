import { KinRegistry } from "./kinRegistry.js"

window._weatherMode = "full"

export function drawWeatherMap(
    id,
    data,
    userKin,
    highlightKin,
    pressureData,
    fieldData,
    selectedAgent,
    attractorField = null
){
    const root = document.getElementById(id)
    if (!root) return

    window._lastWeatherArgs = [...arguments]

    const users = selectedAgent ? [selectedAgent] : (window.currentUsers || [])
    const usersByKin = {}

    users.forEach(u => {
        const k = Number(u.kin)
        if (!Number.isFinite(k)) return
        if (!usersByKin[k]) usersByKin[k] = []
        usersByKin[k].push(u)
    })

    window._weatherUsersByKin = usersByKin

    let popup = document.getElementById("kinPopup")
    if (!popup) {
    popup = document.createElement("div")
    popup.id = "kinPopup"
    popup.className = "weather-popup"
    popup.dataset.pinned = "false"
    popup.setAttribute("translate", "no")
    popup.setAttribute("lang", "ru")
    popup.classList.add("notranslate")
    document.body.appendChild(popup)
}

    while (root.firstChild) {
        root.removeChild(root.firstChild)
    }
    root.style.display = "block"

    const ds = window.mtosDayState || {}
    const decision = window.mtosDecision || {}
    const tpSummary = window.mtosTimePressureSummary || {}
    const attractorState = window.mtosAttractorState || {}
    const networkFeedback = window.mtosNetworkFeedback || {}
    const dayImpact = window.mtosTodayContactImpact || { pairs: 0, weight: 0, active: false }

    const summary = buildWeatherSummary({
        ds,
        decision,
        tpSummary,
        attractorState,
        networkFeedback,
        userKin,
        highlightKin,
        dayImpact
    })

    const summaryCard = document.createElement("div")
summaryCard.className = "weather-summary-card"
summaryCard.innerHTML = `
    <div class="weather-summary-top">
        <div class="weather-summary-pill">
            Today Mode: <b>${escapeHtml(summary.mode)}</b>
        </div>
        <div class="weather-summary-pill">
            Day Type: <b style="color:${summary.dayColor};">${escapeHtml(summary.dayType)}</b>
        </div>
        <div class="weather-summary-pill">
            Energy: <b>${escapeHtml(summary.energy)}</b>
        </div>
        <div class="weather-summary-pill">
            Risk: <b style="color:${summary.riskColor};">${escapeHtml(summary.risk)}</b>
        </div>
    </div>

    <div class="weather-summary-meta">
        <span>Trust <b>${summary.trust}%</b></span>
        <span>Time pressure <b>${escapeHtml(summary.timePressureLabel)}</b></span>
        <span>Real contacts <b>${summary.realContacts}</b></span>
        <span>Attractor <b>${escapeHtml(summary.attractorType)}</b></span>
        <span>Φ <b>${Number(window.mtosMetabolicMetrics?.phi ?? 0).toFixed(3)}</b></span>
        <span>k <b>${Number(window.mtosMetabolicMetrics?.k ?? 0).toFixed(3)}</b></span>
        <span>T <b>${Number(window.mtosMetabolicMetrics?.T ?? 0).toFixed(3)}</b></span>
    </div>
`
    root.appendChild(summaryCard)

    const grid = document.createElement("div")
    grid.style.width = "fit-content"
    grid.style.display = "grid"

    const isMobile = window.innerWidth < 768
    const cellSize = isMobile ? 24 : 34
    const headSize = isMobile ? 20 : 26
    const gapSize = isMobile ? 3 : 4

    grid.style.gridTemplateColumns = `${headSize}px repeat(20, ${cellSize}px)`
    grid.style.gridTemplateRows = `${headSize}px repeat(13, ${cellSize}px)`
    grid.style.gap = `${gapSize}px`

    const empty = document.createElement("div")
    grid.appendChild(empty)

    for (let s = 1; s <= 20; s++) {
        const cell = document.createElement("div")
        cell.innerText = s
        cell.style.fontSize = isMobile ? "10px" : "12px"
        cell.style.color = "#8b949e"
        cell.style.textAlign = "center"
        cell.style.height = `${headSize}px`
        cell.style.display = "flex"
        cell.style.alignItems = "center"
        cell.style.justifyContent = "center"
        cell.style.letterSpacing = "0.04em"
        grid.appendChild(cell)
    }

    window._lastFieldData = fieldData
    window._lastPressureData = pressureData

    const safeFieldData = Array.isArray(fieldData) ? fieldData : new Array(260).fill(0)
    const safePressureData = Array.isArray(pressureData) ? pressureData : new Array(260).fill(0)

    const fMin = safeFieldData.length ? Math.min(...safeFieldData) : 0
    const fMax = safeFieldData.length ? Math.max(...safeFieldData) : 1

    const pMin = safePressureData.length ? Math.min(...safePressureData) : 0
    const pMax = safePressureData.length ? Math.max(...safePressureData) : 1

    for (let tone = 1; tone <= 13; tone++) {
        const toneCell = document.createElement("div")
        toneCell.innerText = tone
        toneCell.style.fontSize = isMobile ? "10px" : "13px"
        toneCell.style.color = "#8b949e"
        toneCell.style.display = "flex"
        toneCell.style.alignItems = "center"
        toneCell.style.justifyContent = "flex-end"
        toneCell.style.paddingRight = "6px"
        toneCell.style.letterSpacing = "0.03em"
        grid.appendChild(toneCell)

        for (let seal = 1; seal <= 20; seal++) {
            let kin = (seal - 1) * 13 + tone
            while (kin > 260) kin -= 260

            const idx = KinRegistry.toIndex(kin)
            let phi = safeFieldData[idx] ?? 0

            const toneNorm = (tone - 1) / 12
            const sealNorm = (seal - 1) / 19

            const lattice = Math.sin((toneNorm + sealNorm) * Math.PI)
            const latticeNorm = (lattice + 1) / 2

            let waveSum = 0
            const activeAgents = selectedAgent ? [selectedAgent] : users

            for (let a = 0; a < activeAgents.length; a++) {
                const agent = activeAgents[a]
                if (!agent?.kin) continue

                const aKin = KinRegistry.toIndex(agent.kin)
                let dist = Math.abs(idx - aKin)
                dist = Math.min(dist, 260 - dist)

                const phase = Number(agent.phase || 0)
                const amplitude = Number(agent.weight || 1)

                const wave =
                    Math.sin(dist / 5 + phase) *
                    Math.exp(-dist / 12)

                waveSum += amplitude * wave
            }

            const waveNorm = (waveSum + 1) / 2

            if (selectedAgent) {
                const aKin = KinRegistry.toIndex(selectedAgent.kin)
                let dist = Math.abs(idx - aKin)
                dist = Math.min(dist, 260 - dist)

                const influence = Math.exp(-dist / 10)
                phi *= influence
            }

            const fieldNorm = (phi - fMin) / ((fMax - fMin) || 1)
            const p = ((safePressureData[idx] ?? 0) - pMin) / ((pMax - pMin) || 1)

            let combined = 0
            const mode = window._weatherMode || "full"

            if (mode === "field") {
                combined = fieldNorm
            } else if (mode === "attractor") {
                const attractor = attractorField?.[idx] ?? fieldNorm
                combined = attractor
            } else if (mode === "lattice") {
                combined = latticeNorm
            } else if (mode === "wave") {
                combined = waveNorm
            } else if (mode === "pressure") {
                combined = p
            } else {
                    const sysPhi = Number(window.mtosMetabolicMetrics?.phi ?? 0.5)
                    const sysConsistency = Number(window.mtosMetabolicMetrics?.consistency ?? 0)

                    combined =
                        0.42 * fieldNorm +
                        0.22 * latticeNorm +
                        0.20 * waveNorm +
                        0.16 * Math.max(0, Math.min(1, sysPhi - sysConsistency))
                    }

            combined = clamp01(combined)

            let r = Math.floor(255 * combined)
            let g = Math.floor(120 * (1 - Math.abs(combined - 0.5) * 2))
            let b = Math.floor(255 * (1 - combined))

            r += p * 40
            b += p * 60

            r = Math.max(0, Math.min(255, Math.round(r)))
            g = Math.max(0, Math.min(255, Math.round(g)))
            b = Math.max(0, Math.min(255, Math.round(b)))

            const cell = document.createElement("div")
            const sealIndex = (kin - 1) % 20
            const name = window.SEALS ? window.SEALS[sealIndex] : String(sealIndex + 1)
            const usersInKin = users.filter(u => Number(u.kin) === kin)
            const kinState = getKinHumanState(kin)

            cell.innerText = String(name).slice(0, 2)
            cell.style.fontSize = isMobile ? "9px" : "11px"
            cell.style.fontWeight = "700"
            cell.style.display = "flex"
            cell.style.alignItems = "center"
            cell.style.justifyContent = "center"
            cell.style.letterSpacing = "0.01em"
            cell.style.borderRadius = isMobile ? "7px" : "9px"
            cell.style.transition = "transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease"
            cell.style.position = "relative"

            cell.dataset.kin = String(kin)

const isUser = kin === userKin
const isToday = kin === highlightKin
const isRisk = kinState.zone === "Risk zone"
const isHot = kinState.zone === "Hot zone"
const isCold = kinState.zone === "Cold zone"

cell.style.width = `${cellSize}px`
cell.style.height = `${cellSize}px`
cell.style.background = `linear-gradient(180deg, rgba(${r},${g},${b},0.96) 0%, rgba(${Math.max(0, r - 18)},${Math.max(0, g - 18)},${Math.max(0, b - 18)},0.98) 100%)`

if (isRisk) {
    cell.style.background = `linear-gradient(180deg, rgba(255,70,70,0.92) 0%, rgba(${Math.max(0, r - 28)},${Math.max(0, g - 40)},${Math.max(0, b - 40)},0.98) 100%)`
}

if (isHot) {
    cell.style.background = `linear-gradient(180deg, rgba(0,255,136,0.22) 0%, rgba(${r},${Math.min(255, g + 26)},${b},0.98) 100%)`
}

if (isCold) {
    cell.style.background = `linear-gradient(180deg, rgba(80,190,255,0.22) 0%, rgba(${r},${g},${Math.min(255, b + 30)},0.98) 100%)`
}

cell.style.boxSizing = "border-box"
cell.style.cursor = "pointer"
cell.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,0.03)"

let extraShadow = []
let extraBorder = "1px solid rgba(255,255,255,0.14)"
let extraOutline = ""
let zoneStripe = null
if (!isRisk && !isHot && !isCold) {
    extraBorder = "1px solid rgba(255,255,255,0.10)"
    extraOutline = "2px solid rgba(160,170,190,0.18)"
    extraShadow.push(
        "0 0 0 1px rgba(255,255,255,0.04) inset"
    )
}

            if (isRisk) {
    extraBorder = "1px solid rgba(255,255,255,0.14)"
    extraOutline = "3px solid #ff4d4f"
    zoneStripe = "#ff4d4f"
    extraShadow.push(
        "0 0 0 1px rgba(255,255,255,0.08) inset",
        "0 0 0 2px rgba(255,77,79,0.26) inset",
        "0 0 16px rgba(255,77,79,0.34)"
    )
}

if (isHot) {
    extraBorder = "1px solid rgba(255,255,255,0.14)"
    extraOutline = "3px solid #00ff88"
    zoneStripe = "#00ff88"
    extraShadow.push(
        "0 0 0 1px rgba(255,255,255,0.08) inset",
        "0 0 0 2px rgba(0,255,136,0.26) inset",
        "0 0 16px rgba(0,255,136,0.34)"
    )
}

if (isCold) {
    extraBorder = "1px solid rgba(255,255,255,0.14)"
    extraOutline = "3px solid #50beff"
    zoneStripe = "#50beff"
    extraShadow.push(
        "0 0 0 1px rgba(255,255,255,0.08) inset",
        "0 0 0 2px rgba(80,190,255,0.26) inset",
        "0 0 16px rgba(80,190,255,0.34)"
    )
}

            if (isToday) {
                extraShadow.push("0 0 0 2px rgba(255,215,0,0.98) inset")
            }

            if (isUser) {
                extraShadow.push("0 0 0 3px rgba(255,255,255,0.98) inset")
            }

            cell.style.border = extraBorder

            if (extraOutline) {
    cell.style.outline = extraOutline
    cell.style.outlineOffset = "-2px"
} else {
    cell.style.outline = "none"
}

            if (zoneStripe) {
    const stripe = document.createElement("div")
    stripe.style.position = "absolute"
    stripe.style.left = "0"
    stripe.style.top = "0"
    stripe.style.bottom = "0"
    stripe.style.width = "4px"
    stripe.style.background = zoneStripe
    stripe.style.borderTopLeftRadius = isMobile ? "7px" : "9px"
    stripe.style.borderBottomLeftRadius = isMobile ? "7px" : "9px"
    stripe.style.pointerEvents = "none"
    stripe.style.boxShadow = `0 0 10px ${zoneStripe}`
    cell.appendChild(stripe)
}

            cell.style.boxShadow = [
                "inset 0 0 0 1px rgba(255,255,255,0.03)",
                ...extraShadow
            ].join(", ")

            if (kinState.zone === "Risk zone") {
                const badge = document.createElement("div")
                badge.textContent = "!"
                badge.style.position = "absolute"
                badge.style.left = "4px"
                badge.style.top = "2px"
                badge.style.width = isMobile ? "12px" : "15px"
                badge.style.height = isMobile ? "12px" : "15px"
                badge.style.display = "flex"
                badge.style.alignItems = "center"
                badge.style.justifyContent = "center"
                badge.style.borderRadius = "999px"
                badge.style.background = "rgba(255,50,50,0.95)"
                badge.style.border = "1px solid rgba(255,255,255,0.55)"
                badge.style.fontSize = isMobile ? "9px" : "11px"
                badge.style.fontWeight = "900"
                badge.style.color = "#ffffff"
                badge.style.lineHeight = "1"
                badge.style.textShadow = "0 1px 2px rgba(0,0,0,0.7)"
                badge.style.boxShadow = "0 0 10px rgba(255,60,60,0.55)"
                badge.style.pointerEvents = "none"
                cell.appendChild(badge)
            }

            if (kinState.zone === "Hot zone") {
                const badge = document.createElement("div")
                badge.textContent = "●"
                badge.style.position = "absolute"
                badge.style.left = "4px"
                badge.style.top = "2px"
                badge.style.width = isMobile ? "12px" : "15px"
                badge.style.height = isMobile ? "12px" : "15px"
                badge.style.display = "flex"
                badge.style.alignItems = "center"
                badge.style.justifyContent = "center"
                badge.style.borderRadius = "999px"
                badge.style.background = "rgba(0,255,136,0.16)"
                badge.style.border = "1px solid rgba(0,255,136,0.75)"
                badge.style.fontSize = isMobile ? "10px" : "12px"
                badge.style.fontWeight = "900"
                badge.style.color = "#00ff88"
                badge.style.lineHeight = "1"
                badge.style.textShadow = "0 0 8px rgba(0,255,136,0.75)"
                badge.style.boxShadow = "0 0 10px rgba(0,255,136,0.40)"
                badge.style.pointerEvents = "none"
                cell.appendChild(badge)
            }

            if (usersInKin.length > 0) {
                const marker = document.createElement("div")
                marker.textContent = usersInKin.length > 9 ? "9+" : String(usersInKin.length)
                marker.style.position = "absolute"
                marker.style.right = "1px"
                marker.style.bottom = "1px"
                marker.style.minWidth = isMobile ? "12px" : "14px"
                marker.style.height = isMobile ? "12px" : "14px"
                marker.style.padding = "0 2px"
                marker.style.borderRadius = "10px"
                marker.style.background = "linear-gradient(180deg, rgba(8,10,14,0.95), rgba(18,22,30,0.95))"
                marker.style.color = "#f8fafc"
                marker.style.fontSize = isMobile ? "8px" : "9px"
                marker.style.lineHeight = isMobile ? "12px" : "14px"
                marker.style.fontWeight = "800"
                marker.style.textAlign = "center"
                marker.style.pointerEvents = "none"
                marker.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.10), 0 4px 10px rgba(0,0,0,0.25)"
                cell.appendChild(marker)
            }

            if (usersInKin.length > 0) {
                cell.style.color = "#fff"
                cell.style.textShadow = "0 1px 2px rgba(0,0,0,0.8)"
            }

            const usersText = usersInKin.length
                ? usersInKin.map(u => `${u.name} (${u.kin})`).join(", ")
                : "No users"

            const hoverUsers = usersInKin.length
                ? usersInKin.map(u => {
                    const loc = u.location || u.city || u.country || "location unknown"
                    return `${u.name} — ${loc}`
                }).join("\n")
                : "No users"

            cell.removeAttribute("title")

            cell.addEventListener("click", (e) => onCellClick(kin, e))
            cell.addEventListener("touchstart", (e) => onCellClick(kin, e), { passive: true })
            cell.addEventListener("mouseenter", (e) => {
                showKinHover(kin, e)
                cell.style.transform = "translateY(-1px)"
                cell.style.borderColor = "rgba(255,255,255,0.22)"
            })
            cell.addEventListener("mousemove", (e) => moveKinPopup(e))
            cell.addEventListener("mouseleave", () => {
                hideKinHover()
                cell.style.transform = "translateY(0)"
                cell.style.borderColor = extraBorder
            })

            grid.appendChild(cell)
        }
    }

    const legend = document.createElement("div")
    legend.className = "weather-legend-card"
    legend.innerHTML = `
        <div class="weather-mode-title">Map mode</div>

        <div id="modeButtons" class="weather-mode-buttons">
            <button data-mode="full" onclick="setWeatherMode('full')">Full</button>
            <button data-mode="field" onclick="setWeatherMode('field')">Users / Field</button>
            <button data-mode="pressure" onclick="setWeatherMode('pressure')">Pressure</button>
        </div>

        <div class="weather-copy">
            <b>Full</b> — overall cognitive climate.<br>
            <b>Users / Field</b> — where participants and active zones are concentrated.<br>
            <b>Pressure</b> — where overload and tension accumulate.
        </div>

        <div class="weather-legend-title" style="margin-top:14px;">Legend</div>

        <div class="weather-dots">
            <div class="weather-dot-item">
                <span class="weather-dot" style="background:#60a5fa;"></span>
                <span>Low field</span>
            </div>
            <div class="weather-dot-item">
                <span class="weather-dot" style="background:#8b5cf6;"></span>
                <span>Balanced</span>
            </div>
            <div class="weather-dot-item">
                <span class="weather-dot" style="background:#fb7185;"></span>
                <span>High field</span>
            </div>
        </div>

        <div class="weather-legend-title" style="margin-top:14px;">Quick reading</div>

        <div class="weather-copy">
            <b style="color:#00ff88;">● Hot zone</b> — better for movement, focus, and active steps.<br>
            <b style="color:#66ccff;">◌ Cold zone</b> — better for rest, observation, and low-pressure tasks.<br>
            <b style="color:#ff6b6b;">! Risk zone</b> — tension, overload, or conflict may rise here.<br>
            <b>White frame</b> — your current kin.<br>
            <b>Yellow frame</b> — today’s kin.
        </div>

        <div class="weather-legend-title" style="margin-top:14px;">About this map</div>

        <div class="weather-copy">
            13×20 cognitive field (260 states).<br><br>
            Horizontal → Seal (1–20)<br>
            Vertical → Tone (1–13)<br><br>
            Click any cell to inspect the current state.
        </div>
    `

    const stage = document.createElement("div")
    stage.className = "weather-stage"

    const wrapper = document.createElement("div")
    wrapper.className = "weather-grid-wrap"

    const panel = document.createElement("div")
    panel.className = "weather-grid-panel"

    wrapper.appendChild(grid)
    panel.appendChild(wrapper)
    panel.appendChild(legend)
    stage.appendChild(panel)
    root.appendChild(stage)

    setTimeout(updateModeButtons, 0)
}

function onCellClick(kin, e){
    const popup = document.getElementById("kinPopup")
    if (!popup) return

    moveKinPopup(e)

    const i = KinRegistry.toIndex(kin)
    const phi = window._lastFieldData?.[i] ?? 0
    const pressureRaw = window._lastPressureData?.[i] ?? 0
    const state = getKinHumanState(kin)

    const attractor = Array.isArray(window._attractorField)
        ? Number(window._attractorField[i] ?? 0.5)
        : 0.5

    const isUserKin = kin === window._userKin
    const ds = isUserKin ? (window.mtosDayState || null) : null
    const mode = String(window.mtosDecision?.mode || "EXPLORE").toUpperCase()
    const usersHere = window._weatherUsersByKin?.[kin] || []

    let advice = "Observe the zone."
    let avoid = "Avoid overreaction."

    if (state.zone === "Hot zone") {
        advice = "Good zone for action, movement, and active decisions."
        avoid = "Avoid wasting the window."
    } else if (state.zone === "Cold zone") {
        advice = "Better for rest, observation, or low-pressure tasks."
        avoid = "Avoid forcing output."
    } else if (state.zone === "Risk zone") {
        advice = "Tension is high here. Move carefully."
        avoid = "Avoid conflict, overload, and irreversible moves."
    } else {
        advice = "Balanced zone for moderate work."
        avoid = "Avoid reading too much into weak signals."
    }

    const uniqueUsers = []
const seenUsers = new Set()

usersHere.forEach(u => {
    const key = `${String(u?.name || "")}__${Number(u?.kin || 0)}`
    if (seenUsers.has(key)) return
    seenUsers.add(key)
    uniqueUsers.push(u)
})

const usersHtml = uniqueUsers.length
    ? uniqueUsers.map(u => {
        const loc = u.city || u.country || u.location
            ? ` — ${u.city || u.country || u.location}`
            : ""
        return `<div>• ${escapeHtml(u.name)}${escapeHtml(loc)}</div>`
    }).join("")
    : `<div style="color:#888;">No participants in this kin</div>`

    popup.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-weight:bold; font-size:14px;">
                Kin ${kin} · ${escapeHtml(state.zone)}
            </div>
            <button id="closeKinPopup" style="
                background:#111827;
                color:#cbd5e1;
                border:1px solid #334155;
                border-radius:6px;
                cursor:pointer;
                font-size:11px;
                padding:2px 6px;
            ">×</button>
        </div>

        <div style="display:grid; gap:4px; margin-bottom:10px;">
            <div>Attention: <b>${state.attention.toFixed(2)}</b></div>
            <div>Pressure: <b>${clamp01(Number(pressureRaw)).toFixed(2)}</b></div>
            <div>Conflict: <b>${state.conflict.toFixed(2)}</b></div>
            <div>Attractor: <b>${attractor.toFixed(2)}</b></div>
            <div>Φ: <b>${Number(phi).toFixed(2)}</b></div>
        </div>

        <div style="margin-top:8px; padding:8px 10px; border:1px solid rgba(255,255,255,0.08); border-radius:10px; background:rgba(255,255,255,0.03);">
            <div style="font-size:11px; letter-spacing:0.08em; color:#8b949e; text-transform:uppercase; margin-bottom:6px;">What to do here</div>
            <div style="color:#f3f4f6; margin-bottom:6px;">${escapeHtml(advice)}</div>
            <div style="color:#9ca3af;">Avoid: ${escapeHtml(avoid)}</div>
        </div>

        <div style="margin-top:10px; padding-top:8px; border-top:1px solid #333;">
            <div style="font-weight:bold; margin-bottom:4px;">Participants:</div>
            ${usersHtml}
        </div>

        ${
            ds ? `
            <div style="margin-top:10px; padding-top:8px; border-top:1px solid #333;">
                <div style="color:${escapeHtml(ds.dayColor || "#d1d5db")}; font-weight:bold;">
                    Your day type: ${escapeHtml(ds.dayLabel || "UNKNOWN")}
                </div>
                <div>Current mode: ${escapeHtml(mode)}</div>
                <div>Day index: ${Number(ds.dayIndex ?? 0).toFixed(2)}</div>
            </div>
            ` : ""
        }

        <div style="margin-top:8px; color:#aaa;">
            Tone: ${((kin - 1) % 13) + 1} · Seal: ${((kin - 1) % 20) + 1}
        </div>
    `

    popup.style.display = "block"
    popup.dataset.pinned = "true"

    const closeBtn = document.getElementById("closeKinPopup")
    if (closeBtn) {
        closeBtn.onclick = () => {
            popup.style.display = "none"
            popup.dataset.pinned = "false"
        }
    }

    if (window.onKinSelect) {
        window.onKinSelect(kin)
    }
}

function moveKinPopup(e){
    const popup = document.getElementById("kinPopup")
    if (!popup) return

    let x = 0
    let y = 0

    if (e?.touches && e.touches[0]) {
        x = e.touches[0].clientX
        y = e.touches[0].clientY
    } else {
        x = e?.clientX ?? 0
        y = e?.clientY ?? 0
    }

    x = Math.min(x, window.innerWidth - 280)
    y = Math.min(y, window.innerHeight - 220)

    popup.style.left = (x + 12) + "px"
    popup.style.top = (y + 12) + "px"
}

function showKinHover(kin, e){
    const popup = document.getElementById("kinPopup")
    if (!popup) return
    if (popup.dataset.pinned === "true") return

    moveKinPopup(e)

    const i = KinRegistry.toIndex(kin)
    const phi = window._lastFieldData?.[i] ?? 0
    const state = getKinHumanState(kin)
    const usersHere = window._weatherUsersByKin?.[kin] || []

    const uniqueUsers = []
const seenUsers = new Set()

usersHere.forEach(u => {
    const key = `${String(u?.name || "")}__${Number(u?.kin || 0)}`
    if (seenUsers.has(key)) return
    seenUsers.add(key)
    uniqueUsers.push(u)
})

const usersHtml = uniqueUsers.length
    ? uniqueUsers.map(u => {
        const loc = u.city || u.country || u.location
            ? ` — ${escapeHtml(u.city || u.country || u.location)}`
            : ""
        return `<div>• ${escapeHtml(u.name)}${loc}</div>`
    }).join("")
    : `<div style="color:#888;">No users</div>`

    popup.innerHTML = `
        <div style="font-weight:bold; margin-bottom:6px;">Kin ${kin} · ${escapeHtml(state.zone)}</div>
        <div>Φ: ${Number(phi).toFixed(3)}</div>
        <div>Attention: ${state.attention.toFixed(2)}</div>
        <div>Pressure: ${state.pressure.toFixed(2)}</div>
        <div style="margin-top:8px; padding-top:6px; border-top:1px solid #333;">
            <div style="font-weight:bold; margin-bottom:4px;">Users:</div>
            ${usersHtml}
        </div>
    `

    popup.style.display = "block"
}

function hideKinHover(){
    const popup = document.getElementById("kinPopup")
    if (!popup) return
    if (popup.dataset.pinned === "true") return
    popup.style.display = "none"
}

window.setWeatherMode = function(mode){
    window._weatherMode = mode

    if (window._lastWeatherArgs) {
        drawWeatherMap(...window._lastWeatherArgs)
    }

    setTimeout(updateModeButtons, 0)
}

function updateModeButtons(){
    const mode = window._weatherMode
    document.querySelectorAll("#modeButtons button").forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add("active")
        } else {
            btn.classList.remove("active")
        }
    })
}

document.addEventListener("click", (e) => {
    const popup = document.getElementById("kinPopup")
    if (!popup) return
    if (popup.style.display !== "block") return

    const clickedCell = e.target.closest("[data-kin]")
    const clickedPopup = e.target.closest("#kinPopup")

    if (!clickedCell && !clickedPopup) {
        popup.style.display = "none"
        popup.dataset.pinned = "false"
    }
})

document.addEventListener("contextmenu", () => {
    const popup = document.getElementById("kinPopup")
    if (popup) {
        popup.style.display = "none"
        popup.dataset.pinned = "false"
    }
})

function clamp01(v){
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

function escapeHtml(value){
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;")
}

function getWeatherEnergyLabel(ds = {}){
    const attention = Number(ds.attention ?? 0.5)
    const activity = Number(ds.activity ?? attention)
    const pressure = Number(ds.pressure ?? 0)
    const conflict = Number(ds.conflict ?? 0)

    const energy =
        attention * 0.40 +
        activity * 0.30 +
        (1 - pressure) * 0.18 +
        (1 - conflict) * 0.12

    if (energy >= 0.72) return "High"
    if (energy >= 0.48) return "Medium"
    return "Low"
}

function getWeatherRisk(ds = {}, tpSummary = {}, attractorState = {}, networkFeedback = {}){
    const pressure = Number(ds.pressure ?? 0)
    const conflict = Number(ds.conflict ?? 0)
    const tp = Number(tpSummary.value ?? 0)
    const attractorType = String(attractorState.type || "unknown").toLowerCase()
    const netConflict = Number(networkFeedback.conflictRatio ?? 0)

    if (tp >= 0.82 || pressure >= 0.78) {
        return { label: "Overload", color: "#ff7a59" }
    }
    if (conflict >= 0.52 || netConflict >= 0.45) {
        return { label: "Conflict", color: "#ff5c7a" }
    }
    if (attractorType === "chaos") {
        return { label: "Chaotic", color: "#ff6666" }
    }
    if (tp >= 0.62) {
        return { label: "Compressed", color: "#ffb347" }
    }
    return { label: "Manageable", color: "#00ff88" }
}

function getWeatherAction(mode){
    const m = String(mode || "EXPLORE").toUpperCase()

    if (m === "FOCUS") {
        return {
            action: "Finish one important task and keep the field narrow.",
            avoid: "Avoid multitasking and noisy communication."
        }
    }

    if (m === "REST") {
        return {
            action: "Reduce load and keep only maintenance actions.",
            avoid: "Avoid pressure decisions and overload."
        }
    }

    if (m === "INTERACT") {
        return {
            action: "Use the day for contact, alignment, and social movement.",
            avoid: "Avoid reactive arguments and too many parallel contacts."
        }
    }

    return {
        action: "Explore carefully, collect signals, test without forcing.",
        avoid: "Avoid rigid commitments too early."
    }
}

function buildWeatherSummary({
    ds = {},
    decision = {},
    tpSummary = {},
    attractorState = {},
    networkFeedback = {},
    userKin = null,
    highlightKin = null,
    dayImpact = {}
} = {}){
    const mode = String(decision.mode || "EXPLORE").toUpperCase()
    const trust = Math.round(clamp01(Number(decision.confidence ?? 0.5)) * 100)
    const dayType = String(ds.dayLabel || "NEUTRAL").toUpperCase()
    const dayColor = String(ds.dayColor || "#d1d5db")
    const energy = getWeatherEnergyLabel(ds)
    const risk = getWeatherRisk(ds, tpSummary, attractorState, networkFeedback)

    return {
    mode,
    trust,
    dayType,
    dayColor,
    energy,
    risk: risk.label,
    riskColor: risk.color,
    timePressureLabel: String(tpSummary.label || "low"),
    attractorType: String(attractorState.type || "unknown"),
    realContacts: Number(ds.realContacts ?? dayImpact.pairs ?? 0),
    userKin,
    highlightKin
}
}

function getKinHumanState(kin){
    const i = KinRegistry.toIndex(kin)
    const weather = Array.isArray(window._weather) ? (window._weather[i] || {}) : {}
    const pressure = clamp01(Number(weather.pressure ?? 0))
    const attention = clamp01(Number(weather.attention ?? 0.5))
    const activity = clamp01(Number(weather.activity ?? attention))
    const conflict = clamp01(Number(weather.conflict ?? 0))
    const attractor = Array.isArray(window._attractorField)
        ? clamp01(Number(window._attractorField[i] ?? 0.5))
        : 0.5

        let zone = "Balanced zone"

const riskScore =
    pressure * 0.72 +
    conflict * 0.28

const hotScore =
    attention * 0.64 +
    attractor * 0.36

const coldScore =
    (1 - attention) * 0.64 +
    (1 - attractor) * 0.36

if (riskScore >= 0.34) {
    zone = "Risk zone"
} else if (hotScore >= 0.54) {
    zone = "Hot zone"
} else if (coldScore >= 0.54) {
    zone = "Cold zone"
}

    return {
        attention,
        activity,
        pressure,
        conflict,
        attractor,
        zone
    }
}