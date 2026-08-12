// 청첩장 전역 초기화 — 카운트다운/달력, 갤러리, 계좌, 목차 드로어, 배경음악을 묶는다
const WEDDING_DATE = "2026-11-01";
const WEDDING_DATETIME_ISO = "2026-11-01T11:00:00+09:00";
const WEDDING_YEAR = 2026;
const WEDDING_MONTH_INDEX = 10;
const WEDDING_DAY = 1;
const RELATIONSHIP_START_ISO = "2023-07-01T00:00:00+09:00";

// TODO: Kakao Developers(https://developers.kakao.com)에서 앱을 등록하고
// 발급받은 JavaScript 키로 교체한다. 등록한 앱의 플랫폼 > Web에 이 사이트
// 도메인(dhlvyh.github.io)을 추가해야 실제로 공유가 동작한다.
const KAKAO_JS_KEY = "779686afc372d325a6fe9a8dadcad2d0";
const SITE_URL = "https://dhlvyh.github.io/";

document.addEventListener("DOMContentLoaded", function () {
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

        setText("#wedding-countdown-copy", countdown.copy);

        const grid = document.querySelector("#wedding-calendar-grid");
        if (grid) {
            grid.innerHTML = calendarMarkup;
        }
    }

    initCountdownTicker();
    initTogetherOdometer();

    if (window.GalleryViewer) {
        window.GalleryViewer.initGallery({
            viewportSelector: "#gallery-main-viewport",
            trackSelector: "#gallery-main-track",
            thumbGridSelector: "#gallery-thumb-grid",
            prevSelector: "#gallery-main-prev",
            nextSelector: "#gallery-main-next"
        });
    }

    if (window.AccountInfo) {
        window.AccountInfo.initAccountInfo({
            accordionToggleSelector: "[data-accordion-toggle]",
            copySelector: ".account-copy-btn"
        });
    }

    const goToTop = document.getElementById("go-to-top");
    if (goToTop) {
        goToTop.addEventListener("click", function () {
            window.scrollTo({top: 0, behavior: "smooth"});
        });
    }

    initNavDrawer();
    initContactSheet();
    initSmoothScroll();
    initMusicToggle();
    initKakaoShare();
});

function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

function initCountdownTicker() {
    if (!window.WeddingUtils) {
        return;
    }

    const days = document.querySelector("[data-countdown-days]");
    const hours = document.querySelector("[data-countdown-hours]");
    const minutes = document.querySelector("[data-countdown-minutes]");
    const seconds = document.querySelector("[data-countdown-seconds]");

    if (!days || !hours || !minutes || !seconds) {
        return;
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function tick() {
        const parts = window.WeddingUtils.buildCountdownParts(WEDDING_DATETIME_ISO);

        days.textContent = String(parts.days);
        hours.textContent = pad(parts.hours);
        minutes.textContent = pad(parts.minutes);
        seconds.textContent = pad(parts.seconds);
    }

    tick();
    window.setInterval(tick, 1000);
}

function initTogetherOdometer() {
    if (!window.WeddingUtils || !window.Odometer) {
        return;
    }

    const groups = Array.from(document.querySelectorAll("[data-odometer-role]")).map(function (container) {
        return {
            container,
            role: container.dataset.odometerRole,
            length: Number(container.dataset.odometerLength || 2)
        };
    });

    if (groups.length === 0) {
        return;
    }

    groups.forEach(function (group) {
        group.container.innerHTML = window.Odometer.buildOdometerMarkup(group.length);
    });

    function tick() {
        const parts = window.WeddingUtils.buildElapsedParts(RELATIONSHIP_START_ISO);

        groups.forEach(function (group) {
            const value = parts[group.role];
            const padded = window.Odometer.padNumber(value == null ? 0 : value, group.length);
            window.Odometer.updateOdometerCells(group.container, padded);
        });
    }

    tick();
    window.setInterval(tick, 1000);
}

function initNavDrawer() {
    const drawer = document.getElementById("nav-drawer");
    const openButton = document.getElementById("nav-drawer-open");

    if (!drawer || !openButton) {
        return;
    }

    let lastFocused = null;

    function open() {
        lastFocused = document.activeElement;
        drawer.hidden = false;
        // hidden 해제 직후 트랜지션이 걸리도록 다음 프레임에 클래스를 붙인다
        requestAnimationFrame(function () {
            drawer.classList.add("is-open");
        });
        openButton.setAttribute("aria-expanded", "true");
        document.body.classList.add("is-drawer-open");

        const closeButton = document.getElementById("nav-drawer-close");
        if (closeButton) {
            closeButton.focus();
        }
    }

    function close() {
        drawer.classList.remove("is-open");
        openButton.setAttribute("aria-expanded", "false");
        document.body.classList.remove("is-drawer-open");

        window.setTimeout(function () {
            drawer.hidden = true;
        }, 280);

        if (lastFocused) {
            lastFocused.focus({preventScroll: true});
        }
    }

    openButton.addEventListener("click", open);

    // 캡처 단계에서 닫는다. 목차 링크의 스크롤 핸들러보다 먼저 실행돼야
    // body의 overflow 잠금이 풀린 뒤 스크롤이 걸린다.
    drawer.addEventListener("click", function (event) {
        if (event.target.closest("[data-drawer-close]") || event.target.closest(".nav-drawer-list a")) {
            close();
        }
    }, true);

    const closeButton = document.getElementById("nav-drawer-close");
    if (closeButton) {
        closeButton.addEventListener("click", close);
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !drawer.hidden) {
            close();
        }
    });

    const copyButton = document.getElementById("copy-invitation-link");
    if (copyButton) {
        copyButton.addEventListener("click", function () {
            copyInvitationLink(copyButton);
        });
    }
}

