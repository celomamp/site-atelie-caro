import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(__dirname, "../../components/admin/ProductForm.tsx"),
  "utf8"
);

describe("ProductForm labels (a11y)", () => {
  const fields = [
    "Nome",
    "Slug",
    "Descrição",
    "Preço",
    "Estoque",
    "Peso",
    "Largura",
    "Altura",
    "Comprimento",
  ];
  it.each(fields)("tem <label> visível para o campo %s", (name) => {
    // aceita <label ...>Nome...</label> com htmlFor
    const re = new RegExp(`<label[^>]*>[^<]*${name}`, "i");
    expect(re.test(src)).toBe(true);
  });

  it("cada input tem id ligado a um htmlFor", () => {
    const ids = [...src.matchAll(/<label[^>]*htmlFor="([^"]+)"/g)].map((m) => m[1]);
    // espera pelo menos os 9 campos principais
    expect(ids.length).toBeGreaterThanOrEqual(9);
    for (const id of ids) {
      expect(src).toContain(`id="${id}"`);
    }
  });
});
