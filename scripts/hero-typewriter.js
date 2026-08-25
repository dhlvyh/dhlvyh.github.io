(function (root, factory) {
    const heroTypewriter = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = heroTypewriter;
    }

    if (root) {
        root.HeroTypewriter = heroTypewriter;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function buildTypewriterMarkup(text, stepMs) {
        return Array.from(text).map(function (char, index) {
            const delay = index * stepMs;
            return '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:' +
                delay + 'ms">' + escapeHtml(char) + "</span>";
        }).join("");
    }

    function initHeroTypewriter(config) {
        if (typeof document === "undefined" || typeof window === "undefined") {
            return;
        }

        const element = document.querySelector(config.selector);

        if (!element) {
            return;
        }

        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const text = element.textContent;
        const stepMs = config.stepMs || 60;

        // 글자를 스팬으로 쪼개면 스크린리더가 조각난 글자를 읽을 수 있어
        // 원본 문구를 aria-label로 남긴다
        element.setAttribute("aria-label", text);
        element.innerHTML = buildTypewriterMarkup(text, stepMs);
    }

    return {buildTypewriterMarkup, initHeroTypewriter};
}));
