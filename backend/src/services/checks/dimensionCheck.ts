import sharp from 'sharp';

export async function dimensionCheck(filePath: string) {
  const { width = 0, height = 0 } = await sharp(filePath).metadata();

  const MIN_W = 640, MIN_H = 480, MAX_W = 6000, MAX_H = 6000;
  const MIN_RATIO = 0.5, MAX_RATIO = 3.0;
  const ratio = width / height;

  const issues: string[] = [];
  let score = 0;

  if (width < MIN_W || height < MIN_H) { issues.push(`too small (${width}x${height})`); score += 0.6; }
  if (width > MAX_W || height > MAX_H) { issues.push(`too large (${width}x${height})`); score += 0.3; }
  if (ratio < MIN_RATIO || ratio > MAX_RATIO) { issues.push(`unusual aspect ratio (${ratio.toFixed(2)})`); score += 0.4; }

  const passed = issues.length === 0;

  return {
    name: 'dimension_check',
    label: 'dimension validation',
    passed,
    score: Math.min(1, Math.round(score * 100) / 100),
    confidence: 1.0,
    detail: passed
      ? `${width}x${height}. dimensions within acceptable range.`
      : `issues: ${issues.join(', ')}.`,
    severity: passed ? 'NONE' : 'MEDIUM',
  };
}
