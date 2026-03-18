// ===============================
// UNIVERSAL RENDER ENGINE
// ===============================

export function renderGrid({

    id,
    data,
    columns = 20,
    cellSize = 16,
    gap = 2,
    colorFn,
    tooltipFn,
    onClick = null

}){

    const container = document.getElementById(id)
    if(!container) return

    container.innerHTML = ""

    container.style.display = "grid"
    container.style.gridTemplateColumns = `repeat(${columns}, ${cellSize}px)`
    container.style.gap = gap + "px"
    container.style.justifyContent = "center"
    container.style.marginTop = "20px"

    for(let i = 0; i < data.length; i++){

        const cell = document.createElement("div")

        const value = data[i]

        const color = colorFn ? colorFn(value, i) : "#555"

        cell.style.width = cellSize + "px"
        cell.style.height = cellSize + "px"
        cell.style.background = color
        cell.style.borderRadius = "2px"
        cell.style.cursor = "pointer"
        cell.style.transition = "transform 0.1s"

        // TOOLTIP
        if(tooltipFn){
            cell.title = tooltipFn(value, i)
        }

        // HOVER
        cell.onmouseenter = () => {
            cell.style.transform = "scale(1.35)"
            cell.style.zIndex = "10"
        }

        cell.onmouseleave = () => {
            cell.style.transform = "scale(1)"
            cell.style.zIndex = "1"
        }

        // CLICK
        if(onClick){
            cell.onclick = () => onClick(value, i)
        }

        container.appendChild(cell)
    }
}
