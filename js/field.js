export function drawFieldMap({
    id,
    mode = "structure", // "structure" | "activity"
    kinCounts = [],
    activityData = [],
    usersByKin = {},
    onKinSelect = () => {},
}) {

    const c = document.getElementById(id)
    if (!c) return

    c.innerHTML = ""

    const maxCount = Math.max(...kinCounts, 1)
    const maxActivity = Math.max(...activityData, 1)

    c.style.display = "grid"
    c.style.gridTemplateColumns = "repeat(20, 20px)"
    c.style.gap = "3px"

    for (let i = 0; i < 260; i++) {

        const kin = i + 1
        const tone = ((kin - 1) % 13) + 1
        const seal = ((kin - 1) % 20) + 1

        const users = usersByKin[kin] || []
        const count = kinCounts[i] || 0
        const activity = activityData[i] || 0

        const cell = document.createElement("div")

        cell.dataset.kin = kin

        cell.style.width = "20px"
        cell.style.height = "20px"
        cell.style.cursor = "pointer"
        cell.style.transition = "0.15s"

        // 🎨 режимы
        if (mode === "structure") {
            const v = count / maxCount
            const r = Math.floor(255 * v)
            const g = Math.floor(180 * v)
            const b = 50
            cell.style.background = `rgb(${r},${g},${b})`
        }

        if (mode === "activity") {
            const v = activity / maxActivity
            const r = Math.floor(255 * v)
            cell.style.background = `rgb(${r},0,0)`
        }

        cell.title =
            `Kin ${kin}\nTone ${tone}\nSeal ${seal}\nUsers: ${users.length}\nActivity: ${activity}`

        // 🖱 клик по клетке → подсветить людей в Network
        cell.onclick = () => {
            const userIds = users.map(u => u.id)
            onKinSelect(kin, userIds)
        }

        c.appendChild(cell)
    }
}
