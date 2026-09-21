// components/EncomendaForm.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import EncomendaForm from "./EncomendaForm";

describe("EncomendaForm", () => {
  it("não exibe a mensagem de sucesso antes do envio", () => {
    const html = renderToStaticMarkup(<EncomendaForm />);

    expect(html).toContain("Enviar encomenda");
    expect(html).not.toContain("Recebemos sua encomenda");
  });
});
