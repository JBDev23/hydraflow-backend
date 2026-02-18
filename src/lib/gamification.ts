const XP_PER_ML = 0.1;
const BASE_XP = 100;   
const MULTIPLIER = 2; 
const DROPS_PER_LEVEL = 5;

export const calculateXpGain = (amountMl: number): number => {
  return Math.floor(amountMl * XP_PER_ML);
};

export const getXpRequiredForLevel = (level: number): number => {
  return Math.floor(BASE_XP * Math.pow(MULTIPLIER, level - 1));
};

export const calculateProgress = (currentLevel: number, currentXp : number):number => {
    let xpRequired = getXpRequiredForLevel(currentLevel);
    if (xpRequired === 0) return 0;
    return Math.floor((currentXp*100)/xpRequired)
}

export const processLevelUp = (currentLevel: number, currentXp: number, xpGained: number) => {
  let newLevel = currentLevel;
  let newXp = currentXp + xpGained;
  let dropsAwarded = 0;
  let didLevelUp = false;

  while (true) {
    const xpRequired = getXpRequiredForLevel(newLevel);
    
    if (newXp >= xpRequired) {
      newXp -= xpRequired;
      newLevel++;
      dropsAwarded += DROPS_PER_LEVEL;
      didLevelUp = true;
    } else {
      break;
    }
  }

  let newProgress = calculateProgress(newLevel, newXp)

  return {
    newLevel,
    newXp,
    newProgress,
    dropsAwarded,
    didLevelUp
  };
};

export const processLevelDown = (currentLevel: number, currentXp: number, xpToDeduct: number) => {
  let newLevel = currentLevel;
  let newXp = currentXp - xpToDeduct;
  let dropsToDeduct = 0;

  // Mientras la XP sea negativa y no estemos en nivel 1, bajamos nivel
  while (newXp < 0 && newLevel > 1) {
    newLevel--;
    const xpRequired = getXpRequiredForLevel(newLevel);
    newXp += xpRequired; // Recuperamos la XP base del nivel anterior
    dropsToDeduct += DROPS_PER_LEVEL; // Quitamos los drops ganados
  }

  // Seguridad para nivel 1: no bajar de 0 XP
  if (newXp < 0) newXp = 0;

  const newProgress = calculateProgress(newLevel, newXp);

  return {
    newLevel,
    newXp,
    newProgress,
    dropsToDeduct
  };
};

export const calculateNewStreak = (currentStreak: number, lastActiveDate: Date | null): number => {
  const today = new Date()
  today.setHours(0,0,0,0)
  if(!lastActiveDate) return 1;

  const last = new Date(lastActiveDate)
  last.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - last.getTime();
  // Diferencia en días
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return currentStreak; // Ya bebió hoy, la racha se mantiene igual
  } else if (diffDays === 1) {
    return currentStreak + 1; // Bebió ayer, sumamos racha
  } else {
    return 1; // Se saltó un día (diff > 1), reiniciamos a 1 (hoy cuenta)
  }

}

export const checkStreakBreak = (currentStreak: number, lastActiveDate: Date | null): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lastActiveDate) return 0; // Nunca ha bebido

  const last = new Date(lastActiveDate);
  last.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Si la diferencia es mayor a 1 día (ayer), la racha se rompió.
  if (diffDays > 1) {
    return 0; 
  }
  
  // Si fue ayer (1) u hoy (0), la racha se mantiene intacta para mostrarla
  return currentStreak;
};