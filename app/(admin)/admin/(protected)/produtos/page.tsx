// app/(admin)/admin/(protected)/produtos/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const selected = categories.find((c) => c.slug === searchParams.categoria);
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    where: selected ? { categories: { some: { id: selected.id } } } : {},
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Produtos</h1>
        <Link href="/admin/produtos/novo" className="rounded bg-cobalt px-4 py-2 font-semibold text-white">
          + Novo produto
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Filtrar por categoria:</span>
        <Link href="/admin/produtos"
          className={`rounded-full px-3 py-1 ${!selected ? "bg-cobalt text-white" : "bg-gray-100"}`}>
          Todas
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/admin/produtos?categoria=${c.slug}`}
            className={`rounded-full px-3 py-1 ${selected?.id === c.id ? "bg-cobalt text-white" : "bg-gray-100"}`}>
            {c.name}
          </Link>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-2">Nome</th><th className="px-4 py-2">Preço</th><th className="px-4 py-2">Estoque</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">R$ {Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-2">{p.stock}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Link href={`/admin/produtos/${p.id}/editar`} className="text-cobalt">Editar</Link>
                  <DeleteButton kind="produtos" id={p.id} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={4}>Nenhum produto nesta categoria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
