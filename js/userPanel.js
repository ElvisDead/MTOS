export function renderUserPanel(data){

    const {
        dayState = {},
        decision = {},
        attractorState = {},
        snapshots = []
    } = data

    const state = dayState.dayLabel || "BALANCED"
    const mode = decision.mode || "BALANCED"

    const html = `
        <div style="
            max-width:900px;
            margin:20px auto;
            padding:20px;
            border:1px solid #333;
            border-radius:12px;
            background:#050505;
            color:#fff;
        ">
            <h2 style="margin-bottom:10px;">MTOS USER MODE</h2>

            <div style="font-size:20px;margin-bottom:10px;">
                State: <b>${state}</b>
            </div>

            <div style="font-size:18px;margin-bottom:10px;">
                Action: <b>${mode}</b>
            </div>

            <div style="font-size:14px;color:#aaa;">
                ${decision.explanation || "No explanation"}
            </div>
        </div>
    `

    document.getElementById("todayPanel").innerHTML = html
}