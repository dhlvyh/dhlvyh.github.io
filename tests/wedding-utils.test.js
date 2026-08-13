const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const WeddingUtils = require("../scripts/wedding-utils");
const {
    buildCountdown,
    buildCountdownParts,
    buildElapsedParts,
    buildCalendarWeeks,
    buildCalendarMarkup
} = WeddingUtils;

test("buildCountdown returns D-453 and copy on 2026-08-05 for 2027-11-01", () => {
    const countdown = buildCountdown("2027-11-01", new Date(2026, 7, 5));
    assert.equal(countdown.days, 453);
    assert.equal(countdown.label, "D-453");
    assert.equal(countdown.copy, "예식일까지 453일 남았습니다.");
});

test("buildCountdown returns D-Day copy on the wedding date", () => {
    const countdown = buildCountdown("2027-11-01", new Date(2027, 10, 1));
    assert.equal(countdown.days, 0);
    assert.equal(countdown.label, "D-Day");
    assert.equal(countdown.copy, "오늘이 바로 결혼식 날입니다.");
});

test("buildCountdownParts splits the remaining time into days/hours/minutes/seconds", () => {
    // 2026-08-07T11:00:00+09:00 기준 정확히 2일 4시간 4분 5초 전
    const parts = buildCountdownParts("2026-08-07T11:00:00+09:00", new Date("2026-08-05T06:55:55+09:00"));

    assert.equal(parts.days, 2);
    assert.equal(parts.hours, 4);
    assert.equal(parts.minutes, 4);
    assert.equal(parts.seconds, 5);
    assert.equal(parts.isPast, false);
});

test("buildCountdownParts clamps to zero once the target has passed", () => {
    const parts = buildCountdownParts("2026-08-01T11:00:00+09:00", new Date("2026-08-05T00:00:00+09:00"));

    assert.equal(parts.days, 0);
    assert.equal(parts.hours, 0);
    assert.equal(parts.minutes, 0);
    assert.equal(parts.seconds, 0);
    assert.equal(parts.isPast, true);
});

test("buildElapsedParts counts full years before this year's anniversary has occurred", () => {
    const parts = buildElapsedParts("2023-07-01T00:00:00+09:00", new Date("2026-06-30T12:00:00+09:00"));

    assert.equal(parts.years, 2);
});

test("buildElapsedParts rolls the year over once the anniversary date passes", () => {
    const parts = buildElapsedParts("2023-07-01T00:00:00+09:00", new Date("2026-07-02T00:00:00+09:00"));

    assert.equal(parts.years, 3);
    assert.equal(parts.days, 1);
});

test("buildElapsedParts reports hours/minutes/seconds elapsed since the last anniversary day", () => {
    const parts = buildElapsedParts("2023-07-01T00:00:00+09:00", new Date("2026-07-03T05:30:45+09:00"));

    assert.equal(parts.days, 2);
    assert.equal(parts.hours, 5);
    assert.equal(parts.minutes, 30);
    assert.equal(parts.seconds, 45);
});

test("buildCalendarWeeks places day 1 in the Monday column for November 2027", () => {
    const weeks = buildCalendarWeeks(2027, 10);

    assert.equal(weeks[0][1], 1);
    assert.equal(weeks[4][2], 30);
});

test("buildCalendarMarkup highlights the wedding day", () => {
    const weeks = buildCalendarWeeks(2027, 10);
    const markup = buildCalendarMarkup(weeks, 1);

    assert.match(markup, /calendar-day is-wedding-day/);
    assert.match(markup, />1</);
});

test("index.html contains countdown and calendar mount points", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /id="wedding-countdown-label"/);
    assert.match(html, /id="wedding-countdown-copy"/);
    assert.match(html, /id="wedding-calendar-grid"/);
});

test("formatKoreanTime formats morning times without a minute suffix", () => {
    assert.equal(WeddingUtils.formatKoreanTime("2026-11-01T11:00:00+09:00"), "오전 11시");
});

test("formatKoreanTime formats afternoon times with minutes", () => {
    assert.equal(WeddingUtils.formatKoreanTime("2026-11-01T13:50:00+09:00"), "오후 1시 50분");
});

test("formatKoreanTime treats midnight as 오전 12시 and noon as 오후 12시", () => {
    assert.equal(WeddingUtils.formatKoreanTime("2026-11-01T00:00:00+09:00"), "오전 12시");
    assert.equal(WeddingUtils.formatKoreanTime("2026-11-01T12:00:00+09:00"), "오후 12시");
});

