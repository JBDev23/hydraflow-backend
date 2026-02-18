import { 
  calculateXpGain, 
  processLevelUp, 
  calculateNewStreak, 
  checkStreakBreak 
} from '../lib/gamification';

describe('🧩 Motor de Gamificación', () => {

  // 1. Pruebas de XP
  test('Debería calcular 25 XP para 250ml', () => {
    expect(calculateXpGain(250)).toBe(25);
  });

  test('Debería calcular 100 XP para 1000ml', () => {
    expect(calculateXpGain(1000)).toBe(100);
  });

  // 2. Pruebas de Nivel
  test('Debería subir de nivel si XP excede el requisito', () => {
    // Nivel 1, 90 XP, gana 20 XP (Total 110) -> Sube a Nivel 2
    // Requisito Nivel 1 suele ser 100 XP
    const result = processLevelUp(1, 90, 20);
    
    expect(result.didLevelUp).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.dropsAwarded).toBeGreaterThan(0);
  });

  test('NO debería subir de nivel si XP es insuficiente', () => {
    // Nivel 1, 0 XP, gana 50 XP (Total 50) -> Se queda en Nivel 1
    const result = processLevelUp(1, 0, 50);
    
    expect(result.didLevelUp).toBe(false);
    expect(result.newLevel).toBe(1);
    expect(result.newXp).toBe(50);
  });

  // 3. Pruebas de Rachas (CRÍTICO)
  test('Debería mantener la racha si bebió hoy', () => {
    const rachaActual = 5;
    const ultimoTrago = new Date(); // Hoy
    
    const nuevaRacha = calculateNewStreak(rachaActual, ultimoTrago);
    expect(nuevaRacha).toBe(5);
  });

  test('Debería aumentar racha si bebió ayer', () => {
    const rachaActual = 5;
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1); // Ayer
    
    const nuevaRacha = calculateNewStreak(rachaActual, ayer);
    expect(nuevaRacha).toBe(6);
  });

  test('Debería resetear racha a 1 si se saltó un día', () => {
    const rachaActual = 5;
    const anteayer = new Date();
    anteayer.setDate(anteayer.getDate() - 2); // Anteayer
    
    // Al beber hoy, la racha empieza de nuevo (1)
    const nuevaRacha = calculateNewStreak(rachaActual, anteayer);
    expect(nuevaRacha).toBe(1);
  });

  test('Debería detectar rotura de racha al entrar a la app (Check)', () => {
    const rachaActual = 10;
    const haceTresDias = new Date();
    haceTresDias.setDate(haceTresDias.getDate() - 3);

    // checkStreakBreak devuelve la racha real (0 si se rompió)
    const rachaReal = checkStreakBreak(rachaActual, haceTresDias);
    expect(rachaReal).toBe(0);
  });

});