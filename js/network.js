import { KinRegistry } from "./kinRegistry.js"
import { loadNetworkHistory } from "./networkHistory.js"
let historyIndex = null

function getTimePressureState(){
    const tp = window.mtosTimePressure || window.mtosTimePressureSummary || {}

    const pressure = Number(tp.pressure ?? tp.value ?? 0)
    const urgency = Number(tp.urgency ?? 0)
    const momentum = Number(tp.momentum ?? 0)
    const overload = Number(tp.overload ?? 0)
    const fatigue = Number(tp.fatigue ?? 0)

    return {
        pressure: Math.max(0, Math.min(1, Number.isFinite(pressure) ? pressure : 0)),
        urgency: Math.max(0, Math.min(1, Number.isFinite(urgency) ? urgency : 0)),
        momentum: Math.max(-1, Math.min(1, Number.isFinite(momentum) ? momentum : 0)),
        overload: Math.max(0, Math.min(1, Number.isFinite(overload) ? overload : 0)),
        fatigue: Math.max(0, Math.min(1, Number.isFinite(fatigue) ? fatigue : 0)),
        label: typeof tp.label === "string" ? tp.label : "low",
        temporalMode: typeof tp.temporalMode === "string" ? tp.temporalMode : "EXPLORE"
    }
}

function applyTimePressureToScore(score){
    const tp = getTimePressureState()
    let adjusted = Number(score) || 0

    // высокий time pressure усиливает поляризацию:
    // слабые связи распадаются, отрицательные обостряются, сильные позитивные сжимаются
    if(tp.pressure >= 0.82){
        if(adjusted > 0){
            adjusted *= (1 - 0.22 * tp.pressure)
        }else if(adjusted < 0){
            adjusted *= (1 + 0.28 * tp.pressure)
        }

        if(Math.abs(adjusted) < 0.25){
            adjusted *= (1 - 0.18 * tp.pressure)
        }
    }
    else if(tp.pressure >= 0.62){
        if(adjusted > 0){
            adjusted *= (1 - 0.12 * tp.pressure)
        }else if(adjusted < 0){
            adjusted *= (1 + 0.16 * tp.pressure)
        }
    }
    else if(tp.pressure < 0.34){
        if(adjusted > 0){
            adjusted *= (1 + 0.05 * (1 - tp.pressure))
        }
    }

    // urgency немного усиливает доминирующие связи
    if(Math.abs(adjusted) > 0.35){
        adjusted *= (1 + tp.urgency * 0.08)
    }

    return Math.max(-1, Math.min(1, adjusted))
}

