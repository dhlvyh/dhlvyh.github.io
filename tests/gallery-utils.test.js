const test = require("node:test");
const assert = require("node:assert/strict");

const {
    resolveSwipeAction,
    shouldSuppressClick,
    applyEdgeResistance,
    clampIndex,
    resolveSnapIndex,
    resolvePerPage,
    buildPages
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

test("resolvePerPage returns the desktop count above the breakpoint", () => {
    assert.equal(resolvePerPage(1400), 10);
    assert.equal(resolvePerPage(769), 10);
});

test("resolvePerPage returns the mobile count at or below the breakpoint", () => {
    assert.equal(resolvePerPage(768), 4);
    assert.equal(resolvePerPage(375), 4);
});

test("resolvePerPage honors custom breakpoint and counts", () => {
    assert.equal(resolvePerPage(900, 992, 6, 2), 2);
    assert.equal(resolvePerPage(1000, 992, 6, 2), 6);
});

test("buildPages groups item indexes into fixed-size pages", () => {
    assert.deepEqual(buildPages(20, 10), [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    ]);
});

test("buildPages keeps a shorter final page when the count doesn't divide evenly", () => {
    assert.deepEqual(buildPages(9, 4), [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8]
    ]);
});

test("buildPages returns an empty array for non-positive counts", () => {
    assert.deepEqual(buildPages(0, 10), []);
    assert.deepEqual(buildPages(20, 0), []);
});
