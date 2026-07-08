import { Request, Response } from 'express';

export const getHealthStatus = (req: Request, res: Response) => {
  res.json({
    service: 'enrollment-service',
    status: 'UP'
  });
};
