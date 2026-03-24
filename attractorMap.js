export function drawAttractorMap(id, data, options = {}) {

    const {
        size = 20,
        labels = null,
        meanings = null,
        selectedSeal = null
    } = options

    const root = document.getElementById(id)
    if (!root) return

    root.innerHTML = ""

    // =========================
    // GRID
    // =========================

    const grid = document.createElement("div")
    grid.style.display = "grid"
    grid.style.gridTemplateColumns = `repeat(${size}, 26px)`
    grid.style.gap = "2px"
    grid.style.justifyContent = "center"

    // =========================
    // COLOR SCALE
    // =========================

    function getColor(v) {
        // 0 → красный, 0.5 → серый, 1 → зелёный
        const r = Math.floor(255 * (1 - v))
        const g = Math.floor(255 * v)
        return `rgb(${r},${g},60)`
    }

    // =========================
    // BUILD CELLS
    // =========================

    for (let i = 0; i < data.length; i++) {

        const v = data[i]

        const row = Math.floor(i / size)
        const col = i % size

        const cell = document.createElement("div")

        cell.style.width = "26px"
        cell.style.height = "26px"
        cell.style.background = getColor(v)
        cell.style.cursor = "pointer"
        cell.style.boxSizing = "border-box"

        // highlight selected row
        if (selectedSeal !== null && row === selectedSeal) {
            cell.style.outline = "1px solid yellow"
        }

        // tooltip

        const labelA = labels ? labels[row] : row
        const labelB = labels ? labels[col] : col

        const meaningA = meanings ? meanings[row] : ""
        const meaningB = meanings ? meanings[col] : ""

        cell.title = `
        A: ${labelA}
        → ${meaningA}
        
        B: ${labelB}
        → ${meaningB}
        
        Stability: ${v.toFixed(3)}
        `

        // click = focus row
        cell.onclick = () => {
            drawAttractorMap(id, data, {
                ...options,
                selectedSeal: row
            })
        }

        grid.appendChild(cell)
    }

    if(labels){

    const wrapper = document.createElement("div")
    wrapper.style.display = "grid"
    wrapper.style.gridTemplateColumns = `40px repeat(${size}, 26px) 40px`
    wrapper.style.gridTemplateRows = `20px repeat(${size}, 26px) 20px`
    wrapper.style.gap = "2px"
    wrapper.style.justifyContent = "center"
    wrapper.style.alignItems = "center"

    // --- TOP LABELS ---
    for(let i=0;i<size;i++){
        const l = document.createElement("div")
        l.innerText = labels[i].slice(0,3)
        l.style.fontSize = "10px"
        l.style.color = "#aaa"
        l.style.textAlign = "center"
        l.style.gridColumn = i + 2
        l.style.gridRow = 1
        wrapper.appendChild(l)
    }

    // --- BOTTOM LABELS ---
    for(let i=0;i<size;i++){
        const l = document.createElement("div")
        l.innerText = labels[i].slice(0,3)
        l.style.fontSize = "10px"
        l.style.color = "#aaa"
        l.style.textAlign = "center"
        l.style.gridColumn = i + 2
        l.style.gridRow = size + 2
        wrapper.appendChild(l)
    }

    // --- LEFT LABELS ---
    for(let i=0;i<size;i++){
        const l = document.createElement("div")
        l.innerText = labels[i].slice(0,3)
        l.style.fontSize = "10px"
        l.style.color = "#aaa"
        l.style.textAlign = "right"
        l.style.gridColumn = 1
        l.style.gridRow = i + 2
        wrapper.appendChild(l)
    }

    // --- RIGHT LABELS ---
    for(let i=0;i<size;i++){
        const l = document.createElement("div")
        l.innerText = labels[i].slice(0,3)
        l.style.fontSize = "10px"
        l.style.color = "#aaa"
        l.style.textAlign = "left"
        l.style.gridColumn = size + 2
        l.style.gridRow = i + 2
        wrapper.appendChild(l)
    }

    // --- CELLS ---
    for (let i = 0; i < data.length; i++) {

        const v = data[i]

        const row = Math.floor(i / size)
        const col = i % size

        const cell = document.createElement("div")

        cell.style.width = "26px"
        cell.style.height = "26px"
        cell.style.background = getColor(v)
        cell.style.cursor = "pointer"
        cell.style.boxSizing = "border-box"

        if (selectedSeal !== null && row === selectedSeal) {
            cell.style.outline = "1px solid yellow"
        }

        const labelA = labels[row]
        const labelB = labels[col]

        const meaningA = meanings ? meanings[row] : ""
        const meaningB = meanings ? meanings[col] : ""

        cell.title = `
A: ${labelA}
→ ${meaningA}

B: ${labelB}
→ ${meaningB}

Stability: ${v.toFixed(3)}
        `

        cell.onclick = () => {
            drawAttractorMap(id, data, {
                ...options,
                selectedSeal: row
            })
        }

        cell.style.gridColumn = col + 2
        cell.style.gridRow = row + 2

        wrapper.appendChild(cell)
    }

    root.appendChild(wrapper)

}else{
    root.appendChild(grid)
}

    // =========================
    // LEGEND
    // =========================

    const legend = document.createElement("div")
    legend.style.marginTop = "10px"
    legend.style.fontSize = "12px"
    legend.style.color = "#888"
    legend.style.fontFamily = "monospace"
    legend.style.textAlign = "center"

    legend.innerHTML = `
Low (conflict) → High (synergy)<br>
Click row to focus interactions
    `

    root.appendChild(legend)

    // =========================
    // DESCRIPTION
    // =========================

    const desc = document.createElement("div")
    desc.style.marginTop = "10px"
    desc.style.fontSize = "12px"
    desc.style.color = "#666"
    desc.style.maxWidth = "600px"
    desc.style.margin = "10px auto"
    desc.style.fontFamily = "monospace"
    desc.style.whiteSpace = "pre-line"

    desc.innerHTML = `
MTOS Interaction Attractor Map

Each cell represents long-term attention stability between two archetypes:

A → row
B → column

Green = stable attention (synergy)
Red = unstable interaction (conflict)

This is NOT a static trait map.
It is an emergent property of the system dynamics.
    `

    root.appendChild(desc)
}
