import { drawWeatherMap } from "../weatherMap.js";
import { drawSeries } from "../series260.js";
import { drawNetwork } from "../network.js";
import { drawCollective } from "../collective.js";
import { renderDecisionSummaryPanel } from "../decisionSummaryPanel.js";
import { renderHumanLayerV2 } from "../humanLayer.js";

export function renderMTOSInterpretation(ds, deps = {}) {
    const {
        getTodayBlock = () => document.getElementById("todayBlock"),
        getLang = () => window.mtosLang || window.MTOS_LANG || "en",
        getDecision = () => window.mtosDecision || {}
    } = deps;

    const todayBlock = getTodayBlock();
    if (!todayBlock || !ds) return;

    const lang = getLang();
    const mode = String(getDecision()?.mode || "EXPLORE").toUpperCase();
    const isRu = lang === "ru";

    const packs = {
        FOCUS: {
            ru: {
                state: "Фаза фокуса",
                lead: "Система собрана в одно рабочее направление.",
                meaning: "Сейчас лучшее решение — удерживать одну линию внимания и не распыляться.",
                todo: [
                    "закрывать одну главную задачу",
                    "работать короткими целевыми циклами",
                    "сохранять узкий канал внимания"
                ],
                avoid: [
                    "параллельные новые ветки",
                    "хаотичные переключения",
                    "лишнюю социальную нагрузку"
                ],
                direction: "Система движется к усилению концентрации."
            },
            en: {
                state: "Focus Phase",
                lead: "The system is gathered into one working direction.",
                meaning: "The best move now is to hold one line of attention and avoid scattering.",
                todo: [
                    "close one main task",
                    "work in short focused cycles",
                    "keep attention narrow"
                ],
                avoid: [
                    "parallel new branches",
                    "chaotic switching",
                    "extra social load"
                ],
                direction: "The system is moving toward concentration."
            }
        },
        ADJUST: {
            ru: {
                state: "Фаза коррекции",
                lead: "Система требует коррекции курса, а не жёсткого нажима.",
                meaning: "Сейчас важнее слегка перенастроить движение, чем пытаться продавить результат любой ценой.",
                todo: [
                    "внести одну небольшую коррекцию",
                    "оставлять следующий шаг обратимым",
                    "уточнять решения до фиксации"
                ],
                avoid: [
                    "жёсткую фиксацию",
                    "поспешные окончательные выводы",
                    "перегрузку лишними обязательствами"
                ],
                direction: "Система движется к более точной настройке."
            },
            en: {
                state: "Adjustment Phase",
                lead: "The system needs course correction, not rigid force.",
                meaning: "It is better to retune the movement slightly than to force an outcome at any cost.",
                todo: [
                    "make one small correction",
                    "keep the next step reversible",
                    "clarify decisions before locking them"
                ],
                avoid: [
                    "rigid fixation",
                    "premature final conclusions",
                    "overloading with extra commitments"
                ],
                direction: "The system is moving toward better calibration."
            }
        },
        REST: {
            ru: {
                state: "Фаза восстановления",
                lead: "Система возвращает устойчивость через снижение нагрузки.",
                meaning: "Сейчас важнее не прорыв, а аккуратный возврат к ресурсу: тишине, сну, паузе и базовым шагам.",
                todo: [
                    "уменьшать входящий шум",
                    "делать только базовые обязательные шаги",
                    "давать телу и вниманию паузу"
                ],
                avoid: [
                    "насильно повышать продуктивность",
                    "входить в лишние социальные сцены",
                    "требовать от себя максимума"
                ],
                direction: "Система движется к стабилизации."
            },
            en: {
                state: "Recovery Phase",
                lead: "The system restores stability by reducing load.",
                meaning: "A breakthrough is less important now than a careful return to resource: silence, sleep, pause, and basic steps.",
                todo: [
                    "reduce incoming noise",
                    "do only the basic necessary steps",
                    "give the body and attention a pause"
                ],
                avoid: [
                    "forcing productivity",
                    "entering unnecessary social scenes",
                    "demanding maximum from yourself"
                ],
                direction: "The system is moving toward stabilization."
            }
        },
        INTERACT: {
            ru: {
                state: "Окно для контакта",
                lead: "Есть пространство для общения без лишнего трения.",
                meaning: "Состояние допускает разговор, координацию или мягкую обратную связь, если держать контакт чистым и коротким.",
                todo: [
                    "говорить коротко и по существу",
                    "прояснять ожидания заранее",
                    "использовать день для точного диалога"
                ],
                avoid: [
                    "перегружать общение подтекстами",
                    "лезть в тяжёлые разборы без нужды",
                    "требовать моментальной отдачи"
                ],
                direction: "Система движется к координации."
            },
            en: {
                state: "Contact Window",
                lead: "There is room for communication without excess friction.",
                meaning: "The state allows conversation, coordination, or soft feedback if the contact stays clean and brief.",
                todo: [
                    "speak briefly and to the point",
                    "clarify expectations in advance",
                    "use the day for precise dialogue"
                ],
                avoid: [
                    "overloading communication with subtext",
                    "entering heavy confrontations unnecessarily",
                    "demanding instant response"
                ],
                direction: "The system is moving toward coordination."
            }
        },
        EXPLORE: {
            ru: {
                state: "Окно для исследования",
                lead: "Поле допускает мягкое движение и проверку нового.",
                meaning: "Сейчас полезнее собирать сигналы и пробовать малые шаги, чем пытаться сразу всё определить.",
                todo: [
                    "пробовать новое малыми шагами",
                    "собирать сигналы без спешки",
                    "оставлять пространство для разворота"
                ],
                avoid: [
                    "жёсткую фиксацию маршрута",
                    "слишком много параллельных проб",
                    "форсирование определённости"
                ],
                direction: "Система движется к расширению вариантов."
            },
            en: {
                state: "Exploration Window",
                lead: "The field allows soft movement and testing the new.",
                meaning: "It is more useful now to gather signals and make small attempts than to define everything immediately.",
                todo: [
                    "try new things in small steps",
                    "gather signals without hurry",
                    "leave room to turn"
                ],
                avoid: [
                    "rigid route fixation",
                    "too many parallel experiments",
                    "forcing certainty"
                ],
                direction: "The system is moving toward option expansion."
            }
        }
    };

    const pack = packs[mode]?.[isRu ? "ru" : "en"] || packs.EXPLORE[isRu ? "ru" : "en"];

    todayBlock.innerHTML = `
        <div style="
            max-width: 1100px;
            margin: 0 auto 18px auto;
            padding: 18px 20px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(5,10,24,0.96) 0%, rgba(3,7,18,0.98) 100%);
            box-shadow: inset 0 0 0 1px rgba(0,255,136,0.03);
        ">
            <div style="
                display:grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                gap: 28px;
                color:#dbe3ea;
            ">
                <div>
                    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9aa4b2;margin-bottom:18px;">
                        ${isRu ? "СОСТОЯНИЕ" : "STATE"}
                    </div>
                    <div style="font-size:22px;font-weight:800;line-height:1.05;color:#00ff88;margin-bottom:18px;">
                        ${pack.state}
                    </div>
                    <div style="font-size:15px;line-height:1.65;color:#cfd8e3;">
                        ${pack.lead}
                    </div>
                </div>

                <div>
                    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9aa4b2;margin-bottom:18px;">
                        ${isRu ? "СМЫСЛ" : "MEANING"}
                    </div>
                    <div style="font-size:15px;line-height:1.65;color:#cfd8e3;">
                        ${pack.meaning}
                    </div>
                </div>

                <div>
                    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9aa4b2;margin-bottom:18px;">
                        ${isRu ? "ЧТО ДЕЛАТЬ" : "WHAT TO DO"}
                    </div>
                    <div style="font-size:15px;line-height:1.8;color:#cfd8e3;">
                        ${pack.todo.join("<br>")}
                    </div>
                </div>

                <div>
                    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9aa4b2;margin-bottom:18px;">
                        ${isRu ? "ЧЕГО ИЗБЕГАТЬ" : "WHAT TO AVOID"}
                    </div>
                    <div style="font-size:15px;line-height:1.8;color:#cfd8e3;margin-bottom:10px;">
                        ${pack.avoid.join("<br>")}
                    </div>
                    <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9aa4b2;margin-top:12px;">
                        ${isRu ? "НАПРАВЛЕНИЕ" : "DIRECTION"}
                    </div>
                    <div style="font-size:15px;line-height:1.65;color:#cfd8e3;">
                        ${pack.direction}
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderCognitiveState(
    userKin,
    todayKin,
    attention,
    noise,
    entropy,
    lyapunov,
    prediction,
    predictability,
    sync,
    ds,
    deps = {}
){
    const {
        getTodayBlock = () => document.getElementById("todayBlock"),
        getQuickMetrics = () => document.getElementById("quickMetrics"),
        renderHumanLayer = null,
        renderHumanLayerV2Fn = renderHumanLayerV2,
        renderMTOSInterpretationFn = renderMTOSInterpretation,
        getCurrentUserName = () => "",
        getCurrentRunDay = () => "",
        getDecision = () => window.mtosDecision || {},
        getRunAttractorState = () => window.mtosRunAttractorState || window.mtosAttractorState || {},
        getTimePressureSummary = () => window.mtosTimePressureSummary || {},
        getForecastStats = () => window.mtosForecastStats || {},
        getSnapshots = () => JSON.parse(localStorage.getItem("mtos_daily_snapshots") || "[]"),
        getFeedback = () => null,
        getMetabolic = () => window.mtosMetabolicMetrics || {},
        renderDecisionSummaryPanelFn = renderDecisionSummaryPanel
    } = deps;

    const el = getTodayBlock();
    const quick = getQuickMetrics();

    if (!el) return;

    if (!ds) {
        el.innerHTML = "";
        if (quick) quick.innerHTML = "";
        if (typeof renderHumanLayer === "function") {
            renderHumanLayer(null);
        }
        return;
    }

    el.innerHTML = "";
    if (quick) quick.innerHTML = "";

    renderHumanLayerV2Fn(ds, {
        name: getCurrentUserName(),
        day: getCurrentRunDay(),
        decision: getDecision(),
        attractorState: getRunAttractorState(),
        timePressureSummary: getTimePressureSummary(),
        forecastStats: getForecastStats(),
        snapshots: getSnapshots(),
        feedback: getFeedback(),
        metabolic: getMetabolic()
    });

    renderMTOSInterpretationFn(ds, {
        getTodayBlock,
        getLang: () => window.mtosLang || window.MTOS_LANG || "en",
        getDecision
    });

    renderDecisionSummaryPanelFn("humanLayer");
}

export function renderAll(weather, weatherToday, pressure, userKin, todayKin, year, month, day, deps = {}) {
    const {
        getFieldState = () => null,
        getSelectedAgent = () => null,
        getAttractorField = () => window._attractorField,
        getUsers = () => [],
        getMatrix = () => window._matrix || null,
        renderAttractorOnly = () => {},
        renderHistoryEfficiencyPanel = null
    } = deps;

    drawWeatherMap(
        "weatherMap",
        weather,
        userKin,
        todayKin,
        pressure,
        getFieldState(),
        getSelectedAgent(),
        getAttractorField()
    );

    const now = new Date();
    drawSeries(
        "seriesBlock",
        weatherToday,
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
    );

    drawNetwork("networkMap", getUsers(), () => {}, getMatrix());
    drawCollective("collective", getUsers());

    if (typeof renderAttractorOnly === "function") {
        renderAttractorOnly();
    }

    if (typeof renderHistoryEfficiencyPanel === "function") {
        renderHistoryEfficiencyPanel("historyEfficiencyPanel");
    }
}