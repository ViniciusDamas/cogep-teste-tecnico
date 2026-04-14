import { NextFunction, Request, Response } from 'express';
import * as stageService from '../services/stage.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await stageService.list();
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
