const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("우리의 시간은 8개의 시점과 순서로 구성된다", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const start = html.indexOf('<div class="ww-section time-section" id="our-time">');
    const end = html.indexOf('<div class="ww-section" id="gallery">');
    const section = html.slice(start, end);
    const labels = [...section.matchAll(/data-time-label="([^"]+)"/g)].map((match) => match[1]);

    assert.notEqual(start, -1);
    assert.notEqual(end, -1);
    assert.ok(start < end);
    assert.deepEqual(labels, ["첫 만남", "0.5주년", "1주년", "1.5주년", "2주년", "2.5주년", "3주년", "결혼"]);
});

test("우리의 시간은 시점별 사진과 설명 규칙을 지킨다", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const start = html.indexOf('<div class="ww-section time-section" id="our-time">');
    const end = html.indexOf('<div class="ww-section" id="gallery">');
    const section = html.slice(start, end);
    const items = [...section.matchAll(/<article class="time-line-item[\s\S]*?<\/article>/g)].map((match) => match[0]);

    assert.equal(items.length, 8);
    assert.equal(items.filter((item) => item.includes("class=\"time-line-photo\"")).length, 7);
    assert.equal(items.filter((item) => item.includes("time-line-panel-copy")).length, 4);
    assert.equal(items.filter((item) => item.includes("data-time-label=\"결혼\"") && item.includes("time-line-photo")).length, 0);
    assert.equal(items.filter((item) => item.includes("data-time-label=\"0.5주년\"") && item.includes("time-line-panel-copy")).length, 0);
    assert.equal(items.filter((item) => item.includes("data-time-label=\"1.5주년\"") && item.includes("time-line-panel-copy")).length, 0);
    assert.equal(items.filter((item) => item.includes("data-time-label=\"2.5주년\"") && item.includes("time-line-panel-copy")).length, 0);
});

test("사진과 설명 패널은 같은 타임라인 행에 배치된다", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    assert.match(css, /\.time-line-panel\s*,\s*\.time-line-final\s*,\s*\.time-line-marker\s*\{[^}]*grid-row:\s*1;/);
});

