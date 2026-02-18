import { Response } from 'express';
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from '../lib/prisma';
import { calculateXpGain, processLevelUp, getXpRequiredForLevel, processLevelDown, calculateNewStreak } from '../lib/gamification';
import { checkAndUnlockAchievements } from '../lib/achievements';

const getDayRange = (dateString?: any) => {
    let date = new Date()

    if (dateString && typeof dateString === "string") {
        const parsed = new Date(dateString)
        if (!isNaN(parsed.getTime())) {
            date = parsed
        }
    }

    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    return { start, end }
}

const getDayStats = async (userId: string, date: Date) => {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);

  const labels = ["0", "3", "6", "9", "12", "15", "18", "21"];
  const values = new Array(8).fill(0);

  const logs = await prisma.waterLog.findMany({
    where: { userId, timestamp: { gte: start, lte: end } }
  });

  let totalAmount = 0;

  logs.forEach(log => {
    totalAmount += log.amount;
    const hour = new Date(log.timestamp).getHours();
    const index = Math.floor(hour / 3);
    if (values[index] !== undefined) values[index] += log.amount;
  });

  return { labels, values, start, end, metric: totalAmount };
};

const getWeekStats = async (userId: string, date: Date) => {
  const dayOfWeek = date.getDay(); 
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  const values = new Array(7).fill(0);

  const logs = await prisma.waterLog.findMany({
    where: { userId, timestamp: { gte: start, lte: end } }
  });

  let totalAmount = 0;

  logs.forEach(log => {
    totalAmount += log.amount;
    let dayIndex = new Date(log.timestamp).getDay() - 1;
    if (dayIndex === -1) dayIndex = 6;
    if (values[dayIndex] !== undefined) values[dayIndex] += log.amount;
  });

  const dailyAverage = Math.round(totalAmount / 7);

  return { labels, values, start, end, metric:dailyAverage };
};

const getMonthStats = async (userId: string, date: Date) => {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);

  const now = new Date();
  const isCurrentMonth = 
  now.getFullYear() === start.getFullYear() && 
  now.getMonth() === start.getMonth();

  const daysToCount = isCurrentMonth ? now.getDate() : end.getDate();

  const labels = ["S-1", "S-2", "S-3", "S-4", "S-5"];
  const values = new Array(5).fill(0);

  const logs = await prisma.waterLog.findMany({
    where: { userId, timestamp: { gte: start, lte: end } }
  });

  let totalAmount = 0;

  logs.forEach(log => {
    totalAmount += log.amount;
    const day = new Date(log.timestamp).getDate();
    let weekIndex = Math.floor((day - 1) / 7);
    if (weekIndex > 4) weekIndex = 4;
    if (values[weekIndex] !== undefined) values[weekIndex] += log.amount;
  });

  const valuesInLiters = values.map(val => parseFloat((val / 1000).toFixed(1)));

  const dailyAverage = Math.round(totalAmount / (daysToCount || 1));

  return { labels, values: valuesInLiters, start, end, metric: dailyAverage };
};

