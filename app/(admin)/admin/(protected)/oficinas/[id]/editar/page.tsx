import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkshopForm from "@/components/admin/WorkshopForm";

export const dynamic = "force-dynamic";

export default async function EditWorkshopPage({ params }: { params: { id: string } }) {
  const workshop = await prisma.workshop.findUnique({ where: { id: params.id } });
  if (!workshop) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Editar oficina</h1>
      <WorkshopForm initial={workshop} workshopId={workshop.id} />
    </div>
  );
}
