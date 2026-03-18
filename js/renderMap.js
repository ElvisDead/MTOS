// renderMap.js

import { COLORS } from './colors.js';

// ======================================
// PREPARE CANVAS
// ======================================

export function prepareCanvas(canvasId) {

    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        console.warn("Canvas not found:", canvasId);
        return null;
    }

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    // очистка
    ctx.clearRect(0, 0, width, height);

    // базовый фон
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    return { canvas, ctx, width, height };
}

// ======================================
// SAFE DRAW WRAPPER
// ======================================

export async function renderMap(drawFn, pyodide, canvasId, params = null) {

    const prepared = prepareCanvas(canvasId);

    if (!prepared) return;

    try {

        if (params) {
            await drawFn(pyodide, canvasId, params);
        } else {
            await drawFn(pyodide, canvasId);
        }

    } catch (err) {

        console.error("Render error:", canvasId, err);

        drawError(canvasId, err);
    }
}

// ======================================
// ERROR RENDER
// ======================================

export function drawError(canvasId, err) {

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff4444";
    ctx.font = "12px Arial";

    ctx.fillText("Render error", 10, 20);

    if (err && err.message) {
        ctx.fillText(err.message, 10, 40);
    }
}
