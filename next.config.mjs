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
  // Headers de segurança aplicados a todas as rotas. A CSP começa em
  // Report-Only (não bloqueia) porque o Next injeta scripts inline sem nonce;
  // migrar para enforce depende do upgrade do Next (#2 do backlog).
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://viacep.com.br https://api.mercadopago.com https://*.mercadopago.com https://*.supabase.co",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};
export default nextConfig;
