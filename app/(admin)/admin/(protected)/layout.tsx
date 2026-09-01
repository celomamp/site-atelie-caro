// app/(admin)/admin/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
