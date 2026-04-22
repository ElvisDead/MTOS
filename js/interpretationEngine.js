// js/interpretationEngine.js

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function norm(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function pickLang(lang, ru, en) {
  return String(lang || "en").toLowerCase().startsWith("ru") ? ru : en;
}

function safeNum(v, fallback = 0) {
  return Number.isFinite(Number(v)) ? Number(v) : fallback;
}

function safeStr(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function joinList(items, lang = "en") {
  const arr = (Array.isArray(items) ? items : []).filter(Boolean);
  if (!arr.length) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) {
    return String(lang).startsWith("ru")
      ? `${arr[0]} и ${arr[1]}`
      : `${arr[0]} and ${arr[1]}`;
  }
  const last = arr[arr.length - 1];
  const head = arr.slice(0, -1).join(", ");
  return String(lang).startsWith("ru")
    ? `${head} и ${last}`
    : `${head}, and ${last}`;
}

function getBand(value, bands) {
  for (const band of bands) {
    if (value <= band.max) return band.key;
  }
  return bands[bands.length - 1].key;
}

function localizeMode(mode, lang = "en") {
  const m = String(mode || "").toUpperCase();
  const ruMap = {
    FOCUS: "Фокус",
    ADJUST: "Коррекция",
    REST: "Восстановление",
    EXPLORE: "Исследование",
    INTERACT: "Контакт",
    HOLD: "Удержание",
    WAIT: "Пауза",
    BUILD: "Сборка"
  };
  const enMap = {
    FOCUS: "Focus",
    ADJUST: "Adjust",
    REST: "Rest",
    EXPLORE: "Explore",
    INTERACT: "Interact",
    HOLD: "Hold",
    WAIT: "Wait",
    BUILD: "Build"
  };
  return String(lang).startsWith("ru") ? (ruMap[m] || m) : (enMap[m] || m);
}

function localizeRisk(risk, lang = "en") {
  const r = String(risk || "").toUpperCase();
  const ruMap = {
    LOW: "Низкий",
    MEDIUM: "Средний",
    HIGH: "Высокий"
  };
  const enMap = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High"
  };
  return String(lang).startsWith("ru") ? (ruMap[r] || r) : (enMap[r] || r);
}

function localizeAttractor(attractor, lang = "en") {
  const a = String(attractor || "").toLowerCase();
  const ruMap = {
    stable: "Устойчивый",
    meta: "Метаустойчивый",
    chaotic: "Хаотический",
    oscillating: "Колебательный",
    transitional: "Переходный",
    compressive: "Сжимающий",
    expansive: "Расширяющий",
    neutral: "Нейтральный"
  };
  const enMap = {
    stable: "Stable",
    meta: "Metastable",
    chaotic: "Chaotic",
    oscillating: "Oscillating",
    transitional: "Transitional",
    compressive: "Compressive",
    expansive: "Expansive",
    neutral: "Neutral"
  };
  return String(lang).startsWith("ru") ? (ruMap[a] || attractor || "Нейтральный") : (enMap[a] || attractor || "Neutral");
}

function detectTrajectory(metrics) {
  const deltaPredictability = safeNum(metrics.deltaPredictability, 0);
  const deltaEntropy = safeNum(metrics.deltaEntropy, 0);
  const deltaPressure = safeNum(metrics.deltaPressure, 0);
  const deltaActivity = safeNum(metrics.deltaActivity, 0);

  const stabilizationScore =
    (deltaPredictability > 0 ? 1 : 0) +
    (deltaEntropy < 0 ? 1 : 0) +
    (deltaPressure < 0 ? 1 : 0);

  const overloadScore =
    (deltaPressure > 0 ? 1 : 0) +
    (deltaEntropy > 0 ? 1 : 0) +
    (deltaActivity > 0 ? 1 : 0);

  const expansionScore =
    (deltaActivity > 0 ? 1 : 0) +
    (deltaPredictability > 0 ? 1 : 0) +
    (deltaPressure <= 0 ? 1 : 0);

  if (stabilizationScore >= 2) return "stabilizing";
  if (overloadScore >= 2) return "overloading";
  if (expansionScore >= 2) return "opening";
  if (deltaEntropy > 0 && deltaPredictability < 0) return "unstable";
  if (deltaActivity < 0 && deltaPressure < 0) return "recovering";
  return "reconfiguring";
}

