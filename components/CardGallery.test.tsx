/**
 * @jest-environment jsdom
 */
// components/CardGallery.test.tsx
import { render, screen, fireEvent, act } from "@testing-library/react";
import CardGallery from "./CardGallery";

const images = ["/fotos/a.jpg", "/fotos/b.jpg", "/fotos/c.jpg"];

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

function currentSrc() {
  return screen.getByAltText("Produto").getAttribute("src");
}

function hoverCard() {
  const img = screen.getByAltText("Produto");
  fireEvent.mouseEnter(img.parentElement as HTMLElement);
}

function leaveCard() {
  const img = screen.getByAltText("Produto");
  fireEvent.mouseLeave(img.parentElement as HTMLElement);
}

describe("CardGallery", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockMatchMedia(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("não exibe as bolinhas de indicadores de foto", () => {
    render(<CardGallery images={images} alt="Produto" />);

    expect(screen.queryAllByLabelText(/Ir para foto/)).toHaveLength(0);
  });

  it("mantém as setas de navegação", () => {
    render(<CardGallery images={images} alt="Produto" />);

    expect(screen.getByLabelText("Foto anterior")).toBeTruthy();
    expect(screen.getByLabelText("Próxima foto")).toBeTruthy();
  });

  it("avança a foto automaticamente a cada 2s enquanto o mouse está sobre o card", () => {
    render(<CardGallery images={images} alt="Produto" />);
    expect(currentSrc()).toBe("/fotos/a.jpg");

    hoverCard();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(currentSrc()).toBe("/fotos/b.jpg");

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(currentSrc()).toBe("/fotos/c.jpg");

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(currentSrc()).toBe("/fotos/a.jpg");
  });

  it("para a rolagem automática ao sair do hover", () => {
    render(<CardGallery images={images} alt="Produto" />);

    hoverCard();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(currentSrc()).toBe("/fotos/b.jpg");

    leaveCard();
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(currentSrc()).toBe("/fotos/b.jpg");
  });

  it("reinicia o timer do autoplay ao clicar numa seta", () => {
    render(<CardGallery images={images} alt="Produto" />);

    hoverCard();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByLabelText("Próxima foto"));
    expect(currentSrc()).toBe("/fotos/b.jpg");

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(currentSrc()).toBe("/fotos/b.jpg");

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(currentSrc()).toBe("/fotos/c.jpg");
  });

  it("não faz autoplay quando o usuário prefere menos movimento", () => {
    mockMatchMedia(true);
    render(<CardGallery images={images} alt="Produto" />);

    hoverCard();
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(currentSrc()).toBe("/fotos/a.jpg");
  });
});
