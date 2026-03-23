import { KinRegistry } from "./kinRegistry.js"

const seals = [
  "Drg","Wnd","Ngt","Sed","Spr","WBr","Hnd","Str","Mon","Dog",
  "Mnk","Hum","Sky","Wzd","Egl","Wrr","Ert","Mir","Strm","Sun"
]

// tones 1–13 уже идут по вертикали

export function drawField(canvas, users = [], mode = "global") {
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    const cols = 20
    const rows = 13

    const cellW = W / cols
    const cellH = H / rows

    // --------------------------------------------------
    // 🔵 USERS BY KIN (ЕДИНСТВЕННАЯ СИСТЕМА)
    // --------------------------------------------------

    const usersByKin = {}

    users.forEach(u => {
        const kin = u.kin

        if (!usersByKin[kin]) {
            usersByKin[kin] = []
        }

        usersByKin[kin].push(u)
    })

    // --------------------------------------------------
    // 🔵 РИСУЕМ СЕТКУ
    // --------------------------------------------------

    for (let tone = 0; tone < rows; tone++) {
        for (let seal = 0; seal < cols; seal++) {

            const kin = KinRegistry.fromGrid(seal, tone)

            const x = seal * cellW
            const y = tone * cellH

            // фон клетки
            ctx.fillStyle = "#020617"
            ctx.fillRect(x, y, cellW, cellH)

            // рамка
            ctx.strokeStyle = "#0f172a"
            ctx.strokeRect(x, y, cellW, cellH)

            const usersHere = usersByKin[kin] || []

            // --------------------------------------------------
            // 🔶 ОТОБРАЖЕНИЕ
            // --------------------------------------------------

            if (usersHere.length > 0) {
                ctx.fillStyle = "#f59e0b"
                ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)
            }
        }
    }

    // --------------------------------------------------
    // 🔵 ПОДПИСИ СВЕРХУ (SEALS)
    // --------------------------------------------------

    ctx.fillStyle = "#94a3b8"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"

    for (let seal = 0; seal < cols; seal++) {
        const x = seal * cellW + cellW / 2
        ctx.fillText(seals[seal], x, 10)
    }

    // --------------------------------------------------
    // 🔵 ПОДПИСИ СЛЕВА (TONES)
    // --------------------------------------------------

    ctx.textAlign = "right"

    for (let tone = 0; tone < rows; tone++) {
        const y = tone * cellH + cellH / 2 + 4
        ctx.fillText((tone + 1).toString(), 18, y)
    }
}
