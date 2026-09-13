import {
  parseFavorites,
  toggleFavorite,
  isFavorite,
  filterFavoriteSlugs,
} from "@/lib/favorites";

describe("parseFavorites", () => {
  it("parses a JSON array of slugs", () => {
    expect(parseFavorites('["a","b"]')).toEqual(["a", "b"]);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseFavorites("not json")).toEqual([]);
  });

  it("filters out non-string and empty entries", () => {
    expect(parseFavorites('["a", 42, null, "", "b"]')).toEqual(["a", "b"]);
  });

  it("returns empty array for null/undefined", () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites(undefined)).toEqual([]);
  });
});

describe("toggleFavorite", () => {
  it("adds a slug when not present", () => {
    expect(toggleFavorite([], "a")).toEqual(["a"]);
  });

  it("removes a slug when already present", () => {
    expect(toggleFavorite(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("isFavorite", () => {
  it("returns true when slug is in the list", () => {
    expect(isFavorite(["a", "b"], "b")).toBe(true);
  });

  it("returns false when slug is not in the list", () => {
    expect(isFavorite(["a"], "z")).toBe(false);
  });
});

describe("filterFavoriteSlugs", () => {
  it("keeps only products whose slug is favorited", () => {
    const products = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];
    expect(filterFavoriteSlugs(products, ["b", "c"])).toEqual([
      { slug: "b" },
      { slug: "c" },
    ]);
  });

  it("returns empty array when no favorites", () => {
    expect(filterFavoriteSlugs([{ slug: "a" }], [])).toEqual([]);
  });
});
