import { describe, expect, it } from "vitest";

import { localizeSearchDocument } from "../lib/search-localization";

const storedDocument = `Type
Post
Title
A title
Description
A description
Tag
Philosophy
Body
Body text`;

describe("search result localization", () => {
  it("localizes stored English field labels for Spanish results", () => {
    expect(localizeSearchDocument(storedDocument, "es")).toContain(
      "Tipo\nEnsayo\nTítulo\nA title",
    );
  });

  it("localizes stored English field labels for Russian results", () => {
    expect(localizeSearchDocument(storedDocument, "ru")).toContain(
      "Тип\nЭссе\nНазвание\nA title",
    );
  });

  it("leaves English and unknown locales unchanged", () => {
    expect(localizeSearchDocument(storedDocument, "en")).toBe(storedDocument);
    expect(localizeSearchDocument(storedDocument, "fr")).toBe(storedDocument);
  });
});
