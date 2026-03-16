import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import test from "node:test"

const repoRoot = path.resolve(import.meta.dirname, "..")
const pagesWorkflow = readFileSync(path.join(repoRoot, ".github/workflows/pages.yml"), "utf8")
const codeqlWorkflow = readFileSync(path.join(repoRoot, ".github/workflows/codeql.yml"), "utf8")

test("pages workflow uses the expected runner and action majors", () => {
  assert.match(
    pagesWorkflow,
    /jobs:\s+build:\s+runs-on:\s+ubuntu-latest/s,
    "pages build job should run on ubuntu-latest",
  )
  assert.match(pagesWorkflow, /uses:\s+actions\/checkout@v6\b/)
  assert.match(pagesWorkflow, /uses:\s+actions\/setup-node@v6\b/)
  assert.match(pagesWorkflow, /uses:\s+actions\/configure-pages@v5\b/)
  assert.match(pagesWorkflow, /uses:\s+actions\/upload-pages-artifact@v4\b/)
  assert.match(pagesWorkflow, /uses:\s+actions\/deploy-pages@v4\b/)
})

test("codeql workflow keeps codeql v4 and checkout v6", () => {
  assert.match(codeqlWorkflow, /uses:\s+actions\/checkout@v6\b/)
  assert.match(codeqlWorkflow, /uses:\s+github\/codeql-action\/init@v4\b/)
  assert.match(codeqlWorkflow, /uses:\s+github\/codeql-action\/analyze@v4\b/)
})
