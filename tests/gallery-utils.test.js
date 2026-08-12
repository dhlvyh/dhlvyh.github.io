const test = require("node:test");
const assert = require("node:assert/strict");

const {
    resolveSwipeAction,
    shouldSuppressClick,
    applyEdgeResistance,
    clampIndex,
    resolveSnapIndex
} = require("../scripts/gallery-utils");

test("resolveSwipeAction returns next for a left swipe beyond threshold", () => {
    assert.equal(resolveSwipeAction(-120, 60), "next");
});

test("resolveSwipeAction returns previous for a right swipe beyond threshold", () => {
    assert.equal(resolveSwipeAction(120, 60), "previous");
});

test("shouldSuppressClick returns true after a real drag", () => {
    assert.equal(shouldSuppressClick(18, 6, 10), true);
    assert.equal(shouldSuppressClick(4, 3, 10), false);
});

test("applyEdgeResistance dampens overscroll distance without flipping direction", () => {
    assert.equal(applyEdgeResistance(120, 0.35), 42);
    assert.equal(applyEdgeResistance(-120, 0.35), -42);
});

test("clampIndex keeps the index inside the gallery bounds", () => {
    assert.equal(clampIndex(-1, 6), 0);
    assert.equal(clampIndex(2, 6), 2);
    assert.equal(clampIndex(8, 6), 5);
});

test("resolveSnapIndex advances on a committed drag or a fast swipe", () => {
    assert.equal(resolveSnapIndex(1, -180, 0, 360, 6), 2);
    assert.equal(resolveSnapIndex(1, -24, -0.75, 360, 6), 2);
    assert.equal(resolveSnapIndex(1, 180, 0, 360, 6), 0);
});

test("resolveSnapIndex clamps at the first and last slides", () => {
    assert.equal(resolveSnapIndex(0, 240, 0, 360, 6), 0);
    assert.equal(resolveSnapIndex(5, -240, 0, 360, 6), 5);
});
