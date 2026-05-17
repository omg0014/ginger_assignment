import sharp from 'sharp';

export async function tamperedHeuristics(filePath: string) {
  const image = sharp(filePath);
  const { width = 1, height = 1 } = await image.metadata();

  const quadrants = [
    { left: 0, top: 0, width: Math.floor(width/2), height: Math.floor(height/2) },
    { left: Math.floor(width/2), top: 0, width: Math.floor(width/2), height: Math.floor(height/2) },
    { left: 0, top: Math.floor(height/2), width: Math.floor(width/2), height: Math.floor(height/2) },
    { left: Math.floor(width/2), top: Math.floor(height/2), width: Math.floor(width/2), height: Math.floor(height/2) },
  ];

  const variances: number[] = [];
  for (const q of quadrants) {
    const { channels } = await sharp(filePath).extract(q).stats();
    const v = channels.reduce((s, c) => s + c.stdev, 0) / channels.length;
    variances.push(v);
  }

  const maxV = Math.max(...variances);
  const minV = Math.min(...variances);
  const varianceRatio = minV > 0 ? maxV / minV : 1;

  const THRESHOLD = 4.0;
  const isSuspicious = varianceRatio > THRESHOLD;
  const score = isSuspicious ? Math.min(1, (varianceRatio - THRESHOLD) / THRESHOLD) : 0;

  return {
    name: 'tampered_heuristics',
    label: 'tamper detection',
    passed: !isSuspicious,
    score: Math.round(score * 100) / 100,
    confidence: 0.60,
    detail: isSuspicious
      ? `quadrant variance ratio ${varianceRatio.toFixed(2)} suggests possible selective editing.`
      : `quadrant variance ratio ${varianceRatio.toFixed(2)} within normal range.`,
    severity: isSuspicious ? 'MEDIUM' : 'NONE',
  };
}