test("좁은 모바일 폭에서는 타임라인 사진이 줄어든다", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    assert.match(css, /@media\s*\(max-width:\s*360px\)[\s\S]*?\.time-line-panel-photo\s*,\s*\.time-line-panel-photo \.time-line-photo\s*\{[\s\S]*?width:\s*120px;/);
    assert.match(css, /@media\s*\(max-width:\s*360px\)[\s\S]*?\.time-line-panel-photo \.time-line-photo\s*\{[\s\S]*?height:\s*120px;/);
});

test("오도미터 명칭은 우리의 시간 구조에 맞고 투게터 잔여 소스는 없다", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");
    const mainJs = fs.readFileSync(path.resolve(__dirname, "../scripts/main.js"), "utf8");

    assert.match(html, /class="time-odometer" id="time-odometer"/);
    assert.doesNotMatch(html, /together-odometer|id="together"/);
    assert.match(css, /\.time-odometer\s*\{/);
    assert.doesNotMatch(css, /\.together-odometer|\.time-together|\.together-lead/);
    assert.match(mainJs, /initTimeOdometer\(\)/);
    assert.doesNotMatch(mainJs, /initTogetherOdometer/);
});

test("타임라인은 다섯 개 제목만 표시하고 사진을 좌우로 번갈아 배치한다", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const start = html.indexOf('<div class="ww-section time-section" id="our-time">');
    const end = html.indexOf('<div class="ww-section" id="gallery">');
    const section = html.slice(start, end);
    const items = [...section.matchAll(/<article class="time-line-item[\s\S]*?<\/article>/g)].map((match) => match[0]);
    const labels = [...section.matchAll(/data-time-label="([^"]+)"/g)].map((match) => match[1]);
    const titleItems = items.filter((item) => item.includes("time-line-label"));
    const titleLabels = titleItems.map((item) => item.match(/data-time-label="([^"]+)"/)[1]);
    const photoSides = items.slice(0, 7).map((item) => item.includes("is-photo-left") ? "left" : "right");

    assert.deepEqual(titleLabels, [labels[0], labels[2], labels[4], labels[6], labels[7]]);
    assert.doesNotMatch(section, /time-line-body|<mark\b/);
    assert.deepEqual(photoSides, ["left", "right", "left", "right", "left", "right", "left"]);
});

test("타임라인 원본은 전용 WebP 폴더로 변환되고 HTML은 변환 결과를 참조한다", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const buildImages = fs.readFileSync(path.resolve(__dirname, "../tools/build-images.mjs"), "utf8");
    const sources = ["timeline1.jpg", "timeline2.jpg", "timeline3.jpg", "timeline4.jpg", "timeline5.jpg", "timeline6.jpg", "timeline7.jpg"];

    assert.match(buildImages, /const TIMELINE = \[/);
    sources.forEach((source) => assert.match(buildImages, new RegExp(`source: "${source}"`)));
    assert.match(buildImages, /path\.join\(SRC_DIR, "timeline"\)/);
    assert.match(buildImages, /unlink/);
    assert.equal((html.match(/images\/timeline\/[^"']+\.webp/g) || []).length, 7);
    assert.doesNotMatch(html, /images\/gallery\/main\/(10|11|16|22|29|35|38)\.webp/);
});

test("갤러리 원본 파일은 1부터 빈자리 없이 연속 번호를 사용한다", () => {
    const imagesDir = path.resolve(__dirname, "../images");
    const indices = fs.readdirSync(imagesDir)
        .map((name) => name.match(/^gallery(\d+)\.jpg$/i))
        .filter(Boolean)
        .map((match) => Number(match[1]))
        .sort((a, b) => a - b);
    const expected = Array.from({length: indices.length}, (_, index) => index + 1);

    assert.deepEqual(indices, expected);
});

test("index.html exposes the inline gallery viewport and track mounts, populated at runtime", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /id="gallery-viewport"/);
    assert.match(html, /id="gallery-prev"/);
    assert.match(html, /id="gallery-next"/);
    assert.match(html, /id="gallery-progress-fill"/);
    assert.match(html, /id="gallery-counter"/);

    // 슬라이드는 더 이상 정적 마크업이 아니라 gallery-loader.js가
    // images/gallery/manifest.json을 읽어 런타임에 채운다 (사진 개수가 바뀌어도
    // index.html을 다시 손댈 필요가 없도록).
    assert.match(html, /<div aria-label="웨딩 사진 갤러리" class="gallery-main-track" id="gallery-track"><\/div>/);
    assert.doesNotMatch(html, /data-gallery-slide-index="\d+"/);

    assert.doesNotMatch(html, /gallery-thumb-grid|gallery-thumb-index/);
    assert.doesNotMatch(html, /id="gallery-lightbox"/);
});

test("index.html titles the section 갤러리, not 포토 갤러리", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, />갤러리<\/h2>/);
    assert.doesNotMatch(html, /포토 갤러리/);
});

test("index.html includes the gallery helper scripts before main.js", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /scripts\/gallery-utils\.js/);
    assert.match(html, /scripts\/gallery-viewer\.js/);
    assert.match(html, /scripts\/gallery-loader\.js/);

    const loaderIndex = html.indexOf("scripts/gallery-loader.js");
    const mainJsIndex = html.indexOf("scripts/main.js");
    assert.ok(loaderIndex !== -1 && mainJsIndex !== -1 && loaderIndex < mainJsIndex,
        "expected gallery-loader.js before main.js");
});

test("index.html shows the wedding date and venue as two plain lines with no venue photo", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.doesNotMatch(html, /class="event-venue-image"/);
    assert.doesNotMatch(html, /images\/opt\/hall\.webp/);

    assert.match(html, /class="event-datetime">2026년 11월 1일 일요일 11:00 AM<\/p>/);
    assert.match(html, /class="event-venue">더뉴컨벤션 2층 더뉴홀<\/p>/);
    assert.doesNotMatch(html, /class="event-venue">\s*<a\b/);

    const datetimeIndex = html.indexOf('class="event-datetime"');
    const venueIndex = html.indexOf('class="event-venue"');
    assert.ok(datetimeIndex !== -1 && venueIndex !== -1 && datetimeIndex < venueIndex,
        "expected the date line before the venue line");

    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
});

