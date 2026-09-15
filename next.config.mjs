// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Não expõe o framework no header "X-Powered-By".
  poweredByHeader: false,
  images: {
    // Mitigação enquanto o Next.js não é atualizado: o otimizador de imagens
    // nativo concentra CVEs recentes (RCE/DoS no endpoint /_next/image). O site
    // usa <img> diretamente e os logos via next/image, então desligar a
    // otimização não afeta a experiência.
    unoptimized: true,
  },
  experimental: {
    // Evita stale data no backoffice: páginas dinâmicas não ficam em cache
    // no client (form de produto aberto de novo carrega dados do servidor).
    staleTimes: { dynamic: 0 },
  },
};
export default nextConfig;
