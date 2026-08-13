// scripts/petal-fall.js의 순수 물리 계산 함수(stepPetal/createPetal/resolvePetalCount)를 검증한다
const test = require("node:test");
const assert = require("node:assert/strict");

const { resolvePetalCount, createPetal, stepPetal } = require("../scripts/petal-fall");

test("resolvePetalCount clamps between 12 and 30, scaling with canvas width", () => {
    assert.equal(resolvePetalCount(300), 12);
    assert.equal(resolvePetalCount(1200), 20);
    assert.equal(resolvePetalCount(3000), 30);
});

test("createPetal derives every field deterministically from the given random function", () => {
    const petal = createPetal(400, 800, () => 0.5);

    assert.equal(petal.baseX, 200);
    assert.equal(petal.y, 400);
    assert.equal(petal.size, 6.5);
    assert.equal(petal.rotation, 180);
    assert.equal(petal.color, "#C86E87");
});

test("stepPetal advances y by fallSpeed, accumulates rotation, and computes sway-based x", () => {
    const petal = {
        baseX: 100,
        y: 0,
        rotation: 0,
        fallSpeed: 2,
        swayAmplitude: 10,
        swayFrequency: 0.01,
        rotationSpeed: 0.5,
        size: 8,
        opacity: 0.7,
        color: "#E08BA0"
    };

    const next = stepPetal(petal, 400, 800);

    assert.equal(next.y, 2);
    assert.equal(next.rotation, 0.5);
    assert.equal(next.x, 100 + Math.sin(2 * 0.01) * 10);
});

test("stepPetal wraps back above the canvas and reassigns baseX once it falls past the bottom", () => {
    const petal = {
        baseX: 100,
        y: 800,
        rotation: 10,
        fallSpeed: 10,
        swayAmplitude: 10,
        swayFrequency: 0.01,
        rotationSpeed: 0.5,
        size: 8,
        opacity: 0.7,
        color: "#E08BA0"
    };

    const next = stepPetal(petal, 400, 800, () => 0.75);

    assert.equal(next.y, -8);
    assert.equal(next.baseX, 300);
});
