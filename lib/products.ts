// lib/products.ts

/**
 * Mapeia o parâmetro `ordenar` da listagem pública para o `orderBy` do Prisma.
 * Valores desconhecidos ou ausentes caem no padrão (mais recentes primeiro).
 */
export function productOrderBy(ordenar?: string) {
  switch (ordenar) {
    case "menor":
      return { price: "asc" } as const;
    case "maior":
      return { price: "desc" } as const;
    case "az":
      return { name: "asc" } as const;
    case "za":
      return { name: "desc" } as const;
    default:
      return { createdAt: "desc" } as const;
  }
}
