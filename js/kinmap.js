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

    console.log("RAW WEATHER:", raw);

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

    const cols = 13; // tones
    const rows = 20; // seals

    const cellW = width / cols;
    const cellH = height / rows;

    // =========================
    // DRAW CELLS
    // =========================

    for (let kin = 0; kin < 260; kin++) {

        const item = data[kin];

        if (!item) continue;

        const value = item.attention;

        // вычисление координат
        const tone = (kin % 13);
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
    // HIGHLIGHT TODAY (Kin 1 в массиве)
    // =========================

    const todayKin = new Date().getDate() % 260;

    const tone = todayKin % 13;
    const seal = todayKin % 20;

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
