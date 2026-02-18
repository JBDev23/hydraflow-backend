import { Prisma } from '@prisma/client';

type GameStatsData = {
  totalVolume: number;
  currentStreak: number;
  totalGoalsReached: number;
  level: number;
};

// Mapa de reglas: "CONDICIÓN_DB" -> Función(stats) => boolean
export const ACHIEVEMENT_RULES: Record<string, (stats: GameStatsData) => boolean> = {
  'FIRST_DRINK': (stats) => stats.totalVolume > 0,
  'GOAL_REACHED_1': (stats) => stats.totalGoalsReached >= 1,
  'STREAK_3': (stats) => stats.currentStreak >= 3,
  'LEVEL_5': (stats) => stats.level >= 5,
  'TOTAL_10L': (stats) => stats.totalVolume >= 10000, // 10l
};

export const checkAndUnlockAchievements = async (
  tx: Prisma.TransactionClient,
  userId: string,
  currentStats: GameStatsData
) => {
  // 1. Obtener todos los logros del catálogo
  const catalog = await tx.catalogAchievement.findMany();

  // 2. Obtener los logros que el usuario YA tiene
  const owned = await tx.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true }
  });
  const ownedIds = new Set(owned.map(a => a.achievementId));

  const newUnlocks = [];

  // 3. Evaluar cada logro del catálogo
  for (const achievement of catalog) {
    // Si ya lo tiene, saltar
    if (ownedIds.has(achievement.id)) continue;

    // Buscar la regla correspondiente
    const rule = ACHIEVEMENT_RULES[achievement.condition];
    
    // Si existe regla y se cumple la condición
    if (rule && rule(currentStats)) {
      await tx.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id
        }
      });
      
      // Añadimos a la lista para avisar al frontend
      newUnlocks.push(achievement);
    }
  }

  const totalCount = ownedIds.size + newUnlocks.length;

  // 4. ACTUALIZAR STATS: Si hubo desbloqueos, actualizamos el contador en GameStats
  if (newUnlocks.length > 0) {
    await tx.gameStats.update({
        where: { userId },
        data: {
            achievementsCount: totalCount // Guardamos el valor absoluto exacto
        }
    });
  }

  return {newUnlocks, totalCount};
};