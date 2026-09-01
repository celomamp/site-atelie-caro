# Ateliê Carô — E-commerce

E-commerce para o Ateliê Carô (cerâmica artesanal): vitrine de produtos,
encomendas personalizadas e oficinas, com pedidos via WhatsApp e painel admin.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite

## Configuração

1. Copie `.env.example` para `.env` e preencha `ADMIN_PASSWORD`, `NEXT_PUBLIC_WHATSAPP`, `SESSION_SECRET`, etc. Use valores próprios — especialmente `SESSION_SECRET` (obrigatório em produção) e `ADMIN_PASSWORD`.
2. Instale e prepare o banco:
   ```bash
   npm install
   npx prisma db push
   npx prisma db seed
   ```
3. Rode:
   ```bash
   npm run dev
   ```

## Áreas

- Vitrine pública: `/`, `/produtos`, `/encomendas`, `/oficinas`, `/sobre`, `/contato`, `/carrinho`
- Admin: `/admin/login` (senha em `ADMIN_PASSWORD`)
- Uploads: `public/uploads/`
