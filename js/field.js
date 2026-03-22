// MTOS/js/field.js

let history = []
let maxHistory = 50

export function drawField(id, config){

        labels.style.marginRight = "6px"

    for(let t = 1; t <= 13; t++){
        const d = document.createElement("div")
        d.style.height = "21px"
        d.style.fontSize = "10px"
        d.style.display = "flex"
        d.style.alignItems = "center"
        d.innerText = t
        labels.appendChild(d)
    }

    const {
        mode = "activity",
        activity = [],
        pressure = null,
        global = [],
        users = [],
        connections = [],
        usersByKin = {},
        onKinClick = null,
        getSelectedKin = null
    } = config || {}

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    const seals = [
        "Dragon","Wind","Night","Seed","Serpent",
        "Worldbridger","Hand","Star","Moon","Dog",
        "Monkey","Human","Skywalker","Wizard","Eagle",
        "Warrior","Earth","Mirror","Storm","Sun"
    ]

    const header = document.createElement("div")
    header.style.display = "grid"
    header.style.gridTemplateColumns = "repeat(20, 21px)"
    header.style.justifyContent = "center"
    header.style.marginBottom = "6px"

    seals.forEach(s => {
        const d = document.createElement("div")
        d.style.fontSize = "9px"
        d.style.textAlign = "center"
        d.innerText = s
        header.appendChild(d)
    })
        
    c.parentNode.insertBefore(header, c)

// ===============================
// TONES (LEFT)
// ===============================
const labels = document.createElement("div")
labels.style.marginRight = "6px"

for(let t = 1; t <= 13; t++){

    const cell = document.createElement("div")
        
    cell.style.width = "21px"
    cell.style.height = "21px"
    
    const d = document.createElement("div")
    d.style.height = "21px"
    d.style.fontSize = "10px"
    d.style.display = "flex"
    d.style.alignItems = "center"
    d.innerText = t
    labels.appendChild(d)
}

const wrapper = document.createElement("div")
wrapper.style.display = "flex"
wrapper.style.justifyContent = "center"
wrapper.style.alignItems = "flex-start"

// ВАЖНО
wrapper.appendChild(labels)
wrapper.appendChild(c)

c.parentNode.appendChild(wrapper)

    // --- AUTO PRESSURE ---
    const computedPressure = pressure || computePressure(users, connections)

    // --- HISTORY ---
    history.push([...computedPressure])
    if(history.length > maxHistory) history.shift()

    // ✅ ТЕПЕРЬ МОЖНО (после pressure)
    const clusters = detectClusters(computedPressure)
    const attractors = detectAttractors()
    const flow = predictFlow()

    // --- GRID ---
    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 21px)"
    c.style.gap = "2px"
    c.style.justifyContent = "center"
    c.style.margin = "20px auto"

    const maxActivity = Math.max(...activity, 1)
    const maxGlobal = Math.max(...global, 1)

    const selectedKin = getSelectedKin ? getSelectedKin() : null

