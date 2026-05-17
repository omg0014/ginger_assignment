import { Worker, Job as BullJob } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../db/client.js';
import { analyzeImage } from '../services/imageAnalysis.js';
import sharp from 'sharp';
import { logger } from '../utils/logger.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379', { maxRetriesPerRequest: null });

export const setupWorker = () => {
  const worker = new Worker(
    'image-processing',
    async (job: BullJob) => {
      const { jobId } = job.data;
      
      const dbJob = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' }
      });

      try {
        const { checks, overallRiskScore, riskLevel, processingTimeMs } = await analyzeImage(jobId, dbJob.filePath);
        
        const metadata = await sharp(dbJob.filePath).metadata();

        await prisma.analysis.create({
          data: {
            jobId,
            overallRiskScore,
            riskLevel,
            checks: checks as any,
            imageWidth: metadata.width || 0,
            imageHeight: metadata.height || 0,
            processingTimeMs,
            numberPlate: (checks as any).find((c: any) => c.name === 'ocr_number_plate')?.extractedPlate || null
          }
        });

        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'COMPLETED', completedAt: new Date() }
        });

      } catch (error: any) {
        logger.error({ message: 'Worker job error', jobId, error: error.message });
        throw error;
      }
    },
    {
      connection,
      concurrency: 3,
    }
  );

  worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      await prisma.job.update({
        where: { id: job.data.jobId },
        data: { status: 'FAILED', failureReason: err.message }
      });
    }
  });

  return worker;
};
