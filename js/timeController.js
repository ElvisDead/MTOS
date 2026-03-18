let timer = null
let currentDay = 0

export function initTimeControls(runStep){

    const box = document.getElementById("timeControls")
    if(!box) return

    box.innerHTML = ""

    const play = document.createElement("button")
    play.innerText = "▶"

    const pause = document.createElement("button")
    pause.innerText = "⏸"

    const next = document.createElement("button")
    next.innerText = "→"

    const prev = document.createElement("button")
    prev.innerText = "←"

    play.onclick = () => {
        if(timer) return
        timer = setInterval(()=>{
            currentDay++
            runStep(currentDay)
        }, 500)
    }

    pause.onclick = () => {
        clearInterval(timer)
        timer = null
    }

    next.onclick = () => {
        currentDay++
        runStep(currentDay)
    }

    prev.onclick = () => {
        currentDay--
        runStep(currentDay)
    }

    box.appendChild(prev)
    box.appendChild(play)
    box.appendChild(pause)
    box.appendChild(next)
}
