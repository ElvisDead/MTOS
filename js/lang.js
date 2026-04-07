window.MTOS_LANG = "en"

window.MTOS_TRANSLATIONS = {
    en: {
        network: "NETWORK",

        edit: "Edit",
        link: "Link",
        contact: "Contact",

        all: "All",
        support: "Support",
        weak_support: "Weak Support",
        neutral: "Neutral",
        tension: "Tension",
        conflict: "Conflict",
        strong_conflict: "Strong Conflict",

        interaction_map: "INTERACTION MAP",

        nodes_desc: "Nodes = participants.",
        colors_desc: "Colors match Collective.",
        zoom_desc: "Wheel / pinch = zoom, drag = move.",
        inspect_desc: "Tap / click node = inspect.",
        edit_desc: "Edit = remove node or relation.",
        link_desc: "Link = tap first node, then second node to connect.",
        contact_desc: "Contact = mark two nodes as today's real contact.",

        relation: "Relation",
        type: "Type",
        base_ab: "Base score A→B",
        base_ba: "Base score B→A",
        feedback: "Feedback scalar",
        final: "Final score",
        final_pair: "Final pair score",
        pressure: "Local pressure",
        urgency: "Local urgency",
        temporal: "Temporal mode",
        band: "Band",
        today_contact: "Today's real contact",
        field: "Field influence",
        phi: "Local Φ",
        k: "Local k",
        consistency: "Consistency",
        yes: "YES",

        mode_explore: "Explore",
        mode_focus: "Focus",
        mode_flow: "Flow",
        mode_drift: "Drift",
        mode_rest: "Rest",
        mode_interact: "Interact",

        band_explore: "Explore",
        band_flow: "Flow",
        band_active_contact: "Active Contact",
        band_soft_pull: "Soft Pull",
        band_drift: "Drift",
        band_focus: "Focus",
        band_lock_in: "Lock-In",
        band_surge: "Surge",
        band_override: "Override",
        band_break_risk: "Break Risk",
        band_conflict_spike: "Conflict Spike",
        band_tense_focus: "Tense Focus",
        band_friction: "Friction",
        band_light_contact: "Light Contact",

        name: "Name",
year: "Year",
month: "Month",
day: "Day",
start_btn: "START",

history_efficiency: "HISTORY EFFICIENCY",

days: "DAYS",
good: "GOOD",
bad: "BAD",
hit_rate: "HIT RATE",
anti_fail: "ANTI-FAIL",
avg_predictability: "AVG PREDICTABILITY",

mode_efficiency: "MODE EFFICIENCY",
daytype_efficiency: "DAY TYPE EFFICIENCY",

last_days: "LAST DAYS",
no_feedback: "NO FEEDBACK",
unknown: "UNKNOWN",

avg_time_pressure: "AVERAGE TIME PRESSURE",

focus: "FOCUS",
explore: "EXPLORE",
flow: "FLOW",
predictability: "predictability",
pressure_word: "pressure",
    },

    ru: {
        network: "СЕТЬ",

        edit: "Редактировать",
        link: "Связать",
        contact: "Контакт",

        all: "Все",
        support: "Поддержка",
        weak_support: "Слабая поддержка",
        neutral: "Нейтрально",
        tension: "Напряжение",
        conflict: "Конфликт",
        strong_conflict: "Сильный конфликт",

        interaction_map: "КАРТА ВЗАИМОДЕЙСТВИЙ",

        nodes_desc: "Узлы = участники.",
        colors_desc: "Цвета соответствуют Collective.",
        zoom_desc: "Колесо / pinch = масштаб, drag = перемещение.",
        inspect_desc: "Клик по узлу = просмотр.",
        edit_desc: "Редактирование = удалить узел или связь.",
        link_desc: "Связать = выбрать два узла.",
        contact_desc: "Контакт = отметить реальный контакт за сегодня.",

        relation: "Связь",
        type: "Тип",
        base_ab: "Базовый A→B",
        base_ba: "Базовый B→A",
        feedback: "Обратная связь",
        final: "Итог",
        final_pair: "Итог пары",
        pressure: "Давление",
        urgency: "Срочность",
        temporal: "Режим",
        band: "Зона",
        today_contact: "Контакт сегодня",
        field: "Поле",
        phi: "Локальное Φ",
        k: "Локальное k",
        consistency: "Согласованность",
        yes: "ДА",

        mode_explore: "Исследование",
        mode_focus: "Фокус",
        mode_flow: "Поток",
        mode_drift: "Дрейф",
        mode_rest: "Отдых",
        mode_interact: "Контакт",

        band_explore: "Исследование",
        band_flow: "Поток",
        band_active_contact: "Активный контакт",
        band_soft_pull: "Слабое притяжение",
        band_drift: "Дрейф",
        band_focus: "Фокус",
        band_lock_in: "Фиксация",
        band_surge: "Импульс",
        band_override: "Перегрузка",
        band_break_risk: "Риск разрыва",
        band_conflict_spike: "Всплеск конфликта",
        band_tense_focus: "Напряжённый фокус",
        band_friction: "Трение",
        band_light_contact: "Лёгкий контакт",

        name: "Имя",
year: "Год",
month: "Месяц",
day: "День",
start_btn: "СТАРТ",

history_efficiency: "ЭФФЕКТИВНОСТЬ ИСТОРИИ",

days: "ДНЕЙ",
good: "ХОРОШО",
bad: "ПЛОХО",
hit_rate: "ТОЧНОСТЬ",
anti_fail: "АНТИ-ПРОВАЛ",
avg_predictability: "СРЕДНЯЯ ПРЕДСКАЗУЕМОСТЬ",

mode_efficiency: "ЭФФЕКТИВНОСТЬ РЕЖИМОВ",
daytype_efficiency: "ЭФФЕКТИВНОСТЬ ТИПОВ ДНЯ",

last_days: "ПОСЛЕДНИЕ ДНИ",
no_feedback: "НЕТ ОБРАТНОЙ СВЯЗИ",
unknown: "НЕИЗВЕСТНО",

avg_time_pressure: "СРЕДНЕЕ ДАВЛЕНИЕ ВРЕМЕНИ",

focus: "ФОКУС",
explore: "ИССЛЕДОВАНИЕ",
flow: "ПОТОК",
predictability: "предсказуемость",
pressure_word: "давление",
    }
}

window.setMTOSLang = function(lang){
    window.MTOS_LANG = lang === "ru" ? "ru" : "en"
}

window.t = function(key){
    return (
        window.MTOS_TRANSLATIONS?.[window.MTOS_LANG]?.[key] ??
        window.MTOS_TRANSLATIONS?.en?.[key] ??
        key
    )
}