import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.mjs";

export async function startMTOS(){

console.log("Loading Pyodide...");

const pyodide = await loadPyodide();

window.pyodide = pyodide;

document.getElementById("runBtn").disabled=false
document.getElementById("runBtn").innerText="Run MTOS"

await pyodide.loadPackage("numpy");

const response = await fetch("./MTOS_Engine.py");
const code = await response.text();

await pyodide.runPythonAsync(code);

console.log("MTOS engine loaded");

}
