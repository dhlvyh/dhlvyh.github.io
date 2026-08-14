// 원본 사진을 갤러리용 WebP 2단(메인 1280 / 썸네일 380)으로 변환하는 빌드 스크립트
//
// 사용법: npm run images
// 출력물은 images/gallery/main, images/gallery/thumb 에 생성된다.
// 실행할 때마다 기존 결과물을 덮어쓰고 다시 변환한다(원본 교체 후 재실행 용도).

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "images");
const OUT_DIR = path.join(SRC_DIR, "gallery");

// 표본 청첩장(theirmood)의 전송 스펙과 동일하게 맞췄다.
const VARIANTS = [
    { name: "main", width: 1280, quality: 82 },
    { name: "thumb", width: 380, quality: 78 }
];

const GALLERY_COUNT = 35;

// 갤러리 외 단일 이미지. 카드/배경 안에서만 쓰이므로 1024면 충분하다.
const SINGLES = [
    { source: "hall.jpg", out: "hall.webp", width: 1024, quality: 82 },
    { source: "end.jpg", out: "end.webp", width: 1024, quality: 82 },
    { source: "main-background.jpg", out: "main-background.webp", width: 1024, quality: 82 },
    { source: "main.jpg", out: "main.webp", width: 1024, quality: 82 },
    { source: "person1.jpg", out: "person1.webp", width: 1024, quality: 82 },
    { source: "person2.jpg", out: "person2.webp", width: 1024, quality: 82 }
];

async function convert(srcPath, outPath, { width, quality }) {
    await sharp(srcPath)
        .rotate() // EXIF 방향 정보를 픽셀에 반영한다
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outPath);

    return (await stat(outPath)).size;
}

async function main() {
    await Promise.all(
        VARIANTS.map((v) => mkdir(path.join(OUT_DIR, v.name), { recursive: true }))
    );

    const manifest = [];
    let srcTotal = 0;
    let outTotal = 0;

    for (let i = 1; i <= GALLERY_COUNT; i += 1) {
        const srcPath = path.join(SRC_DIR, `gallery${i}.jpg`);

        let srcStat;
        try {
            srcStat = await stat(srcPath);
        } catch {
            console.warn(`  건너뜀 — gallery${i}.jpg 없음`);
            continue;
        }
        srcTotal += srcStat.size;

        const entry = { index: i, source: `gallery${i}.jpg` };

        for (const variant of VARIANTS) {
            const outPath = path.join(OUT_DIR, variant.name, `${i}.webp`);
            const rel = path.relative(ROOT, outPath).replace(/\\/g, "/");

            outTotal += await convert(srcPath, outPath, variant);
            entry[variant.name] = rel;
        }

        const { width, height } = await sharp(srcPath).metadata();
        entry.width = width;
        entry.height = height;
        manifest.push(entry);
        console.log(`  gallery${i}.jpg  ${width}x${height}  ${mb(srcStat.size)}`);
    }

    const optDir = path.join(SRC_DIR, "opt");
    await mkdir(optDir, { recursive: true });

    for (const single of SINGLES) {
        const srcPath = path.join(SRC_DIR, single.source);
        const outPath = path.join(optDir, single.out);

        let srcStat;
        try {
            srcStat = await stat(srcPath);
        } catch {
            console.warn(`  건너뜀 — ${single.source} 없음`);
            continue;
        }
        srcTotal += srcStat.size;
        outTotal += await convert(srcPath, outPath, single);
        console.log(`  ${single.source}  ${mb(srcStat.size)}`);
    }

    await writeFile(
        path.join(OUT_DIR, "manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8"
    );

    console.log("");
    console.log(`원본   ${mb(srcTotal)}`);
    console.log(`생성물 ${mb(outTotal)}  (${(srcTotal / outTotal).toFixed(1)}배 감소)`);
}

function mb(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

await main();
