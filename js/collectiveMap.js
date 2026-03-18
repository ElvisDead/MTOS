export function drawCollective(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    const obj = JSON.parse(data)

    const text = document.createElement("div")

    text.innerHTML =
        "Mean: " + obj.mean.toFixed(3) + "<br>" +
        "Volatility: " + obj.volatility.toFixed(3) + "<br>" +
        "State: " + obj.state

    c.appendChild(text)
}
