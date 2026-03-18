// heatmap.js

import { getHeatColor, COLORS } from './colors.js';

export async function drawHeatmap(pyodide, canvasId, params) {

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // =========================
    // PARAMS
    // =========================

    const { name, year, month, day } = params;

    // =========================
    // LOAD DATA FROM PYTHON
    // =========================

    let raw;

    try {

        raw = await pyodide.runPythonAsync(`
mtos_phase_density("${name}", ${year}, ${month}, ${day})
        `);

    } catch (err) {
        console.error("Heatmap error:", err);
        return;
    }

    const data = JSON.parse(raw);

    // =========================
    // GRID
    // =========================

    const size = 20;

    const cellW = width / size;
    const cellH = height / size;

    // =========================
    // DRAW
    // =========================

    for (let y = 0; y < size; y++) {

        for (let x = 0; x < size; x++) {

            const index = y * size + x;
            const value = data[index] || 0;

            ctx.fillStyle = getHeatColor(value);

            ctx.fillRect(
                x * cellW,
                y * cellH,
                cellW,
                cellH
            );
        }
    }

    // =========================
    // GRID LINES (optional)
    // =========================

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= size; i++) {

        // vertical
        ctx.beginPath();
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, height);
        ctx.stroke();

        // horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellH);
        ctx.lineTo(width, i * cellH);
        ctx.stroke();
    }

    // =========================
    // TITLE
    // =========================

    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial";
    ctx.fillText("Phase Density Heatmap", 10, 15);
}
