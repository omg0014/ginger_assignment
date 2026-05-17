import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import prisma from '../../db/prisma';
import { analysisQueue } from '../../queue/queue';
import logger from '../../utils/logger';
const router = Router();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const jobId = uuidv4();
        req.jobId = jobId;
        const uploadDir = path.join(process.cwd(), 'uploads', jobId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
        }
    },
});
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image uploaded' });
        }
        const jobId = req.jobId;
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const job = await prisma.job.create({
            data: {
                id: jobId,
                originalName: req.file.originalname,
                filePath: req.file.path,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                fileHash,
                status: 'PENDING',
            },
        });
        await analysisQueue.add('analyze', { jobId, filePath: req.file.path, fileHash });
        logger.info({
            message: 'Image uploaded and queued',
            jobId,
            originalName: req.file.originalname,
        });
        res.json({
            success: true,
            jobId,
            status: 'pending',
            message: 'Image uploaded. Processing started.',
        });
    }
    catch (error) {
        logger.error({ message: 'Upload error', error: error.message });
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;
