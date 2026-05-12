import { Router } from 'express';
import { createIssue, listIssues, getIssue, patchIssue, deleteIssue } from '@/controllers/issues';
import {
  validatePostIssueBody,
  validatePatchIssueBody,
  validateGetIssuesQuery,
} from '@/middleware/validation';
import { validateNumericId } from '@/middleware/validation';
import { requireAuth, requireRoleAtLeast } from '@/middleware/requireAuth';

const issuesRouter = Router();

// Public — anyone can file a report
issuesRouter.post('/', validatePostIssueBody, createIssue);

// Admin-gated — role at least Admin required for all triage routes
issuesRouter.get('/', requireAuth, requireRoleAtLeast('ADMIN'), validateGetIssuesQuery, listIssues);

issuesRouter.get('/:id', requireAuth, requireRoleAtLeast('ADMIN'), validateNumericId, getIssue);

issuesRouter.patch(
  '/:id',
  requireAuth,
  requireRoleAtLeast('ADMIN'),
  validateNumericId,
  validatePatchIssueBody,
  patchIssue
);

issuesRouter.delete(
  '/:id',
  requireAuth,
  requireRoleAtLeast('ADMIN'),
  validateNumericId,
  deleteIssue
);

export { issuesRouter };
