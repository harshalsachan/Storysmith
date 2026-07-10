/**
 * Global error handler middleware.
 */

export default function errorHandler(err, _req, res, _next) {
  console.error('Unhandled error:', err);

  // Prisma errors
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate record' });
  }

  // Anthropic API errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'AI service rate limited. Please wait a moment and try again.',
      retryable: true,
    });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
}
