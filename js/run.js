export async function run(){

const pyodide = window.pyodide

if(!pyodide){
alert("MTOS engine still loading. Please wait a few seconds.")
return
}

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

drawKinMap(weather)

// HEATMAPS
renderMap("pressure")
renderMap("gradient")
renderMap("atlas",20,20)
renderMap("attractor",20,20)
renderMap("phase")
renderMap("wave")
renderMap("tzolkin")
renderMap("geometry")

// GLOBAL KIN DISTRIBUTION
const kinMap = JSON.parse(
pyodide.runPython(`mtos_global_kin_map()`)
)

window.kinUsers = JSON.parse(
pyodide.runPython(`mtos_users_by_kin()`)
)

drawMatrix("kinDistribution", kinMap)
drawLinearKinMap("kinLinear", kinMap)

// COLLECTIVE STATE
const collective = JSON.parse(
pyodide.runPython(`mtos_collective()`)
)

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
