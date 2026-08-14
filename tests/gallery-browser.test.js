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

test("gallery main track drag advances to the next slide and snaps into place", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    const viewport = page.locator("#gallery-main-viewport");
    const track = page.locator("#gallery-main-track");
    const box = await viewport.boundingBox();

    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(400);

    const transform = await track.evaluate((node) => node.style.transform);
    const viewportWidth = await viewport.evaluate((node) => node.clientWidth);

    assert.equal(transform, "translateX(" + (-viewportWidth) + "px)");
    assert.equal(
        await page.locator('.gallery-thumb.is-active').getAttribute("data-gallery-thumb-index"),
        "1"
    );

    await browser.close();
});

test("clicking a thumbnail jumps the main track to the matching slide without drift", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    const viewport = page.locator("#gallery-main-viewport");
    const track = page.locator("#gallery-main-track");
    const viewportWidth = await viewport.evaluate((node) => node.clientWidth);

    await page.locator('[data-gallery-thumb-index="10"]').click();
    await page.waitForTimeout(400);

    const transform = await track.evaluate((node) => node.style.transform);
    assert.equal(transform, "translateX(" + (-10 * viewportWidth) + "px)");

    const activeThumb = page.locator(".gallery-thumb.is-active");
    assert.equal(await activeThumb.getAttribute("data-gallery-thumb-index"), "10");
    assert.equal(await activeThumb.getAttribute("aria-current"), "true");

    await browser.close();
});

test("gallery main nav buttons step through slides and clamp at the last one", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    const slideCount = await page.locator("[data-gallery-slide-index]").count();

    for (let step = 0; step < slideCount - 1; step += 1) {
        await page.locator("#gallery-main-next").click();
        await page.waitForTimeout(120);
    }

    assert.equal(
        await page.locator(".gallery-thumb.is-active").getAttribute("data-gallery-thumb-index"),
        String(slideCount - 1)
    );

    // 마지막 슬라이드에서 한 번 더 눌러도 더 진행하지 않고 그대로 멈춰야 한다
    await page.locator("#gallery-main-next").click();
    await page.waitForTimeout(400);

    assert.equal(
        await page.locator(".gallery-thumb.is-active").getAttribute("data-gallery-thumb-index"),
        String(slideCount - 1)
    );

    await browser.close();
});

test("main track stays aligned to the active slide after a viewport resize", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator('[data-gallery-thumb-index="5"]').click();
    await page.waitForTimeout(400);

    await page.setViewportSize({width: 480, height: 900});
    await page.waitForTimeout(400);

    const track = page.locator("#gallery-main-track");
    const viewport = page.locator("#gallery-main-viewport");
    const transform = await track.evaluate((node) => node.style.transform);
    const viewportWidth = await viewport.evaluate((node) => node.clientWidth);

    assert.equal(transform, "translateX(" + (-5 * viewportWidth) + "px)");

    await browser.close();
});

test("swiping the main track updates the active thumbnail to match", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator('[data-gallery-thumb-index="3"]').click();
    await page.waitForTimeout(400);

    const viewport = page.locator("#gallery-main-viewport");
    const box = await viewport.boundingBox();

    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.15, box.y + box.height / 2, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(400);

    assert.equal(
        await page.locator(".gallery-thumb.is-active").getAttribute("data-gallery-thumb-index"),
        "4"
    );

    await browser.close();
});

test("thumbnail grid collapses past the limit and the toggle reveals the rest", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    const total = await page.locator("[data-gallery-thumb-index]").count();
    const limit = 30;

    // 이 테스트는 사진이 한도를 넘는다는 전제 위에 있다
    assert.ok(total > limit, `expected more than ${limit} photos, got ${total}`);

    const visible = () => page.locator("[data-gallery-thumb-index]:visible").count();

    assert.equal(await visible(), limit);
    await assert.doesNotReject(page.locator("#gallery-thumb-more").waitFor({state: "visible"}));
    assert.equal(
        await page.locator("#gallery-thumb-toggle").getAttribute("aria-expanded"),
        "false"
    );
    assert.match(
        await page.locator("#gallery-thumb-toggle [data-collapse-label]").textContent(),
        new RegExp(`더보기 \(${total - limit}장\)`)
    );

    await page.locator("#gallery-thumb-toggle").click();

    assert.equal(await visible(), total);
    assert.equal(
        await page.locator("#gallery-thumb-toggle").getAttribute("aria-expanded"),
        "true"
    );
    assert.equal(
        (await page.locator("#gallery-thumb-toggle [data-collapse-label]").textContent()).trim(),
        "접기"
    );

    await page.locator("#gallery-thumb-toggle").click();
    assert.equal(await visible(), limit);

    await browser.close();
});

test("swiping past the collapsed limit expands the grid automatically", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    const limit = 30;

    assert.equal(await page.locator("[data-gallery-thumb-index]:visible").count(), limit);

    // 접힌 구간(35번)으로 이동시키면 활성 썸네일이 숨어 있으면 안 된다
    await page.evaluate(() => {
        for (let step = 0; step < 35; step += 1) {
            document.querySelector("#gallery-main-next").click();
        }
    });
    await page.waitForTimeout(400);

    const active = page.locator(".gallery-thumb.is-active");
    assert.equal(await active.getAttribute("data-gallery-thumb-index"), "35");
    assert.ok(await active.isVisible(), "active thumbnail must not stay hidden");
    assert.equal(
        await page.locator("#gallery-thumb-toggle").getAttribute("aria-expanded"),
        "true"
    );

    await browser.close();
});

test("collapsed thumbnails past the limit are never downloaded", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator("#gallery-thumb-more").waitFor({state: "visible"});
    await page.waitForTimeout(1200);

    // hidden은 display:none이라 loading=lazy 이미지가 요청되지 않는다
    const requested = await page.evaluate(() => performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes("/gallery/thumb/")).length);

    assert.ok(requested <= 30, `expected at most 30 thumb requests while collapsed, got ${requested}`);

    await browser.close();
});
