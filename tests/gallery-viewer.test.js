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
        viewportSelector: "#gallery-viewport",
        trackSelector: "#gallery-track",
        prevSelector: "#gallery-prev",
        nextSelector: "#gallery-next",
        counterSelector: "#gallery-counter",
        progressFillSelector: "#gallery-progress-fill"
    }));
});

test("gallery-viewer updates the current photo counter when the active slide changes", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /config\.counterSelector/);
    assert.match(source, /function updateCounter\(\)/);
    assert.match(source, /activeIndex \+ 1/);
    assert.match(source, /updateCounter\(\);/);
});

test("gallery-viewer updates the progress fill scale when the active slide changes", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /config\.progressFillSelector/);
    assert.match(source, /function updateProgress\(\)/);
    assert.match(source, /\(activeIndex \+ 1\) \/ length/);
    assert.match(source, /updateProgress\(\);/);
});

test("gallery-viewer wraps navigation past the first and last slide instead of stopping", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /getWrappedIndex\(activeIndex, "previous", length\)/);
    assert.match(source, /getWrappedIndex\(activeIndex, "next", length\)/);
    assert.match(source, /function isWrapJump\(/);
    assert.doesNotMatch(source, /GalleryUtils\.clampIndex/);
});

test("gallery-viewer drives the main track through snap and edge-resistance math only, no pinch/zoom", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /window\.GalleryUtils\.applyEdgeResistance/);
    assert.match(source, /window\.GalleryUtils\.resolveSnapIndex/);
    assert.doesNotMatch(source, /pinchState|zoomStates|clampZoomScale|clampPanOffset|computePinchDistance|computePinchMidpointPercent/);
});

test("gallery-viewer no longer references a thumbnail grid or lightbox activation callback", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.doesNotMatch(source, /thumbGrid|onThumbActivate|thumbGridSelector/);
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
