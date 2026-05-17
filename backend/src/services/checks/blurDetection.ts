import sharp from 'sharp';

export async function blurDetection(filePath: string) {
  const image = sharp(filePath);
  const { channels } = await image.stats();
  
  const avgStdDev = channels.reduce((s, c) => s + c.stdev, 0) / channels.length;
  
  const BLUR_THRESHOLD = 40; 
  const isBlurry = avgStdDev < BLUR_THRESHOLD;
  const score = isBlurry ? Math.min(1, (BLUR_THRESHOLD - avgStdDev) / BLUR_THRESHOLD) : 0;
  
  return {
    name: 'blur_detection',
    label: 'blur detection',
    passed: !isBlurry,
    score: Math.round(score * 100) / 100,
    confidence: 0.82,
    detail: isBlurry
      ? `image sharpness score ${avgStdDev.toFixed(1)} is below threshold ${BLUR_THRESHOLD}. likely blurry.`
      : `image sharpness score ${avgStdDev.toFixed(1)} above threshold. image appears sharp.`,
    severity: isBlurry ? (score > 0.7 ? 'HIGH' : 'MEDIUM') : 'NONE',
  };
}
