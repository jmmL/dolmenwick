import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"
import { resolveServeFilePath } from "./handlers.js"

const outputDir = path.join("/tmp", "quartz-public")

test("resolveServeFilePath normalizes safe preview paths within the output directory", () => {
  const resolved = resolveServeFilePath(outputDir, "/nested/./page.html")
  assert.deepEqual(resolved, {
    absolutePath: path.join(outputDir, "nested", "page.html"),
    normalizedPath: "/nested/page.html",
  })
})

test("resolveServeFilePath rejects traversal and malformed preview paths", () => {
  assert.equal(resolveServeFilePath(outputDir, "/../secret.txt"), null)
  assert.equal(resolveServeFilePath(outputDir, "/nested/%2e%2e/secret.txt"), null)
  assert.equal(resolveServeFilePath(outputDir, "/nested\\secret.txt"), null)
  assert.equal(resolveServeFilePath(outputDir, "/%E0%A4%A"), null)
})
