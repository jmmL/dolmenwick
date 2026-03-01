import test from "node:test"
import path from "node:path"
import { readdir } from "node:fs/promises"
import {
  assertExcludes,
  assertIncludes,
  readUtf8,
  withBuiltFixtureSite,
} from "./test/testUtils"

const fixtureFiles = {
  "index.md": `---
title: The Hearth
permalink: hearth
---
A collection of player resources.

1. [System cheat sheet](./Above-the-table/System-cheat-sheet)
`,
  "Above-the-table/System-cheat-sheet.md": `---
title: System cheat sheet
---
# The four types of rolls

## Ability checks

Useful detail.

## Skill checks

More useful detail.
`,
}

test("built site restores shared controls and emits hashed shared assets", async () => {
  await withBuiltFixtureSite(fixtureFiles, async ({ outputDir, indexHtml, indexCss, sharedAssetPaths }) => {
    const rootFiles = await readdir(outputDir)

    assertIncludes(indexHtml, 'class="darkmode"')
    assertExcludes(indexHtml, 'class="explorer"')
    assertExcludes(indexHtml, "search-button")
    assertExcludes(indexHtml, 'href="./index.css"')
    assertExcludes(indexHtml, 'src="./prescript.js"')
    assertExcludes(indexHtml, 'src="./postscript.js"')

    assertIncludes(sharedAssetPaths.css, "index.")
    assertIncludes(sharedAssetPaths.prescript, "prescript.")
    assertIncludes(sharedAssetPaths.postscript, "postscript.")
    assertIncludes(indexCss, "--bodyFont:ui-sans-serif")
    assertIncludes(indexCss, "--headerFont:ui-sans-serif")
    assertIncludes(indexCss, "--titleFont:ui-sans-serif")
    assertIncludes(indexCss, ".page.no-left:not(.no-right)>#quartz-body")
    assertIncludes(indexCss, ".page.no-left>#quartz-body header .darkmode")
    assertIncludes(indexCss, "padding:0 48px")
    assertIncludes(indexCss, "padding:0 24px")
    assertIncludes(indexCss, "text-decoration:underline")

    assertExcludes(rootFiles.join("\n"), "index.css")
    assertExcludes(rootFiles.join("\n"), "prescript.js")
    assertExcludes(rootFiles.join("\n"), "postscript.js")
  })
})

test("built content pages include a desktop toc while list pages do not", async () => {
  await withBuiltFixtureSite(fixtureFiles, async ({ outputDir }) => {
    const contentHtml = await readUtf8(
      path.join(outputDir, "Above-the-table", "System-cheat-sheet.html"),
    )
    const listHtml = await readUtf8(path.join(outputDir, "Above-the-table", "index.html"))

    assertIncludes(contentHtml, 'class="darkmode"')
    assertIncludes(contentHtml, "toc-header")
    assertIncludes(contentHtml, "Table of Contents")
    assertIncludes(contentHtml, "The four types of rolls")
    assertIncludes(contentHtml, "Ability checks")
    assertExcludes(contentHtml, 'class="explorer"')
    assertExcludes(contentHtml, "search-button")

    assertExcludes(listHtml, "toc-header")
  })
})

test("built site preserves hard line breaks inside paragraphs", async () => {
  await withBuiltFixtureSite(
    `---
title: Line Break Test
---
first line
second line

third paragraph`,
    async ({ indexHtml }) => {
      assertIncludes(indexHtml, "first line<br")
    },
  )
})
