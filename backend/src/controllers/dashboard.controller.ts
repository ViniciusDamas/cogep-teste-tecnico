import { NextFunction, Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';

export async function summary(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.summary();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
