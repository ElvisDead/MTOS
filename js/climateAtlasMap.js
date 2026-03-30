export function drawClimateAtlas(id, data, options = {}) {

    const {
        size = 20,
        labels = null,
        selectedSeal = null
    } = options

    const root = document.getElementById(id)
    if (!root) return

    root.innerHTML = ""

    const grid = document.createElement("div")
    grid.style.display = "grid"
    grid.style.gridTemplateColumns = `repeat(${size}, 18px)`
    grid.style.gap = "2px"
    grid.style.justifyContent = "center"

    function getColor(v){
        const r = Math.floor(255*(1-v))
        const b = Math.floor(255*v)
        return `rgb(${r},50,${b})`
    }

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const row = Math.floor(i / size)
        const col = i % size

        const cell = document.createElement("div")

        cell.style.width = "18px"
        cell.style.height = "18px"
        cell.style.background = getColor(v)
        cell.style.cursor = "pointer"
        cell.style.boxSizing = "border-box"

        if(selectedSeal !== null && row === selectedSeal){
            cell.style.outline = "1px solid cyan"
        }

        const labelA = labels ? labels[row] : row
        const labelB = labels ? labels[col] : col

        cell.title = `
A: ${labelA}
B: ${labelB}
Resonance: ${v.toFixed(3)}
        `

        cell.onclick = () => {
            drawClimateAtlas(id, data, {
                ...options,
                selectedSeal: row
            })
        }

        grid.appendChild(cell)
    }

    root.appendChild(grid)

    // описание
    const desc = document.createElement("div")
    desc.style.marginTop = "10px"
    desc.style.fontSize = "12px"
    desc.style.color = "#666"
    desc.style.fontFamily = "monospace"
    desc.style.whiteSpace = "pre-line"
    desc.style.textAlign = "center"

    desc.innerHTML = `
MTOS Climate Atlas

This map shows intrinsic resonance between archetypes.

Blue = high resonance
Red = low resonance

This is structural (static) layer of the system.
    `

    root.appendChild(desc)
}
