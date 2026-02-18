import { ACHIEVEMENT_RULES } from '../lib/achievements';

describe('🏆 Reglas de Logros', () => {

  // Mock de estadísticas base (usuario nuevo)
  const baseStats = {
    totalVolume: 0,
    currentStreak: 0,
    totalGoalsReached: 0,
    level: 1
  };

  test('FIRST_DRINK: Debe desbloquearse si el volumen > 0', () => {
    const rule = ACHIEVEMENT_RULES['FIRST_DRINK'];
    
    expect(rule({ ...baseStats, totalVolume: 0 })).toBe(false);
    expect(rule({ ...baseStats, totalVolume: 250 })).toBe(true);
  });

  test('STREAK_3: Debe desbloquearse con racha >= 3', () => {
    const rule = ACHIEVEMENT_RULES['STREAK_3'];
    
    expect(rule({ ...baseStats, currentStreak: 2 })).toBe(false);
    expect(rule({ ...baseStats, currentStreak: 3 })).toBe(true);
    expect(rule({ ...baseStats, currentStreak: 50 })).toBe(true);
  });

  test('LEVEL_5: Debe desbloquearse al nivel 5', () => {
    const rule = ACHIEVEMENT_RULES['LEVEL_5'];
    
    expect(rule({ ...baseStats, level: 4 })).toBe(false);
    expect(rule({ ...baseStats, level: 5 })).toBe(true);
  });

  test('TOTAL_10L: Debe calcularse en mililitros (10,000)', () => {
    const rule = ACHIEVEMENT_RULES['TOTAL_10L'];
    
    expect(rule({ ...baseStats, totalVolume: 9999 })).toBe(false); // 9.9 Litros
    expect(rule({ ...baseStats, totalVolume: 10000 })).toBe(true);  // 10 Litros
  });

});