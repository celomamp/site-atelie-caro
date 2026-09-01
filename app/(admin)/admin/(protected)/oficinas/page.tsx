import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminOficinasPage() {
  const workshops = await prisma.workshop.findMany({ orderBy: { date: "asc" } });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Oficinas</h1>
        <Link href="/admin/oficinas/novo" className="rounded bg-cobalt px-4 py-2 font-semibold text-white">
          + Nova oficina
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-2">Título</th><th className="px-4 py-2">Data</th><th className="px-4 py-2">Vagas</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {workshops.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-2">{w.title}</td>
                <td className="px-4 py-2">{new Date(w.date).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-2">{w.spotsTaken}/{w.maxAttendees}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Link href={`/admin/oficinas/${w.id}/editar`} className="text-cobalt">Editar</Link>
                  <DeleteButton kind="oficinas" id={w.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
