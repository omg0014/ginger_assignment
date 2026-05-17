import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { prisma } from '../../db/client.js';
export async function duplicateDetection(filePath, currentJobId) {
    const buffer = await readFile(filePath);
    const hash = createHash('md5').update(buffer).digest('hex');
    const existing = await prisma.job.findFirst({
        where: { fileHash: hash, id: { not: currentJobId }, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
    });
    const isDuplicate = !!existing;
    return {
        name: 'duplicate_detection',
        label: 'duplicate detection',
        passed: !isDuplicate,
        score: isDuplicate ? 1.0 : 0.0,
        confidence: 1.0,
        detail: isDuplicate
            ? `exact duplicate of job ${existing.id} uploaded on ${existing.createdAt.toISOString()}.`
            : 'no duplicate found. unique image.',
        severity: isDuplicate ? 'HIGH' : 'NONE',
    };
}
