import { rm } from "node:fs/promises";

const ZIP_PATH = "flamingo.zip";

await rm(ZIP_PATH, { force: true });

await Bun.$`bun run build`;
await Bun.$`zip -r ../${ZIP_PATH} .`.cwd("build");

console.log(`Packaged extension into ${ZIP_PATH}`);
