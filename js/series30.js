export function drawSeries30(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "flex"
    c.style.flexDirection = "column"
    c.style.alignItems = "center"
    c.style.gap = "2px"
    c.style.width = "100%"

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const row = document.createElement("div")

        row.style.width = "400px"
        row.style.height = "6px"
        row.style.background = "#222"

        const fill = document.createElement("div")

        fill.style.height = "100%"
        fill.style.width = (v*100) + "%"
        fill.style.background = "cyan"

        row.appendChild(fill)
        c.appendChild(row)
    }
}
