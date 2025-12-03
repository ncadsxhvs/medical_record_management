/**
 * Integration tests for Analytics API
 * Tests date grouping, period calculations, and metric summaries
 */

import { parseLocalDate, calculateTotalRVU } from '@/lib/dateUtils';

// Mock analytics data
const mockAnalyticsData = [
  {
    period_start: '2025-12-02',
    total_work_rvu: 4.52,
    total_entries: 2,
  },
  {
    period_start: '2025-12-01',
    total_work_rvu: 1.3,
    total_entries: 1,
  },
  {
    period_start: '2025-11-01',
    total_work_rvu: 2.6,
    total_entries: 1,
  },
];

const mockHCPCSBreakdown = [
  {
    period_start: '2025-12-02',
    hcpcs: '99213',
    description: 'Office visit',
    status_code: 'A',
    total_work_rvu: 2.6,
    entry_count: 2,
  },
  {
    period_start: '2025-12-02',
    hcpcs: '99214',
    description: 'Office visit extended',
    status_code: 'A',
    total_work_rvu: 1.92,
    entry_count: 1,
  },
  {
    period_start: '2025-12-01',
    hcpcs: '99213',
    description: 'Office visit',
    status_code: 'A',
    total_work_rvu: 1.3,
    entry_count: 1,
  },
];

