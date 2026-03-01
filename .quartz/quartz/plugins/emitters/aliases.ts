import { FullSlug, isRelativeURL, joinSegments, resolveRelative, simplifySlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { VFile } from "vfile"
import path from "path"

async function* processFile(ctx: BuildCtx, file: VFile) {
  const ogSlug = simplifySlug(file.data.slug!)

  for (const aliasTarget of file.data.aliases ?? []) {
    const aliasTargetSlug = (
      isRelativeURL(aliasTarget)
        ? path.normalize(path.join(ogSlug, "..", aliasTarget))
        : aliasTarget
    ) as FullSlug

    const redirectSlugs: FullSlug[] =
      aliasTargetSlug === "index" || aliasTargetSlug.endsWith("/index")
        ? [aliasTargetSlug]
        : [aliasTargetSlug, joinSegments(aliasTargetSlug, "index") as FullSlug]

    for (const redirectSlug of redirectSlugs) {
      const redirectUrl = resolveRelative(redirectSlug, ogSlug)
      yield write({
        ctx,
        content: `
          <!DOCTYPE html>
          <html lang="en-us">
          <head>
          <title>${ogSlug}</title>
          <link rel="canonical" href="${redirectUrl}">
          <meta name="robots" content="noindex">
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="0; url=${redirectUrl}">
          <script>location.replace(${JSON.stringify(redirectUrl)})</script>
          </head>
          <body>
          <a href="${redirectUrl}">Continue</a>
          </body>
          </html>
          `,
        slug: redirectSlug,
        ext: ".html",
      })
    }
  }
}

export const AliasRedirects: QuartzEmitterPlugin = () => ({
  name: "AliasRedirects",
  async *emit(ctx, content) {
    for (const [_tree, file] of content) {
      yield* processFile(ctx, file)
    }
  },
  async *partialEmit(ctx, _content, _resources, changeEvents) {
    for (const changeEvent of changeEvents) {
      if (!changeEvent.file) continue
      if (changeEvent.type === "add" || changeEvent.type === "change") {
        // add new ones if this file still exists
        yield* processFile(ctx, changeEvent.file)
      }
    }
  },
})
