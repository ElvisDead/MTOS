export function drawWeatherMap(id, weather){

    const c = document.getElementById(id)
    c.innerHTML = ""

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20,16px)"
    c.style.gap = "2px"

    for(let i=0;i<260;i++){

        const d = weather[i]

        const r = Math.floor(255*d.attention)
        const g = Math.floor(180*(1-d.pressure))
        const b = Math.floor(200*d.conflict)

        const cell = document.createElement("div")
        cell.style.width="16px"
        cell.style.height="16px"
        cell.style.background=`rgb(${r},${g},${b})`

        c.appendChild(cell)
    }
}
