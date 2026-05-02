import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withAuth(async (_req: NextRequest, userId: string) => {
  try {
    const result = await sql`
      SELECT rvu_target, target_start_date, target_end_date, bonus_rate, reminder_enabled
      FROM user_settings
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      const year = new Date().getFullYear();
      return NextResponse.json({
        rvuTarget: 0,
        targetStartDate: `${year}-01-01`,
        targetEndDate: `${year}-12-31`,
        bonusRate: 0,
        reminderEnabled: false,
      });
    }

    const row = result.rows[0];
    const normalizeDate = (val: any, fallback: string) => {
      if (!val) return fallback;
      if (typeof val === 'string') return val.split('T')[0];
      if (val instanceof Date) return val.toISOString().split('T')[0];
      return fallback;
    };
    const year = new Date().getFullYear();
    return NextResponse.json({
      rvuTarget: parseFloat(row.rvu_target) || 0,
      targetStartDate: normalizeDate(row.target_start_date, `${year}-01-01`),
      targetEndDate: normalizeDate(row.target_end_date, `${year}-12-31`),
      bonusRate: parseFloat(row.bonus_rate) || 0,
      reminderEnabled: row.reminder_enabled ?? false,
    });
  } catch (error) {
    console.error('[Settings API] GET error:', error);
    return apiError('Failed to load settings', 500);
  }
});

export const PUT = withAuth(async (req: NextRequest, userId: string) => {
  try {
    const body = await req.json();
    const { rvuTarget, targetStartDate, targetEndDate, bonusRate, reminderEnabled } = body;

    if (rvuTarget != null && (typeof rvuTarget !== 'number' || rvuTarget < 0)) {
      return apiError('rvuTarget must be a non-negative number', 400);
    }
    if (bonusRate != null && (typeof bonusRate !== 'number' || bonusRate < 0)) {
      return apiError('bonusRate must be a non-negative number', 400);
    }

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (targetStartDate && !dateRe.test(targetStartDate)) {
      return apiError('Invalid targetStartDate format', 400);
    }
    if (targetEndDate && !dateRe.test(targetEndDate)) {
      return apiError('Invalid targetEndDate format', 400);
    }

    const year = new Date().getFullYear();
    const rvu = rvuTarget ?? 0;
    const start = targetStartDate || `${year}-01-01`;
    const end = targetEndDate || `${year}-12-31`;
    const rate = bonusRate ?? 0;
    const reminder = reminderEnabled ?? false;

    await sql`
      INSERT INTO user_settings (user_id, rvu_target, target_start_date, target_end_date, bonus_rate, reminder_enabled)
      VALUES (${userId}, ${rvu}, ${start}, ${end}, ${rate}, ${reminder})
      ON CONFLICT (user_id) DO UPDATE SET
        rvu_target = ${rvu},
        target_start_date = ${start},
        target_end_date = ${end},
        bonus_rate = ${rate},
        reminder_enabled = ${reminder},
        updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({
      rvuTarget: rvu,
      targetStartDate: start,
      targetEndDate: end,
      bonusRate: rate,
      reminderEnabled: reminder,
    });
  } catch (error) {
    console.error('[Settings API] PUT error:', error);
    return apiError('Failed to save settings', 500);
  }
});
