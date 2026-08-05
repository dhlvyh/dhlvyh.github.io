const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("index.html exposes the fullscreen viewer track mount", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /id="gallery-track"/);
    assert.match(html, /id="gallery-viewer"/);
    assert.match(html, /id="gallery-viewer-track"/);
    assert.match(html, /id="gallery-viewer-count"/);
    assert.doesNotMatch(html, /id="gallery-viewer-image"/);
});

test("index.html includes the gallery helper scripts before main.js", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /scripts\/gallery-utils\.js/);
    assert.match(html, /scripts\/gallery-viewer\.js/);
});

test("index.html embeds Google Maps for 더뉴컨벤션웨딩", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/);

    assert.ok(iframeMatch, "expected a map iframe src");

    const src = iframeMatch[1];
    const decodedSrc = decodeURIComponent(src);

    assert.match(src, /google\.com\/maps\/embed\/v1\/place/);
    assert.match(decodedSrc, /더뉴컨벤션웨딩/);
    assert.match(decodedSrc, /공항대로36길 57/);
});
