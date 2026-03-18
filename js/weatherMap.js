// ===============================
// 260 KIN WEATHER MAP (PRO)
// ===============================

export function drawWeatherMap(id, weather){

    const container = document.getElementById(id)
    if(!container) return

    container.innerHTML = ""

    // GRID
    container.style.display = "grid"
    container.style.gridTemplateColumns = "repeat(20, 16px)"
    container.style.gap = "2px"
    container.style.justifyContent = "center"
    container.style.marginTop = "20px"

    for(let i = 0; i < 260; i++){

        const cell = document.createElement("div")

        const data = weather[i] || {
            attention: 0.5,
            activity: 0.5,
            pressure: 0,
            conflict: 0
        }

        const val = data.attention

        // COLOR (УЛУЧШЕННЫЙ ГРАДИЕНТ)
        const color = getColor(val, data.pressure, data.conflict)

        cell.style.width = "16px"
        cell.style.height = "16px"
        cell.style.background = color
        cell.style.borderRadius = "2px"
        cell.style.cursor = "pointer"

        // HOVER INFO
        cell.title =
            "Kin " + (i+1) +
            "\nAttention: " + val.toFixed(3) +
            "\nActivity: " + data.activity.toFixed(3) +
            "\nPressure: " + data.pressure.toFixed(3) +
            "\nConflict: " + data.conflict.toFixed(3)

        // INTERACTION (подсветка)
        cell.onmouseenter = () => {
            cell.style.transform = "scale(1.4)"
            cell.style.zIndex = "10"
        }

        cell.onmouseleave = () => {
            cell.style.transform = "scale(1)"
            cell.style.zIndex = "1"
        }

        container.appendChild(cell)
    }
}

// ===============================
// COLOR ENGINE
// ===============================
function getColor(attention, pressure, conflict){

    // базовая энергия
    const r = Math.floor(255 * attention)

    // давление → зелёный канал
    const g = Math.floor(180 * (1 - pressure))

    // конфликт → синий канал
    const b = Math.floor(200 * conflict)

    return `rgb(${r},${g},${b})`
}
