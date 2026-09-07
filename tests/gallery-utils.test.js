const test = require("node:test");
const assert = require("node:assert/strict");

const {
    resolveSwipeAction,
    getWrappedIndex,
    shouldSuppressClick,
    applyEdgeResistance,
    resolveSnapIndex,
    resolveScrubPosition
} = require("../scripts/gallery-utils");

test("resolveSwipeAction returns next for a left swipe beyond threshold", () => {
    assert.equal(resolveSwipeAction(-120, 60), "next");
});

test("resolveSwipeAction returns previous for a right swipe beyond threshold", () => {
    assert.equal(resolveSwipeAction(120, 60), "previous");
});

test("getWrappedIndex advances forward and wraps past the last slide", () => {
    assert.equal(getWrappedIndex(0, "next", 6), 1);
    assert.equal(getWrappedIndex(5, "next", 6), 0);
});

test("getWrappedIndex steps backward and wraps past the first slide", () => {
    assert.equal(getWrappedIndex(5, "previous", 6), 4);
    assert.equal(getWrappedIndex(0, "previous", 6), 5);
});

test("getWrappedIndex returns 0 for a non-positive length", () => {
    assert.equal(getWrappedIndex(3, "next", 0), 0);
});

test("shouldSuppressClick returns true after a real drag", () => {
    assert.equal(shouldSuppressClick(18, 6, 10), true);
    assert.equal(shouldSuppressClick(4, 3, 10), false);
});

test("applyEdgeResistance dampens overscroll distance without flipping direction", () => {
    assert.equal(applyEdgeResistance(120, 0.35), 42);
    assert.equal(applyEdgeResistance(-120, 0.35), -42);
});

test("resolveSnapIndex advances on a committed drag or a fast swipe", () => {
    assert.equal(resolveSnapIndex(1, -180, 0, 360, 6), 2);
    assert.equal(resolveSnapIndex(1, -24, -0.75, 360, 6), 2);
    assert.equal(resolveSnapIndex(1, 180, 0, 360, 6), 0);
});

test("resolveSnapIndex wraps past the first and last slides instead of stopping", () => {
    assert.equal(resolveSnapIndex(0, 240, 0, 360, 6), 5);
    assert.equal(resolveSnapIndex(5, -240, 0, 360, 6), 0);
});

test("resolveSnapIndex stays put and never throws when there is one slide or none", () => {
    assert.equal(resolveSnapIndex(0, 240, 0, 360, 1), 0);
    assert.equal(resolveSnapIndex(0, 240, 0, 360, 0), 0);
});

test("resolveScrubPosition maps the left and right edges to the first and last slide", () => {
    assert.equal(resolveScrubPosition(0, 0, 300, 6), 0);
    assert.equal(resolveScrubPosition(300, 0, 300, 6), 5);
});

test("resolveScrubPosition maps the midpoint proportionally between slides", () => {
    assert.equal(resolveScrubPosition(150, 0, 300, 6), 2.5);
});

test("resolveScrubPosition clamps positions outside the track", () => {
    assert.equal(resolveScrubPosition(-50, 0, 300, 6), 0);
    assert.equal(resolveScrubPosition(500, 0, 300, 6), 5);
});

test("resolveScrubPosition returns 0 when there is one slide, none, or no track width", () => {
    assert.equal(resolveScrubPosition(150, 0, 300, 1), 0);
    assert.equal(resolveScrubPosition(150, 0, 300, 0), 0);
    assert.equal(resolveScrubPosition(150, 0, 0, 6), 0);
});
