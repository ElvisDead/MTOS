// pyodideLoader.js

let pyodideInstance = null;

export async function loadPyodideAndRun(pythonFilePath) {

    // =========================
    // CACHE (чтобы не грузить 2 раза)
    // =========================

    if (pyodideInstance) {
        console.log("Pyodide already loaded");
        return pyodideInstance;
    }

    try {

        // =========================
        // LOAD PYODIDE
        // =========================

        console.log("Loading Pyodide...");

        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
        });

        await pyodide.loadPackage("numpy");

        console.log("Pyodide loaded");

        // =========================
        // LOAD PYTHON FILE
        // =========================

        const response = await fetch(pythonFilePath);

        if (!response.ok) {
            throw new Error("Failed to load Python file: " + pythonFilePath);
        }

        const code = await response.text();

        // =========================
        // EXECUTE PYTHON
        // =========================

        console.log("Running MTOS engine...");

        await pyodide.runPythonAsync(code);

        console.log("MTOS engine ready");

        // =========================
        // SAVE INSTANCE
        // =========================

        pyodideInstance = pyodide;

        return pyodide;

    } catch (err) {

        console.error("Pyodide init error:", err);

        throw err;
    }
}
