export function drawWeatherMap(
    id,
    data,
    userKin,
    highlightKin,
    pressureData,
    fieldData,
    selectedAgent
){

    const root = document.getElementById(id)
    if(!root) return

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
        popup.style.maxWidth = "200px"
        popup.style.pointerEvents = "auto"

        document.body.appendChild(popup)
    }

    root.innerHTML = ""
    root.style.display = "block"

    const grid = document.createElement("div")
    grid.style.width = "fit-content"

    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "14px repeat(20, 18px)"
    grid.style.gridTemplateRows = "14px repeat(13, 18px)"
    grid.style.gap = "2px"
    // === HEADER (SEAL NUMBERS) ===

    // пустая верхняя левая ячейка
    const empty = document.createElement("div")
    grid.appendChild(empty)

    for(let s=1; s<=20; s++){
        const cell = document.createElement("div")
        cell.innerText = s
        cell.style.fontSize = "10px"
        cell.style.color = "#aaa"
        cell.style.textAlign = "center"
        cell.style.height = "14px"
        cell.style.display = "flex"
        cell.style.alignItems = "center"
        cell.style.justifyContent = "center"
        grid.appendChild(cell)
     }

    const users = window.currentUsers || []

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
            toneCell.style.fontSize = "10px"
            toneCell.style.color = "#aaa"
            toneCell.style.display = "flex"
            toneCell.style.alignItems = "center"
            toneCell.style.justifyContent = "flex-end"
            grid.appendChild(toneCell)

            for(let seal=1;seal<=20;seal++){

            // ===============================
            // KIN
            // ===============================
            let kin = (seal-1)*13 + tone
            while(kin>260) kin-=260

            let phi = fieldData[kin-1]

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

                const aKin = agent.kin - 1

                let dist = Math.abs((kin-1) - aKin)
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

                const aKin = selectedAgent.kin - 1

                let dist = Math.abs((kin-1) - aKin)
                dist = Math.min(dist, 260 - dist)

                influence = Math.exp(-dist / 10)

                phi *= influence
            }

            // ===============================
            // FIELD
            // ===============================
            const fieldNorm = (phi - fMin)/(fMax - fMin || 1)

            // ===============================
            // СМЕШИВАНИЕ СЛОЁВ
            // ===============================
            const combined =
                0.5 * fieldNorm +
                0.25 * latticeNorm +
                0.25 * waveNorm

            // ===============================
            // ЦВЕТ (НАУЧНЫЙ ГРАДИЕНТ)
            // ===============================
            let r = Math.floor(255 * combined)
            let g = Math.floor(120 * (1 - Math.abs(combined-0.5)*2))
            let b = Math.floor(255 * (1 - combined))

            // ===============================
            // ДАВЛЕНИЕ (оверлей)
            // ===============================
            const p = (pressureData[kin-1] - pMin)/(pMax - pMin || 1)

            r += p * 40
            b += p * 60

            const cell = document.createElement("div")

            cell.dataset.kin = kin

            cell.addEventListener("click", (e)=>onCellClick(kin, e))
            cell.addEventListener("touchstart", (e)=>onCellClick(kin, e))

            cell.style.width = "18px"
            cell.style.height = "18px"
            cell.style.background = `rgb(${r},${g},${b})`
            cell.style.boxSizing = "border-box"
            cell.style.border = "1px solid #222"

            // ===============================
            // ВЫДЕЛЕНИЯ
            // ===============================
            if(kin === highlightKin){
                cell.style.boxShadow = "0 0 0 2px yellow inset"
            }

            if(kin === userKin){
                cell.style.boxShadow = "0 0 0 3px white inset"
            }

            if(selectedAgent && kin === selectedAgent.kin){
                cell.style.boxShadow = "0 0 0 3px cyan inset"
            }

            // ===============================
            // TOOLTIP
            // ===============================
            cell.title = `
Kin: ${kin}
Φ: ${phi.toFixed(3)}
Wave: ${waveSum.toFixed(3)}
Lattice: ${latticeNorm.toFixed(3)}
`

            grid.appendChild(cell)
        }
    }

const legend = document.createElement("div")
legend.style.marginTop = "15px"
legend.style.fontSize = "12px"
legend.style.color = "#aaa"
legend.style.maxWidth = "500px"
legend.style.marginLeft = "auto"
legend.style.marginRight = "auto"
legend.style.textAlign = "left"    
    
legend.innerHTML = `
<div style="margin-bottom:6px;"><b>Legend:</b></div>

<div>🔵 Low field — low Φ value (low field activity)</div>
<div>🟣 Medium — balanced state (structure vs noise)</div>
<div>🔴 High field — high Φ value (strong concentration)</div>

<div style="margin-top:10px;"><b>About this map:</b></div>

<div>
This is a 13×20 cognitive field map (260 states).<br>
Each cell represents a Kin position in the system.<br><br>

Horizontal axis → Seal (1–20)<br>
Vertical axis → Tone (1–13)<br><br>

Color is a combination of:<br>
• Field intensity (Φ)<br>
• Structural lattice (sinusoidal pattern)<br>
• Agent interference (wave dynamics)<br>
• Pressure overlay (external stress)<br><br>

Click any cell to inspect its state.
</div>
`

const wrapper = document.createElement("div")
wrapper.style.display = "flex"
wrapper.style.justifyContent = "center"

wrapper.appendChild(grid)

root.appendChild(wrapper)
root.appendChild(legend)

}

function onCellClick(kin, e){

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

    x = Math.min(x, window.innerWidth - 220)
    y = Math.min(y, window.innerHeight - 120)

    popup.style.left = (x + 10) + "px"
    popup.style.top  = (y + 10) + "px"

    const phi = window._lastFieldData?.[kin-1] ?? 0
    const pressure = window._lastPressureData?.[kin-1] ?? 0

    popup.innerHTML = `
    <div style="font-weight:bold; margin-bottom:4px;">
        Kin ${kin}
    </div>

    <div>Φ: ${phi.toFixed(3)}</div>
    <div>P: ${pressure.toFixed(3)}</div>

    <div style="margin-top:6px; color:#aaa;">
        Tone: ${((kin-1)%13)+1} | Seal: ${((kin-1)%20)+1}
    </div>
    `

    popup.style.display = "block"
}

    document.addEventListener("click", (e)=>{
    const popup = document.getElementById("kinPopup")
    if(!popup) return

    const isCell = e.target.closest("[data-kin]")

    if(!popup.contains(e.target) && !isCell){
        popup.style.display = "none"
    }
})
