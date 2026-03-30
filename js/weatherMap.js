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
    if(!root) return
    window._lastWeatherArgs = [...arguments]

        const users = selectedAgent ? [selectedAgent] : (window.currentUsers || [])
    const usersByKin = {}

    users.forEach(u => {
        const k = Number(u.kin)
        if(!Number.isFinite(k)) return
        if(!usersByKin[k]) usersByKin[k] = []
        usersByKin[k].push(u)
    })

    window._weatherUsersByKin = usersByKin

    // === POPUP ELEMENT ===
    let popup = document.getElementById("kinPopup")

    if(!popup){
        popup = document.createElement("div")
        popup.id = "kinPopup"

        popup.style.position = "fixed"
        popup.style.background = "#111"
        popup.style.color = "#fff"
        popup.style.padding = "10px"
        popup.style.border = "1px solid #444"
        popup.style.borderRadius = "6px"
        popup.style.fontSize = "12px"
        popup.style.zIndex = "9999"
        popup.style.display = "none"
        popup.style.maxWidth = "260px"
        popup.style.minWidth = "220px"
        popup.style.pointerEvents = "auto"

        document.body.appendChild(popup)
    }

    while(root.firstChild){
        root.removeChild(root.firstChild)
    }
    root.style.display = "block"

        const grid = document.createElement("div")
    grid.style.width = "fit-content"
    grid.style.display = "grid"

    const isMobile = window.innerWidth < 768
    const cellSize = isMobile ? 22 : 30
    const headSize = isMobile ? 18 : 22
    const gapSize = isMobile ? 2 : 3

    grid.style.gridTemplateColumns = `${headSize}px repeat(20, ${cellSize}px)`
    grid.style.gridTemplateRows = `${headSize}px repeat(13, ${cellSize}px)`
    grid.style.gap = `${gapSize}px`
    // === HEADER (SEAL NUMBERS) ===

    // пустая верхняя левая ячейка
    const empty = document.createElement("div")
    grid.appendChild(empty)

    for(let s=1; s<=20; s++){
        const cell = document.createElement("div")
        cell.innerText = s
        cell.style.fontSize = "12px"
cell.style.color = "#aaa"
cell.style.textAlign = "center"
cell.style.height = "22px"
cell.style.display = "flex"
cell.style.alignItems = "center"
cell.style.justifyContent = "center"
        grid.appendChild(cell)
     }

    window._lastFieldData = fieldData
    window._lastPressureData = pressureData

    let fMin = fieldData?.length ? Math.min(...fieldData) : 0
    let fMax = fieldData?.length ? Math.max(...fieldData) : 1

    let pMin = pressureData?.length ? Math.min(...pressureData) : 0
    let pMax = pressureData?.length ? Math.max(...pressureData) : 1

    for(let tone=1;tone<=13;tone++){

            // === LEFT TONE NUMBER ===
            const toneCell = document.createElement("div")
            toneCell.innerText = tone
            toneCell.style.fontSize = isMobile ? "10px" : "14px"
toneCell.style.color = "#aaa"
toneCell.style.display = "flex"
toneCell.style.alignItems = "center"
toneCell.style.justifyContent = "flex-end"
toneCell.style.paddingRight = "4px"
            grid.appendChild(toneCell)

            for(let seal=1;seal<=20;seal++){

            // ===============================
            // KIN
            // ===============================
            let kin = (seal-1)*13 + tone
            while(kin>260) kin-=260

            let phi = fieldData?.[KinRegistry.toIndex(kin)] ?? 0

            // ===============================
            // USER MEMORY INFLUENCE
            // ===============================
            //if(window.selectionMemory){

                //const m = window.selectionMemory[KinRegistry.toIndex(kin)] || 0

                //phi += m * 0.05
            //}

            // ===============================
            // LATTICE (СТРУКТУРА)
            // ===============================
            const toneNorm = (tone-1)/12
            const sealNorm = (seal-1)/19

            const lattice = Math.sin((toneNorm + sealNorm) * Math.PI)
            const latticeNorm = (lattice + 1) / 2

            // ===============================
            // ИНТЕРФЕРЕНЦИЯ (ВСЕ АГЕНТЫ)
            // ===============================
            let waveSum = 0

            const activeAgents = selectedAgent ? [selectedAgent] : users

            for(let a=0;a<activeAgents.length;a++){

                const agent = activeAgents[a]
                if(!agent.kin) continue

                const aKin = KinRegistry.toIndex(agent.kin)

                let dist = Math.abs(KinRegistry.toIndex(kin) - aKin)
                dist = Math.min(dist, 260 - dist)

                const phase = agent.phase || 0
                const amplitude = agent.weight || 1

                const wave =
                    Math.sin(dist / 5 + phase) *
                    Math.exp(-dist / 12)

                waveSum += amplitude * wave
            }

            const waveNorm = (waveSum + 1) / 2

            // ===============================
            // ЗОНА ВЛИЯНИЯ (если выбран агент)
            // ===============================
            let influence = 1

            if(selectedAgent){

                const aKin = KinRegistry.toIndex(selectedAgent.kin)

                let dist = Math.abs((kin-1) - aKin)
                dist = Math.min(dist, 260 - dist)

                influence = Math.exp(-dist / 10)

                phi *= influence
            }

            // ===============================
            // FIELD
            // ===============================
            const fieldNorm = (phi - fMin)/(fMax - fMin || 1)

            const p = (pressureData[KinRegistry.toIndex(kin)] - pMin)/(pMax - pMin || 1)

            // ===============================
            // СМЕШИВАНИЕ СЛОЁВ
            // ===============================
            let combined = 0

            const mode = window._weatherMode || "full"

            if(mode === "field"){
                combined = fieldNorm
            }
            else if(mode === "attractor"){
                const attractor = attractorField?.[KinRegistry.toIndex(kin)] ?? fieldNorm
                combined = attractor
            }
            else if(mode === "lattice"){
                combined = latticeNorm
            }
            else if(mode === "wave"){
                combined = waveNorm
            }
            else if(mode === "pressure"){
                combined = p
            }
            else{
                combined =
                    0.5 * fieldNorm +
                    0.25 * latticeNorm +
                    0.25 * waveNorm
            }
            

            // ===============================
            // ЦВЕТ (НАУЧНЫЙ ГРАДИЕНТ)
            // ===============================
            let r = Math.floor(255 * combined)
            let g = Math.floor(120 * (1 - Math.abs(combined-0.5)*2))
            let b = Math.floor(255 * (1 - combined))

            // ===============================
            // ДАВЛЕНИЕ (оверлей)
            // ===============================
            
            r += p * 40
            b += p * 60

            const cell = document.createElement("div")

                //users.forEach(u=>{
                    //if(u.kin === kin){
                        //cell.style.outline = "2px solid yellow"
                    //}
                //})

                const sealIndex = (kin - 1) % 20
                const name = window.SEALS ? window.SEALS[sealIndex] : sealIndex

                const usersInKin = users.filter(u => Number(u.kin) === kin)

cell.innerText = name.slice(0,2)
cell.style.fontSize = isMobile ? "9px" : "11px"
cell.style.fontWeight = "600"
cell.style.display = "flex"
cell.style.alignItems = "center"
cell.style.justifyContent = "center"

cell.dataset.kin = kin

cell.addEventListener("click", (e)=>onCellClick(kin, e))
cell.addEventListener("touchstart", (e)=>onCellClick(kin, e))
cell.addEventListener("mouseenter", (e)=>showKinHover(kin, e))
cell.addEventListener("mousemove", (e)=>moveKinPopup(e))
cell.addEventListener("mouseleave", ()=>hideKinHover())

cell.style.width = `${cellSize}px`
cell.style.height = `${cellSize}px`
cell.style.background = `rgb(${r},${g},${b})`
cell.style.boxSizing = "border-box"
cell.style.border = "1px solid #222"
cell.style.cursor = "pointer"

if (usersInKin.length > 0) {
    cell.style.position = "relative"

    const marker = document.createElement("div")
    marker.textContent = usersInKin.length > 9 ? "9+" : String(usersInKin.length)
    marker.style.position = "absolute"
    marker.style.right = "1px"
    marker.style.bottom = "1px"
    marker.style.minWidth = isMobile ? "12px" : "14px"
    marker.style.height = isMobile ? "12px" : "14px"
    marker.style.padding = "0 2px"
    marker.style.borderRadius = "10px"
    marker.style.background = "rgba(0,0,0,0.82)"
    marker.style.color = "#fff"
    marker.style.fontSize = isMobile ? "8px" : "9px"
    marker.style.lineHeight = isMobile ? "12px" : "14px"
    marker.style.fontWeight = "700"
    marker.style.textAlign = "center"
    marker.style.pointerEvents = "none"
    marker.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.08)"
    cell.appendChild(marker)
}

            // ===============================
            // ВЫДЕЛЕНИЯ
            // ===============================
            let shadowParts = []

if(kin === highlightKin){
    shadowParts.push("0 0 0 2px yellow inset")
}

if(kin === userKin){
    const ds = window.mtosDayState || null
    if(ds && ds.dayColor){
        shadowParts.push(`0 0 0 3px white inset`)
        shadowParts.push(`0 0 10px 2px ${ds.dayColor}`)
    }else{
        shadowParts.push("0 0 0 3px white inset")
    }
}

if(window.selectedKin && kin === window.selectedKin){
    shadowParts.push("0 0 0 3px #00ff88 inset")
}

if(shadowParts.length){
    cell.style.boxShadow = shadowParts.join(", ")
}

const usersHere = usersByKin[kin] || []

if(usersHere.length > 0){
    cell.style.color = "#fff"
    cell.style.textShadow = "0 1px 2px rgba(0,0,0,0.8)"
}
            // ===============================
            // TOOLTIP
            // ===============================

            const hoverUsers = usersInKin.length
    ? usersInKin.map(u => {
        const loc = u.location || u.city || u.country || "location unknown"
        return `${u.name} — ${loc}`
    }).join("\n")
    : "No users"

const usersText = usersHere.length
    ? usersHere.map(u => `${u.name} (${u.kin})`).join(", ")
    : "No users"

cell.title = `
${kin} — ${name}
Users: ${usersText}
Φ: ${phi.toFixed(3)}
Wave: ${waveSum.toFixed(3)}
Lattice: ${latticeNorm.toFixed(3)}


Users:
${hoverUsers}`

            grid.appendChild(cell)
        }
    }

