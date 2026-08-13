(function (root, factory) {
    const utils = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = utils;
    }

    if (root) {
        root.WeddingUtils = utils;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    const DAY_IN_MS = 24 * 60 * 60 * 1000;

    function parseIsoDate(targetIsoDate) {
        const parts = targetIsoDate.split("-").map(Number);

        if (parts.length !== 3 || parts.some(Number.isNaN)) {
            throw new Error("Invalid ISO date: " + targetIsoDate);
        }

        return {
            year: parts[0],
            monthIndex: parts[1] - 1,
            day: parts[2]
        };
    }

    function toUtcMidnight(date) {
        return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function buildCountdown(targetIsoDate, fromDate = new Date()) {
        const target = parseIsoDate(targetIsoDate);
        const targetUtc = Date.UTC(target.year, target.monthIndex, target.day);
        const fromUtc = toUtcMidnight(fromDate);
        const days = Math.round((targetUtc - fromUtc) / DAY_IN_MS);
        let label = "D-Day";
        let copy = "오늘이 바로 결혼식 날입니다.";

        if (days > 0) {
            label = "D-" + days;
            copy = "예식일까지 " + days + "일 남았습니다.";
        } else if (days < 0) {
            label = "D+" + Math.abs(days);
            copy = "예식 후 " + Math.abs(days) + "일이 지났습니다.";
        }

        return {days, label, copy};
    }

    function buildCountdownParts(targetIso, fromDate = new Date()) {
        const targetMs = new Date(targetIso).getTime();
        const diffMs = Math.max(0, targetMs - fromDate.getTime());
        const totalSeconds = Math.floor(diffMs / 1000);

        return {
            days: Math.floor(totalSeconds / 86400),
            hours: Math.floor((totalSeconds % 86400) / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60,
            isPast: targetMs <= fromDate.getTime()
        };
    }

    function buildElapsedParts(startIso, fromDate = new Date()) {
        const start = new Date(startIso);
        let years = fromDate.getFullYear() - start.getFullYear();
        let anniversary = new Date(start);
        anniversary.setFullYear(start.getFullYear() + years);

        if (anniversary.getTime() > fromDate.getTime()) {
            years -= 1;
            anniversary = new Date(start);
            anniversary.setFullYear(start.getFullYear() + years);
        }

        years = Math.max(years, 0);

        const sinceAnniversarySeconds = Math.floor(
            Math.max(0, fromDate.getTime() - anniversary.getTime()) / 1000
        );
        const days = Math.floor(sinceAnniversarySeconds / 86400);
        const remainderSeconds = sinceAnniversarySeconds % 86400;

        return {
            years,
            days,
            hours: Math.floor(remainderSeconds / 3600),
            minutes: Math.floor((remainderSeconds % 3600) / 60),
            seconds: remainderSeconds % 60
        };
    }

    function buildCalendarWeeks(year, monthIndex) {
        const firstWeekday = new Date(year, monthIndex, 1).getDay();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const weeks = [];
        let week = new Array(firstWeekday).fill(null);

        for (let day = 1; day <= daysInMonth; day += 1) {
            week.push(day);

            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        }

        if (week.length > 0) {
            while (week.length < 7) {
                week.push(null);
            }

            weeks.push(week);
        }

        return weeks;
    }

    function buildCalendarMarkup(weeks, weddingDay, weddingTimeLabel) {
        return weeks.flat().map(function (day) {
            const classes = ["calendar-day"];
            let content = "&nbsp;";

            if (day === null) {
                classes.push("is-empty");
            } else {
                content = String(day);

                if (day === weddingDay) {
                    classes.push("is-wedding-day");

                    if (weddingTimeLabel) {
                        content += '<em class="calendar-day-time">' + weddingTimeLabel + "</em>";
                    }
                }
            }

            return '<span class="' + classes.join(" ") + '">' + content + "</span>";
        }).join("");
    }

    function formatKoreanTime(isoDateTime) {
        const match = /T(\d{2}):(\d{2})/.exec(isoDateTime);

        if (!match) {
            throw new Error("Invalid ISO datetime: " + isoDateTime);
        }

        const hours24 = Number(match[1]);
        const minutes = Number(match[2]);
        const period = hours24 < 12 ? "오전" : "오후";
        let hours12 = hours24 % 12;

        if (hours12 === 0) {
            hours12 = 12;
        }

        let label = period + " " + hours12 + "시";

        if (minutes > 0) {
            label += " " + minutes + "분";
        }

        return label;
    }

    return {
        buildCountdown,
        buildCountdownParts,
        buildElapsedParts,
        buildCalendarWeeks,
        buildCalendarMarkup,
        formatKoreanTime
    };
}));
