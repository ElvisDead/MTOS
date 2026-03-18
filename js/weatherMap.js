export function drawWeatherMap(id, data){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    root.style.display = "flex"
    root.style.flexDirection = "column"
    root.style.alignItems = "center"

    // === ЛЕГЕНДА ===
    const legend = document.createElement("div")
    legend.innerText = "Green ↑ attention | Red ↓ attention"
    legend.style.marginBottom = "10px"
    root.appendChild(legend)

    // === КОНТЕЙНЕР С ОСЯМИ ===
    const wrapper = document.createElement("div")
    wrapper.style.display = "grid"
    wrapper.style.gridTemplateColumns = "30px repeat(20, 16px)"
    wrapper.style.gridTemplateRows = "20px repeat(13, 16px)"
    wrapper.style.gap = "2px"
    wrapper.style.alignItems = "center"
    wrapper.style.justifyContent = "center"

    // пустой угол
    wrapper.appendChild(document.createElement("div"))

    // === ОСЬ ПЕЧАТЕЙ (1–20) ===
    for(let seal=1; seal<=20; seal++){
        const label = document.createElement("div")
        label.innerText = seal
        label.style.fontSize = "10px"
        label.style.textAlign = "center"
        wrapper.appendChild(label)
    }

    // нормализация
    const values = data.map(d => d.attention)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    // === СЕТКА ===
    for(let tone=1; tone<=13; tone++){

        // ось тонов
        const tLabel = document.createElement("div")
        tLabel.innerText = tone
        tLabel.style.fontSize = "10px"
        tLabel.style.textAlign = "right"
        wrapper.appendChild(tLabel)

        for(let seal=1; seal<=20; seal++){

            // ВАЖНО: правильная формула Цолькина
            let kin = (seal - 1) * 13 + tone
            while(kin > 260) kin -= 260

            const d = data[kin-1]

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

            // клик
            cell.onclick = () => {
                alert(
                    `Kin ${kin}\nTone ${tone}\nSeal ${seal}\nAttention ${d.attention.toFixed(3)}`
                )
            }

            wrapper.appendChild(cell)
        }
    }

    root.appendChild(wrapper)
}
