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
        window.currentUsers = entry.sample.map(u => ({
            ...u
        }))
    }

    if(entry.type === "python_result"){
        window._replayMeta = entry
    }

    // можно расширять дальше
}

// ===============================
// RENDER
// ===============================
function renderReplay(){

    const log = getLog()
    const entry = log[replayIndex]

    if(!entry) return

    applyEntry(entry)

    // обновляем UI лог подсветкой
    const el = document.getElementById("logStream")
    if(el && el.children[replayIndex]){
        el.children[replayIndex].style.color = "#0ff"
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
