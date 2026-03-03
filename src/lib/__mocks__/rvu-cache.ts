export const searchRVUCodes = jest.fn().mockResolvedValue([]);
export const getCacheStats = jest.fn().mockReturnValue({ totalCodes: 0, cacheAge: 0 });
export const getRVUCodeByHCPCS = jest.fn().mockResolvedValue(null);
export const refreshCache = jest.fn().mockResolvedValue([]);
