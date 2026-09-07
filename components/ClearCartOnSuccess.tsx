// components/ClearCartOnSuccess.tsx
// "use client" — limpa o carrinho quando o pagamento é confirmado.
"use client";
import { useEffect } from "react";
import { useCart } from "./CartContext";

export default function ClearCartOnSuccess() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
