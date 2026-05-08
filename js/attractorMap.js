function at(key){
    if (typeof window.t === "function") return window.t(key)
    return key
}

export function drawAttractorMap(id, data, options = {}) {
    const {
        size = 20,
        labels = null,
        meanings = null,
        selectedSeal = null
    } = options

    const root = document.getElementById(id)
    if (!root) return

    if (typeof root._destroyAttractorMap === "function") {
        root._destroyAttractorMap()
    }

    root.innerHTML = ""

    const safeData = Array.isArray(data) ? data : []
    const total = size * size

    const values = new Array(total).fill(0).map((_, i) => {
        const v = Number(safeData[i] ?? 0)
        return Math.max(0, Math.min(1, v))
    })

    const isMobile = window.innerWidth < 900
    const cell = isMobile ? 20 : 26
    const gap = 2
    const labelPad = isMobile ? 26 : 34
    const topPad = isMobile ? 22 : 28
    const bottomPad = isMobile ? 22 : 28

    const gridW = size * cell + (size - 1) * gap
    const gridH = size * cell + (size - 1) * gap

    let selectedCell = null

    const wrapper = document.createElement("div")
    wrapper.style.display = "grid"
    wrapper.style.gridTemplateColumns = isMobile ? "1fr" : "auto 320px"
    wrapper.style.gap = "18px"
    wrapper.style.alignItems = "start"
    wrapper.style.justifyContent = "center"
    wrapper.style.maxWidth = "1100px"
    wrapper.style.margin = "0 auto"

    const leftCol = document.createElement("div")
    leftCol.style.display = "flex"
    leftCol.style.flexDirection = "column"
    leftCol.style.alignItems = "center"
    leftCol.style.justifyContent = "center"

    const canvasWrap = document.createElement("div")
    canvasWrap.style.position = "relative"
    canvasWrap.style.display = "inline-block"
    canvasWrap.style.margin = "0 auto"

    const canvas = document.createElement("canvas")
    canvas.width = gridW + labelPad * 2
    canvas.height = gridH + topPad + bottomPad
    canvas.style.display = "block"
    canvas.style.background = "#030303"
    canvas.style.border = "1px solid #222"
    canvas.style.maxWidth = "100%"
    canvas.style.height = "auto"

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvasWrap.appendChild(canvas)
    leftCol.appendChild(canvasWrap)

    const rightCol = document.createElement("div")
    rightCol.style.width = isMobile ? "100%" : "320px"
    rightCol.style.maxWidth = "100%"
    rightCol.style.boxSizing = "border-box"

    const analysisPanel = document.createElement("div")
    analysisPanel.style.border = "1px solid #223044"
analysisPanel.style.background = "#03070d"
analysisPanel.style.padding = "16px"
analysisPanel.style.fontFamily = "monospace"
analysisPanel.style.fontSize = "13px"
analysisPanel.style.lineHeight = "1.7"
analysisPanel.style.color = "#dbe7f3"
analysisPanel.style.minHeight = isMobile ? "auto" : "520px"
analysisPanel.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.03) inset"
analysisPanel.style.display = "flex"
analysisPanel.style.flexDirection = "column"
analysisPanel.style.gap = "12px"

    rightCol.appendChild(analysisPanel)

    wrapper.appendChild(leftCol)
    wrapper.appendChild(rightCol)
    root.appendChild(wrapper)

    function idx(row, col) {
        return row * size + col
    }

    function get(row, col) {
        const rr = (row + size) % size
        const cc = (col + size) % size
        return values[idx(rr, cc)]
    }

    function lerp(a, b, t) {
        return a + (b - a) * t
    }

    function getHeatColor(v) {
    const x = Math.max(0, Math.min(1, v))

    // cinematic scientific palette:
    // dark blue -> cyan -> green -> yellow -> orange -> red
    const stops = [
        { p: 0.00, c: [8, 25, 48] },     // deep navy
        { p: 0.18, c: [18, 84, 122] },   // blue-cyan
        { p: 0.36, c: [37, 150, 128] },  // teal
        { p: 0.54, c: [120, 178, 88] },  // green
        { p: 0.70, c: [216, 190, 78] },  // yellow
        { p: 0.84, c: [232, 126, 42] },  // orange
        { p: 1.00, c: [181, 42, 26] }    // red
    ]

    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i]
        const b = stops[i + 1]
        if (x >= a.p && x <= b.p) {
            const t = (x - a.p) / (b.p - a.p)
            const r = Math.round(lerp(a.c[0], b.c[0], t))
            const g = Math.round(lerp(a.c[1], b.c[1], t))
            const b2 = Math.round(lerp(a.c[2], b.c[2], t))
            return `rgb(${r},${g},${b2})`
        }
    }

    return "rgb(181,42,26)"
}

    function getContrastColor(v) {
        return v > 0.58 ? "#08120c" : "#d8ffe6"
    }

    function drawArrow(cx, cy, angle, strength, color) {
    const len = 4 + strength * (isMobile ? 7 : 10)
    const wing = 2 + strength * 2.5

    const x2 = cx + Math.cos(angle) * len
    const y2 = cy + Math.sin(angle) * len

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = Math.max(1, 0.8 + strength * 1.6)
    ctx.globalAlpha = 0.78

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    const a1 = angle + Math.PI * 0.83
    const a2 = angle - Math.PI * 0.83

    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 + Math.cos(a1) * wing, y2 + Math.sin(a1) * wing)
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 + Math.cos(a2) * wing, y2 + Math.sin(a2) * wing)
    ctx.stroke()

    ctx.restore()
}

    function computeMemoryBoost(row, col) {
    const memory = window.mtosMemoryLayers || {
        sealMemory: [],
        kinMemory: [],
        userMemory: {}
    }

    const userName = document.getElementById("name")?.value?.trim() || ""
    const userMemoryValue = Number(memory.userMemory?.[userName]?.score ?? 0)

    const rowSealMemory = Number(memory.sealMemory?.[row] ?? 0)
    const colSealMemory = Number(memory.sealMemory?.[col] ?? 0)

    const boost =
        rowSealMemory * 0.10 +
        colSealMemory * 0.10 +
        userMemoryValue * 0.08

    return Math.max(0, Math.min(0.35, boost))
}

