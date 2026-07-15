import { describe, expect, it } from "vitest";

import { cn, getBaseURL } from "../lib/utils";

describe("shared utilities", () => {
  it("merges conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("px-2", false && "hidden", ["text-sm", "px-4"])).toBe(
      "text-sm px-4",
    );
  });

  it("uses the local URL outside a production build", () => {
    expect(getBaseURL()).toBe("http://localhost:3000");
  });
});
