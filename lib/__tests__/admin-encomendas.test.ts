import fs from "fs";
import path from "path";
import { filterEncomendasByStatus } from "../../lib/encomendas";

function routeSource(...segments: string[]): string {
  return fs.readFileSync(path.join(process.cwd(), "app", "api", ...segments), "utf8");
}

describe("admin encomendas freshness (regressão do cache HIT)", () => {
  it("declara dynamic force-dynamic no GET /api/admin/encomendas", () => {
    expect(routeSource("admin", "encomendas", "route.ts")).toMatch(
      /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/
    );
  });

  it("declara dynamic force-dynamic no GET /api/admin/categorias", () => {
    expect(routeSource("admin", "categorias", "route.ts")).toMatch(
      /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/
    );
  });
});

describe("filterEncomendasByStatus", () => {
  const orders = [
    { id: "1", status: "nova" },
    { id: "2", status: "em_orcamento" },
    { id: "3", status: "nova" },
  ];

  it("returns all orders for 'todas'", () => {
    expect(filterEncomendasByStatus(orders, "todas")).toHaveLength(3);
  });

  it("filters by status", () => {
    expect(filterEncomendasByStatus(orders, "nova").map((o) => o.id)).toEqual(["1", "3"]);
    expect(filterEncomendasByStatus(orders, "em_orcamento").map((o) => o.id)).toEqual(["2"]);
  });

  it("returns empty for a status with no orders", () => {
    expect(filterEncomendasByStatus(orders, "cancelada")).toEqual([]);
  });
});
