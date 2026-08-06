(function (root, factory) {
    const utils = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = utils;
    }

    if (root) {
        root.AccountUtils = utils;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    function formatClipboardText(bankName, accountNumber, holderName) {
        const bankAndAccount = [bankName, accountNumber].filter(Boolean).join(" ");
        const holderSuffix = holderName ? " (" + holderName + ")" : "";

        return bankAndAccount + holderSuffix;
    }

    return {
        formatClipboardText
    };
}));
