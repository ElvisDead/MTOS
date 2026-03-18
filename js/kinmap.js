// kinmap.js

import { getColor, COLORS } from './colors.js';

export async function drawKinMap(pyodide, canvasId, params) {

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
mtos_260_weather("${name}", ${year}, ${month}, ${day})
        `);
    } catch (err) {
        console.error("KinMap error:", err);
        return;
    }

    let data;

    if (typeof raw === "string") {
        data = JSON.parse(raw);
    } else {
        data = raw;
    }

    if (!Array.isArray(data)) {
        console.error("Weather is not array:", data);
        return;
    }

    // =========================
    // GRID STRUCTURE (13 x 20)
    // =========================

    const cols = 13;
    const rows = 20;

    const cellW = width / cols;
    const cellH = height / rows;

    // =========================
    // DRAW CELLS
    // =========================

    const values = data.map(d => d.attention);

    const min = Math.min(...values);
    const max = Math.max(...values);

    for (let kin = 0; kin < 260; kin++) {

        const item = data[kin];
        if (!item) continue;

        let value = item.attention;

        // нормализация
        if (max !== min) {
            value = (value - min) / (max - min);
        } else {
            value = 0.5;
        }

        // усиление через pressure
        const pressure = item.pressure || 0;
        value = value * (0.7 + pressure * 0.3);

        // clamp
        value = Math.max(0, Math.min(1, value));

        const tone = kin % 13;
        const seal = Math.floor(kin / 13);

        const x = tone * cellW;
        const y = seal * cellH;

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
    // HIGHLIGHT TODAY
    // =========================

    const todayKin = new Date().getDate() % 260;

    const tone = todayKin % 13;
    const seal = Math.floor(todayKin / 13);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        tone * cellW,
        seal * cellH,
        cellW,
        cellH
    );

    // =========================
    // TITLE
    // =========================

    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial";
    ctx.fillText("260 Kin Map", 10, 15);
}
