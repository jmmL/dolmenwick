import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Dolmenwick",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "jmml.github.io/dolmenwick",
    ignorePatterns: [
      "private",
      "templates",
      ".obsidian",
      "zReferee only",
      ".referee-tools",
      ".github",
      ".quartz-cache",
      "node_modules",
    ],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Cormorant Garamond",
        body: "Crimson Text",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#f7f3eb",
          lightgray: "#dfd6c5",
          gray: "#ad9f8c",
          darkgray: "#5a5148",
          dark: "#2d2924",
          secondary: "#8c4c2a",
          tertiary: "#6b7f48",
          highlight: "rgba(181, 95, 50, 0.12)",
          textHighlight: "#f4d47888",
        },
        darkMode: {
          light: "#171415",
          lightgray: "#3c3532",
          gray: "#8f8373",
          darkgray: "#ddd2c0",
          dark: "#f6f0e7",
          secondary: "#d38553",
          tertiary: "#a3c06d",
          highlight: "rgba(211, 133, 83, 0.15)",
          textHighlight: "#d9b64688",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: false,
        enableRSS: false,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
