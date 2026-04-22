export function drawSeries(id, weather, year, month, day){

    const root = document.getElementById(id)
    if(!root) return

    root.innerHTML = ""

    const startDate = new Date(year, month - 1, day)
    startDate.setHours(0, 0, 0, 0)

    function formatDate(d){
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short"
        })
    }

        function st(key){
    const lang = window.mtosLang === "ru" ? "ru" : "en"

    const local = {
        en: {
            seriesLegend: `These charts represent temporal dynamics inside the 260-state cognitive cycle.

• 7 days — short-term attention dynamics
• 30 days — medium-range behavioral drift
• 260 days — full-cycle attention structure

• Φ series — metabolic intensity / integrated cognitive load
• T series — processing temperature / activation intensity
• Consistency series — internal coherence of the current regime

All charts are displayed on a fixed 0..1 scale for visual comparison.`,

            series7days: "7 days",
            series30days: "30 days",
            series260days: "260 days",
            seriesPhi: "Φ series",
            seriesT: "T series",
            seriesConsistency: "Consistency series"
        },
        ru: {
            seriesLegend: `Эти графики показывают временную динамику внутри 260-состояний когнитивного цикла.

• 7 дней — краткосрочная динамика внимания
• 30 дней — среднесрочный поведенческий дрейф
• 260 дней — полная структура цикла внимания

• Φ серия — метаболическая интенсивность / интегральная когнитивная нагрузка
• T серия — температура обработки / интенсивность активации
• Серия согласованности — внутренняя целостность текущего режима

Все графики отображаются в фиксированном диапазоне 0..1 для наглядного сравнения.`,

            series7days: "7 дней",
            series30days: "30 дней",
            series260days: "260 дней",
            seriesPhi: "Φ серия",
            seriesT: "T серия",
            seriesConsistency: "Серия согласованности"
        }
    }

    if (local[lang] && local[lang][key]) return local[lang][key]

    if (typeof window.t === "function") {
        const translated = window.t(key)
        if (translated && translated !== key) return translated
    }

    return key
}

    function drawBlock(length, title){

        const wrap = document.createElement("div")
        wrap.style.marginBottom = "30px"
        wrap.style.textAlign = "center"

        const label = document.createElement("div")
        label.innerText = title
        label.style.marginBottom = "5px"
        label.style.color = "white"

        const canvas = document.createElement("canvas")
        const width = 500
        const height = 160

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")

        const padLeft = 50
        const padBottom = 30
        const padTop = 10
        const padRight = 10

        const innerW = width - padLeft - padRight
        const innerH = height - padTop - padBottom

let data = weather.slice(0, length).map(w => {
    const attention = Number(w?.attention ?? 0.5)
    const activity = Number(w?.activity ?? attention)
    const pressure = Number(w?.pressure ?? 0)
    const conflict = Number(w?.conflict ?? 0)

    const composite =
        attention * 0.42 +
        activity * 0.28 +
        (1 - pressure) * 0.18 +
        (1 - conflict) * 0.12

    return Math.max(0, Math.min(1, composite))
})

if ((title === "Φ series" || title === "Φ серия") && Array.isArray(window.mtosMetabolicMetrics?.phiSeries)) {
    data = window.mtosMetabolicMetrics.phiSeries.slice(0, length)
}

if ((title === "T series" || title === "T серия") && Array.isArray(window.mtosMetabolicMetrics?.temperatureSeries)) {
    data = window.mtosMetabolicMetrics.temperatureSeries.slice(0, length)
}

if (
    (title === "Consistency series" || title === "Серия согласованности") &&
    Array.isArray(window.mtosMetabolicMetrics?.consistencySeries)
) {
    data = window.mtosMetabolicMetrics.consistencySeries.slice(0, length)
}

if (!Array.isArray(data) || !data.length) {
    data = new Array(length).fill(0)
}

data = data.map(v => {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
})

const axisMin = 0
const axisMax = 1
const axisRange = 1

const localMin = Math.min(...data)
const localMax = Math.max(...data)
const localRangeRaw = localMax - localMin

const localRange = localRangeRaw < 0.0001 ? 0.0001 : localRangeRaw

const visualPad = Math.max(0.02, localRange * 0.35)

const visualMin = Math.max(axisMin, localMin - visualPad)
const visualMax = Math.min(axisMax, localMax + visualPad)
const visualRange = Math.max(0.0001, visualMax - visualMin)

const norm = data.map(v => (v - visualMin) / visualRange)

        // ===== Y GRID =====
        ctx.strokeStyle = "#333"
        ctx.fillStyle = "#aaa"
        ctx.font = "10px Arial"

        for(let i=0;i<=4;i++){
    const v = i / 4
    const y = padTop + innerH - v * innerH

    ctx.beginPath()
    ctx.moveTo(padLeft, y)
    ctx.lineTo(width - padRight, y)
    ctx.stroke()

    const val = (visualMin + v * visualRange).toFixed(2)
    ctx.fillText(val, 5, y + 3)
}

        // ===== X GRID + DATES =====
        const steps = Math.min(length, 6)

        for(let i=0;i<steps;i++){

            const idx = Math.floor(i * (length-1) / (steps-1))
            const x = padLeft + (idx/(length-1)) * innerW

            const d = new Date(startDate)
            d.setDate(d.getDate() + idx)

            ctx.beginPath()
            ctx.moveTo(x, padTop)
            ctx.lineTo(x, padTop + innerH)
            ctx.strokeStyle = "#222"
            ctx.stroke()

            ctx.fillStyle = "#aaa"
            ctx.fillText(formatDate(d), x-18, height - 5)
        }

        // ===== LINE =====
        ctx.beginPath()

        for(let i=0;i<norm.length;i++){

            const x = padLeft + (i/(norm.length-1)) * innerW
            const y = padTop + innerH - norm[i] * innerH

            if(i===0) ctx.moveTo(x,y)
            else ctx.lineTo(x,y)
        }

        ctx.strokeStyle = "cyan"
        ctx.lineWidth = 2
        ctx.stroke()

        // ===== HOVER =====
        canvas.onmousemove = (e)=>{
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left

            const i = Math.floor(((x - padLeft)/innerW) * data.length)

            if(i >= 0 && i < data.length){

                const d = new Date(startDate)
                d.setDate(d.getDate() + i)

                canvas.title =
                    "Date: " + formatDate(d) +
                    "\nValue: " + data[i].toFixed(3)
            }
        }

        wrap.appendChild(label)
        wrap.appendChild(canvas)

        return wrap
    }

    root.appendChild(drawBlock(7, st("series7days")))
root.appendChild(drawBlock(30, st("series30days")))
root.appendChild(drawBlock(260, st("series260days")))
root.appendChild(drawBlock(30, st("seriesPhi")))
root.appendChild(drawBlock(30, st("seriesT")))
root.appendChild(drawBlock(30, st("seriesConsistency")))

    // ===============================
    // DESCRIPTION (ENGLISH)
    // ===============================
    const desc = document.createElement("div")
desc.style.color = "#aaa"
desc.style.fontSize = "12px"
desc.style.marginTop = "10px"
desc.style.maxWidth = "600px"
desc.style.marginInline = "auto"
desc.style.lineHeight = "1.4"
desc.style.whiteSpace = "pre-line"

desc.innerText = st("seriesLegend")

    root.appendChild(desc)
}