export const logWater = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!
        const { amount } = req.body

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Valid amount is required" })
        }

        const { start, end } = getDayRange();

        const result = await prisma.$transaction(async (tx) => {
            // A. Obtener datos previos necesarios
            const userProfile = await tx.profile.findUnique({ where: { userId } });
            const dailyGoal = userProfile?.dailyGoal || 2000;

            const currentAggregation = await tx.waterLog.aggregate({
                _sum: { amount: true },
                where: { userId, timestamp: { gte: start, lte: end } }
            });
            const totalBeforeDrink = currentAggregation._sum.amount || 0;

            // B. Crear registro
            const log = await tx.waterLog.create({
                data: {
                    userId: userId!,
                    amount: parseInt(amount)
                }
            });

            // C. Obtener Stats (Upsert para seguridad)
            let stats = await tx.gameStats.findUnique({ where: { userId } });
            if (!stats) {
                stats = await tx.gameStats.create({
                    data: {
                        userId: userId!,
                        level: 1,
                        currentXp: 0,
                        progress: 0,
                        dropsBalance: 0,
                        currentStreak: 0, 
                        totalGoalsReached: 0, 
                        totalVolume: 0
                    }
                });
            }

            // D. Lógica de "Meta Cumplida"
            const totalAfterDrink = totalBeforeDrink + parseInt(amount);
            let goalIncrement = 0;

            if (totalBeforeDrink < dailyGoal && totalAfterDrink >= dailyGoal) {
                goalIncrement = 1;
            }

            // E. Calcular Gamificación
            const xpGained = calculateXpGain(parseInt(amount));
            const progressResult = processLevelUp(stats.level, stats.currentXp, xpGained);

            // F. Calcular racha
            const newStreak = calculateNewStreak(stats.currentStreak, stats.lastActiveDate);

            // G. Actualizar Stats en BD
            const updatedStats = await tx.gameStats.update({
                where: { userId },
                data: {
                    level: progressResult.newLevel,
                    currentXp: progressResult.newXp,
                    progress: progressResult.newProgress,
                    dropsBalance: { increment: progressResult.dropsAwarded },
                    totalGoalsReached: { increment: goalIncrement },
                    currentStreak: newStreak,
                    lastActiveDate: new Date(),
                    totalVolume: { increment: parseInt(amount) } 
                }
            });

            const {newUnlocks, totalCount} = await checkAndUnlockAchievements(tx, userId, updatedStats);

            return { log, updatedStats, progressResult, xpGained, newUnlocks, totalCount};
        });

        return res.json({
            success: true,
            logged: result.log,
            gamification: {
                xpGained: result.xpGained,
                leveledUp: result.progressResult.didLevelUp,
                newLevel: result.progressResult.newLevel,
                dropsBalance: result.updatedStats.dropsBalance,
                dropsEarned: result.progressResult.dropsAwarded,
                currentXp: result.updatedStats.currentXp,
                xpToNextLevel: getXpRequiredForLevel(result.updatedStats.level),
                progress: result.updatedStats.progress,
                currentStreak: result.updatedStats.currentStreak,
                goalsReached: result.updatedStats.totalGoalsReached,
                totalVolume: result.updatedStats.totalVolume,
                newAchievements: result.newUnlocks,
                achievementsCount: result.totalCount
            }
        });

    } catch (error) {
        console.error("Log Water Error:", error);
        return res.status(500).json({ error: "Failed to log water" });
    }
}

export const getDailyMetrics = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId

        const { date } = req.query

        const { start, end } = getDayRange(date)

        const aggregations = await prisma.waterLog.aggregate({
            _sum: { amount: true },
            where: {
                userId: userId,
                timestamp: {
                    gte: start,
                    lte: end
                }
            }
        })

        return res.json({
            success: true,
            date: start.toISOString().split('T')[0],
            total: aggregations._sum.amount || 0
        });

    } catch (error) {
        console.error("Get Metrics Error:", error);
        return res.status(500).json({ error: "Failed to fetch metrics" });
    }
}

