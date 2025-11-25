// RVU Code Types
export interface RVUCode {
  id?: number;
  hcpcs: string;
  description: string;
  status_code: string;
  work_rvu: number;
  created_at?: string;
}

// Entry Types
export interface Entry {
  id: number;
  user_id: string;
  hcpcs: string;
  description: string;
  status_code: string;
  work_rvu: number;
  date: string;
  patient_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Favorite Types
export interface Favorite {
  id: number;
  user_id: string;
  hcpcs: string;
  created_at: string;
  rvu_code?: RVUCode;
}

// Analytics Types
export interface AnalyticsPeriod {
  date: string;
  total_rvu: number;
  entry_count: number;
}

export interface AnalyticsBreakdown {
  hcpcs: string;
  description: string;
  count: number;
  total_rvu: number;
}
