export async function exportExperiment(){

const pyodide = window.pyodide

let data = pyodide.runPython(`export_experiment()`)

let blob = new Blob([data], {type:"application/json"})

let a = document.createElement("a")

a.href = URL.createObjectURL(blob)

a.download = "mtos_experiment.json"

a.click()

}