const legend = document.createElement("div")
legend.style.marginTop = "15px"
legend.style.fontSize = "12px"
legend.style.color = "#aaa"
legend.style.maxWidth = "700px"
legend.style.marginLeft = "auto"
legend.style.marginRight = "auto"
legend.style.textAlign = "center" 
    
legend.innerHTML = `
<div style="
    display:flex;
    flex-direction:column;
    align-items:center;
    text-align:center;
">
    <div style="margin-bottom:8px;"><b>Mode:</b></div>

    <div id="modeButtons" style="
        display:flex;
        justify-content:center;
        gap:6px;
        flex-wrap:wrap;
        margin-bottom:12px;
    ">
    <button data-mode="full" onclick="setWeatherMode('full')">Full</button>
    <button data-mode="field" onclick="setWeatherMode('field')">Users / Field</button>
    <button data-mode="pressure" onclick="setWeatherMode('pressure')">Pressure</button>
    </div>

    <div style="font-size:11px; margin-bottom:10px; max-width:700px;">
    Full — overall map.<br>
    Users / Field — where participants and active zones are located.<br>
    Pressure — where tension and overload accumulate.
</div>

    <div style="margin-top:10px;"><b>Legend:</b></div>

    <div style="max-width:700px;">
        🔵 Low field — low Φ value (low activity)<br>
        🟣 Medium — balanced state<br>
        🔴 High field — high Φ value (strong concentration)
    </div>

    <div style="margin-top:10px;"><b>About this map:</b></div>

    <div style="font-size:11px; max-width:700px;">
        13×20 cognitive field (260 states).<br><br>

        Horizontal → Seal (1–20)<br>
        Vertical → Tone (1–13)<br><br>

        Layers:<br>
        • Field (Φ)<br>
        • Lattice (structure)<br>
        • Wave (agents)<br>
        • Pressure (stress)<br><br>

        Click any cell to inspect.
    </div>
</div>
`

