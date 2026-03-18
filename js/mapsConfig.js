import { drawKinMap } from './kinmap.js';
import { drawLinearKinMap } from './linearKinMap.js';
import { drawHeatmap } from './heatmap.js';
import { drawGlobalKinMap } from './globalKinMap.js';
import { drawPhaseSpace } from './phaseSpace.js';

// ======================================
// MAP REGISTRY (ПОЛНОЕ ВОССТАНОВЛЕНИЕ)
// ======================================

export const MAPS = {

    kinMap: {
        id: "kinmap",
        draw: drawKinMap,
        needsParams: false,
        enabled: true
    },

    linearKinMap: {
        id: "linear",
        draw: drawLinearKinMap,
        needsParams: false,
        enabled: true
    },

    heatmap: {
        id: "heatmap",
        draw: drawHeatmap,
        needsParams: false,
        enabled: true
    },

    globalKinMap: {
        id: "global",
        draw: drawGlobalKinMap,
        needsParams: false,
        enabled: true
    },

    phaseSpace: {
        id: "phase",
        draw: drawPhaseSpace,
        needsParams: false,
        enabled: true
    }

};

// ======================================
// SAFE DRAW WRAPPER (ВОССТАНОВЛЕНО)
// ======================================

async function safeDraw(map, pyodide, params) {

    if (!map.enabled) {
        console.log("Map disabled:", map.id);
        return;
    }

    const container = document.getElementById(map.id);

    if (!container) {
        console.warn("Container not found:", map.id);
        return;
    }

    try {

        console.log("DRAW START:", map.id);

        if (map.needsParams) {
            await map.draw(pyodide, map.id, params);
        } else {
            await map.draw();
        }

        console.log("DRAW DONE:", map.id);

    } catch (err) {

        console.error("DRAW FAIL:", map.id, err);

    }
}

// ======================================
// DRAW ONE MAP
// ======================================

export async function drawMap(name, pyodide, params) {

    const map = MAPS[name];

    if (!map) {
        console.warn("Map not found:", name);
        return;
    }

    await safeDraw(map, pyodide, params);
}

// ======================================
// DRAW ALL MAPS (ПОЛНЫЙ PIPELINE)
// ======================================

export async function drawAllMaps(pyodide, params) {

    console.log("=====================================");
    console.log("DRAW ALL MAPS START");

    const keys = Object.keys(MAPS);

    for (let key of keys) {

        const map = MAPS[key];

        await safeDraw(map, pyodide, params);

    }

    console.log("DRAW ALL MAPS DONE");
}

// ======================================
// RUNTIME CONTROL (ВОССТАНОВЛЕНО)
// ======================================

export function enableMap(name) {
    if (MAPS[name]) MAPS[name].enabled = true;
}

export function disableMap(name) {
    if (MAPS[name]) MAPS[name].enabled = false;
}

export function toggleMap(name) {
    if (MAPS[name]) MAPS[name].enabled = !MAPS[name].enabled;
}

// ======================================
// DEBUG API (ВОССТАНОВЛЕНО)
// ======================================

export function listMaps() {
    return Object.keys(MAPS);
}

export function getMapState(name) {
    return MAPS[name] || null;
}

// ======================================
// GLOBAL DEBUG (ВОССТАНОВЛЕНО)
// ======================================

if (typeof window !== "undefined") {

    window.MAPS = MAPS;
    window.drawAllMaps = drawAllMaps;
    window.drawMap = drawMap;
    window.enableMap = enableMap;
    window.disableMap = disableMap;
    window.toggleMap = toggleMap;
    window.listMaps = listMaps;

}
