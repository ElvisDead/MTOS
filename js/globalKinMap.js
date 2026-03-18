export function drawGlobalKinMap(containerId, kinCounts, usersByKin){

    const container = document.getElementById(containerId)

    if(!container) return

    container.innerHTML = ""

    const grid = document.createElement("div")

    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(20, 20px)"
    grid.style.gap = "2px"
    grid.style.justifyContent = "center"
    grid.style.marginTop = "20px"

    for(let i=0;i<260;i++){

        const cell = document.createElement("div")

        const count = kinCounts[i] || 0

        let color = "#111"

        if(count >= 1) color = "#2c3e50"
        if(count >= 2) color = "#34495e"
        if(count >= 3) color = "#3b5998"
        if(count >= 4) color = "#4a69bd"
        if(count >= 5) color = "#6a89cc"
        if(count >= 6) color = "#82ccdd"
        if(count >= 7) color = "#60a3bc"
        if(count >= 8) color = "#78e08f"
        if(count >= 9) color = "#b8e994"

        cell.style.width = "20px"
        cell.style.height = "20px"
        cell.style.background = color
        cell.style.cursor = "pointer"

        const users = usersByKin[i+1] || []

        cell.title =
            "Kin " + (i+1) + "\n" +
            "Users: " + users.length + "\n" +
            users.map(u=>u.name).join(", ")

        grid.appendChild(cell)
    }

    container.appendChild(grid)
}
