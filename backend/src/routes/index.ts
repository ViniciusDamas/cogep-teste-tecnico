import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as auth from '../controllers/auth.controller';
import * as person from '../controllers/person.controller';
import * as activity from '../controllers/activity.controller';
import * as stage from '../controllers/stage.controller';
import * as dashboard from '../controllers/dashboard.controller';
import * as pub from '../controllers/public.controller';

export const router = Router();

// Public
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/public/consulta/:protocol', pub.consultByProtocol);
router.get('/stages', stage.list);

// Protected
router.use(authMiddleware);

router.get('/auth/me', auth.me);

router.get('/persons', person.list);
router.get('/persons/:id', person.get);
router.post('/persons', person.create);
router.put('/persons/:id', person.update);
router.delete('/persons/:id', person.remove);
router.get('/persons/:id/history', person.history);
router.get('/geocoding/cep/:cep', person.cep);

router.get('/activities', activity.list);
router.get('/activities/:id', activity.get);
router.post('/activities', activity.create);
router.put('/activities/:id', activity.update);
router.patch('/activities/:id/stage', activity.moveStage);
router.delete('/activities/:id', activity.remove);
router.get('/activities/:id/history', activity.history);

router.get('/dashboard/summary', dashboard.summary);
