export function drawSeries7(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "flex"
    c.style.alignItems = "flex-end"
    c.style.gap = "4px"
    c.style.height = "80px"

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const bar = document.createElement("div")

        bar.style.width = "10px"
        bar.style.height = (v*100) + "%"
        bar.style.background = "lime"

        bar.title = "Day " + (i+1) + ": " + v.toFixed(3)

        c.appendChild(bar)
    }
}
