// exportExperiment.js

export function exportLog() {

    try {

        const data = window.MTOS_LOG || []

        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: "application/json" }
        )

        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url

        const date = new Date().toISOString().slice(0, 10)

        a.download = `mtos_log_${date}.json`

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)

        console.log("Log export:", data.length, "events")

        return data

    } catch (err) {

        console.error("Export error:", err)
        return null
    }
}
