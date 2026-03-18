// mapsConfig.js

import { drawKinMap } from './kinmap.js';
import { drawLinearKinMap } from './linearKinMap.js';
import { drawHeatmap } from './heatmap.js';
import { drawGlobalKinMap } from './globalKinMap.js';

// =========================
// MAP REGISTRY
// =========================

export const MAPS = {

    kinMap: {
        id: "kinMap",
        draw: () => {
        if (typeof drawKinMap === "function") {
            drawKinMap();
        }
        },
        needsParams: false
    },

    linearKinMap: {
        id: "linearMap",
        draw: drawLinearKinMap,
        needsParams: true
    },

    heatmap: {
        id: "heatmap",
        draw: drawHeatmap,
        needsParams: true
    },

    globalKinMap: {
        id: "globalKinMap",
        draw: drawGlobalKinMap,
        needsParams: false
    }

};

// =========================
// DRAW ONE MAP
// =========================

export async function drawMap(name, pyodide, params) {

    const map = MAPS[name];

    if (!map) {
        console.warn("Map not found:", name);
        return;
    }

    try {

        if (map.needsParams) {
            await map.draw(pyodide, map.id, params);
        } else {
            await map.draw();
        }

    } catch (err) {
        console.error("Draw error:", name, err);
    }
}

// =========================
// DRAW ALL MAPS
// =========================

export async function drawAllMaps(pyodide, params) {

    const keys = Object.keys(MAPS);

    for (let key of keys) {

        await drawMap(key, pyodide, params);

    }
}
