const test = require("node:test");
const assert = require("node:assert/strict");

const { formatClipboardText } = require("../scripts/account-utils");

test("formatClipboardText combines bank, account, and holder", () => {
    assert.equal(
        formatClipboardText("OO은행", "000-0000-0000000", "예금주 성함"),
        "OO은행 000-0000-0000000 (예금주 성함)"
    );
});

test("formatClipboardText omits the holder parens when holder is missing", () => {
    assert.equal(
        formatClipboardText("OO은행", "000-0000-0000000", ""),
        "OO은행 000-0000-0000000"
    );
});

test("formatClipboardText skips a missing bank name", () => {
    assert.equal(
        formatClipboardText("", "000-0000-0000000", "안용현"),
        "000-0000-0000000 (안용현)"
    );
});

test("formatClipboardText returns an empty string when everything is missing", () => {
    assert.equal(formatClipboardText(undefined, undefined, undefined), "");
});
