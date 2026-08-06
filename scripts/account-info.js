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

        const toggles = Array.from(document.querySelectorAll(config.toggleSelector));
        const groups = Array.from(document.querySelectorAll(config.groupSelector));
        const copyButtons = Array.from(document.querySelectorAll(config.copySelector));
        const revealToggle = document.querySelector(config.revealToggleSelector);
        const revealContent = document.querySelector(config.revealContentSelector);

        if (revealToggle && revealContent) {
            revealToggle.addEventListener("click", function () {
                const isOpen = !revealContent.hidden;

                revealContent.hidden = isOpen;
                revealToggle.setAttribute("aria-expanded", String(!isOpen));
                revealToggle.textContent = isOpen ? "계좌번호 보기" : "계좌번호 닫기";
            });
        }

        if (toggles.length === 0 || groups.length === 0) {
            return;
        }

        function setActiveSide(side) {
            toggles.forEach(function (toggle) {
                const isActive = toggle.dataset.accountToggle === side;

                toggle.classList.toggle("is-active", isActive);
                toggle.setAttribute("aria-selected", String(isActive));
            });

            groups.forEach(function (group) {
                group.hidden = group.dataset.accountGroup !== side;
            });
        }

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

        toggles.forEach(function (toggle) {
            toggle.addEventListener("click", function () {
                setActiveSide(toggle.dataset.accountToggle);
            });
        });

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
