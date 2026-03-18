export function drawGlobalKinMap(id, kinCounts, usersByKin){

    const c = document.getElementById(id)
    c.innerHTML = ""

    const max = Math.max(...kinCounts,1)

    c.style.display="grid"
    c.style.gridTemplateColumns="repeat(20,16px)"
    c.style.gap="2px"

    for(let i=0;i<260;i++){

        const v = kinCounts[i]/max

        const r = Math.floor(255*v)
        const g = Math.floor(120*(1-v))
        const b = 80

        const cell = document.createElement("div")
        cell.style.width="16px"
        cell.style.height="16px"
        cell.style.background=`rgb(${r},${g},${b})`

        c.appendChild(cell)
    }
}
