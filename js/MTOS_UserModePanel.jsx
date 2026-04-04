import React, { useMemo } from "react";

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeText(v, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s || fallback;
}

function getSimpleState(dayState = {}, attractorState = {}) {
  const label = String(dayState?.dayLabel || "NEUTRAL").toUpperCase();
  const pressure = safeNum(dayState?.pressure, 0);
  const conflict = safeNum(dayState?.conflict, 0);
  const stability = safeNum(dayState?.stability, 0.5);
  const attention = safeNum(dayState?.attention, 0.5);
  const attractorType = String(attractorState?.type || "unknown").toLowerCase();

  if (label === "RECOVERY") return "RECOVERY";
  if (label === "FATIGUE") return "HEAVY";
  if (attractorType === "chaos" || conflict >= 0.52 || pressure >= 0.7) return "CHAOTIC";
  if (label === "FOCUS" || (attention >= 0.7 && stability >= 0.6)) return "FOCUSED";
  if (label === "FLOW") return "LIGHT";
  return "BALANCED";
}

function getStateColor(state) {
  if (state === "FOCUSED") return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
  if (state === "LIGHT") return "text-sky-300 border-sky-500/40 bg-sky-500/10";
  if (state === "HEAVY") return "text-amber-300 border-amber-500/40 bg-amber-500/10";
  if (state === "CHAOTIC") return "text-red-300 border-red-500/40 bg-red-500/10";
  if (state === "RECOVERY") return "text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10";
  return "text-zinc-200 border-zinc-500/40 bg-zinc-500/10";
}

function getTraffic(dayState = {}, decision = {}, scientific = {}) {
  const pressure = safeNum(dayState?.pressure, 0);
  const conflict = safeNum(dayState?.conflict, 0);
  const stability = safeNum(dayState?.stability, 0.5);
  const confidence = safeNum(decision?.confidence, 0.5);
  const model = safeNum(scientific?.value, 0.5);

  const risk = pressure * 0.4 + conflict * 0.35 + (1 - stability) * 0.25;
  const trust = confidence * 0.55 + model * 0.45;

  if (risk >= 0.68) {
    return {
      label: "RED",
      subtitle: trust >= 0.55 ? "Avoid big decisions now" : "System is unstable and low-confidence",
      dot: "bg-red-400",
      text: "text-red-300"
    };
  }

  if (risk >= 0.38) {
    return {
      label: "YELLOW",
      subtitle: trust >= 0.55 ? "Proceed carefully" : "Moderate risk, medium trust",
      dot: "bg-amber-400",
      text: "text-amber-300"
    };
  }

  return {
    label: "GREEN",
    subtitle: trust >= 0.55 ? "Good execution window" : "State is okay, but trust is modest",
    dot: "bg-emerald-400",
    text: "text-emerald-300"
  };
}

function getTrust(decision = {}, scientific = {}, forecastStats = {}) {
  const confidence = safeNum(decision?.confidence, 0.5);
  const model = safeNum(scientific?.value, 0.5);
  const resolved = safeNum(forecastStats?.resolved, 0);
  const correct = safeNum(forecastStats?.correct, 0);
  const hitRate = resolved > 0 ? correct / resolved : 0.5;

  const total = confidence * 0.4 + model * 0.35 + hitRate * 0.25;

  if (total >= 0.72) return { label: "HIGH", value: total };
  if (total >= 0.48) return { label: "MEDIUM", value: total };
  return { label: "LOW", value: total };
}

function getWhyTags(dayState = {}, attractorState = {}, timePressureSummary = {}) {
  const tags = [];

  const attention = safeNum(dayState?.attention, 0.5);
  const pressure = safeNum(dayState?.pressure, 0);
  const conflict = safeNum(dayState?.conflict, 0);
  const stability = safeNum(dayState?.stability, 0.5);
  const attractorType = safeText(attractorState?.type, "unknown").toLowerCase();
  const timePressure = safeNum(timePressureSummary?.value, 0);

  if (attention >= 0.68) tags.push("strong attention");
  else if (attention <= 0.4) tags.push("scattered attention");

  if (pressure >= 0.62) tags.push("high pressure");
  if (conflict >= 0.42) tags.push("visible conflict");
  if (stability >= 0.62) tags.push("good stability");
  else if (stability <= 0.42) tags.push("weak stability");

  if (attractorType !== "unknown") tags.push(`attractor: ${attractorType}`);
  if (timePressure >= 0.62) tags.push("high time pressure");

  if (!tags.length) tags.push("moderate balanced state");
  return tags;
}

