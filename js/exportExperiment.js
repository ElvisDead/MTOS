// exportExperiment.js

export async function exportExperiment(pyodide) {

    try {

        // =========================
        // GET DATA FROM PYTHON
        // =========================

        const result = await pyodide.runPythonAsync(`
export_experiment()
        `);

        const data = JSON.parse(result);

        // =========================
        // CREATE FILE
        // =========================

        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        // =========================
        // DOWNLOAD
        // =========================

        const a = document.createElement("a");
        a.href = url;

        const date = new Date().toISOString().slice(0, 10);

        a.download = `mtos_experiment_${date}.json`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        console.log("Export complete:", data.count, "records");

        return data;

    } catch (err) {

        console.error("Export error:", err);
        return null;
    }
}
