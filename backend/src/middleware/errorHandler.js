import { ZodError } from 'zod';

/**
 * Centralized Application Error Handler
 */
export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const issues = err.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message
    }));
    return res.status(400).json({
      error: 'Validation failed',
      message: issues[0]?.message || 'Invalid input data',
      details: issues
    });
  }

  // 2. Multer Upload Error
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'One or more files exceed the maximum allowed size of 500 MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'A maximum of 5 files can be uploaded at a single time.'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }

  // 3. Fallback General Error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred during research processing.'
  });
}

export default errorHandler;
