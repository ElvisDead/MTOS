// MTOS/js/field.js

export function drawField(id, config){

    const {
        mode = "activity",
        activity = [],
        pressure = [],
        global = [],
        usersByKin = {},
        onKinClick = null,
        getSelectedKin = null
    } = config || {}

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    // --- GRID ---
    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 14px)"
    c.style.gap = "2px"

    const maxActivity = Math.max(...activity, 1)
    const maxGlobal = Math.max(...global, 1)

    for(let i = 0; i < 260; i++){

        const kin = i + 1
        const tone = ((kin - 1) % 13) + 1
        const seal = ((kin - 1) % 20) + 1

        // --- VALUE ---
        let v = 0

        if(mode === "activity"){
            v = (activity[i] || 0) / maxActivity
        }

        if(mode === "pressure"){
            v = (pressure[i] || 0)
        }

        if(mode === "global"){
            v = (global[i] || 0) / maxGlobal
        }

        // --- COLOR ---
        let color = "rgb(0,0,0)"

        if(mode === "activity"){
            const r = Math.floor(255 * v)
            color = `rgb(${r},0,0)`
        }

        if(mode === "pressure"){
            const r = Math.floor(255 * v)
            const b = Math.floor(255 * (1 - v))
            color = `rgb(${r},0,${b})`
        }

        if(mode === "global"){
            const r = Math.floor(255 * v)
            const g = Math.floor(180 * v)
            color = `rgb(${r},${g},50)`
        }

        // --- CELL ---
        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = color
        cell.style.cursor = "pointer"
        cell.style.boxSizing = "border-box"

        // --- SELECTED HIGHLIGHT ---
        const selectedKin = getSelectedKin ? getSelectedKin() : null

        if(selectedKin === kin){
            cell.style.outline = "2px solid yellow"
        }

        // --- TOOLTIP ---
        let title = `Kin ${kin}\nTone ${tone}\nSeal ${seal}`

        if(mode === "activity"){
            title += `\nActivity: ${activity[i] || 0}`
        }

        if(mode === "pressure"){
            title += `\nPressure: ${(pressure[i] || 0).toFixed(3)}`
        }

        if(mode === "global"){
            const users = usersByKin[kin] || []
            title += `\nUsers: ${users.length}`
        }

        cell.title = title

        // --- CLICK ---
        cell.onclick = () => {
            if(onKinClick){
                onKinClick(kin)
            }
        }

        c.appendChild(cell)
    }
}
