export function drawWeatherMap(id, weather){

    const map = document.getElementById(id)
    if(!map) return

    map.innerHTML = ""

    map.style.display = "grid"
    map.style.gridTemplateColumns = "repeat(20, 14px)"
    map.style.gap = "2px"
    map.style.justifyContent = "center"
    map.style.marginTop = "20px"

    for(let i = 0; i < 260; i++){

        const val = weather[i] ?? 0

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = getColor(val)

        cell.title = "Kin " + (i+1) + " | " + val.toFixed(3)

        map.appendChild(cell)
    }
}

function getColor(v){

    v = Math.max(0, Math.min(1, v))

    const r = Math.floor(255 * v)
    const g = Math.floor(200 * v)
    const b = Math.floor(50 + 100 * (1 - v))

    return `rgb(${r},${g},${b})`
}
