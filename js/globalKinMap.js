export function drawGlobalKinMap(id, kinCounts, usersByKin){

    const container = document.getElementById(id)
    if(!container) return

    container.innerHTML = ""

    container.style.display = "grid"
    container.style.gridTemplateColumns = "repeat(20, 14px)"
    container.style.gap = "2px"
    container.style.justifyContent = "center"
    container.style.marginTop = "20px"

    const max = Math.max(...kinCounts, 1)

    for(let i=0;i<260;i++){

        const val = kinCounts[i] / max

        const cell = document.createElement("div")

        const r = Math.floor(255 * val)
        const g = Math.floor(180 * val)
        const b = Math.floor(50)

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${r},${g},${b})`

        const users = usersByKin[i+1] || []

        cell.title = "Kin " + (i+1) + 
                     " | Users: " + users.length

        container.appendChild(cell)
    }
}
