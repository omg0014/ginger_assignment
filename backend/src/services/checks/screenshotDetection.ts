import sharp from 'sharp';
import exifr from 'exifr';

export async function screenshotDetection(filePath: string) {
  const metadata = await sharp(filePath).metadata();
  const { width = 0, height = 0 } = metadata;

  const signals: string[] = [];
  let score = 0;

  const screenResolutions = [
    [1920,1080],[2560,1440],[3840,2160],[1366,768],[1280,720],[2560,1600],[1440,900]
  ];
  const isScreenRes = screenResolutions.some(([w,h]) => w === width && h === height);
  if (isScreenRes) { signals.push('matches common screen resolution'); score += 0.4; }

  let exif: any = {};
  try { exif = await (exifr as any).parse(filePath); } catch {}
  const hasCamera = exif?.Make || exif?.Model || exif?.LensModel;
  if (!hasCamera) { signals.push('no camera metadata found'); score += 0.3; }

  const ratio = width / height;
  const screenRatios = [16/9, 16/10, 4/3, 21/9];
  const matchesRatio = screenRatios.some(r => Math.abs(r - ratio) < 0.02);
  if (matchesRatio && !hasCamera) { signals.push('aspect ratio matches screen format'); score += 0.2; }

  const finalScore = Math.min(1, score);
  const passed = finalScore < 0.2; // Much stricter pass threshold

  return {
    name: 'screenshot_detection',
    label: 'screenshot detection',
    passed,
    score: Math.round(finalScore * 100) / 100,
    confidence: 0.92, // Increased confidence for strict mode
    detail: passed
      ? 'no screenshot patterns detected. image appears to be a real photo.'
      : `screenshot signals: ${signals.join(', ')}. image likely captured from screen.`,
    severity: passed ? 'NONE' : (finalScore > 0.5 ? 'HIGH' : 'MEDIUM'),
  };
}
