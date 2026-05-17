import { createWorker } from 'tesseract.js';

class OCRService {
  async extractText(imagePath: string): Promise<string> {
    const worker = await createWorker('eng');
    try {
      const { data: { text } } = await worker.recognize(imagePath);
      return text.trim();
    } catch (error) {
      console.error('OCR Extraction failed', error);
      return '';
    } finally {
      await worker.terminate();
    }
  }

  validateIndianPlate(text: string) {
    // Regex for Indian Plate formats: MH12AB1234, DL01C4321, etc.
    // Standard: 2 letters, 2 digits, 1 or 2 letters, 4 digits
    const plateRegex = /[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/g;
    const matches = text.toUpperCase().replace(/[^A-Z0-9]/g, '').match(plateRegex);
    
    return {
      isValid: !!matches && matches.length > 0,
      plates: matches || [],
    };
  }
}

export async function ocrNumberPlate(filePath: string) {
  const ocrService = new OCRService();
  
  // Extract raw text
  const extractedText = await ocrService.extractText(filePath);
  
  // Validate format
  const { isValid, plates } = ocrService.validateIndianPlate(extractedText);
  
  // Clean up extracted text for best effort display if invalid
  const rawCleaned = extractedText.replace(/[^A-Z0-9]/gi, '').toUpperCase().trim();
  const bestPlate = plates[0] || (rawCleaned.length > 3 ? rawCleaned.slice(0, 10) : null);

  return {
    name: 'ocr_number_plate',
    label: 'number plate ocr',
    passed: isValid,
    score: isValid ? 0.0 : bestPlate ? 0.4 : 0.6,
    confidence: isValid ? 0.95 : 0.5,
    detail: bestPlate
      ? `extracted: "${bestPlate}". ${isValid
          ? 'matches indian number plate format.'
          : 'does not match expected format — possible invalid or obscured plate.'}`
      : 'no readable text extracted from image. plate may be absent or unreadable.',
    severity: isValid ? 'NONE' : bestPlate ? 'MEDIUM' : 'HIGH',
    extractedPlate: isValid ? plates[0] : null,
  };
}
