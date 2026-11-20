/**
 * Only render photos supplied by the store owner. The six legacy starter assets
 * are generated layout illustrations, not verified product photographs.
 */
const starterIllustrationPattern = /^\/images\/products\/(doko-doko-bugis|risol-kentang-bengkuang|risol-mayo|onde-onde|dadar-gulung|apam)\.webp(?:\?.*)?$/i;

export function getPublicProductPhoto(imagePath?: string | null): string {
  if (typeof imagePath !== 'string' || !imagePath.trim()) return '';
  const normalized = imagePath.trim();
  return starterIllustrationPattern.test(normalized) ? '' : normalized;
}
