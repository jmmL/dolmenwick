import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const testDir = path.dirname(fileURLToPath(import.meta.url))
export const quartzDir = path.resolve(testDir, "../..")
export const nodePath = "/opt/homebrew/opt/node@22/bin/node"

export async function withTempDir<T>(prefix: string, fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix))
  try {
    return await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export async function withBuiltFixtureSite<T>(
  markdown: string,
  fn: (site: { outputDir: string; indexHtml: string; indexCss: string }) => Promise<T>,
): Promise<T> {
  return await withTempDir("quartz-fixture-", async (dir) => {
    const contentDir = path.join(dir, "content")
    const outputDir = path.join(dir, "public")
    await mkdir(contentDir, { recursive: true })
    await writeFile(path.join(contentDir, "index.md"), markdown, { encoding: "utf8", flag: "wx" })
    await execFileAsync(
      nodePath,
      ["quartz/bootstrap-cli.mjs", "build", "-d", contentDir, "-o", outputDir, "--concurrency", "1"],
      {
        cwd: quartzDir,
        env: { ...process.env, PATH: `/opt/homebrew/opt/node@22/bin:${process.env.PATH ?? ""}` },
      },
    )

    const indexHtml = await readUtf8(path.join(outputDir, "index.html"))
    const indexCss = await readUtf8(path.join(outputDir, "index.css"))
    return await fn({ outputDir, indexHtml, indexCss })
  })
}

export async function readUtf8(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}

export function assertIncludes(haystack: string, needle: string) {
  assert.ok(haystack.includes(needle), `Expected output to include ${needle}`)
}

export function assertExcludes(haystack: string, needle: string) {
  assert.ok(!haystack.includes(needle), `Expected output to exclude ${needle}`)
}
