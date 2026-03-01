import { expect, test } from "@playwright/test"

test("homepage uses the simplified reading layout", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { level: 1, name: "The Hearth" })).toBeVisible()
  await expect(page.locator(".explorer")).toHaveCount(0)
  await expect(page.locator(".search-button")).toHaveCount(0)
  await expect(page.locator(".toc")).toHaveCount(0)

  const centerWidth = await page.locator(".center").evaluate((element) =>
    Math.round(element.getBoundingClientRect().width),
  )
  expect(centerWidth).toBeLessThanOrEqual(800)

  const linkStyles = await page.locator("article a.internal").first().evaluate((element) => {
    const styles = window.getComputedStyle(element)
    return {
      textDecorationLine: styles.textDecorationLine,
      backgroundColor: styles.backgroundColor,
      paddingLeft: styles.paddingLeft,
      paddingRight: styles.paddingRight,
    }
  })

  expect(linkStyles.textDecorationLine).toContain("underline")
  expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(linkStyles.backgroundColor)
  expect(linkStyles.paddingLeft).toBe("0px")
  expect(linkStyles.paddingRight).toBe("0px")
})

test("hearth routes resolve without the Quartz 404 shell", async ({ page }) => {
  for (const route of ["/hearth", "/hearth/"]) {
    await page.goto(route)
    await expect(page.getByRole("heading", { level: 1, name: "The Hearth" })).toBeVisible()
    await expect(page.getByText("Either this page is private or doesn't exist.")).toHaveCount(0)
  }
})

test("session notes preserve hard line breaks and breadcrumbs", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Session 1" }).click()

  await expect(page).toHaveURL(/\/Chronicles\/Session-1$/)
  await expect(page.locator(".breadcrumb-container")).toBeVisible()
  await expect(page.locator(".explorer")).toHaveCount(0)

  const lineBreakCount = await page.locator("article p", { hasText: "Starting location:" }).locator("br").count()
  expect(lineBreakCount).toBeGreaterThanOrEqual(2)
})

test("iphone webkit layout avoids horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "webkit-iphone", "mobile overflow check only applies to iPhone webkit")

  await page.goto("/")

  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.scrollingElement?.scrollWidth ?? document.documentElement.scrollWidth,
  }))

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewport + 1)
  await expect(page.getByRole("heading", { level: 1, name: "The Hearth" })).toBeVisible()
})
