import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  {
    id: "first_sip",
    icon: "droplet",
    condition: "FIRST_DRINK",
    name: { es: "Hydra", en: "Hydra" },
    description: { es: "Registra tu primer vaso de agua", en: "Log your first glass of water" }
  },
  {
    id: "goal_getter",
    icon: "egg",
    condition: "GOAL_REACHED_1",
    name: { es: "El Iniciado", en: "The Initiate" },
    description: { es: "Completa tu meta diaria por primera vez", en: "Complete your daily goal for the first time" }
  },
  {
    id: "streak_3",
    icon: "fire",
    condition: "STREAK_3",
    name: { es: "En Racha", en: "On Fire" },
    description: { es: "Mantén una racha de 3 días", en: "Maintain a 3-day streak" }
  },
  {
    id: "level_5",
    icon: "medal",
    condition: "LEVEL_5",
    name: { es: "Veterano", en: "Veteran" },
    description: { es: "Alcanza el nivel 5", en: "Reach level 5" }
  },
  {
    id: "total_10l",
    icon: "water",
    condition: "TOTAL_10L",
    name: { es: "Camello", en: "Camel" },
    description: { es: "Bebe un total de 10 Litros", en: "Drink a total of 10 Liters" }
  }
];

async function main() {
  console.log(`🏆 Sembrando Logros...`);

  for (const ach of ACHIEVEMENTS) {
    await prisma.catalogAchievement.upsert({
      where: { id: ach.id },
      update: {
        icon: ach.icon,
        condition: ach.condition,
        name: ach.name,
        description: ach.description
      },
      create: {
        id: ach.id,
        icon: ach.icon,
        condition: ach.condition,
        name: ach.name,
        description: ach.description
      }
    });
    console.log(`  ✨ Logro creado/actualizado: ${ach.name.es}`);
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    throw e;
  });