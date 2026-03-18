// linearKinMap.js

import { getColor, COLORS } from './colors.js';

export async function drawLinearKinMap(pyodide, canvasId, params) {

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const { name, year, month, day } = params;

    // =========================
    // LOAD DATA
    // =========================

    let raw;

    try {

        raw = await pyodide.runPythonAsync(`
mtos_260_weather("${name}", ${year}, ${month}, ${day})
        `);

    } catch (err) {
        console.error("LinearKinMap error:", err);
        return;
    }

    const data = JSON.parse(raw);

    // =========================
    // LAYOUT
    // =========================

    const total = 260;

    const cols = 52;   // 52 * 5 = 260 (удобно)
    const rows = 5;

    const cellW = width / cols;
    const cellH = height / rows;

    // =========================
    // DRAW
    // =========================

    for (let i = 0; i < total; i++) {

        const item = data[i];
        if (!item) continue;

        const value = item.attention;

        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = col * cellW;
        const y = row * cellH;

        ctx.fillStyle = getColor(value);

        ctx.fillRect(x, y, cellW, cellH);
    }

    // =========================
    // GRID
    // =========================

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;

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
    // HIGHLIGHT TODAY (kin 1)
    // =========================

    const todayKin = 0;

    const col = todayKin % cols;
    const row = Math.floor(todayKin / cols);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        col * cellW,
        row * cellH,
        cellW,
        cellH
    );

    // =========================
    // TITLE
    // =========================

    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial";
    ctx.fillText("Linear 260 Kin Timeline", 10, 15);
}
