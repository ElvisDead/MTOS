// globalKinMap.js

import { getColor } from './colors.js';

export async function drawGlobalKinMap(pyodide, canvasId) {

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // =========================
    // LOAD DATA FROM PYTHON
    // =========================

    let raw;

    try {

        raw = await pyodide.runPythonAsync(`
mtos_global_kin_map()
        `);

    } catch (err) {
        console.error("GlobalKinMap error:", err);
        return;
    }

    const data = JSON.parse(raw);

    // =========================
    // NORMALIZATION
    // =========================

    const max = Math.max(...data, 1);

    // =========================
    // LAYOUT
    // =========================

    const cols = 26; // 26 * 10 = 260
    const rows = 10;

    const cellW = width / cols;
    const cellH = height / rows;

    // =========================
    // DRAW
    // =========================

    for (let i = 0; i < 260; i++) {

        const value = data[i] / max;

        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = col * cellW;
        const y = row * cellH;

        ctx.fillStyle = getColor(value);
        ctx.fillRect(x, y, cellW, cellH);
    }

    // =========================
    // GRID (optional)
    // =========================

    ctx.strokeStyle = "#111";

    for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, height);
        ctx.stroke();
    }

    for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(width, r * cellH);
        ctx.stroke();
    }

    // =========================
    // TITLE
    // =========================

    ctx.fillStyle = "#ccc";
    ctx.font = "12px Arial";
    ctx.fillText("Global Kin Distribution", 10, 15);
}
