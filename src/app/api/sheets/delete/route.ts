import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, extractSpreadsheetId, getSheetMetadata } from '@/lib/google-sheets';

export async function DELETE(request: NextRequest) {
  try {
    const { url, rowIndex } = await request.json();
    if (!url || rowIndex === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(url);
    const metadata = await getSheetMetadata(spreadsheetId);
    const sheetId = metadata.sheets[0]?.sheetId || 0;

    await deleteRow(spreadsheetId, sheetId, rowIndex);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete row';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
