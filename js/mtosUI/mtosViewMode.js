export const MTOS_VIEW_MODE_KEY = "mtos_view_mode_v1";

export function loadMTOSViewMode() {
    try {
        const raw = localStorage.getItem(MTOS_VIEW_MODE_KEY);
        return raw === "full" ? "full" : "lite";
    } catch (e) {
        return "lite";
    }
}

export function saveMTOSViewMode(mode) {
    try {
        localStorage.setItem(
            MTOS_VIEW_MODE_KEY,
            mode === "full" ? "full" : "lite"
        );
    } catch (e) {}
}

export function applyMTOSViewMode(mode) {
    const safeMode = mode === "full" ? "full" : "lite";
    const isLite = safeMode === "lite";

    document.querySelectorAll(".research-block").forEach(el => {
        el.classList.toggle("mtos-hidden", isLite);
    });

    const liteBtn = document.getElementById("viewLiteBtn");
    const fullBtn = document.getElementById("viewFullBtn");

    if (liteBtn) liteBtn.classList.toggle("active", safeMode === "lite");
    if (fullBtn) fullBtn.classList.toggle("active", safeMode === "full");

    window.mtosViewMode = safeMode;
}

window.setMTOSViewMode = function(mode) {
    const safeMode = mode === "full" ? "full" : "lite";

    saveMTOSViewMode(safeMode);
    applyMTOSViewMode(safeMode);

    if (typeof window._rerenderMTOS === "function") {
        window._rerenderMTOS();
    }
};