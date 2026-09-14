// app/layout.tsx
import type { Metadata } from "next";
import { Caprasimo, Poppins, Permanent_Marker } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const caprasimo = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-caprasimo",
});
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});
const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
});

export const metadata: Metadata = {
  title: "Ateliê Carô — Cerâmica Artesanal",
  description:
    "Peças de cerâmica artesanal de alta temperatura, encomendas personalizadas e oficinas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${caprasimo.variable} ${poppins.variable} ${permanentMarker.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
