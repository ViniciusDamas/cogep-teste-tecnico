import { NextFunction, Request, Response } from 'express';
import * as activityService from '../services/activity.service';
import * as auditService from '../services/audit.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await activityService.list({
      stageId: req.query.stageId as string | undefined,
      personId: req.query.personId as string | undefined,
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await activityService.findById(req.params.id);
    res.json(a);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await activityService.create(req.body, req.userId!);
    res.status(201).json(a);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await activityService.update(req.params.id, req.body, req.userId!);
    res.json(a);
  } catch (err) {
    next(err);
  }
}

export async function moveStage(req: Request, res: Response, next: NextFunction) {
  try {
    const a = await activityService.moveStage(req.params.id, req.body.stageId, req.userId!);
    res.json(a);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await activityService.remove(req.params.id, req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await auditService.history('Activity', req.params.id);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}
