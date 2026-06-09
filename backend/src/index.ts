import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initDatabase } from './db/index.js';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '..', '.env') });

const app = express();
const PORT = process.env.PORT || 8080;

initDatabase();

app.set('trust proxy', 2);

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', limiter);
app.use('/api', routes());

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Transfer server running on port ${PORT}`);
});

import cron from 'node-cron';
import { cleanupExpiredFiles } from './db/index.js';

cron.schedule('*/5 * * * *', () => {
  cleanupExpiredFiles();
});