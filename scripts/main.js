const WEDDING_DATE = "2026-11-01";
const WEDDING_YEAR = 2026;
const WEDDING_MONTH_INDEX = 10;
const WEDDING_DAY = 1;

$(document).ready(function () {
    if (window.WeddingUtils) {
        const countdown = window.WeddingUtils.buildCountdown(WEDDING_DATE);
        const weeks = window.WeddingUtils.buildCalendarWeeks(WEDDING_YEAR, WEDDING_MONTH_INDEX);
        const calendarMarkup = window.WeddingUtils.buildCalendarMarkup(weeks, WEDDING_DAY);

        $("#wedding-countdown-label").text(countdown.label);
        $("#wedding-countdown-copy").text(countdown.copy);
        $("#wedding-calendar-grid").html(calendarMarkup);
    }

    if (window.GalleryViewer) {
        window.GalleryViewer.initGalleryViewer({
            trackSelector: "#gallery-track",
            itemSelector: "[data-gallery-item]",
            viewerSelector: "#gallery-viewer"
        });
    }

    if (window.AccountInfo) {
        window.AccountInfo.initAccountInfo({
            toggleSelector: "[data-account-toggle]",
            groupSelector: "[data-account-group]",
            copySelector: ".account-copy-btn"
        });
    }

    $("#go-to-top").click(function () {
        $("html,body").animate({scrollTop: 0}, 400);
        return false;
    });
});

$("a.smooth-scroll").click(function (event) {
    if (
        location.pathname.replace(/^\//, "") === this.pathname.replace(/^\//, "") &&
        location.hostname === this.hostname
    ) {
        let target = $(this.hash);
        target = target.length ? target : $("[name=" + this.hash.slice(1) + "]");

        if (target.length) {
            event.preventDefault();
            $("html, body").animate(
                {
                    scrollTop: target.offset().top
                },
                1000,
                function () {
                    const $target = $(target);
                    $target.focus();

                    if (!$target.is(":focus")) {
                        $target.attr("tabindex", "-1");
                        $target.focus();
                    }
                }
            );
        }
    }
});
