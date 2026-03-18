// main.js

import { runMTOS } from './run.js';
import { exportExperiment } from './exportExperiment.js';

// ======================================
// INIT APP
// ======================================

export function initApp(pyodide) {

    console.log("App initialized");

    const runBtn = document.getElementById("runBtn");
    const exportBtn = document.getElementById("exportBtn");

    if (!runBtn) {
        console.error("runBtn not found");
        return;
    }

    // =========================
    // RUN BUTTON
    // =========================

    runBtn.onclick = async () => {

        const name = document.getElementById("name").value || "User";
        const year = parseInt(document.getElementById("year").value) || 1987;
        const month = parseInt(document.getElementById("month").value) || 1;
        const day = parseInt(document.getElementById("day").value) || 1;

        const params = { name, year, month, day };

        console.log("Running with:", params);

        await runMTOS(pyodide, params);
    };

    // =========================
    // EXPORT BUTTON
    // =========================

    if (exportBtn) {

        exportBtn.onclick = () => {
            exportExperiment(pyodide);
        };

    }
}
