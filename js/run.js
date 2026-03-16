export async function run(){

const pyodide = window.pyodide

if(!pyodide){
alert("MTOS engine still loading. Please wait a few seconds.");
return;
}

let name=document.getElementById("name").value
let year=parseInt(document.getElementById("year").value)
let month=parseInt(document.getElementById("month").value)
let day=parseInt(document.getElementById("day").value)

pyodide.globals.set("name",name)
pyodide.globals.set("year",year)
pyodide.globals.set("month",month)
pyodide.globals.set("day",day)

let data = JSON.parse(
pyodide.runPython(`run_mtos(name,year,month,day)`) || "{}"
)

currentKin = data.kin

document.getElementById("state").innerHTML=
`
Kin: ${data.kin}<br>
Seal: ${data.seal}<br>
Tone: ${data.tone}<br>

Analog: ${data.analog}<br>
Antipode: ${data.antipode}<br>
Occult: ${data.occult}<br>

<br>

Today Kin: ${data.today_kin}<br>
Today Seal: ${data.today_seal}<br>
Today Tone: ${data.today_tone}<br>

<br>

Attention: ${data.attention.toFixed(3)}<br>
State: ${data.state}
`

document.getElementById("metrics").innerHTML=
`
<div class="metric">Entropy: ${data.entropy.toFixed(3)}</div>
<div class="metric">Chaos: ${data.chaos.toFixed(4)}</div>
<div class="metric">Lyapunov: ${data.lyapunov.toFixed(4)}</div>
<div class="metric">Predictability: ${data.predictability}</div>
`

let s7 = Array.from(pyodide.runPython(`mtos_series(name,year,month,day,7)`))
let s30 = Array.from(pyodide.runPython(`mtos_series(name,year,month,day,30)`))
let s260 = Array.from(pyodide.runPython(`mtos_series(name,year,month,day,260)`))

drawChart("chart7",s7)
drawChart("chart30",s30)
drawChart("chart260",s260)

let weather = pyodide.runPython(
`mtos_260_weather(name,year,month,day)`
).toJs()

drawKinMap(weather)

renderMap("pressure")
renderMap("gradient")
renderMap("atlas",20,20)
renderMap("attractor",20,20)
renderMap("phase")
renderMap("wave")
renderMap("tzolkin")
renderMap("geometry")

let kinMap = JSON.parse(
pyodide.runPython(`mtos_global_kin_map()`)
)

let kinActivity = JSON.parse(
pyodide.runPython(`mtos_kin_activity()`)
)

kinUsers = JSON.parse(
pyodide.runPython(`mtos_users_by_kin()`)
)

drawMatrix(
"kinDistribution",
kinMap
)

drawLinearKinMap("kinLinear", kinMap)

let collective = JSON.parse(
pyodide.runPython(`mtos_collective()`)
)

document.getElementById("collective").innerHTML = `
Mean attention: ${collective.mean ?? "N/A"}<br>
Volatility: ${collective.volatility ?? "N/A"}<br>
State: ${collective.state}
`

let phaseSpace = pyodide.runPython(`mtos_phase_space(name,year,month,day)`).toJs()

drawPhaseSpace(phaseSpace)

let density = pyodide.runPython(
`mtos_phase_density(name,year,month,day)`
).toJs()

drawHeatmap("phaseDensity",density,20)

}
