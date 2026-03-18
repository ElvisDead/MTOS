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

    // ===============================
    // СОБИРАЕМ ВСЕ ВОЛНЫ АГЕНТОВ
    // ===============================
    const waves = []

    if(selectedAgent){
        waves.push(selectedAgent)
    }else{
        // если ничего не выбрано — берём всех
        waves.push(...window.currentUsers || [])
    }

    for(let tone=1;tone<=13;tone++){
        for(let seal=1;seal<=20;seal++){

            let kin = (seal-1)*13 + tone
            while(kin>260) kin-=260

            let value = 0

            // ===============================
            // ИНТЕРФЕРЕНЦИЯ
            // ===============================
            for(let a=0;a<waves.length;a++){

                const agent = waves[a]
                if(!agent.kin) continue

                const aKin = agent.kin - 1

                let dist = Math.abs((kin-1) - aKin)
                dist = Math.min(dist, 260 - dist)

                const amplitude = agent.weight || 1

                // "фаза" через sin
                const phase = agent.phase || 0

                const wave = Math.sin(dist / 5 + phase) * Math.exp(-dist / 12)

                value += amplitude * wave
            }

            // нормализация
            const n = (value + 1) / 2

            // цвет (интерференция)
            let r = Math.floor(255 * Math.max(0, n))
            let g = Math.floor(100 * (1 - Math.abs(n-0.5)*2))
            let b = Math.floor(255 * Math.max(0, 1-n))

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

            cell.title = `Kin ${kin} | wave ${value.toFixed(3)}`

            grid.appendChild(cell)
        }
    }

    root.appendChild(grid)
}
