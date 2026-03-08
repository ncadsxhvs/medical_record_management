const mockSql: any = jest.fn().mockResolvedValue({ rows: [] });
mockSql.query = jest.fn().mockResolvedValue({ rows: [] });

export const sql = mockSql;
