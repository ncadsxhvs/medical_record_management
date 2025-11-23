import { NextRequest, NextResponse } from 'next/server';
import { updateRow, extractSpreadsheetId } from '@/lib/google-sheets';

export async function PUT(request: NextRequest) {
  try {
    const { url, rowIndex, headers, values } = await request.json();
    if (!url || rowIndex === undefined || !headers || !values) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(url);
    await updateRow(spreadsheetId, rowIndex, headers, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update row';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
