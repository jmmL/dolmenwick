import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const quartzDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = path.resolve(quartzDir, "..")
const contentDir = process.env.QUARTZ_PREPARED_CONTENT_DIR
  ? path.resolve(process.env.QUARTZ_PREPARED_CONTENT_DIR)
  : path.join(os.tmpdir(), "dolmenwick-quartz-content")

const publicRoots = [
  "Above the table",
  "Characters",
  "Chronicles",
  "Maps and images",
  "The world",
]

const publicRootFiles = ["The Hearth.md"]

async function resetContentDir() {
  await fs.rm(contentDir, { recursive: true, force: true })
  await fs.mkdir(contentDir, { recursive: true })
}

function normalizeMarkdown(source) {
  return source.replace(/(!?\[\[)Dolmenwood\//g, "$1")
}

function shouldSkipMarkdown(filePath, fileContents) {
  const { data } = matter(fileContents)
  return data.draft === true || data.draft === "true" || data.publish === false || data.publish === "false"
}

async function copyDirectory(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true })
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath)
      continue
    }

    if (entry.name.endsWith(".md")) {
      const fileContents = await fs.readFile(sourcePath, "utf8")
      if (shouldSkipMarkdown(sourcePath, fileContents)) {
        continue
      }

      await fs.writeFile(targetPath, normalizeMarkdown(fileContents))
      continue
    }

    await fs.copyFile(sourcePath, targetPath)
  }
}

function buildIndexNote(hearthSource) {
  const parsed = matter(hearthSource)
  const aliases = Array.isArray(parsed.data.aliases)
    ? parsed.data.aliases.filter((alias) => alias !== "The Hearth")
    : parsed.data.aliases
      ? [parsed.data.aliases].filter((alias) => alias !== "The Hearth")
      : []

  parsed.data.title = parsed.data.title || "The Hearth"
  parsed.data.aliases = [...aliases, "The Hearth"]
  return matter.stringify(normalizeMarkdown(parsed.content).trimStart(), parsed.data)
}

async function writeRootIndex() {
  const hearthSourcePath = path.join(repoRoot, "The Hearth.md")
  const hearthSource = await fs.readFile(hearthSourcePath, "utf8")
  const indexContents = buildIndexNote(hearthSource)
  await fs.writeFile(path.join(contentDir, "index.md"), indexContents)
}

async function main() {
  await resetContentDir()

  for (const root of publicRoots) {
    await copyDirectory(path.join(repoRoot, root), path.join(contentDir, root))
  }

  for (const fileName of publicRootFiles) {
    if (fileName === "The Hearth.md") {
      continue
    }

    const sourcePath = path.join(repoRoot, fileName)
    const targetPath = path.join(contentDir, fileName)
    const fileContents = await fs.readFile(sourcePath, "utf8")
    if (shouldSkipMarkdown(sourcePath, fileContents)) {
      continue
    }

    await fs.writeFile(targetPath, normalizeMarkdown(fileContents))
  }

  await writeRootIndex()
  console.log(`Prepared Quartz content in ${contentDir}`)
}

await main()
