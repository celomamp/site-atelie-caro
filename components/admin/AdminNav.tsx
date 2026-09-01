// components/admin/AdminNav.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/oficinas", label: "Oficinas" },
  { href: "/admin/encomendas", label: "Encomendas" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export default function AdminNav() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-gray-200 px-6 py-4">
      <Link href="/admin" className="font-display text-xl font-bold">Ateliê Carô Admin</Link>
      <div className="flex flex-1 gap-4">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-cobalt">
            {l.label}
          </Link>
        ))}
      </div>
      <button onClick={logout} className="text-sm text-clay">Sair</button>
    </nav>
  );
}
