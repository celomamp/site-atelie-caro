#!/usr/bin/env python3
"""Otimiza as fotos de docs/Fotos Atelie/Produto-XX para WebP (web).

Gera os arquivos otimizados em docs/Fotos Atelie/_otimizado/Produto-XX/
e um índice JSON (index.json) com a ordem dos arquivos por produto.
"""
import json
import os
import sys
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(RAIZ, "docs", "Fotos Atelie")
DESTINO = os.path.join(ORIGEM, "_otimizado")

MAX_LADO = 1600
QUALIDADE = 82


def otimizar(origem: str, destino: str) -> tuple[int, int]:
    img = Image.open(origem)
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")
    img.thumbnail((MAX_LADO, MAX_LADO), Image.LANCZOS)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    img.save(destino, "WEBP", quality=QUALIDADE, method=6)
    return img.size


def main() -> None:
    if not os.path.isdir(ORIGEM):
        sys.exit(f"Diretório não encontrado: {ORIGEM}")

    produtos = sorted(
        d for d in os.listdir(ORIGEM)
        if d.startswith("Produto-") and os.path.isdir(os.path.join(ORIGEM, d))
    )
    indice: dict[str, list[str]] = {}
    total_entrada = 0
    total_saida = 0

    for cod in produtos:
        pasta = os.path.join(ORIGEM, cod)
        arquivos = sorted(
            f for f in os.listdir(pasta)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        )
        saida_pasta = os.path.join(DESTINO, cod)
        convertidos: list[str] = []
        for nome in arquivos:
            base = os.path.splitext(nome)[0] + ".webp"
            origem = os.path.join(pasta, nome)
            destino = os.path.join(saida_pasta, base)
            tamanho = otimizar(origem, destino)
            convertidos.append(base)
            total_entrada += os.path.getsize(origem)
            total_saida += os.path.getsize(destino)
            print(f"  {cod}/{nome} -> {tamanho[0]}x{tamanho[1]} {base}")
        indice[cod] = convertidos

    with open(os.path.join(DESTINO, "index.json"), "w", encoding="utf-8") as fh:
        json.dump(indice, fh, ensure_ascii=False, indent=2)

    n = sum(len(v) for v in indice.values())
    print(f"\n{len(produtos)} produtos | {n} fotos")
    print(f"entrada {total_entrada / 1e6:.1f} MB -> saída {total_saida / 1e6:.1f} MB")
    print("Índice:", os.path.join(DESTINO, "index.json"))


if __name__ == "__main__":
    main()
