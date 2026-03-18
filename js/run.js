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
// CANVAS HELPER (ФИКС)
// ======================================

function ensureCanvas(containerId) {

    let container = document.getElementById(containerId);
    if (!container) {
        console.error("Container not found:", containerId);
        return null;
    }

    // очищаем контейнер
    container.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 300;

    container.appendChild(canvas);

    return canvas;
}

// ======================================
// USER TRACKING (ВОССТАНОВЛЕНО)
// ======================================

function trackUser(name, kin) {

    if (!name || kin == null) return;

    window.kinUsers = window.kinUsers || {};

    if (!window.kinUsers[kin]) {
        window.kinUsers[kin] = [];
    }

    const exists = window.kinUsers[kin].some(u => u.name === name);

    if (!exists) {
        window.kinUsers[kin].push({
            name,
            timestamp: Date.now()
        });
    }
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
        // 3. USERS (ВОССТАНОВЛЕНО ПОЛНОСТЬЮ)
        // ======================================

        window.kinUsers = window.kinUsers || {};

        trackUser(name, result.kin);

        console.log("KIN USERS:", window.kinUsers);

        // ======================================
        // 4. DRAW MAPS
        // ======================================

        await drawAllMaps(pyodide, params);

        // ======================================
        // 5. SERIES (ГРАФИК) — ФИКС
        // ======================================

        const seriesRaw = await runPython(pyodide, `
mtos_series("${name}", ${year}, ${month}, ${day}, 60)
        `);

        const series = safeParse(seriesRaw);

        if (series) {

            const canvas = ensureCanvas("charts");

            if (canvas) {
                drawChart(canvas, series, {
                    title: "Attention Dynamics"
                });
            }

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
