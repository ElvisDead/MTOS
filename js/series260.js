export function drawSeries260(id, data){

    const c = document.getElementById(id)
    if(!c) return

    c.innerHTML = ""

    // центрирование
    c.style.display = "flex"
    c.style.flexDirection = "column"
    c.style.alignItems = "center"
    c.style.gap = "2px"
    c.style.width = "100%"

    // контейнер (одна длинная линия)
    const row = document.createElement("div")

    row.style.width = "600px"
    row.style.height = "20px"
    row.style.display = "flex"
    row.style.background = "#111"
    row.style.border = "1px solid #444"
    row.style.overflow = "hidden"

    // нормализация
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    for(let i=0;i<data.length;i++){

        const v = (data[i] - min) / range

        const cell = document.createElement("div")

        cell.style.flex = "1"
        cell.style.height = "100%"

        const r = Math.floor(255 * v)
        const g = Math.floor(200 * (1 - v))
        const b = 50

        cell.style.background = `rgb(${r},${g},${b})`

        cell.title = `Day ${i+1}: ${data[i].toFixed(3)}`

        // клик как у остальных
        cell.onclick = () => {
            alert(`Day ${i+1}\nValue: ${data[i].toFixed(3)}`)
        }

        row.appendChild(cell)
    }

    c.appendChild(row)
}
