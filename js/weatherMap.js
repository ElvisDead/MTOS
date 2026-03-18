export function drawWeatherMap(id, data, userKin){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    root.style.display = "flex"
    root.style.flexDirection = "column"
    root.style.alignItems = "center"

    // ===============================
    // TODAY KIN (UTC, простая формула)
    // ===============================
    const today = new Date()

    const baseDate = new Date(Date.UTC(2000,0,1)) // якорь
    const diff = Math.floor((today - baseDate) / 86400000)

    let todayKin = (diff % 260) + 1
    if(todayKin < 1) todayKin += 260

    // ===============================
    // ЛЕГЕНДА
    // ===============================
    const legend = document.createElement("div")
    legend.style.marginBottom = "10px"
    legend.innerHTML =
        "Green ↑ attention | Red ↓ attention | " +
        "<span style='color:yellow'>■ today</span> | " +
        "<span style='color:white'>■ user</span>"
    root.appendChild(legend)

    // ===============================
    // СЕТКА С ОСЯМИ
    // ===============================
    const wrapper = document.createElement("div")

    wrapper.style.display = "grid"
    wrapper.style.gridTemplateColumns = "30px repeat(20, 16px)"
    wrapper.style.gridTemplateRows = "20px repeat(13, 16px)"
    wrapper.style.gap = "2px"

    // угол
    wrapper.appendChild(document.createElement("div"))

    // ось seal
    for(let s=1; s<=20; s++){
        const d = document.createElement("div")
        d.innerText = s
        d.style.fontSize = "10px"
        d.style.textAlign = "center"
        wrapper.appendChild(d)
    }

    // нормализация
    const values = data.map(d => d.attention)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    // ===============================
    // ГЛАВНАЯ СЕТКА
    // ===============================
    for(let tone=1; tone<=13; tone++){

        // ось tone
        const tLabel = document.createElement("div")
        tLabel.innerText = tone
        tLabel.style.fontSize = "10px"
        tLabel.style.textAlign = "right"
        wrapper.appendChild(tLabel)

        for(let seal=1; seal<=20; seal++){

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

            // ===============================
            // WAVE (1–20)
            // ===============================
            const wave = Math.floor((kin-1)/13) + 1

            // ===============================
            // HARMONIC (1–65)
            // ===============================
            const harmonic = Math.floor((kin-1)/4) + 1

            // ===============================
            // ПОДСВЕТКА
            // ===============================
            if(kin === todayKin){
                cell.style.outline = "2px solid yellow"
            }

            if(userKin && kin === userKin){
                cell.style.outline = "2px solid white"
            }

            // ===============================
            // TOOLTIP
            // ===============================
            cell.title =
                `Kin ${kin}\nTone ${tone}\nSeal ${seal}` +
                `\nWave ${wave}\nHarmonic ${harmonic}` +
                `\nAttention ${d.attention.toFixed(3)}`

            // ===============================
            // CLICK
            // ===============================
            cell.onclick = () => {
                alert(
                    `Kin ${kin}\nTone ${tone}\nSeal ${seal}` +
                    `\nWave ${wave}\nHarmonic ${harmonic}` +
                    `\nAttention ${d.attention.toFixed(3)}`
                )
            }

            wrapper.appendChild(cell)
        }
    }

    root.appendChild(wrapper)
}
