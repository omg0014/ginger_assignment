import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

// Indian number plate regex: MH12AB1234 or DL8CAB1234 or KA03MN9012
const PLATE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

async function preprocessImage(filePath: string, outputPath: string, mode: 'light' | 'dark') {
  const pipeline = sharp(filePath).resize(1400, null, { withoutEnlargement: false });

  if (mode === 'light') {
    // Light plate (white/yellow bg, black text) — standard
    await pipeline
      .grayscale()
      .sharpen({ sigma: 2 })
      .normalise()
      .threshold(128)
      .toFile(outputPath);
  } else {
    // Dark plate (black bg, white text) — invert then threshold
    await pipeline
      .grayscale()
      .sharpen({ sigma: 2 })
      .normalise()
      .negate()
      .threshold(128)
      .toFile(outputPath);
  }
}

async function runOCR(imagePath: string): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker('eng');

  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    tessedit_pageseg_mode: '7' as any, // single line mode — best for number plates
  });

  const { data } = await worker.recognize(imagePath);
  await worker.terminate();

  return {
    text: data.text.replace(/[^A-Z0-9]/gi, '').toUpperCase().trim(),
    confidence: data.confidence / 100,
  };
}

export async function ocrNumberPlate(filePath: string) {
  const ts = Date.now();
  const tmpLight = path.join(os.tmpdir(), `ocr_light_${ts}.png`);
  const tmpDark  = path.join(os.tmpdir(), `ocr_dark_${ts}.png`);

  try {
    // Preprocess both variants
    await preprocessImage(filePath, tmpLight, 'light');
    await preprocessImage(filePath, tmpDark, 'dark');

    // Run OCR on both passes in parallel
    const [lightResult, darkResult] = await Promise.all([
      runOCR(tmpLight),
      runOCR(tmpDark),
    ]);

    // Pick the result with highest confidence that also matches plate regex
    const candidates = [lightResult, darkResult]
      .map(r => ({ ...r, isValid: PLATE_REGEX.test(r.text) }))
      .sort((a, b) => {
        // Valid plate match wins over confidence
        if (a.isValid && !b.isValid) return -1;
        if (!a.isValid && b.isValid) return 1;
        return b.confidence - a.confidence;
      });

    const best = candidates[0];
    const isValid = best.isValid;
    const extracted = best.text || null;

    return {
      name: 'ocr_number_plate',
      label: 'number plate ocr',
      passed: isValid,
      score: isValid ? 0.0 : extracted ? 0.4 : 0.6,
      confidence: Math.round(best.confidence * 100) / 100,
      detail: extracted
        ? `extracted: "${extracted}". ${isValid
            ? 'matches indian number plate format (XX00XX0000).'
            : 'does not match expected format — possible invalid or obscured plate.'}`
        : 'no readable text extracted from image. plate may be absent or unreadable.',
      severity: isValid ? 'NONE' : extracted ? 'MEDIUM' : 'HIGH',
      extractedPlate: isValid ? extracted : null,
    };

  } finally {
    // Clean up temp files
    await Promise.allSettled([
      fs.unlink(tmpLight).catch(() => {}),
      fs.unlink(tmpDark).catch(() => {}),
    ]);
  }
}
