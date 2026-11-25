import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, rename } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Build into a staging directory and swap it in only once everything succeeds,
// so a failed or killed build never leaves the running server without dist/.
const OUT_DIR = "dist";
const STAGING_DIR = "dist.next";
const PREVIOUS_DIR = "dist.prev";

async function buildAll() {
  await rm(STAGING_DIR, { recursive: true, force: true });

  console.log("building client...");
  await viteBuild({
    build: { outDir: path.resolve(STAGING_DIR, "public"), emptyOutDir: true },
  });

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: `${STAGING_DIR}/index.cjs`,
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

async function swapIntoPlace() {
  await rm(PREVIOUS_DIR, { recursive: true, force: true });
  if (existsSync(OUT_DIR)) await rename(OUT_DIR, PREVIOUS_DIR);
  await rename(STAGING_DIR, OUT_DIR);
  await rm(PREVIOUS_DIR, { recursive: true, force: true });
  console.log(`build swapped into ${OUT_DIR}/`);
}

buildAll().then(swapIntoPlace).catch((err) => {
  console.error(err);
  process.exit(1);
});
