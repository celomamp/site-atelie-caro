// components/TrustBar.tsx
const ITEMS = [
  "100% feito à mão",
  "Alta temperatura",
  "Peça única",
  "Retirada em Campinas",
];

export default function TrustBar() {
  return (
    <section className="border-b border-black/5 bg-white">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 text-center text-sm font-medium text-cobalt md:grid-cols-4">
        {ITEMS.map((label) => (
          <li key={label} className="flex items-center justify-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-magenta" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
