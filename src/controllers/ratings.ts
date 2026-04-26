import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { $Enums, Prisma } from '@/generated/prisma/client';
import Role = $Enums.Role;

export const postRating = async (request: Request, response: Response) => {
  const { mediaId, mediaType, score } = request.body;
  const userId = Number(request.user!.sub);
  try {
    const rating = await prisma.rating.create({
      data: {
        score: Number(score),
        mediaId,
        mediaType,
        userId,
      },
    });
    response.status(201).json({ data: rating });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        response.status(400).json({ error: 'User not found' });
        return;
      }
    }
    response.status(500).json({ error: 'Failed to post rating' });
  }
};

export const updateRating = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { score } = request.body;
  const { sub, role } = request.user!;
  const userId = Number(sub);

  try {
    const rating = await prisma.rating.findUnique({ where: { id }, select: { userId: true } });

    if (!rating) {
      return response.status(404).json({ error: 'Rating not found' });
    }

    if (role !== Role.ADMIN && rating.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    const updatedRating = await prisma.rating.update({
      where: { id },
      data: { score },
    });

    response.status(200).json({ data: updatedRating });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to update rating' });
  }
};

export const deleteRating = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { sub, role } = request.user!;
  const userId = Number(sub);

  try {
    const rating = await prisma.rating.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!rating) {
      return response.status(404).json({ error: 'Rating not found' });
    }

    if (role !== Role.ADMIN && rating.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    const deletedRating = await prisma.rating.delete({
      where: { id },
    });

    response.status(200).json({ data: deletedRating });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete rating' });
  }
};
