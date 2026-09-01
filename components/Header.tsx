// components/Header.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import CartButton from "./CartButton";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/encomendas", label: "Encomendas" },
  { href: "/oficinas", label: "Oficinas" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-cobalt text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-2xl font-bold">
          Ateliê <span className="text-magenta">Carô</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-blush">
              {n.label}
            </Link>
          ))}
          <CartButton />
        </nav>
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          ☰
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Menu de navegação" className="flex flex-col gap-3 px-4 pb-4 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <CartButton />
        </nav>
      )}
    </header>
  );
}
