// scripts/seed-produtos-atelie.ts
// Cadastra no Supabase os 13 produtos do Ateliê a partir das fotos otimizadas
// em "docs/Fotos Atelie/_otimizado". Idempotente por slug: produtos já
// existentes são pulados. Use --dry para apenas simular.
import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");
const OTIMIZADO = path.join(process.cwd(), "docs", "Fotos Atelie", "_otimizado");
const BUCKET = "produtos";
const MEDIA_PREFIX = "media/";

type CategoriaSeed = { slug: string; name: string };

const CATEGORIAS: CategoriaSeed[] = [
  { slug: "linha-terracota", name: "Linha Terracota" },
  { slug: "canecas-orixas", name: "Canecas Orixás" },
  { slug: "canecas-orientais", name: "Canecas Orientais" },
  { slug: "canecas-personalizadas", name: "Canecas Personalizadas" },
  { slug: "linha-verde-menta", name: "Linha Verde Menta" },
  { slug: "saboneteiras", name: "Saboneteiras" },
];

type ProdutoSeed = {
  cod: string;
  slug: string;
  name: string;
  categoria: string;
  description: string;
};

const PRODUTOS: ProdutoSeed[] = [
  {
    cod: "Produto-01",
    slug: "pote-terracota-tampa-coracao",
    name: "Pote Terracota com Tampa — Coração",
    categoria: "linha-terracota",
    description:
      "Pote de cerâmica terracota com tampa, decorado com pequenas flores azuis. Interior esmaltado em tom creme. Ideal para manteiga, geleias ou temperos. Peça única, feita à mão.",
  },
  {
    cod: "Produto-02",
    slug: "caneca-caboclo-curumim",
    name: "Caneca Caboclo Curumim",
    categoria: "canecas-orixas",
    description:
      "Caneca de grês com esmalte verde esmeralda e base texturizada natural. Interior verde. Carimbo 'Caboclo Curumim'. Feita à mão, peça única.",
  },
  {
    cod: "Produto-03",
    slug: "caneca-jurema-dos-ventos",
    name: "Caneca Jurema dos Ventos",
    categoria: "canecas-orixas",
    description:
      "Caneca de grês verde esmeralda com interior vermelho vibrante. Base texturizada natural e carimbo 'Jurema dos Ventos'. Peça artesanal única.",
  },
  {
    cod: "Produto-04",
    slug: "caneca-osanyi-oya",
    name: "Caneca Osânyi & Oyá",
    categoria: "canecas-orixas",
    description:
      "Caneca de grês com esmalte verde translúcido de efeito orgânico e interior vermelho. Carimbo 'Osânyi & Oyá'. Peça artesanal única.",
  },
  {
    cod: "Produto-05",
    slug: "caneca-oya-xango",
    name: "Caneca Oyá Xangô",
    categoria: "canecas-orixas",
    description:
      "Caneca de grês vermelho telha com interior vermelho. Base texturizada natural e carimbo 'Oyá Xangô'. Peça artesanal única.",
  },
  {
    cod: "Produto-06",
    slug: "caneca-oxum-ogum",
    name: "Caneca Oxum & Ogum",
    categoria: "canecas-orixas",
    description:
      "Caneca de grês azul cobalto com interior amarelo-mostarda. Base texturizada natural e carimbo 'Oxum & Ogum'. Peça artesanal única.",
  },
  {
    cod: "Produto-07",
    slug: "caneca-ideograma-ouro",
    name: "Caneca Ideograma 金",
    categoria: "canecas-orientais",
    description:
      "Caneca de grês azul cobalto com ideograma japonês 金 (ouro) em dourado. Interior claro. Peça artesanal única.",
  },
  {
    cod: "Produto-08",
    slug: "caneca-personalizada-turquesa",
    name: "Caneca Personalizada Turquesa",
    categoria: "canecas-personalizadas",
    description:
      "Caneca de grês turquesa com nome gravado à mão na base — presente personalizado. Feita sob encomenda.",
  },
  {
    cod: "Produto-09",
    slug: "conjunto-linha-verde-menta",
    name: "Conjunto Linha Verde Menta",
    categoria: "linha-verde-menta",
    description:
      "Linha Verde Menta em cerâmica com listras verticais em relevo. Fotos de conjunto mostrando pote com tampa, leiteira e tigela. Acabamento delicado e contemporâneo.",
  },
  {
    cod: "Produto-10",
    slug: "pote-linha-verde-menta",
    name: "Pote com Tampa Linha Verde Menta",
    categoria: "linha-verde-menta",
    description:
      "Pote de cerâmica com tampa da Linha Verde Menta, com listras verticais em relevo. Perfeito para armazenar grãos, temperos ou algodão. Tampa com pino.",
  },
  {
    cod: "Produto-11",
    slug: "leiteira-linha-verde-menta",
    name: "Leiteira Linha Verde Menta",
    categoria: "linha-verde-menta",
    description:
      "Leiteira/jarra de cerâmica da Linha Verde Menta, com bico vertedor e listras verticais em relevo. Ideal para leite, creme ou molhos.",
  },
  {
    cod: "Produto-12",
    slug: "tigela-linha-verde-menta",
    name: "Tigela Linha Verde Menta",
    categoria: "linha-verde-menta",
    description:
      "Tigela de cerâmica da Linha Verde Menta, com listras verticais em relevo. Versátil para snacks, sobremesas ou como pote de apoio.",
  },
  {
    cod: "Produto-13",
    slug: "saboneteira-redonda",
    name: "Saboneteira Redonda com Furos",
    categoria: "saboneteiras",
    description:
      "Saboneteira redonda de cerâmica com furos de drenagem e palavras gravadas à mão. Disponível em cores variadas. Peça única.",
  },
];

