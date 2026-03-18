// ===============================
// GLOBAL KIN DISTRIBUTION MAP (PRO)
// ===============================

export function drawGlobalKinMap(id, kinCounts, usersByKin){

    const container = document.getElementById(id)
    if(!container) return

    container.innerHTML = ""

    // ===============================
    // HEADER (TOP KINS)
    // ===============================
    const header = document.createElement("div")
    header.style.marginBottom = "10px"
    header.style.fontSize = "14px"

    const top = getTopKins(kinCounts, 5)

    header.innerHTML = "Top Kins: " + top.map(k =>
        `#${k.kin} (${k.count})`
    ).join(" | ")

    container.appendChild(header)

    // ===============================
    // GRID
    // ===============================
    const grid = document.createElement("div")

    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(20, 16px)"
    grid.style.gap = "2px"
    grid.style.justifyContent = "center"

    const max = Math.max(...kinCounts, 1)

    for(let i=0;i<260;i++){

        const val = kinCounts[i] / max
        const count = kinCounts[i]

        const users = usersByKin[i+1] || []

        const cell = document.createElement("div")

        const color = getColor(val)

        cell.style.width = "16px"
        cell.style.height = "16px"
        cell.style.background = color
        cell.style.borderRadius = "2px"
        cell.style.cursor = "pointer"

        // TOOLTIP
        cell.title =
            "Kin " + (i+1) +
            "\nUsers: " + count +
            "\nDensity: " + val.toFixed(3)

        // HOVER EFFECT
        cell.onmouseenter = () => {
            cell.style.transform = "scale(1.4)"
            cell.style.zIndex = "10"
        }

        cell.onmouseleave = () => {
            cell.style.transform = "scale(1)"
            cell.style.zIndex = "1"
        }

        grid.appendChild(cell)
    }

    container.appendChild(grid)
}

// ===============================
// COLOR SCALE
// ===============================
function getColor(v){

    // мягкий heatmap
    const r = Math.floor(255 * v)
    const g = Math.floor(120 * (1 - v))
    const b = Math.floor(80)

    return `rgb(${r},${g},${b})`
}

// ===============================
// TOP KINS ANALYTICS
// ===============================
function getTopKins(kinCounts, n){

    const arr = kinCounts.map((count, i) => ({
        kin: i+1,
        count
    }))

    arr.sort((a,b) => b.count - a.count)

    return arr.slice(0,n)
}