function initContactSheet() {
    const sheet = document.getElementById("contact-sheet");
    const openButton = document.getElementById("contact-sheet-open");
    const closeButton = document.getElementById("contact-sheet-close");

    if (!sheet || !openButton) {
        return;
    }

    let lastFocused = null;

    function open() {
        lastFocused = document.activeElement;
        sheet.hidden = false;
        requestAnimationFrame(function () {
            sheet.classList.add("is-open");
        });
        openButton.setAttribute("aria-expanded", "true");
        document.body.classList.add("is-contact-sheet-open");

        if (closeButton) {
            closeButton.focus();
        }
    }

    function close() {
        sheet.classList.remove("is-open");
        openButton.setAttribute("aria-expanded", "false");
        document.body.classList.remove("is-contact-sheet-open");

        window.setTimeout(function () {
            sheet.hidden = true;
        }, 300);

        if (lastFocused) {
            lastFocused.focus({preventScroll: true});
        }
    }

    openButton.addEventListener("click", open);

    sheet.addEventListener("click", function (event) {
        if (event.target.closest("[data-contact-close]")) {
            close();
        }
    }, true);

    if (closeButton) {
        closeButton.addEventListener("click", close);
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !sheet.hidden) {
            close();
        }
    });
}

function copyInvitationLink(button) {
    const label = button.querySelector("span");
    if (!label) {
        return;
    }

    const original = label.innerHTML;

    function done(message) {
        label.textContent = message;
        window.setTimeout(function () {
            label.innerHTML = original;
        }, 1600);
    }

    const url = window.location.href.split("#")[0];

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(
            function () {
                done("복사됨");
            },
            function () {
                done("복사 실패");
            }
        );
        return;
    }

    // http로 열린 경우 clipboard API를 못 쓰므로 임시 입력창으로 대체한다
    const helper = document.createElement("textarea");
    helper.value = url;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();

    let copied = false;
    try {
        copied = document.execCommand("copy");
    } catch {
        copied = false;
    }

    document.body.removeChild(helper);
    done(copied ? "복사됨" : "복사 실패");
}

function initSmoothScroll() {
    document.querySelectorAll("a.smooth-scroll").forEach(function (link) {
        link.addEventListener("click", function (event) {
            const target = document.querySelector(link.getAttribute("href"));
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({behavior: "smooth", block: "start"});

            if (!target.hasAttribute("tabindex")) {
                target.setAttribute("tabindex", "-1");
            }
            target.focus({preventScroll: true});
        });
    });
}

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

function shareToKakao() {
    if (!window.Kakao) {
        window.alert("카카오 공유를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
    }

    if (!KAKAO_JS_KEY || KAKAO_JS_KEY === "YOUR_KAKAO_JS_KEY") {
        window.alert("카카오톡 공유를 사용하려면 Kakao Developers에서 발급받은 JS 키를 먼저 등록해야 합니다.");
        return;
    }

    if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
    }

    window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
            title: "안용현 ♥ 안다혜 결혼식에 초대합니다",
            description: "2026년 11월 1일 일요일 11:00 AM · 더뉴컨벤션 2층 더뉴홀",
            imageUrl: SITE_URL + "images/main.jpg",
            link: {
                mobileWebUrl: SITE_URL,
                webUrl: SITE_URL
            }
        },
        buttons: [
            {
                title: "청첩장 보기",
                link: {
                    mobileWebUrl: SITE_URL,
                    webUrl: SITE_URL
                }
            }
        ]
    });
}

function initKakaoShare() {
    const buttons = [
        document.getElementById("kakao-share-button"),
        document.getElementById("kakao-share-drawer-button")
    ].filter(Boolean);

    buttons.forEach(function (button) {
        button.addEventListener("click", shareToKakao);
    });
}
