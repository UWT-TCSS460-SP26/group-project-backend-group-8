// Mount all routers here - for now we just have the v1 routes, but we could have more in the future
import { Router } from 'express';
import { v1Routes } from './v1';
import router from '@/routes/devAuth';

const routes = Router();

routes.use('/auth', router);
routes.use('/v1', v1Routes);

export { routes };
