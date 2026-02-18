import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const getItems = async (req: AuthRequest, res: Response) => {
    try {
        const items = await prisma.catalogItem.findMany();
        
        return res.json({ success: true, items });

    } catch (error) {
        console.error("Get Items Error:", error);
        return res.status(500).json({ error: "Failed to fetch items" });
    }
};

export const buyItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.body;

    // 1. Obtener info del item (precio)
    const item = await prisma.catalogItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: "Item no encontrado" });
    }

    // 2. Transacción: Verificar dinero, restar y dar item
    const result = await prisma.$transaction(async (tx) => {
      // Verificar si ya lo tiene
      const alreadyOwned = await tx.userItem.findFirst({
        where: { userId, itemId }
      });

      if (alreadyOwned) {
        throw new Error("ALREADY_OWNED");
      }

      // Verificar saldo
      const stats = await tx.gameStats.findUnique({ where: { userId } });
      if (!stats || stats.dropsBalance < item.price) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Restar dinero
      await tx.gameStats.update({
        where: { userId },
        data: { 
            dropsBalance: { decrement: item.price },
            skinsCount: { increment: 1 }
        }
      });

      // Añadir item al inventario
      await tx.userItem.create({
        data: {
          userId,
          itemId,
          isEquipped: false // Se compra desequipado por defecto
        }
      });

      // Devolver estado actual de items y dinero
      const updatedItems = await tx.userItem.findMany({ where: { userId } });
      const updatedStats = await tx.gameStats.findUnique({ where: { userId } });

      return { items: updatedItems, drops: updatedStats?.dropsBalance, skinsCount: updatedStats?.skinsCount };
    });

    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    if (error.message === "ALREADY_OWNED") return res.status(400).json({ error: "Ya tienes este item" });
    if (error.message === "INSUFFICIENT_FUNDS") return res.status(400).json({ error: "No tienes suficientes drops" });
    
    console.error("Buy Item Error:", error);
    return res.status(500).json({ error: "Error al comprar item" });
  }
};

export const equipItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { itemId } = req.body;

    // 1. Verificar que el usuario TIENE el item
    const userItem = await prisma.userItem.findFirst({
      where: { userId, itemId },
      include: { item: true } // Incluimos info del catálogo para saber la categoría
    });

    if (!userItem) {
      return res.status(403).json({ error: "No posees este item" });
    }

    const category = userItem.item.category;
    const isCurrentlyEquipped = userItem.isEquipped;

    await prisma.$transaction(async (tx) => {
      if (isCurrentlyEquipped) {
        // A. Si ya está puesto -> LO QUITAMOS (Desequipar)
        await tx.userItem.update({
          where: { id: userItem.id }, // Usamos el ID interno de la tabla intermedia
          data: { isEquipped: false }
        });
      } else {
        // B. Si no está puesto -> LO PONEMOS
        
        // B1. Primero desequipamos cualquier otro item de esa MISMA categoría
        // Buscamos items de este usuario que sean de la misma categoría y estén equipados
        const itemsToUnequip = await tx.userItem.findMany({
          where: {
            userId,
            isEquipped: true,
            item: { category: category } // Filtro por relación
          }
        });

        for (const i of itemsToUnequip) {
          await tx.userItem.update({
            where: { id: i.id },
            data: { isEquipped: false }
          });
        }

        // B2. Equipamos el nuevo
        await tx.userItem.update({
          where: { id: userItem.id },
          data: { isEquipped: true }
        });
      }
    });

    // Devolver la lista actualizada para que el frontend se refresque
    const allItems = await prisma.userItem.findMany({ where: { userId } });
    
    return res.json({
      success: true,
      items: allItems
    });

  } catch (error) {
    console.error("Equip Item Error:", error);
    return res.status(500).json({ error: "Error al equipar item" });
  }
};