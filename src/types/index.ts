// Sheet Data Types
export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
  spreadsheetId: string;
  sheetName: string;
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    rowCount: number;
    columnCount: number;
  }[];
}
