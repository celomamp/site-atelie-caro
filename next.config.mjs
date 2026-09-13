// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Evita stale data no backoffice: páginas dinâmicas não ficam em cache
    // no client (form de produto aberto de novo carrega dados do servidor).
    staleTimes: { dynamic: 0 },
  },
};
export default nextConfig;
