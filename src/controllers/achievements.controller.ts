import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAchievements = async (req: AuthRequest, res: Response) => {
    try {
        const achievements = await prisma.catalogAchievement.findMany();
        
        return res.json({ success: true, achievements });

    } catch (error) {
        console.error("Get Achievements Error:", error);
        return res.status(500).json({ error: "Failed to fetch achievements" });
    }
};