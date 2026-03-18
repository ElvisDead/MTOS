export function drawPhaseMap(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 14px)"
    c.style.gap = "2px"

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const gray = Math.floor(255*v)

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${gray},${gray},${gray})`
        cell.style.cursor = "pointer"

        cell.title = `Phase: ${v.toFixed(3)}`

        c.appendChild(cell)
    }
}
