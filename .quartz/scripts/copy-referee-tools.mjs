import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const quartzDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = path.resolve(quartzDir, "..")
const sourceRoot = path.join(repoRoot, ".referee-tools")
const outputRoot = path.join(quartzDir, "public", "referee-tools")

const copyPlan = [
  { source: "index.html", target: "index.html" },
  { source: path.join("party-generator", "index.html"), target: path.join("party-generator", "index.html") },
  { source: path.join("party-generator", "data"), target: path.join("party-generator", "data") },
  { source: path.join("party-generator", "static"), target: path.join("party-generator", "static") },
]

async function copyEntry(sourceRelative, targetRelative) {
  const sourcePath = path.join(sourceRoot, sourceRelative)
  const targetPath = path.join(outputRoot, targetRelative)

  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.cp(sourcePath, targetPath, { recursive: true })
}

async function main() {
  await fs.rm(outputRoot, { recursive: true, force: true })
  for (const entry of copyPlan) {
    await copyEntry(entry.source, entry.target)
  }
  console.log(`Copied referee tools into ${outputRoot}`)
}

await main()
