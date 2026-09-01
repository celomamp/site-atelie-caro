// app/(admin)/admin/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Senha incorreta");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="font-display text-2xl font-bold text-center">Admin</h1>
        <input type="password" placeholder="Senha" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-6 w-full rounded border border-gray-300 px-3 py-2" />
        {error && <p className="mt-2 text-sm text-clay">{error}</p>}
        <button className="mt-4 w-full rounded bg-cobalt py-2 font-semibold text-white">Entrar</button>
      </form>
    </div>
  );
}
