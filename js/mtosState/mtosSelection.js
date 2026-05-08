export const MTOS_SELECTED_TARGET_KEY = "mtos_selected_target_v1";

export function getSelectedDecisionTarget(storageKey = MTOS_SELECTED_TARGET_KEY) {
    try {
        return localStorage.getItem(storageKey) || "";
    } catch (e) {
        return "";
    }
}

export function setSelectedDecisionTarget(name, storageKey = MTOS_SELECTED_TARGET_KEY) {
    try {
        const safeName = String(name || "").trim();

        if (!safeName) {
            localStorage.removeItem(storageKey);
            return "";
        }

        localStorage.setItem(storageKey, safeName);
        return safeName;
    } catch (e) {
        return "";
    }
}