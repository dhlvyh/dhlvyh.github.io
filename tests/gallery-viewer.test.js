const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
    initGalleryViewer,
    collectSourceItems,
    collectRailSnapPoints,
    buildViewerTrackMarkup,
    resolveActivatedItem
} = require("../scripts/gallery-viewer");

test("gallery-viewer supports the fullscreen track mount", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../scripts/gallery-viewer.js"), "utf8");

    assert.match(source, /gallery-viewer-track/);
    assert.match(source, /viewerTrack\.innerHTML = buildViewerTrackMarkup\(sourceItems\)/);
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

test("collectRailSnapPoints deduplicates repeated column offsets", () => {
    const points = collectRailSnapPoints([
        {offsetLeft: 0},
        {offsetLeft: 0},
        {offsetLeft: 216},
        {offsetLeft: 216},
        {offsetLeft: 432}
    ]);

    assert.deepEqual(points, [0, 216, 432]);
});

test("buildViewerTrackMarkup returns one fullscreen slide per source item", () => {
    const markup = buildViewerTrackMarkup([
        {fullSrc: "images/pic2.jpeg", alt: "gallery image a"},
        {fullSrc: "images/pic3.jpeg", alt: "gallery image b"}
    ]);

    assert.match(markup, /data-gallery-viewer-slide-index="0"/);
    assert.match(markup, /data-gallery-viewer-slide-index="1"/);
    assert.match(markup, /images\/pic3\.jpeg/);
});

test("buildViewerTrackMarkup escapes image metadata before interpolating HTML", () => {
    const markup = buildViewerTrackMarkup([
        {fullSrc: 'images/" onerror="alert(1).jpeg', alt: '<script>alert(1)</script>'}
    ]);

    assert.equal(
        markup,
        '<figure class="gallery-viewer-slide" data-gallery-viewer-slide-index="0">' +
        '<img src="images/&quot; onerror=&quot;alert(1).jpeg" alt="&lt;script&gt;alert(1)&lt;/script&gt;"/>' +
        "</figure>"
    );
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

test("index.html wraps the gallery track in a pager viewport with pagination controls", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="gallery-pager"/);
    assert.match(html, /class="gallery-pager-viewport"/);
    assert.match(html, /id="gallery-track"[^>]*class="gallery-pager-track"|class="gallery-pager-track"[^>]*id="gallery-track"/);
    assert.match(html, /id="gallery-pager-prev"/);
    assert.match(html, /id="gallery-pager-next"/);
    assert.match(html, /id="gallery-pager-dots"/);

    const cardMatches = html.match(/data-gallery-item/g) || [];
    assert.equal(cardMatches.length, 20);

    const viewportIndex = html.indexOf('class="gallery-pager-viewport"');
    const controlsIndex = html.indexOf('id="gallery-pager-prev"');

    assert.ok(viewportIndex !== -1 && controlsIndex !== -1 && viewportIndex < controlsIndex,
        "expected pagination controls after the viewport");
});