function getEffectiveCellValue(row, col) {
    const base = get(row, col)
    const memoryBoost = computeMemoryBoost(row, col)
    const withMemory = Math.max(0, Math.min(1, base + memoryBoost))
    return applySegmentToValue(withMemory, row, col)
}

function getCellKin(row, col) {
    // row = archetype A, col = archetype B
    // для карты берём линейную проекцию через колонку как основной вход,
    // а строку используем как фазовый модификатор
    const baseKin = ((col * 13 + row) % 260) + 1
    return baseKin
}

function getSegmentIndexFromKin(kin) {
    const i = Math.max(0, Math.min(259, Number(kin) - 1))
    return Math.floor(i / 65)
}

function getSegmentName(segment) {
    if (segment === 0) return "initiation"
    if (segment === 1) return "growth"
    if (segment === 2) return "peak"
    return "release"
}

function getSegmentProfileFromWindow(kin) {
    const arr = Array.isArray(window._attractorSegments) ? window._attractorSegments : null
    if (arr && arr[kin - 1]) {
        const seg = arr[kin - 1]
        return {
            segment: Number(seg.segment ?? 0),
            localIndex: Number(seg.localIndex ?? 0),
            name: seg.name || getSegmentName(Number(seg.segment ?? 0)),
            pressureMul: Number(seg.pressureMul ?? 1),
            tempMul: Number(seg.tempMul ?? 1),
            memoryGain: Number(seg.memoryGain ?? 0),
            diffusion: Number(seg.diffusion ?? 0),
            pullMul: Number(seg.pullMul ?? 1),
            value: Number(seg.value ?? 0)
        }
    }

    const segment = getSegmentIndexFromKin(kin)
    const localIndex = (kin - 1) % 65

    return {
        segment,
        localIndex,
        name: getSegmentName(segment),
        pressureMul: 1,
        tempMul: 1,
        memoryGain: 0,
        diffusion: 0,
        pullMul: 1,
        value: 0
    }
}

