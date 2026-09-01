// components/Footer.tsx
import { SITE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="bg-cobalt text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-bold">Ateliê <span className="text-magenta">Carô</span></p>
          <p className="mt-2 text-sm">Cerâmica artesanal de alta temperatura.</p>
        </div>
        <div>
          <p className="font-semibold">Contato</p>
          <p className="mt-2 text-sm">WhatsApp: {SITE.whatsapp}</p>
          <p className="text-sm">Instagram: {SITE.instagram}</p>
        </div>
        <div>
          <p className="font-semibold">Localização</p>
          <p className="mt-2 text-sm">{SITE.address}</p>
          <p className="text-sm">{SITE.hours}</p>
        </div>
      </div>
      <div className="border-t border-white/20 py-4 text-center text-xs">
        © {new Date().getFullYear()} Ateliê Carô. Todos os direitos reservados.
      </div>
    </footer>
  );
}
