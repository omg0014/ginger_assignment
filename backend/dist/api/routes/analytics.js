import { Router } from 'express';
import prisma from '../../db/prisma';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const totalAnalyses = await prisma.job.count({ where: { status: 'COMPLETED' } });
        const highRiskCount = await prisma.analysis.count({ where: { riskLevel: 'HIGH' } });
        const allAnalyses = await prisma.analysis.findMany();
        const averageRiskScore = allAnalyses.length > 0
            ? allAnalyses.reduce((acc, curr) => acc + curr.overallRiskScore, 0) / allAnalyses.length
            : 0;
        // Issue Breakdown (simplified counts from JSON checks)
        const issueBreakdown = {
            blur: 0,
            low_brightness: 0,
            duplicate: 0,
            screenshot: 0,
            invalid_plate: 0,
            tampered: 0,
        };
        allAnalyses.forEach(analysis => {
            const checks = analysis.checks;
            checks.forEach(check => {
                if (!check.passed) {
                    if (check.name === 'blur_detection')
                        issueBreakdown.blur++;
                    if (check.name === 'brightness')
                        issueBreakdown.low_brightness++;
                    if (check.name === 'duplicate')
                        issueBreakdown.duplicate++;
                    if (check.name === 'screenshot')
                        issueBreakdown.screenshot++;
                    if (check.name === 'ocr')
                        issueBreakdown.invalid_plate++;
                    if (check.name === 'tampered')
                        issueBreakdown.tampered++;
                }
            });
        });
        // Daily Trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dailyTrendData = await prisma.job.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
                status: 'COMPLETED',
            },
            include: { analysis: true },
        });
        const dailyTrendMap = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyTrendMap[dateStr] = { date: dateStr, count: 0, highRisk: 0 };
        }
        dailyTrendData.forEach(job => {
            const dateStr = job.createdAt.toISOString().split('T')[0];
            if (dailyTrendMap[dateStr]) {
                dailyTrendMap[dateStr].count++;
                if (job.analysis?.riskLevel === 'HIGH') {
                    dailyTrendMap[dateStr].highRisk++;
                }
            }
        });
        res.json({
            totalAnalyses,
            highRiskCount,
            averageRiskScore,
            issueBreakdown,
            dailyTrend: Object.values(dailyTrendMap).reverse(),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;
