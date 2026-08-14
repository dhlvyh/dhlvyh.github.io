// 원본 사진을 갤러리용 WebP 2단(메인 1280 / 썸네일 260)으로 변환하는 빌드 스크립트
//
// 사용법: npm run images
// 출력물은 images/gallery/main, images/gallery/thumb, images/opt 에 생성된다.
// 실행할 때마다 기존 결과물을 덮어쓰고 다시 변환한다(원본 교체 후 재실행 용도).

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "images");
const OUT_DIR = path.join(SRC_DIR, "gallery");

// main은 프레임 폭(430px)을 DPR 3으로 커버하는 1280.
// thumb은 5열 그리드라 표시 폭이 최대 86px뿐이라 DPR 3 기준 260이면 충분하다.
const VARIANTS = [
    { name: "main", width: 1280, quality: 82 },
    { name: "thumb", width: 260, quality: 78 }
];

const GALLERY_PATTERN = /^gallery(\d+)\.jpg$/i;

// 갤러리 외 단일 이미지. 카드/배경 안에서만 쓰이므로 1024면 충분하다.
const SINGLES = [
    { source: "hall.jpg", out: "hall.webp", width: 1024, quality: 82 },
    { source: "end.jpg", out: "end.webp", width: 1024, quality: 82 },
    { source: "main.jpg", out: "main.webp", width: 1024, quality: 82 },
    { source: "person1.jpg", out: "person1.webp", width: 1024, quality: 82 },
    { source: "person2.jpg", out: "person2.webp", width: 1024, quality: 82 }
];

// 카카오톡/OG 공유 카드용. 카카오 스크래퍼는 WebP를 지원하지 않고 대용량
// 이미지는 타임아웃으로 썸네일이 비므로, 반드시 별도 JPG로 뽑는다.
//
// 원본이 세로 2:3이라 1.91:1로 잘라내면 인물이 반드시 잘린다(sharp의
// attention 전략은 붉은 꽃에 반응해 머리를 자른다). 그래서 자르는 대신
// 갤러리 뷰어와 같은 방식 — 흐린 배경 위에 전체 사진을 얹는다 — 을 쓴다.
const SHARE = {
    source: "main.jpg",
    out: "share.jpg",
    width: 1200,
    height: 630,
    quality: 82
};

async function discoverGalleryIndices() {
    const files = await readdir(SRC_DIR);

    return files
        .map((name) => name.match(GALLERY_PATTERN))
        .filter(Boolean)
        .map((match) => Number(match[1]))
        .sort((a, b) => a - b);
}

async function convert(srcPath, outPath, { width, quality }) {
    await sharp(srcPath)
        .rotate() // EXIF 방향 정보를 픽셀에 반영한다
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outPath);

    return (await stat(outPath)).size;
}

async function convertShareCard(srcPath, outPath, { width, height, quality }) {
    const backdrop = await sharp(srcPath)
        .rotate()
        .resize(width, height, { fit: "cover", position: "centre" })
        .blur(40)
        .modulate({ brightness: 1.06, saturation: 0.75 })
        .toBuffer();

    const photo = await sharp(srcPath)
        .rotate()
        .resize({ height, fit: "inside" })
        .toBuffer();

    await sharp(backdrop)
        .composite([{ input: photo, gravity: "centre" }])
        .jpeg({ quality })
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

    const galleryIndices = await discoverGalleryIndices();

    for (const i of galleryIndices) {
        const srcPath = path.join(SRC_DIR, `gallery${i}.jpg`);
        const srcStat = await stat(srcPath);

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

    const sharePath = path.join(optDir, SHARE.out);
    try {
        const shareSize = await convertShareCard(
            path.join(SRC_DIR, SHARE.source),
            sharePath,
            SHARE
        );
        outTotal += shareSize;
        console.log(`  ${SHARE.out}  ${SHARE.width}x${SHARE.height}  ${mb(shareSize)}`);
    } catch {
        console.warn(`  건너뜀 — ${SHARE.source} 없음`);
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
