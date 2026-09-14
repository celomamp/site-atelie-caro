// components/Footer.tsx
import Image from "next/image";
import { SITE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="bg-cobalt text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-4">
        <div>
          <Image
            src="/logo-atelie-caro-stroke.png"
            alt="Ateliê Carô"
            width={3992}
            height={2215}
            className="h-16 w-auto"
          />
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
        <div className="flex items-start justify-start md:justify-end">
          <Image
            src="/logo-atelie-caro-mini-cor-stroke.png"
            alt="Ateliê Carô"
            width={461}
            height={525}
            className="h-10 w-auto"
          />
        </div>
      </div>
      <div className="border-t border-white/20 py-4 text-center text-xs">
        © {new Date().getFullYear()} Ateliê Carô. Todos os direitos reservados.
      </div>
    </footer>
  );
}
