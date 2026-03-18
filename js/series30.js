export function drawSeries30(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "flex"
    c.style.alignItems = "flex-end"
    c.style.gap = "2px"
    c.style.height = "100px"

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const bar = document.createElement("div")

        bar.style.width = "6px"
        bar.style.height = (v*100) + "%"
        bar.style.background = "cyan"

        c.appendChild(bar)
    }
}
