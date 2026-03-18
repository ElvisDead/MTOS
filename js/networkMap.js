export function drawNetwork(id, edges){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.fontSize = "12px"
    c.style.textAlign = "left"

    edges.forEach(e => {

        const div = document.createElement("div")

        div.innerText =
            e.a + " ↔ " + e.b +
            " | " + e.label +
            " (" + e.value.toFixed(2) + ")"

        if(e.value > 0.4) div.style.color = "lime"
        else if(e.value > 0.1) div.style.color = "cyan"
        else if(e.value > -0.1) div.style.color = "gray"
        else if(e.value > -0.4) div.style.color = "orange"
        else div.style.color = "red"

        c.appendChild(div)
    })
}
