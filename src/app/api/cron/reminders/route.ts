import { sql } from '@/lib/db';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) {
    return NextResponse.json({ skipped: 'weekend' });
  }

  const today = now.toISOString().split('T')[0];

  const result = await sql`
    SELECT u.email, u.name
    FROM users u
    JOIN user_settings us ON us.user_id = u.email
    WHERE us.reminder_enabled = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM visits v
        WHERE v.user_id = u.email AND v.date = ${today}::date
      )
  `;

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const user of result.rows) {
    try {
      await resend.emails.send({
        from: 'TrackMyRVU <reminders@trackmyrvu.com>',
        to: user.email,
        subject: "Don't forget to log your visits today",
        html: reminderEmailHtml(user.name || 'there'),
      });
      sent++;
    } catch (err) {
      console.error(`[Reminder] Failed to send to ${user.email}:`, err);
    }
  }

  return NextResponse.json({ sent, total: result.rows.length });
}

function reminderEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px">
    <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      <h2 style="color:#0070cc;font-weight:300;font-size:24px;margin:0 0 16px">TrackMyRVU</h2>
      <p style="color:#1f1f1f;font-size:16px;line-height:1.5;margin:0 0 8px">Hi ${name},</p>
      <p style="color:#52525b;font-size:16px;line-height:1.5;margin:0 0 24px">It looks like you haven't logged any visits today. Don't forget to track your RVUs before the day ends!</p>
      <a href="https://trackmyrvu.com" style="display:inline-block;background:#0070cc;color:#ffffff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px">Log a Visit</a>
    </div>
    <p style="color:#a1a1aa;font-size:12px;text-align:center;margin:24px 0 0">You're receiving this because you enabled daily reminders. Disable them in Settings.</p>
  </div>
</body>
</html>`.trim();
}
