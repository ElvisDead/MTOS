export function drawSeries7(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    const width = 500
    const height = 120

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")

    c.style.display = "flex"
    c.style.justifyContent = "center"

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const norm = data.map(v => (v - min) / range)

    ctx.beginPath()

    for(let i=0;i<norm.length;i++){

        const x = (i/(norm.length-1))*width
        const y = height - norm[i]*height

        if(i===0) ctx.moveTo(x,y)
        else ctx.lineTo(x,y)
    }

    ctx.lineTo(width,height)
    ctx.lineTo(0,height)
    ctx.closePath()

    ctx.fillStyle = "lime"
    ctx.globalAlpha = 0.4
    ctx.fill()

    ctx.globalAlpha = 1
    ctx.strokeStyle = "lime"
    ctx.lineWidth = 2
    ctx.stroke()

    canvas.onmousemove = (e)=>{
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const i = Math.floor((x/width)*data.length)

        canvas.title =
            "Day: " + (i+1) +
            "\nValue: " + data[i].toFixed(3)
    }

    c.appendChild(canvas)
}
