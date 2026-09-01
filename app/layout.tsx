// app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Montserrat, Pacifico } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

export const metadata: Metadata = {
  title: "Ateliê Carô — Cerâmica Artesanal",
  description:
    "Peças de cerâmica artesanal de alta temperatura, encomendas personalizadas e oficinas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${playfair.variable} ${montserrat.variable} ${pacifico.variable}`}>
        {children}
      </body>
    </html>
  );
}
