"use client";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";
import { buildWhatsAppOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/cart";
import { maskCep, maskPhone } from "@/lib/masks";
import type { DeliveryMethod, ShippingOption } from "@/lib/shipping";

export default function CheckoutForm() {
  const { items, total, clear } = useCart();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("envio");
  const [email, setEmail] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [compl, setCompl] = useState("");
  const [referencia, setReferencia] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [serviceId, setServiceId] = useState("");
  // Cotação retornou 200 ok com lista vazia e o usuário aceitou frete a combinar.
  const [combineFreight, setCombineFreight] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cepAbort = useRef<AbortController | null>(null);
  const lastCepLookup = useRef("");

  // CEP ou itens mudaram → cotação anterior inválida.
  const itemsKey = JSON.stringify(items.map((i) => ({ slug: i.slug, qty: i.qty })));
  useEffect(() => {
    setOptions([]);
    setServiceId("");
    setCombineFreight(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, itemsKey]);

  const selected = options.find((o) => o.id === serviceId) ?? null;
  const displayTotal =
    deliveryMethod === "envio" && selected
      ? Math.round((total + selected.price) * 100) / 100
      : total;

  async function fetchAddress(digits: string) {
    if (digits.length !== 8 || lastCepLookup.current === digits) return;
    lastCepLookup.current = digits;
    cepAbort.current?.abort();
    const ctrl = new AbortController();
    cepAbort.current = ctrl;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (data.erro) return;
      if (typeof data.logradouro === "string" && data.logradouro) setRua(data.logradouro);
      if (typeof data.bairro === "string" && data.bairro) setBairro(data.bairro);
      if (typeof data.localidade === "string" && data.localidade) setCidade(data.localidade);
      if (typeof data.uf === "string" && data.uf) setUf(data.uf);
    } catch {
      // Abort ou ViaCEP indisponível: usuário preenche manualmente.
    } finally {
      if (cepAbort.current === ctrl) {
        cepAbort.current = null;
        setCepLoading(false);
      }
    }
  }

  function handleCepChange(value: string) {
    const masked = maskCep(value);
    setCep(masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8) void fetchAddress(digits);
    else {
      lastCepLookup.current = "";
      cepAbort.current?.abort();
      cepAbort.current = null;
      setCepLoading(false);
    }
  }

  async function handleCepBlur() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    await fetchAddress(digits);
  }

  async function handleQuote() {
    setError(null);
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Informe um CEP válido com 8 dígitos para cotar o frete.");
      return;
    }
    if (items.length === 0) {
      setError("Seu carrinho está vazio.");
      return;
    }
    setQuoting(true);
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: digits,
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Não foi possível cotar o frete.");
      setOptions(Array.isArray(data.options) ? data.options : []);
      setServiceId("");
      if (!Array.isArray(data.options) || data.options.length === 0) {
        // Lista vazia (200 ok): oferece o mesmo caminho frete-a-combinar do
        // checkout — sem auto-submit, o usuário confirma e depois clica Pagar.
        const ok = confirm(
          "Nenhuma opção de frete encontrada para este CEP. Deseja continuar com frete a combinar?"
        );
        if (ok) {
          setCombineFreight(true);
        } else {
          setCombineFreight(false);
          setError("Nenhuma opção de frete encontrada para este CEP.");
        }
      } else {
        setCombineFreight(false);
      }
    } catch (e) {
      setOptions([]);
      setServiceId("");
      setCombineFreight(false);
      setError(e instanceof Error ? e.message : "Não foi possível cotar o frete.");
    } finally {
      setQuoting(false);
    }
  }

  function deliveryPayload(service: string | null) {
    if (deliveryMethod === "retirada") return { deliveryMethod: "retirada" as const };
    return {
      deliveryMethod: "envio" as const,
      email,
      address: { email, cep, rua, numero, compl, ref: referencia, bairro, cidade, uf },
      ...(service ? { serviceId: service } : {}),
    };
  }

  function shippingForWhatsApp() {
    if (deliveryMethod === "retirada") return null;
    return selected
      ? { serviceName: selected.name, price: selected.price, eta: selected.eta }
      : null;
  }

  function handleSend() {
    const message = buildWhatsAppOrderMessage(items, {
      deliveryMethod,
      ...(deliveryMethod === "envio"
        ? { address: { email, cep, rua, numero, compl, ref: referencia, bairro, cidade, uf }, shipping: shippingForWhatsApp() }
        : {}),
    });
    window.open(whatsappLink(message), "_blank");
    if (name && contact) {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          items,
          ...deliveryPayload(serviceId || null),
          ...(selected ? { shipping: { serviceId: selected.id, serviceName: selected.name, price: selected.price, eta: selected.eta } } : {}),
        }),
      }).catch(() => {});
    }
    clear();
  }

  async function postMercadoPago(service: string | null) {
    const res = await fetch("/api/checkout/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contact,
        items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        ...deliveryPayload(service),
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function handleMercadoPago() {
    setError(null);
    if (!name.trim()) {
      setError("Informe seu nome para continuar.");
      return;
    }
    if (deliveryMethod === "envio" && !serviceId && !combineFreight) {
      setError("Cote o frete e escolha uma opção de entrega.");
      return;
    }
    setLoading(true);
    try {
      const { res, data } = await postMercadoPago(serviceId || null);
      if (res.ok && data.initPoint) {
        window.location.href = data.initPoint;
        return;
      }
      // Frete indisponível (502 da cotação ou erro de frete com serviceId):
      // oferece concluir como frete a combinar, sem travar a venda.
      const freightFailure =
        res.status === 502 ||
        (serviceId && typeof data.error === "string" && /frete|cota|serviço|servico|melhor envio/i.test(data.error));
      if (deliveryMethod === "envio" && freightFailure) {
        const ok = confirm(
          "Não foi possível confirmar o frete agora. Deseja concluir com frete a combinar?"
        );
        if (ok) {
          const retry = await postMercadoPago(null);
          if (retry.res.ok && retry.data.initPoint) {
            window.location.href = retry.data.initPoint;
            return;
          }
          throw new Error(retry.data.error || "Não foi possível iniciar o pagamento.");
        }
        setLoading(false);
        return;
      }
      throw new Error(data.error || "Não foi possível iniciar o pagamento.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erro ao iniciar pagamento. Tente novamente."
      );
      setLoading(false);
    }
  }

  const inputCls = "rounded border border-gray-300 px-3 py-2";

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="font-display text-xl font-bold">Finalizar pedido</h2>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="checkout-nome" className="text-sm font-semibold">Seu nome</label>
          <input
            id="checkout-nome"
            name="nome"
            autoComplete="name"
            className={inputCls}
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="checkout-contato" className="text-sm font-semibold">WhatsApp (opcional)</label>
          <input
            id="checkout-contato"
            name="contato"
            autoComplete="tel"
            className={inputCls}
            placeholder="WhatsApp (opcional)"
            value={contact}
            onChange={(e) => setContact(maskPhone(e.target.value))}
          />
        </div>

        <fieldset className="flex gap-2">
          <legend className="text-sm font-semibold">Como quer receber?</legend>
          <label className={`flex-1 cursor-pointer rounded border px-3 py-2 text-center text-sm font-semibold ${deliveryMethod === "envio" ? "border-magenta text-magenta" : "border-gray-300 text-gray-600"}`}>
            <input
              type="radio"
              name="delivery"
              value="envio"
              className="sr-only"
              checked={deliveryMethod === "envio"}
              onChange={() => setDeliveryMethod("envio")}
            />
            Receber em casa
          </label>
          <label className={`flex-1 cursor-pointer rounded border px-3 py-2 text-center text-sm font-semibold ${deliveryMethod === "retirada" ? "border-magenta text-magenta" : "border-gray-300 text-gray-600"}`}>
            <input
              type="radio"
              name="delivery"
              value="retirada"
              className="sr-only"
              checked={deliveryMethod === "retirada"}
              onChange={() => setDeliveryMethod("retirada")}
            />
            Retirar no ateliê
          </label>
        </fieldset>

        {deliveryMethod === "envio" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="checkout-email" className="text-sm font-semibold">E-mail</label>
              <input
                id="checkout-email"
                name="email"
                type="email"
                autoComplete="email"
                className={inputCls}
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="checkout-cep" className="text-sm font-semibold">CEP</label>
                <input
                  id="checkout-cep"
                  name="cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={inputCls}
                  placeholder="13010-000"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  onBlur={handleCepBlur}
                />
                {cepLoading && (
                  <p aria-live="polite" className="text-xs text-gray-500">
                    Buscando endereço…
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="checkout-numero" className="text-sm font-semibold">Número</label>
                <input
                  id="checkout-numero"
                  name="numero"
                  autoComplete="address-line2"
                  className={inputCls}
                  placeholder="123"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="checkout-rua" className="text-sm font-semibold">Rua</label>
              <input
                id="checkout-rua"
                name="rua"
                autoComplete="address-line1"
                className={inputCls}
                placeholder="Rua das Flores"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="checkout-compl" className="text-sm font-semibold">Compl. (opcional)</label>
                <input
                  id="checkout-compl"
                  name="compl"
                  className={inputCls}
                  placeholder="Apto, bloco…"
                  value={compl}
                  onChange={(e) => setCompl(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="checkout-bairro" className="text-sm font-semibold">Bairro</label>
                <input
                  id="checkout-bairro"
                  name="bairro"
                  className={inputCls}
                  placeholder="Centro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="checkout-ref" className="text-sm font-semibold">Referência (opcional)</label>
              <input
                id="checkout-ref"
                name="ref"
                className={inputCls}
                placeholder="Próx. à padaria, portão azul…"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="checkout-cidade" className="text-sm font-semibold">Cidade</label>
                <input
                  id="checkout-cidade"
                  name="cidade"
                  autoComplete="address-level2"
                  className={inputCls}
                  placeholder="Campinas"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="checkout-uf" className="text-sm font-semibold">UF</label>
                <input
                  id="checkout-uf"
                  name="uf"
                  autoComplete="address-level1"
                  className={inputCls}
                  placeholder="SP"
                  maxLength={2}
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuote}
              disabled={quoting || items.length === 0}
              className="rounded border-2 border-gray-300 px-6 py-2 text-sm font-semibold hover:border-magenta hover:text-magenta disabled:cursor-not-allowed disabled:opacity-60"
            >
              {quoting ? "Cotando frete…" : "Calcular frete"}
            </button>
            {options.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold">Opções de frete</legend>
                {options.map((o) => (
                  <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm ${serviceId === o.id ? "border-magenta" : "border-gray-200"}`}>
                    <input
                      type="radio"
                      name="frete"
                      value={o.id}
                      checked={serviceId === o.id}
                      onChange={() => setServiceId(o.id)}
                    />
                    <span className="flex-1 font-semibold">{o.name}</span>
                    <span className="text-gray-500">{o.eta > 0 ? `${o.eta} dias` : "—"}</span>
                    <span className="font-bold text-magenta">{formatBRL(o.price)}</span>
                  </label>
                ))}
              </fieldset>
            )}
          </>
        )}

        <p className="text-sm text-gray-500">
          Total: <span className="font-bold text-magenta">{formatBRL(displayTotal)}</span>
          {deliveryMethod === "envio" && selected && (
            <span className="text-xs"> (produtos {formatBRL(total)} + frete {formatBRL(selected.price)})</span>
          )}
          {deliveryMethod === "retirada" && (
            <span className="text-xs"> (retirada — sem frete)</span>
          )}
        </p>
        <button
          onClick={handleMercadoPago}
          disabled={loading || items.length === 0}
          className="rounded bg-[#0079B2] px-6 py-3 font-semibold text-white hover:bg-[#006494] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Redirecionando…" : "Pagar com Mercado Pago"}
        </button>
        <p className="text-xs text-gray-500">
          Cartão, Pix, boleto ou conta Mercado Pago — você será redirecionado
          para concluir o pagamento com segurança.
        </p>
        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-wide text-gray-500">
          <span className="h-px flex-1 bg-gray-200" />
          ou
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <button
          onClick={handleSend}
          className="rounded border-2 border-magenta px-6 py-3 font-semibold text-magenta hover:bg-pink-50"
        >
          Enviar pedido pelo WhatsApp
        </button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
