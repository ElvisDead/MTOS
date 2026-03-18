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

            const phi = fieldData[kin-1]

            const n = (phi - fMin)/(fMax - fMin || 1)

            // базовый цвет
            let r = Math.floor(255 * n)
            let g = Math.floor(255 * (1 - Math.abs(n-0.5)*2))
            let b = Math.floor(255 * (1 - n))

            // давление overlay
            const p = (pressureData[kin-1] - pMin)/(pMax - pMin || 1)
            r += p * 80
            b += p * 120

            const cell = document.createElement("div")

            cell.style.width = "18px"
            cell.style.height = "18px"
            cell.style.background = `rgb(${r},${g},${b})`
            cell.style.border = "1px solid #111"

            // ===============================
            // ПОДСВЕТКА
            // ===============================
            if(kin === highlightKin){
                cell.style.outline = "3px solid yellow"
            }

            if(kin === userKin){
                cell.style.outline = "3px solid white"
            }

            // выбранный агент
            if(selectedAgent && kin === selectedAgent.kin){
                cell.style.outline = "3px solid cyan"
            }

            cell.title = `Kin ${kin} | Φ ${phi.toFixed(3)}`

            grid.appendChild(cell)
        }
    }

    root.appendChild(grid)
}
