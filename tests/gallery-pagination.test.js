const test = require("node:test");
const assert = require("node:assert/strict");

const pagination = require("../scripts/gallery-pagination.js");

test("기본 페이지당 장수는 12장(4열 x 3행)이다", () => {
    assert.equal(pagination.PER_PAGE, 12);
});

test("buildPageCount는 나머지가 있으면 올림한다", () => {
    assert.equal(pagination.buildPageCount(40, 12), 4);
    assert.equal(pagination.buildPageCount(36, 12), 3);
    assert.equal(pagination.buildPageCount(1, 12), 1);
    assert.equal(pagination.buildPageCount(0, 12), 1);
});

test("resolvePageForIndex는 인덱스가 속한 페이지를 계산한다", () => {
    assert.equal(pagination.resolvePageForIndex(0, 12), 0);
    assert.equal(pagination.resolvePageForIndex(11, 12), 0);
    assert.equal(pagination.resolvePageForIndex(12, 12), 1);
    assert.equal(pagination.resolvePageForIndex(39, 12), 3);
});

test("buildPageNumbersModel은 7페이지 이하면 전부 보여준다", () => {
    const model = pagination.buildPageNumbersModel(2, 7);

    assert.deepEqual(model, [
        {type: "page", page: 0, isActive: false},
        {type: "page", page: 1, isActive: false},
        {type: "page", page: 2, isActive: true},
        {type: "page", page: 3, isActive: false},
        {type: "page", page: 4, isActive: false},
        {type: "page", page: 5, isActive: false},
        {type: "page", page: 6, isActive: false}
    ]);
});

test("buildPageNumbersModel은 현재 페이지가 중간이면 양쪽을 생략한다", () => {
    const model = pagination.buildPageNumbersModel(5, 10);

    assert.deepEqual(model, [
        {type: "page", page: 0, isActive: false},
        {type: "ellipsis"},
        {type: "page", page: 4, isActive: false},
        {type: "page", page: 5, isActive: true},
        {type: "page", page: 6, isActive: false},
        {type: "ellipsis"},
        {type: "page", page: 9, isActive: false}
    ]);
});

test("buildPageNumbersModel은 현재 페이지가 처음 근처면 뒤쪽만 생략한다", () => {
    const model = pagination.buildPageNumbersModel(0, 10);

    assert.deepEqual(model, [
        {type: "page", page: 0, isActive: true},
        {type: "page", page: 1, isActive: false},
        {type: "ellipsis"},
        {type: "page", page: 9, isActive: false}
    ]);
});

test("buildPageNumbersModel은 현재 페이지가 끝 근처면 앞쪽만 생략한다", () => {
    const model = pagination.buildPageNumbersModel(9, 10);

    assert.deepEqual(model, [
        {type: "page", page: 0, isActive: false},
        {type: "ellipsis"},
        {type: "page", page: 8, isActive: false},
        {type: "page", page: 9, isActive: true}
    ]);
});

test("buildPageNumbersMarkup은 페이지 번호 버튼과 생략 기호를 만든다", () => {
    const markup = pagination.buildPageNumbersMarkup([
        {type: "page", page: 0, isActive: true},
        {type: "ellipsis"},
        {type: "page", page: 9, isActive: false}
    ]);

    assert.match(markup, /<button class="gallery-page-number is-active" data-page="0" type="button" aria-current="page">1<\/button>/);
    assert.match(markup, /<span class="gallery-page-ellipsis" aria-hidden="true">&hellip;<\/span>/);
    assert.match(markup, /<button class="gallery-page-number" data-page="9" type="button">10<\/button>/);
});

test("initPagination은 DOM이 없으면 no-op을 돌려준다", () => {
    const handle = pagination.initPagination({
        gridSelector: "#gallery-thumb-grid",
        paginationSelector: "#gallery-pagination",
        numbersSelector: "#gallery-page-numbers"
    });

    assert.equal(typeof handle.ensurePageVisible, "function");
    assert.doesNotThrow(() => handle.ensurePageVisible(35));
});
