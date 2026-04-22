// --- MTOS LANG SHIM (совместимость со старым кодом) ---

(function () {
    // --- Инициализация языка ---
    const stored = localStorage.getItem("mtos_lang_v1") === "ru" ? "ru" : "en";

    window.MTOS_LANG = window.MTOS_LANG || stored;
    window.mtosLang = window.mtosLang || window.MTOS_LANG;

    // --- Пустой fallback словарь (старый больше не главный) ---
    window.MTOS_TRANSLATIONS = window.MTOS_TRANSLATIONS || { en: {}, ru: {} };

    // --- Главный переводчик (делегирует в mtosI18n.js) ---
    window.t = function (key) {
        if (typeof window.__mtos_i18n_t === "function") {
            return window.__mtos_i18n_t(key);
        }

        return (
            window.MTOS_TRANSLATIONS?.[window.MTOS_LANG]?.[key] ??
            window.MTOS_TRANSLATIONS?.en?.[key] ??
            key
        );
    };

    // --- Смена языка ---
    window.setMTOSLang = function (lang) {
        const safeLang = lang === "ru" ? "ru" : "en";

        window.MTOS_LANG = safeLang;
        window.mtosLang = safeLang;

        try {
            localStorage.setItem("mtos_lang_v1", safeLang);
        } catch (e) {}

        // новый i18n слой
        if (typeof window.applyMTOSLang === "function") {
            window.applyMTOSLang(safeLang);
        }

        // старые статические тексты (если есть)
        if (typeof window.applyStaticTranslations === "function") {
            window.applyStaticTranslations();
        }
    };
})();