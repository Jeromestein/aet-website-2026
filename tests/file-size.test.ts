import { describe, expect, it } from 'vitest';
import { formatFileSize } from '@/lib/dropbox/shared';
describe('file size display', () => {
  it.each([[0, '0 B'], [1, '1 B'], [687, '687 B'], [1023, '1,023 B'], [1024, '1 KB'], [1536, '1.5 KB'], [1048576, '1 MB'], [6292854, '6 MB']])('formats %i bytes as %s', (bytes, display) => {
    expect(formatFileSize(bytes)).toBe(display);
  });
  it('preserves locale formatting without rounding small files to zero MB', () => {
    expect(formatFileSize(1536, 'es')).toBe('1,5 KB');
    expect(formatFileSize(687, 'zh')).toBe('687 B');
  });
});
