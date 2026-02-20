import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const DEFAULT_NOTIFICATIONS = {
  enabled: true,
  frequency: "smart",
  sound: "drop"
};

const TOKEN_EXPIRATION = '30d'; 

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""; 

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const SECRET = process.env.JWT_SECRET || "default_secret_change_me";

export const socialLogin = async (req: Request, res: Response) => {
  try {
    // Recibimos 'token' (Google) o 'email/name' (Test)
    const { token, provider, email: manualEmail, name: manualName, deviceLanguage } = req.body;

    let email = "";
    let name = "";
    let providerId = "";

    // 1. Verificación SEGURA con Google
    if (provider === 'google') {
        if (!token) return res.status(400).json({ error: "Token required for Google login" });

        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: GOOGLE_CLIENT_ID,  
            });
            const payload = ticket.getPayload();
            
            if (!payload?.email) throw new Error("No email in Google Token");

            email = payload.email;
            name = payload.name || "Usuario Google";
            providerId = payload.sub; // ID único de Google

        } catch (error) {
            console.error("Google Verify Error:", error);
            return res.status(401).json({ error: 'Invalid Google Token' });
        }
    } 
    // 2. Modo TEST (Invitado)
    else if (provider === 'test') {
        email = manualEmail;
        name = manualName;
        providerId = "test_user";
    } else {
        return res.status(400).json({ error: 'Provider not supported' });
    }

    const userLang = deviceLanguage || "es";
    const DEFAULT_PREFERENCES = { unitDist: "cm", unitWeight: "kg", soundEffect: true, volume: 50, vibration: true, theme: "light", language: userLang };

    // 3. Buscar o Crear Usuario (Lógica idéntica a la anterior)
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined },
      create: {
        email, name, provider, providerId,
        profile: { create: { dailyGoal: 2000, activityLevel: "sedentary" } },
        settings: { create: { notifications: DEFAULT_NOTIFICATIONS, preferences: DEFAULT_PREFERENCES } },
        gameStats: { create: { level: 1, currentXp: 0, progress: 0, dropsBalance: 10, skinsCount: 1 } },
        items: { create: { itemId: "sunGlasses", isEquipped: false } }
      },
      include: {
        profile: true, settings: true, gameStats: true, items: true, achievements: true
      }
    });

    // 4. Generar Token de Sesión Propio
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email }, 
      SECRET, 
      { expiresIn: TOKEN_EXPIRATION }
    );
    
    return res.json({ 
        success: true, 
        token: sessionToken, 
        user 
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};