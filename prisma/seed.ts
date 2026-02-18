import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista de items idéntica a la del Frontend
const SKIN_LIST = [
  { id: "sunGlasses", category: "glasses", name: { es: "Gafas de sol", en: "Sunglasses" }, price: 5 },
  { id: "pinkGlasses", category: "glasses", name: { es: "Gafas rosas", en: "Pink Glasses" }, price: 8 },
  { id: "hat1", category: "hat", name: { es: "Gorro", en: "Beanie" }, price: 8 },
  { id: "hat2", category: "hat", name: { es: "Sombrero", en: "Hat" }, price: 10 },
  { id: "bowTie", category: "neck", name: { es: "Pajarita", en: "Bow Tie" }, price: 12 },
  { id: "ribbon", category: "hat", name: { es: "Lazo", en: "Ribbon" }, price: 12 },
];

async function main() {
  console.log(`🌱 Sembrando el Catálogo...`);

  // 1. Crear Items de Tienda
  for (const skin of SKIN_LIST) {
    // Usamos upsert: Si existe lo deja, si no lo crea.
    await prisma.catalogItem.upsert({
      where: { id: skin.id },
      update: {},
      create: {
        id: skin.id,
        category: skin.category,
        name: skin.name, // Prisma serializa esto a JSON automáticamente
        price: skin.price,
        isActive: true
      }
    });
    console.log(`  🛍️ Item listo: ${skin.id}`);
  }

  console.log(`✅ Base de datos sembrada correctamente.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });