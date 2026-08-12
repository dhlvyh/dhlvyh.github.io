const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("index.html exposes the fullscreen viewer track mount", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /id="gallery-track"/);
    assert.match(html, /id="gallery-viewer"/);
    assert.match(html, /id="gallery-viewer-track"/);
    assert.match(html, /id="gallery-viewer-count"/);
    assert.doesNotMatch(html, /id="gallery-viewer-image"/);
});

test("index.html includes the gallery helper scripts before main.js", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /scripts\/gallery-utils\.js/);
    assert.match(html, /scripts\/gallery-viewer\.js/);
});

test("index.html adds a venue preview block inside the invitation card", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="event-venue-preview"/);
    assert.match(html, /class="event-venue-image"[^>]+src="images\/hall\.jpg"/);
    assert.match(html, /href="https:\/\/thenewwed\.kr\/"/);
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);

    const venuePreviewIndex = html.indexOf('class="event-venue-preview"');
    const metaListIndex = html.indexOf('class="event-meta"');

    assert.notEqual(venuePreviewIndex, -1, "expected venue preview block");
    assert.notEqual(metaListIndex, -1, "expected event metadata list");
    assert.ok(venuePreviewIndex < metaListIndex, "expected venue preview before event metadata");
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

test("index.html adds a couple intro paragraph before the couple message", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="[^"]*couple-intro[^"]*"/);

    const introIndex = html.search(/class="[^"]*couple-intro[^"]*"/);
    const messageIndex = html.indexOf('class="couple-message');

    assert.notEqual(introIndex, -1, "expected couple intro paragraph");
    assert.notEqual(messageIndex, -1, "expected couple message paragraph");
    assert.ok(introIndex < messageIndex, "expected intro before existing couple message");
});

test("index.html adds parent names to each couple card", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    const coupleParents = html.match(/class="couple-parents"/g) || [];
    assert.equal(coupleParents.length, 2);
    assert.match(html, /class="couple-parents"[^>]*>[\s\S]*?딸/);
    assert.match(html, /class="couple-parents"[^>]*>[\s\S]*?아들/);
});

test("index.html exposes a single contact sheet listing all six family members", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    const openButtonTag = html.match(/<button[^>]*id="contact-sheet-open"[^>]*>/);
    assert.ok(openButtonTag, "expected a button with id=contact-sheet-open");
    assert.match(openButtonTag[0], /aria-controls="contact-sheet"/);

    assert.match(html, /id="contact-sheet"[^>]*hidden/);

    const rows = html.match(/class="contact-sheet-row"/g) || [];
    assert.equal(rows.length, 6);

    const telLinks = html.match(/href="tel:[0-9]+"/g) || [];
    const smsLinks = html.match(/href="sms:[0-9]+"/g) || [];
    assert.equal(telLinks.length, 6);
    assert.equal(smsLinks.length, 6);

    const openIndex = html.indexOf('id="contact-sheet-open"');
    const sheetIndex = html.indexOf('id="contact-sheet"');
    assert.ok(openIndex !== -1 && sheetIndex !== -1 && openIndex < sheetIndex,
        "expected the open button to appear before the contact sheet markup");
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
    const transitSection = html.slice(html.indexOf('class="transit-info"'), html.indexOf('class="ww-section bg-light" id="account-info"'));

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
