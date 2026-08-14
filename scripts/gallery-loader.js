// 갤러리 매니페스트(images/gallery/manifest.json)를 읽어 메인 슬라이드/썸네일 마크업을 생성한다
(function (root, factory) {
    const loader = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = loader;
    }

    if (root) {
        root.GalleryLoader = loader;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    function buildGallerySlidesMarkup(items) {
        return items.map(function (item, index) {
            const displayNumber = index + 1;

            return "" +
                '<div class="gallery-main-slide" data-gallery-slide-index="' + index + '">' +
                '<img class="gallery-main-slide-backdrop" src="' + item.main + '" alt="" aria-hidden="true" loading="lazy"/>' +
                '<img class="gallery-main-slide-photo" alt="안용현 안다혜 갤러리 사진 ' + displayNumber + '" decoding="async" loading="lazy" src="' + item.main + '"/>' +
                "</div>";
        }).join("");
    }

    function buildGalleryThumbsMarkup(items) {
        return items.map(function (item, index) {
            const displayNumber = index + 1;

            return "" +
                '<button aria-label="' + displayNumber + '번째 사진 크게 보기" class="gallery-thumb" data-gallery-thumb-index="' + index + '" type="button">' +
                '<img alt="" aria-hidden="true" decoding="async" loading="lazy" src="' + item.thumb + '"/>' +
                "</button>";
        }).join("");
    }

    return {buildGallerySlidesMarkup, buildGalleryThumbsMarkup};
}));
