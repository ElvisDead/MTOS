export function drawGlobalKinMap(id, kinCounts, usersByKin){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    const max = Math.max(...kinCounts,1)

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 14px)"
    c.style.gap = "2px"

    for(let i=0;i<260;i++){

        const kin = i+1
        const tone = ((kin-1)%13)+1
        const seal = ((kin-1)%20)+1

        const count = kinCounts[i]
        const v = count/max

        const r = Math.floor(255*v)
        const g = Math.floor(180*v)
        const b = 50

        const users = usersByKin[kin] || []

        const cell = document.createElement("div")

        cell.style.width = "14px"
        cell.style.height = "14px"
        cell.style.background = `rgb(${r},${g},${b})`
        cell.style.cursor = "pointer"

        cell.title =
            `Kin ${kin}\nTone ${tone}\nSeal ${seal}\nUsers: ${users.length}`

        cell.onclick = () => {
            alert(
                `Kin ${kin}\nTone ${tone}\nSeal ${seal}\nUsers:\n` +
                users.map(u=>u.name).join("\n")
            )
        }

        c.appendChild(cell)
    }
}
