import { readFileSync } from "fs";
import { join } from "path";

function srcOf(rel: string) {
  return readFileSync(join(__dirname, "../../components/admin", rel), "utf8");
}

describe("WorkshopForm labels", () => {
  const src = srcOf("WorkshopForm.tsx");
  const fields = [
    "Título",
    "Slug",
    "Descrição",
    "Data",
    "Duração",
    "Preço",
    "Local",
    "Vagas máximas",
    "Vagas ocupadas",
    "URL da imagem",
  ];
  it.each(fields)("tem <label> visível para %s", (name) => {
    expect(new RegExp(`<label[^>]*>[^<]*${name}`, "i").test(src)).toBe(true);
  });
  it("inputs ligados via htmlFor/id", () => {
    const ids = [...src.matchAll(/<label[^>]*htmlFor="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    for (const id of ids) expect(src).toContain(`id="${id}"`);
  });
});

describe("CategoryForm labels", () => {
  const src = srcOf("CategoryForm.tsx");
  it.each(["Nome", "Slug"])("tem <label> visível para %s", (name) => {
    expect(new RegExp(`<label[^>]*>[^<]*${name}`, "i").test(src)).toBe(true);
  });
  it("inputs ligados via htmlFor/id", () => {
    const ids = [...src.matchAll(/<label[^>]*htmlFor="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    for (const id of ids) expect(src).toContain(`id="${id}"`);
  });
});