function getSegmentOverlay(row, col) {
    const kin = getCellKin(row, col)
    const seg = getSegmentProfileFromWindow(kin)
    return {
        kin,
        ...seg
    }
}

function applySegmentToValue(baseValue, row, col) {
    const seg = getSegmentOverlay(row, col)

    let v = baseValue

    // 4×65 phase tint
    if (seg.segment === 0) {
        v *= 0.92 + seg.pullMul * 0.05
    } else if (seg.segment === 1) {
        v *= 0.98 + seg.pullMul * 0.06
    } else if (seg.segment === 2) {
        v *= 1.04 + seg.pullMul * 0.08
    } else {
        v *= 0.90 + seg.pullMul * 0.04
    }

    // local profile
    v += seg.memoryGain * 0.25
    v += seg.diffusion * 0.08

    return Math.max(0, Math.min(1, v))
}

function getSegmentStroke(segment) {
    if (segment === 0) return "rgba(120,170,255,0.32)"   // initiation
    if (segment === 1) return "rgba(90,220,170,0.28)"    // growth
    if (segment === 2) return "rgba(255,210,90,0.34)"    // peak
    return "rgba(255,120,120,0.28)"                      // release
}

function computeFlow(row, col) {
    const value = getEffectiveCellValue(row, col)
    const right = getEffectiveCellValue(row, col + 1)
    const left = getEffectiveCellValue(row, col - 1)
    const down = getEffectiveCellValue(row + 1, col)
    const up = getEffectiveCellValue(row - 1, col)

    const dx = right - left
    const dy = down - up
    const mag = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2.4)
    const angle = Math.atan2(dy, dx)

    const laplacian = (left + right + up + down - 4 * value)
    const localMean = (left + right + up + down + value) / 5
    const contrast = value - localMean
    const memoryBoost = computeMemoryBoost(row, col)

    const seg = getSegmentOverlay(row, col)

return {
    value,
    dx,
    dy,
    mag,
    angle,
    laplacian,
    contrast,
    right,
    left,
    down,
    up,
    memoryBoost,
    kin: seg.kin,
    segment: seg.segment,
    segmentName: seg.name,
    localIndex: seg.localIndex,
    pressureMul: seg.pressureMul,
    tempMul: seg.tempMul,
    memoryGain: seg.memoryGain,
    diffusion: seg.diffusion,
    pullMul: seg.pullMul,
    segmentValue: seg.value
}
}

    function classifyZone(flow) {
        if (flow.value > 0.82 && flow.mag < 0.18) return "peak basin"
        if (flow.value < 0.18 && flow.mag < 0.18) return "weak basin"
        if (flow.mag > 0.55 && flow.contrast > 0.04) return "ridge / strong gradient"
        if (flow.mag > 0.35) return "channel / active flow"
        if (Math.abs(flow.laplacian) > 0.18) return "unstable pocket"
        return "neutral field"
    }

    function describeDirection(angle) {
        const deg = (angle * 180 / Math.PI + 360) % 360

        if (deg >= 337.5 || deg < 22.5) return "→ east"
        if (deg < 67.5) return "↘ south-east"
        if (deg < 112.5) return "↓ south"
        if (deg < 157.5) return "↙ south-west"
        if (deg < 202.5) return "← west"
        if (deg < 247.5) return "↖ north-west"
        if (deg < 292.5) return "↑ north"
        return "↗ north-east"
    }

    function drawLabels() {
        if (!labels) return

        ctx.save()
        ctx.font = `${isMobile ? 9 : 10}px monospace`
        ctx.fillStyle = "#9ca3af"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        for (let c = 0; c < size; c++) {
            const x = labelPad + c * (cell + gap) + cell / 2
            const text = String(labels[c] || c).slice(0, 3)
            ctx.fillText(text, x, topPad / 2)
            ctx.fillText(text, x, topPad + gridH + bottomPad / 2)
        }

        ctx.textAlign = "right"
        for (let r = 0; r < size; r++) {
            const y = topPad + r * (cell + gap) + cell / 2
            const text = String(labels[r] || r).slice(0, 3)
            ctx.fillText(text, labelPad - 6, y)
        }

        ctx.textAlign = "left"
        for (let r = 0; r < size; r++) {
            const y = topPad + r * (cell + gap) + cell / 2
            const text = String(labels[r] || r).slice(0, 3)
            ctx.fillText(text, labelPad + gridW + 6, y)
        }

        ctx.restore()
    }

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const allValues = []

