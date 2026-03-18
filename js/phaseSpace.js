// phaseSpace.js

import { COLORS } from './colors.js';

export async function drawPhaseSpace(pyodide, canvasId, params) {

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
mtos_phase_space("${name}", ${year}, ${month}, ${day})
        `);

    } catch (err) {
        console.error("PhaseSpace error:", err);
        return;
    }

    const data = JSON.parse(raw);

    const xs = data.x || [];
    const ys = data.y || [];

    // =========================
    // NORMALIZATION
    // =========================

    function toX(v) {
        return v * width;
    }

    function toY(v) {
        return height - v * height;
    }

    // =========================
    // BACKGROUND
    // =========================

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // =========================
    // AXES
    // =========================

    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;

    // X axis
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // =========================
    // DRAW POINTS
    // =========================

    for (let i = 0; i < xs.length; i++) {

        const x = toX(xs[i]);
        const y = toY(ys[i]);

        // плотность через прозрачность
        ctx.fillStyle = "rgba(0, 255, 200, 0.5)";

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // =========================
    // TITLE
    // =========================

    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial";
    ctx.fillText("Phase Space", 10, 15);
}
