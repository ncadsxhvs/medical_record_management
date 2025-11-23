import { NextRequest, NextResponse } from 'next/server';
import { addRow, extractSpreadsheetId } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { url, headers, values } = await request.json();
    if (!url || !headers || !values) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(url);
    await addRow(spreadsheetId, headers, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add row';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
