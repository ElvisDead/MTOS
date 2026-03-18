import { runMTOS } from './run.js';
import { exportExperiment } from './exportExperiment.js';

// ======================================
// STATE HELPERS (ВОССТАНОВЛЕНО)
// ======================================

function getInputValue(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    return el.value || fallback;
}

function getNumberValue(id, fallback) {
    const val = parseInt(getInputValue(id, fallback));
    return isNaN(val) ? fallback : val;
}

// ======================================
// USER TRACKING (ВОССТАНОВЛЕНО)
// ======================================

function trackUser(name, kin) {

    if (!name || kin == null) return;

    window.kinUsers = window.kinUsers || {};

    if (!window.kinUsers[kin]) {
        window.kinUsers[kin] = [];
    }

    const exists = window.kinUsers[kin].some(u => u.name === name);

    if (!exists) {
        window.kinUsers[kin].push({
            name,
            timestamp: Date.now()
        });
    }
}

// ======================================
// UI STATE (ВОССТАНОВЛЕНО)
// ======================================

function lockUI(state) {
    const runBtn = document.getElementById("runBtn");
    if (runBtn) runBtn.disabled = state;
}

// ======================================
// INIT APP
// ======================================

export function initApp(pyodide) {

    console.log("App initialized");

    const runBtn = document.getElementById("runBtn");
    const exportBtn = document.getElementById("exportBtn");

    if (!runBtn) {
        console.error("runBtn not found");
        return;
    }

    // ======================================
    // RUN BUTTON
    // ======================================

    runBtn.onclick = async () => {

        lockUI(true);

        try {

            const name  = getInputValue("name", "User");
            const year  = getNumberValue("year", 1987);
            const month = getNumberValue("month", 1);
            const day   = getNumberValue("day", 1);

            const params = { name, year, month, day };

            console.log("Running with:", params);

            const result = await runMTOS(pyodide, params);

            if (result && result.kin != null) {

                // сохраняем текущий kin
                window.currentKin = result.kin;

                // трекинг пользователя
                trackUser(name, result.kin);

                console.log("CURRENT KIN:", result.kin);
            }

        } catch (err) {

            console.error("RUN FAILED:", err);

        } finally {

            lockUI(false);
        }
    };

    // ======================================
    // EXPORT BUTTON
    // ======================================

    if (exportBtn) {

        exportBtn.onclick = () => {
            try {
                exportExperiment(pyodide);
            } catch (e) {
                console.error("Export failed:", e);
            }
        };

    }

    // ======================================
    // HOTKEYS (ВОССТАНОВЛЕНО)
    // ======================================

    document.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {
            runBtn.click();
        }

    });

    // ======================================
    // DEBUG STATE (ВОССТАНОВЛЕНО)
    // ======================================

    window.getMTOSState = () => ({
        weather: window.weather,
        kin: window.currentKin,
        users: window.kinUsers
    });

    console.log("App ready");
}