test("index.html embeds Google Maps for 더뉴컨벤션웨딩", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/);

    assert.ok(iframeMatch, "expected a map iframe src");

    const src = iframeMatch[1];
    const decodedSrc = decodeURIComponent(src);

    assert.match(src, /google\.com\/maps\/embed\/v1\/place/);
    assert.match(decodedSrc, /더뉴컨벤션웨딩/);
    assert.match(decodedSrc, /공항대로36길 57/);
});

test("index.html adds the account info nav link", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /href="#account-info">마음 전하실 곳<\/a>/);
});

test("index.html exposes the account info section as independent accordions", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /id="account-info"/);
    assert.match(html, /data-accordion-toggle[^>]+aria-controls="account-panel-groom"/);
    assert.match(html, /data-accordion-toggle[^>]+aria-controls="account-panel-bride"/);
    assert.match(html, /id="account-panel-groom"/);
    assert.match(html, /id="account-panel-bride"/);

    const copyButtons = html.match(/class="account-copy-btn"/g) || [];

    assert.equal(copyButtons.length, 6);
});

test("index.html includes the account info scripts before main.js", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /scripts\/account-utils\.js/);
    assert.match(html, /scripts\/account-info\.js/);

    const accountInfoIndex = html.indexOf("scripts/account-info.js");
    const mainJsIndex = html.indexOf("scripts/main.js");

    assert.notEqual(accountInfoIndex, -1, "expected account-info.js script tag");
    assert.ok(accountInfoIndex < mainJsIndex, "expected account-info.js before main.js");
});

test("index.html adds parent names to each couple card", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    const coupleParents = html.match(/class="couple-parents"/g) || [];
    assert.equal(coupleParents.length, 2);
    assert.match(html, /class="couple-parents"[^>]*>[\s\S]*?딸/);
    assert.match(html, /class="couple-parents"[^>]*>[\s\S]*?아들/);
});

test("index.html exposes direct couple contact links and removes the general contact sheet", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    const coupleStart = html.indexOf('class="couple-grid"');
    const coupleEnd = html.indexOf('<div class="ww-section" id="events">');
    const coupleHtml = html.slice(coupleStart, coupleEnd);

    assert.equal((coupleHtml.match(/class="couple-card-actions"/g) || []).length, 2);
    assert.match(coupleHtml, /href="tel:01094884712"/);
    assert.match(coupleHtml, /href="sms:01094884712"/);
    assert.match(coupleHtml, /href="tel:01045201205"/);
    assert.match(coupleHtml, /href="sms:01045201205"/);
    assert.doesNotMatch(html, /id="contact-sheet-open"/);
    assert.doesNotMatch(html, /id="contact-sheet"/);
});

test("the couple contact button sits directly below the couple grid", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const couple = html.slice(html.indexOf('<div class="ww-section" id="couple">'), html.indexOf('<div class="ww-section" id="events">'));

    assert.ok(couple.indexOf('id="host-contact-sheet-open"') < couple.indexOf('class="couple-ornament"'));
});

test("index.html exposes a host-only contact sheet with just the four parents", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    const openButtonTag = html.match(/<button[^>]*id="host-contact-sheet-open"[^>]*>/);
    assert.ok(openButtonTag, "expected a button with id=host-contact-sheet-open");
    assert.match(openButtonTag[0], /aria-controls="host-contact-sheet"/);

    assert.match(html, /id="host-contact-sheet"[^>]*hidden/);

    const sheetStart = html.indexOf('<div class="contact-sheet" id="host-contact-sheet"');
    const sheetHtml = html.slice(sheetStart);

    const rows = sheetHtml.match(/class="contact-sheet-row"/g) || [];
    assert.equal(rows.length, 4);

    const telLinks = sheetHtml.match(/href="tel:[0-9]+"/g) || [];
    const smsLinks = sheetHtml.match(/href="sms:[0-9]+"/g) || [];
    assert.equal(telLinks.length, 4);
    assert.equal(smsLinks.length, 4);

    const openIndex = html.indexOf('id="host-contact-sheet-open"');
    const sheetIndex = html.indexOf('id="host-contact-sheet"');
    assert.ok(openIndex !== -1 && sheetIndex !== -1 && openIndex < sheetIndex,
        "expected the open button to appear before the host contact sheet markup");
});

