const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
    initGalleryViewer,
    collectSourceItems,
    deriveLoopMetrics,
    resolveActivatedItem
} = require("../scripts/gallery-viewer");

test("gallery-viewer supports the fullscreen track mount", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /gallery-viewer-track/);
    assert.match(source, /viewerTrack\.appendChild\(image\)/);
});

test("gallery-viewer exports initGalleryViewer", () => {
    assert.equal(typeof initGalleryViewer, "function");
});

test("collectSourceItems reads full image data from the original gallery items", () => {
    const items = collectSourceItems([
        {
            dataset: {fullSrc: "images/full-a.jpeg"},
            querySelector(selector) {
                assert.equal(selector, "img");
                return {src: "images/thumb-a.jpeg", alt: "gallery image a"};
            }
        },
        {
            dataset: {},
            querySelector() {
                return {src: "images/thumb-b.jpeg", alt: "gallery image b"};
            }
        }
    ]);

    assert.deepEqual(items, [
        {
            alt: "gallery image a",
            fullSrc: "images/full-a.jpeg",
            src: "images/thumb-a.jpeg"
        },
        {
            alt: "gallery image b",
            fullSrc: "images/thumb-b.jpeg",
            src: "images/thumb-b.jpeg"
        }
    ]);
});

test("deriveLoopMetrics keeps the middle segment as the seamless home range", () => {
    const metrics = deriveLoopMetrics([
        {dataset: {gallerySegmentIndex: "0"}, offsetLeft: 24},
        {dataset: {gallerySegmentIndex: "1"}, offsetLeft: 324},
        {dataset: {gallerySegmentIndex: "2"}, offsetLeft: 624}
    ]);

    assert.deepEqual(metrics, {
        segmentStart: 300,
        segmentWidth: 300
    });
});

test("resolveActivatedItem falls back to the pressed card when pointer capture retargets the click", () => {
    const card = {id: "gallery-card-1"};
    const track = {
        contains(node) {
            return node === card;
        }
    };
    const event = {
        target: {
            closest() {
                return null;
            }
        }
    };

    assert.equal(
        resolveActivatedItem(event, track, "[data-gallery-item]", card),
        card
    );
});
