export const MTOS_ATTRACTOR_MODE_KEY = "mtos_attractor_mode_v1";

export function loadAttractorMode() {
    try {
        const raw = localStorage.getItem(MTOS_ATTRACTOR_MODE_KEY);
        return raw === "classic" ? "classic" : "map";
    } catch (e) {
        return "map";
    }
}

export function saveAttractorMode(mode) {
    try {
        localStorage.setItem(
            MTOS_ATTRACTOR_MODE_KEY,
            mode === "classic" ? "classic" : "map"
        );
    } catch (e) {}
}

export function ensureAttractorToggle() {
    const host =
        document.getElementById("attractorSectionTitle")?.parentElement ||
        document.getElementById("attractorMap")?.parentElement;

    if (!host) return;

    let wrap = document.getElementById("attractorModeSwitch");

    if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = "attractorModeSwitch";
        wrap.style.display = "flex";
        wrap.style.gap = "8px";
        wrap.style.flexWrap = "wrap";
        wrap.style.margin = "10px 0 14px 0";

        const btnClassic = document.createElement("button");
        btnClassic.id = "attractorClassicBtn";
        btnClassic.type = "button";
        btnClassic.textContent = "Attractor";

        const btnMap = document.createElement("button");
        btnMap.id = "attractorMapBtn";
        btnMap.type = "button";
        btnMap.textContent = "Attractor Map";

        [btnClassic, btnMap].forEach(btn => {
            btn.style.cursor = "pointer";
            btn.style.padding = "6px 10px";
            btn.style.border = "1px solid #2a2a2a";
            btn.style.background = "#0b0b0b";
            btn.style.color = "#d8d8d8";
            btn.style.fontFamily = "monospace";
            btn.style.fontSize = "12px";
        });

        btnClassic.onclick = () => window.setAttractorMode("classic");
        btnMap.onclick = () => window.setAttractorMode("map");

        wrap.appendChild(btnClassic);
        wrap.appendChild(btnMap);

        const attractorNode = document.getElementById("attractorMap");
        if (attractorNode && attractorNode.parentElement) {
            attractorNode.parentElement.insertBefore(wrap, attractorNode);
        } else {
            host.appendChild(wrap);
        }
    }

    const classicBtn = document.getElementById("attractorClassicBtn");
    const mapBtn = document.getElementById("attractorMapBtn");
    const mode = window.attractorMode === "classic" ? "classic" : "map";

    if (classicBtn) {
        classicBtn.classList.toggle("active", mode === "classic");
        classicBtn.style.borderColor = mode === "classic" ? "#9fd4ff" : "#2a2a2a";
        classicBtn.style.color = mode === "classic" ? "#ffffff" : "#d8d8d8";
    }

    if (mapBtn) {
        mapBtn.classList.toggle("active", mode === "map");
        mapBtn.style.borderColor = mode === "map" ? "#9fd4ff" : "#2a2a2a";
        mapBtn.style.color = mode === "map" ? "#ffffff" : "#d8d8d8";
    }
}

window.setAttractorMode = function(mode) {
    const safeMode = mode === "classic" ? "classic" : "map";
    window.attractorMode = safeMode;
    saveAttractorMode(safeMode);
    ensureAttractorToggle();

    if (typeof window.renderAttractorOnly === "function") {
        window.renderAttractorOnly();
    }
};