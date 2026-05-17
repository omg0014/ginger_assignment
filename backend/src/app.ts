import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { prisma } from './db/client.js';
import { imageQueue } from './queue/queue.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { createHash } from 'crypto';

const app = express();
const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', node: 'vs_alpha_01', timestamp: new Date().toISOString() });
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'no image provided' });

  const jobId = uuidv4();
  const fileHash = createHash('md5').update(fs.readFileSync(req.file.path)).digest('hex');

  const job = await prisma.job.create({
    data: {
      id: jobId,
      status: 'PENDING',
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash: fileHash,
    }
  });

  await imageQueue.add('image-processing', { jobId });

  res.json({
    success: true,
    jobId: job.id,
    status: 'pending',
    message: 'image uploaded. processing started.'
  });
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { analysis: true }
  });
  if (!job) return res.status(404).json({ success: false, error: 'job not found.' });
  res.json({
    jobId: job.id,
    status: job.status.toLowerCase(),
    originalName: job.originalName,
    fileSize: job.fileSize,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    failureReason: job.failureReason,
    processingTimeMs: job.analysis?.processingTimeMs || null
  });
});

app.get('/api/jobs/:id/result', async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { analysis: true }
  });
  if (!job) return res.status(404).json({ success: false, error: 'job not found.' });
  if (job.status === 'PENDING' || job.status === 'PROCESSING') return res.status(202).json({ status: 'processing', message: 'analysis in progress.' });
  if (job.status === 'FAILED') return res.status(404).json({ jobId: job.id, status: 'failed', failureReason: job.failureReason, checks: [] });

  const analysis = job.analysis;
  res.json({
    jobId: job.id,
    status: 'completed',
    originalName: job.originalName,
    processingTimeMs: analysis?.processingTimeMs,
    overallRiskScore: analysis?.overallRiskScore,
    riskLevel: analysis?.riskLevel,
    numberPlate: analysis?.numberPlate,
    imageDimensions: { width: analysis?.imageWidth, height: analysis?.imageHeight },
    checks: analysis?.checks
  });
});

app.get('/api/history', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (req.query.status && req.query.status !== 'all status') {
    where.status = (req.query.status as string).toUpperCase();
  }
  if (req.query.risk && req.query.risk !== 'all risk') {
    where.analysis = {
      riskLevel: (req.query.risk as string).toUpperCase()
    };
  }
  if (req.query.search) {
    where.OR = [
      { id: { contains: req.query.search as string } },
      { analysis: { numberPlate: { contains: req.query.search as string } } }
    ];
  }
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ where, include: { analysis: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.job.count({ where })
  ]);
  res.json({
    data: jobs.map(j => ({
      jobId: j.id,
      status: j.status.toLowerCase(),
      originalName: j.originalName,
      fileSize: j.fileSize,
      riskLevel: j.analysis?.riskLevel,
      overallRiskScore: j.analysis?.overallRiskScore,
      numberPlate: j.analysis?.numberPlate,
      createdAt: j.createdAt,
      processingTimeMs: (j.analysis as any)?.processingTimeMs
    })),
    total, page, limit, totalPages: Math.ceil(total / limit)
  });
});

app.get('/api/analytics/summary', async (req, res) => {
  const [totalJobs, highRiskCount, completedCount, pendingCount, lowMediumRiskCount] = await Promise.all([
    prisma.job.count(),
    prisma.analysis.count({ where: { riskLevel: 'HIGH' } }),
    prisma.job.count({ where: { status: 'COMPLETED' } }),
    prisma.job.count({ where: { status: 'PENDING' } }),
    prisma.analysis.count({ where: { riskLevel: { in: ['LOW', 'MEDIUM'] } } }),
  ]);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dailyData: any[] = await prisma.$queryRaw`
    SELECT DATE("createdAt") as date, COUNT(*) as count 
    FROM "Job" 
    WHERE "createdAt" > ${sevenDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt") ASC
  `;
  res.json({
    totalJobs, highRiskCount, completedCount, pendingCount, lowMediumRiskCount,
    trends: dailyData.map((d: any) => ({ date: d.date.toISOString().split('T')[0], count: Number(d.count) })),
    breakdown: []
  });
});

export default app;
