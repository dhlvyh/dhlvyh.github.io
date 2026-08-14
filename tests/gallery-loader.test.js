const test = require("node:test");
const assert = require("node:assert/strict");

const {buildGallerySlidesMarkup, buildGalleryThumbsMarkup} = require("../scripts/gallery-loader");

const SAMPLE_ITEMS = [
    {index: 1, main: "images/gallery/main/1.webp", thumb: "images/gallery/thumb/1.webp"},
    {index: 2, main: "images/gallery/main/2.webp", thumb: "images/gallery/thumb/2.webp"},
    {index: 5, main: "images/gallery/main/5.webp", thumb: "images/gallery/thumb/5.webp"}
];

test("buildGallerySlidesMarkup renders one slide per item, indexed by position not by source number", () => {
    const markup = buildGallerySlidesMarkup(SAMPLE_ITEMS);

    const slideMatches = markup.match(/data-gallery-slide-index="\d+"/g) || [];
    const backdropMatches = markup.match(/class="gallery-main-slide-backdrop"/g) || [];
    const photoMatches = markup.match(/class="gallery-main-slide-photo"/g) || [];

    assert.deepEqual(slideMatches, [
        'data-gallery-slide-index="0"',
        'data-gallery-slide-index="1"',
        'data-gallery-slide-index="2"'
    ]);
    assert.equal(backdropMatches.length, 3);
    assert.equal(photoMatches.length, 3);

    assert.match(markup, /src="images\/gallery\/main\/5\.webp"/);
    assert.match(markup, /갤러리 사진 3/);
});

test("buildGallerySlidesMarkup returns an empty string for an empty list", () => {
    assert.equal(buildGallerySlidesMarkup([]), "");
});

test("buildGalleryThumbsMarkup renders one thumb button per item with sequential aria labels", () => {
    const markup = buildGalleryThumbsMarkup(SAMPLE_ITEMS);

    const thumbMatches = markup.match(/data-gallery-thumb-index="\d+"/g) || [];

    assert.deepEqual(thumbMatches, [
        'data-gallery-thumb-index="0"',
        'data-gallery-thumb-index="1"',
        'data-gallery-thumb-index="2"'
    ]);
    assert.match(markup, /aria-label="3번째 사진 크게 보기"/);
    assert.match(markup, /src="images\/gallery\/thumb\/5\.webp"/);
});

test("buildGalleryThumbsMarkup returns an empty string for an empty list", () => {
    assert.equal(buildGalleryThumbsMarkup([]), "");
});
