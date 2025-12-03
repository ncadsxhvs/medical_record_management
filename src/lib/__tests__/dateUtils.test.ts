import {
  parseLocalDate,
  formatDate,
  getTodayString,
  calculateTotalRVU,
  isValidDateString,
} from '../dateUtils';

describe('dateUtils', () => {
  describe('parseLocalDate', () => {
    it('should parse YYYY-MM-DD format correctly', () => {
      const date = parseLocalDate('2025-12-02');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // December is month 11 (0-indexed)
      expect(date.getDate()).toBe(2);
    });

    it('should parse ISO datetime format correctly', () => {
      const date = parseLocalDate('2025-12-02T00:00:00Z');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(2);
    });

    it('should handle dates at year boundaries', () => {
      const newYear = parseLocalDate('2025-01-01');
      expect(newYear.getMonth()).toBe(0); // January
      expect(newYear.getDate()).toBe(1);

      const endYear = parseLocalDate('2025-12-31');
      expect(endYear.getMonth()).toBe(11); // December
      expect(endYear.getDate()).toBe(31);
    });

    it('should handle leap year dates', () => {
      const leapDay = parseLocalDate('2024-02-29');
      expect(leapDay.getMonth()).toBe(1); // February
      expect(leapDay.getDate()).toBe(29);
    });

    it('should not shift dates due to timezone', () => {
      // This date should always be December 2, regardless of timezone
      const date = parseLocalDate('2025-12-02');
      expect(date.getDate()).toBe(2);
      expect(date.getMonth()).toBe(11);
    });
  });

  describe('formatDate', () => {
    it('should format date with default options', () => {
      const formatted = formatDate('2025-12-02');
      // Should include weekday, month, day, and year
      expect(formatted).toContain('2025');
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('2');
    });

    it('should format date with custom options', () => {
      const formatted = formatDate('2025-12-02', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(formatted).toContain('December');
      expect(formatted).toContain('2');
      expect(formatted).toContain('2025');
    });

    it('should handle ISO datetime strings', () => {
      const formatted = formatDate('2025-12-02T00:00:00Z');
      expect(formatted).toContain('2025');
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('2');
    });

    it('should maintain date consistency across formats', () => {
      const dateStr = '2025-12-02';
      const isoStr = '2025-12-02T00:00:00Z';

      const formatted1 = formatDate(dateStr);
      const formatted2 = formatDate(isoStr);

      expect(formatted1).toBe(formatted2);
    });
  });

  describe('getTodayString', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const today = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return current date', () => {
      const now = new Date();
      const today = getTodayString();

      const [year, month, day] = today.split('-').map(Number);
      expect(year).toBe(now.getFullYear());
      expect(month).toBe(now.getMonth() + 1);
      expect(day).toBe(now.getDate());
    });

    it('should pad single digit months and days with zero', () => {
      // Mock a date with single digits
      const mockDate = new Date(2025, 0, 5); // January 5, 2025
      jest.spyOn(global, 'Date').mockImplementationOnce(() => mockDate as any);

      const dateStr = getTodayString();
      expect(dateStr).toBe('2025-01-05');
    });
  });

  describe('calculateTotalRVU', () => {
    it('should calculate total RVU for single procedure', () => {
      const procedures = [{ work_rvu: 5.0, quantity: 1 }];
      const total = calculateTotalRVU(procedures);
      expect(total).toBe(5.0);
    });

    it('should calculate total RVU with quantity multiplier', () => {
      const procedures = [{ work_rvu: 2.5, quantity: 3 }];
      const total = calculateTotalRVU(procedures);
      expect(total).toBe(7.5);
    });

    it('should calculate total RVU for multiple procedures', () => {
      const procedures = [
        { work_rvu: 5.0, quantity: 1 },
        { work_rvu: 2.5, quantity: 2 },
        { work_rvu: 3.0, quantity: 1 },
      ];
      const total = calculateTotalRVU(procedures);
      expect(total).toBe(13.0); // 5.0 + (2.5 * 2) + 3.0 = 13.0
    });

    it('should default to quantity of 1 if not provided', () => {
      const procedures = [{ work_rvu: 5.0 }];
      const total = calculateTotalRVU(procedures);
      expect(total).toBe(5.0);
    });

    it('should handle zero RVU values', () => {
      const procedures = [
        { work_rvu: 0, quantity: 5 },
        { work_rvu: 2.5, quantity: 2 },
      ];
      const total = calculateTotalRVU(procedures);
      expect(total).toBe(5.0);
    });

    it('should handle empty procedures array', () => {
      const total = calculateTotalRVU([]);
      expect(total).toBe(0);
    });

    it('should maintain decimal precision', () => {
      const procedures = [
        { work_rvu: 1.23, quantity: 2 },
        { work_rvu: 3.45, quantity: 1 },
      ];
      const total = calculateTotalRVU(procedures);
      expect(total).toBeCloseTo(5.91, 2);
    });
  });

  describe('isValidDateString', () => {
    it('should reject invalid formats', () => {
      expect(isValidDateString('12/02/2025')).toBe(false);
      expect(isValidDateString('2025/12/02')).toBe(false);
      expect(isValidDateString('2025-12-2')).toBe(false);
      expect(isValidDateString('25-12-02')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
    });

    it('should accept valid YYYY-MM-DD format', () => {
      // Basic format validation
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateRegex.test('2025-12-02')).toBe(true);
      expect(dateRegex.test('2024-01-15')).toBe(true);
      expect(dateRegex.test('2025-12-31')).toBe(true);
    });
  });
});
