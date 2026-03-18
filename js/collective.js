export function drawCollective(id, users){

    const root = document.getElementById(id)
    root.innerHTML = ""

    const div = document.createElement("div")

    users.forEach(u=>{

        const el = document.createElement("div")
        el.innerText = `${u.name} (${u.weight.toFixed(2)})`
        el.style.color = "white"

        div.appendChild(el)
    })

    root.appendChild(div)
}
