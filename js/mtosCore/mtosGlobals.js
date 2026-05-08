export const MTOS_GLOBALS = {
    pyodide: null,
    historyStack: [],
    fieldState: null,
    fieldMode: null,
    users: [],
    selectedAgent: null,
    selectedKin: null,
    selectionMemory: new Array(260).fill(0)
};

export function bindGlobalLog(logEventFn) {
    window.logEvent = logEventFn;
}

export function bindGlobalHistoryStack(globals = MTOS_GLOBALS) {
    window.__mtosHistoryStack = globals.historyStack;
}

export function getPyodide(globals = MTOS_GLOBALS) {
    return globals.pyodide;
}

export function setPyodide(value, globals = MTOS_GLOBALS) {
    globals.pyodide = value ?? null;
    return globals.pyodide;
}

export function getHistoryStack(globals = MTOS_GLOBALS) {
    return globals.historyStack;
}

export function setHistoryStack(value, globals = MTOS_GLOBALS) {
    globals.historyStack = Array.isArray(value) ? value : [];
    window.__mtosHistoryStack = globals.historyStack;
    return globals.historyStack;
}

export function getFieldState(globals = MTOS_GLOBALS) {
    return globals.fieldState;
}

export function setFieldState(value, globals = MTOS_GLOBALS) {
    globals.fieldState = value ?? null;
    return globals.fieldState;
}

export function getFieldMode(globals = MTOS_GLOBALS) {
    return globals.fieldMode;
}

export function setFieldMode(value, globals = MTOS_GLOBALS) {
    globals.fieldMode = value ?? null;
    return globals.fieldMode;
}

export function getUsers(globals = MTOS_GLOBALS) {
    return Array.isArray(globals.users) ? globals.users : [];
}

export function setUsers(value, globals = MTOS_GLOBALS) {
    globals.users = Array.isArray(value) ? value : [];
    return globals.users;
}

export function getSelectedAgent(globals = MTOS_GLOBALS) {
    return globals.selectedAgent ?? null;
}

export function setSelectedAgent(value, globals = MTOS_GLOBALS) {
    globals.selectedAgent = value ?? null;
    return globals.selectedAgent;
}

export function getSelectedKin(globals = MTOS_GLOBALS) {
    return globals.selectedKin ?? null;
}

export function setSelectedKin(value, globals = MTOS_GLOBALS) {
    globals.selectedKin = Number.isFinite(Number(value)) ? Number(value) : null;
    return globals.selectedKin;
}

export function getSelectionMemory(globals = MTOS_GLOBALS) {
    return Array.isArray(globals.selectionMemory)
        ? globals.selectionMemory
        : new Array(260).fill(0);
}

export function setSelectionMemory(value, globals = MTOS_GLOBALS) {
    globals.selectionMemory = Array.isArray(value)
        ? value
        : new Array(260).fill(0);
    return globals.selectionMemory;
}