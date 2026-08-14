const test = require("node:test");
const assert = require("node:assert/strict");

const {padNumber, trimNumber, buildOdometerMarkup, updateOdometerCells} = require("../scripts/odometer");

test("padNumber pads with leading zeros to the requested length", () => {
    assert.equal(padNumber(5, 2), "05");
    assert.equal(padNumber(42, 2), "42");
    assert.equal(padNumber(7, 3), "007");
});

test("padNumber clamps negative values to zero and never truncates a larger number", () => {
    assert.equal(padNumber(-3, 2), "00");
    assert.equal(padNumber(123, 2), "123");
});

test("buildOdometerMarkup renders one digit cell per requested position, each with a 0-9 reel", () => {
    const markup = buildOdometerMarkup(3);
    const cellMatches = markup.match(/class="digit"/g) || [];
    const reelMatches = markup.match(/class="reel"/g) || [];

    assert.equal(cellMatches.length, 3);
    assert.equal(reelMatches.length, 3);
    assert.match(markup, /<i>0<\/i><i>1<\/i><i>2<\/i><i>3<\/i><i>4<\/i><i>5<\/i><i>6<\/i><i>7<\/i><i>8<\/i><i>9<\/i>/);
});

test("updateOdometerCells sets the --n custom property on each digit's reel from a padded string", () => {
    const setCalls = [];
    const reel = {style: {setProperty(name, value) {
        setCalls.push([name, value]);
    }}};
    const cell = {querySelector: () => reel};
    const container = {
        querySelectorAll: () => [cell, cell, cell]
    };

    updateOdometerCells(container, "255");

    assert.deepEqual(setCalls, [
        ["--n", "2"],
        ["--n", "5"],
        ["--n", "5"]
    ]);
});

test("updateOdometerCells is a no-op when the container is missing", () => {
    assert.doesNotThrow(() => updateOdometerCells(null, "255"));
});

test("trimNumber drops leading zeros so 년/일이 \"03\"/\"044\"로 안 나온다", () => {
    assert.equal(trimNumber(3), "3");
    assert.equal(trimNumber(44), "44");
    assert.equal(trimNumber(0), "0");
    assert.equal(trimNumber(365), "365");
});

test("trimNumber clamps negatives and truncates fractions like padNumber", () => {
    assert.equal(trimNumber(-5), "0");
    assert.equal(trimNumber(7.9), "7");
});
