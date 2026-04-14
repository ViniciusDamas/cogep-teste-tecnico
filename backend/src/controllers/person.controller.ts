import { NextFunction, Request, Response } from 'express';
import * as personService from '../services/person.service';
import * as auditService from '../services/audit.service';
import { lookupCep } from '../services/geocoding.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const persons = await personService.list({ q: req.query.q as string | undefined });
    res.json(persons);
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const p = await personService.findById(req.params.id);
    res.json(p);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const p = await personService.create(req.body, req.userId!);
    res.status(201).json(p);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const p = await personService.update(req.params.id, req.body, req.userId!);
    res.json(p);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await personService.remove(req.params.id, req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await auditService.history('Person', req.params.id);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function cep(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await lookupCep(req.params.cep);
    if (!data) return res.status(404).json({ error: 'CEP not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}
