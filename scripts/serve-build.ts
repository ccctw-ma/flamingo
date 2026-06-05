import { existsSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

const rootDir = resolve(import.meta.dir, "..");
const buildDir = resolve(rootDir, "build");
const port = Number(process.env.PORT || 4173);

function contentType(pathname: string) {
  if (pathname.endsWith(".html")) return "text/html; charset=utf-8";
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (pathname.endsWith(".json")) return "application/json; charset=utf-8";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

if (!existsSync(buildDir)) {
  throw new Error("build directory not found. Run `bun run build` first.");
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const relativePath = url.pathname === "/" ? "/home.html" : url.pathname;
    const safePath = normalize(relativePath)
      .replace(/^(\.\.(\/|\\|$))+/, "")
      .replace(/^[/\\]+/, "");
    const filePath = join(buildDir, safePath);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(file, {
      headers: {
        "content-type": contentType(filePath),
        "cache-control": "no-store",
      },
    });
  },
});

console.log(`Serving build on http://127.0.0.1:${server.port}`);
