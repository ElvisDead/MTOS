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

function sanitizePayload(payload) {
    if (!payload || typeof payload !== "object") return {}

    const clean = {}

    const blocked = [
    "name",
    "birth",
    "birthdate",
    "birthday",
    "dateofbirth",
    "dob"
]

    for (const key in payload) {
        const lower = key.toLowerCase()

        if (blocked.some(b => lower.includes(b))) continue

        if (typeof payload[key] === "object") continue

        if (lower === "user" && typeof window.getStableAnonId === "function") {
            clean["user_id"] = window.getStableAnonId(payload[key])
            continue
        }

        clean[key] = payload[key]
    }

    return clean
}

export function logEvent(type, payload = {}) {

    const safePayload = sanitizePayload(payload)

    const entry = {
        t: Date.now(),
        type,
        ...safePayload
    }

    MTOS_LOG.push(entry)

    while(JSON.stringify(MTOS_LOG).length > 2000000){
        MTOS_LOG.shift()
    }

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

const FORECAST_KEY = "mtos_forecasts"
const FORECAST_RESULTS_KEY = "mtos_forecast_results"

export function loadForecasts(){
    try{
        const raw = localStorage.getItem(FORECAST_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
    }catch(e){
        console.warn("Forecast load failed", e)
        return []
    }
}

export function saveForecasts(list){
    try{
        localStorage.setItem(FORECAST_KEY, JSON.stringify(list))
    }catch(e){
        console.warn("Forecast save failed", e)
    }
}

export function loadForecastResults(){
    try{
        const raw = localStorage.getItem(FORECAST_RESULTS_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
    }catch(e){
        console.warn("Forecast results load failed", e)
        return []
    }
}

export function saveForecastResults(list){
    try{
        localStorage.setItem(FORECAST_RESULTS_KEY, JSON.stringify(list))
    }catch(e){
        console.warn("Forecast results save failed", e)
    }
}

export function addForecast(forecast){
    const list = loadForecasts()
    list.push(forecast)

    while(JSON.stringify(list).length > 1000000){
        list.shift()
    }

    saveForecasts(list)
}

export function resolveForecasts(getActualForForecast){
    const forecasts = loadForecasts()
    const results = loadForecastResults()

    const now = Date.now()
    const pending = []

    for(const f of forecasts){
        if(!f || !f.targetTime){
            continue
        }

        if(f.targetTime > now){
            pending.push(f)
            continue
        }

        try{
            const actual = getActualForForecast(f)
            if(!actual) {
                pending.push(f)
                continue
            }

            const predictedAttention = Number(f.predictedAttention)
            const actualAttention = Number(actual.actualAttention)

            const absError = Math.abs(predictedAttention - actualAttention)

            const predictedState = String(f.predictedState || "")
            const actualState = String(actual.actualState || "")
            const stateMatch = predictedState === actualState

            const row = {
                id: f.id,
                createdAt: f.createdAt,
                targetTime: f.targetTime,
                horizonDays: f.horizonDays,
                user: f.user,
                baseKin: f.baseKin,
                predictedAttention,
                actualAttention,
                absError,
                predictedState,
                actualState,
                stateMatch,
                resolvedAt: now
            }

            results.push(row)
            logEvent("forecast_resolved", row)
        }catch(e){
            console.warn("Forecast resolve failed", e)
            pending.push(f)
        }
    }

    while(results.length > 1000){
        results.shift()
    }

    saveForecasts(pending)
    saveForecastResults(results)

    return {
        pending,
        results
    }
}

export function getForecastStats(){
    const results = loadForecastResults()

    if(!results.length){
        return {
            total: 0,
            mae: 0,
            stateAccuracy: 0,
            byHorizon: {}
        }
    }

    const mae =
        results.reduce((sum, r) => sum + Number(r.absError || 0), 0) / results.length

    const stateAccuracy =
        results.filter(r => r.stateMatch).length / results.length

    const byHorizon = {}

    for(const r of results){
        const h = String(r.horizonDays)
        if(!byHorizon[h]){
            byHorizon[h] = {
                total: 0,
                errorSum: 0,
                stateHits: 0
            }
        }

        byHorizon[h].total += 1
        byHorizon[h].errorSum += Number(r.absError || 0)
        if(r.stateMatch) byHorizon[h].stateHits += 1
    }

    Object.keys(byHorizon).forEach(h => {
        const x = byHorizon[h]
        x.mae = x.total ? x.errorSum / x.total : 0
        x.stateAccuracy = x.total ? x.stateHits / x.total : 0
    })

    return {
        total: results.length,
        mae,
        stateAccuracy,
        byHorizon
    }
}

export function logDailyState(state){

    const entry = {
        t: Date.now(),
        type: "daily_state",

        day: new Date().toISOString().slice(0,10),

        userKin: state.userKin,
        dayKin: state.dayKin,

        recommendedMode: state.mode,

        attention: state.attention,
        entropy: state.entropy,
        predictability: state.predictability,
        noise: state.noise,
        lyapunov: state.lyapunov,

        attractorType: state.attractorType,
        attractorIntensity: state.attractorIntensity,

        networkDensity: state.networkDensity,
        systemTemperature: state.systemTemperature
    }

    MTOS_LOG.push(entry)

    if(MTOS_LOG.length > 1000){
        MTOS_LOG.shift()
    }

    localStorage.setItem("mtos_log", JSON.stringify(MTOS_LOG))
}

const DAILY_SNAPSHOT_KEY = "mtos_daily_snapshots"

export function loadDailySnapshots(){
    try{
        const raw = localStorage.getItem(DAILY_SNAPSHOT_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
    }catch(e){
        console.warn("Daily snapshots load failed", e)
        return []
    }
}

export function saveDailySnapshots(list){
    try{
        localStorage.setItem(DAILY_SNAPSHOT_KEY, JSON.stringify(list))
    }catch(e){
        console.warn("Daily snapshots save failed", e)
    }
}

export function alreadyLoggedDailySnapshot(day, name, userKin){
    const list = loadDailySnapshots()

    const userId =
        typeof window.getStableAnonId === "function"
            ? window.getStableAnonId(name)
            : String(name || "").trim()

    return list.some(row =>
        row &&
        row.day === day &&
        row.user_id === userId &&
        Number(row.userKin) === Number(userKin)
    )
}

export function logDailySnapshot(snapshot){
    const list = loadDailySnapshots()

    list.push(snapshot)

    while(list.length > 400){
        list.shift()
    }

    saveDailySnapshots(list)

    // опционально: чтобы и в общий event-log тоже попало
    logEvent("daily_snapshot", snapshot)

    return snapshot
}