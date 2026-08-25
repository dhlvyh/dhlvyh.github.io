const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("index.html exposes the lightbox viewer and thumbnail grid mounts, populated at runtime", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /id="gallery-lightbox-viewport"/);
    assert.match(html, /id="gallery-lightbox-prev"/);
    assert.match(html, /id="gallery-lightbox-next"/);

    // 슬라이드/썸네일은 더 이상 정적 마크업이 아니라 gallery-loader.js가
    // images/gallery/manifest.json을 읽어 런타임에 채운다 (사진 개수가 바뀌어도
    // index.html을 다시 손댈 필요가 없도록).
    assert.match(html, /<div aria-label="웨딩 사진 갤러리" class="gallery-main-track" id="gallery-lightbox-track"><\/div>/);
    assert.match(html, /<div aria-label="갤러리 사진 목록"[^>]+id="gallery-thumb-grid"><\/div>/);
    assert.doesNotMatch(html, /data-gallery-slide-index="\d+"/);
    assert.doesNotMatch(html, /data-gallery-thumb-index="\d+"/);

    assert.doesNotMatch(html, /id="gallery-viewer"/);
    assert.doesNotMatch(html, /class="gallery-pager"/);
    assert.doesNotMatch(html, /id="gallery-main-track"/);
});

test("index.html titles the section 갤러리, not 포토 갤러리", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, />갤러리<\/h2>/);
    assert.doesNotMatch(html, /포토 갤러리/);
});

test("index.html exposes a full-screen gallery lightbox modal", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="gallery-lightbox" id="gallery-lightbox" hidden/);
    assert.match(html, /id="gallery-lightbox-close"/);
    assert.match(html, /data-lightbox-close/);
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
    assert.match(html, /class="event-venue"><a href="https:\/\/thenewwed\.kr\/"[^>]*>더뉴컨벤션 2층 더뉴홀<\/a><\/p>/);

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
    const events = html.slice(html.indexOf('<div class="ww-section" id="events">'), html.indexOf('<div class="ww-section" id="together">'));

    assert.doesNotMatch(events, /class="countdown-header"/);
    assert.match(events, /class="event-datetime"/);
    assert.match(events, /class="event-venue"/);
    assert.match(events, /id="wedding-countdown-label"/);
    assert.match(events, /id="wedding-calendar-grid"/);
    assert.ok(events.indexOf('class="event-venue"') < events.indexOf('id="wedding-countdown-label"'));
    assert.ok(events.indexOf('id="wedding-countdown-label"') < events.indexOf('id="wedding-calendar-grid"'));
});

test("the removed venue image is absent from the project", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    const venueImage = path.resolve(__dirname, "../images/opt/hall.webp");

    assert.equal(fs.existsSync(venueImage), false);
    assert.doesNotMatch(html, /hall\.webp/);
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
    assert.match(html, /class="closing-message"/);

    const accountSectionIndex = html.indexOf('id="account-info"');
    const closingSectionIndex = html.indexOf('id="closing"');

    assert.ok(accountSectionIndex !== -1 && closingSectionIndex !== -1 && accountSectionIndex < closingSectionIndex,
        "expected the closing section after the account-info section");
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

    for (const id of ["home", "greeting", "couple", "events", "together", "gallery", "map", "account-info"]) {
        assert.ok(linked.includes(id), `drawer is missing a link to #${id}`);
    }
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

test("index.html mounts the pagination nav outside the thumbnail grid", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /id="gallery-pagination"[^>]*hidden/);
    assert.match(html, /id="gallery-page-numbers"/);
    assert.match(html, /data-page-action="first"/);
    assert.match(html, /data-page-action="prev"/);
    assert.match(html, /data-page-action="next"/);
    assert.match(html, /data-page-action="last"/);

    // 페이지네이션이 그리드 안에 들어가면 gallery-viewer의 children 인덱스가 밀린다
    const gridTag = html.match(/<div[^>]*id="gallery-thumb-grid"[^>]*><\/div>/);
    assert.ok(gridTag, "expected the thumb grid to stay an empty container");

    const gridEnd = html.indexOf(gridTag[0]) + gridTag[0].length;
    const paginationIndex = html.indexOf('id="gallery-pagination"');
    assert.ok(paginationIndex > gridEnd, "expected the pagination nav to sit after the grid, not inside it");
});

test("index.html loads gallery-pagination.js before main.js", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /<script defer src="scripts\/gallery-pagination\.js"><\/script>/);
    assert.doesNotMatch(html, /gallery-collapse\.js/);

    const paginationIndex = html.indexOf("scripts/gallery-pagination.js");
    const mainJsIndex = html.indexOf("scripts/main.js");

    assert.ok(paginationIndex !== -1 && paginationIndex < mainJsIndex,
        "expected gallery-pagination.js before main.js");
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
    assert.match(cssBlock(".hero-eyebrow"), /font-size:\s*1\.5rem;/i);
    assert.match(cssBlock(".hero-photo-full .hero-eyebrow"), /color:\s*#fff;/i);
    assert.match(cssBlock(".ww-title"), /font-size:\s*1\.45rem;/i);
    assert.match(cssBlock(".greeting-message"), /font-size:\s*0\.875rem;/i);
});

test("content buttons use white rectangular surfaces without outlines", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../styles/main.css"), "utf8");

    function cssBlock(selector) {
        const start = css.indexOf(selector + " {");
        assert.notEqual(start, -1, `missing CSS block: ${selector}`);
        const end = css.indexOf("}", start);
        return css.slice(start, end);
    }

    for (const selector of [".couple-contact-open", ".account-accordion-toggle", ".gallery-page-nav,\n.gallery-page-number"]) {
        const block = cssBlock(selector);
        assert.match(block, /border:\s*0;/i, selector);
        assert.match(block, /border-radius:\s*4px;/i, selector);
        assert.match(block, /background:\s*#fff;/i, selector);
        assert.match(block, /box-shadow:/i, selector);
    }
});