test("index.html keeps the event flow flat and removes the countdown header", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const events = html.slice(html.indexOf('<div class="ww-section" id="events">'), html.indexOf('<div class="ww-section ww-rsvp-detail" id="map">'));

    assert.doesNotMatch(events, /class="countdown-header"/);
    assert.match(events, /class="event-datetime"/);
    assert.match(events, /class="event-venue"/);
    assert.match(events, /id="wedding-countdown-label"/);
    assert.match(events, /id="wedding-calendar-grid"/);
    assert.ok(events.indexOf('class="event-venue"') < events.indexOf('id="wedding-countdown-label"'));
    assert.ok(events.indexOf('id="wedding-calendar-grid"') < events.indexOf('id="wedding-countdown-label"'));
    assert.doesNotMatch(events, /calendar-time-caption|wedding-calendar-time/);
});

test("the section order follows the invitation flow and removes the standalone together section", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const sectionOrder = ["home", "greeting", "couple", "our-time", "gallery", "events", "map", "account-info", "closing"]
        .map((id) => html.indexOf(`id="${id}"`));

    assert.ok(sectionOrder.every((index) => index !== -1), "expected all invitation sections");
    assert.deepEqual([...sectionOrder].sort((a, b) => a - b), sectionOrder,
        "expected the sections to follow the requested page flow");
    assert.equal(html.indexOf('id="together"'), -1, "expected no standalone together section");

    const drawer = html.slice(html.indexOf('class="nav-drawer-list"'));
    const drawerOrder = ["home", "greeting", "couple", "our-time", "gallery", "events", "map", "account-info"]
        .map((id) => drawer.indexOf(`href="#${id}"`));

    assert.deepEqual([...drawerOrder].sort((a, b) => a - b), drawerOrder,
        "expected the drawer to follow the requested page flow");
    assert.doesNotMatch(drawer, /href="#together"/);
});

test("the countdown uses enlarged circular units and the couple-specific copy", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");
    const mainJs = fs.readFileSync(path.resolve(__dirname, "../scripts/main.js"), "utf8");

    function cssBlock(selector) {
        const start = css.indexOf(selector + " {");
        assert.notEqual(start, -1, `missing CSS block: ${selector}`);
        const end = css.indexOf("}", start);
        return css.slice(start, end);
    }

    const countdownValues = cssBlock(".countdown-unit-value");
    assert.match(countdownValues, /width:\s*68px;/i);
    assert.match(countdownValues, /height:\s*68px;/i);
    assert.match(countdownValues, /border-radius:\s*50%;/i);
    assert.match(countdownValues, /font-size:\s*1\.45rem;/i);
    assert.match(html, /id="wedding-countdown-copy">\s*용현 ♥ 다혜\s+예식일까지/);
    assert.match(mainJs, /setText\("#wedding-countdown-copy",\s*"용현 ♥ 다혜\s+예식일까지/);
    assert.match(mainJs, /parts\.days/);
});

test("the gallery omits the instructional lead copy", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.doesNotMatch(html, /class="gallery-lead"/);
    assert.doesNotMatch(html, /작은 사진을 누르면 크게 볼 수 있어요/);
});

test("main.js does not populate the removed calendar time caption", () => {
    const mainJs = fs.readFileSync(path.resolve(__dirname, "../scripts/main.js"), "utf8");

    assert.doesNotMatch(mainJs, /wedding-calendar-time/);
});

test("the removed venue image is absent from the project", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const venueImage = path.resolve(__dirname, "../images/opt/hall.webp");

    assert.equal(fs.existsSync(venueImage), false);
    assert.doesNotMatch(html, /hall\.webp/);
});

