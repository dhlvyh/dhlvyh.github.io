const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveCopyPayload, initAccountInfo } = require("../scripts/account-info");

test("resolveCopyPayload reads bank, account, and holder from dataset", () => {
    const button = {
        dataset: {
            copyBank: "OO은행",
            copyAccount: "000-0000-0000000",
            copyHolder: "안용현"
        }
    };

    assert.deepEqual(resolveCopyPayload(button), {
        bank: "OO은행",
        account: "000-0000-0000000",
        holder: "안용현"
    });
});

test("resolveCopyPayload defaults missing dataset fields to empty strings", () => {
    const button = { dataset: {} };

    assert.deepEqual(resolveCopyPayload(button), {
        bank: "",
        account: "",
        holder: ""
    });
});

test("account-info exports initAccountInfo", () => {
    assert.equal(typeof initAccountInfo, "function");
});
