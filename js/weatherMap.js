export function drawWeatherMap(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 14px)"
    c.style.gap = "2px"

    for(let i=0;i<260;i++){

        const d = data[i]

        const r = Math.floor(255*d.attention)
        const g = Math.floor(180*(1-d.pressure))
        const b = Math.floor(200*d.conflict)

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${r},${g},${b})`

        cell.title =
            "Kin: " + (i+1) +
            "\nAttention: " + d.attention.toFixed(3) +
            "\nPressure: " + d.pressure.toFixed(3)

        c.appendChild(cell)
    }
}
