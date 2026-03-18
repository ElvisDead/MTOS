import { drawWeatherMap } from "./weatherMap.js"
import { drawGlobalKinMap } from "./globalKinMap.js"
import { drawPressureMap } from "./pressureMap.js"

let pyodide = null

export async function initMTOS(){

    const status = document.getElementById("status")

    try{
        status.innerText = "Loading Pyodide..."
        pyodide = await loadPyodide()

        status.innerText = "Loading numpy..."
        await pyodide.loadPackage("numpy")

        status.innerText = "Loading engine..."
        const code = await fetch("./MTOS_Engine.py").then(r => r.text())
        pyodide.runPython(code)

        status.innerText = "Ready"
    }catch(e){
        console.error(e)
        status.innerText = "INIT ERROR"
    }
}

export async function runMTOS(){

    const status = document.getElementById("status")

    const name = document.getElementById("name").value
    const year = parseInt(document.getElementById("year").value)
    const month = parseInt(document.getElementById("month").value)
    const day = parseInt(document.getElementById("day").value)

    if(!name || !year || !month || !day){
        status.innerText = "Fill fields"
        return
    }

    try{
        status.innerText = "Running..."

        pyodide.runPython(`run_mtos("${name}",${year},${month},${day})`)

        const weather = JSON.parse(pyodide.runPython(`
import json
json.dumps(mtos_260_weather("${name}",${year},${month},${day}))
`))

        const kinCounts = JSON.parse(pyodide.runPython(`mtos_global_kin_map()`))
        const usersByKin = JSON.parse(pyodide.runPython(`mtos_users_by_kin()`))

        const pressure = JSON.parse(pyodide.runPython(`mtos_pressure_map()`))

        drawWeatherMap("weatherMap", weather)
        drawGlobalKinMap("globalKinMap", kinCounts, usersByKin)
        drawPressureMap("pressureMap", pressure)

        status.innerText = "Done"

    }catch(e){
        console.error(e)
        status.innerText = "ERROR"
    }
}
