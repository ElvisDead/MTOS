export const MTOS_LOG = []

export function logEvent(type, payload = {}) {

    const entry = {
        t: Date.now(),
        type,
        ...payload
    }

    MTOS_LOG.push(entry)

    // ограничение размера
    if(MTOS_LOG.length > 5000){
        MTOS_LOG.shift()
    }

    // обновление UI
    if(window._logListener){
        window._logListener(entry, MTOS_LOG)
    }
}

// доступ снаружи
window.MTOS_LOG = MTOS_LOG
