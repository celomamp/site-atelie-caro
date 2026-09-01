// lib/config.ts
export const SITE = {
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "",
  address: process.env.NEXT_PUBLIC_ADDRESS || "",
  hours: process.env.NEXT_PUBLIC_HOURS || "",
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Ateliê Carô",
};