test("background music attempts autoplay and resumes on the first user interaction", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const mainJs = fs.readFileSync(path.resolve(__dirname, "../scripts/main.js"), "utf8");

    assert.match(html, /<audio(?=[^>]*\bid="player")(?=[^>]*\bautoplay\b)(?=[^>]*\bsrc="mus\.mp3")[^>]*>/);
    assert.match(mainJs, /player\.play\(\)\.catch\(function \(\) \{/);
    assert.match(mainJs, /document\.addEventListener\("pointerdown", resumeOnInteraction/);
    assert.match(mainJs, /document\.addEventListener\("keydown", resumeOnInteraction/);
});

test("index.html adds detailed transit info to the map section", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="transit-info"/);

    const transitTitles = html.match(/class="transit-title"[^>]*>[^<]+</g) || [];
    assert.equal(transitTitles.length, 4);
    assert.match(html, /지하철 이용 시/);
    assert.match(html, /버스 이용 시/);
    assert.match(html, /자가용 이용 시/);
    assert.match(html, /주차 안내/);

    const iframeIndex = html.indexOf("<iframe");
    const transitIndex = html.indexOf('class="transit-info"');

    assert.ok(iframeIndex < transitIndex, "expected transit info after the map iframe");
});

test("index.html fills in the parking policy without leaving OO placeholders", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const transitSection = html.slice(html.indexOf('class="transit-info"'), html.indexOf('class="ww-section" id="account-info"'));

    assert.doesNotMatch(transitSection, /OO/);
    assert.match(transitSection, /지하 4층~지상 1층/);
    assert.match(transitSection, /주차 등록 필수/);
});

test("index.html adds a closing message after the account accordion", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="[^"]*account-closing[^"]*"/);

    const accordionCloseIndex = html.indexOf('class="account-accordion"');
    const closingIndex = html.indexOf('account-closing');

    assert.notEqual(closingIndex, -1, "expected account closing paragraph");
    assert.ok(accordionCloseIndex < closingIndex, "expected closing message after the accordion");
});

test("index.html adds a full-bleed farewell section after the account section", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="closing-section"[^>]+id="closing"/);
    assert.match(html, /class="closing-photo"/);
    assert.doesNotMatch(html, /class="closing-together"/);
    assert.match(html, /class="closing-photo-stage"/);
    assert.match(html, /class="closing-message"/);

    const accountSectionIndex = html.indexOf('id="account-info"');
    const closingSectionIndex = html.indexOf('id="closing"');

    assert.ok(accountSectionIndex !== -1 && closingSectionIndex !== -1 && accountSectionIndex < closingSectionIndex,
        "expected the closing section after the account-info section");
});

test("the closing photo keeps its full-bleed layout", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    assert.match(css, /\.closing-section\s*\{[\s\S]*?background:\s*var\(--ww-paper\);/);
    assert.match(css, /\.closing-photo-stage\s*\{[\s\S]*?position:\s*relative;[\s\S]*?min-height:\s*600px;[\s\S]*?overflow:\s*hidden;/);
    assert.match(css, /\.closing-overlay\s*\{[\s\S]*?justify-content:\s*flex-end;/);
});

test("hero typewriter characters preserve visible spaces", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    assert.match(css, /\.hero-eyebrow-char\s*\{[\s\S]*?white-space:\s*pre;/);
});

test("the hero typewriter label stays on one line with a container-aware size", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    assert.match(html, /class="hero-eyebrow ww-eyebrow">Wedding Invitation<\/p>/);
    assert.doesNotMatch(html, /class="hero-eyebrow ww-eyebrow">Wedding\r?\nInvitation<\/p>/);
    assert.match(css, /\.hero-photo-full\s*\{[\s\S]*?container-type:\s*inline-size;/);
    assert.match(css, /\.hero-eyebrow\s*\{[\s\S]*?font-size:\s*clamp\(1\.8rem,\s*9\.5cqw,\s*2\.7rem\);[\s\S]*?white-space:\s*nowrap;/);
});

test("index.html mounts the petal-fall canvas inside frame-overlay and loads the script", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /<div class="frame-overlay">\s*<canvas id="petal-fall-canvas"/);
    assert.match(html, /<script defer src="scripts\/petal-fall\.js"><\/script>/);

    const petalScriptIndex = html.indexOf("scripts/petal-fall.js");
    const mainJsIndex = html.indexOf("scripts/main.js");
    assert.ok(petalScriptIndex !== -1 && mainJsIndex !== -1 && petalScriptIndex < mainJsIndex,
        "expected petal-fall.js before main.js");
});

test("index.html no longer renders countdown separator spans", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.doesNotMatch(html, /countdown-sep/);
});

