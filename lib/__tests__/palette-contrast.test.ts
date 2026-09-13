// lib/__tests__/palette-contrast.test.ts
// WCAG AA: texto normal >= 4.5:1
import config from "../../tailwind.config";

function hexToRgb(h: string): [number, number, number] {
  const c = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255) as [number, number, number];
}
function lin(c: number) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function lum(h: string) {
  const [r, g, b] = hexToRgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const l1 = lum(a);
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const colors = (config.theme?.extend?.colors ?? {}) as Record<string, string>;

describe("paleta WCAG AA (texto normal >= 4.5)", () => {
  test("magenta sobre branco passa AA", () => {
    expect(contrast(colors.magenta, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
  test("magenta sobre cream passa AA", () => {
    expect(contrast(colors.magenta, colors.cream)).toBeGreaterThanOrEqual(4.5);
  });
  test("cobalt sobre branco passa AA", () => {
    expect(contrast(colors.cobalt, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
  test("terracotta (fundo oficinas) com texto branco passa AA", () => {
    expect(contrast(colors.terracotta, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
  test("clay sobre branco passa AA", () => {
    expect(contrast(colors.clay, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
  test("branco sobre magenta (badges/botões) passa AA", () => {
    expect(contrast("#FFFFFF", colors.magenta)).toBeGreaterThanOrEqual(4.5);
  });
  test("blush sobre cobalt (detalhes em fundo escuro) passa AA", () => {
    expect(contrast(colors.blush, colors.cobalt)).toBeGreaterThanOrEqual(4.5);
  });
});
