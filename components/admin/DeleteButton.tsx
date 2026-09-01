// components/admin/DeleteButton.tsx
"use client";
import { useRouter } from "next/navigation";

export default function DeleteButton({ kind, id }: { kind: string; id: string }) {
  const router = useRouter();
  async function del() {
    if (!confirm("Excluir este item?")) return;
    try {
      const res = await fetch(`/api/admin/${kind}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Não foi possível excluir.");
        return;
      }
      router.refresh();
    } catch {
      alert("Erro de conexão. Não foi possível excluir.");
    }
  }
  return <button onClick={del} className="text-clay">Excluir</button>;
}
