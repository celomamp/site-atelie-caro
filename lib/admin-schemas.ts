// lib/admin-schemas.ts
// Whitelist explícita dos campos aceitos pelo backoffice. O parse do Zod remove
// chaves desconhecidas antes de montar o objeto do Prisma, eliminando mass
// assignment. Os handlers nunca fazem spread direto do corpo bruto da requisição.
import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative().default(1),
  featured: z.boolean().default(false),
  available: z.boolean().default(true),
  weight: z.coerce.number().positive().default(2),
  width: z.coerce.number().positive().default(30),
  height: z.coerce.number().positive().default(20),
  length: z.coerce.number().positive().default(20),
  images: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
});

export const productUpdateSchema = productCreateSchema.partial();

export const workshopCreateSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.coerce.date(),
  duration: z.coerce.number().int().positive().default(180),
  price: z.coerce.number().nonnegative(),
  location: z.string().trim().default(""),
  maxAttendees: z.coerce.number().int().positive().default(8),
  spotsTaken: z.coerce.number().int().nonnegative().default(0),
  image: z
    .union([z.string().trim(), z.null()])
    .transform((v) => (v ? v : null))
    .default(null),
  active: z.boolean().default(true),
});

export const workshopUpdateSchema = workshopCreateSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});

export const encomendaStatusSchema = z.enum([
  "nova",
  "em_orcamento",
  "confirmada",
  "cancelada",
]);