test("index.html wires up Kakao share buttons and loads the Kakao JS SDK", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /kakaocdn\.net\/kakao_js_sdk\//);
    assert.match(html, /id="kakao-share-button"/);
    assert.match(html, /id="kakao-share-drawer-button"/);

    const sdkIndex = html.indexOf("kakao_js_sdk");
    const mainJsIndex = html.indexOf("scripts/main.js");
    assert.ok(sdkIndex !== -1 && mainJsIndex !== -1 && sdkIndex < mainJsIndex,
        "expected the Kakao SDK script before main.js");
});

test("index.html adds a greeting section between the hero and the couple section", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="ww-section" id="greeting"/);
    assert.match(html, /소중한 분들을 초대합니다/);
    assert.match(html, /두 사람이 만나 사랑을 배우고/);

    const homeIndex = html.indexOf('id="home"');
    const greetingIndex = html.indexOf('id="greeting"');
    const coupleIndex = html.indexOf('id="couple"');

    assert.ok(homeIndex !== -1 && greetingIndex !== -1 && coupleIndex !== -1,
        "expected home, greeting, and couple sections to all exist");
    assert.ok(homeIndex < greetingIndex && greetingIndex < coupleIndex,
        "expected greeting section between hero and couple section");
});

test("index.html removes the duplicate invitation copy from the events section", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.doesNotMatch(html, /class="event-title"/);
    assert.doesNotMatch(html, /class="event-copy"/);
    assert.doesNotMatch(html, /안용현, 안다혜의 결혼식에 초대합니다/);

    assert.match(html, /class="event-datetime"/);
    assert.match(html, /class="event-venue"/);
});

test("index.html points every share surface at the optimized JPG card", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const mainJs = fs.readFileSync(path.resolve(__dirname, "../scripts/main.js"), "utf8");

    // 카카오 스크래퍼는 WebP를 못 읽고 대용량 원본은 타임아웃으로 썸네일이 빈다
    assert.match(html, /property="og:image" content="[^"]+\/images\/opt\/share\.jpg"/);
    assert.match(html, /name="twitter:image" content="[^"]+\/images\/opt\/share\.jpg"/);
    assert.match(mainJs, /imageUrl: SITE_URL \+ "images\/opt\/share\.jpg"/);

    assert.doesNotMatch(html, /images\/main\.jpg/);
    assert.doesNotMatch(mainJs, /images\/main\.jpg/);
});

test("index.html loads fonts in one preconnected request with display=swap", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    const fontLinks = html.match(/<link[^>]+fonts\.googleapis\.com\/css/g) || [];
    assert.equal(fontLinks.length, 1, "expected a single combined Google Fonts request");

    assert.match(html, /rel="preconnect"[^>]*>/);
    assert.match(html, /fonts\.gstatic\.com" rel="preconnect" crossorigin/);
    assert.match(html, /display=swap/);

    // v1 API(css?family=)는 패밀리마다 요청이 따로 나가고 swap도 못 건다
    assert.doesNotMatch(html, /fonts\.googleapis\.com\/css\?family=/);
});

