// Mount all routers here - for now we just have the v1 routes, but we could have more in the future
import { Router } from 'express';
import { v1Routes } from './v1';

const routes = Router();

routes.use('/v1', v1Routes);

export { routes };
