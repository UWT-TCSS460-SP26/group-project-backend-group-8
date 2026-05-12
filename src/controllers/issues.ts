import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { PostIssueBody, PatchIssueBody, GetIssuesQuery } from '@/middleware/validation';
import { IssueStatus } from '@/generated/prisma';

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

// ─── Sprint 4 — admin triage ──────────────────────────────────────────────────

/**
 * GET /v1/issues
 * Admin — paginated list of all bug reports, optionally filtered by status.
 * Sorted newest-first by default.
 */
export const listIssues = async (request: Request, response: Response) => {
  const { status, page, limit, order } = response.locals.query as GetIssuesQuery;

  try {
    const where = status ? { status: status as IssueStatus } : {};
    const skip = (page - 1) * limit;

    const [issues, total] = await prisma.$transaction([
      prisma.issue.findMany({
        where,
        orderBy: { createdAt: order },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          reporterEmail: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.issue.count({ where }),
    ]);

    response.status(200).json({
      data: issues,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve issues' });
  }
};

/**
 * GET /v1/issues/:id
 * Admin — full detail for a single bug report.
 */
export const getIssue = async (request: Request, response: Response) => {
  const id = Number(request.params.id);

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      response.status(404).json({ error: 'Issue not found' });
      return;
    }

    response.status(200).json({ data: issue });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve issue' });
  }
};

/**
 * PATCH /v1/issues/:id
 * Admin — update a bug report's status. Accepts a partial body with only
 * the `status` field. Unknown or unchanged values are rejected by the
 * validator upstream; this handler only runs on a valid, recognised status.
 */
export const patchIssue = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { status } = request.body as PatchIssueBody;

  try {
    const existing = await prisma.issue.findUnique({ where: { id } });

    if (!existing) {
      response.status(404).json({ error: 'Issue not found' });
      return;
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: { status: status.toUpperCase() as IssueStatus },
    });

    response.status(200).json({
      data: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to update issue' });
  }
};

/**
 * DELETE /v1/issues/:id
 * Admin — permanently remove a resolved or spam report.
 * Returns 204 No Content on success.
 */
export const deleteIssue = async (request: Request, response: Response) => {
  const id = Number(request.params.id);

  try {
    const existing = await prisma.issue.findUnique({ where: { id } });

    if (!existing) {
      response.status(404).json({ error: 'Issue not found' });
      return;
    }

    await prisma.issue.delete({ where: { id } });

    response.status(204).send();
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete issue' });
  }
};