const wrapper = document.createElement("div")
wrapper.style.display = "flex"
wrapper.style.justifyContent = "center"

wrapper.appendChild(grid)

root.appendChild(wrapper)
root.appendChild(legend)

setTimeout(updateModeButtons, 0)

}

function onCellClick(kin, e){

    const popup = document.getElementById("kinPopup")
    if(!popup) return

    moveKinPopup(e)

    const i = KinRegistry.toIndex(kin)

    const phi = window._lastFieldData?.[i] ?? 0
    const pressure = window._lastPressureData?.[i] ?? 0

    const attractor = Array.isArray(window._attractorField)
        ? Number(window._attractorField[i] ?? 0.5)
        : 0.5

    const isUserKin = kin === window._userKin
    const ds = isUserKin ? (window.mtosDayState || null) : null

    const usersHere = window._weatherUsersByKin?.[kin] || []

    const usersHtml = usersHere.length
        ? usersHere.map(u => {
            const loc =
                u.city || u.country || u.location
                    ? ` — ${u.city || u.country || u.location}`
                    : ""
            return `<div>• ${u.name}${loc}</div>`
        }).join("")
        : `<div style="color:#888;">No participants in this kin</div>`

    popup.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div style="font-weight:bold;">
            Kin ${kin}
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

    <div>Φ: ${phi.toFixed(3)}</div>
    <div>P: ${pressure.toFixed(3)}</div>
    <div>AF: ${attractor.toFixed(3)}</div>

    <div style="margin-top:8px; padding-top:6px; border-top:1px solid #333;">
        <div style="font-weight:bold; margin-bottom:4px;">Participants:</div>
        ${usersHtml}
    </div>

    ${
        ds ? `
        <div style="margin-top:8px; padding-top:6px; border-top:1px solid #333;">
            <div style="color:${ds.dayColor}; font-weight:bold;">
                Day Type: ${ds.dayLabel}
            </div>
            <div>Day Index: ${ds.dayIndex}</div>
        </div>
        ` : ""
    }

    <div style="margin-top:6px; color:#aaa;">
        Tone: ${((kin-1)%13)+1} | Seal: ${((kin-1)%20)+1}
    </div>
    `

    popup.style.display = "block"
    popup.dataset.pinned = "true"

    const closeBtn = document.getElementById("closeKinPopup")
    if(closeBtn){
        closeBtn.onclick = () => {
            popup.style.display = "none"
            popup.dataset.pinned = "false"
        }
    }

    if(window.onKinSelect){
        window.onKinSelect(kin)
    }
}

function moveKinPopup(e){
    const popup = document.getElementById("kinPopup")
    if(!popup) return

    let x = 0
    let y = 0

    if(e.touches && e.touches[0]){
        x = e.touches[0].clientX
        y = e.touches[0].clientY
    }else{
        x = e.clientX
        y = e.clientY
    }

    x = Math.min(x, window.innerWidth - 280)
    y = Math.min(y, window.innerHeight - 220)

    popup.style.left = (x + 12) + "px"
    popup.style.top = (y + 12) + "px"
}

function showKinHover(kin, e){
    const popup = document.getElementById("kinPopup")
    if(!popup) return

    if(popup.dataset.pinned === "true") return

    moveKinPopup(e)

    const i = KinRegistry.toIndex(kin)
    const phi = window._lastFieldData?.[i] ?? 0
    const usersHere = window._weatherUsersByKin?.[kin] || []

    const usersHtml = usersHere.length
        ? usersHere.map(u => `<div>• ${u.name}</div>`).join("")
        : `<div style="color:#888;">No users</div>`

    popup.innerHTML = `
        <div style="font-weight:bold; margin-bottom:6px;">Kin ${kin}</div>
        <div>Φ: ${phi.toFixed(3)}</div>
        <div style="margin-top:8px; padding-top:6px; border-top:1px solid #333;">
            <div style="font-weight:bold; margin-bottom:4px;">Users:</div>
            ${usersHtml}
        </div>
    `

    popup.style.display = "block"
}

function hideKinHover(){
    const popup = document.getElementById("kinPopup")
    if(!popup) return

    if(popup.dataset.pinned === "true") return
    popup.style.display = "none"
}

window.setWeatherMode = function(mode){
    window._weatherMode = mode

    if(window._lastWeatherArgs){
        drawWeatherMap(...window._lastWeatherArgs)
    }

    setTimeout(updateModeButtons, 0)
}

function updateModeButtons(){
    const mode = window._weatherMode

    document.querySelectorAll("#modeButtons button").forEach(btn=>{
        if(btn.dataset.mode === mode){
            btn.style.background = "#00ffff"
            btn.style.color = "#000"
        }else{
            btn.style.background = "#ddd"
            btn.style.color = "#000"
        }
    })
}

document.addEventListener("click", (e) => {
    const popup = document.getElementById("kinPopup")
    if(!popup) return
    if(popup.style.display !== "block") return

    const clickedCell = e.target.closest("[data-kin]")
    const clickedPopup = e.target.closest("#kinPopup")

    if(!clickedCell && !clickedPopup){
        popup.style.display = "none"
    }
})

document.addEventListener("contextmenu", () => {
    const popup = document.getElementById("kinPopup")
    if(popup){
        popup.style.display = "none"
    }
})