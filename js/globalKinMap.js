export function drawGlobalKinMap(id, kinCounts, usersByKin){

    const map = document.getElementById(id)

    if(!map) return

    map.innerHTML = ""

    map.style.display = "grid"
    map.style.gridTemplateColumns = "repeat(20, 12px)"
    map.style.gap = "2px"
    map.style.justifyContent = "center"
    map.style.marginTop = "20px"

    for(let kin = 1; kin <= 260; kin++){

        const value = kinCounts[kin] || 0

        const cell = document.createElement("div")

        cell.style.width = "12px"
        cell.style.height = "12px"
        cell.style.background = getColor(value)

        cell.title = "Kin " + kin + " | Users: " + value

        map.appendChild(cell)
    }
}

function getColor(value){

    if(value === 0) return "#111"
    if(value < 2) return "#003366"
    if(value < 4) return "#0066cc"
    if(value < 6) return "#00cc66"
    if(value < 8) return "#ffcc00"
    return "#ff3300"
}
