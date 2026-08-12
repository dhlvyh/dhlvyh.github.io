(function (root, factory) {
    const accountInfo = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = accountInfo;
    }

    if (root) {
        root.AccountInfo = accountInfo;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    function resolveCopyPayload(buttonNode) {
        const dataset = (buttonNode && buttonNode.dataset) || {};

        return {
            bank: dataset.copyBank || "",
            account: dataset.copyAccount || "",
            holder: dataset.copyHolder || ""
        };
    }

    function initAccountInfo(config) {
        if (typeof document === "undefined" || typeof window === "undefined") {
            return;
        }

        const accordionEntries = Array.from(document.querySelectorAll(config.accordionToggleSelector))
            .map(function (toggle) {
                return { toggle: toggle, panel: document.getElementById(toggle.getAttribute("aria-controls")) };
            })
            .filter(function (entry) {
                return Boolean(entry.panel);
            });
        const copyButtons = Array.from(document.querySelectorAll(config.copySelector));

        function setEntryOpen(entry, open) {
            entry.panel.hidden = !open;
            entry.toggle.setAttribute("aria-expanded", String(open));
            entry.toggle.classList.toggle("is-open", open);
        }

        accordionEntries.forEach(function (entry) {
            entry.toggle.addEventListener("click", function () {
                const nextOpen = entry.panel.hidden;

                accordionEntries.forEach(function (otherEntry) {
                    setEntryOpen(otherEntry, otherEntry === entry ? nextOpen : false);
                });
            });
        });

        function showCopyFeedback(button, label) {
            const originalLabel = button.dataset.originalLabel || button.textContent;

            button.dataset.originalLabel = originalLabel;
            button.textContent = label;

            window.clearTimeout(button.copyResetId);
            button.copyResetId = window.setTimeout(function () {
                button.textContent = originalLabel;
            }, 1500);
        }

        function copyAccount(button) {
            const payload = resolveCopyPayload(button);
            const text = window.AccountUtils
                ? window.AccountUtils.formatClipboardText(payload.bank, payload.account, payload.holder)
                : "";

            writeToClipboard(text)
                .then(function () {
                    showCopyFeedback(button, "복사됨");
                })
                .catch(function () {
                    showCopyFeedback(button, "복사 실패");
                });
        }

        copyButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                copyAccount(button);
            });
        });
    }

    function writeToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve, reject) {
            try {
                const textarea = document.createElement("textarea");

                textarea.value = text;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "absolute";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();

                const succeeded = document.execCommand("copy");

                document.body.removeChild(textarea);

                if (succeeded) {
                    resolve();
                } else {
                    reject(new Error("copy command failed"));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    return {
        resolveCopyPayload,
        initAccountInfo
    };
}));
