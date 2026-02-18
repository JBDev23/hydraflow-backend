import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CONFIGURACIÓN
const TARGET_EMAIL = "jordi@gmail.com"; // ⚠️ Asegúrate de que sea tu email
const YEAR = 2026;
const MONTH = 1; // Febrero (0 = Enero, 1 = Febrero...)

async function main() {
  console.log(`🌊 Iniciando simulación de hidratación INTELIGENTE...`);

  // 1. Obtener usuario y su meta
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    include: { profile: true }
  });

  if (!user) {
    console.error(`❌ Usuario no encontrado: ${TARGET_EMAIL}`);
    return;
  }

  const DAILY_GOAL = user.profile?.dailyGoal || 2000;
  console.log(`👤 Usuario: ${user.name} | 🎯 Meta: ${DAILY_GOAL}ml`);

  // 2. Limpiar datos previos
  await prisma.waterLog.deleteMany({ where: { userId: user.id } });
  
  // Reseteamos stats para recalcular desde cero
  await prisma.gameStats.update({
    where: { userId: user.id },
    data: { 
      totalVolume: 0, 
      currentStreak: 0, 
      totalGoalsReached: 0, 
      currentXp: 0,
      level: 1,
      progress: 0
    }
  });

  const waterLogs = [];
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  
  // Datos reales de fecha actual para comparar
  const now = new Date();
  const currentDayOfMonth = now.getDate();
  const isCurrentMonth = now.getMonth() === MONTH && now.getFullYear() === YEAR;
  
  // --- VARIABLES DE ESTADO ---
  let currentStreak = 0;
  let totalGoalsReached = 0;
  let totalVolumeHistorico = 0;
  let lastActiveDate = null;

  // 3. Simular día a día
  for (let day = 1; day <= daysInMonth; day++) {
    
    // Si estamos en el mes actual y pasamos del día de hoy, paramos.
    // No queremos generar datos en el futuro.
    if (isCurrentMonth && day > currentDayOfMonth) {
        break;
    }

    const isToday = isCurrentMonth && day === currentDayOfMonth;

    // Probabilidad de 10% de no beber, PERO si es HOY, bebemos seguro (para ver datos)
    const skipDay = !isToday && Math.random() > 0.90; 

    if (skipDay) {
        // Si no bebe, la racha cae a 0
        currentStreak = 0;
        continue; 
    }

    // Si bebe, aumentamos racha
    currentStreak++;

    let dayTotalVolume = 0;
    
    // Lógica de generación de tragos
    if (isToday) {
        // --- PARA HOY: DATOS BONITOS ---
        // Generamos datos distribuidos para que la gráfica diaria se vea bien
        console.log(`📅 Generando datos distribuidos para HOY (Día ${day})...`);
        const fixedSchedules = [
            { h: 9, m: 30, amount: 250 },
            { h: 11, m: 0, amount: 250 },
            { h: 14, m: 30, amount: 500 },
            { h: 17, m: 0, amount: 250 },
            { h: 20, m: 30, amount: 250 },
            { h: 22, m: 15, amount: 250 }
        ];

        for (const sched of fixedSchedules) {
            // Solo añadimos si la hora ya ha pasado (opcional, aquí los ponemos todos para testear la gráfica completa)
            const date = new Date(YEAR, MONTH, day, sched.h, sched.m);
            
            waterLogs.push({
                userId: user.id,
                amount: sched.amount,
                timestamp: date
            });
            dayTotalVolume += sched.amount;
        }

    } else {
        // --- PARA EL PASADO: ALEATORIO ---
        const numDrinks = Math.floor(Math.random() * 5) + 3; // 3 a 8 vasos

        for (let i = 0; i < numDrinks; i++) {
            const hour = Math.floor(Math.random() * (23 - 8 + 1)) + 8;
            const minute = Math.floor(Math.random() * 60);
            const amount = Math.random() > 0.7 ? 500 : 250;

            const date = new Date(YEAR, MONTH, day, hour, minute);
            
            waterLogs.push({
                userId: user.id,
                amount: amount,
                timestamp: date
            });

            dayTotalVolume += amount;
        }
    }

    // Actualizar acumuladores globales
    totalVolumeHistorico += dayTotalVolume;
    
    // Comprobar Meta Diaria
    if (dayTotalVolume >= DAILY_GOAL) {
        totalGoalsReached++;
    }

    // Guardar fecha del último trago
    lastActiveDate = new Date(YEAR, MONTH, day, 23, 59, 0);
  }

  // 4. Insertar todos los logs de golpe
  console.log(`🚀 Insertando ${waterLogs.length} registros...`);
  await prisma.waterLog.createMany({ data: waterLogs });

  // 5. Actualizar Stats con los cálculos precisos
  const xpGained = Math.floor(totalVolumeHistorico * 0.1);

  await prisma.gameStats.update({
    where: { userId: user.id },
    data: {
      totalVolume: totalVolumeHistorico,
      currentXp: xpGained,
      currentStreak: currentStreak,       
      totalGoalsReached: totalGoalsReached, 
      lastActiveDate: lastActiveDate
    }
  });

  console.log(`✅ Simulación completada.`);
  console.log(`📊 Racha final: ${currentStreak} días`);
  console.log(`🏆 Metas cumplidas: ${totalGoalsReached}`);
  console.log(`💧 Volumen total: ${(totalVolumeHistorico/1000).toFixed(1)} L`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); throw e; });