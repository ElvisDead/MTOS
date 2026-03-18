export function drawWeatherMap(id, data, userKin, highlightKin, pressureData){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    root.style.display = "flex"
    root.style.flexDirection = "column"
    root.style.alignItems = "center"

    const wrapper = document.createElement("div")

    wrapper.style.display = "grid"
    wrapper.style.gridTemplateColumns = "30px repeat(20, 16px)"
    wrapper.style.gridTemplateRows = "20px repeat(13, 16px)"
    wrapper.style.gap = "2px"

    wrapper.appendChild(document.createElement("div"))

    // ось seal
    for(let s=1;s<=20;s++){
        const d = document.createElement("div")
        d.innerText = s
        d.style.fontSize = "10px"
        d.style.textAlign = "center"
        wrapper.appendChild(d)
    }

    // нормализация attention
    const attVals = data.map(d => d.attention)
    const attMin = Math.min(...attVals)
    const attMax = Math.max(...attVals)
    const attRange = attMax - attMin || 1

    // нормализация pressure
    let pMin = 0, pRange = 1
    if(pressureData){
        const pVals = pressureData
        pMin = Math.min(...pVals)
        const pMax = Math.max(...pVals)
        pRange = pMax - pMin || 1
    }

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

            // === BASE (attention)
            const a = (d.attention - attMin)/attRange

            let r = Math.floor(255*(1-a))
            let g = Math.floor(255*a)
            let b = 50

            // === OVERLAY (pressure)
            if(pressureData){

                const p = (pressureData[kin-1] - pMin)/pRange

                // добавляем фиолетово-синий слой
                const pr = Math.floor(120*p)
                const pb = Math.floor(255*p)

                r = Math.min(255, r + pr*0.3)
                b = Math.min(255, b + pb*0.5)
            }

            const cell = document.createElement("div")

            cell.style.width = "16px"
            cell.style.height = "16px"
            cell.style.background = `rgb(${r},${g},${b})`

            // === подсветки
            // сброс
            cell.style.border = "1px solid #111"

            // === TODAY (жёлтая рамка)
            if(kin === highlightKin){
                cell.style.border = "3px solid yellow"
            }

            // === USER (белая рамка)
            if(userKin && kin === userKin){
                cell.style.border = "3px solid white"
            }

            // === ЕСЛИ СОВПАЛИ (одна клетка)
            if(userKin && kin === userKin && kin === highlightKin){
                cell.style.border = "3px solid gold"
            }

            const wave = Math.floor((kin-1)/13)+1
            const harmonic = Math.floor((kin-1)/4)+1

            const pressureVal = pressureData ? pressureData[kin-1] : 0

            cell.title =
                `Kin ${kin}\nTone ${tone}\nSeal ${seal}` +
                `\nWave ${wave}\nHarmonic ${harmonic}` +
                `\nAttention ${d.attention.toFixed(3)}` +
                `\nPressure ${pressureVal.toFixed(3)}`

            wrapper.appendChild(cell)
        }
    }

    root.appendChild(wrapper)
}
