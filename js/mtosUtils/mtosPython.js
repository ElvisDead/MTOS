export function toPython(obj) {
    return JSON.stringify(obj)
        .replace(/true/g, "True")
        .replace(/false/g, "False")
        .replace(/null/g, "None");
}

export function runPythonJson(pyodide, code, fallback = null) {
    try {
        if (!pyodide || typeof pyodide.runPython !== "function") {
            return fallback;
        }

        const raw = pyodide.runPython(code);
        return JSON.parse(raw);
    } catch (e) {
        console.warn("runPythonJson failed", e);
        return fallback;
    }
}

export async function loadEngineCode(path = "./MTOS_Engine.py") {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`Failed to load engine code: ${path}`);
    }
    return await res.text();
}