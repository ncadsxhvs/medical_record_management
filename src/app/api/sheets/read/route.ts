import { NextRequest, NextResponse } from 'next/server';
import { readSheet, extractSpreadsheetId, getSheetMetadata } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL required' }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(url);
    const [sheetData, metadata] = await Promise.all([
      readSheet(spreadsheetId),
      getSheetMetadata(spreadsheetId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        headers: sheetData.headers,
        rows: sheetData.rows,
        metadata: { title: metadata.title },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load sheet';
    const status = message.includes('403') ? 403 : message.includes('404') ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