test("index.html drops FontAwesome and AOS in favour of the inline sprite", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.doesNotMatch(html, /font-awesome/);
    assert.doesNotMatch(html, /maxcdn/);
    assert.doesNotMatch(html, /aos\.(css|js)/);
    assert.doesNotMatch(html, /class="fa /);

    assert.match(html, /class="icon-sprite"/);

    // 스프라이트가 참조되는 심볼을 전부 갖고 있어야 한다
    const used = new Set([...html.matchAll(/<use href="#(i-[a-z-]+)"/g)].map((m) => m[1]));
    assert.ok(used.size > 0, "expected <use> icon references");

    for (const id of used) {
        assert.match(html, new RegExp(`<symbol id="${id}"`), `missing sprite symbol: ${id}`);
    }

    // 음악 토글은 JS가 #i-music <-> #i-pause 로 갈아끼운다
    assert.match(html, /<symbol id="i-music"/);
    assert.match(html, /<symbol id="i-pause"/);
});

test("index.html defers every script so parsing is never blocked", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const scripts = html.match(/<script[^>]*src=[^>]*>/g) || [];

    assert.ok(scripts.length > 0, "expected script tags");

    for (const tag of scripts) {
        assert.match(tag, /\sdefer\s/, `expected defer on: ${tag}`);
    }
});

test("index.html lazy-loads the map embed and labels it for screen readers", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const iframe = html.match(/<iframe[^>]*>/);

    assert.ok(iframe, "expected the map iframe");
    assert.match(iframe[0], /title="[^"]+"/);
    assert.match(iframe[0], /loading="lazy"/);
    assert.doesNotMatch(iframe[0], /frameborder/);
});

test("index.html opens the three map services in a new tab", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const mapLinks = html.match(/<a class="map-link"[^>]*>/g) || [];

    assert.equal(mapLinks.length, 3);

    for (const link of mapLinks) {
        assert.match(link, /target="_blank"/);
        assert.match(link, /rel="noopener noreferrer"/);
    }
});

test("index.html lists the greeting section in the drawer table of contents", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /href="#greeting">인사말<\/a>/);

    // 드로어 목차가 실제 섹션을 빠짐없이 가리키는지 확인한다
    const drawer = html.slice(html.indexOf('class="nav-drawer-list"'));
    const linked = [...drawer.matchAll(/href="#([a-z-]+)"/g)].map((m) => m[1]);

    for (const id of ["home", "greeting", "couple", "gallery", "events", "map", "account-info"]) {
        assert.ok(linked.includes(id), `drawer is missing a link to #${id}`);
    }

    assert.doesNotMatch(html, /href="#together">함께한 시간<\/a>/);
});

test("index.html exposes the scroll-to-top control as a real button", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const goToTop = html.match(/<[a-z]+[^>]*id="go-to-top"[^>]*>/);

    assert.ok(goToTop, "expected a go-to-top control");
    assert.match(goToTop[0], /^<button/, "go-to-top must be a button, not a bare <i>");
    assert.match(goToTop[0], /aria-label="[^"]+"/);
});

test("countdown unit labels are consistently pluralised", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const labels = [...html.matchAll(/class="countdown-unit-label">([A-Z]+)</g)].map((m) => m[1]);

    assert.deepEqual(labels, ["DAYS", "HOURS", "MIN", "SEC"]);
});

