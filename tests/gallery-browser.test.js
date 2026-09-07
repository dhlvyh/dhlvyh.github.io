const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawn } = require("node:child_process");

const PORT = 4173;
let serverProcess = null;

// playwright는 devDependency가 아니라 선택 설치다(브라우저 바이너리가 무거워서).
// 없으면 이 파일 전체를 건너뛴다 — 예전에는 PYTHON_BIN=undefined로 spawn하다
// before 훅에서 5건이 통째로 실패해서 `npm test`가 늘 빨간불이었다.
const hasPlaywright = (() => {
    try {
        require.resolve("playwright");
        return true;
    } catch {
        return false;
    }
})();

test.before(async (t) => {
    if (!hasPlaywright) {
        return;
    }

    // 파이썬 대신 이 저장소의 개발 서버를 쓴다. 별도 준비물이 없다.
    serverProcess = spawn(process.execPath, ["tools/dev-server.mjs", "--port", String(PORT)], {
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

async function launch() {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_BIN
    });
    const page = await browser.newPage({viewport: {width: 1400, height: 1200}});

    await page.goto("http://127.0.0.1:" + PORT + "/index.html", {waitUntil: "domcontentloaded"});

    return {browser, page};
}

test("gallery drag advances to the next slide and snaps into place", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.waitForTimeout(400);

    const viewport = page.locator("#gallery-viewport");
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
    assert.match(await page.locator("#gallery-counter").textContent(), /^2 \//);

    await browser.close();
});

test("gallery nav buttons step through slides and wrap from the last slide back to the first", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.waitForTimeout(400);

    const slideCount = await page.locator("[data-gallery-slide-index]").count();

    for (let step = 0; step < slideCount; step += 1) {
        await page.locator("#gallery-next").click();
        await page.waitForTimeout(120);
    }

    const track = page.locator("#gallery-track");

    assert.equal(await track.evaluate((node) => node.style.transform), "translateX(0px)");
    assert.equal(await page.locator("#gallery-counter").textContent(), "1 / " + slideCount);

    await browser.close();
});

test("gallery track stays aligned to the active slide after a viewport resize", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.waitForTimeout(400);

    for (let step = 0; step < 5; step += 1) {
        await page.locator("#gallery-next").click();
        await page.waitForTimeout(120);
    }

    await page.setViewportSize({width: 480, height: 900});
    await page.waitForTimeout(400);

    const track = page.locator("#gallery-track");
    const viewport = page.locator("#gallery-viewport");
    const transform = await track.evaluate((node) => node.style.transform);
    const viewportWidth = await viewport.evaluate((node) => node.clientWidth);

    assert.equal(transform, "translateX(" + (-5 * viewportWidth) + "px)");

    await browser.close();
});

test("gallery progress bar and counter reflect the active slide", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.waitForTimeout(400);

    const slideCount = await page.locator("[data-gallery-slide-index]").count();

    assert.equal(await page.locator("#gallery-counter").textContent(), "1 / " + slideCount);

    await page.locator("#gallery-next").click();
    await page.waitForTimeout(400);

    assert.equal(await page.locator("#gallery-counter").textContent(), "2 / " + slideCount);

    const scaleX = await page.locator("#gallery-progress-fill").evaluate((node) => {
        const match = getComputedStyle(node).transform.match(/matrix\(([^,]+),/);
        return match ? Number(match[1]) : null;
    });

    assert.ok(Math.abs(scaleX - 2 / slideCount) < 0.01, `expected progress fill scaleX near ${2 / slideCount}, got ${scaleX}`);

    await browser.close();
});

test("dragging the progress bar scrubs the active slide in real time and snaps to a whole slide on release", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.waitForTimeout(400);

    const progress = page.locator("#gallery-progress");
    const track = page.locator("#gallery-track");
    const box = await progress.boundingBox();
    const slideCount = await page.locator("[data-gallery-slide-index]").count();

    await page.mouse.move(box.x + 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {steps: 8});
    await page.waitForTimeout(100);

    const midDragCounter = await page.locator("#gallery-counter").textContent();
    assert.notEqual(midDragCounter, "1 / " + slideCount, "expected the counter to already move mid-drag");

    await page.mouse.up();
    await page.waitForTimeout(400);

    const viewportWidth = await page.locator("#gallery-viewport").evaluate((node) => node.clientWidth);
    const transform = await track.evaluate((node) => node.style.transform);
    const activeIndex = Number(transform.match(/translateX\((-?\d+)px\)/)[1]) / -viewportWidth;

    assert.ok(Number.isInteger(activeIndex), `expected the track to land on a whole slide index, got ${activeIndex}`);

    await browser.close();
});

test("dragging the progress bar past either end clamps at the first or last slide instead of wrapping", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.waitForTimeout(400);

    const progress = page.locator("#gallery-progress");
    const box = await progress.boundingBox();
    const slideCount = await page.locator("[data-gallery-slide-index]").count();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 200, box.y + box.height / 2, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(400);

    assert.equal(await page.locator("#gallery-counter").textContent(), slideCount + " / " + slideCount);

    await browser.close();
});
