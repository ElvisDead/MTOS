import { drawAllMaps } from './mapsConfig.js';
import { drawChart } from './charts.js';

// ======================================
// SAFE JSON PARSE
// ======================================

function safeParse(raw) {
    try {
        return (typeof raw === "string") ? JSON.parse(raw) : raw;
    } catch (e) {
        console.error("JSON parse error:", e, raw);
        return null;
    }
}

// ======================================
// PYTHON EXEC WRAPPER
// ======================================

async function runPython(pyodide, code) {
    try {
        return await pyodide.runPythonAsync(code);
    } catch (err) {
        console.error("Python execution error:", err);
        throw err;
    }
}

// ======================================
// VALIDATION
// ======================================

function validateWeather(data) {
    if (!Array.isArray(data)) return false;
    if (data.length !== 260) return false;
    return true;
}

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

        console.log("=====================================");
        console.log("Running MTOS...");
        console.log("Params:", params);

        // ======================================
        // 1. CORE ENGINE
        // ======================================

        const resultRaw = await runPython(pyodide, `
run_mtos("${name}", ${year}, ${month}, ${day})
        `);

        const result = safeParse(resultRaw);

        if (!result) {
            console.error("MTOS result invalid");
            return;
        }

        console.log("MTOS result:", result);

        // сохранить текущий kin
        window.currentKin = result.kin ?? null;

        // ======================================
        // 2. WEATHER (260)
        // ======================================

        const weatherRaw = await runPython(pyodide, `
mtos_260_weather("${name}", ${year}, ${month}, ${day})
        `);

        const weather = safeParse(weatherRaw);

        if (!validateWeather(weather)) {
            console.error("INVALID WEATHER DATA", weather);
            return;
        }

        window.weather = weather;

        console.log("WEATHER LOADED:", weather.length);

        // ======================================
        // 3. USERS INIT (НЕ ТЕРЯЕМ)
        // ======================================

        window.kinUsers = window.kinUsers || {};

        if (!window.kinUsers[result.kin]) {
            window.kinUsers[result.kin] = [];
        }

        // можно добавлять пользователя (если нужно)
        if (name) {
            window.kinUsers[result.kin].push({
                name,
                kin: result.kin
            });
        }

        console.log("KIN USERS:", window.kinUsers);

        // ======================================
        // 4. DRAW MAPS (ЕДИНЫЙ PIPELINE)
        // ======================================

        await drawAllMaps(pyodide, params);

        // ======================================
        // 5. SERIES (ГРАФИК)
        // ======================================

        const seriesRaw = await runPython(pyodide, `
mtos_series("${name}", ${year}, ${month}, ${day}, 60)
        `);

        const series = safeParse(seriesRaw);

        if (series) {
            drawChart("charts", series, {
                title: "Attention Dynamics"
            });
        } else {
            console.warn("Series invalid");
        }

        // ======================================
        // DONE
        // ======================================

        console.log("MTOS PIPELINE DONE");

        return result;

    } catch (err) {

        console.error("Run error:", err);
        return null;
    }
}
