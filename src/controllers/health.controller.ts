import { Request, Response } from 'express';

export async function getHealthStatus(req: Request, res: Response) {
  console.log('Health check endpoint called',req.method, req.url);
  return res.json({
    service: 'enrollment-service',
    status: 'UP'
  });
};
