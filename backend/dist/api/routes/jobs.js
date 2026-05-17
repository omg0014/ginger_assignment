import { Router } from 'express';
import prisma from '../../db/prisma';
const router = Router();
router.get('/:id', async (req, res) => {
    try {
        const job = await prisma.job.findUnique({
            where: { id: req.params.id },
        });
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        const processingTimeMs = job.completedAt && job.createdAt
            ? job.completedAt.getTime() - job.createdAt.getTime()
            : null;
        res.json({
            jobId: job.id,
            status: job.status,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
            processingTimeMs,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/:id/result', async (req, res) => {
    try {
        const job = await prisma.job.findUnique({
            where: { id: req.params.id },
            include: { analysis: true },
        });
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        if (job.status !== 'COMPLETED' || !job.analysis) {
            return res.status(400).json({
                success: false,
                error: 'Analysis not completed or failed',
                status: job.status
            });
        }
        res.json({
            jobId: job.id,
            status: job.status,
            overallRiskScore: job.analysis.overallRiskScore,
            riskLevel: job.analysis.riskLevel,
            numberPlate: job.analysis.numberPlate,
            imageDimensions: {
                width: job.analysis.imageWidth,
                height: job.analysis.imageHeight
            },
            checks: job.analysis.checks,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;
