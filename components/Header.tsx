// components/Header.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CartButton from "./CartButton";
import FavoritesButton from "./FavoritesButton";

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
        <Link href="/" aria-label="Ateliê Carô — início">
          <Image
            src="/logo-atelie-caro-stroke.png"
            alt="Ateliê Carô"
            width={3992}
            height={2215}
            className="h-20 w-auto"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-blush">
              {n.label}
            </Link>
          ))}
          <FavoritesButton />
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
          <FavoritesButton />
          <CartButton />
        </nav>
      )}
    </header>
  );
}