for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
        allValues.push(computeFlow(row, col).value)
    }
}

const minV = Math.min(...allValues)
const maxV = Math.max(...allValues)
const rangeV = Math.max(0.0001, maxV - minV)

        const now = 0

        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const flow = computeFlow(row, col)
                const x = labelPad + col * (cell + gap)
                const y = topPad + row * (cell + gap)

                const pulse = 1

// 1. глобальная нормализация
let vv = (flow.value - minV) / rangeV
vv = Math.pow(vv, 0.72)

if (flow.segment === 0) vv *= 0.96
else if (flow.segment === 1) vv *= 1.02
else if (flow.segment === 2) vv *= 1.08
else if (flow.segment === 3) vv *= 0.94

vv = Math.max(0, Math.min(1, vv * pulse))

                ctx.fillStyle = getHeatColor(vv)
                ctx.fillRect(x, y, cell, cell)

                if (vv > 0.55) {
    ctx.save()
    ctx.globalAlpha = 0.16 + vv * 0.18
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(x + 4, y + 4, cell - 8, cell - 8)
    ctx.restore()
}

                ctx.strokeStyle = "rgba(255,255,255,0.08)"
                ctx.lineWidth = 1
                ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)

                const segStroke = getSegmentStroke(flow.segment)
ctx.strokeStyle = segStroke
ctx.lineWidth = 1
ctx.strokeRect(x + 2.5, y + 2.5, cell - 5, cell - 5)

                if (selectedSeal !== null && row === selectedSeal) {
                    ctx.strokeStyle = "rgba(255,255,0,0.95)"
                    ctx.lineWidth = 1.4
                    ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3)
                }

                if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                    ctx.strokeStyle = "#ffffff"
                    ctx.lineWidth = 2.2
                    ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4)
                }

                if (vv > 0.82) {
                    ctx.save()
                    ctx.shadowColor = "rgba(120,255,170,0.55)"
                    ctx.shadowBlur = 14
                    ctx.strokeStyle = "rgba(220,255,220,0.65)"
                    ctx.lineWidth = 1.2
                    ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6)
                    ctx.strokeStyle = getSegmentStroke(flow.segment)
