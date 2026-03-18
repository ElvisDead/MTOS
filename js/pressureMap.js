export function drawPressureMap(id, data){

    const c = document.getElementById(id)
    c.innerHTML=""

    c.style.display="grid"
    c.style.gridTemplateColumns="repeat(13,16px)"
    c.style.gap="2px"

    for(let i=0;i<data.length;i++){

        const v = data[i]

        const r = Math.floor(255*v)
        const b = Math.floor(255*(1-v))

        const cell = document.createElement("div")
        cell.style.width="16px"
        cell.style.height="16px"
        cell.style.background=`rgb(${r},0,${b})`

        c.appendChild(cell)
    }
}
