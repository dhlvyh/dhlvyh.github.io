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

    // 앞자리 0 없이 자연스러운 자릿수로만 쓴다. 년/일처럼 "03년 044일"이
    // 어색한 자리에 쓰고, 시/분/초는 시간 표기 관례대로 padNumber를 유지한다
    // (초까지 0을 빼면 9->10초마다 자릿수가 늘어 줄 전체가 밀린다).
    function trimNumber(value) {
        return String(Math.max(0, Math.trunc(value)));
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

    return {padNumber, trimNumber, buildOdometerMarkup, updateOdometerCells};
}));
