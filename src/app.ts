import express, { ErrorRequestHandler, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import { routes } from './routes';
import { apiReference } from '@scalar/express-api-reference';

const app = express();

// Application-level middleware
app.use(cors());
app.use(express.json());

// OpenAPI documentation
const specFile = fs.readFileSync('./openapi.yaml', 'utf8');
const spec = YAML.parse(specFile);
app.get('/openapi.json', (_request: Request, response: Response) => {
  response.json(spec);
});
app.use('/api-docs', apiReference({ url: '/openapi.json' }));

// Routes
app.use(routes);

app.get('/', (_request: Request, response: Response) => {
  response.json({
    message: "Welcome to Group 8's Backend API!",
    docs: 'Navigate to /api-docs to view the OpenAPI documentation',
  });
});

app.get('/health', (_request: Request, response: Response) => {
  response.status(200).json({ status: 'alive' });
});

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

// Last-resort error handler. Logs full context server-side and returns a
// generic JSON envelope to the caller — never a stack trace or internal
// exception message.
const safeErrorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  // eslint-disable-next-line no-console -- intentional server-side log for ops
  console.error('[error]', request.method, request.path, error);
  if (response.headersSent) return;
  response.status(500).json({ error: 'Internal server error' });
};
app.use(safeErrorHandler);

export { app };