export function drawNetwork(id, users, onSelect, matrix = null){

        if (window._networkRAF) {
        cancelAnimationFrame(window._networkRAF)
        window._networkRAF = null
    }

    if (window._networkDocClickHandler) {
        document.removeEventListener("click", window._networkDocClickHandler)
        window._networkDocClickHandler = null
    }

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    root.style.maxWidth = "760px"
    root.style.margin = "0 auto"
    root.style.padding = "0 12px"
    root.style.boxSizing = "border-box"

        const panel = document.createElement("div")
    panel.style.display = "flex"
    panel.style.justifyContent = "center"
    panel.style.gap = "10px"
    panel.style.flexWrap = "wrap"
    panel.style.marginBottom = "12px"

    function makeModeBtn(label, mode, btnId){
    const btn = document.createElement("button")
    btn.id = btnId
    btn.innerText = label
    btn.style.background = "#111"
    btn.style.color = "#fff"
    btn.style.border = "1px solid #666"
    btn.style.padding = "8px 14px"
    btn.style.cursor = "pointer"
    btn.style.fontFamily = "monospace"

    btn.onclick = () => {
        if (!window.setNetworkMode) return

        if (mode === "edit") {
            const nextMode = window.networkMode === "edit" ? "interaction" : "edit"
            window.setNetworkMode(nextMode)
        } else {
            window.setNetworkMode(mode)
        }
        hoverEdge = null
        selected = null
        hideEdgePopup()
    }

    return btn
}

    const btnEdit = makeModeBtn("Edit", "edit", "modeEdit")
    panel.appendChild(btnEdit)

    root.appendChild(panel)

    const canvas = document.createElement("canvas")

const isMobile = window.innerWidth < 768
const rootWidth = Math.max(280, root.clientWidth || window.innerWidth)

const size = isMobile
    ? Math.min(rootWidth - 16, 420)
    : Math.min(rootWidth - 40, 720)

canvas.width = size
canvas.height = isMobile ? Math.round(size * 0.82) : Math.round(size * 0.88)
canvas.style.width = canvas.width + "px"
canvas.style.height = canvas.height + "px"
canvas.style.display = "block"
canvas.style.margin = "0 auto"

    root.appendChild(canvas)

    const activeMap = {
    edit: "modeEdit"
}

const currentMode = window.networkMode

;["modeEdit"].forEach(id => {
    const btn = document.getElementById(id)
    if (btn) {
        btn.style.background = "#111"
        btn.style.color = "#fff"
    }
})

if(currentMode === "edit"){
    const activeBtn = document.getElementById("modeEdit")
    if (activeBtn) {
        activeBtn.style.background = "#00ff88"
        activeBtn.style.color = "#000"
    }
}

    const desc = document.createElement("div")

    desc.innerText =
    "Nodes represent participants.\n" +
    "Green = support, Red = conflict.\n" +
    "Wheel / pinch = zoom, drag = move.\n" +
    "Tap / click nodes to inspect.\n" +
    "Edit mode: click edge = remove relation, click node = remove participant.\n" +
    "Shift + click two nodes = add relation."
        
    desc.style.whiteSpace = "pre-line"
    desc.style.color = "#888"
    desc.style.textAlign = "center"
    desc.style.marginTop = "10px"
        
    root.appendChild(desc)

    const ctx = canvas.getContext("2d")

        let edgePopup = document.getElementById("networkEdgePopup")

    if(!edgePopup){
        edgePopup = document.createElement("div")
        edgePopup.id = "networkEdgePopup"
        edgePopup.style.position = "fixed"
        edgePopup.style.display = "none"
        edgePopup.style.zIndex = "9999"
        edgePopup.style.minWidth = "220px"
        edgePopup.style.maxWidth = "280px"
        edgePopup.style.background = "rgba(2,6,23,0.96)"
        edgePopup.style.border = "1px solid #334155"
        edgePopup.style.borderRadius = "10px"
        edgePopup.style.padding = "10px 12px"
        edgePopup.style.color = "#e5e7eb"
        edgePopup.style.fontFamily = "monospace"
        edgePopup.style.fontSize = "12px"
        edgePopup.style.lineHeight = "1.45"
        edgePopup.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)"
        document.body.appendChild(edgePopup)
    }

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const R = Math.min(canvas.width, canvas.height) * 0.36

    let selected = null
    let hover = null
    let tooltip = null
    let hoverEdge = null
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
let pinchCenterX = 0
let pinchCenterY = 0

function getTouchDistance(t1, t2){
    const dx = t2.clientX - t1.clientX
    const dy = t2.clientY - t1.clientY
    return Math.sqrt(dx * dx + dy * dy)
}

function getTouchCenter(t1, t2){
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
    }
}

    let memory = JSON.parse(localStorage.getItem("collective_relations_memory")) || {}
let localUsers = users

