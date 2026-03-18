export function drawPressureMap(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(13, 14px)"
    c.style.gap = "2px"

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const r = Math.floor(255*v)
        const b = Math.floor(255*(1-v))

        const tone = (i % 13) + 1
        const seal = Math.floor(i / 13) + 1

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${r},0,${b})`
        cell.style.cursor = "pointer"

        cell.title =
            `Seal ${seal}\nTone ${tone}\nPressure: ${v.toFixed(3)}`

        cell.onclick = () => {
            alert(`Seal ${seal}\nTone ${tone}\nPressure: ${v.toFixed(3)}`)
        }

        c.appendChild(cell)
    }
}
