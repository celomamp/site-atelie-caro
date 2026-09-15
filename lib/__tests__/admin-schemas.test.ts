import {
  productCreateSchema,
  productUpdateSchema,
  workshopCreateSchema,
  categorySchema,
  encomendaStatusSchema,
} from "../admin-schemas";

describe("productCreateSchema", () => {
  const valid = {
    name: "Xícara",
    slug: "xicara",
    description: "Feita à mão",
    price: "90.5",
  };

  it("accepts a valid payload and coerces numbers", () => {
    const parsed = productCreateSchema.parse(valid);
    expect(parsed.price).toBe(90.5);
    expect(parsed.stock).toBe(1);
    expect(parsed.weight).toBe(2);
    expect(parsed.featured).toBe(false);
    expect(parsed.images).toEqual([]);
    expect(parsed.categories).toEqual([]);
  });

  it("strips unknown fields (mass assignment)", () => {
    const parsed = productCreateSchema.parse({
      ...valid,
      id: "hack",
      createdAt: "2026-01-01",
      isAdmin: true,
    });
    expect(parsed).not.toHaveProperty("id");
    expect(parsed).not.toHaveProperty("createdAt");
    expect(parsed).not.toHaveProperty("isAdmin");
  });

  it("rejects empty or invalid values", () => {
    expect(productCreateSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...valid, price: "abc" }).success).toBe(false);
  });
});

describe("productUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(productUpdateSchema.safeParse({ name: "Novo" }).success).toBe(true);
    expect(productUpdateSchema.safeParse({}).success).toBe(true);
  });
});

describe("workshopCreateSchema", () => {
  it("parses the workshop form payload", () => {
    const parsed = workshopCreateSchema.parse({
      title: "Torno",
      slug: "torno",
      description: "Aula",
      date: "2026-10-01T13:00:00.000Z",
      price: "250",
      duration: "180",
      maxAttendees: "8",
      spotsTaken: "2",
      image: "",
    });
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.price).toBe(250);
    expect(parsed.image).toBeNull();
    expect(parsed.active).toBe(true);
  });

  it("rejects a missing date", () => {
    expect(
      workshopCreateSchema.safeParse({
        title: "Torno",
        slug: "torno",
        description: "Aula",
        price: 250,
      }).success
    ).toBe(false);
  });
});

describe("categorySchema", () => {
  it("requires name and slug", () => {
    expect(categorySchema.safeParse({ name: "Vasos", slug: "vasos" }).success).toBe(true);
    expect(categorySchema.safeParse({ name: "  ", slug: "vasos" }).success).toBe(false);
  });
});

describe("encomendaStatusSchema", () => {
  it("only accepts known statuses", () => {
    expect(encomendaStatusSchema.safeParse("confirmada").success).toBe(true);
    expect(encomendaStatusSchema.safeParse("pendente").success).toBe(false);
    expect(encomendaStatusSchema.safeParse(undefined).success).toBe(false);
  });
});
