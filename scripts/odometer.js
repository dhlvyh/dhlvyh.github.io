// 함께한 시간을 초 단위로 굴러가는 오도미터 숫자로 표시하는 헬퍼
(function (root, factory) {
    const odometer = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = odometer;
    }

    if (root) {
        root.Odometer = odometer;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    function padNumber(value, length) {
        return String(Math.max(0, Math.trunc(value))).padStart(length, "0");
    }

    function buildReelMarkup() {
        let digits = "";

        for (let digit = 0; digit <= 9; digit += 1) {
            digits += "<i>" + digit + "</i>";
        }

        return '<span class="reel">' + digits + "</span>";
    }

    function buildOdometerMarkup(digitCount) {
        let cells = "";

        for (let index = 0; index < digitCount; index += 1) {
            cells += '<span class="digit">' + buildReelMarkup() + "</span>";
        }

        return cells;
    }

    function updateOdometerCells(container, paddedValue) {
        if (!container) {
            return;
        }

        const cells = container.querySelectorAll(".digit");

        Array.from(paddedValue).forEach(function (digitChar, index) {
            const cell = cells[index];
            const reel = cell && cell.querySelector(".reel");

            if (reel) {
                reel.style.setProperty("--n", digitChar);
            }
        });
    }

    return {padNumber, buildOdometerMarkup, updateOdometerCells};
}));
