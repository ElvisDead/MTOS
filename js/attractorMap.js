export function drawAttractorMap(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 14px)"
    c.style.gap = "2px"

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const r = Math.floor(255*v)
        const g = Math.floor(255*(1-Math.abs(v-0.5)*2))
        const b = Math.floor(255*(1-v))

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${r},${g},${b})`
        cell.style.cursor = "pointer"

        cell.title = `Density: ${v.toFixed(3)}`

        c.appendChild(cell)
    }
}