for(let tone = 0; tone < 13; tone++){
    for(let seal = 0; seal < 20; seal++){

        const kin = tone + seal * 13 + 1
        const i = kin - 1

        const a = (activity[i] || 0) / maxActivity
        const p = (computedPressure[i] || 0)
        const g = (global[i] || 0) / maxGlobal

        let v = 0
        if(mode === "activity") v = a
        if(mode === "pressure") v = p
        if(mode === "global") v = g
        if(mode === "hybrid") v = a * p

        let color = "rgb(0,0,0)"

        if(mode === "activity"){
            color = `rgb(${255*a},0,0)`
        }

        if(mode === "pressure"){
            color = `rgb(${255*p},0,${255*(1-p)})`
        }

        if(mode === "global"){
            color = `rgb(${255*g},${180*g},50)`
        }

        if(mode === "hybrid"){
            const r = Math.floor(255 * (a * p))
            const b = Math.floor(255 * (1 - p))
            color = `rgb(${r},0,${b})`
        }

        const isEvent = detectEvent(i, computedPressure)

        const cell = document.createElement("div")
        cell.style.width = "21px"
        cell.style.height = "21px"
        cell.style.background = color
        cell.style.cursor = "pointer"
        cell.style.boxSizing = "border-box"

        if(isEvent){
            cell.style.outline = "2px solid white"
        }
        else if(attractors.includes(i)){
            cell.style.outline = "2px solid yellow"
        }
        else if(
            (mode === "pressure" || mode === "hybrid") &&
            clusters.some(c => c.includes(i))
        ){
            cell.style.outline = "1px solid lime"
        }
        else if(selectedKin === kin){
            cell.style.outline = "2px solid orange"
        }

        if(flow[i] > 0.2){
            cell.style.boxShadow = "inset 0 0 4px white"
        }

        let title = `Kin ${kin}\nTone ${tone+1}\nSeal ${seal+1}`
        title += `\nActivity: ${activity[i] || 0}`
        title += `\nPressure: ${p.toFixed(3)}`
        title += `\nHybrid: ${(a*p).toFixed(3)}`

        const usersList = usersByKin[kin] || []
        if(usersList.length){
            title += `\nUsers: ${usersList.length}`
            title += "\n" + usersList.map(u => u.name).join(", ")
        }

        if(isEvent){
            title += `\n⚡ EVENT`
        }

        cell.title = title

        cell.onclick = () => {
            if(onKinClick){
                onKinClick(kin)
            }
        }

        c.appendChild(cell)
    }
}

function detectClusters(pressure, threshold = 0.6){

    const visited = new Array(260).fill(false)
    const clusters = []

    function getNeighbors(i){

        const kin = i + 1

        const tone = ((kin - 1) % 13)
        const seal = ((kin - 1) % 20)

        const neighbors = []

        for(let dt = -1; dt <= 1; dt++){
            for(let ds = -1; ds <= 1; ds++){

                if(dt === 0 && ds === 0) continue

                const nt = (tone + dt + 13) % 13
                const ns = (seal + ds + 20) % 20

                const ni = (ns * 13 + nt) % 260

                neighbors.push(ni)
            }
        }

        return neighbors
    }

    for(let i=0;i<260;i++){

        if(visited[i]) continue
        if(pressure[i] < threshold) continue

        const cluster = []
        const stack = [i]

        while(stack.length){

            const cur = stack.pop()

            if(visited[cur]) continue
            if(pressure[cur] < threshold) continue

            visited[cur] = true
            cluster.push(cur)

            getNeighbors(cur).forEach(n => {
                if(!visited[n]) stack.push(n)
            })
        }

        if(cluster.length > 2){
            clusters.push(cluster)
        }
    }

    return clusters
}

function detectAttractors(){

    if(history.length < 10) return []

    const attractors = []

    for(let i=0;i<260;i++){

        let stable = true

        for(let t=history.length-5; t<history.length; t++){
            if(history[t][i] < 0.6){
                stable = false
                break
            }
        }

        if(stable){
            attractors.push(i)
        }
    }

    return attractors
}

function predictFlow(){

    if(history.length < 2) return new Array(260).fill(0)

    const prev = history[history.length - 2]
    const curr = history[history.length - 1]

    const flow = new Array(260).fill(0)

    for(let i=0;i<260;i++){
        flow[i] = curr[i] - prev[i]
    }

    return flow
}

function computePressure(users, connections){

    const pressure = new Array(260).fill(0)

    connections.forEach(conn => {

        const a = users.find(u => u.name === conn.a)
        const b = users.find(u => u.name === conn.b)

        if(!a || !b) return

        const kinA = a.kin - 1
        const kinB = b.kin - 1

        const weight = conn.weight || 1

        pressure[kinA] += weight
        pressure[kinB] += weight

        if(conn.type === "conflict"){
            pressure[kinA] += weight * 2
            pressure[kinB] += weight * 2
        }
    })

    const max = Math.max(...pressure, 1)

    return pressure.map(v => v / max)
}

function detectEvent(index, current){

    if(history.length < 5) return false

    const prev = history[history.length - 5][index]
    const now = current[index]

    return (now - prev) > 0.4
}
