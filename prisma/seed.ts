// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { slug: "xicara-de-ceramica" },
    update: {},
    create: {
      slug: "xicara-de-ceramica",
      name: "Xícara de Cerâmica",
      description: "Xícara artesanal esmaltada, feita à mão em alta temperatura.",
      price: 90,
      category: "utensilios",
      images: JSON.stringify(["/uploads/xicara.jpg"]),
      stock: 5,
      featured: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "vaso-terracota" },
    update: {},
    create: {
      slug: "vaso-terracota",
      name: "Vaso Terracota",
      description: "Vaso em tom terracota com textura de barro.",
      price: 95,
      category: "decoracao",
      images: JSON.stringify(["/uploads/vaso.jpg"]),
      stock: 3,
      featured: true,
    },
  });

  await prisma.workshop.upsert({
    where: { slug: "oficina-ceramica-iniciante" },
    update: {},
    create: {
      slug: "oficina-ceramica-iniciante",
      title: "Oficina de Cerâmica Artesanal",
      description: "Aprenda modelagem e esmaltação em alta temperatura.",
      date: new Date("2026-10-10T14:00:00"),
      duration: 180,
      price: 220,
      location: "Campinas-SP",
      maxAttendees: 8,
      image: "/uploads/oficina.jpg",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
