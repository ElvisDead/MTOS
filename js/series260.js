export function drawSeries(id, weather){

    const root = document.getElementById(id)
    root.innerHTML = ""

    const makeSeries = (length, title)=>{

        const wrap = document.createElement("div")
        wrap.style.marginBottom = "20px"

        const label = document.createElement("div")
        label.innerText = title
        label.style.marginBottom = "5px"

        const canvas = document.createElement("canvas")
        canvas.width = 260
        canvas.height = 80

        const ctx = canvas.getContext("2d")

        ctx.beginPath()

        for(let i=0;i<length;i++){

            const val = weather[i].attention
            const x = (i/length)*260
            const y = 80 - val*70

            if(i===0) ctx.moveTo(x,y)
            else ctx.lineTo(x,y)
        }

        ctx.strokeStyle = "cyan"
        ctx.stroke()

        wrap.appendChild(label)
        wrap.appendChild(canvas)

        return wrap
    }

    root.appendChild(makeSeries(7,"7 days"))
    root.appendChild(makeSeries(30,"30 days"))
    root.appendChild(makeSeries(260,"260 days"))
}
