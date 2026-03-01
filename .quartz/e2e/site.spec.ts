import { expect, test } from "@playwright/test"

test("homepage keeps the simplified layout and restores the dark mode toggle", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { level: 1, name: "The Hearth" })).toBeVisible()
  await expect(page.locator(".darkmode")).toBeVisible()
  await expect(page.locator(".explorer")).toHaveCount(0)
  await expect(page.locator(".search-button")).toHaveCount(0)

  const centerWidth = await page.locator(".center").evaluate((element) =>
    Math.round(element.getBoundingClientRect().width),
  )
  expect(centerWidth).toBeLessThanOrEqual(800)
})

test("theme toggle updates the saved theme state", async ({ page }) => {
  await page.goto("/")

  const root = page.locator("html")
  const toggle = page.locator(".darkmode")
  const initialTheme = await root.getAttribute("saved-theme")

  await toggle.click()

  const toggledTheme = await root.getAttribute("saved-theme")
  const storedTheme = await page.evaluate(() => localStorage.getItem("theme"))

  expect(toggledTheme).not.toBe(initialTheme)
  expect(storedTheme).toBe(toggledTheme)
})

test("content pages show a desktop toc and keep the article readable", async ({ page }, testInfo) => {
  await page.goto("/Above-the-table/System-cheat-sheet")

  await expect(page.getByRole("heading", { level: 1, name: "System cheat sheet" })).toBeVisible()
  await expect(page.locator(".darkmode")).toBeVisible()

  const toc = page.locator(".toc")
  if (testInfo.project.name === "webkit-iphone") {
    await expect(toc).not.toBeVisible()
  } else {
    await expect(toc).toBeVisible()
    await expect(toc.getByRole("link", { name: "The four types of rolls" })).toBeVisible()
    await expect(toc.getByRole("link", { name: "Ability checks - d6" })).toBeVisible()
  }

  const layout = await page.evaluate(() => {
    const center = document.querySelector(".center")
    const toc = document.querySelector(".sidebar.right")
    return {
      viewport: window.innerWidth,
      scrollWidth: document.scrollingElement?.scrollWidth ?? document.documentElement.scrollWidth,
      centerWidth: center ? Math.round(center.getBoundingClientRect().width) : null,
      tocWidth: toc ? Math.round(toc.getBoundingClientRect().width) : null,
    }
  })

  expect(layout.centerWidth).not.toBeNull()
  expect(layout.centerWidth!).toBeLessThanOrEqual(800)
  expect(layout.tocWidth).not.toBeNull()
  if (testInfo.project.name === "webkit-iphone") {
    expect(layout.tocWidth).toBe(0)
  } else {
    expect(layout.tocWidth!).toBeGreaterThan(0)
  }
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport + 1)
})

test("hearth routes resolve without the Quartz 404 shell", async ({ page }) => {
  for (const route of ["/hearth", "/hearth/"]) {
    await page.goto(route)
    await expect(page.getByRole("heading", { level: 1, name: "The Hearth" })).toBeVisible()
    await expect(page.getByText("Either this page is private or doesn't exist.")).toHaveCount(0)
  }
})

test("session notes preserve hard line breaks and breadcrumbs", async ({ page }, testInfo) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Session 1" }).click()

  await expect(page).toHaveURL(/\/Chronicles\/Session-1$/)
  await expect(page.locator(".breadcrumb-container")).toBeVisible()
  await expect(page.locator(".explorer")).toHaveCount(0)

  if (testInfo.project.name === "webkit-iphone") {
    await expect(page.locator(".toc")).not.toBeVisible()
  } else {
    await expect(page.locator(".toc")).toBeVisible()
  }

  const lineBreakCount = await page
    .locator("article p", { hasText: "Starting location:" })
    .locator("br")
    .count()
  expect(lineBreakCount).toBeGreaterThanOrEqual(2)
})

test("iphone webkit layout hides the toc and avoids horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "webkit-iphone", "mobile overflow check only applies to iPhone webkit")

  await page.goto("/Above-the-table/System-cheat-sheet")

  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.scrollingElement?.scrollWidth ?? document.documentElement.scrollWidth,
  }))

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewport + 1)
  await expect(page.getByRole("heading", { level: 1, name: "System cheat sheet" })).toBeVisible()
  await expect(page.locator(".darkmode")).toBeVisible()
  await expect(page.locator(".toc")).not.toBeVisible()
})
