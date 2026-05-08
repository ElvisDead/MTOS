import { MTOS_I18N } from "./mtosUI/mtosI18n.js";

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getLang() {
  return (window.mtosLang === "ru" || window.MTOS_LANG === "ru") ? "ru" : "en";
}

function tt(key, fallback = "") {
  const lang = getLang();
  return (
    MTOS_I18N?.[lang]?.[key] ??
    MTOS_I18N?.en?.[key] ??
    fallback ??
    key
  );
}

function getMetricsStore() {
  if (!window.__mtosDecisionMetricsStore) {
    window.__mtosDecisionMetricsStore = {
      dayKey: "",
      values: {
        money: null,
        productivity: null,
        errors: null,
        conflicts: null
      }
    };
  }
  return window.__mtosDecisionMetricsStore;
}

function getRunDayKey() {
  if (typeof window.getCurrentRunDay === "function") {
    return window.getCurrentRunDay();
  }

  const d = window._date || {};
  const y = safeNum(d.year, 0);
  const m = String(safeNum(d.month, 0)).padStart(2, "0");
  const day = String(safeNum(d.day, 0)).padStart(2, "0");

  if (!y || m === "00" || day === "00") {
    return new Date().toISOString().slice(0, 10);
  }

  return `${y}-${m}-${day}`;
}

function ensureMetricsDay() {
  const store = getMetricsStore();
  const dayKey = getRunDayKey();

  if (store.dayKey !== dayKey) {
    store.dayKey = dayKey;
    store.values = {
      money: null,
      productivity: null,
      errors: null,
      conflicts: null
    };
  }

  return store;
}

function metricLabel(key) {
  if (key === "money") return tt("money", "MONEY");
  if (key === "productivity") return tt("productivity", "PRODUCTIVITY");
  if (key === "errors") return tt("errors", "ERRORS");
  if (key === "conflicts") return tt("conflicts", "CONFLICTS");
  return key;
}

function metricHint(key) {
  if (key === "money") return tt("metricHintMoney", "any number, e.g. -250 / 1200");
  if (key === "productivity") return tt("metricHintProductivity", "0 ... 100 (%)");
  if (key === "errors") return tt("metricHintErrors", "any number >= 0");
  if (key === "conflicts") return tt("metricHintConflicts", "any number >= 0");
  return "";
}

function metricMin(key) {
  if (key === "productivity") return 0;
  if (key === "errors") return 0;
  if (key === "conflicts") return 0;
  return "";
}

function metricMax(key) {
  if (key === "productivity") return 100;
  return "";
}

function metricStep(key) {
  if (key === "productivity") return 1;
  if (key === "errors") return 1;
  if (key === "conflicts") return 1;
  return "any";
}

function normalizeMetricValue(key, raw) {
  let n = safeNum(raw, 0);

  if (key === "money") {
    return Number(n.toFixed(2));
  }

  if (key === "productivity") {
    n = clamp(n, 0, 100);
    return Number(n.toFixed(2));
  }

  if (key === "errors" || key === "conflicts") {
    n = Math.max(0, n);
    return Number(n.toFixed(2));
  }

  return Number(n.toFixed(2));
}

function metricToScore(key, value) {
  const n = safeNum(value, 0);

  if (key === "money") {
    const scale = 1000;
    return clamp((n + scale) / (2 * scale), 0, 1);
  }

  if (key === "productivity") {
    return clamp(n / 100, 0, 1);
  }

  if (key === "errors") {
    return clamp(1 - n / 20, 0, 1);
  }

  if (key === "conflicts") {
    return clamp(1 - n / 10, 0, 1);
  }

  return 0.5;
}

function recomputeDecisionMetricsSummary() {
  const store = ensureMetricsDay();
  const values = store.values || {};

  const active = Object.entries(values).filter(([, v]) => v !== null && v !== undefined && v !== "");
  const count = active.length;

  if (!count) {
    return {
      count: 0,
      score: null,
      items: []
    };
  }

  const items = active.map(([key, value]) => {
    const score = metricToScore(key, value);
    return {
      key,
      value,
      score
    };
  });

  const score = items.reduce((sum, x) => sum + x.score, 0) / items.length;

  return {
    count,
    score: Number(score.toFixed(3)),
    items
  };
}

function updateDecisionMetricsIntoState() {
  const summary = recomputeDecisionMetricsSummary();

  if (typeof window.updateMTOSBranch === "function") {
    window.updateMTOSBranch("decision", {
      ...(window.MTOS_STATE?.decision || {}),
      extraMetricsState: {
        summary
      }
    });
  }

  return summary;
}

if (window.MTOS_STATE?.decision?.extraMetricsState) {
  delete window.MTOS_STATE.decision.extraMetricsState.dayKey;
}

function rerenderDecisionMetricsPanel() {
  const root = document.getElementById("mtosDecisionMetricsPanel");
  if (!root) return;

  root.innerHTML = renderSystemDecisionMetrics(
    window.MTOS_STATE?.decision || window.mtosDecision || {}
  );
}

window.setDecisionMetricValue = function (key) {
  const input = document.getElementById(`decisionMetricInput_${key}`);
  if (!input) return;

  const store = ensureMetricsDay();
  const value = normalizeMetricValue(key, input.value);

  input.value = String(value);
  store.values[key] = value;

  updateDecisionMetricsIntoState();
  rerenderDecisionMetricsPanel();
};

window.clearDecisionMetricValue = function (key) {
  const store = ensureMetricsDay();
  store.values[key] = null;

  updateDecisionMetricsIntoState();
  rerenderDecisionMetricsPanel();
};

