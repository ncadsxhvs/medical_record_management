import { RVUCode, VisitProcedure, FavoriteGroupItem } from '@/types';

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
/**
 * Convert FavoriteGroupItem[] into VisitProcedure[], skipping codes already in
 * `existingHcpcs`. Each item's quantity is preserved (not clamped to 1).
 * Items whose HCPCS no longer exists in the RVU master list are skipped and
 * surfaced via console.warn.
 */
export async function groupItemsToProcedures(
  items: FavoriteGroupItem[],
  existingHcpcs: string[]
): Promise<VisitProcedure[]> {
  const filtered = items.filter(it => !existingHcpcs.includes(it.hcpcs));
  const fetched = await Promise.all(
    filtered.map(async (it) => {
      // Prefer hydrated fields from the API; fall back to a fetch.
      let code: RVUCode | null = null;
      if (it.description != null && it.work_rvu != null && it.status_code != null) {
        code = {
          hcpcs: it.hcpcs,
          description: it.description,
          status_code: it.status_code,
          work_rvu: it.work_rvu,
        };
      } else {
        code = await fetchRvuCodeByHcpcs(it.hcpcs);
      }
      if (!code) {
        console.warn(`[favorite-groups] HCPCS no longer exists: ${it.hcpcs}`);
        return null;
      }
      return {
        hcpcs: code.hcpcs,
        description: code.description,
        status_code: code.status_code,
        work_rvu: code.work_rvu,
        quantity: it.quantity,
      } as VisitProcedure;
    })
  );
  return fetched.filter((p): p is VisitProcedure => p !== null);
}

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
