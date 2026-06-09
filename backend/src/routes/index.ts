import { Router } from 'express';
import { uploadRoutes } from './upload.js';

export default function routes(): Router {
  const router = Router();
  
  uploadRoutes(router);
  
  return router;
}