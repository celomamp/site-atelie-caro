// components/AnnouncementBar.tsx
export default function AnnouncementBar() {
  return (
    <div className="bg-magenta text-white">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs font-medium sm:text-sm">
        Peças únicas feitas à mão
        <span aria-hidden className="mx-2 hidden sm:inline">·</span>
        <span className="hidden sm:inline">Envio para todo o Brasil</span>
        <span aria-hidden className="mx-2 hidden sm:inline">·</span>
        <span className="hidden sm:inline">Retirada em Campinas</span>
      </p>
    </div>
  );
}
