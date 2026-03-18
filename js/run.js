import { drawAllMaps } from './mapsConfig.js';
import { drawChart } from './charts.js';

// ======================================
// RUN FULL MTOS PIPELINE
// ======================================

export async function runMTOS(pyodide, params) {

    const { name, year, month, day } = params;

    if (!pyodide) {
        console.error("Pyodide not ready");
        return;
    }

    try {

        console.log("Running MTOS...");

        // =========================
        // 1. RUN CORE ENGINE
        // =========================

        const resultRaw = await pyodide.runPythonAsync(`
run_mtos("${name}", ${year}, ${month}, ${day})
        `);

        const result = JSON.parse(resultRaw);

        console.log("MTOS result:", result);

        const weatherRaw = await pyodide.runPythonAsync(`
mtos_260_weather("${name}", ${year}, ${month}, ${day})
`);

window.weather = (typeof weatherRaw === "string")
? JSON.parse(weatherRaw)
    : weatherRaw;

        if (typeof drawKinMap === "function") {
            drawKinMap();
        }
        
        // =========================
        // 2. DRAW ALL MAPS
        // =========================

        await drawAllMaps(pyodide, params);

        // =========================
        // 3. DRAW CHART (SERIES)
        // =========================

        const seriesRaw = await pyodide.runPythonAsync(`
mtos_series("${name}", ${year}, ${month}, ${day}, 60)
        `);

        const series = JSON.parse(seriesRaw);

        drawChart("charts", series, {
            title: "Attention Dynamics"
        });

        // =========================
        // 4. RETURN RESULT
        // =========================

        return result;

    } catch (err) {

        console.error("Run error:", err);
        return null;
    }
}
