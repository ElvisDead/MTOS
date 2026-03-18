export function drawAttractor(id, field){

    const root = document.getElementById(id)
    root.innerHTML = ""

    const canvas = document.createElement("canvas")
    canvas.width = 260
    canvas.height = 260

    const ctx = canvas.getContext("2d")

    for(let i=0;i<field.length;i++){

        const x = i
        const y = 130 + field[i]*80

        ctx.fillStyle = "orange"
        ctx.fillRect(x,y,2,2)
    }

    root.appendChild(canvas)
}
