import { drawWeatherMap } from "./weatherMap.js"
import { drawGlobalKinMap } from "./globalKinMap.js"

let pyodide = null

export async function initMTOS(){

    const status = document.getElementById("status")
    status.innerText = "Loading Pyodide..."

    pyodide = await loadPyodide()

    const code = await (await fetch("./MTOS_Engine.py")).text()

    pyodide.runPython(code)

    status.innerText = "Ready"
}

export async function runMTOS(){

    const status = document.getElementById("status")

    const name = document.getElementById("name").value
    const year = +document.getElementById("year").value
    const month = +document.getElementById("month").value
    const day = +document.getElementById("day").value

    status.innerText = "Running..."

    try{

        pyodide.runPython(`
run_mtos("${name}",${year},${month},${day})
`)

        const kinCounts = JSON.parse(
            pyodide.runPython(`mtos_global_kin_map()`)
        )

        const usersByKin = JSON.parse(
            pyodide.runPython(`mtos_users_by_kin()`)
        )

        drawGlobalKinMap("globalKinMap", kinCounts, usersByKin)

        const weather = JSON.parse(
            pyodide.runPython(`mtos_weather_map()`)
        )

        drawWeatherMap("weatherMap", weather)

        status.innerText = "Done"

    }catch(e){

        console.error(e)
        status.innerText = "ERROR"
    }
}
