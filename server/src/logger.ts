import { type Request, type Response, type NextFunction } from 'express';

/**
 * Request logger middleware.
 * Logs method, path, status code, and response time (ms) for every request.
 * Suppresses output in the test environment to keep test output clean.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    if (process.env.NODE_ENV === 'test') return;
    const ms = Date.now() - start;
    const entry = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms,
    };
    console.log(JSON.stringify(entry));
  });

  next();
}
