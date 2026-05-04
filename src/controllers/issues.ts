import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { PostIssueBody } from '@/middleware/validation';

/**
 * Public — file a bug report. No authentication required so the downstream
 * FE can submit on behalf of unauthenticated visitors. Triage and listing
 * routes (admin-gated) ship in Sprint 4.
 */
export const createIssue = async (request: Request, response: Response) => {
  const { title, description, reproSteps, reporterEmail } = request.body as PostIssueBody;

  try {
    const issue = await prisma.issue.create({
      data: { title, description, reproSteps, reporterEmail },
    });

    response.status(201).json({
      data: {
        id: issue.id,
        title: issue.title,
        status: issue.status,
        createdAt: issue.createdAt,
      },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to file issue' });
  }
};