function classifyState(metrics) {
  const pressure = clamp(safeNum(metrics.pressure, 0), 0, 100);
  const attention = clamp(safeNum(metrics.attention, 0), 0, 100);
  const activity = clamp(safeNum(metrics.activity, 0), 0, 100);
  const entropy = clamp(safeNum(metrics.entropy, 0), 0, 1);
  const predictability = clamp(safeNum(metrics.predictability, 0), 0, 260);
  const timePressure = clamp(safeNum(metrics.timePressure, 0), 0, 100);
  const noise = clamp(safeNum(metrics.noise, 0), 0, 1);
  const relationTension = clamp(safeNum(metrics.relationTension, 0), 0, 100);
  const mode = String(metrics.mode || "").toUpperCase();
  const risk = String(metrics.risk || "").toUpperCase();
  const attractor = String(metrics.attractorType || "").toLowerCase();

  const p = norm(pressure, 0, 100);
  const a = norm(attention, 0, 100);
  const act = norm(activity, 0, 100);
  const e = norm(entropy, 0, 1);
  const pr = norm(predictability, 0, 260);
  const tp = norm(timePressure, 0, 100);
  const n = norm(noise, 0, 1);
  const rt = norm(relationTension, 0, 100);

  const compression = p * 0.35 + tp * 0.25 + rt * 0.15 + (1 - pr) * 0.15 + e * 0.10;
  const overheating = p * 0.25 + act * 0.25 + tp * 0.20 + e * 0.15 + n * 0.15;
  const recovery = (1 - p) * 0.20 + (1 - act) * 0.20 + pr * 0.25 + (1 - e) * 0.20 + (mode === "REST" ? 0.15 : 0);
  const contactWindow = a * 0.20 + pr * 0.25 + (1 - rt) * 0.20 + (1 - e) * 0.15 + (mode === "INTERACT" ? 0.20 : 0);
  const transition = e * 0.30 + n * 0.20 + (1 - pr) * 0.20 + ((attractor === "transitional" || attractor === "oscillating") ? 0.20 : 0) + 0.10 * tp;
  const focusFlow = a * 0.30 + pr * 0.25 + (1 - e) * 0.20 + (1 - n) * 0.10 + (mode === "FOCUS" ? 0.15 : 0);
  const exploration = act * 0.25 + a * 0.20 + (1 - tp) * 0.10 + (mode === "EXPLORE" ? 0.20 : 0) + ((attractor === "expansive") ? 0.25 : 0);

  const scores = {
    compression,
    overheating,
    recovery,
    contactWindow,
    transition,
    focusFlow,
    exploration
  };

  const sorted = Object.entries(scores).sort((x, y) => y[1] - x[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][0];
  const intensity = clamp(sorted[0][1], 0, 1);

  const stateStrength = getBand(intensity, [
    { max: 0.38, key: "weak" },
    { max: 0.62, key: "moderate" },
    { max: 1.0, key: "strong" }
  ]);

  return {
    primary,
    secondary,
    intensity,
    stateStrength,
    trajectory: detectTrajectory(metrics),
    scores,
    raw: {
      pressure,
      attention,
      activity,
      entropy,
      predictability,
      timePressure,
      noise,
      relationTension,
      mode,
      risk,
      attractor
    }
  };
}

function getStateTexts(state, metrics, lang = "en") {
  const modeText = localizeMode(metrics.mode, lang);
  const riskText = localizeRisk(metrics.risk, lang);
  const attractorText = localizeAttractor(metrics.attractorType, lang);

  const dict = {
    ru: {
      compression: {
        title: "Фаза сжатия",
        summary: "Система сужает поле действий и отсекает лишнее.",
        meaning: "Это не слабость, а режим перераспределения ресурса. Внешнее давление ощущается сильнее обычного, поэтому любые лишние шаги обходятся дороже.",
        doList: [
          "сокращать шум и количество задач",
          "закрывать хвосты и незавершённые мелочи",
          "оставлять только важные контакты"
        ],
        avoidList: [
          "начинать несколько новых дел сразу",
          "реагировать импульсивно",
          "доказывать свою силу через перегруз"
        ]
      },
      overheating: {
        title: "Перегрев",
        summary: "Система активна, но цена ошибки растёт.",
        meaning: "Темп высокий, давление нарастает, и любая поспешность усиливает внутреннее трение. Здесь важно не ускоряться автоматически, а дозировать усилие.",
        doList: [
          "снижать темп рывков",
          "делить задачи на короткие циклы",
          "проверять решения перед отправкой или действием"
        ],
        avoidList: [
          "конфликтовать на эмоциях",
          "принимать резкие решения на пике напряжения",
          "смешивать много обязательств в один день"
        ]
      },
      recovery: {
        title: "Фаза восстановления",
        summary: "Система возвращает устойчивость через снижение нагрузки.",
        meaning: "Сейчас важнее не прорыв, а аккуратный возврат к ресурсу. Хорошее состояние для тишины, сна, порядка и медленного восстановления формы.",
        doList: [
          "уменьшать входящий шум",
          "делать только базовые обязательные шаги",
          "давать телу и вниманию паузу"
        ],
        avoidList: [
          "насильно повышать продуктивность",
          "входить в лишние социальные сцены",
          "требовать от себя максимума"
        ]
      },
      contactWindow: {
        title: "Окно для контакта",
        summary: "Есть пространство для общения без лишнего трения.",
        meaning: "Состояние допускает встречу, разговор, обратную связь или мягкую координацию. Контакт лучше работает там, где нет давления и игры в превосходство.",
        doList: [
          "говорить коротко и по существу",
          "прояснять ожидания заранее",
          "использовать день для точного диалога"
        ],
        avoidList: [
          "перегружать общение подтекстами",
          "лезть в тяжёлые разборы без нужды",
          "требовать моментальной отдачи"
        ]
      },
      transition: {
        title: "Нестабильный переход",
        summary: "Система меняет режим, но новая форма ещё не закрепилась.",
        meaning: "Это промежуточное состояние. Старый способ действия уже не держит, а новый ещё не собран. В такие дни особенно важно не путать движение с хаосом.",
        doList: [
          "наблюдать, что реально работает",
          "фиксировать сигналы и повторы",
          "делать малые проверочные действия"
        ],
        avoidList: [
          "принимать окончательные решения слишком рано",
          "ломать всё сразу",
          "считать временный шум окончательной истиной"
        ]
      },
      focusFlow: {
        title: "Устойчивый фокус",
        summary: "Система способна держать линию без лишней утечки внимания.",
        meaning: "Это хороший режим для точной работы, завершения важных задач и удержания курса. Главное — не распыляться и не превращать ясность в жёсткость.",
        doList: [
          "делать одну главную задачу",
          "защищать внимание от отвлечений",
          "использовать ясность для завершения сложного"
        ],
        avoidList: [
          "переключаться каждые пять минут",
          "заполнять день второстепенным",
          "ломать ритм лишними контактами"
        ]
      },
      exploration: {
        title: "Фаза исследования",
        summary: "Система готова к расширению, проверке идей и выходу за рамки привычного.",
        meaning: "Подходит для новых связей, тестов, поиска форм и движения в сторону роста. Но исследование полезно только там, где остаётся опора на наблюдение.",
        doList: [
          "пробовать новое малыми шагами",
          "проверять гипотезы на практике",
          "собирать материал и сигналы"
        ],
        avoidList: [
          "путать новизну с ценностью",
          "расползаться в десять направлений сразу",
          "терять критерий качества"
        ]
      },
      trajectories: {
        stabilizing: "Система движется к стабилизации.",
        overloading: "Система движется к перегрузке.",
        opening: "Система движется к раскрытию и расширению.",
        unstable: "Система остаётся нестабильной и требует наблюдения.",
        recovering: "Система постепенно возвращает ресурс.",
        reconfiguring: "Система находится в фазе пересборки."
      },
      strengths: {
        weak: "Слабое выражение состояния",
        moderate: "Умеренное выражение состояния",
        strong: "Сильное выражение состояния"
      },
      bridge: (modeTextArg, riskTextArg, attractorTextArg) =>
        `Рекомендованный режим: ${modeTextArg}. Риск: ${riskTextArg}. Тип аттрактора: ${attractorTextArg}.`
    },
    en: {
      compression: {
        title: "Compression Phase",
        summary: "The system narrows its action field and cuts away excess.",
        meaning: "This is not weakness. It is a resource redistribution mode. External pressure feels heavier than usual, so every unnecessary step becomes more expensive.",
        doList: [
          "reduce noise and task count",
          "close loose ends",
          "keep only essential contacts"
        ],
        avoidList: [
          "starting many new things at once",
          "reacting impulsively",
          "proving strength through overload"
        ]
      },
      overheating: {
        title: "Overheating",
        summary: "The system is active, but the cost of error is rising.",
        meaning: "The pace is high, pressure is building, and haste increases internal friction. Do not accelerate automatically. Dose your effort.",
        doList: [
          "slow down sharp bursts",
          "split work into short cycles",
          "double-check decisions before acting"
        ],
        avoidList: [
          "emotion-driven conflict",
          "big decisions at peak tension",
          "stacking too many obligations in one day"
        ]
      },
      recovery: {
        title: "Recovery Phase",
        summary: "The system restores stability by reducing load.",
        meaning: "This is better for careful return to resource than for breakthrough. Good for quiet, sleep, order, and gradual restoration.",
        doList: [
          "reduce incoming noise",
          "do only the necessary basics",
          "give body and attention real pause"
        ],
        avoidList: [
          "forcing productivity",
          "entering unnecessary social scenes",
          "demanding maximum output from yourself"
        ]
      },
      contactWindow: {
        title: "Contact Window",
        summary: "There is room for communication without extra friction.",
        meaning: "The state allows meeting, feedback, or soft coordination. Contact works better where there is no pressure or dominance game.",
        doList: [
          "speak briefly and clearly",
          "clarify expectations early",
          "use the day for precise dialogue"
        ],
        avoidList: [
          "overloading communication with subtext",
          "starting heavy confrontations without need",
          "demanding instant return"
        ]
      },
      transition: {
        title: "Unstable Transition",
        summary: "The system is changing mode, but the new form is not stable yet.",
        meaning: "This is an in-between state. The old way no longer holds, and the new one is not assembled yet. Do not confuse movement with chaos.",
        doList: [
          "observe what truly works",
          "track signals and repeats",
          "make small test actions"
        ],
        avoidList: [
          "locking final decisions too early",
          "breaking everything at once",
          "treating temporary noise as final truth"
        ]
      },
      focusFlow: {
        title: "Stable Focus",
        summary: "The system can hold a line without major attention leakage.",
        meaning: "Good for precise work, important completions, and staying on course. The main risk is scattering.",
        doList: [
          "do one main task",
          "protect attention from distractions",
          "use clarity to finish what matters"
        ],
        avoidList: [
          "switching every few minutes",
          "filling the day with secondary tasks",
          "breaking rhythm with unnecessary contact"
        ]
      },
      exploration: {
        title: "Exploration Phase",
        summary: "The system is ready for expansion, testing, and reaching beyond the habitual.",
        meaning: "Good for new links, experiments, and movement toward growth. Exploration matters only when grounded in observation.",
        doList: [
          "try new things in small steps",
          "test hypotheses in practice",
          "collect signals and material"
        ],
        avoidList: [
          "confusing novelty with value",
          "spreading into too many directions",
          "losing quality criteria"
        ]
      },
      trajectories: {
        stabilizing: "The system is moving toward stabilization.",
        overloading: "The system is moving toward overload.",
        opening: "The system is moving toward expansion.",
        unstable: "The system remains unstable and needs observation.",
        recovering: "The system is gradually restoring resource.",
        reconfiguring: "The system is in reconfiguration."
      },
      strengths: {
        weak: "Weak expression of state",
        moderate: "Moderate expression of state",
        strong: "Strong expression of state"
      },
      bridge: (modeTextArg, riskTextArg, attractorTextArg) =>
        `Recommended mode: ${modeTextArg}. Risk: ${riskTextArg}. Attractor type: ${attractorTextArg}.`
    }
  };

  const D = String(lang).startsWith("ru") ? dict.ru : dict.en;
  const S = D[state.primary] || D.transition;

  return {
    title: S.title,
    summary: S.summary,
    meaning: S.meaning,
    doList: S.doList.slice(),
    avoidList: S.avoidList.slice(),
    trajectoryText: D.trajectories[state.trajectory] || "",
    strengthText: D.strengths[state.stateStrength] || "",
    bridgeText: D.bridge(modeText, riskText, attractorText)
  };
}

export function interpretMTOSState(input = {}, lang = "en") {
  const metrics = {
    pressure: safeNum(input.pressure ?? input.systemPressure ?? input.P, 0),
    attention: safeNum(input.attention ?? input.focus ?? input.V, 0),
    activity: safeNum(input.activity ?? input.temperature ?? input.T, 0),
    entropy: safeNum(input.entropy, 0),
    predictability: safeNum(input.predictability, 0),
    timePressure: safeNum(input.timePressure, 0),
    noise: safeNum(input.noise, 0),
    relationTension: safeNum(input.relationTension ?? input.tension, 0),
    mode: safeStr(input.mode ?? input.recommendedMode, "ADJUST"),
    risk: safeStr(input.risk ?? input.riskLevel, "MEDIUM"),
    attractorType: safeStr(input.attractorType ?? input.attractor, "neutral"),
    deltaPredictability: safeNum(input.deltaPredictability, 0),
    deltaEntropy: safeNum(input.deltaEntropy, 0),
    deltaPressure: safeNum(input.deltaPressure, 0),
    deltaActivity: safeNum(input.deltaActivity, 0)
  };

  const state = classifyState(metrics);
  const texts = getStateTexts(state, metrics, lang);

  return {
    stateKey: state.primary,
    secondaryStateKey: state.secondary,
    intensity: Number(state.intensity.toFixed(3)),
    stateStrength: state.stateStrength,
    trajectory: state.trajectory,

    title: texts.title,
    summary: texts.summary,
    meaning: texts.meaning,
    doList: texts.doList,
    avoidList: texts.avoidList,
    trajectoryText: texts.trajectoryText,
    strengthText: texts.strengthText,
    bridgeText: texts.bridgeText,

    lite: {
      state: texts.title,
      summary: texts.summary,
      meaning: texts.meaning,
      do: texts.doList.slice(0, 3),
      avoid: texts.avoidList.slice(0, 3),
      direction: texts.trajectoryText
    },

    diagnostic: {
      scores: state.scores,
      metrics
    }
  };
}

export function renderInterpretationPanel(data, lang = "en") {
  if (!data) return "";

  const tState = pickLang(lang, "Состояние", "State");
  const tMeaning = pickLang(lang, "Смысл", "Meaning");
  const tDo = pickLang(lang, "Что делать", "What to do");
  const tAvoid = pickLang(lang, "Чего избегать", "Avoid");
  const tDirection = pickLang(lang, "Направление", "Direction");
  const tBridge = pickLang(lang, "Мост с движком", "Engine Bridge");

  const doHtml = (data.doList || []).map(x => `<li>${x}</li>`).join("");
  const avoidHtml = (data.avoidList || []).map(x => `<li>${x}</li>`).join("");

  return `
    <div class="mtos-interpretation-panel">
      <div class="mtos-int-card">
        <div class="mtos-int-label">${tState}</div>
        <div class="mtos-int-title">${data.title}</div>
        <div class="mtos-int-summary">${data.summary}</div>
      </div>

      <div class="mtos-int-grid">
        <div class="mtos-int-card">
          <div class="mtos-int-label">${tDo}</div>
          <ul class="mtos-int-list">${doHtml}</ul>
        </div>

        <div class="mtos-int-card">
          <div class="mtos-int-label">${tAvoid}</div>
          <ul class="mtos-int-list">${avoidHtml}</ul>
        </div>
      </div>

      <div class="mtos-int-card">
        <div class="mtos-int-label">${tDirection}</div>
        <div class="mtos-int-text">${data.trajectoryText}</div>
      </div>
    </div>
  `;
}

export function renderLiteInterpretationPanel(data, lang = "en") {
  if (!data || !data.lite) return "";

  const tState = pickLang(lang, "Состояние", "State");
  const tMeaning = pickLang(lang, "Смысл", "Meaning");
  const tDo = pickLang(lang, "Что делать", "What to do");
  const tAvoid = pickLang(lang, "Чего избегать", "Avoid");
  const tDirection = pickLang(lang, "Направление", "Direction");

  const doHtml = (data.lite.do || [])
    .map(x => `<div class="mtos-card-sub">${x}</div>`)
    .join("");

  const avoidHtml = (data.lite.avoid || [])
    .map(x => `<div class="mtos-card-sub">${x}</div>`)
    .join("");

  return `
    <div class="mtos-lite-interpretation">
      <div class="mtos-lite-block">
        <div class="mtos-top-cards">
          <div class="mtos-card">
            <div class="mtos-card-label">${tState}</div>
            <div class="mtos-card-value">${data.lite.state}</div>
            <div class="mtos-card-sub">${data.lite.summary}</div>
          </div>

          <div class="mtos-card">
            <div class="mtos-card-label">${tMeaning}</div>
            <div class="mtos-card-sub">${data.lite.meaning}</div>
          </div>

          <div class="mtos-card">
            <div class="mtos-card-label">${tDo}</div>
            ${doHtml}
          </div>

          <div class="mtos-card">
            <div class="mtos-card-label">${tAvoid}</div>
            ${avoidHtml}
            <div class="mtos-card-label" style="margin-top:10px;">${tDirection}</div>
            <div class="mtos-card-sub">${data.lite.direction}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}