import { blurDetection } from './checks/blurDetection.js';
import { brightnessCheck } from './checks/brightnessCheck.js';
import { duplicateDetection } from './checks/duplicateDetection.js';
import { screenshotDetection } from './checks/screenshotDetection.js';
import { dimensionCheck } from './checks/dimensionCheck.js';
import { ocrNumberPlate } from './checks/ocrNumberPlate.js';
import { metadataAnalysis } from './checks/metadataAnalysis.js';
import { tamperedHeuristics } from './checks/tamperedHeuristics.js';
export async function analyzeImage(jobId, filePath) {
    const startTime = Date.now();
    const [blurResult, brightnessResult, duplicateResult, screenshotResult, dimensionResult, ocrResult, metadataResult, tamperedResult,] = await Promise.all([
        blurDetection(filePath).catch(err => errorCheck('blur_detection', err)),
        brightnessCheck(filePath).catch(err => errorCheck('brightness', err)),
        duplicateDetection(filePath, jobId).catch(err => errorCheck('duplicate_detection', err)),
        screenshotDetection(filePath).catch(err => errorCheck('screenshot_detection', err)),
        dimensionCheck(filePath).catch(err => errorCheck('dimension_check', err)),
        ocrNumberPlate(filePath).catch(err => errorCheck('ocr_number_plate', err)),
        metadataAnalysis(filePath).catch(err => errorCheck('metadata_analysis', err)),
        tamperedHeuristics(filePath).catch(err => errorCheck('tampered_heuristics', err)),
    ]);
    const checks = [
        blurResult, brightnessResult, duplicateResult, screenshotResult,
        dimensionResult, ocrResult, metadataResult, tamperedResult
    ];
    const weights = {
        blur_detection: 0.20,
        brightness: 0.15,
        duplicate_detection: 0.25,
        screenshot_detection: 0.15,
        dimension_check: 0.05,
        ocr_number_plate: 0.05,
        metadata_analysis: 0.10,
        tampered_heuristics: 0.05,
    };
    const overallRiskScore = checks.reduce((sum, check) => {
        const weight = weights[check.name] || 0;
        return sum + (check.score * weight);
    }, 0);
    const riskLevel = overallRiskScore < 0.3 ? 'LOW' : overallRiskScore < 0.6 ? 'MEDIUM' : 'HIGH';
    const processingTimeMs = Date.now() - startTime;
    return { checks, overallRiskScore, riskLevel, processingTimeMs };
}
function errorCheck(name, err) {
    return {
        name,
        label: name.replace(/_/g, ' '),
        passed: false,
        score: 0.5,
        confidence: 0,
        detail: `check failed: ${err.message}`,
        severity: 'UNKNOWN',
    };
}
