import { Router } from 'express';
import prisma from '../../db/prisma';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [data, total] = await prisma.$transaction([
            prisma.job.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { analysis: { select: { riskLevel: true, overallRiskScore: true, numberPlate: true } } },
            }),
            prisma.job.count(),
        ]);
        res.json({
            data: data.map(job => ({
                id: job.id,
                status: job.status,
                originalName: job.originalName,
                createdAt: job.createdAt,
                riskLevel: job.analysis?.riskLevel,
                riskScore: job.analysis?.overallRiskScore,
                numberPlate: job.analysis?.numberPlate,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;
