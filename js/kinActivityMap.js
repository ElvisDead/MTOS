export function drawKinActivity(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    const max = Math.max(...data,1)

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 14px)"
    c.style.gap = "2px"

    for(let i=0;i<data.length;i++){

        const v = data[i]/max

        const r = Math.floor(255*v)

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${r},0,0)`

        c.appendChild(cell)
    }
}
