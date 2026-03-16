import assert from "node:assert/strict"
import test from "node:test"
import { escapeHTML, unescapeHTML } from "./escape"

test("escapeHTML escapes ampersands before other entities", () => {
  assert.equal(escapeHTML('&quot; <tag>'), "&amp;quot; &lt;tag&gt;")
})

test("unescapeHTML decodes ampersands last", () => {
  assert.equal(unescapeHTML("&amp;quot; &amp;lt;"), "&quot; &lt;")
  assert.equal(unescapeHTML("&lt;div&gt;&amp;"), "<div>&")
})
