const http = require("node:http")
const path = require("node:path")
const fs = require("node:fs/promises")
const { test, expect } = require("@playwright/test")

const rootDir = path.resolve(__dirname, "..")
let server
let baseUrl

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8"
    case ".js":
      return "application/javascript; charset=utf-8"
    case ".css":
      return "text/css; charset=utf-8"
    case ".json":
      return "application/json; charset=utf-8"
    default:
      return "application/octet-stream"
  }
}

async function serveFile(requestPath, response) {
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "")
  const relativePath = safePath === "/" ? "/index.html" : safePath
  const filePath = path.join(rootDir, relativePath)

  try {
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) {
      return serveFile(path.join(relativePath, "index.html"), response)
    }

    const body = await fs.readFile(filePath)
    response.writeHead(200, { "content-type": contentType(filePath) })
    response.end(body)
  } catch (error) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" })
    response.end("Not found")
  }
}

test.beforeAll(async () => {
  server = http.createServer((request, response) => {
    void serveFile(request.url || "/", response)
  })

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
  if (!server) {
    return
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

test("party generator loads its assets and works in individual mode", async ({ page }) => {
  const dataResponses = []
  page.on("response", (response) => {
    if (response.url().includes("/data/")) {
      dataResponses.push({
        url: response.url(),
        status: response.status(),
      })
    }
  })

  await page.goto(`${baseUrl}/index.html`)
  await expect(page.getByRole("heading", { name: "Dolmenwood NPC Party Generator" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Generate Random Party" })).toBeVisible()

  await page.getByLabel("Individual").check()
  await page.getByRole("button", { name: "Generate Random Party" }).click()

  await expect(page.locator("#output .card").first()).toBeVisible()
  await expect(page.locator("#error-log")).toHaveText("")
  expect(dataResponses.length).toBe(8)
  expect(dataResponses.every((response) => response.status === 200)).toBe(true)
})

test("generator renders a random party without client errors", async ({ page }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto(`${baseUrl}/index.html`)
  await page.getByRole("button", { name: "Generate Random Party" }).click()
  await expect(page.locator("#output .card").first()).toBeVisible()
  await expect(page.locator("#error-log")).toHaveText("")
  expect(errors).toEqual([])
})
