import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Clean existing data
    await prisma.analysis.deleteMany();
    await prisma.job.deleteMany();
    const sampleJobs = [
        {
            id: uuidv4(),
            originalName: 'white_sedan_front.jpg',
            filePath: 'uploads/seed/1.jpg',
            fileSize: 1024500,
            mimeType: 'image/jpeg',
            fileHash: 'hash1',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
            completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 5000),
            analysis: {
                overallRiskScore: 0.12,
                riskLevel: 'LOW',
                numberPlate: 'MH12AB1234',
                imageWidth: 1920,
                imageHeight: 1080,
                checks: [
                    { name: 'blur_detection', label: 'Blur Detection', passed: true, score: 0.05, confidence: 0.95, detail: 'Sharp image.', severity: 'NONE' },
                    { name: 'brightness', label: 'Brightness Analysis', passed: true, score: 0.1, confidence: 0.98, detail: 'Good lighting.', severity: 'NONE' },
                    { name: 'duplicate', label: 'Duplicate Detection', passed: true, score: 0, confidence: 1.0, detail: 'Unique image.', severity: 'NONE' },
                    { name: 'screenshot', label: 'Screenshot Detection', passed: true, score: 0, confidence: 0.9, detail: 'Authentic photo.', severity: 'NONE' },
                    { name: 'dimensions', label: 'Dimension Validation', passed: true, score: 0, confidence: 1.0, detail: 'Valid dimensions.', severity: 'NONE' },
                    { name: 'ocr', label: 'OCR Number Plate', passed: true, score: 0, confidence: 0.92, detail: 'Plate detected.', severity: 'NONE' },
                    { name: 'metadata', label: 'Metadata Analysis', passed: true, score: 0, confidence: 0.85, detail: 'Clear metadata.', severity: 'NONE' },
                    { name: 'tampered', label: 'Tampered Heuristics', passed: true, score: 0, confidence: 0.8, detail: 'No tampering.', severity: 'NONE' },
                ]
            }
        },
        {
            id: uuidv4(),
            originalName: 'blurry_bike.png',
            filePath: 'uploads/seed/2.png',
            fileSize: 2048000,
            mimeType: 'image/png',
            fileHash: 'hash2',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
            completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 + 6000),
            analysis: {
                overallRiskScore: 0.75,
                riskLevel: 'HIGH',
                numberPlate: null,
                imageWidth: 1280,
                imageHeight: 720,
                checks: [
                    { name: 'blur_detection', label: 'Blur Detection', passed: false, score: 0.9, confidence: 0.95, detail: 'Severe motion blur detected.', severity: 'HIGH' },
                    { name: 'ocr', label: 'OCR Number Plate', passed: false, score: 0.8, confidence: 0.4, detail: 'Could not read plate due to blur.', severity: 'MEDIUM' },
                    { name: 'brightness', label: 'Brightness Analysis', passed: true, score: 0.2, confidence: 0.9, detail: 'Acceptable.', severity: 'NONE' },
                    { name: 'duplicate', label: 'Duplicate Detection', passed: true, score: 0, confidence: 1.0, detail: 'Unique.', severity: 'NONE' },
                    { name: 'screenshot', label: 'Screenshot Detection', passed: true, score: 0, confidence: 0.8, detail: 'Authentic.', severity: 'NONE' },
                    { name: 'dimensions', label: 'Dimension Validation', passed: true, score: 0, confidence: 1.0, detail: 'Valid.', severity: 'NONE' },
                    { name: 'metadata', label: 'Metadata Analysis', passed: true, score: 0, confidence: 0.8, detail: 'Clean.', severity: 'NONE' },
                    { name: 'tampered', label: 'Tampered Heuristics', passed: true, score: 0, confidence: 0.7, detail: 'None.', severity: 'NONE' },
                ]
            }
        },
        {
            id: uuidv4(),
            originalName: 'car_screenshot.webp',
            filePath: 'uploads/seed/3.webp',
            fileSize: 512000,
            mimeType: 'image/webp',
            fileHash: 'hash3',
            status: 'COMPLETED',
            createdAt: new Date(),
            completedAt: new Date(Date.now() + 4000),
            analysis: {
                overallRiskScore: 0.62,
                riskLevel: 'HIGH',
                numberPlate: 'DL8CAF1234',
                imageWidth: 1920,
                imageHeight: 1080,
                checks: [
                    { name: 'screenshot', label: 'Screenshot Detection', passed: false, score: 0.85, confidence: 0.9, detail: '16:9 ratio and missing EXIF camera tags.', severity: 'HIGH' },
                    { name: 'metadata', label: 'Metadata Analysis', passed: false, score: 0.6, confidence: 0.9, detail: 'Detected "Photoshop" traces in file header.', severity: 'MEDIUM' },
                    { name: 'blur_detection', label: 'Blur Detection', passed: true, score: 0.05, confidence: 0.9, detail: 'Sharp.', severity: 'NONE' },
                    { name: 'brightness', label: 'Brightness Analysis', passed: true, score: 0.1, confidence: 0.9, detail: 'Good.', severity: 'NONE' },
                    { name: 'duplicate', label: 'Duplicate Detection', passed: true, score: 0, confidence: 1.0, detail: 'Unique.', severity: 'NONE' },
                    { name: 'dimensions', label: 'Dimension Validation', passed: true, score: 0, confidence: 1.0, detail: 'Valid.', severity: 'NONE' },
                    { name: 'ocr', label: 'OCR Number Plate', passed: true, score: 0, confidence: 0.9, detail: 'Valid plate.', severity: 'NONE' },
                    { name: 'tampered', label: 'Tampered Heuristics', passed: true, score: 0, confidence: 0.7, detail: 'None.', severity: 'NONE' },
                ]
            }
        }
    ];
    for (const jobData of sampleJobs) {
        const { analysis, ...jobInfo } = jobData;
        await prisma.job.create({
            data: {
                ...jobInfo,
                analysis: {
                    create: analysis
                }
            }
        });
    }
    // Create some failed jobs
    for (let i = 0; i < 2; i++) {
        await prisma.job.create({
            data: {
                id: uuidv4(),
                originalName: `corrupt_file_${i}.jpg`,
                filePath: `uploads/seed/fail_${i}.jpg`,
                fileSize: 0,
                mimeType: 'image/jpeg',
                fileHash: `fail_hash_${i}`,
                status: 'FAILED',
                failureReason: 'Unexpected end of input / corrupt image buffer',
                createdAt: new Date(),
            }
        });
    }
    console.log('Seeding completed!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
