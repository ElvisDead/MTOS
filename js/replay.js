import { drawNetwork } from "./network.js"
import { drawAttractor } from "./attractor.js"
import { drawCollective } from "./collective.js"
import { drawPhaseSpace } from "./phaseSpace.js"

let replayIndex = 0
let replayTimer = null

function getLog(){
    return window.MTOS_LOG || []
}

// ===============================
// APPLY STATE
// ===============================
function applyEntry(entry){

    if(entry.type === "agents_update"){
        window.currentUsers = entry.users
        window._replayField = entry.fieldState
    }

    if(entry.type === "python_result"){
        window._replayMeta = entry
    }
}

// ===============================
// RENDER
// ===============================
function renderReplay(){

    const log = getLog()
    const entry = log[replayIndex]

    if(!entry) return

    applyEntry(entry)

    const users = window.currentUsers
    const fieldState = window._replayField

    if(!users) return

    // 🔥 ПОЛНАЯ ПЕРЕРИСОВКА
    drawNetwork("networkMap", users, ()=>{})

    drawAttractor(
        "attractorMap",
        users,
        [],
        null
    )

    drawCollective("collectiveMap", users)

    if(fieldState){
        drawPhaseSpace("phaseMap", fieldState, null)
    }
}

// ===============================
// CONTROL
// ===============================
export function replayPlay(){

    if(replayTimer) return

    replayTimer = setInterval(()=>{
        replayStep(1)
    }, 300)
}

export function replayPause(){
    clearInterval(replayTimer)
    replayTimer = null
}

export function replayStep(dir){

    const log = getLog()

    replayIndex += dir

    if(replayIndex < 0) replayIndex = 0
    if(replayIndex >= log.length) replayIndex = log.length - 1

    updateSlider()
    renderReplay()
}

export function replaySeek(value){

    replayIndex = Number(value)
    renderReplay()
}

function updateSlider(){

    const slider = document.getElementById("replaySlider")
    const log = getLog()

    if(!slider) return

    slider.max = log.length - 1
    slider.value = replayIndex
}

// ===============================
// INIT
// ===============================
export function initReplay(){

    updateSlider()
}
