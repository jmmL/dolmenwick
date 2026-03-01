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
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "Segoe UI",
        body: "Segoe UI",
        code: "SFMono-Regular",
      },
      colors: {
        lightMode: {
          light: "#ffffff",
          lightgray: "#e5e7eb",
          gray: "#94a3b8",
          darkgray: "#1f2937",
          dark: "#0f172a",
          secondary: "#2563eb",
          tertiary: "#1d4ed8",
          highlight: "rgba(37, 99, 235, 0.08)",
          textHighlight: "#bfdbfe99",
        },
        darkMode: {
          light: "#111827",
          lightgray: "#334155",
          gray: "#94a3b8",
          darkgray: "#e2e8f0",
          dark: "#f8fafc",
          secondary: "#60a5fa",
          tertiary: "#93c5fd",
          highlight: "rgba(96, 165, 250, 0.12)",
          textHighlight: "#1d4ed866",
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
      Plugin.HardLineBreaks(),
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
