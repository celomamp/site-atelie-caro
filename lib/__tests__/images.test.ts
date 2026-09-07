import { parseImages, nextIndex, prevIndex } from "@/lib/images";

describe("parseImages", () => {
  it("parses a JSON array of image paths", () => {
    expect(parseImages('["a.jpg","b.jpg"]')).toEqual(["a.jpg", "b.jpg"]);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseImages("not json")).toEqual([]);
  });

  it("returns empty array when JSON is not an array", () => {
    expect(parseImages('{"url":"a.jpg"}')).toEqual([]);
  });

  it("filters out non-string entries", () => {
    expect(parseImages('["a.jpg", 42, null, "b.jpg"]')).toEqual(["a.jpg", "b.jpg"]);
  });

  it("accepts an already-parsed array", () => {
    expect(parseImages(["a.jpg", "b.jpg"])).toEqual(["a.jpg", "b.jpg"]);
  });

  it("returns empty array for undefined or null", () => {
    expect(parseImages(undefined)).toEqual([]);
    expect(parseImages(null)).toEqual([]);
  });
});

describe("gallery navigation", () => {
  describe("nextIndex", () => {
    it("advances within bounds", () => {
      expect(nextIndex(0, 3)).toBe(1);
      expect(nextIndex(1, 3)).toBe(2);
    });

    it("wraps around to 0 at the end", () => {
      expect(nextIndex(2, 3)).toBe(0);
    });
  });

  describe("prevIndex", () => {
    it("goes back within bounds", () => {
      expect(prevIndex(2, 3)).toBe(1);
      expect(prevIndex(1, 3)).toBe(0);
    });

    it("wraps around to the last image at the start", () => {
      expect(prevIndex(0, 3)).toBe(2);
    });
  });

  it("handles single-image galleries", () => {
    expect(nextIndex(0, 1)).toBe(0);
    expect(prevIndex(0, 1)).toBe(0);
  });
});
