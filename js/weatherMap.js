export function drawWeatherMap(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    // === ЛЕГЕНДА ===
    const legend = document.createElement("div")
    legend.style.marginBottom = "10px"
    legend.innerText = "Green = high attention | Red = low attention"
    c.appendChild(legend)

    const grid = document.createElement("div")

    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(20, 16px)"
    grid.style.gap = "2px"
    grid.style.justifyContent = "center"

    // нормализация
    const values = data.map(d => d.attention)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    for(let i=0;i<260;i++){

        const d = data[i]

        const kin = i+1
        const tone = ((kin-1)%13)+1
        const seal = ((kin-1)%20)+1

        const v = (d.attention - min) / range

        const r = Math.floor(255*(1-v))
        const g = Math.floor(255*v)
        const b = 50

        const cell = document.createElement("div")

        cell.style.width = "16px"
        cell.style.height = "16px"
        cell.style.background = `rgb(${r},${g},${b})`
        cell.style.cursor = "pointer"

        cell.title =
            `Kin ${kin}\nTone ${tone}\nSeal ${seal}\nAttention ${d.attention.toFixed(3)}`

        // ВАЖНО: координаты на сетке
        if(tone === 1){
            cell.style.outline = "1px solid #555"
        }

        if(seal === 1){
            cell.style.borderTop = "2px solid white"
        }

        grid.appendChild(cell)
    }

    c.appendChild(grid)
}