window.clearAllDecisionMetrics = function () {
  const store = ensureMetricsDay();
  store.values = {
    money: null,
    productivity: null,
    errors: null,
    conflicts: null
  };

  updateDecisionMetricsIntoState();
  rerenderDecisionMetricsPanel();
};

function renderMetricCard(key, valueText, scoreText, emptyText, okText) {
  const store = ensureMetricsDay();
  const values = store.values || {};

  const value = values[key];
  const hasValue = value !== null && value !== undefined && value !== "";
  const score = hasValue ? metricToScore(key, value) : null;
  const min = metricMin(key);
  const max = metricMax(key);
  const step = metricStep(key);

  return `
    <div style="
      border:1px solid rgba(255,255,255,0.08);
      border-radius:16px;
      padding:14px;
      background:rgba(255,255,255,0.02);
    ">
      <div style="
        font-size:13px;
        letter-spacing:0.08em;
        text-transform:uppercase;
        color:#aab4c3;
        margin-bottom:10px;
        text-align:center;
      ">${metricLabel(key)}</div>

      <div style="
        display:flex;
        gap:10px;
        align-items:center;
        flex-wrap:wrap;
        justify-content:center;
      ">
        <input
          id="decisionMetricInput_${key}"
          type="number"
          ${min !== "" ? `min="${min}"` : ""}
          ${max !== "" ? `max="${max}"` : ""}
          step="${step}"
          value="${hasValue ? value : ""}"
          placeholder="${metricHint(key)}"
          style="
            width:200px;
            padding:10px 12px;
            border-radius:10px;
            border:1px solid rgba(255,255,255,0.10);
            background:#05070b;
            color:#e8edf5;
            outline:none;
          "
        />

        <button
          type="button"
          onclick="window.setDecisionMetricValue('${key}')"
          style="
            padding:10px 14px;
            border-radius:10px;
            border:1px solid rgba(255,255,255,0.10);
            background:#0b1220;
            color:#e8edf5;
            cursor:pointer;
          "
        >${okText}</button>

        <button
          type="button"
          onclick="window.clearDecisionMetricValue('${key}')"
          style="
            padding:10px 14px;
            border-radius:10px;
            border:1px solid rgba(255,255,255,0.10);
            background:#0b0b0b;
            color:#9aa4b2;
            cursor:pointer;
          "
        >×</button>
      </div>

      <div style="
        margin-top:10px;
        font-size:12px;
        color:#7f8a99;
        text-align:center;
      ">${metricHint(key)}</div>

      <div style="
        margin-top:8px;
        font-size:12px;
        color:${hasValue ? "#d8dee8" : "#6f7885"};
        text-align:center;
      ">
        ${hasValue ? `${valueText}: <b>${value}</b> · ${scoreText}: <b>${score.toFixed(2)}</b>` : emptyText}
      </div>
    </div>
  `;
}

export function renderSystemDecisionMetrics() {
  const summary = updateDecisionMetricsIntoState();

  const title = tt("extraMetrics", "EXTRA METRICS");
  const okText = "OK";
  const resetText = tt("resetAll", "Reset all");
  const emptyText = tt("noValue", "No value");
  const valueText = tt("valueWord", "Value");
  const scoreText = tt("normalizedWord", "Normalized");
  const summaryTitle = tt("metricsSummary", "Metrics summary");
  const activeText = tt("activeMetrics", "Active metrics");
  const totalScoreText = tt("totalScore", "Total score");
  const bottomEmpty = tt(
    "metricsBottomEmpty",
    "Enter at least one metric. It is not written to the log and lives only within the current day."
  );

  const cards = ["money", "productivity", "errors", "conflicts"]
    .map((key) => renderMetricCard(key, valueText, scoreText, emptyText, okText))
    .join("");

  const summaryHtml = summary.count
    ? `
      <div style="
        margin-top:14px;
        border:1px solid rgba(255,255,255,0.08);
        border-radius:16px;
        padding:14px;
        background:rgba(0,255,136,0.03);
      ">
        <div style="
          font-size:12px;
          letter-spacing:0.08em;
          text-transform:uppercase;
          color:#9aa4b2;
          margin-bottom:8px;
          text-align:center;
        ">${summaryTitle}</div>

        <div style="
          font-size:14px;
          color:#e8edf5;
          text-align:center;
        ">
          ${activeText}: <b>${summary.count}</b>
          &nbsp;·&nbsp;
          ${totalScoreText}: <b>${summary.score.toFixed(2)}</b>
        </div>
      </div>
    `
    : `
      <div style="
        margin-top:14px;
        border:1px solid rgba(255,255,255,0.06);
        border-radius:16px;
        padding:14px;
        color:#7f8a99;
        background:rgba(255,255,255,0.02);
        text-align:center;
      ">
        ${bottomEmpty}
      </div>
    `;

  return `
    <div style="
      border:1px solid rgba(255,255,255,0.08);
      border-radius:18px;
      padding:14px;
      background:rgba(0,0,0,0.18);
    ">
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-bottom:14px;
      ">
        <div style="
          font-size:13px;
          letter-spacing:0.10em;
          text-transform:uppercase;
          color:#aab4c3;
        ">${title}</div>

        <button
          type="button"
          onclick="window.clearAllDecisionMetrics()"
          style="
            padding:8px 12px;
            border-radius:10px;
            border:1px solid rgba(255,255,255,0.10);
            background:#0b0b0b;
            color:#9aa4b2;
            cursor:pointer;
          "
        >${resetText}</button>
      </div>

      <div style="
        display:grid;
        grid-template-columns:repeat(2, minmax(0, 1fr));
        gap:12px;
      ">
        ${cards}
      </div>

      ${summaryHtml}
    </div>
  `;
}