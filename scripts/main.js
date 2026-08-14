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
    initScrollReveal();

    if (window.WeddingUtils) {
        const countdown = window.WeddingUtils.buildCountdown(WEDDING_DATE);
        const weeks = window.WeddingUtils.buildCalendarWeeks(WEDDING_YEAR, WEDDING_MONTH_INDEX);
        const weddingTimeLabel = window.WeddingUtils.formatKoreanTime(WEDDING_DATETIME_ISO);
        const calendarMarkup = window.WeddingUtils.buildCalendarMarkup(weeks, WEDDING_DAY);

        setText("#wedding-countdown-copy", countdown.copy);
        setText("#wedding-calendar-time", "예식 시간 " + weddingTimeLabel);

        const grid = document.querySelector("#wedding-calendar-grid");
        if (grid) {
            grid.innerHTML = calendarMarkup;
        }
    }

    if (window.PetalFall) {
        window.PetalFall.init();
    }

    initCountdownTicker();
    initTogetherOdometer();

    loadGallery();

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

// AOS(css 26KB + js 12KB)를 대체한다. 쓰던 효과가 fade-up 하나뿐이라
// IntersectionObserver 한 개면 충분하다.
//
// 숨김 CSS는 html.has-reveal 아래에만 걸려 있다. 여기서 클래스를 붙이기
// 전까지는 아무것도 숨지 않으므로, JS가 실패해도 본문이 사라지지 않는다.
function initScrollReveal() {
    const targets = document.querySelectorAll("[data-aos]");

    if (targets.length === 0) {
        return;
    }

    // IntersectionObserver가 없으면 그냥 다 보이는 상태로 둔다
    if (!("IntersectionObserver" in window)) {
        return;
    }

    document.documentElement.classList.add("has-reveal");

    targets.forEach(function (target) {
        const delay = Number(target.dataset.aosDelay || 0);
        if (delay > 0) {
            target.style.setProperty("--reveal-delay", delay + "ms");
        }
    });

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target); // once: true
        });
    }, {rootMargin: "0px 0px -80px 0px"});

    targets.forEach(function (target) {
        observer.observe(target);
    });
}

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

function loadGallery() {
    if (!window.GalleryLoader || !window.GalleryViewer) {
        return;
    }

    fetch("images/gallery/manifest.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (manifest) {
            const track = document.querySelector("#gallery-main-track");
            const thumbGrid = document.querySelector("#gallery-thumb-grid");

            if (!track || !thumbGrid || !Array.isArray(manifest) || manifest.length === 0) {
                return;
            }

            track.innerHTML = window.GalleryLoader.buildGallerySlidesMarkup(manifest);
            thumbGrid.innerHTML = window.GalleryLoader.buildGalleryThumbsMarkup(manifest);

            // 뷰어보다 먼저 초기화해야 첫 goToIndex(0)에서 이미 배선돼 있다
            const collapse = window.GalleryCollapse
                ? window.GalleryCollapse.initCollapse({
                    gridSelector: "#gallery-thumb-grid",
                    wrapperSelector: "#gallery-thumb-more",
                    toggleSelector: "#gallery-thumb-toggle"
                })
                : null;

            window.GalleryViewer.initGallery({
                viewportSelector: "#gallery-main-viewport",
                trackSelector: "#gallery-main-track",
                thumbGridSelector: "#gallery-thumb-grid",
                prevSelector: "#gallery-main-prev",
                nextSelector: "#gallery-main-next",
                onIndexChange: collapse ? collapse.ensureIndexVisible : null
            });
        })
        .catch(function () {
            // 매니페스트를 불러오지 못해도 나머지 페이지 기능은 그대로 동작해야 한다
        });
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
        icon.setAttribute("href", playing ? "#i-pause" : "#i-music");
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
            imageUrl: SITE_URL + "images/opt/share.jpg",
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
