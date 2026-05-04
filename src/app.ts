import express, { ErrorRequestHandler, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import { routes } from './routes';
import { apiReference } from '@scalar/express-api-reference';

const app = express();

// CORS allowlist — origins are read from CORS_ALLOWED_ORIGINS as a
// comma-separated env var so deploys can change them without a code push.
// `*` means allow any origin (useful for fully-public deployments).
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Test-User'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
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
// generic JSON envelope to the caller — never a stack trace.
const safeErrorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  // eslint-disable-next-line no-console -- intentional server-side log for ops
  console.error('[error]', request.method, request.path, error);
  if (response.headersSent) return;
  response.status(500).json({ error: 'Internal server error' });
};
app.use(safeErrorHandler);

export { app };
