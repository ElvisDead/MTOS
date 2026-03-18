export function drawWeatherMap(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 14px)"
    c.style.gap = "2px"

    // ===============================
    // НОРМАЛИЗАЦИЯ ATTENTION
    // ===============================
    const values = data.map(d => d.attention)

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    // ===============================
    // РЕНДЕР
    // ===============================
    for(let i=0;i<260;i++){

        const d = data[i]

        const v = (d.attention - min) / range

        const r = Math.floor(255 * v)
        const g = Math.floor(200 * (1 - v))
        const b = 50

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${r},${g},${b})`

        cell.title =
            "Kin: " + (i+1) +
            "\nAttention: " + d.attention.toFixed(3) +
            "\nPressure: " + d.pressure.toFixed(3) +
            "\nConflict: " + d.conflict.toFixed(3)

        c.appendChild(cell)
    }
}
