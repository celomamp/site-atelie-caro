import CategoryForm from "@/components/admin/CategoryForm";

export default function NovaCategoriaPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Nova categoria</h1>
      <div className="mt-6">
        <CategoryForm />
      </div>
    </div>
  );
}
