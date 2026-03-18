export function drawPhaseSpace(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.position = "relative"
    c.style.width = "300px"
    c.style.height = "300px"
    c.style.background = "#111"
    c.style.border = "1px solid #444"

    const points = data.x.length

    for(let i=0;i<points;i++){

        const x = data.x[i]
        const y = data.y[i]

        const dot = document.createElement("div")

        dot.style.position = "absolute"
        dot.style.width = "3px"
        dot.style.height = "3px"
        dot.style.background = "lime"

        dot.style.left = (x * 100) + "%"
        dot.style.top = (100 - y * 100) + "%"

        c.appendChild(dot)
    }
}
