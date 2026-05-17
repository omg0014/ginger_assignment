import sharp from 'sharp';

export async function brightnessCheck(filePath: string) {
  const { channels } = await sharp(filePath).stats();
  const mean = channels.reduce((s, c) => s + c.mean, 0) / channels.length;

  const TOO_DARK = 50;
  const TOO_BRIGHT = 200;
  const isTooDark = mean < TOO_DARK;
  const isTooBright = mean > TOO_BRIGHT;
  const passed = !isTooDark && !isTooBright;

  let score = 0;
  let detail = `mean brightness: ${mean.toFixed(0)}/255. `;
  let severity = 'NONE';

  if (isTooDark) {
    score = (TOO_DARK - mean) / TOO_DARK;
    detail += 'image is underexposed / low light.';
    severity = score > 0.3 ? 'HIGH' : 'MEDIUM';
  } else if (isTooBright) {
    score = (mean - TOO_BRIGHT) / (255 - TOO_BRIGHT);
    detail += 'image is overexposed.';
    severity = 'MEDIUM';
  } else {
    detail += 'brightness within acceptable range.';
  }

  return {
    name: 'brightness',
    label: 'brightness analysis',
    passed,
    score: Math.round(Math.min(1, score) * 100) / 100,
    confidence: 0.97,
    detail,
    severity,
  };
}
