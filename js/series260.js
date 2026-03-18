export function drawSeries260(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(260, 2px)"
    c.style.gap = "1px"
    c.style.alignItems = "end"
    c.style.height = "120px"

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const bar = document.createElement("div")

        bar.style.width = "2px"
        bar.style.height = (v*100) + "%"
        bar.style.background = "white"

        c.appendChild(bar)
    }
}
