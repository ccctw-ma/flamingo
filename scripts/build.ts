import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

const rootDir = resolve(import.meta.dir, "..");
const outDir = resolve(rootDir, "build");

function toHtmlPath(path: string) {
  return `./${relative(outDir, path).replaceAll("\\", "/")}`;
}

interface BuildEntry {
  entryPath: string;
  outputs: string[];
}

async function copyExtensionAssets(backgroundPath: string) {
  // Ship only the sized icons; skip the high-resolution master image.
  await cp(resolve(rootDir, "images"), resolve(outDir, "images"), {
    recursive: true,
    filter: (source) => basename(source) !== "flamingo.png",
  });
  const manifest = JSON.parse(await readFile(resolve(rootDir, "manifest.json"), "utf8"));
  manifest.background.service_worker = toHtmlPath(backgroundPath).slice(2);
  await writeFile(resolve(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function runBuild(entrypoint: string, entryName: string): Promise<BuildEntry> {
  const result = await Bun.build({
    entrypoints: [resolve(rootDir, entrypoint)],
    outdir: outDir,
    target: "browser",
    format: "esm",
    splitting: false,
    minify: true,
    sourcemap: "none",
    naming: {
      entry: "assets/[name]-[hash].js",
      chunk: "assets/chunk-[hash].js",
      asset: "assets/[name]-[hash].[ext]",
    },
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  const outputs = result.outputs.map((output) => output.path);
  const entryPath = outputs.find(
    (path) => path.endsWith(".js") && basename(path).startsWith(`${entryName}-`)
  );
  if (!entryPath) {
    throw new Error(`Could not find built entry for ${entrypoint}`);
  }

  return { entryPath, outputs };
}

async function buildBundles() {
  const popup = await runBuild("src/index.tsx", "index");
  const background = await runBuild("src/background.ts", "background");
  return { popup, background, outputs: [...popup.outputs, ...background.outputs] };
}

async function normalizeCssAssets(outputs: string[]) {
  const normalized = await Promise.all(
    outputs.map(async (path) => {
      if (!path.endsWith(".js")) {
        return path;
      }

      const content = await readFile(path, "utf8");
      const first = content.trimStart().at(0);
      if (first !== "." && first !== "@" && first !== "#") {
        return path;
      }

      const cssPath = path.replace(/\.js$/, ".css");
      await rename(path, cssPath);
      return cssPath;
    })
  );

  return normalized;
}

async function buildCss() {
  const source = await readFile(resolve(rootDir, "src/index.css"), "utf8");
  const result = await postcss([
    tailwindcss({
      config: resolve(rootDir, "tailwind.config.js"),
    }),
    autoprefixer,
  ]).process(source, {
    from: resolve(rootDir, "src/index.css"),
    to: resolve(outDir, "assets/home.css"),
  });
  const cssPath = resolve(outDir, "assets/home.css");
  await mkdir(resolve(outDir, "assets"), { recursive: true });
  await writeFile(cssPath, result.css);
  return cssPath;
}

async function writePopupHtml(scriptPath: string, outputs: string[]) {
  const cssPaths = outputs.filter((path) => path.endsWith(".css"));
  const cssLinks = cssPaths
    .map((path) => `    <link rel="stylesheet" href="${toHtmlPath(path)}" />`)
    .join("\n");
  const template = await readFile(resolve(rootDir, "home.html"), "utf8");
  const body = template.includes('<div id="root"></div>')
    ? template.replace(
        '<div id="root"></div>',
        `<div id="root"></div>\n    <script type="module" src="${toHtmlPath(scriptPath)}"></script>`
      )
    : `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flamingo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${toHtmlPath(scriptPath)}"></script>
  </body>
</html>`;

  const html = cssLinks ? body.replace("</head>", `${cssLinks}\n  </head>`) : body;
  await writeFile(resolve(outDir, "home.html"), html);
}

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const { popup, background, outputs } = await buildBundles();
  const normalizedOutputs = await normalizeCssAssets(outputs);
  normalizedOutputs.push(await buildCss());
  await copyExtensionAssets(background.entryPath);
  await writePopupHtml(popup.entryPath, normalizedOutputs);

  const entries = normalizedOutputs
    .map((path) => basename(path))
    .sort()
    .join(", ");
  console.log(`Built Chrome extension into ${relative(rootDir, outDir)} (${entries})`);
}

await main();
