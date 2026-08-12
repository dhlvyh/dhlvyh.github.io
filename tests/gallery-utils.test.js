const test = require("node:test");
const assert = require("node:assert/strict");

const {
    resolveSwipeAction,
    shouldSuppressClick,
    applyEdgeResistance,
    clampIndex,
    resolveSnapIndex,
    computeContainSize,
    clampPanOffset,
    computePinchDistance,
    computePinchMidpointPercent,
    clampZoomScale
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

test("computeContainSize letterboxes a wide image to fit the container width", () => {
    assert.deepEqual(computeContainSize(400, 500, 1280, 640), {width: 400, height: 200});
});

test("computeContainSize letterboxes a tall image to fit the container height", () => {
    assert.deepEqual(computeContainSize(400, 500, 270, 900), {width: 150, height: 500});
});

test("computeContainSize returns zero size when any dimension is zero or missing", () => {
    assert.deepEqual(computeContainSize(0, 500, 300, 900), {width: 0, height: 0});
    assert.deepEqual(computeContainSize(400, 500, 0, 900), {width: 0, height: 0});
});

test("clampPanOffset keeps an offset inside the bounds unchanged", () => {
    assert.equal(clampPanOffset(10, 2, 400, 300), 10);
});

test("clampPanOffset clamps an offset past either edge", () => {
    assert.equal(clampPanOffset(500, 2, 400, 300), 100);
    assert.equal(clampPanOffset(-500, 2, 400, 300), -100);
});

test("clampPanOffset forces the offset to zero when content never exceeds the container", () => {
    assert.equal(clampPanOffset(50, 1, 400, 300), 0);
});

test("computePinchDistance measures the distance between two points", () => {
    assert.equal(computePinchDistance({x: 0, y: 0}, {x: 3, y: 4}), 5);
});

test("computePinchMidpointPercent converts the pinch midpoint to a percentage inside the rect", () => {
    const rect = {left: 100, top: 50, width: 200, height: 100};
    assert.deepEqual(
        computePinchMidpointPercent({x: 100, y: 50}, {x: 300, y: 150}, rect),
        {x: 50, y: 50}
    );
});

test("computePinchMidpointPercent clamps points outside the rect to 0-100", () => {
    const rect = {left: 100, top: 50, width: 200, height: 100};
    assert.deepEqual(
        computePinchMidpointPercent({x: -500, y: -500}, {x: -500, y: -500}, rect),
        {x: 0, y: 0}
    );
});

test("computePinchMidpointPercent falls back to center when the rect has no size", () => {
    const rect = {left: 0, top: 0, width: 0, height: 0};
    assert.deepEqual(computePinchMidpointPercent({x: 10, y: 10}, {x: 20, y: 20}, rect), {x: 50, y: 50});
});

test("clampZoomScale clamps to the default 1-3 range", () => {
    assert.equal(clampZoomScale(5), 3);
    assert.equal(clampZoomScale(0.5), 1);
    assert.equal(clampZoomScale(2), 2);
});

test("clampZoomScale honors a custom min/max", () => {
    assert.equal(clampZoomScale(10, 1, 5), 5);
});
