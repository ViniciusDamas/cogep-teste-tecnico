import { NextFunction, Request, Response } from 'express';
import * as activityService from '../services/activity.service';

export async function consultByProtocol(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await activityService.findByProtocol(req.params.protocol);
    if (!a) return res.status(404).json({ error: 'Protocolo não encontrado' });
    // public view: expose only non-sensitive fields
    const publicView = {
      protocol: a.protocol,
      name: a.name,
      stage: (a as unknown as { stage: { code: string; name: string; order: number } }).stage,
      startDate: a.startDate,
      endDate: a.endDate,
      updatedAt: a.updatedAt,
    };
    res.json(publicView);
  } catch (err) {
    next(err);
  }
}
