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

    root.innerHTML = ""
    root.style.display = "flex"
    root.style.justifyContent = "center"

    const grid = document.createElement("div")

    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(20, 18px)"
    grid.style.gridTemplateRows = "repeat(13, 18px)"
    grid.style.gap = "2px"

    const users = window.currentUsers || []

    let fMin = Math.min(...fieldData)
    let fMax = Math.max(...fieldData)

    let pMin = Math.min(...pressureData)
    let pMax = Math.max(...pressureData)

    for(let tone=1;tone<=13;tone++){
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

            cell.style.width = "18px"
            cell.style.height = "18px"
            cell.style.background = `rgb(${r},${g},${b})`
            cell.style.border = "1px solid #111"

            // ===============================
            // ВЫДЕЛЕНИЯ
            // ===============================
            if(kin === highlightKin){
                cell.style.outline = "3px solid yellow"
            }

            if(kin === userKin){
                cell.style.outline = "3px solid white"
            }

            if(selectedAgent && kin === selectedAgent.kin){
                cell.style.outline = "3px solid cyan"
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

    root.appendChild(grid)
}
