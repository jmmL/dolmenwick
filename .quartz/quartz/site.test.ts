import test from "node:test"
import { assertExcludes, assertIncludes, withBuiltFixtureSite } from "./test/testUtils"

test("built site uses local-font readable layout without explorer chrome", async () => {
  await withBuiltFixtureSite(`---
title: The Hearth
permalink: hearth
---
A collection of player resources.

1. [Session 1](./session-1)
`, async ({ indexHtml, indexCss }) => {
    assertExcludes(indexHtml, "fonts.googleapis.com")
    assertExcludes(indexHtml, 'class="explorer"')
    assertExcludes(indexHtml, "search-button")
    assertExcludes(indexHtml, "Table of Contents")
    assertIncludes(indexCss, "--bodyFont:ui-sans-serif")
    assertIncludes(indexCss, "--headerFont:ui-sans-serif")
    assertIncludes(indexCss, "--titleFont:ui-sans-serif")
    assertIncludes(indexCss, "max-width:800px")
    assertIncludes(indexCss, "padding:0 48px")
    assertIncludes(indexCss, "padding:0 24px")
    assertIncludes(indexCss, "text-decoration:underline")
  })
})

test("built site preserves hard line breaks inside paragraphs", async () => {
  await withBuiltFixtureSite(`---
title: Line Break Test
---
first line
second line

third paragraph`, async ({ indexHtml }) => {
    assertIncludes(indexHtml, "first line<br")
  })
})
