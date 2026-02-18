import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma'; // Importamos prisma para limpieza

// Aumentamos el timeout por si la BD tarda en responder
jest.setTimeout(10000); 

describe('🚀 API Integration Tests (End-to-End)', () => {
  let token: string;
  
  // Usuario ficticio para las pruebas
  const testUser = {
    email: 'api_tester@hydraflow.com',
    name: 'Jest Tester',
    provider: 'test', 
    providerId: 'jest_123'
  };

  // Limpieza posterior para que los tests sean repetibles
  afterAll(async () => {
    console.log("🧹 Limpiando usuario de prueba...");
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
    await prisma.$disconnect();
  });

  // --- 1. AUTENTICACIÓN ---
  describe('🔐 Auth Flow', () => {
    test('POST /auth/login - Debe crear usuario y devolver Token', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
      
      token = response.body.token;
    });
  });

  // --- 2. PERFIL DE USUARIO ---
  describe('👤 User Profile', () => {
    test('PUT /user/profile - Debe actualizar datos biométricos', async () => {
      const updateData = {
        weight: 85.5,
        height: 190,
        goal: 3000,
        activity: 'active'
      };

      const response = await request(app)
        .put('/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
    });

    test('GET /user/profile - Debe devolver los datos persistidos', async () => {
      const response = await request(app)
        .get('/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.profile.weight).toBe(85.5);
      expect(response.body.user.profile.dailyGoal).toBe(3000);
      expect(response.body.user.profile.activityLevel).toBe('active');
    });
  });

  // --- 3. CICLO DEL AGUA Y ESTADÍSTICAS ---
  describe('💧 Water Loop & Stats', () => {
    test('POST /water/log - Debe registrar 500ml', async () => {
      const response = await request(app)
        .post('/water/log')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 500 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.logged.amount).toBe(500);
      expect(response.body.gamification).toHaveProperty('xpGained');
    });

    test('GET /water/metrics - Debe reflejar los 500ml bebidos hoy', async () => {
      const response = await request(app)
        .get('/water/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBeGreaterThanOrEqual(500);
    });

    // Nuevo test para gráficos
    test('GET /water/stats - Debe devolver datos del gráfico diario', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/water/stats?mode=day&refDate=${today}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.labels).toHaveLength(8); // 8 intervalos de 3h
      expect(response.body.data.values).toHaveLength(8);
    });

    test('DELETE /water/log - Debe eliminar el último registro', async () => {
      const response = await request(app)
        .delete('/water/log')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.deletedAmount).toBe(500);
    });
  });

  // --- 4. CONTENIDOS Y TIENDA ---
  describe('🛒 Shop & Achievements', () => {
    test('GET /shop/catalog - Debe devolver items de la tienda', async () => {
      const response = await request(app)
        .get('/shop/catalog')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    // Test de Compra: Usuario nuevo tiene 10 drops. 'hat1' cuesta 8.
    test('POST /shop/buy - Debe comprar "hat1" con saldo inicial', async () => {
        const response = await request(app)
            .post('/shop/buy')
            .set('Authorization', `Bearer ${token}`)
            .send({ itemId: 'hat1' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Deberían quedar 2 drops (10 - 8)
        expect(response.body.data.drops).toBe(2);
    });

    // Test de Equipar
    test('POST /shop/equip - Debe equipar "hat1"', async () => {
        const response = await request(app)
            .post('/shop/equip')
            .set('Authorization', `Bearer ${token}`)
            .send({ itemId: 'hat1' });

        expect(response.status).toBe(200);
        
        // Buscamos 'hat1' en la lista devuelta y verificamos que isEquipped es true
        const hatItem = response.body.items.find((i: any) => i.itemId === 'hat1');
        expect(hatItem).toBeDefined();
        expect(hatItem.isEquipped).toBe(true);
    });

    test('GET /achievements/catalog - Debe devolver logros', async () => {
      const response = await request(app)
        .get('/achievements/catalog')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.achievements)).toBe(true);
    });
  });

});