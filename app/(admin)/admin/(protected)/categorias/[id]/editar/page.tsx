import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoryForm from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditarCategoriaPage({ params }: { params: { id: string } }) {
  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) notFound();
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Editar categoria</h1>
      <div className="mt-6">
        <CategoryForm
          initial={{ name: category.name, slug: category.slug }}
          categoryId={category.id}
        />
      </div>
    </div>
  );
}