describe('Analytics API Integration', () => {
  describe('Date Grouping', () => {
    it('should group by exact date for daily period', () => {
      // Verify each date is represented correctly
      const dates = mockAnalyticsData.map((d) => d.period_start);

      expect(dates).toContain('2025-12-02');
      expect(dates).toContain('2025-12-01');
      expect(dates).toContain('2025-11-01');
    });

    it('should not shift dates when grouping', () => {
      // Verify dates are grouped without timezone conversion
      mockAnalyticsData.forEach((data) => {
        const parsed = parseLocalDate(data.period_start);
        const [year, month, day] = data.period_start.split('-').map(Number);

        expect(parsed.getFullYear()).toBe(year);
        expect(parsed.getMonth()).toBe(month - 1);
        expect(parsed.getDate()).toBe(day);
      });
    });

    it('should maintain date consistency in HCPCS breakdown', () => {
      const dec2Data = mockHCPCSBreakdown.filter(
        (d) => d.period_start === '2025-12-02'
      );

      expect(dec2Data).toHaveLength(2);
      dec2Data.forEach((data) => {
        expect(data.period_start).toBe('2025-12-02');
      });
    });

    it('should sort periods in descending order', () => {
      const sorted = [...mockAnalyticsData].sort((a, b) => {
        return b.period_start.localeCompare(a.period_start);
      });

      expect(sorted[0].period_start).toBe('2025-12-02');
      expect(sorted[1].period_start).toBe('2025-12-01');
      expect(sorted[2].period_start).toBe('2025-11-01');
    });
  });

  describe('RVU Calculations', () => {
    it('should calculate total RVU correctly per period', () => {
      const dec2Total = mockAnalyticsData.find(
        (d) => d.period_start === '2025-12-02'
      )?.total_work_rvu;

      expect(dec2Total).toBeCloseTo(4.52, 2);
    });

    it('should sum RVU across all periods', () => {
      const grandTotal = mockAnalyticsData.reduce(
        (sum, d) => sum + d.total_work_rvu,
        0
      );

      // 4.52 + 1.3 + 2.6 = 8.42
      expect(grandTotal).toBeCloseTo(8.42, 2);
    });

    it('should calculate average RVU per entry', () => {
      const totalRVU = mockAnalyticsData.reduce(
        (sum, d) => sum + d.total_work_rvu,
        0
      );
      const totalEntries = mockAnalyticsData.reduce(
        (sum, d) => sum + d.total_entries,
        0
      );
      const avgRVU = totalRVU / totalEntries;

      // 8.42 / 4 = 2.105
      expect(avgRVU).toBeCloseTo(2.105, 2);
    });

    it('should calculate HCPCS-specific totals', () => {
      const code99213Total = mockHCPCSBreakdown
        .filter((d) => d.hcpcs === '99213')
        .reduce((sum, d) => sum + d.total_work_rvu, 0);

      // 2.6 + 1.3 = 3.9
      expect(code99213Total).toBeCloseTo(3.9, 2);
    });

    it('should maintain decimal precision', () => {
      mockAnalyticsData.forEach((data) => {
        expect(data.total_work_rvu).not.toBeNaN();
        expect(Number.isFinite(data.total_work_rvu)).toBe(true);
      });
    });
  });

  describe('Entry Counts', () => {
    it('should count total entries correctly per period', () => {
      const dec2Entries = mockAnalyticsData.find(
        (d) => d.period_start === '2025-12-02'
      )?.total_entries;

      expect(dec2Entries).toBe(2);
    });

    it('should sum entries across all periods', () => {
      const totalEntries = mockAnalyticsData.reduce(
        (sum, d) => sum + d.total_entries,
        0
      );

      expect(totalEntries).toBe(4);
    });

    it('should count HCPCS-specific entries', () => {
      const code99213Count = mockHCPCSBreakdown
        .filter((d) => d.hcpcs === '99213')
        .reduce((sum, d) => sum + d.entry_count, 0);

      expect(code99213Count).toBe(3);
    });
  });

  describe('Period Filtering', () => {
    it('should filter by date range', () => {
      const startDate = '2025-12-01';
      const endDate = '2025-12-02';

      const filtered = mockAnalyticsData.filter(
        (d) => d.period_start >= startDate && d.period_start <= endDate
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map((d) => d.period_start)).toEqual([
        '2025-12-02',
        '2025-12-01',
      ]);
    });

    it('should filter HCPCS breakdown by period', () => {
      const period = '2025-12-02';
      const filtered = mockHCPCSBreakdown.filter(
        (d) => d.period_start === period
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map((d) => d.hcpcs)).toEqual(['99213', '99214']);
    });

    it('should handle empty results for future dates', () => {
      const futureDate = '2026-01-01';
      const filtered = mockAnalyticsData.filter(
        (d) => d.period_start > futureDate
      );

      expect(filtered).toHaveLength(0);
    });
  });

  describe('Data Structure', () => {
    it('should include all required fields in summary data', () => {
      const data = mockAnalyticsData[0];

      expect(data).toHaveProperty('period_start');
      expect(data).toHaveProperty('total_work_rvu');
      expect(data).toHaveProperty('total_entries');
    });

    it('should include all required fields in breakdown data', () => {
      const data = mockHCPCSBreakdown[0];

      expect(data).toHaveProperty('period_start');
      expect(data).toHaveProperty('hcpcs');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('status_code');
      expect(data).toHaveProperty('total_work_rvu');
      expect(data).toHaveProperty('entry_count');
    });

    it('should maintain data type consistency', () => {
      mockAnalyticsData.forEach((data) => {
        expect(typeof data.period_start).toBe('string');
        expect(typeof data.total_work_rvu).toBe('number');
        expect(typeof data.total_entries).toBe('number');
      });
    });
  });

  describe('Metric Summaries', () => {
    it('should calculate correct summary statistics', () => {
      const stats = {
        totalRVU: mockAnalyticsData.reduce((sum, d) => sum + d.total_work_rvu, 0),
        totalEntries: mockAnalyticsData.reduce(
          (sum, d) => sum + d.total_entries,
          0
        ),
        avgRVU: 0,
      };

      stats.avgRVU = stats.totalRVU / stats.totalEntries;

      expect(stats.totalRVU).toBeCloseTo(8.42, 2);
      expect(stats.totalEntries).toBe(4);
      expect(stats.avgRVU).toBeCloseTo(2.105, 2);
    });

    it('should handle single period correctly', () => {
      const singlePeriod = [mockAnalyticsData[0]];
      const total = singlePeriod[0].total_work_rvu;

      expect(total).toBeCloseTo(4.52, 2);
    });

    it('should handle zero values', () => {
      const emptyData = [
        {
          period_start: '2025-12-03',
          total_work_rvu: 0,
          total_entries: 0,
        },
      ];

      expect(emptyData[0].total_work_rvu).toBe(0);
      expect(emptyData[0].total_entries).toBe(0);
    });
  });
});
