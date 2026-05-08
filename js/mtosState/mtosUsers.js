export function loadUsers() {
    try {
        const saved = localStorage.getItem("mtos_user_list");
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
            ? parsed.map(x => String(x || "").trim()).filter(Boolean)
            : [];
    } catch (e) {
        return [];
    }
}

export function saveUsers(list) {
    const safe = Array.isArray(list)
        ? list.map(x => String(x || "").trim()).filter(Boolean)
        : [];

    localStorage.setItem("mtos_user_list", JSON.stringify(safe));
}

export function addUser(list, name) {
    let next = Array.isArray(list) ? [...list] : [];

    const safeName = String(name || "").trim();
    if (safeName && !next.includes(safeName)) {
        next.push(safeName);
    }

    return next;
}

export function removeUser(name, deps = {}) {
    const {
        historyStack = [],
        loadUsersFn = loadUsers,
        saveUsersFn = saveUsers,
        rerun = () => {
            if (typeof window.runMTOS === "function") {
                window.runMTOS();
            }
        }
    } = deps;

    const safeName = String(name || "").trim();
    if (!safeName) return;

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    });

    let list = loadUsersFn();
    list = list.filter(u => u !== safeName);
    saveUsersFn(list);

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}");
    const newMemory = {};

    Object.keys(memory).forEach(key => {
        const [a, b] = key.split("->");
        if (a !== safeName && b !== safeName) {
            newMemory[key] = memory[key];
        }
    });

    localStorage.setItem("collective_relations_memory", JSON.stringify(newMemory));

    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}");
    const newLocked = {};

    Object.keys(locked).forEach(key => {
        const [a, b] = key.split("->");
        if (a !== safeName && b !== safeName) {
            newLocked[key] = locked[key];
        }
    });

    localStorage.setItem("mtos_locked_relations", JSON.stringify(newLocked));
    window._lockedCache = newLocked;

    rerun();
}

export function undo(historyStack = [], rerun = null) {
    const last = historyStack.pop();
    if (!last) return;

    localStorage.setItem("mtos_user_list", JSON.stringify(last.users));
    localStorage.setItem("collective_relations_memory", JSON.stringify(last.memory));

    if (typeof rerun === "function") {
        rerun();
        return;
    }

    if (typeof window.runMTOS === "function") {
        window.runMTOS();
    }
}

window.undoMTOS = function () {
    if (Array.isArray(window.__mtosHistoryStack)) {
        undo(window.__mtosHistoryStack, window.runMTOS);
    }
};