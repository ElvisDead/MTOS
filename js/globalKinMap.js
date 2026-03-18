export function drawGlobalKinMap(id, kinCounts, usersByKin){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    const max = Math.max(...kinCounts,1)

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 14px)"
    c.style.gap = "2px"

    for(let i=0;i<260;i++){

        const v = kinCounts[i]/max

        const r = Math.floor(255*v)
        const g = Math.floor(180*v)
        const b = 50

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${r},${g},${b})`

        const users = usersByKin[i+1] || []

        cell.title =
            "Kin " + (i+1) +
            "\nUsers: " + users.length

        c.appendChild(cell)
    }
}