function getPlainAction(mode) {
  const m = String(mode || "").toUpperCase();
  if (m === "FOCUS") {
    return {
      now: "Do one core task and finish it.",
      avoid: "Avoid multitasking and avoid noisy communication."
    };
  }
  if (m === "REST") {
    return {
      now: "Reduce load and recover the system.",
      avoid: "Avoid forcing output or hard decisions."
    };
  }
  if (m === "EXPLORE") {
    return {
      now: "Research, test, and keep options open.",
      avoid: "Avoid locking into one rigid plan too early."
    };
  }
  if (m === "INTERACT") {
    return {
      now: "Use the day for alignment and communication.",
      avoid: "Avoid isolation if tension needs resolving."
    };
  }
  return {
    now: "Work in a moderate, balanced way.",
    avoid: "Avoid overreacting to weak signals."
  };
}

function getDeltaText(today = {}, yesterday = null) {
  if (!yesterday) return "No previous snapshot yet.";

  const pNow = safeNum(today?.pressure, 0);
  const pPrev = safeNum(yesterday?.pressure, 0);
  const sNow = safeNum(today?.stability, 0.5);
  const sPrev = safeNum(yesterday?.stability, 0.5);
  const aNow = safeNum(today?.attention, 0.5);
  const aPrev = safeNum(yesterday?.attention, 0.5);

  const parts = [];

  if (aNow > aPrev + 0.04) parts.push("more focused than yesterday");
  else if (aNow < aPrev - 0.04) parts.push("less focused than yesterday");

  if (pNow > pPrev + 0.04) parts.push("more pressure than yesterday");
  else if (pNow < pPrev - 0.04) parts.push("less pressure than yesterday");

  if (sNow > sPrev + 0.04) parts.push("more stable than yesterday");
  else if (sNow < sPrev - 0.04) parts.push("less stable than yesterday");

  if (!parts.length) return "Very close to yesterday.";
  return parts.join(" · ");
}

function MetricBar({ label, value, tone = "default" }) {
  const width = `${Math.round(clamp01(value) * 100)}%`;
  const fillClass =
    tone === "pressure"
      ? "from-zinc-700 to-amber-400"
      : tone === "stability"
        ? "from-zinc-700 to-sky-400"
        : "from-zinc-700 to-emerald-400";

  return (
    <div className="grid grid-cols-[90px_1fr_52px] items-center gap-3">
      <div className="text-sm text-zinc-300">{label}</div>
      <div className="h-2.5 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
        <div className={`h-full rounded-full bg-gradient-to-r ${fillClass}`} style={{ width }} />
      </div>
      <div className="text-right text-xs text-zinc-400">{safeNum(value, 0).toFixed(2)}</div>
    </div>
  );
}

function SnapshotList({ snapshots = [] }) {
  if (!snapshots.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-black/40 p-3 text-sm text-zinc-500">
        No previous snapshots yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {snapshots.slice(0, 7).map((row, idx) => (
        <div
          key={`${row.day || idx}_${row.name || "user"}`}
          className="grid grid-cols-[92px_1fr_auto] items-center gap-3 rounded-xl border border-zinc-800 bg-black/40 px-3 py-2"
        >
          <div className="text-xs text-zinc-400">{safeText(row.day, "?")}</div>
          <div className="text-sm text-zinc-100">{safeText(row.dayLabel, "UNKNOWN")}</div>
          <div className="text-[11px] text-zinc-500">{safeText(row.recommendedMode, "UNKNOWN")}</div>
        </div>
      ))}
    </div>
  );
}

