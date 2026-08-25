const test = require("node:test");
const assert = require("node:assert/strict");

const {buildTypewriterMarkup, initHeroTypewriter} = require("../scripts/hero-typewriter.js");

test("buildTypewriterMarkup wraps each character in a timed span", () => {
    const markup = buildTypewriterMarkup("ab", 60);

    assert.equal(
        markup,
        '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:0ms">a</span>' +
        '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:60ms">b</span>'
    );
});

test("buildTypewriterMarkup preserves the space in the single-line hero phrase", () => {
    const markup = buildTypewriterMarkup("Wedding Invitation", 60);

    assert.match(markup, /<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:420ms"> <\/span>/);
    assert.doesNotMatch(markup, /<br>/);
});

test("buildTypewriterMarkup escapes HTML-sensitive characters", () => {
    const markup = buildTypewriterMarkup('<&">', 10);

    assert.equal(
        markup,
        '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:0ms">&lt;</span>' +
        '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:10ms">&amp;</span>' +
        '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:20ms">&quot;</span>' +
        '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:30ms">&gt;</span>'
    );
});

test("buildTypewriterMarkup accumulates delay per character across multi-byte text", () => {
    const markup = buildTypewriterMarkup("가나", 60);

    assert.equal(
        markup,
        '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:0ms">가</span>' +
        '<span class="hero-eyebrow-char" aria-hidden="true" style="animation-delay:60ms">나</span>'
    );
});

test("initHeroTypewriter does nothing when document is unavailable", () => {
    assert.doesNotThrow(() => initHeroTypewriter({selector: ".hero-eyebrow", stepMs: 60}));
});

test("hero-typewriter exports both functions", () => {
    assert.equal(typeof buildTypewriterMarkup, "function");
    assert.equal(typeof initHeroTypewriter, "function");
});
