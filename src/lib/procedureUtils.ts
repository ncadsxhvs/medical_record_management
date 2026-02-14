import { RVUCode, VisitProcedure } from '@/types';

/**
 * Convert RVUCode[] to VisitProcedure[], filtering out codes already in use
 */
export function rvuCodesToProcedures(codes: RVUCode[], existingHcpcs: string[]): VisitProcedure[] {
  return codes
    .filter(code => !existingHcpcs.includes(code.hcpcs))
    .map(code => ({
      hcpcs: code.hcpcs,
      description: code.description,
      status_code: code.status_code,
      work_rvu: code.work_rvu,
      quantity: 1,
    }));
}

/**
 * Fetch RVU code details by HCPCS code from the search API
 */
export async function fetchRvuCodeByHcpcs(hcpcs: string): Promise<RVUCode | null> {
  try {
    const res = await fetch(`/api/rvu/search?q=${hcpcs}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.find((code: RVUCode) => code.hcpcs === hcpcs) || data[0];
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch RVU code details for ${hcpcs}:`, error);
    return null;
  }
}
