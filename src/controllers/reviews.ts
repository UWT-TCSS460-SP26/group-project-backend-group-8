import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { $Enums } from '@/generated/prisma/client';
import Role = $Enums.Role;

export const updateReview = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { body } = request.body;
  const { sub, role } = request.user!;
  const userId = Number(sub);

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!review) {
      return response.status(404).json({ error: 'Review not found' });
    }

    if (role !== Role.ADMIN && review.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { body },
    });

    response.status(200).json({ data: updatedReview });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to update review' });
  }
};

export const deleteReview = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { sub, role } = request.user!;
  const userId = Number(sub);

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!review) {
      return response.status(404).json({ error: 'Review not found' });
    }

    if (role !== Role.ADMIN && review.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    const deletedReview = await prisma.review.delete({
      where: { id },
    });

    response.status(200).json({ data: deletedReview });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete review' });
  }
};
