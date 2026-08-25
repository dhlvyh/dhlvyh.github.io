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

test("gallery-viewer notifies onThumbActivate only from the thumbnail click handler", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    const clickHandlerMatch = source.match(/thumbGrid\.addEventListener\("click", function \(event\) \{[\s\S]*?\}\);/);
    assert.ok(clickHandlerMatch, "expected a thumbGrid click listener");
    assert.match(clickHandlerMatch[0], /config\.onThumbActivate/);
});

test("gallery-viewer opens the lightbox before positioning the selected slide without an opening transition", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");
    const clickHandlerMatch = source.match(/thumbGrid\.addEventListener\("click", function \(event\) \{[\s\S]*?\}\);/);
    assert.ok(clickHandlerMatch, "expected a thumbGrid click listener");

    const handler = clickHandlerMatch[0];
    assert.ok(
        handler.indexOf("config.onThumbActivate") < handler.indexOf("goToIndex(index, false)"),
        "expected the lightbox to be visible before positioning the selected slide without transition"
    );
});

test("gallery-viewer updates the current photo counter when the active slide changes", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /config\.counterSelector/);
    assert.match(source, /function updateCounter\(\)/);
    assert.match(source, /activeIndex \+ 1/);
    assert.match(source, /updateCounter\(\);/);
});

test("gallery-viewer drives the main track through GalleryUtils snap/edge-resistance/pinch math", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /window\.GalleryUtils\.clampIndex/);
    assert.match(source, /window\.GalleryUtils\.applyEdgeResistance/);
    assert.match(source, /window\.GalleryUtils\.resolveSnapIndex/);
    assert.match(source, /window\.GalleryUtils\.clampZoomScale/);
    assert.match(source, /window\.GalleryUtils\.clampPanOffset/);
    assert.match(source, /window\.GalleryUtils\.computePinchDistance/);
    assert.match(source, /window\.GalleryUtils\.computePinchMidpointPercent/);
    assert.match(source, /window\.GalleryUtils\.computeContainSize/);
});

test("index.html wraps the gallery lightbox around a shared viewport/track pair", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="gallery-lightbox"/);
    assert.match(html, /class="gallery-main-viewport" id="gallery-lightbox-viewport"/);
    assert.match(html, /class="gallery-main-track" id="gallery-lightbox-track"/);
    assert.match(html, /class="gallery-thumb-grid"/);

    const lightboxIndex = html.indexOf('class="gallery-lightbox"');
    const thumbIndex = html.indexOf('class="gallery-thumb-grid"');

    assert.ok(lightboxIndex !== -1 && thumbIndex !== -1 && lightboxIndex > thumbIndex,
        "expected the thumbnail grid before the lightbox modal");
});

test("gallery-loader builds each slide with a blurred backdrop image and a contain-fit photo", () => {
    const {buildGallerySlidesMarkup} = require("../scripts/gallery-loader");
    const markup = buildGallerySlidesMarkup([
        {main: "images/gallery/main/1.webp", thumb: "images/gallery/thumb/1.webp"},
        {main: "images/gallery/main/2.webp", thumb: "images/gallery/thumb/2.webp"}
    ]);

    const backdropMatches = markup.match(/class="gallery-main-slide-backdrop"/g) || [];
    const photoMatches = markup.match(/class="gallery-main-slide-photo"/g) || [];

    assert.equal(backdropMatches.length, 2);
    assert.equal(photoMatches.length, 2);
});
