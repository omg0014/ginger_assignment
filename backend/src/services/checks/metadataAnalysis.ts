import exifr from 'exifr';

const EDITING_SOFTWARE = ['photoshop','lightroom','gimp','snapseed','vsco','facetune','afterlight','pixlr'];

export async function metadataAnalysis(filePath: string) {
  let exif: any = {};
  try { exif = await (exifr as any).parse(filePath, { all: true }); } catch {}

  const signals: string[] = [];
  let score = 0;

  const software = (exif?.Software || '').toLowerCase();
  const editingFound = EDITING_SOFTWARE.find(s => software.includes(s));
  if (editingFound) { signals.push(`editing software detected: ${editingFound}`); score += 0.5; }

  if (!exif?.latitude && !exif?.longitude) { signals.push('no gps coordinates'); score += 0.15; }

  if (!exif?.Make && !exif?.Model) { signals.push('no camera make/model'); score += 0.2; }

  if (exif?.ModifyDate && exif?.CreateDate) {
    const diff = Math.abs(new Date(exif.ModifyDate).getTime() - new Date(exif.CreateDate).getTime());
    if (diff > 60000) { signals.push('file modified after creation'); score += 0.35; }
  }

  const finalScore = Math.min(1, score);
  const passed = finalScore < 0.4;

  return {
    name: 'metadata_analysis',
    label: 'metadata analysis',
    passed,
    score: Math.round(finalScore * 100) / 100,
    confidence: 0.75,
    detail: signals.length
      ? `suspicious signals: ${signals.join('; ')}.`
      : 'metadata appears clean. no suspicious signals.',
    severity: passed ? 'NONE' : (finalScore > 0.6 ? 'HIGH' : 'MEDIUM'),
  };
}