test("the invitation uses a flat white page and smaller type scale", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    function cssBlock(selector) {
        const start = css.indexOf(selector + " {");
        assert.notEqual(start, -1, `missing CSS block: ${selector}`);
        const end = css.indexOf("}", start);
        return css.slice(start, end);
    }

    assert.match(css, /--ww-paper:\s*#fff;/i);
    assert.match(cssBlock(".page-content"), /background-color:\s*#fff;/i);
    assert.match(cssBlock(".page-content"), /background-image:\s*none;/i);
    assert.match(cssBlock(".hero-eyebrow"), /font-size:\s*clamp\(1\.8rem,\s*9\.5cqw,\s*2\.7rem\);/i);
    assert.doesNotMatch(css, /\.hero-eyebrow\s*\{[\s\S]*?font-size:\s*2\.5rem;/i);
    assert.match(cssBlock(".hero-photo-full .hero-eyebrow"), /color:\s*#fff;/i);
    assert.match(cssBlock(".ww-title"), /font-size:\s*1\.45rem;/i);
    assert.match(cssBlock(".greeting-message"), /font-size:\s*0\.875rem;/i);
});

test("content buttons use white rectangular surfaces without outlines", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8").replace(/\r\n/g, "\n");

    function cssBlock(selector) {
        const start = css.indexOf(selector + " {");
        assert.notEqual(start, -1, `missing CSS block: ${selector}`);
        const end = css.indexOf("}", start);
        return css.slice(start, end);
    }

    for (const selector of [".couple-contact-open", ".account-accordion-toggle"]) {
        const block = cssBlock(selector);
        assert.match(block, /border:\s*0;/i, selector);
        assert.match(block, /border-radius:\s*4px;/i, selector);
        assert.match(block, /background:\s*#fff;/i, selector);
        assert.match(block, /box-shadow:/i, selector);
    }
});

test("the revised layout prioritizes the hero photo and compact date block", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    function cssBlock(selector) {
        const start = css.indexOf(selector + " {");
        assert.notEqual(start, -1, `missing CSS block: ${selector}`);
        const end = css.indexOf("}", start);
        return css.slice(start, end);
    }

    assert.match(cssBlock(".hero-photo-full"), /flex:\s*1\s+1\s+auto;/i);
    assert.match(cssBlock(".hero-photo-full"), /min-height:\s*78%;/i);
    assert.match(cssBlock(".hero-date"), /padding:\s*0\.75rem\s+1rem\s+1rem;/i);
});

test("couple cards center names and use icon-only contact links", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    function cssBlock(selector) {
        const start = css.indexOf(selector + " {");
        assert.notEqual(start, -1, `missing CSS block: ${selector}`);
        const end = css.indexOf("}", start);
        return css.slice(start, end);
    }

    assert.match(cssBlock(".couple-card img"), /aspect-ratio:\s*4\s*\/\s*5;/i);
    assert.match(cssBlock(".couple-card img"), /box-shadow:\s*0 4px 14px rgba\(51,\s*48,\s*44,\s*0\.12\);/i);
    assert.match(cssBlock(".couple-card-name"), /text-align:\s*center;/i);
    assert.match(cssBlock(".couple-card-heading"), /gap:\s*0\.25rem;/i);
    assert.match(cssBlock(".couple-card-heading"), /padding:\s*0;/i);
    assert.match(cssBlock(".couple-card-actions"), /position:\s*static;/i);
    assert.match(cssBlock(".couple-card-action"), /background:\s*transparent;/i);
    assert.match(cssBlock(".couple-card-action"), /box-shadow:\s*none;/i);
    assert.match(cssBlock(".couple-card-action"), /width:\s*auto;/i);
    assert.match(cssBlock(".couple-card-action"), /height:\s*auto;/i);
});

test("the event calendar spans the card and marks the wedding day in pink", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    function cssBlock(selector) {
        const start = css.indexOf(selector + " {");
        assert.notEqual(start, -1, `missing CSS block: ${selector}`);
        const end = css.indexOf("}", start);
        return css.slice(start, end);
    }

    assert.match(cssBlock(".event-card-calendar"), /max-width:\s*none;/i);
    assert.match(cssBlock(".event-card-calendar"), /margin:\s*0;/i);
    assert.match(cssBlock(".calendar-day.is-wedding-day::before"), /background:\s*var\(--ww-accent\);/i);
});

test("event details are de-emphasized and sit closer to the calendar", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    function cssBlock(selector) {
        const start = css.indexOf(selector + " {");
        assert.notEqual(start, -1, `missing CSS block: ${selector}`);
        const end = css.indexOf("}", start);
        return css.slice(start, end);
    }

    assert.match(cssBlock(".event-datetime"), /color:\s*var\(--ww-ink-muted\);/i);
    assert.match(cssBlock(".event-datetime"), /font-weight:\s*400;/i);
    assert.match(cssBlock(".event-venue"), /color:\s*var\(--ww-ink-muted\);/i);
    assert.match(cssBlock(".ww-wedding-event > .stack"), /gap:\s*0\.75rem;/i);
});
