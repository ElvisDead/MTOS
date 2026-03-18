export function drawNetwork(id, edges){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    // контейнер с рамкой и скроллом
    const box = document.createElement("div")

    box.style.width = "400px"
    box.style.maxHeight = "250px"
    box.style.overflowY = "auto"
    box.style.border = "1px solid #555"
    box.style.padding = "8px"
    box.style.margin = "0 auto"
    box.style.textAlign = "left"
    box.style.fontSize = "12px"
    box.style.background = "#111"

    // сортировка по силе связи (от сильных к слабым)
    edges.sort((a,b) => b.value - a.value)

    edges.forEach(e => {

        const row = document.createElement("div")

        let color = "#888"

        if(e.value > 0.4) color = "lime"
        else if(e.value > 0.1) color = "cyan"
        else if(e.value > -0.1) color = "#888"
        else if(e.value > -0.4) color = "orange"
        else color = "red"

        row.style.color = color

        row.innerText =
            `${e.a} ↔ ${e.b} | ${e.label} (${e.value.toFixed(2)})`

        box.appendChild(row)
    })

    c.appendChild(box)
}
