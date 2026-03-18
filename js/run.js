//import { drawKinMap } from "./kinmap.js"

import { startMTOS } from "./pyodideLoader.js"

export async function run(){

if(!window.pyodide){
  await startMTOS()
}

const pyodide = window.pyodide

// USER INPUT
const name = document.getElementById("name").value
const year = parseInt(document.getElementById("year").value)
const month = parseInt(document.getElementById("month").value)
const day = parseInt(document.getElementById("day").value)

// SEND VARIABLES TO PYTHON
pyodide.globals.set("name",name)
pyodide.globals.set("year",year)
pyodide.globals.set("month",month)
pyodide.globals.set("day",day)

// MAIN MTOS STATE
const data = JSON.parse(
pyodide.runPython(`run_mtos(name,year,month,day)`) || "{}"
)

// CURRENT KIN
window.currentKin = data.kin

// STATE PANEL
document.getElementById("state").innerHTML = `
Kin: ${data.kin}<br>
Seal: ${data.seal}<br>
Tone: ${data.tone}<br>

<br>

Today Kin: ${data.today_kin}<br>
Today Seal: ${data.today_seal}<br>
Today Tone: ${data.today_tone}<br>

<br>

Attention: ${data.attention.toFixed(3)}<br>
State: ${data.state}
`

// METRICS
document.getElementById("metrics").innerHTML = `
<div class="metric">Entropy: ${data.entropy.toFixed(3)}</div>
<div class="metric">Chaos: ${data.chaos.toFixed(4)}</div>
<div class="metric">Lyapunov: ${data.lyapunov.toFixed(4)}</div>
<div class="metric">Predictability: ${data.predictability}</div>
`

// FORECAST SERIES

const s260 = Array.from(pyodide.runPython(`mtos_series(name,year,month,day,260)`))

const s7 = s260.slice(0,7)
const s30 = s260.slice(0,30)

drawChart("chart7",s7)
drawChart("chart30",s30)
drawChart("chart260",s260)

// 260 WEATHER MAP
const weather = pyodide.runPython(
`mtos_260_weather(name,year,month,day)`
).toJs()

const usersByKin = JSON.parse(pyodide.runPython(`mtos_users_by_kin()`))

window.kinUsers = Object.fromEntries(
  Object.entries(usersByKin).map(([k,v]) => [parseInt(k), v])
)

drawGlobalKinMap("globalKinMap")

//console.log("KIN USERS:", window.kinUsers)
  
//drawKinMap(weather)

// HEATMAPS
//renderMap("pressure")
//renderMap("gradient")
//renderMap("atlas",20,20)
//renderMap("attractor",20,20)
//renderMap("phase")
//renderMap("wave")
//renderMap("tzolkin")
//renderMap("geometry")

// GLOBAL KIN DISTRIBUTION
const kinMap = JSON.parse(
pyodide.runPython(`mtos_global_kin_map()`)
)

drawLinearKinMap("kinLinear", kinMap)

// COLLECTIVE STATE
const collective = JSON.parse(
pyodide.runPython(`mtos_collective()`)
)

let networkData = JSON.parse(
pyodide.runPython(`mtos_user_network()`)
)

let net = document.getElementById("network")

if(networkData.length===0){
net.innerHTML="No user interactions yet."
}else{

net.innerHTML=""

// 1. сортировка по силе
networkData.sort((a,b)=>b.value - a.value)

// 2. цвет + расширенные уровни
function getRelationColor(v){

if(v >= 0.75) return "#00ffcc"      // ultra synergy
if(v >= 0.6) return "#00ff88"       // strong
if(v >= 0.45) return "#66ff66"      // positive
if(v >= 0.25) return "#aaff66"      // mild support
if(v >= 0.1) return "#ffff66"       // weak
if(v > -0.1) return "#888888"       // neutral
if(v > -0.25) return "#ff9966"      // tension
if(v > -0.45) return "#ff5555"      // conflict
return "#ff0033"                    // strong conflict
}

// 3. рендер

function getRelationLabel(v){

if(v >= 0.75) return "ULTRA SYNERGY"
if(v >= 0.6) return "STRONG"
if(v >= 0.45) return "POSITIVE"
if(v >= 0.25) return "MILD SUPPORT"
if(v >= 0.1) return "WEAK"
if(v > -0.1) return "NEUTRAL"
if(v > -0.25) return "TENSION"
if(v > -0.45) return "CONFLICT"
return "STRONG CONFLICT"

}

networkData.forEach(e=>{

let line=document.createElement("div")

let color = getRelationColor(e.value)

let label = getRelationLabel(e.value)

line.innerHTML =
"<b>"+e.a+"</b> ↔ <b>"+e.b+"</b><br>"+
"<span style='color:"+color+"'>"+label+"</span> "+
"("+e.value.toFixed(2)+")"

line.style.margin="3px"
line.style.color=color
line.style.fontWeight="500"
line.style.background = "rgba(255,255,255,0.03)"
line.style.borderLeft = "3px solid " + color
line.style.paddingLeft = "6px"

net.appendChild(line)

})

}

document.getElementById("collective").innerHTML = `
Mean attention: ${collective.mean ?? "N/A"}<br>
Volatility: ${collective.volatility ?? "N/A"}<br>
State: ${collective.state}
`

// PHASE SPACE
const phaseSpace = pyodide.runPython(
`mtos_phase_space(name,year,month,day)`
).toJs()

drawPhaseSpace(phaseSpace)

// PHASE DENSITY
const density = pyodide.runPython(
`mtos_phase_density(name,year,month,day)`
).toJs()

drawHeatmap("phaseDensity",density,20)

}
