import assert from "node:assert/strict"
import test from "node:test"
import path from "node:path"
import { readUtf8, withBuiltFixtureSite } from "../../test/testUtils"

test("permalink aliases emit both flat and trailing-slash redirects", async () => {
  await withBuiltFixtureSite(`---
title: The Hearth
permalink: hearth
---
Home page copy.`, async ({ outputDir }) => {
    const flatRedirect = await readUtf8(path.join(outputDir, "hearth.html"))
    const slashRedirect = await readUtf8(path.join(outputDir, "hearth", "index.html"))

    assert.match(flatRedirect, /http-equiv="refresh"/)
    assert.match(slashRedirect, /http-equiv="refresh"/)
  })
})
