import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const out = await authService.login(req.body);
    res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  res.json({ id: req.userId, email: req.userEmail });
}
