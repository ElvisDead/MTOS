import { renderSystemDecisionMetrics } from "./systemDecisionMetrics.js";

export function renderDecisionMetrics() {
    const root = document.getElementById("mtosDecisionMetricsPanel")
    if (!root) return

    const decision = window.MTOS_STATE?.decision || window.mtosDecision
    if (!decision) return

    root.innerHTML = renderSystemDecisionMetrics(decision)
}