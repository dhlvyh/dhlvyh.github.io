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

test("gallery rail drag snaps to a nearby card column", async () => {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_BIN
    });
    const page = await browser.newPage({viewport: {width: 1400, height: 1200}});

    await page.goto("http://127.0.0.1:" + PORT + "/index.html", {waitUntil: "domcontentloaded"});

    const rail = page.locator("#gallery-track");
    const startScrollLeft = await rail.evaluate((node) => node.scrollLeft);
    const box = await rail.boundingBox();

    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(350);

    const endScrollLeft = await rail.evaluate((node) => node.scrollLeft);

    assert.notEqual(endScrollLeft, startScrollLeft);
    assert.equal(endScrollLeft % 1, 0);

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
