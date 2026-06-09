import { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { createFile, getFileBySlug, incrementDownloads } from '../db/index.js';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, _file, cb) => {
    const slug = uuidv4().substring(0, 8);
    cb(null, slug);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800')
  }
});

export function uploadRoutes(router: import('express').Router): void {
  router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const originalName = req.file.originalname;
      const slug = req.file.filename;
      const size = req.file.size;
      const mimeType = req.file.mimetype;
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      const file = createFile(slug, originalName, req.file.path, size, mimeType, expiresAt);
      
      res.json({
        slug: file.slug,
        url: `/d/${file.slug}`,
        originalName: file.original_name,
        size: file.size,
        expiresAt: file.expires_at
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  router.get('/download/:slug', (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const file = getFileBySlug(slug);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const now = new Date();
      if (new Date(file.expires_at) < now) {
        return res.status(410).json({ error: 'File has expired' });
      }

      incrementDownloads(slug);

      res.download(file.filepath, file.original_name, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });

  router.get('/info/:slug', (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const file = getFileBySlug(slug);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const now = new Date();
      const expiresAt = new Date(file.expires_at);
      const isExpired = expiresAt < now;
      
      const remainingMs = isExpired ? 0 : expiresAt.getTime() - now.getTime();
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      res.json({
        originalName: file.original_name,
        size: file.size,
        mimeType: file.mime_type,
        downloads: file.downloads,
        expiresAt: file.expires_at,
        remainingTime: `${remainingHours}h ${remainingMinutes}m`,
        isExpired
      });
    } catch (error) {
      console.error('Info error:', error);
      res.status(500).json({ error: 'Failed to get file info' });
    }
  });
}