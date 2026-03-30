export function renderTodayPanel(containerId, decision) {

    const root = document.getElementById(containerId)
    if (!root) return

    root.innerHTML = ""

    const box = document.createElement("div")
    box.style.background = "#05070a"
    box.style.border = "1px solid #1f2937"
    box.style.padding = "20px"
    box.style.borderRadius = "12px"
    box.style.maxWidth = "420px"
    box.style.margin = "20px auto"
    box.style.fontFamily = "monospace"
    box.style.color = "#e5e7eb"

    const mode = decision.mode

    const title = document.createElement("div")
    title.innerText = "TODAY MODE"
    title.style.opacity = "0.6"

    const main = document.createElement("div")
    main.innerText = mode
    main.style.fontSize = "28px"
    main.style.margin = "10px 0"

    const conf = document.createElement("div")
    conf.innerText = "Confidence: " + decision.confidence

    const desc = document.createElement("div")
    desc.style.marginTop = "12px"

    desc.innerText = getModeText(mode)

    box.appendChild(title)
    box.appendChild(main)
    box.appendChild(conf)
    box.appendChild(desc)

    root.appendChild(box)
}

function getModeText(mode){

    if(mode === "FOCUS"){
        return "Finish important tasks. Avoid distractions."
    }

    if(mode === "EXPLORE"){
        return "Try new things. Don't lock into one path."
    }

    if(mode === "SOCIAL"){
        return "Communicate. Build connections."
    }

    if(mode === "RECOVER"){
        return "Reduce load. Don't push too hard."
    }

    return ""
}