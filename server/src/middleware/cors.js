/**
 * CORS middleware — restricts to the frontend origin.
 */

import corsLib from 'cors';

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const corsMiddleware = corsLib({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id'],
  credentials: true,
});

export default corsMiddleware;
