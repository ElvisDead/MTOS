export function drawPhaseSpace(id, weather){

    const root = document.getElementById(id)
    root.innerHTML = ""

    const canvas = document.createElement("canvas")
    canvas.width = 260
    canvas.height = 260

    const ctx = canvas.getContext("2d")

    for(let i=1;i<weather.length;i++){

        const x = weather[i-1].attention * 260
        const y = weather[i].attention * 260

        ctx.fillStyle = "lime"
        ctx.fillRect(x,y,2,2)
    }

    root.appendChild(canvas)
}
