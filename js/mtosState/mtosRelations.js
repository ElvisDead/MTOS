export function removeConnectionHard(a, b, deps = {}) {
    const {
        historyStack = [],
        rerun = () => {
    if (typeof window._rerenderNetworkOnly === "function") {
        window._rerenderNetworkOnly();
    }
},
        invalidateNetwork = () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        }
    } = deps;

    const left = String(a || "").trim();
    const right = String(b || "").trim();
    if (!left || !right || left === right) return;

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    });

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}");

    delete memory[left + "->" + right];
    delete memory[right + "->" + left];

    memory[left + "->" + right] = 0;
    memory[right + "->" + left] = 0;

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory));

    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}");

    locked[left + "->" + right] = true;
    locked[right + "->" + left] = true;

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked));

    window._lockedCache = null;
    invalidateNetwork();
    rerun();
}

export function removeConnection(a, b, deps = {}) {
    const {
        historyStack = [],
        rerun = () => {
    if (typeof window._rerenderNetworkOnly === "function") {
        window._rerenderNetworkOnly();
    }
},
        invalidateNetwork = () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        }
    } = deps;

    const left = String(a || "").trim();
    const right = String(b || "").trim();
    if (!left || !right || left === right) return;

    historyStack.push({
        users: JSON.parse(localStorage.getItem("mtos_user_list") || "[]"),
        memory: JSON.parse(localStorage.getItem("collective_relations_memory") || "{}")
    });

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}");

    delete memory[left + "->" + right];
    delete memory[right + "->" + left];

    memory[left + "->" + right] = 0;
    memory[right + "->" + left] = 0;

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory));

    window._lockedCache = null;
    invalidateNetwork();
    rerun();
}

export function addConnection(a, b, value = 1, deps = {}) {
    const {
        rerun = () => {
    if (typeof window._rerenderNetworkOnly === "function") {
        window._rerenderNetworkOnly();
    }
},
        invalidateNetwork = () => {
            if (typeof window._networkInvalidate === "function") {
                window._networkInvalidate();
            }
        }
    } = deps;

    const left = String(a || "").trim();
    const right = String(b || "").trim();
    if (!left || !right || left === right) return;

    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 1;

    const memory = JSON.parse(localStorage.getItem("collective_relations_memory") || "{}");
    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}");

    if (locked[left + "->" + right] || locked[right + "->" + left]) {
        console.log("BLOCKED:", left, right);
        return;
    }

    memory[left + "->" + right] = safeValue;
    memory[right + "->" + left] = safeValue;

    localStorage.setItem("collective_relations_memory", JSON.stringify(memory));

    delete locked[left + "->" + right];
    delete locked[right + "->" + left];

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked));

    window._lockedCache = null;

if (typeof window.rebuildNetworkRelations === "function") {
    window.rebuildNetworkRelations();
}

invalidateNetwork();
rerun();
}

export function lockConnection(a, b) {
    const left = String(a || "").trim();
    const right = String(b || "").trim();
    if (!left || !right || left === right) return;

    const locked = JSON.parse(localStorage.getItem("mtos_locked_relations") || "{}");

    locked[left + "->" + right] = true;
    locked[right + "->" + left] = true;

    localStorage.setItem("mtos_locked_relations", JSON.stringify(locked));
}