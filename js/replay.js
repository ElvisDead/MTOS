import { drawNetwork } from "./network.js"
import { drawCollective } from "./collective.js"
import { drawWeatherMap } from "./weatherMap.js"

let replayIndex = 0
let replayTimer = null
let replayBusy = false
let lastRenderedIndex = -1

function getLog(){
    return window.MTOS_LOG || []
}

function applyEntry(entry){
    if (!entry) return

    if (entry.type === "python_result") {
        window._replayMeta = entry
    }

    if (entry.type === "agents_update") {
        window.currentUsers = Array.isArray(entry.users) ? entry.users : []
        window._replayField = entry.fieldState || null
        window._replayWeather = Array.isArray(entry.weather) ? entry.weather : []
        window._replayPressure = Array.isArray(entry.pressure) ? entry.pressure : []
        window._replayUserKin = Number(entry.userKin || 0)
        window._replayTodayKin = Number(entry.todayKin || 0)
        window._attractorField = Array.isArray(entry.attractorField)
            ? entry.attractorField
            : (window._attractorField || [])
    }
}

function renderReplay(){
    const log = getLog()
    const entry = log[replayIndex]
    if (!entry) return

    if (lastRenderedIndex === replayIndex) return
    lastRenderedIndex = replayIndex

    applyEntry(entry)

    const users = Array.isArray(window.currentUsers) ? window.currentUsers : []
    const fieldState = window._replayField
    const weather = Array.isArray(window._replayWeather) ? window._replayWeather : []
    const pressure = Array.isArray(window._replayPressure) ? window._replayPressure : []
    const userKin = Number(window._replayUserKin || 0)
    const todayKin = Number(window._replayTodayKin || 0)

    if (!users.length || !weather.length) return

    // Weather — каждый кадр
    drawWeatherMap(
        "weatherMap",
        weather,
        userKin,
        todayKin,
        pressure,
        fieldState,
        null,
        window._attractorField || []
    )

    // Network/Collective — реже
    if (replayIndex % 2 === 0) {
        drawNetwork("networkMap", users, () => {}, window._matrix || null)
        drawCollective("collective", users)
    }

    updateSlider()
}

export function replayPlay(){
    const log = getLog()
    if (!log.length) return
    if (replayTimer) return

    replayBusy = false

    replayTimer = setInterval(() => {
        if (replayBusy) return
        replayBusy = true

        try {
            const logNow = getLog()
            if (!logNow.length) {
                replayPause()
                return
            }

            if (replayIndex >= logNow.length - 1) {
                replayPause()
                return
            }

            replayStep(1)
        } finally {
            replayBusy = false
        }
    }, 900)
}

export function replayPause(){
    if (replayTimer) {
        clearInterval(replayTimer)
        replayTimer = null
    }
    replayBusy = false
}

export function replayStep(dir){
    const log = getLog()
    if (!log.length) return

    replayIndex += Number(dir || 0)

    if (replayIndex < 0) replayIndex = 0
    if (replayIndex >= log.length) replayIndex = log.length - 1

    renderReplay()
}

export function replaySeek(value){
    const log = getLog()
    if (!log.length) return

    const nextIndex = Number(value)
    replayIndex = Number.isFinite(nextIndex) ? nextIndex : 0

    if (replayIndex < 0) replayIndex = 0
    if (replayIndex >= log.length) replayIndex = log.length - 1

    lastRenderedIndex = -1
    renderReplay()
}

function updateSlider(){
    const slider = document.getElementById("replaySlider")
    const log = getLog()
    if (!slider) return

    slider.max = Math.max(0, log.length - 1)
    slider.value = replayIndex
}

export function initReplay(){
    updateSlider()
}