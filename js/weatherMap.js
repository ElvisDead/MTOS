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

    let fMin = Math.min(...fieldData)
    let fMax = Math.max(...fieldData)

    let pMin = Math.min(...pressureData)
    let pMax = Math.max(...pressureData)

    for(let tone=1;tone<=13;tone++){
        for(let seal=1;seal<=20;seal++){

            let kin = (seal-1)*13 + tone
            while(kin>260) kin-=260

            let phi = fieldData[kin-1]

            // ===============================
            // ЗОНА ВЛИЯНИЯ (КЛЮЧ)
            // ===============================
            let influence = 1

            if(selectedAgent){

                const agentKin = selectedAgent.kin - 1

                let dist = Math.abs(kin-1 - agentKin)
                dist = Math.min(dist, 260 - dist)

                // гауссово затухание
                influence = Math.exp(-dist / 10)

                // применяем фильтр
                phi = phi * influence
            }

            const n = (phi - fMin)/(fMax - fMin || 1)

            // heatmap (синий → красный)
            let r = Math.floor(255 * n)
            let g = Math.floor(80 * (1 - n))
            let b = Math.floor(255 * (1 - n))

            // давление (слабо, чтобы не мешало)
            const p = (pressureData[kin-1] - pMin)/(pMax - pMin || 1)
            r += p * 40
            b += p * 60

            const cell = document.createElement("div")

            cell.style.width = "18px"
            cell.style.height = "18px"
            cell.style.background = `rgb(${r},${g},${b})`
            cell.style.border = "1px solid #111"

            // ===============================
            // ПОДСВЕТКИ
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

            cell.title = `
Kin: ${kin}
Φ: ${fieldData[kin-1].toFixed(3)}
Influence: ${influence.toFixed(3)}
`

            grid.appendChild(cell)
        }
    }

    root.appendChild(grid)
}
