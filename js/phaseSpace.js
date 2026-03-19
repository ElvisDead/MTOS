export function drawPhaseSpace(id, weather){

    const root = document.getElementById(id)
    root.innerHTML = ""

    const SIZE = 400

    let scale = 1
    let offsetX = 0
    let offsetY = 0

    let t = 2
    let playing = true

    let axisX = "attention"
    let axisY = "pressure"
    let axisColor = "temperature"

    const canvas = document.createElement("canvas")
    canvas.width = SIZE
    canvas.height = SIZE
    canvas.style.background = "black"
    canvas.style.cursor = "grab"

    const ctx = canvas.getContext("2d")
    root.appendChild(canvas)

    // ===== UI =====
    const info = document.createElement("div")
    info.style.color = "#ccc"
    info.style.marginTop = "10px"
    root.appendChild(info)

    const description = document.createElement("div")
    description.style.color = "#aaa"
    description.style.fontSize = "12px"
    description.style.marginTop = "12px"
    description.style.lineHeight = "1.4"
        
    description.innerHTML = `
    <b>Phase Space (MTOS Cognitive Dynamics)</b><br><br>
    
    This visualization shows how the system evolves over time using a phase space projection.<br><br>
    
    <b>Axes:</b><br>
    X — Previous state (t-1) of selected variable<br>
    Y — Current state (t) of selected variable<br>
    Color — Third variable intensity<br><br>
    
    <b>Variables:</b><br>
    P — Pressure (skepticism / tension)<br>
    V — Attention (focus / cognitive volume)<br>
    T — Temperature (activity / intensity)<br><br>
    
    <b>Controls:</b><br>
    • Mouse wheel — zoom<br>
    • Drag — pan<br>
    • Play / Pause — control time flow<br>
    • Axis selectors — change projection<br><br>
    
    <b>Interpretation:</b><br>
    • One point → static system<br>
    • Line → trend (growth or decay)<br>
    • Cloud → noise / chaos<br>
    • Loops → cyclic behavior<br>
    • Structured shapes → system memory / attractors<br><br>
    
    <b>Advanced:</b><br>
    • White circles — attractors (cluster centers)<br>
    • Heatmap — density of visited states<br>
    • Cyan point — predicted next state<br>
    • Pattern detection — automatic classification (static, trend, cycle, chaos)<br><br>
    
    This is a dynamic representation of the system's internal state transitions and stability structure.
    `
        
    root.appendChild(description)

    // ===== CONTROLS =====
    const controls = document.createElement("div")
    controls.style.color = "#aaa"
    controls.innerHTML = `
<button id="playPause">Pause</button>
<button id="reset">Reset</button>
`
    root.appendChild(controls)

    controls.querySelector("#playPause").onclick = () => {
        playing = !playing
        controls.querySelector("#playPause").innerText = playing ? "Pause" : "Play"
        if(playing) animate()
    }

    controls.querySelector("#reset").onclick = () => t = 2

    // ===== ZOOM =====
    canvas.addEventListener("wheel", e => {
        e.preventDefault()
        scale *= e.deltaY > 0 ? 0.9 : 1.1
    })

    // ===== PAN =====
    let dragging = false
    let lastX = 0
    let lastY = 0

    canvas.addEventListener("mousedown", e => {
        dragging = true
        lastX = e.clientX
        lastY = e.clientY
    })

    window.addEventListener("mouseup", () => dragging = false)

    window.addEventListener("mousemove", e => {
        if(dragging){
            offsetX += e.clientX - lastX
            offsetY += e.clientY - lastY
            lastX = e.clientX
            lastY = e.clientY
        }
    })

    // ===== HELPERS =====
    function getPoint(i){
        const prev = weather[i-1]
        const curr = weather[i]

        return {
            x: (prev[axisX] || 0) * SIZE * scale + offsetX,
            y: (curr[axisY] || 0) * SIZE * scale + offsetY
        }
    }

    // ===== CLUSTER =====
    function kmeans(points, k=3){
        let centroids = points.slice(0,k)

        for(let iter=0; iter<5; iter++){
            const clusters = Array.from({length:k}, ()=>[])

            for(const p of points){
                let best=0, min=Infinity
                for(let i=0;i<k;i++){
                    const dx = p.x-centroids[i].x
                    const dy = p.y-centroids[i].y
                    const d = dx*dx+dy*dy
                    if(d<min){min=d; best=i}
                }
                clusters[best].push(p)
            }

            for(let i=0;i<k;i++){
                if(!clusters[i].length) continue
                centroids[i]={
                    x: clusters[i].reduce((s,p)=>s+p.x,0)/clusters[i].length,
                    y: clusters[i].reduce((s,p)=>s+p.y,0)/clusters[i].length
                }
            }
        }
        return centroids
    }

    // ===== MEMORY =====
    const clusterHistory = []

    // ===== AUTO-DETECT =====
    function detectPattern(points){

        if(points.length < 10) return "Collecting..."

        let dxSum=0, dySum=0, variance=0

        for(let i=1;i<points.length;i++){
            const dx = points[i].x - points[i-1].x
            const dy = points[i].y - points[i-1].y

            dxSum += dx
            dySum += dy
            variance += dx*dx + dy*dy
        }

        let prevPattern = null
        let patternHistory = []
            
        variance /= points.length

        if(variance < 2) return "Static"
        if(Math.abs(dxSum) > 100 || Math.abs(dySum) > 100) return "Trend"

        // цикл: возвращение к началу
        const first = points[0]
        const last = points[points.length-1]
        const dist = (first.x-last.x)**2 + (first.y-last.y)**2

        if(dist < 100) return "Cycle"

        return "Chaos"
    }

    function interpretTransition(current){
            
        patternHistory.push(current)
                
        if(patternHistory.length > 20){
            patternHistory.shift()
        }

        const chaosCount = patternHistory.filter(p => p === "Chaos").length
                
        if(chaosCount > 15){
            prevPattern = current
            return "Deep chaotic regime"
        }

        // ===== STABILITY =====
        const staticCount = patternHistory.filter(p => p === "Static").length
        if(staticCount > 15){
            prevPattern = current
            return "Deep stability"
        }
            
        // ===== EMERGING CYCLE =====
        const cycleCount = patternHistory.filter(p => p === "Cycle").length
        if(cycleCount > 15){
            prevPattern = current
            return "Stable cyclic attractor"
        }

        if(cycleCount > 8 && cycleCount <= 15){
            prevPattern = current
            return "Emerging cycle"
        }
            
        // ===== BASE LOGIC =====
            
        if(!prevPattern){
            prevPattern = current
            return "Initializing..."
        }

        if(cycleCount > 15){
            return "Stable cyclic attractor"
        }
            
        if(!prevPattern){
            prevPattern = current
            return "Initializing..."
        }
            
        let result = current
                
        if(prevPattern === "Chaos" && current === "Cycle"){
            result = "Stabilizing (chaos → order)"
        }
        else if(prevPattern === "Cycle" && current === "Chaos"){
            result = "Entering chaos"
        }
        else if(current === "Trend"){
            result = "Directional drift"
        }
        else if(current === "Static"){
            result = "System stabilized"
        }
        else if(current === "Cycle"){
            result = "Oscillating / cyclic behavior"
        }
        else if(current === "Chaos"){
            result = "Chaotic exploration"
        }
            
        prevPattern = current
        return result
    }

    // ===== PREDICTION =====
    function predictNext(points){
        if(points.length < 2) return null

        const a = points[points.length-2]
        const b = points[points.length-1]

        return {
            x: b.x + (b.x - a.x),
            y: b.y + (b.y - a.y)
        }
    }

    // ===== HEATMAP =====
    function drawHeatmap(points){
        const grid = 40
        const cell = SIZE/grid
        const map = {}

        for(const p of points){
            const gx = Math.floor(p.x / cell)
            const gy = Math.floor(p.y / cell)
            const key = gx+"_"+gy
            map[key] = (map[key]||0)+1
        }

        for(const key in map){
            const [gx,gy] = key.split("_").map(Number)
            const intensity = map[key]/10

            ctx.fillStyle = `rgba(255,0,0,${Math.min(intensity,0.5)})`
            ctx.fillRect(gx*cell, gy*cell, cell, cell)
        }
    }

    // ===== DRAW =====
    function getStateColor(state){
        
        if(!state) return "lime"
            
        if(state.includes("Deep stability")) return "#3399ff"
        if(state.includes("Stable cyclic attractor")) return "#cc66ff"
        if(state.includes("Emerging cycle")) return "#66ffff"
        if(state.includes("Deep chaotic regime")) return "#8b0000"
        if(state.includes("Chaos")) return "#ff3333"
        if(state.includes("Trend")) return "#ffff33"
            
        return "lime"
    }
    
    function draw(){

    ctx.clearRect(0,0,SIZE,SIZE)

    const points = []

    // ===== 1. собираем точки =====
    for(let i=1;i<t;i++){
        const p = getPoint(i)
        points.push(p)
    }

    // ===== 2. считаем состояние (ВАЖНО — ДО РИСОВАНИЯ) =====
    const pattern = detectPattern(points)
    const interpretation = interpretTransition(pattern)
    const stateColor = getStateColor(interpretation)

    // ===== 3. рисуем =====
    ctx.beginPath()

    for(let i=1;i<t;i++){
        const p = getPoint(i)

        ctx.fillStyle = stateColor
        ctx.fillRect(p.x, p.y, 2, 2)

        if(i === 1){
            ctx.moveTo(p.x, p.y)
        } else {
            ctx.lineTo(p.x, p.y)
        }
    }

    ctx.strokeStyle = stateColor
    ctx.globalAlpha = 0.5
    ctx.stroke()
    ctx.globalAlpha = 1

    // ===== 4. heatmap =====
    drawHeatmap(points)

    // ===== 5. clusters =====
    if(points.length > 20){
        const centers = kmeans(points,3)

        clusterHistory.push(centers)

        ctx.fillStyle="white"
        centers.forEach(c=>{
            ctx.beginPath()
            ctx.arc(c.x,c.y,5,0,Math.PI*2)
            ctx.fill()
        })
    }

    // ===== 6. prediction =====
    const pred = predictNext(points)
    if(pred){
        ctx.fillStyle="cyan"
        ctx.beginPath()
        ctx.arc(pred.x, pred.y, 4, 0, Math.PI*2)
        ctx.fill()
    }

    // ===== 7. UI =====
    info.innerHTML = `
    Pattern: <b>${pattern}</b><br>
    State: <b>${interpretation}</b><br>
    Points: ${points.length}<br>
    Clusters memory: ${clusterHistory.length}
    `
}

    function animate(){
        if(!playing) return

        draw()

        t++
        if(t < weather.length){
            requestAnimationFrame(animate)
        }
    }

    animate()
}