if(historyIndex !== null){
    const history = loadNetworkHistory()
    const state = history[historyIndex]

    if(state){
        memory = state.memory
        localUsers = state.users
    }
}
    console.log("MEMORY LOAD:", JSON.stringify(memory))
    const locked = window._lockedCache || JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}")
    window._lockedCache = locked

    const N = users.length

    const positions = users.map((u, i)=>{
        const angle = (i / N) * Math.PI * 2
        return {
            x: cx + R * Math.cos(angle),
            y: cy + R * Math.sin(angle)

        }
    })

    const velocities = users.map(()=>({x:0, y:0}))

        function moveEdgePopup(clientX, clientY){
        const x = Math.min(clientX + 12, window.innerWidth - 300)
        const y = Math.min(clientY + 12, window.innerHeight - 220)
        edgePopup.style.left = x + "px"
        edgePopup.style.top = y + "px"
    }

    function showEdgePopup(clientX, clientY, payload){
        if(!payload) return

        const score = Number(payload.score ?? 0)
        const adjustedScore = Number(payload.adjustedScore ?? score)
        const attractorValue = payload.attractorValue

        const timePressure = Number(payload.timePressure ?? 0)
        const temporalMode = payload.temporalMode || "EXPLORE"

        const relationType =
            adjustedScore > 0 ? "Support" :
            adjustedScore < 0 ? "Conflict" :
            "Neutral"

        edgePopup.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-weight:bold;">Relation</div>
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
            <div style="margin-top:6px;">Type: ${relationType}</div>
            <div>Intensity: ${Math.abs(adjustedScore).toFixed(3)}</div>
            <div>Signed score: ${adjustedScore.toFixed(3)}</div>
            <div>Base score: ${score.toFixed(3)}</div>
            <div>Time pressure: ${timePressure.toFixed(3)}</div>
            <div>Temporal mode: ${temporalMode}</div>
            ${
                attractorValue !== null && attractorValue !== undefined
                    ? `<div>Field influence: ${Number(attractorValue).toFixed(3)}</div>`
                    : ``
            }
        `

        moveEdgePopup(clientX, clientY)
        edgePopup.style.display = "block"

        const closeBtn = document.getElementById("closeNetworkEdgePopup")
        if(closeBtn){
            closeBtn.onclick = () => {
                edgePopup.style.display = "none"
            }
        }
    }

    function hideEdgePopup(){
        edgePopup.style.display = "none"
    }

    function getEdgeAt(mx, my){
        for(let i=0;i<N;i++){
            for(let j=i+1;j<N;j++){

                const u1 = users[i]
                const u2 = users[j]

                const key1 = u1.name + "->" + u2.name
                const key2 = u2.name + "->" + u1.name

                if(locked[key1] || locked[key2]){
                    continue
                }

                const score =
                    (memory[key1] === 0 || memory[key2] === 0)
                        ? 0
                        : ((memory[key1] || 0) + (memory[key2] || 0)) / 2

                let adjustedScore = score

const attractorState = window.mtosAttractorState || {
    type: "unknown",
    intensity: 0
}

const timePressureState = getTimePressureState()

if (attractorState.type === "chaos") {
    if (adjustedScore > 0) adjustedScore *= (1 - 0.18 * attractorState.intensity)
    else if (adjustedScore < 0) adjustedScore *= (1 + 0.22 * attractorState.intensity)
}
else if (attractorState.type === "cycle") {
    adjustedScore *= (1 + 0.12 * attractorState.intensity)
}
else if (attractorState.type === "trend") {
    if (Math.abs(adjustedScore) > 0.25) {
        adjustedScore *= (1 + 0.15 * attractorState.intensity)
    }
}
else if (attractorState.type === "stable") {
    adjustedScore *= (1 - 0.08 * attractorState.intensity)
}

adjustedScore = applyTimePressureToScore(adjustedScore)

                let attractorValue = null
                if(matrix){
                    const sealA = KinRegistry.toIndex(users[i].kin) % 20
                    const sealB = (users[j].kin - 1) % 20
                    attractorValue = matrix[sealA * 20 + sealB]
                }

                const x1 = positions[i].x
                const y1 = positions[i].y
                const x2 = positions[j].x
                const y2 = positions[j].y

                const A = mx - x1
                const B = my - y1
                const C = x2 - x1
                const D = y2 - y1

                const dot = A*C + B*D
                const lenSq = C*C + D*D
                const param = lenSq > 0 ? dot / lenSq : -1

                if(param < 0 || param > 1) continue

                const xx = x1 + param * C
                const yy = y1 + param * D
                const dx = mx - xx
                const dy = my - yy
                const dist = Math.sqrt(dx*dx + dy*dy)

                const threshold = Math.max(10, Math.abs(adjustedScore) * 8)

                if(dist <= threshold){
                    return {
                        a: u1.name,
                        b: u2.name,
                        score,
                        adjustedScore,
                        attractorValue,
                        timePressure: timePressureState.pressure,
                        temporalMode: timePressureState.temporalMode
                    }
                }
            }
        }

        return null
    }

    function publishNetworkFeedback() {
    let total = 0
    let positive = 0
    let negative = 0
    let absSum = 0

    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            const u1 = users[i]
            const u2 = users[j]

            const key1 = u1.name + "->" + u2.name
            const key2 = u2.name + "->" + u1.name

            if (locked[key1] || locked[key2]) continue
            if (memory[key1] === 0 || memory[key2] === 0) continue

            const score =
                ((memory[key1] || 0) + (memory[key2] || 0)) / 2

            total++
            absSum += Math.abs(score)

            if (score > 0) positive++
            else if (score < 0) negative++
        }
    }

    const possible = (N * (N - 1)) / 2
    const density = possible > 0 ? total / possible : 0
    const meanStrength = total > 0 ? absSum / total : 0
    const conflictRatio = total > 0 ? negative / total : 0
    const supportRatio = total > 0 ? positive / total : 0

    window.mtosNetworkFeedback = {
        totalLinks: total,
        density,
        meanStrength,
        conflictRatio,
        supportRatio,
        timePressure: getTimePressureState().pressure,
        temporalMode: getTimePressureState().temporalMode,
        updatedAt: new Date().toISOString()
    }
}

    function applyClustering(){

        for(let i=0;i<N;i++){
            for(let j=i+1;j<N;j++){

                const u1 = users[i]
                const u2 = users[j]

                const key1 = u1.name + "->" + u2.name
                const key2 = u2.name + "->" + u1.name

                if(locked[key1] || locked[key2]){
                    memory[key1] = 0
                    memory[key2] = 0
                        continue
                }

                const score =
                    (memory[key1] === 0 || memory[key2] === 0)
                        ? 0
                        : ((memory[key1] || 0) + (memory[key2] || 0)) / 2

                const tp = getTimePressureState()
const clusterThreshold = 0.3 + tp.pressure * 0.12

if(score > clusterThreshold){

                    const dx = positions[j].x - positions[i].x
                    const dy = positions[j].y - positions[i].y

const clusterMul =
    tp.pressure >= 0.62
        ? (1 - tp.pressure * 0.35)
        : (1 + (1 - tp.pressure) * 0.08)

positions[i].x += dx * 0.01 * score * clusterMul
positions[i].y += dy * 0.01 * score * clusterMul

positions[j].x -= dx * 0.01 * score * clusterMul
positions[j].y -= dy * 0.01 * score * clusterMul
                }
            }
        }
    }

    function applyForces(){

        const tp = getTimePressureState()

    for(let i=0;i<N;i++){
        for(let j=i+1;j<N;j++){

            const dx = positions[j].x - positions[i].x
            const dy = positions[j].y - positions[i].y

            const dist = Math.sqrt(dx*dx + dy*dy) + 0.01
            const forceBase = 20 / dist
            const force = forceBase * (1 + tp.pressure * 0.18 + tp.urgency * 0.08)

            const fx = force * dx / dist
            const fy = force * dy / dist

            velocities[i].x -= fx
            velocities[i].y -= fy

            velocities[j].x += fx
            velocities[j].y += fy
        }
    }

    for(let i=0;i<N;i++){
        velocities[i].x += (cx - positions[i].x) * 0.001
        velocities[i].y += (cy - positions[i].y) * 0.001
    }

    for(let i=0;i<N;i++){
        positions[i].x += velocities[i].x
        positions[i].y += velocities[i].y

        const damping = 0.85 - tp.pressure * 0.10
velocities[i].x *= damping
velocities[i].y *= damping
    }
}

    function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.save()
        
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    applyClustering()
    applyForces()

    // ===============================
    // СВЯЗИ
    // ===============================
    for(let i=0;i<N;i++){
        for(let j=i+1;j<N;j++){

            const u1 = users[i]
            const u2 = users[j]

            const key1 = u1.name + "->" + u2.name
            const key2 = u2.name + "->" + u1.name

            if(locked[key1] || locked[key2]){
                memory[key1] = 0
                memory[key2] = 0
                    continue
            }

            const score =
                (memory[key1] === 0 || memory[key2] === 0)
                    ? 0
                    : ((memory[key1] || 0) + (memory[key2] || 0)) / 2

let adjustedScore = score


const attractorState = window.mtosAttractorState || {
    type: "unknown",
    intensity: 0
}

if (attractorState.type === "chaos") {
    if (adjustedScore > 0) {
        adjustedScore *= (1 - 0.18 * attractorState.intensity)
    } else if (adjustedScore < 0) {
        adjustedScore *= (1 + 0.22 * attractorState.intensity)
    }
}
else if (attractorState.type === "cycle") {
    adjustedScore *= (1 + 0.12 * attractorState.intensity)
}
else if (attractorState.type === "trend") {
    if (Math.abs(adjustedScore) > 0.25) {
        adjustedScore *= (1 + 0.15 * attractorState.intensity)
    }
}
else if (attractorState.type === "stable") {
    adjustedScore *= (1 - 0.08 * attractorState.intensity)
}

adjustedScore = applyTimePressureToScore(adjustedScore)

const tp = getTimePressureState()

            let attractorValue = null
                if(matrix){
                    const sealA = KinRegistry.toIndex(users[i].kin) % 20
                    const sealB = (users[j].kin - 1) % 20
                    attractorValue = matrix[sealA * 20 + sealB]
                }

            //if(Math.abs(score) < 0.5) continue

            if(selected !== null && i !== selected && j !== selected){
    ctx.globalAlpha = 0.05
}else{
    ctx.globalAlpha =
    0.16 +
    Math.abs(adjustedScore) * 0.72 +
    tp.pressure * 0.12
}

            ctx.beginPath()
            ctx.moveTo(positions[i].x, positions[i].y)
            ctx.lineTo(positions[j].x, positions[j].y)
            
            const isHover =
    hoverEdge &&
    (
        (hoverEdge.a === u1.name && hoverEdge.b === u2.name) ||
        (hoverEdge.a === u2.name && hoverEdge.b === u1.name)
    )

if(tp.pressure >= 0.82){
    ctx.strokeStyle = adjustedScore > 0 ? "#7dffb3" : "#ff2d55"
}else if(tp.pressure >= 0.62){
    ctx.strokeStyle = adjustedScore > 0 ? "#33ffaa" : "#ff5a36"
}else{
    ctx.strokeStyle = adjustedScore > 0 ? "#00ff88" : "#ff4444"
}

ctx.lineWidth = isHover
    ? Math.max(4, Math.abs(adjustedScore) * 8 + tp.urgency * 2)
    : Math.max(1, Math.abs(adjustedScore) * 5 + tp.pressure * 1.4)

if(isHover){
    ctx.globalAlpha = 1
}

            ctx.stroke()
        }
    }

    ctx.globalAlpha = 1

    // ===============================
    // УЗЛЫ
    // ===============================
    for(let i=0;i<N;i++){

        const u = users[i]
        const p = positions[i]

        let radius = 10 + u.weight * 6

        if(i === selected) radius += 6
        if(i === hover) radius += 3

        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)

        ctx.fillStyle = "#111"
        ctx.fill()

        if(i === selected){
            ctx.strokeStyle = "yellow"
            ctx.lineWidth = 3
            ctx.stroke()
        }

        ctx.fillStyle = "#fff"
        ctx.font = "11px monospace"
        ctx.textAlign = "center"

        ctx.fillText(u.name, p.x, p.y + 4)
    }

    ctx.restore()
}
    canvas.onclick = (e) => {

    if(dragMoved){
        dragMoved = false
        return
    }

    const currentMode = window.networkMode
    const rect = canvas.getBoundingClientRect()

    const mx = (e.clientX - rect.left - offsetX) / scale
    const my = (e.clientY - rect.top - offsetY) / scale

    // ===============================
    // ADD CONNECTION (Shift + click)
    // ===============================
    if(e.shiftKey){

        for(let i = 0; i < N; i++){

            const dx = mx - positions[i].x
            const dy = my - positions[i].y

            if(Math.sqrt(dx * dx + dy * dy) < 15){

                if(selected !== null && selected !== i){

                    const u1 = users[selected].name
                    const u2 = users[i].name

                    if(window.addConnection){
                        window.addConnection(u1, u2)
                    }

                    selected = null
                    draw()
                    return
                }

                selected = i
                draw()
                return
            }
        }
    }

    // ===============================
    // EDIT MODE
    // ===============================
    if(currentMode === "edit"){

        // 1. Сначала пробуем удалить узел
        for(let i = 0; i < N; i++){

            const dx = mx - positions[i].x
            const dy = my - positions[i].y

            if(Math.sqrt(dx * dx + dy * dy) < 18){

                const name = users[i].name

                if(confirm("Удалить " + name + "?")){
                    if(window.removeUser){
                        window.removeUser(name)
                    }
                }

                return
            }
        }

        // 2. Если не узел — пробуем удалить связь
        for(let i = 0; i < N; i++){
            for(let j = i + 1; j < N; j++){

                const x1 = positions[i].x
                const y1 = positions[i].y
                const x2 = positions[j].x
                const y2 = positions[j].y

                const A = mx - x1
                const B = my - y1
                const C = x2 - x1
                const D = y2 - y1

                const dot = A * C + B * D
                const lenSq = C * C + D * D
                const param = lenSq > 0 ? dot / lenSq : -1

                if(param < 0 || param > 1) continue

                const xx = x1 + param * C
                const yy = y1 + param * D

                const dx = mx - xx
                const dy = my - yy

                if(Math.sqrt(dx * dx + dy * dy) < 8){

                    const u1 = users[i].name
                    const u2 = users[j].name

                    if(confirm(`Удалить связь ${u1} ↔ ${u2}?`)){
                        if(window.removeConnection){
                            if(e.shiftKey){
                                window.removeConnectionHard(u1, u2)
                            }else{
                                window.removeConnection(u1, u2)
                            }
                        }
                    }

                    return
                }
            }
        }

        return
    }

    // ===============================
    // NORMAL MODE: сначала линия
    // ===============================
    const edge = getEdgeAt(mx, my)
    if(edge){
        hoverEdge = edge
        showEdgePopup(e.clientX, e.clientY, edge)
        draw()
        return
    }

    // ===============================
    // NORMAL MODE: потом узел
    // ===============================
    for(let i = 0; i < N; i++){

        const dx = mx - positions[i].x
        const dy = my - positions[i].y

        if(Math.sqrt(dx * dx + dy * dy) < 15){

            selected = (selected === i) ? null : i

            if(onSelect){
                onSelect(selected !== null ? users[selected] : null)
            }

            draw()
            return
        }
    }

    // клик в пустоту
    selected = null
    hideEdgePopup()
    draw()
}

    canvas.onwheel = (e)=>{
        e.preventDefault()
                
        const zoom = e.deltaY < 0 ? 1.1 : 0.9
        
        const mx = e.offsetX
        const my = e.offsetY
                    
        offsetX = mx - (mx - offsetX) * zoom
        offsetY = my - (my - offsetY) * zoom
        scale *= zoom

        draw()
    }

    canvas.style.touchAction = "none"

canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
        touchMode = "drag"
        isDragging = true
        dragMoved = false
        dragStartX = e.touches[0].clientX
        dragStartY = e.touches[0].clientY
    }

    else if (e.touches.length === 2) {
        touchMode = "pinch"
        isDragging = false
        pinchStartDistance = getTouchDistance(e.touches[0], e.touches[1])
        pinchStartScale = scale

        const center = getTouchCenter(e.touches[0], e.touches[1])
        pinchCenterX = center.x
        pinchCenterY = center.y
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
    }

    else if (touchMode === "pinch" && e.touches.length === 2) {
        const newDistance = getTouchDistance(e.touches[0], e.touches[1])
        if (!pinchStartDistance) return

        let zoom = newDistance / pinchStartDistance
        let newScale = pinchStartScale * zoom

        newScale = Math.max(0.4, Math.min(3, newScale))

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

    // ===============================
    // HOVER
    // ===============================
    canvas.onmousemove = (e) => {

    const rect = canvas.getBoundingClientRect()

    const mx = (e.clientX - rect.left - offsetX) / scale
    const my = (e.clientY - rect.top - offsetY) / scale

    hover = null
    tooltip = null
    hoverEdge = null

    // 1. сначала ищем узел
    for(let i = 0; i < N; i++){
        const dx = mx - positions[i].x
        const dy = my - positions[i].y

        if(Math.sqrt(dx * dx + dy * dy) < 15){
            hover = i
            tooltip = users[i].name
            break
        }
    }

    // 2. если не попали в узел — ищем линию
    if(hover === null){
        const edge = getEdgeAt(mx, my)

        if(edge){
            hoverEdge = edge
            canvas.style.cursor = "pointer"
        } else {
            canvas.style.cursor = isDragging ? "grabbing" : "grab"
        }
    } else {
        canvas.style.cursor = "pointer"
    }

    // 3. drag
    if(isDragging){
        const dxScreen = e.clientX - dragStartX
        const dyScreen = e.clientY - dragStartY

        if(!dragMoved && Math.sqrt(dxScreen * dxScreen + dyScreen * dyScreen) > dragThreshold){
            dragMoved = true
        }

        if(dragMoved){
            offsetX += dxScreen
            offsetY += dyScreen

            dragStartX = e.clientX
            dragStartY = e.clientY
        }
    }

    // 4. ВСЕГДА перерисовываем
    draw()
}

window.setNetworkHistoryIndex = (i) => {
    historyIndex = i
}

    window._networkDocClickHandler = (evt) => {
    const popupHit = evt.target.closest("#networkEdgePopup")
    const canvasHit = evt.target === canvas
    if(!popupHit && !canvasHit){
        hideEdgePopup()
    }
}

document.addEventListener("click", window._networkDocClickHandler)

function loop(){
    publishNetworkFeedback()
    draw()
    window._networkRAF = requestAnimationFrame(loop)
}

loop()
}
