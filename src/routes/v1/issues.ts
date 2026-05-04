import { Router } from 'express';
import { createIssue } from '@/controllers/issues';
import { validatePostIssueBody } from '@/middleware/validation';

const issuesRouter = Router();

issuesRouter.post('/', validatePostIssueBody, createIssue);

export { issuesRouter };