ctx.lineWidth = 1.1
ctx.strokeRect(x + 5, y + 5, cell - 10, cell - 10)
                    ctx.restore()
                } else if (vv < 0.18) {
                    ctx.strokeStyle = "rgba(255,80,80,0.45)"
                    ctx.lineWidth = 1
                    ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6)
                }

                if (flow.mag > 0.03) {
    const cx = x + cell / 2
    const cy = y + cell / 2

    drawArrow(
        cx,
        cy,
        flow.angle,
        flow.mag,
        vv > 0.62
            ? "rgba(255,255,255,0.70)"
            : "rgba(210,240,255,0.55)"
    )
}

                if (!isMobile && cell >= 24 && selectedCell && selectedCell.row === row && selectedCell.col === col) {
    ctx.fillStyle = "#f8fafc"
    ctx.font = "bold 10px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(flow.value.toFixed(2), x + cell / 2, y + cell / 2)
}
            }
        }

        drawLabels()
    }

    function getCellFromMouse(evt) {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const mx = (evt.clientX - rect.left) * scaleX
        const my = (evt.clientY - rect.top) * scaleY

        const localX = mx - labelPad
        const localY = my - topPad

        if (localX < 0 || localY < 0 || localX > gridW || localY > gridH) {
            return null
        }

        const col = Math.floor(localX / (cell + gap))
        const row = Math.floor(localY / (cell + gap))

        if (col < 0 || col >= size || row < 0 || row >= size) return null

        const x0 = col * (cell + gap)
        const y0 = row * (cell + gap)
        const inCell = (localX - x0) <= cell && (localY - y0) <= cell

        if (!inCell) return null

        return { row, col }
    }

    function updateAnalysisPanel(row, col) {
        const labelA = labels ? labels[row] : String(row)
        const labelB = labels ? labels[col] : String(col)
        const meaningA = meanings ? meanings[row] : ""
        const meaningB = meanings ? meanings[col] : ""

        const flow = computeFlow(row, col)
        const zone = classifyZone(flow)
        const dir = describeDirection(flow.angle)

        const details = window._todaySealInfluence?.[col] || null

        const memory = window.mtosMemoryLayers || { sealMemory: [], kinMemory: [], userMemory: {} }
const sealMemoryValue = Number(memory.sealMemory?.[col] ?? 0)
const userName = document.getElementById("name")?.value?.trim() || ""
const userMemoryValue = Number(memory.userMemory?.[userName]?.score ?? 0)

        const membersHtml = details && Array.isArray(details.members) && details.members.length
            ? details.members.map(m => {
                return `<div>• ${m.name} <span style="color:#888;">(Kin ${m.kin}, ${Number(m.score ?? 0).toFixed(2)})</span></div>`
            }).join("")
            : `<div style="color:#777;">${at("noUsersWord")}</div>`

        analysisPanel.innerHTML = `
            <div style="font-size:13px; color:#fff; margin-bottom:10px;">
    <b>${at("attractorCellTitle")}</b>
</div>

            <div style="margin-bottom:10px; padding:10px; border:1px solid #1f2937; background:#080808;">
    <div><b>Row seal:</b> ${labelA}</div>
${meaningA ? `<div style="color:#888;">${meaningA}</div>` : ""}
<div style="margin-top:6px;"><b>Column seal:</b> ${labelB}</div>
${meaningB ? `<div style="color:#888;">${meaningB}</div>` : ""}
</div>

            <div style="margin-bottom:10px; padding:10px; border:1px solid #1f2937; background:#080808;">
    <div><b>${at("kinLabel")}:</b> ${flow.kin}</div>
<div><b>${at("segmentLabel")}:</b> ${flow.segment} — ${flow.segmentName}</div>
<div><b>${at("localIndexLabel")}:</b> ${flow.localIndex} / 64</div>
</div>

            <div style="margin-bottom:10px; padding:10px; border:1px solid #1f2937; background:#080808;">
    <div><b>${at("heatLabel")}:</b> ${flow.value.toFixed(3)}</div>
<div><b>${at("memoryBoostLabel")}:</b> ${flow.memoryBoost.toFixed(3)}</div>
${Number(flow.segmentValue ?? 0) !== 0 ? `<div><b>${at("segmentFieldLabel")}:</b> ${Number(flow.segmentValue).toFixed(3)}</div>` : ""}
${flow.pressureMul !== 1 ? `<div><b>${at("pressureMulLabel")}:</b> ${flow.pressureMul.toFixed(3)}</div>` : ""}
${flow.tempMul !== 1 ? `<div><b>${at("tempMulLabel")}:</b> ${flow.tempMul.toFixed(3)}</div>` : ""}
${flow.memoryGain !== 0 ? `<div><b>${at("memoryGainLabel")}:</b> ${flow.memoryGain.toFixed(3)}</div>` : ""}
${flow.diffusion !== 0 ? `<div><b>${at("diffusionLabel")}:</b> ${flow.diffusion.toFixed(3)}</div>` : ""}
${flow.pullMul !== 1 ? `<div><b>${at("pullMulLabel")}:</b> ${flow.pullMul.toFixed(3)}</div>` : ""}
<div><b>${at("flowXLabel")}:</b> ${flow.dx.toFixed(3)}</div>
<div><b>${at("flowYLabel")}:</b> ${flow.dy.toFixed(3)}</div>
<div><b>${at("strengthLabel")}:</b> ${flow.mag.toFixed(3)}</div>
<div><b>${at("directionLabel")}:</b> ${dir}</div>
<div><b>${at("laplacianLabel")}:</b> ${flow.laplacian.toFixed(3)}</div>
<div><b>${at("contrastLabel")}:</b> ${flow.contrast.toFixed(3)}</div>
</div>
            <div style="margin-bottom:10px; padding:10px; border:1px solid #1f2937; background:#080808;">
                <div><b>${at("zoneTypeLabel")}:</b> ${zone}</div>
                <div style="color:#888; margin-top:4px;">
                    ${
                        zone === "peak basin" ? at("zonePeakBasinDesc")
: zone === "weak basin" ? at("zoneWeakBasinDesc")
: zone === "ridge / strong gradient" ? at("zoneRidgeDesc")
: zone === "channel / active flow" ? at("zoneChannelDesc")
: zone === "unstable pocket" ? at("zoneUnstablePocketDesc")
: at("zoneNeutralFieldDesc")
                    }
                </div>
            </div>

            <div style="margin-bottom:10px; padding:10px; border:1px solid #1f2937; background:#080808;">
                ${
    details
        ? `
<div><b>${at("supportAvgLabel")}:</b> ${(details.supportAvg ?? 0).toFixed(3)}</div>
<div><b>${at("conflictAvgLabel")}:</b> ${(details.conflictAvg ?? 0).toFixed(3)}</div>
<div><b>${at("usersLabel")}:</b> ${details.count ?? 0}</div>
`
        : `<div style="color:#777;">${at("noSocialLayerData")}</div>`
}
            </div>

            <div style="margin-bottom:10px; padding:10px; border:1px solid #1f2937; background:#080808;">
${
    details
        ? `
<div><b>${at("archetypePolarityLabel")}:</b> ${(details.polarity ?? 0).toFixed(3)}</div>
<div><b>${at("userPolarityLabel")}:</b> ${(details.userPolarity ?? 0).toFixed(3)}</div>
<div><b>${at("alignmentLabel")}:</b> ${(details.polarityAlignment ?? 0).toFixed(3)}</div>
<div><b>${at("tensionLabel")}:</b> ${(details.polarityTension ?? 0).toFixed(3)}</div>
`
        : `<div style="color:#777;">${at("noPolarityData")}</div>`
}
</div>

<div style="margin-bottom:10px; padding:10px; border:1px solid #1f2937; background:#080808;">
${
    sealMemoryValue > 0 || userMemoryValue > 0
        ? `
<div><b>${at("sealMemoryLabel")}:</b> ${sealMemoryValue.toFixed(3)}</div>
<div><b>${at("userMemoryLabel")}:</b> ${userMemoryValue.toFixed(3)}</div>
<div style="color:#888; margin-top:4px;">
    ${at("sealMemoryDesc")}<br>
    ${at("userMemoryDesc")}
</div>
`
        : `<div style="color:#777;">${at("noAccumulatedMemorySignal")}</div>`
}
</div>

            <div style="padding:10px; border:1px solid #1f2937; background:#080808;">
                <div style="margin-bottom:6px;"><b>${at("membersLabel")}</b></div>
                ${membersHtml}
            </div>
        `
    }

    function setSelection(row, col) {
        selectedCell = { row, col }
        updateAnalysisPanel(row, col)
        drawGrid()
    }

    canvas.addEventListener("mousemove", (evt) => {
        const cellInfo = getCellFromMouse(evt)
        if (!cellInfo) {
            canvas.title = ""
            return
        }

        const flow = computeFlow(cellInfo.row, cellInfo.col)
        const labelA = labels ? labels[cellInfo.row] : String(cellInfo.row)
        const labelB = labels ? labels[cellInfo.col] : String(cellInfo.col)

        canvas.title = [
            `A: ${labelA}`,
            `B: ${labelB}`,
            `Heat: ${flow.value.toFixed(3)}`,
            `Flow X: ${flow.dx.toFixed(3)}`,
            `Flow Y: ${flow.dy.toFixed(3)}`,
            `Strength: ${flow.mag.toFixed(3)}`,
            `Zone: ${classifyZone(flow)}`
        ].join("\n")
    })

    canvas.addEventListener("click", (evt) => {
        const cellInfo = getCellFromMouse(evt)
        if (!cellInfo) return

        setSelection(cellInfo.row, cellInfo.col)
    })

    drawGrid()

    if (selectedSeal !== null) {
    selectedCell = { row: selectedSeal, col: selectedSeal }
    updateAnalysisPanel(selectedSeal, selectedSeal)
    drawGrid()
} else {
    selectedCell = null
    drawGrid()
    analysisPanel.innerHTML = `
        <div style="font-size:13px; color:#fff; margin-bottom:10px;">
            <b>${at("attractorMapTitle")}</b>
        </div>
        <div style="color:#9ca3af; line-height:1.7;">
            ${at("clickAnyCellInspect")}
        </div>
    `
}

    root._destroyAttractorMap = () => {}

    const legend = document.createElement("div")
    legend.style.marginTop = "12px"
    legend.style.fontSize = "12px"
    legend.style.color = "#888"
    legend.style.fontFamily = "monospace"
    legend.style.textAlign = "center"
    legend.innerHTML = `
${at("heatmapFlowField")}<br>
${at("brightStrongSynergy")}<br>
${at("arrowsDirectionField")}<br>
${at("clickCellMiniAnalysis")}
    `
    leftCol.appendChild(legend)

    const desc = document.createElement("div")
    desc.style.marginTop = "10px"
    desc.style.fontSize = "12px"
    desc.style.color = "#666"
    desc.style.maxWidth = "700px"
    desc.style.fontFamily = "monospace"
    desc.style.whiteSpace = "pre-line"
    desc.style.lineHeight = "1.5"
    desc.innerHTML = `
${at("attractorDescTitle")}

${at("eachCellShows")}

${at("heatLabelTitle")}:
• ${at("heatDarkDesc")}
• ${at("heatBrightDesc")}
• ${at("heatRedOutlineDesc")}
• ${at("heatSoftGlowDesc")}

${at("flowLabelTitle")}:
• ${at("flowArrowDirectionDesc")}
• ${at("flowArrowSizeDesc")}

${at("phaseOverlayTitle")}:
• ${at("phaseBlueDesc")}
• ${at("phaseGreenDesc")}
• ${at("phaseAmberDesc")}
• ${at("phaseRedDesc")}

${at("rightPanelTitle")}:
• ${at("rightPanelClickedDesc")}
• ${at("rightPanelLocalDesc")}
• ${at("rightPanelSegmentDesc")}
• ${at("rightPanelSupportDesc")}
• ${at("rightPanelMembersDesc")}
`
    leftCol.appendChild(desc)
}