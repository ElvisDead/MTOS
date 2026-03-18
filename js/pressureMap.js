// ===============================
// PRESSURE MAP (FINAL)
// ===============================

export function drawPressureMap(id, data){

    const container = document.getElementById(id)
    if(!container) return

    container.innerHTML = ""

    container.style.display = "grid"
    container.style.gridTemplateColumns = "repeat(13, 16px)"
    container.style.gap = "2px"
    container.style.justifyContent = "center"
    container.style.marginTop = "20px"

    for(let i = 0; i < data.length; i++){

        const val = data[i]

        const cell = document.createElement("div")

        const r = Math.floor(255 * val)
        const g = 50
        const b = Math.floor(255 * (1 - val))

        cell.style.width = "16px"
        cell.style.height = "16px"
        cell.style.background = `rgb(${r},${g},${b})`
        cell.style.borderRadius = "2px"
        cell.style.cursor = "pointer"
        cell.style.transition = "transform 0.1s"

        cell.title =
            "Index: " + i +
            "\nPressure: " + val.toFixed(3)

        cell.onmouseenter = () => {
            cell.style.transform = "scale(1.35)"
            cell.style.zIndex = "10"
        }

        cell.onmouseleave = () => {
            cell.style.transform = "scale(1)"
            cell.style.zIndex = "1"
        }

        container.appendChild(cell)
    }
}
