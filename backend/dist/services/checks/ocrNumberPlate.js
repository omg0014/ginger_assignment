import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import path from 'path';
import os from 'os';
const PLATE_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/;
export async function ocrNumberPlate(filePath) {
    const tmpPath = path.join(os.tmpdir(), `ocr_${Date.now()}.png`);
    await sharp(filePath)
        .grayscale()
        .normalise()
        .threshold(128)
        .toFile(tmpPath);
    const { data: { text, confidence } } = await Tesseract.recognize(tmpPath, 'eng', {
        logger: () => { },
    });
    const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase().trim();
    const isValid = PLATE_REGEX.test(cleaned);
    return {
        name: 'ocr_number_plate',
        label: 'number plate ocr',
        passed: isValid,
        score: isValid ? 0 : 0.5,
        confidence: Math.round(confidence) / 100,
        detail: cleaned
            ? `extracted text: "${cleaned}". ${isValid ? 'matches indian number plate format.' : 'does not match indian number plate format (XX00XX0000).'}`
            : 'no readable text extracted from image.',
        severity: isValid ? 'NONE' : 'MEDIUM',
        extractedPlate: isValid ? cleaned : null,
    };
}
