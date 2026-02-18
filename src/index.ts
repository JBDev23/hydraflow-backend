import express from 'express';
import type { Request, Response } from 'express'; 
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes'
import userRouter from './routes/user.routes'
import waterRoutes from './routes/water.routes'
import achievementRoutes from './routes/achievements.routes'
import itemsRoutes from './routes/items.routes'

// Cargar variables de entorno
dotenv.config();

export const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/water', waterRoutes)
app.use('/achievements', achievementRoutes)
app.use('/shop', itemsRoutes)


// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'HydraFlow Backend API 💧',
    status: 'online',
    timestamp: new Date()
  });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
        console.log(`📡 Accessible via LAN at: http://192.168.1.134:${PORT}`); // Cambia por tu IP
    });
}