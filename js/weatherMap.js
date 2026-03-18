export function drawWeatherMap(id, data, userKin, highlightKin, pressureData, fieldData){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""
    root.style.display = "flex"
    root.style.flexDirection = "column"
    root.style.alignItems = "center"

    // ===============================
    // LEGEND
    // ===============================
    const legend = document.createElement("div")

    legend.innerHTML = `
    <b>Weather Map</b><br>
    Blue → low Φ<br>
    White → neutral<br>
    Red → high Φ<br>
    Purple → pressure<br>
    Yellow border → today<br>
    White border → user
    `

    legend.style.fontFamily = "monospace"
    legend.style.fontSize = "12px"
    legend.style.marginBottom = "10px"
    legend.style.textAlign = "center"

    root.appendChild(legend)

    // ===============================
    // GRID
    // ===============================
    const wrapper = document.createElement("div")

    wrapper.style.display = "grid"
    wrapper.style.gridTemplateColumns = "30px repeat(20, 18px)"
    wrapper.style.gridTemplateRows = "20px repeat(13, 18px)"
    wrapper.style.gap = "2px"

    wrapper.appendChild(document.createElement("div"))

    for(let s=1;s<=20;s++){
        const d = document.createElement("div")
        d.innerText = s
        d.style.fontSize = "10px"
        d.style.textAlign = "center"
        wrapper.appendChild(d)
    }

    // ===============================
    // NORMALIZATION Φ
    // ===============================
    let fMin = 0, fMax = 1

    if(fieldData){
        fMin = Math.min(...fieldData)
        fMax = Math.max(...fieldData)
    }

    let pMin = 0, pMax = 1
    if(pressureData){
        pMin = Math.min(...pressureData)
        pMax = Math.max(...pressureData)
    }

    // ===============================
    // CELLS
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

            let phi = fieldData ? fieldData[kin-1] : 0

            const n = (phi - fMin)/(fMax - fMin || 1)

            // BLUE → WHITE → RED
            const r = Math.floor(255 * n)
            const g = Math.floor(255 * (1 - Math.abs(n-0.5)*2))
            const b = Math.floor(255 * (1 - n))

            let finalR = r
            let finalG = g
            let finalB = b

            // PRESSURE OVERLAY
            if(pressureData){
                const p = (pressureData[kin-1] - pMin)/(pMax - pMin || 1)
                finalR += p * 80
                finalB += p * 120
            }

            const cell = document.createElement("div")

            cell.style.width = "18px"
            cell.style.height = "18px"
            cell.style.background = `rgb(${finalR},${finalG},${finalB})`
            cell.style.border = "1px solid #111"

            // HIGHLIGHT
            if(kin === highlightKin){
                cell.style.border = "3px solid yellow"
            }

            if(userKin && kin === userKin){
                cell.style.border = "3px solid white"
            }

            if(userKin && kin === highlightKin){
                cell.style.border = "3px solid gold"
            }

            cell.title = `Kin ${kin}\nΦ ${phi.toFixed(3)}`

            wrapper.appendChild(cell)
        }
    }

    root.appendChild(wrapper)
}
