export function drawWeatherMap(id, data, userKin, highlightKin, pressureData){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""
    const legend = document.createElement("div")

    legend.innerHTML = `
    <b>Weather Map Legend</b><br>
    Blue → Low Attention (−σ)<br>
    White → Neutral<br>
    Red → High Attention (+σ)<br>
    Purple → Pressure<br>
    Yellow border → Today<br>
    White border → User<br>
    Gold → Match
    `

    legend.style.fontFamily = "monospace"
    legend.style.fontSize = "12px"
    legend.style.textAlign = "center"
    legend.style.marginBottom = "10px"

    root.appendChild(legend)
    root.style.display = "flex"
    root.style.flexDirection = "column"
    root.style.alignItems = "center"

    const wrapper = document.createElement("div")

    // ЦОЛЬКИН ОРИЕНТАЦИЯ
    wrapper.style.display = "grid"
    wrapper.style.gridTemplateColumns = "30px repeat(20, 18px)"
    wrapper.style.gridTemplateRows = "20px repeat(13, 18px)"
    wrapper.style.gap = "2px"

    // пустой угол
    wrapper.appendChild(document.createElement("div"))

    // seal (горизонталь)
    for(let s=1;s<=20;s++){
        const d = document.createElement("div")
        d.innerText = s
        d.style.fontSize = "10px"
        d.style.textAlign = "center"
        wrapper.appendChild(d)
    }

    // === НОРМАЛИЗАЦИЯ (attention)
    const values = data.map(d => d.attention)
    const mean = values.reduce((a,b)=>a+b,0)/values.length
    const std = Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length) || 1

    // === НОРМАЛИЗАЦИЯ (pressure)
    let pMin=0, pMax=1
    if(pressureData){
        pMin = Math.min(...pressureData)
        pMax = Math.max(...pressureData)
    }

    // ===============================
    // СЕТКА
    // ===============================
    for(let tone=1;tone<=13;tone++){

        const tLabel = document.createElement("div")
        tLabel.innerText = tone
        tLabel.style.fontSize = "10px"
        tLabel.style.textAlign = "right"
        wrapper.appendChild(tLabel)

        for(let seal=1;seal<=20;seal++){

            let kin = (seal-1)*13 + tone
            while(kin>260) kin-=260

            const d = data[kin-1]

            // ===============================
            // Z-SCORE (НАУЧНО)
            // ===============================
            let z = (d.attention - mean)/std

            // ограничение
            z = Math.max(-2, Math.min(2, z))

            // нормализация [-2..2] → [0..1]
            const n = (z + 2)/4

            // ===============================
            // SCIENTIFIC COLOR (BLUE→WHITE→RED)
            // ===============================
            const r = Math.floor(255 * n)
            const g = Math.floor(255 * (1 - Math.abs(n-0.5)*2))
            const b = Math.floor(255 * (1 - n))

            let finalR = r
            let finalG = g
            let finalB = b

            // ===============================
            // PRESSURE OVERLAY (фиолет)
            // ===============================
            if(pressureData){

                const p = (pressureData[kin-1] - pMin)/(pMax - pMin || 1)

                finalR = Math.min(255, finalR + p*80)
                finalB = Math.min(255, finalB + p*120)
            }

            const cell = document.createElement("div")

            cell.style.width = "18px"
            cell.style.height = "18px"
            cell.style.background = `rgb(${finalR},${finalG},${finalB})`

            // ===============================
            // ЧЁТКИЕ РАМКИ
            // ===============================
            cell.style.border = "1px solid #111"

            if(kin === highlightKin){
                cell.style.border = "3px solid yellow"
            }

            if(userKin && kin === userKin){
                cell.style.border = "3px solid white"
            }

            if(userKin && kin === userKin && kin === highlightKin){
                cell.style.border = "3px solid gold"
            }

            // ===============================
            // TOOLTIP
            // ===============================
            const wave = Math.floor((kin-1)/13)+1
            const harmonic = Math.floor((kin-1)/4)+1

            cell.title =
                `Kin ${kin}\nTone ${tone}\nSeal ${seal}` +
                `\nWave ${wave}\nHarmonic ${harmonic}` +
                `\nZ-score ${z.toFixed(2)}`

            wrapper.appendChild(cell)
        }
    }

    root.appendChild(wrapper)
}
