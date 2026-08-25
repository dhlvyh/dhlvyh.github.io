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

test("gallery lightbox drag advances to the next slide and snaps into place", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator('[data-gallery-thumb-index="0"]').click();
    await page.waitForTimeout(400);

    const viewport = page.locator("#gallery-lightbox-viewport");
    const track = page.locator("#gallery-lightbox-track");
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

test("clicking a thumbnail opens the lightbox at the matching slide without drift", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    const viewport = page.locator("#gallery-lightbox-viewport");
    const track = page.locator("#gallery-lightbox-track");

    await page.locator('[data-gallery-thumb-index="10"]').click();
    await page.waitForTimeout(400);

    assert.ok(await page.locator("#gallery-lightbox").isVisible(), "expected the lightbox to open");

    const viewportWidth = await viewport.evaluate((node) => node.clientWidth);
    const transform = await track.evaluate((node) => node.style.transform);
    assert.equal(transform, "translateX(" + (-10 * viewportWidth) + "px)");

    const activeThumb = page.locator(".gallery-thumb.is-active");
    assert.equal(await activeThumb.getAttribute("data-gallery-thumb-index"), "10");
    assert.equal(await activeThumb.getAttribute("aria-current"), "true");

    await browser.close();
});

test("gallery lightbox nav buttons step through slides and clamp at the last one", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator('[data-gallery-thumb-index="0"]').click();
    await page.waitForTimeout(400);

    const slideCount = await page.locator("[data-gallery-slide-index]").count();

    for (let step = 0; step < slideCount - 1; step += 1) {
        await page.locator("#gallery-lightbox-next").click();
        await page.waitForTimeout(120);
    }

    assert.equal(
        await page.locator(".gallery-thumb.is-active").getAttribute("data-gallery-thumb-index"),
        String(slideCount - 1)
    );

    // 마지막 슬라이드에서 한 번 더 눌러도 더 진행하지 않고 그대로 멈춰야 한다
    await page.locator("#gallery-lightbox-next").click();
    await page.waitForTimeout(400);

    assert.equal(
        await page.locator(".gallery-thumb.is-active").getAttribute("data-gallery-thumb-index"),
        String(slideCount - 1)
    );

    await browser.close();
});

test("lightbox track stays aligned to the active slide after a viewport resize", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator('[data-gallery-thumb-index="5"]').click();
    await page.waitForTimeout(400);

    await page.setViewportSize({width: 480, height: 900});
    await page.waitForTimeout(400);

    const track = page.locator("#gallery-lightbox-track");
    const viewport = page.locator("#gallery-lightbox-viewport");
    const transform = await track.evaluate((node) => node.style.transform);
    const viewportWidth = await viewport.evaluate((node) => node.clientWidth);

    assert.equal(transform, "translateX(" + (-5 * viewportWidth) + "px)");

    await browser.close();
});

test("swiping the lightbox track updates the active thumbnail to match", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator('[data-gallery-thumb-index="3"]').click();
    await page.waitForTimeout(400);

    const viewport = page.locator("#gallery-lightbox-viewport");
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

test("thumbnail grid paginates past 12 photos and page buttons navigate", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    const total = await page.locator("[data-gallery-thumb-index]").count();
    const perPage = 12;

    // 이 테스트는 사진이 페이지당 장수를 넘는다는 전제 위에 있다
    assert.ok(total > perPage, `expected more than ${perPage} photos, got ${total}`);

    const visible = () => page.locator("[data-gallery-thumb-index]:visible").count();

    assert.equal(await visible(), perPage);
    await assert.doesNotReject(page.locator("#gallery-pagination").waitFor({state: "visible"}));
    assert.equal(await page.locator('[data-page-action="first"]').isDisabled(), true);
    assert.equal(await page.locator('[data-page-action="prev"]').isDisabled(), true);

    await page.locator('[data-page-action="next"]').click();
    await page.waitForTimeout(200);

    assert.equal(await visible(), perPage);
    assert.equal(
        await page.locator('.gallery-page-number[data-page="1"]').getAttribute("aria-current"),
        "page"
    );

    const pageCount = Math.ceil(total / perPage);
    const lastPageCount = total - perPage * (pageCount - 1);

    await page.locator('[data-page-action="last"]').click();
    await page.waitForTimeout(200);

    assert.equal(await visible(), lastPageCount);
    assert.equal(await page.locator('[data-page-action="next"]').isDisabled(), true);

    await page.locator('[data-page-action="first"]').click();
    await page.waitForTimeout(200);
    assert.equal(await visible(), perPage);

    await browser.close();
});

test("swiping past the current page's photos switches the pagination to match", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator('[data-gallery-thumb-index="0"]').click();
    await page.waitForTimeout(400);

    // 첫 페이지(0~11) 밖인 12번 사진으로 이동시키면 페이지네이션이 2페이지로 자동 전환돼야 한다
    await page.evaluate(() => {
        for (let step = 0; step < 12; step += 1) {
            document.querySelector("#gallery-lightbox-next").click();
        }
    });
    await page.waitForTimeout(400);

    assert.equal(
        await page.locator('.gallery-page-number[aria-current="page"]').getAttribute("data-page"),
        "1"
    );

    const active = page.locator(".gallery-thumb.is-active");
    assert.equal(await active.getAttribute("data-gallery-thumb-index"), "12");
    assert.ok(await active.isVisible(), "active thumbnail must not stay hidden");

    await browser.close();
});

test("thumbnails past the first page are never downloaded before pagination is used", {skip: hasPlaywright ? false : "playwright 미설치"}, async () => {
    const {browser, page} = await launch();

    await page.locator("#gallery-pagination").waitFor({state: "visible"});
    await page.waitForTimeout(1200);

    // hidden은 display:none이라 loading=lazy 이미지가 요청되지 않는다
    const requested = await page.evaluate(() => performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes("/gallery/thumb/")).length);

    assert.ok(requested <= 12, `expected at most 12 thumb requests before paging, got ${requested}`);

    await browser.close();
});
