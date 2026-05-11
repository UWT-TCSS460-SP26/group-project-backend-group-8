import express, { ErrorRequestHandler, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import { routes } from './routes';
import { apiReference } from '@scalar/express-api-reference';

const app = express();

// CORS allowlist driven by the CORS_ALLOWED_ORIGINS env var (comma-separated).
// Partner deploys their consumer app to a different origin in Sprint 6+;
// adding it is a single env-var update, no code change. Local dev defaults
// cover Vite (5173) and CRA/Next (3000). Requests with no Origin header
// (curl, server-to-server) are always permitted so the deployed API stays
// scriptable for testing.
const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    // Disallowed origin: omit the Access-Control-Allow-Origin header rather
    // than throwing. The browser blocks the request on its own; throwing
    // would surface as a noisy 500 in server logs.
    callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
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
