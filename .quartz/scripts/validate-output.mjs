import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const quartzDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = path.join(quartzDir, "public")

async function assertExists(relativePath) {
  const fullPath = path.join(publicDir, relativePath)
  await fs.access(fullPath)
}

async function collectPaths(dir, prefix = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name)
    const fullPath = path.join(dir, entry.name)
    files.push(relativePath)
    if (entry.isDirectory()) {
      files.push(...await collectPaths(fullPath, relativePath))
    }
  }

  return files
}

async function main() {
  await assertExists("index.html")
  await assertExists(path.join("referee-tools", "index.html"))
  await assertExists(path.join("referee-tools", "party-generator", "index.html"))

  const outputPaths = await collectPaths(publicDir)
  const leakedRefereePath = outputPaths.find((entry) => /zreferee/i.test(entry))

  if (leakedRefereePath) {
    throw new Error(`Referee-only content leaked into output: ${leakedRefereePath}`)
  }

  console.log(`Validated Quartz output in ${publicDir}`)
}

await main()
