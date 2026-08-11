const WEDDING_DATE = "2026-11-01";
const WEDDING_YEAR = 2026;
const WEDDING_MONTH_INDEX = 10;
const WEDDING_DAY = 1;

const NAV_COLLAPSED_HEIGHT = $(".ww-nav-bar").outerHeight() || 0;

$(document).ready(function () {
    if (window.AOS) {
        window.AOS.init({
            duration: 700,
            easing: "ease-out-cubic",
            offset: 80,
            once: true
        });
    }

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
            accordionToggleSelector: "[data-accordion-toggle]",
            copySelector: ".account-copy-btn"
        });
    }

    $("#go-to-top").click(function () {
        $("html,body").animate({scrollTop: 0}, 400);
        return false;
    });

    initMusicToggle();
});

function initMusicToggle() {
    const player = document.getElementById("player");
    const button = document.getElementById("music-toggle");
    const icon = document.getElementById("music-toggle-icon");

    if (!player || !button || !icon) {
        return;
    }

    function render(playing) {
        button.setAttribute("aria-pressed", String(playing));
        button.setAttribute("aria-label", playing ? "배경음악 정지" : "배경음악 재생");
        icon.classList.toggle("fa-music", !playing);
        icon.classList.toggle("fa-pause", playing);
    }

    button.addEventListener("click", function () {
        if (player.paused) {
            player.play().catch(function () {
                render(false);
            });
        } else {
            player.pause();
        }
    });

    player.addEventListener("play", function () {
        render(true);
    });

    player.addEventListener("pause", function () {
        render(false);
    });
}

$("a.smooth-scroll").click(function (event) {
    if (
        location.pathname.replace(/^\//, "") === this.pathname.replace(/^\//, "") &&
        location.hostname === this.hostname
    ) {
        let target = $(this.hash);
        target = target.length ? target : $("[name=" + this.hash.slice(1) + "]");

        if (target.length) {
            event.preventDefault();

            $("#ww-navbarNav").removeClass("show");

            $("html, body").animate(
                {
                    scrollTop: target.offset().top - NAV_COLLAPSED_HEIGHT
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