function lerIndice(): Record<string, string[]> {
  const arquivo = path.join(OTIMIZADO, "index.json");
  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Índice não encontrado: ${arquivo}. Rode antes: python3 scripts/otimizar-fotos-atelie.py`,
    );
  }
  return JSON.parse(fs.readFileSync(arquivo, "utf8"));
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios.");
  }

  const indice = lerIndice();
  const prisma = new PrismaClient();
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  if (!DRY) {
    const { error } = await supabase.storage.getBucket(BUCKET);
    if (error) {
      console.log(`Bucket "${BUCKET}" ausente — criando (público)...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
      });
      if (createError) throw createError;
    }
  }

  const categoriaIdPorSlug = new Map<string, string>();
  for (const cat of CATEGORIAS) {
    if (DRY) {
      categoriaIdPorSlug.set(cat.slug, `dry-${cat.slug}`);
      continue;
    }
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name },
    });
    categoriaIdPorSlug.set(cat.slug, row.id);
    console.log(`categoria ok: ${cat.name} (${cat.slug})`);
  }

  let criados = 0;
  let pulados = 0;

  for (const p of PRODUTOS) {
    const existente = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existente) {
      console.log(`pulado (já existe): ${p.slug}`);
      pulados++;
      continue;
    }

    const arquivos = indice[p.cod];
    if (!arquivos || arquivos.length === 0) {
      throw new Error(`Sem fotos otimizadas para ${p.cod} (${p.slug}).`);
    }

    const categoriaId = categoriaIdPorSlug.get(p.categoria);
    if (!categoriaId) {
      throw new Error(`Categoria desconhecida "${p.categoria}" para ${p.slug}.`);
    }

    if (DRY) {
      console.log(`[dry] criaria ${p.slug} com ${arquivos.length} fotos ↦ ${p.categoria}`);
      continue;
    }

    const urls: string[] = [];
    for (let i = 0; i < arquivos.length; i++) {
      const arquivo = arquivos[i];
      const origem = path.join(OTIMIZADO, p.cod, arquivo);
      const bytes = fs.readFileSync(origem);
      const nome = `${p.slug}-${String(i + 1).padStart(2, "0")}-${crypto
        .randomUUID()
        .slice(0, 8)}.webp`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`${MEDIA_PREFIX}${nome}`, bytes, {
          contentType: "image/webp",
          upsert: false,
        });
      if (error) throw new Error(`Falha ao subir ${p.cod}/${arquivo}: ${error.message}`);
      urls.push(`${supabaseUrl}/storage/v1/object/public/${BUCKET}/${MEDIA_PREFIX}${nome}`);
    }

    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: 0,
        stock: 1,
        featured: false,
        available: false,
        images: JSON.stringify(urls),
        categories: { connect: [{ id: categoriaId }] },
      },
    });
    console.log(`criado: ${p.slug} (${urls.length} fotos, oculto)`);
    criados++;
  }

  const totalProdutos = await prisma.product.count();
  const totalCategorias = await prisma.category.count();
  console.log(
    `\nResumo: ${criados} criados, ${pulados} pulados | banco: ${totalProdutos} produtos, ${totalCategorias} categorias`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
