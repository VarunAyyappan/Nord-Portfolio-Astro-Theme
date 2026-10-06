import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Records, on every page load, whether the browser revealed the page with a
 * cross-document view transition. Must run before the first navigation.
 */
async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener("pagereveal", (event) => {
      const { viewTransition } = event as PageRevealEvent;
      Reflect.set(
        window,
        "revealedWithViewTransition",
        Boolean(viewTransition),
      );
    });
  });
}

const revealedWithViewTransition = (page: Page) =>
  page.evaluate(() => Reflect.get(window, "revealedWithViewTransition"));

/** Follows the main navigation's link to the Projects Section. */
async function navigateToProjects(page: Page) {
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Projects" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Projects" }),
  ).toBeVisible();
}

/**
 * Whether an element's transitions take any time, and the current values of
 * the properties they transition.
 */
const transitionedStyle = (element: Locator) =>
  element.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      takesTime: style.transitionDuration
        .split(",")
        .some((duration) => Number.parseFloat(duration) > 0),
      values: style.transitionProperty
        .split(",")
        .map((property) => style.getPropertyValue(property.trim())),
    };
  });

/** One page of each template, found by following links as a Visitor would. */
async function pageOfEachTemplate(page: Page): Promise<string[]> {
  const firstArticleLink = async (index: string, list?: string) => {
    await page.goto(index);
    const article = page.getByRole("main").getByRole("article").first();
    const link = list
      ? article.getByRole("list", { name: list }).getByRole("link").first()
      : article.getByRole("heading").getByRole("link");
    return (await link.getAttribute("href")) ?? "";
  };
  return [
    "./",
    "./projects/",
    await firstArticleLink("./projects/"),
    "./blog/",
    await firstArticleLink("./blog/"),
    await firstArticleLink("./blog/", "Tags"),
    "./experience/",
    "./about/",
    "./contact/",
    "./no-such-page/",
  ];
}

/**
 * Every element, or ::before or ::after pseudo-element, on the page with a
 * transition or animation that takes any time, described with its durations.
 */
const elementsInMotion = (page: Page) =>
  page.evaluate(() => {
    const takesTime = (durations: string) =>
      durations.split(",").some((duration) => Number.parseFloat(duration) > 0);
    return [...document.querySelectorAll("*")].flatMap((element) =>
      [null, "::before", "::after"].flatMap((pseudo) => {
        const style = getComputedStyle(element, pseudo);
        const { transitionDuration, animationDuration } = style;
        return takesTime(transitionDuration) || takesTime(animationDuration)
          ? [
              `${element.tagName.toLowerCase()}.${element.className}${pseudo ?? ""}: ` +
                `transition ${transitionDuration}, animation ${animationDuration}`,
            ]
          : [];
      }),
    );
  });

const featuredProjectCard = (page: Page) =>
  page.getByRole("main").getByRole("article").first();

const latestPost = (page: Page) =>
  page.getByRole("main").getByRole("article").last();

/** The links, buttons and cards on Home, found as a Visitor would. */
const onHome: Record<string, (page: Page) => Locator> = {
  "nav link": (page) =>
    page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Projects" }),
  "call-to-action link": (page) =>
    page.getByRole("main").getByRole("link", { name: "View Projects" }),
  "social link": (page) =>
    page.getByRole("contentinfo").getByRole("link").first(),
  "color mode button": (page) =>
    page.getByRole("banner").getByRole("button", { name: /^Color mode/ }),
  "Project card": featuredProjectCard,
  "Project card title": (page) =>
    featuredProjectCard(page).getByRole("heading").getByRole("link"),
  "Post title": (page) =>
    latestPost(page).getByRole("heading").getByRole("link"),
};

test.describe("hover", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const [name, find] of Object.entries(onHome)) {
    test(`eases the ${name} into its hover state`, async ({ page }) => {
      await page.goto("./");
      const element = find(page);
      const atRest = await transitionedStyle(element);
      expect(atRest.takesTime).toBe(true);

      await element.hover();
      await expect
        .poll(async () => (await transitionedStyle(element)).values)
        .not.toEqual(atRest.values);
    });
  }
});

test.describe("page navigation", () => {
  test.use({ reducedMotion: "no-preference" });

  test("animates with a view transition", async ({ page }) => {
    await recordViewTransitions(page);
    await page.goto("./");
    await navigateToProjects(page);
    expect(await revealedWithViewTransition(page)).toBe(true);
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("page navigation has no view transition", async ({ page }) => {
    await recordViewTransitions(page);
    await page.goto("./");
    await navigateToProjects(page);
    expect(await revealedWithViewTransition(page)).toBe(false);
  });

  test("nothing transitions or animates on any page", async ({ page }) => {
    for (const url of await pageOfEachTemplate(page)) {
      await page.goto(url);
      expect(await elementsInMotion(page), url).toEqual([]);
      expect(
        await page.evaluate(() => document.getAnimations().length),
        url,
      ).toBe(0);
    }
  });
});
