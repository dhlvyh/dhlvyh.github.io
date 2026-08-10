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

    assert.match(html, /class="couple-intro"/);

    const introIndex = html.indexOf('class="couple-intro"');
    const messageIndex = html.indexOf('class="couple-message');

    assert.notEqual(introIndex, -1, "expected couple intro paragraph");
    assert.notEqual(messageIndex, -1, "expected couple message paragraph");
    assert.ok(introIndex < messageIndex, "expected intro before existing couple message");
});

test("index.html adds parent names and a contact toggle to each couple card", () => {
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

    assert.match(html, /class="couple-parents"[^>]*>[^<]*아버지 성함[^<]*·[^<]*어머니 성함[^<]*딸/);
    assert.match(html, /class="couple-parents"[^>]*>[^<]*아버지 성함[^<]*·[^<]*어머니 성함[^<]*아들/);

    assert.match(html, /data-accordion-toggle[^>]+aria-controls="contact-panel-bride"/);
    assert.match(html, /data-accordion-toggle[^>]+aria-controls="contact-panel-groom"/);

    assert.match(html, /id="contact-panel-bride"[^>]*hidden/);
    assert.match(html, /id="contact-panel-groom"[^>]*hidden/);

    const telLinks = html.match(/href="tel:01000000000"/g) || [];
    assert.equal(telLinks.length, 4);
});
