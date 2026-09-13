import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminCategoriasPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Categorias</h1>
        <Link href="/admin/categorias/nova" className="rounded bg-cobalt px-4 py-2 font-semibold text-white">
          + Nova categoria
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-2">Nome</th><th className="px-4 py-2">Slug</th><th className="px-4 py-2">Produtos</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2 text-gray-500">{c.slug}</td>
                <td className="px-4 py-2">{c._count.products}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Link href={`/admin/categorias/${c.id}/editar`} className="text-cobalt">Editar</Link>
                  <DeleteButton kind="categorias" id={c.id} />
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={4}>Nenhuma categoria cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
