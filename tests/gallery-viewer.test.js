const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {initGallery} = require("../scripts/gallery-viewer");

test("gallery-viewer exports initGallery", () => {
    assert.equal(typeof initGallery, "function");
});

test("initGallery is a no-op outside a browser environment (no window/document)", () => {
    assert.doesNotThrow(() => initGallery({
        viewportSelector: "#gallery-main-viewport",
        trackSelector: "#gallery-main-track",
        thumbGridSelector: "#gallery-thumb-grid",
        prevSelector: "#gallery-main-prev",
        nextSelector: "#gallery-main-next"
    }));
});

test("gallery-viewer drives the main track through GalleryUtils snap/edge-resistance math", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /window\.GalleryUtils\.clampIndex/);
    assert.match(source, /window\.GalleryUtils\.applyEdgeResistance/);
    assert.match(source, /window\.GalleryUtils\.resolveSnapIndex/);
});

test("index.html wraps the gallery in a full-bleed main viewer with a 5-column thumbnail grid", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="gallery-main"/);
    assert.match(html, /class="gallery-main-viewport"/);
    assert.match(html, /id="gallery-main-track"[^>]*class="gallery-main-track"|class="gallery-main-track"[^>]*id="gallery-main-track"/);
    assert.match(html, /class="gallery-thumb-grid"/);

    const mainIndex = html.indexOf('class="gallery-main"');
    const thumbIndex = html.indexOf('class="gallery-thumb-grid"');

    assert.ok(mainIndex !== -1 && thumbIndex !== -1 && mainIndex < thumbIndex,
        "expected the thumbnail grid after the main viewer");
});
