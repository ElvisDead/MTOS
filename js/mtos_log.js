export let MTOS_LOG = []

// ===============================
// LOAD FROM STORAGE
// ===============================
try {
    const saved = localStorage.getItem("mtos_log")

    if(saved){
        const parsed = JSON.parse(saved)

        if(Array.isArray(parsed)){
            MTOS_LOG = parsed
        }
    }
} catch(e){
    console.warn("Log load failed", e)
}

// делаем глобально доступным
window.MTOS_LOG = MTOS_LOG

export function logEvent(type, payload = {}) {

    const entry = {
        t: Date.now(),
        type,
        ...payload
    }

    MTOS_LOG.push(entry)

    // ограничение размера
    if(MTOS_LOG.length > 1000){
        MTOS_LOG.shift()
    }

    try {
        localStorage.setItem("mtos_log", JSON.stringify(MTOS_LOG))
    } catch(e) {
        console.warn("Log save failed", e)
    }

    if(window.initReplay){
        window.initReplay()
    }

    // обновление UI
    if(window._logListener){
        window._logListener(entry, MTOS_LOG)
    }
    
}

// доступ снаружи
window.MTOS_LOG = MTOS_LOG