export const revertLog = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId

        const { start, end } = getDayRange();

        const result = await prisma.$transaction(async (tx) => {
            // A. Obtener Meta y Totales ACTUALES (antes de borrar)
            const userProfile = await tx.profile.findUnique({ where: { userId } });
            const dailyGoal = userProfile?.dailyGoal || 2000;

            const currentAggregation = await tx.waterLog.aggregate({
                _sum: { amount: true },
                where: { userId, timestamp: { gte: start, lte: end } }
            });
            const totalBeforeDelete = currentAggregation._sum.amount || 0;

            // B. Buscar último log
            const lastLog = await tx.waterLog.findFirst({
                where: {
                    userId: userId,
                    timestamp: { gte: start }
                },
                orderBy: { timestamp: 'desc' }
            });

            if (!lastLog) {
                throw new Error("No logs today");
            }

            // C. Lógica de "Meta Perdida"
            const totalAfterDelete = totalBeforeDelete - lastLog.amount;
            let goalDecrement = 0;

            if (totalBeforeDelete >= dailyGoal && totalAfterDelete < dailyGoal) {
                goalDecrement = 1;
            }

            // D. Eliminarlo
            await tx.waterLog.delete({ where: { id: lastLog.id } });

            // E. Verificar si quedan registros HOY
            const remainingLogsToday = await tx.waterLog.count({
                where: { userId, timestamp: { gte: start } }
            });

            // F. Obtener Stats
            const stats = await tx.gameStats.findUnique({ where: { userId } });
            if (!stats) throw new Error("Stats not found");

            // G. Calcular Gamificación (Bajada)
            const xpToDeduct = calculateXpGain(lastLog.amount);
            const regressionResult = processLevelDown(stats.level, stats.currentXp, xpToDeduct);

            // H. Calcular reversión de Racha (Streak)
            let newStreak = stats.currentStreak;
            let newLastActiveDate = stats.lastActiveDate;

            if (remainingLogsToday === 0) {

                newStreak = Math.max(0, stats.currentStreak - 1);

                const previousLog = await tx.waterLog.findFirst({
                    where: { userId, timestamp: { lt: start } },
                    orderBy: { timestamp: 'desc' }
                });

                newLastActiveDate = previousLog ? previousLog.timestamp : null;
            }

            // I. Guardar cambios
            const updatedStats = await tx.gameStats.update({
                where: { userId },
                data: {
                    level: regressionResult.newLevel,
                    currentXp: regressionResult.newXp,
                    progress: regressionResult.newProgress,
                    dropsBalance: { decrement: regressionResult.dropsToDeduct },
                    totalGoalsReached: { decrement: goalDecrement },
                    currentStreak: newStreak,
                    lastActiveDate: newLastActiveDate,
                    totalVolume: { decrement: lastLog.amount }
                }
            });

            return { lastLog, updatedStats, xpToDeduct };
        });

        return res.json({
            success: true,
            deletedAmount: result.lastLog.amount,
            gamification: {
                currentXp: result.updatedStats.currentXp,
                level: result.updatedStats.level,
                progress: result.updatedStats.progress,
                dropsBalance: result.updatedStats.dropsBalance,
                goalsReached: result.updatedStats.totalGoalsReached,
                totalVolume: result.updatedStats.totalVolume
            },
            message: "Last log deleted"
        });

    } catch (error) {
        console.error("Revert Log Error:", error);
        return res.status(500).json({ error: "Failed to revert log" });
    }
}

export const getRangeMetrics = async(req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId
        const { startDate , endDate } = req.query

        const { start } = getDayRange(startDate)
        const { end } = getDayRange(endDate)

        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required" });
        }

        const logs = await prisma.waterLog.findMany({
            where: {
                userId: userId,
                timestamp: {
                    gte: start,
                    lte: end
                }
            },
            orderBy: {
                timestamp: 'asc'
            }
        })

        const dailyTotals: Record<string, number> = {};

        logs.forEach(log => {
            // Extraemos solo la parte YYYY-MM-DD del timestamp
            const dateString = log.timestamp.toISOString().split('T')[0];
            
            // Si el día ya existe en nuestro diccionario, le sumamos. Si no, lo inicializamos.
            if (dailyTotals[dateString]) {
                dailyTotals[dateString] += log.amount;
            } else {
                dailyTotals[dateString] = log.amount;
            }
        });

        return res.json({
            success: true,
            totals: dailyTotals
        });

    } catch (error) {
        console.error("Revert Log Error:", error);
        return res.status(500).json({ error: "Failed to revert log" });
    }
}

export const getStatsGraph = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { mode, refDate } = req.query;

    if (!mode || !refDate) {
      return res.status(400).json({ error: "Mode and refDate are required" });
    }

    const date = new Date(refDate as string);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    let result;

    switch (mode) {
      case 'day':
        result = await getDayStats(userId, date);
        break;
      case 'week':
        result = await getWeekStats(userId, date);
        break;
      case 'month':
        result = await getMonthStats(userId, date);
        break;
      default:
        return res.status(400).json({ error: "Invalid mode. Use 'day', 'week' or 'month'" });
    }

    return res.json({
      success: true,
      data: {
        labels: result.labels,
        values: result.values,
        metric: result.metric,
        startDate: result.start.toISOString(),
        endDate: result.end.toISOString()
      }
    });

  } catch (error) {
    console.error("Stats Graph Error:", error);
    return res.status(500).json({ error: "Failed to fetch graph data" });
  }
};