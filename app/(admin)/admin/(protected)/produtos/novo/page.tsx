// app/(admin)/admin/(protected)/produtos/novo/page.tsx
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Novo produto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
