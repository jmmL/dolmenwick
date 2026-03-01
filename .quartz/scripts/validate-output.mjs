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
  await assertExists("hearth.html")
  await assertExists(path.join("hearth", "index.html"))
  await assertExists(path.join("referee-tools", "index.html"))
  await assertExists(path.join("referee-tools", "party-generator", "index.html"))

  const rootEntries = await fs.readdir(publicDir)
  const hashedCss = rootEntries.filter((entry) => /^index\.[a-f0-9]{12}\.css$/.test(entry))
  const hashedPrescript = rootEntries.filter((entry) => /^prescript\.[a-f0-9]{12}\.js$/.test(entry))
  const hashedPostscript = rootEntries.filter((entry) => /^postscript\.[a-f0-9]{12}\.js$/.test(entry))

  if (hashedCss.length !== 1 || hashedPrescript.length !== 1 || hashedPostscript.length !== 1) {
    throw new Error(
      `Expected exactly one hashed shared asset bundle, found css=${hashedCss.length}, prescript=${hashedPrescript.length}, postscript=${hashedPostscript.length}`,
    )
  }

  for (const legacyAsset of ["index.css", "prescript.js", "postscript.js"]) {
    if (rootEntries.includes(legacyAsset)) {
      throw new Error(`Legacy non-hashed asset still present in output: ${legacyAsset}`)
    }
  }

  const outputPaths = await collectPaths(publicDir)
  const leakedRefereePath = outputPaths.find((entry) => /zreferee/i.test(entry))

  if (leakedRefereePath) {
    throw new Error(`Referee-only content leaked into output: ${leakedRefereePath}`)
  }

  console.log(`Validated Quartz output in ${publicDir}`)
}

await main()
