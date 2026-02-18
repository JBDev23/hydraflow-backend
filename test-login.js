// Script para simular que la App envía un login de Google
const API_URL = 'http://localhost:3000/auth/login';

async function testLogin() {
  console.log("🔵 Enviando petición de Login simulada...");

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "jordi@test.com",     // Email de prueba
        name: "Jordi Tester",        // Nombre
        provider: "google",          // Simulamos que viene de Google
        providerId: "google_123456"  // ID falso de Google
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("\n✅ ¡ÉXITO! Usuario creado/logueado:");
      console.log("-----------------------------------");
      console.log("🔑 Token JWT:", data.token.substring(0, 20) + "..."); // Solo mostramos el principio
      console.log("👤 Usuario ID:", data.user.id);
      console.log("💧 Meta Diaria:", data.user.profile.dailyGoal); // Verificamos que se creó el perfil
      console.log("-----------------------------------");
    } else {
      console.log("\n❌ Error en el servidor:", data);
    }

  } catch (error) {
    console.error("\n❌ No se pudo conectar al servidor. ¿Está encendido?", error.message);
  }
}

testLogin();