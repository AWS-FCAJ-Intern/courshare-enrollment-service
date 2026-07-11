import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller';

const healthRoutes = Router();

healthRoutes.get('/', getHealthStatus);
export default healthRoutes;
