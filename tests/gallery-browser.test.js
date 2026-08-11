const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawn } = require("node:child_process");

const PORT = 4173;
let serverProcess = null;

test.before(async () => {
    serverProcess = spawn(process.env.PYTHON_BIN, ["-m", "http.server", String(PORT)], {
        cwd: path.resolve(__dirname, ".."),
        stdio: "ignore"
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
});

test.after(() => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

test("gallery rail drag advances to the next page and snaps into place", async () => {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_BIN
    });
    const page = await browser.newPage({viewport: {width: 1400, height: 1200}});

    await page.goto("http://127.0.0.1:" + PORT + "/index.html", {waitUntil: "domcontentloaded"});

    const viewport = page.locator(".gallery-pager-viewport");
    const track = page.locator("#gallery-track");
    const box = await viewport.boundingBox();

    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(400);

    const transform = await track.evaluate((node) => node.style.transform);
    const viewportWidth = await viewport.evaluate((node) => node.clientWidth);

    assert.equal(transform, "translateX(" + (-viewportWidth) + "px)");
    assert.equal(await page.locator("#gallery-pager-prev").isDisabled(), false);

    await browser.close();
});

test("gallery pager buttons are disabled at the first and last page", async () => {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_BIN
    });
    const page = await browser.newPage({viewport: {width: 1400, height: 1200}});

    await page.goto("http://127.0.0.1:" + PORT + "/index.html", {waitUntil: "domcontentloaded"});

    assert.equal(await page.locator("#gallery-pager-prev").isDisabled(), true);

    const dotCount = await page.locator(".gallery-pager-dot").count();

    for (let step = 1; step < dotCount; step += 1) {
        await page.locator("#gallery-pager-next").click();
        await page.waitForTimeout(400);
    }

    assert.equal(await page.locator("#gallery-pager-next").isDisabled(), true);

    await browser.close();
});

test("fullscreen viewer keeps the active slide centered without drift across repeated navigation", async () => {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_BIN
    });
    const page = await browser.newPage({viewport: {width: 1400, height: 1200}});

    await page.goto("http://127.0.0.1:" + PORT + "/index.html", {waitUntil: "domcontentloaded"});
    await page.locator("#gallery-track [data-gallery-item]").first().click();

    const viewerTrack = page.locator("#gallery-viewer-track");
    const countText = await page.locator("#gallery-viewer-count").textContent();
    const total = Number(countText.split(" / ")[1]);

    assert.ok(total > 1, "expected more than one gallery item to navigate through");

    const slideWidth = await viewerTrack.evaluate((node) => node.clientWidth);

    for (let index = 1; index < total; index += 1) {
        await page.locator("#gallery-viewer-next").click();
        await page.waitForTimeout(350);

        const transform = await viewerTrack.evaluate((node) => node.style.transform);
        const expectedTranslateX = -index * slideWidth;

        assert.equal(transform, "translateX(" + expectedTranslateX + "px)");
    }

    assert.equal(await page.locator("#gallery-viewer-count").textContent(), total + " / " + total);

    const viewerBox = await viewerTrack.boundingBox();
    const beforeTransform = await viewerTrack.evaluate((node) => node.style.transform);

    await page.mouse.move(viewerBox.x + viewerBox.width * 0.2, viewerBox.y + viewerBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(viewerBox.x + viewerBox.width * 0.75, viewerBox.y + viewerBox.height / 2, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(350);

    assert.equal(await page.locator("#gallery-viewer-count").textContent(), total + " / " + total);
    assert.equal(await viewerTrack.evaluate((node) => node.style.transform), beforeTransform);

    await browser.close();
});
