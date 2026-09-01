// components/admin/DeleteButton.tsx
"use client";
import { useRouter } from "next/navigation";

export default function DeleteButton({ kind, id }: { kind: string; id: string }) {
  const router = useRouter();
  async function del() {
    if (!confirm("Excluir este item?")) return;
    await fetch(`/api/admin/${kind}/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return <button onClick={del} className="text-clay">Excluir</button>;
}