export default function MTOSUserModePanel({
  dayState = {},
  decision = {},
  scientific = {},
  attractorState = {},
  timePressureSummary = {},
  forecastStats = {},
  snapshots = [],
  metabolic = {},
  className = ""
}) {
  const state = useMemo(() => getSimpleState(dayState, attractorState), [dayState, attractorState]);
  const stateColor = getStateColor(state);
  const traffic = useMemo(() => getTraffic(dayState, decision, scientific), [dayState, decision, scientific]);
  const trust = useMemo(() => getTrust(decision, scientific, forecastStats), [decision, scientific, forecastStats]);
  const whyTags = useMemo(() => getWhyTags(dayState, attractorState, timePressureSummary), [dayState, attractorState, timePressureSummary]);
  const action = useMemo(() => getPlainAction(decision?.mode), [decision]);
  const yesterday = snapshots?.[1] || null;
  const deltaText = useMemo(() => getDeltaText(dayState, yesterday), [dayState, yesterday]);

  const focus = clamp01(dayState?.attention ?? 0.5);
  const pressure = clamp01(safeNum(dayState?.pressure, 0) * 0.65 + safeNum(dayState?.conflict, 0) * 0.35);
  const stability = clamp01(dayState?.stability ?? 0.5);

  const metaPhi = safeNum(metabolic?.phi, 0);
const metaK = safeNum(metabolic?.k, 0);
const metaT = safeNum(metabolic?.T, 0);
const metaP = safeNum(metabolic?.P, 0);
const metaV = safeNum(metabolic?.V, 0);
const metaConsistency = safeNum(metabolic?.consistency, 0);

  return (
    <section className={`mx-auto w-full max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl ${className}`}>
      <div className="border-b border-zinc-800 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Just tell me</div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">MTOS User Mode</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              One screen for an ordinary user: state, action, risk, and how much to trust the advice.
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${stateColor}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
            <span>{state}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Best action now</div>
            <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {safeText(decision?.mode, "BALANCED")}
            </div>
            <div className="mt-3 text-base leading-7 text-zinc-200">{action.now}</div>
            <div className="mt-2 text-sm leading-6 text-zinc-400">
              <span className="font-medium text-zinc-300">Avoid:</span> {action.avoid}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Risk light</div>
              <div className={`mt-2 flex items-center gap-3 ${traffic.text}`}>
                <span className={`h-3.5 w-3.5 rounded-full ${traffic.dot}`} />
                <span className="text-xl font-bold">{traffic.label}</span>
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">{traffic.subtitle}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Trust level</div>
              <div className="mt-2 text-xl font-bold text-white">{trust.label}</div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                Advice confidence {trust.value.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Why</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {whyTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">3 simple indicators</div>
            <div className="mt-4 space-y-3">
              <MetricBar label="FOCUS" value={focus} />
              <MetricBar label="PRESSURE" value={pressure} tone="pressure" />
              <MetricBar label="STABILITY" value={stability} tone="stability" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Compared to yesterday</div>
            <div className="mt-3 text-sm leading-6 text-zinc-300">{deltaText}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
  <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Metabolic core</div>
  <div className="mt-3 space-y-2 text-sm text-zinc-200">
    <div>P: {metaP.toFixed(3)}</div>
    <div>V: {metaV.toFixed(3)}</div>
    <div>T: {metaT.toFixed(3)}</div>
    <div>Φ: {metaPhi.toFixed(3)}</div>
    <div>k: {metaK.toFixed(3)}</div>
    <div>consistency: {metaConsistency.toFixed(4)}</div>
  </div>
</div>

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Last 7 days</div>
            <div className="mt-3">
              <SnapshotList snapshots={snapshots} />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">One-line answer</div>
            <div className="mt-3 text-sm leading-6 text-zinc-200">
              {safeText(decision?.mode, "BALANCED")} day. {action.now} {traffic.label === "RED" ? "Do not force major decisions." : traffic.label === "YELLOW" ? "Move carefully and keep scope narrow." : "This is a workable window."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
