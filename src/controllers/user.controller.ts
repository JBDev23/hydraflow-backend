import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { checkStreakBreak } from '../lib/gamification';

const DEFAULT_NOTIFICATIONS = {
  enabled: true,
  frequency: "smart",
  sound: "drop"
};

const DEFAULT_PREFERENCES = {
  unitDist: "cm",
  unitWeight: "kg",
  soundEffect: true,
  volume: 50,
  vibration: true,
  theme: "light",
  language: "es"
};

// --- Helpers de Seguridad ---
// Evitan que 'NaN' o strings vacíos lleguen a la base de datos y la rompan
const safeFloat = (val: any) => {
  if (val === undefined || val === null || val === '') return undefined;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? undefined : parsed;
};

const safeInt = (val: any) => {
  if (val === undefined || val === null || val === '') return undefined;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? undefined : parsed;
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        settings: true,
        gameStats: true,
        items: true,
        achievements: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.gameStats) {
      const realStreak = checkStreakBreak(user.gameStats.currentStreak, user.gameStats.lastActiveDate);
      

      // Si la racha calculada es diferente a la guardada
      if (realStreak !== user.gameStats.currentStreak) {
        
        const updatedStats = await prisma.gameStats.update({
          where: { id: user.gameStats.id },
          data: { currentStreak: realStreak }
        });

        // Actualizamos el objeto user en memoria para devolver el dato correcto al frontend
        user.gameStats.currentStreak = updatedStats.currentStreak;
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const data = req.body;

    console.log(`📝 Actualizando perfil para: ${userId}`);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name || undefined,

        // Actualización de Perfil (Biometría)
        profile: {
          upsert: {
            create: {
              weight: safeFloat(data.weight),
              height: safeFloat(data.height),
              age: safeInt(data.age),
              gender: data.gender || undefined,
              activityLevel: data.activity || undefined,
              dailyGoal: safeInt(data.goal) || 2000
            },
            update: {
              weight: safeFloat(data.weight),
              height: safeFloat(data.height),
              age: safeInt(data.age),
              gender: data.gender || undefined,
              activityLevel: data.activity || undefined,
              dailyGoal: safeInt(data.goal)
            }
          }
        },

        // Actualización de Configuración
        // Prisma maneja JSONs de forma inteligente, si es undefined no lo toca
        settings: {
          upsert: {
            create: {
              notifications: data.notifications || DEFAULT_NOTIFICATIONS,
              preferences: data.preferences || DEFAULT_PREFERENCES,
              wakeTime: data.wakeTime || undefined,
              sleepTime: data.sleepTime || undefined
            },
            update: {
              notifications: data.notifications || undefined,
              preferences: data.preferences || undefined,
              wakeTime: data.wakeTime || undefined,
              sleepTime: data.sleepTime || undefined
            }
          }
        },
        
        // Actualización de Stats (Si el frontend envía contadores actualizados)
        gameStats: {
          upsert: {
            create: {
              level: safeInt(data.stats?.level) || 1,
              dropsBalance: safeInt(data.stats?.drops) || 0,
              currentStreak: safeInt(data.stats?.streak) || 0,
            },
            update: {
              level: safeInt(data.stats?.level),
              dropsBalance: safeInt(data.stats?.drops),
              currentStreak: safeInt(data.stats?.streak),
            }
          }
        }
      }
    });

    console.log(`✅ Perfil actualizado correctamente.`);
    res.json({ success: true, user: updatedUser });

  } catch (error) {
    // Log detallado del error real en la terminal del backend
    console.error("❌ Error CRÍTICO en updateProfile:", error);
    res.status(500).json({ error: "Failed to update profile", details: String(error) });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    await prisma.user.delete({
      where: { id: userId }
    });

    return res.json({ success: true, message: "Cuenta eliminada correctamente" });

  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({ error: "No se pudo eliminar la cuenta" });
  }
};