// 캐시를 끄고 정적 파일을 서빙하는 개발용 서버
//
// 사용법: npm run dev [-- --port 8080]
// 브라우저 캐시 때문에 변경이 반영되지 않는 것처럼 보이는 일을 막는다.

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const portArg = process.argv.indexOf("--port");
const PORT = portArg > -1 ? Number(process.argv[portArg + 1]) : 8080;

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".svg": "image/svg+xml"
};

createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const filePath = path.join(ROOT, rel);

    // 루트 밖으로 벗어나는 경로는 거부한다
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403).end("Forbidden");
        return;
    }

    try {
        const info = await stat(filePath);
        if (!info.isFile()) throw new Error("not a file");

        res.writeHead(200, {
            "Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
            "Content-Length": info.size,
            "Cache-Control": "no-store, must-revalidate"
        });
        createReadStream(filePath).pipe(res);
    } catch {
        res.writeHead(404, { "Cache-Control": "no-store" }).end("Not Found");
    }
}).listen(PORT, () => {
    console.log(`개발 서버 실행 중 — http://localhost:${PORT} (캐시 없음)`);
});
