# Envio + Retirada com Melhor Envio — Design Spec

**Data:** 2026-09-13
**Status:** Aprovado (aguardando revisão final da spec)

## 1. Objetivo

Permitir que o cliente escolha entre **envio via Melhor Envio** e **retirada em Campinas**, coletar o endereço completo antes do pagamento e somar o frete escolhido no total pago via Mercado Pago. Hoje o checkout só coleta nome/contato (`components/CheckoutForm.tsx`) e o `Order` não tem endereço (`prisma/schema.prisma`).

Decisões aprovadas: toggle envio/retirada, peso/dimensões por produto com default de caixa padrão + backfill, frete somado no Mercado Pago, cotação real via API do Melhor Envio com fallback para fluxo manual.

## 2. Opções de frete avaliadas

- **A — Cotação real via API (escolhida):** `POST /api/v2/me/shipment/calculate` com CEP origem + CEP destino + produtos (peso kg, dimensões cm, valor segurado). Retorna `custom_price` / `custom_delivery_time` por serviço (PAC, SEDEX, Jadlog). Cliente escolhe no checkout.
- **B — Só coletar endereço:** sem integração, etiqueta comprada manual no painel do ME, frete acertado depois. Mantida como **fallback** se a API falhar.
- **C — Tabela fixa:** valor único por região. Descartada no MVP (come margem em cerâmica pesada para Norte/Nordeste).

Fonte: docs Melhor Envio — cotação por produtos, `custom_price` reflete descontos do lojista, sandbox só Correios/Jadlog, token OAuth2 30 dias, header `User-Agent` obrigatório.

## 3. UX — `app/(site)/carrinho` + `CheckoutForm`

- Toggle: `Envio para meu endereço` | `Retirar em Campinas (grátis)`.
- Modo envio: nome, WhatsApp, e-mail (p/ preferência MP), CEP (valida 8 dígitos, autofill via ViaCEP), rua, número, complemento (opc.), bairro, cidade, UF, botão "Calcular frete" → radio de serviços (nome + R$ + prazo) → total = produtos + frete. Troca de CEP ou qty invalida a cotação (re-calcular).
- Modo retirada: só nome/contato, frete R$0, exibe endereço de retirada (SITE.address).
- Ambos os fluxos WhatsApp e Mercado Pago passam a incluir `deliveryMethod` + endereço.

## 4. Dados (Prisma)

`Product` += `weight Float @default(2.0)` (kg), `width Float @default(30)`, `height Float @default(20)`, `length Float @default(20)` (cm). Backfill dos existentes com esses defaults via `updateMany` na migration. Admin de produtos ganha os 4 campos com os mesmos defaults no form.

`Order` += `deliveryMethod String @default("envio")` (`envio|retirada`), `addressEmail String` (obrigatório no envio, vai p/ `payer`), `addressCep, addressRua, addressNumero String, addressCompl String?, addressBairro, addressCidade, addressUf String`, `shippingServiceId String?`, `shippingServiceName String?`, `shippingPrice Decimal?`, `shippingEta Int?` (dias). Pedido WhatsApp usa os mesmos campos.

## 5. Backend

- `POST /api/shipping/quote` (novo): body `{ cepDestino, items: [{slug, qty}] }`. Server busca produtos no banco (preço/peso/dimensões nunca vêm do client), monta payload ME `{ from: {postal_code: ORIGEM}, to: {postal_code}, products: [{weight, width, height, length, insurance_value, quantity}] }`, chama `https://melhorenvio.com.br/api/v2/me/shipment/calculate` (ou sandbox), retorna `[{id, name, price: custom_price, eta: custom_delivery_time}]`. Cache curto + timeout 8s + erro amigável.
- `POST /api/checkout/mercadopago` (alterar): valida `deliveryMethod`; se `envio`, exige endereço completo + `serviceId` e **recalcula** a cotação server-side (anti-adulteração); `total = produtos + frete`; cria `Order` com endereço; cria preferência MP com `payer {name, email}` + `shipments {cost: frete, mode: "not_specified", receiver_address {zip_code, street_name, street_number, city_name, state_name}}` (retirada: `local_pickup: true`, cost 0). `lib/mercadopago.ts`: `PreferencePayload` += `payer?`/`shipments?`, `validateCheckoutInput` valida novo schema.
- `POST /api/orders` (WhatsApp): aceita os mesmos campos de entrega.

## 6. Operação / Admin

`/admin/pedidos` exibe bloco entrega: método, endereço formatado, serviço + preço + prazo, total quebrado (produtos / frete). MVP: etiqueta comprada **manual** no painel do ME (copiar dados). Fora do escopo MVP: compra de etiqueta via API, webhook de rastreio, NF-e/DCe, frete grátis por faixa.

## 7. Erros e fallback

ME fora do ar / token inválido / CEP inválido / produto sem dimensão → 400/502 com mensagem amigável, checkout permite concluir como "frete a combinar" (salva endereço, `shippingPrice null`, status igual) para não travar venda. Log server com `console.error` (padrão atual).

## 8. Config e testes

Env: `MELHOR_ENVIO_TOKEN`, `MELHOR_ENVIO_ORIGEM_CEP` (Campinas — lojista informa), `MELHOR_ENVIO_AMBIENTE`. Testes: unit `validateCheckoutInput` + `buildPreferencePayload` com shipments, `parseOrderItems` com frete; integração mockada de `/api/shipping/quote`; e2e manual carrinho → cotação → MP sandbox → admin.
