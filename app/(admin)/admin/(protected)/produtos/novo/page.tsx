// app/(admin)/admin/(protected)/produtos/novo/page.tsx
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Novo produto</h1>
      <ProductForm />
    </div>
  );
}
