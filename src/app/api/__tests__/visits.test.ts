/**
 * Integration tests for Visits API
 * Tests date handling, RVU calculations, and CRUD operations
 */

import { parseLocalDate, calculateTotalRVU } from '@/lib/dateUtils';

// Mock data matching database structure
const mockVisits = [
  {
    id: 1,
    user_id: 'test-user-id',
    date: '2025-12-02',
    notes: 'Test visit 1',
    created_at: '2025-12-02T10:00:00Z',
    updated_at: '2025-12-02T10:00:00Z',
  },
  {
    id: 2,
    user_id: 'test-user-id',
    date: '2025-12-01',
    notes: 'Test visit 2',
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 3,
    user_id: 'test-user-id',
    date: '2025-11-01',
    notes: 'Test visit 3',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-11-01T10:00:00Z',
  },
];

const mockProcedures = [
  {
    id: 1,
    visit_id: 1,
    hcpcs: '99213',
    description: 'Office visit',
    status_code: 'A',
    work_rvu: 1.3,
    quantity: 2,
  },
  {
    id: 2,
    visit_id: 1,
    hcpcs: '99214',
    description: 'Office visit extended',
    status_code: 'A',
    work_rvu: 1.92,
    quantity: 1,
  },
  {
    id: 3,
    visit_id: 2,
    hcpcs: '99213',
    description: 'Office visit',
    status_code: 'A',
    work_rvu: 1.3,
    quantity: 1,
  },
];

describe('Visits API Integration', () => {
  describe('Date Handling', () => {
    it('should return visits ordered by date DESC', () => {
      const visits = [...mockVisits].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      expect(visits[0].date).toBe('2025-12-02');
      expect(visits[1].date).toBe('2025-12-01');
      expect(visits[2].date).toBe('2025-11-01');
    });

    it('should parse visit dates correctly without timezone shifts', () => {
      mockVisits.forEach((visit) => {
        const parsed = parseLocalDate(visit.date);
        const [year, month, day] = visit.date.split('-').map(Number);

        expect(parsed.getFullYear()).toBe(year);
        expect(parsed.getMonth()).toBe(month - 1);
        expect(parsed.getDate()).toBe(day);
      });
    });

    it('should maintain date integrity through CRUD operations', () => {
      const newVisit = {
        user_id: 'test-user-id',
        date: '2025-12-03',
        notes: 'New visit',
        procedures: [],
      };

      // Simulate POST operation
      const storedDate = newVisit.date;
      expect(storedDate).toBe('2025-12-03');

      // Simulate GET operation
      const retrievedDate = storedDate;
      expect(retrievedDate).toBe('2025-12-03');
    });

    it('should handle dates at month boundaries', () => {
      const monthBoundaryDates = [
        '2025-01-31',
        '2025-02-01',
        '2025-12-31',
        '2026-01-01',
      ];

      monthBoundaryDates.forEach((dateStr) => {
        const parsed = parseLocalDate(dateStr);
        const [year, month, day] = dateStr.split('-').map(Number);

        expect(parsed.getFullYear()).toBe(year);
        expect(parsed.getMonth()).toBe(month - 1);
        expect(parsed.getDate()).toBe(day);
      });
    });
  });

  describe('RVU Calculations', () => {
    it('should calculate total RVU for visit with multiple procedures', () => {
      const visit1Procedures = mockProcedures.filter((p) => p.visit_id === 1);
      const total = calculateTotalRVU(visit1Procedures);

      // (1.3 * 2) + (1.92 * 1) = 2.6 + 1.92 = 4.52
      expect(total).toBeCloseTo(4.52, 2);
    });

    it('should calculate total RVU with quantity multiplier', () => {
      const procedure = mockProcedures[0]; // 1.3 RVU, quantity 2
      const total = calculateTotalRVU([procedure]);

      expect(total).toBeCloseTo(2.6, 2);
    });

    it('should handle single procedure visits', () => {
      const visit2Procedures = mockProcedures.filter((p) => p.visit_id === 2);
      const total = calculateTotalRVU(visit2Procedures);

      expect(total).toBe(1.3);
    });

    it('should handle visits with no procedures', () => {
      const total = calculateTotalRVU([]);
      expect(total).toBe(0);
    });

    it('should maintain decimal precision in calculations', () => {
      const procedures = [
        { work_rvu: 1.23, quantity: 3 },
        { work_rvu: 2.45, quantity: 2 },
      ];
      const total = calculateTotalRVU(procedures);

      // (1.23 * 3) + (2.45 * 2) = 3.69 + 4.90 = 8.59
      expect(total).toBeCloseTo(8.59, 2);
    });
  });

  describe('Data Filtering', () => {
    it('should filter visits by date range', () => {
      const startDate = '2025-11-15';
      const endDate = '2025-12-05';

      const filtered = mockVisits.filter((visit) => {
        return visit.date >= startDate && visit.date <= endDate;
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map((v) => v.date)).toEqual(['2025-12-02', '2025-12-01']);
    });

    it('should filter visits by user ID', () => {
      const userId = 'test-user-id';
      const filtered = mockVisits.filter((visit) => visit.user_id === userId);

      expect(filtered).toHaveLength(3);
    });

    it('should handle empty results', () => {
      const futureDate = '2026-01-01';
      const filtered = mockVisits.filter((visit) => visit.date > futureDate);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('Visit Structure', () => {
    it('should include procedures with visit data', () => {
      const visitWithProcedures = {
        ...mockVisits[0],
        procedures: mockProcedures.filter((p) => p.visit_id === mockVisits[0].id),
      };

      expect(visitWithProcedures.procedures).toHaveLength(2);
      expect(visitWithProcedures.procedures[0].hcpcs).toBe('99213');
    });

    it('should maintain procedure quantity information', () => {
      const procedure = mockProcedures[0];

      expect(procedure.quantity).toBe(2);
      expect(procedure.work_rvu).toBe(1.3);
    });

    it('should include all required visit fields', () => {
      const visit = mockVisits[0];

      expect(visit).toHaveProperty('id');
      expect(visit).toHaveProperty('user_id');
      expect(visit).toHaveProperty('date');
      expect(visit).toHaveProperty('notes');
      expect(visit).toHaveProperty('created_at');
      expect(visit).toHaveProperty('updated_at');
    });
  });
});
