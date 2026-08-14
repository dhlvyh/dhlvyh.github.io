const test = require("node:test");
const assert = require("node:assert/strict");

const collapse = require("../scripts/gallery-collapse.js");

test("기본 한도는 30장이다", () => {
    assert.equal(collapse.DEFAULT_LIMIT, 30);
});

test("shouldCollapse는 한도를 초과할 때만 참이다", () => {
    assert.equal(collapse.shouldCollapse(29, 30), false);
    // 정확히 30장이면 숨길 게 없다 — "더보기 (0장)"이 생기면 안 된다
    assert.equal(collapse.shouldCollapse(30, 30), false);
    assert.equal(collapse.shouldCollapse(31, 30), true);
    assert.equal(collapse.shouldCollapse(40, 30), true);
});

test("countHidden은 한도를 넘는 장수만 센다", () => {
    assert.equal(collapse.countHidden(40, 30), 10);
    assert.equal(collapse.countHidden(31, 30), 1);
    assert.equal(collapse.countHidden(30, 30), 0);
    assert.equal(collapse.countHidden(5, 30), 0);
});

test("buildToggleLabel은 접힌 상태에서 남은 장수를 보여준다", () => {
    assert.equal(collapse.buildToggleLabel(10, false), "더보기 (10장)");
    assert.equal(collapse.buildToggleLabel(1, false), "더보기 (1장)");
});

test("buildToggleLabel은 펼친 상태에서 접기로 바뀐다", () => {
    assert.equal(collapse.buildToggleLabel(10, true), "접기");
    assert.equal(collapse.buildToggleLabel(0, true), "접기");
});

test("initCollapse는 DOM이 없으면 no-op을 돌려준다", () => {
    const handle = collapse.initCollapse({
        gridSelector: "#gallery-thumb-grid",
        wrapperSelector: "#gallery-thumb-more",
        toggleSelector: "#gallery-thumb-toggle"
    });

    assert.equal(typeof handle.ensureIndexVisible, "function");
    // 호출부가 null 검사 없이 그냥 부를 수 있어야 한다
    assert.doesNotThrow(() => handle.ensureIndexVisible(35));
});
