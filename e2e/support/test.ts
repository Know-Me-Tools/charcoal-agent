/**
 * Shared Playwright `test` with the UAR mock installed for every test.
 * A test fails if the UI called a backend path that has no fixture.
 */
import { test as base, expect } from "@playwright/test";
import { installUarMock, type UarMock } from "./uar-mock";

export const test = base.extend<{ uar: UarMock }>({
  uar: [
    async ({ page }, use) => {
      const mock = await installUarMock(page);
      await use(mock);
      expect(mock.unmocked, `Unmocked backend requests: ${mock.unmocked.join(", ")}`).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
