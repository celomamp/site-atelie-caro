// app/(admin)/admin/(protected)/produtos/[id]/editar/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Editar produto</h1>
      <ProductForm initial={product} productId={product.id} />
    </div>
  );
}
