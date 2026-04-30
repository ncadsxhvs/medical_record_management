// RVU Code Types
export interface RVUCode {
  id?: number;
  hcpcs: string;
  description: string;
  status_code: string;
  work_rvu: number;
  created_at?: string;
}

// Favorite Types
export interface Favorite {
  id: number;
  user_id: string;
  hcpcs: string;
  sort_order: number;
  created_at: string;
  description?: string;
  work_rvu?: number;
  rvu_code?: RVUCode;
}

// Visit Procedure Types (for multi-HCPCS support)
export interface VisitProcedure {
  id?: number;
  visit_id?: number;
  hcpcs: string;
  description: string;
  status_code: string;
  work_rvu: number;
  quantity: number;
  created_at?: string;
}

// Visit Types (parent record containing multiple procedures)
export interface Visit {
  id?: number;
  user_id: string;
  date: string;
  time?: string;
  notes?: string;
  is_no_show?: boolean;
  procedures: VisitProcedure[];
  created_at?: string;
  updated_at?: string;
}

// Form state for building a visit with multiple procedures
export interface VisitFormData {
  date: string;
  time?: string;
  notes?: string;
  is_no_show?: boolean;
  procedures: VisitProcedure[];
}

// Favorite Group Types
export interface FavoriteGroupItem {
  hcpcs: string;
  quantity: number;
  description?: string;
  status_code?: string;
  work_rvu?: number;
}

export interface FavoriteGroup {
  id: number;
  user_id: string;
  name: string;
  sort_order: number;
  items: FavoriteGroupItem[];
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface AnalyticsData {
  period_start: string;
  total_work_rvu: number;
  total_encounters: number;
  total_no_shows: number;
}

export interface AnalyticsBreakdownData {
  period_start: string;
  hcpcs: string;
  description: string;
  status_code: string;
  total_work_rvu: number;
  total_quantity: number;
  encounter_count: number;
}
