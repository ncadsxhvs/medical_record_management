import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import type { SheetData, SheetMetadata } from '@/types';

// Get auth from env vars (Vercel) or local file
function getAuth() {
  // Try environment variables first (for Vercel)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  // Fall back to local file (for development)
  const keyPaths = [
    path.join(process.cwd(), 'config', 'dongcschen_api_key.json'),
    path.join(process.cwd(), 'config', 'service-account.json'),
  ];

  const keyFile = keyPaths.find((p) => fs.existsSync(p));
  if (!keyFile) throw new Error('Service account credentials not found');

  return new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const auth = getAuth();
const sheets = google.sheets({ version: 'v4', auth });

// Extract spreadsheet ID from URL
export function extractSpreadsheetId(url: string): string {
  if (!url.includes('/')) return url;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('Invalid Google Sheets URL');
  return match[1];
}

// Read sheet data
export async function readSheet(spreadsheetId: string): Promise<SheetData> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A1:Z1000',
  });

  const values = response.data.values || [];
  if (values.length === 0) {
    return { headers: [], rows: [], spreadsheetId, sheetName: 'Sheet1' };
  }

  const headers = values[0].map((h: unknown) => String(h || ''));
  const rows = values.slice(1).map((row: unknown[]) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => (obj[header] = String(row[i] ?? '')));
    return obj;
  });

  return { headers, rows, spreadsheetId, sheetName: 'Sheet1' };
}

// Get sheet metadata
export async function getSheetMetadata(spreadsheetId: string): Promise<SheetMetadata> {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'spreadsheetId,properties.title,sheets.properties',
  });

  return {
    spreadsheetId: response.data.spreadsheetId || spreadsheetId,
    title: response.data.properties?.title || 'Untitled',
    sheets: (response.data.sheets || []).map((s) => ({
      sheetId: s.properties?.sheetId || 0,
      title: s.properties?.title || 'Sheet',
      rowCount: s.properties?.gridProperties?.rowCount || 0,
      columnCount: s.properties?.gridProperties?.columnCount || 0,
    })),
  };
}

// Add new row
export async function addRow(spreadsheetId: string, headers: string[], values: Record<string, string>) {
  const rowValues = headers.map((h) => values[h] || '');
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A1:Z1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [rowValues] },
  });
}

// Update existing row (rowIndex is 0-based, row 0 = headers, row 1 = first data row)
export async function updateRow(spreadsheetId: string, rowIndex: number, headers: string[], values: Record<string, string>) {
  const rowValues = headers.map((h) => values[h] || '');
  const rowNum = rowIndex + 2; // +1 for header, +1 for 1-based index
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `A${rowNum}:Z${rowNum}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [rowValues] },
  });
}

// Delete row (rowIndex is 0-based data row index)
export async function deleteRow(spreadsheetId: string, sheetId: number, rowIndex: number) {
  const rowNum = rowIndex + 1; // +1 for header row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowNum,
            endIndex: rowNum + 1,
          },
        },
      }],
    },
  });
}
