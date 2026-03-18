// charts.js

export function drawChart(canvasId, series, options = {}) {

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // =========================
    // SETTINGS
    // =========================

    const padding = 30;
    const max = 1;
    const min = 0;

    const color = options.color || "#00ffcc";

    // =========================
    // BACKGROUND
    // =========================

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    // =========================
    // GRID
    // =========================

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;

    const rows = 5;

    for (let i = 0; i <= rows; i++) {

        const y = padding + (height - 2 * padding) * (i / rows);

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // =========================
    // AXES
    // =========================

    ctx.strokeStyle = "#444";

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // =========================
    // NORMALIZE
    // =========================

    function toX(i) {
        return padding + (i / (series.length - 1)) * (width - 2 * padding);
    }

    function toY(v) {
        return height - padding - ((v - min) / (max - min)) * (height - 2 * padding);
    }

    // =========================
    // LINE
    // =========================

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();

    series.forEach((v, i) => {

        const x = toX(i);
        const y = toY(v);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // =========================
    // POINTS (optional)
    // =========================

    if (options.points) {

        ctx.fillStyle = color;

        series.forEach((v, i) => {
            const x = toX(i);
            const y = toY(v);

            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // =========================
    // STATE LINES
    // =========================

    const states = [
        { value: 0.72, label: "FOCUS", color: "#00ff88" },
        { value: 0.60, label: "FLOW", color: "#00ccff" },
        { value: 0.48, label: "NEUTRAL", color: "#888" },
        { value: 0.36, label: "FATIGUE", color: "#ffaa00" }
    ];

    states.forEach(s => {

        const y = toY(s.value);

        ctx.strokeStyle = s.color;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        ctx.setLineDash([]);

        // label
        ctx.fillStyle = s.color;
        ctx.font = "10px Arial";
        ctx.fillText(s.label, width - padding + 5, y + 3);
    });

    // =========================
    // TITLE
    // =========================

    if (options.title) {
        ctx.fillStyle = "#ccc";
        ctx.font = "12px Arial";
        ctx.fillText(options.title, padding, 15);
    }
}
