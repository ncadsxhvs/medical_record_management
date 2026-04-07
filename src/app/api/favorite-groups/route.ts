import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { getRVUCodeByHCPCS } from '@/lib/rvu-cache';
import { NextRequest, NextResponse } from 'next/server';
import { FavoriteGroup, FavoriteGroupItem } from '@/types';

const HCPCS_RE = /^[A-Za-z0-9]{4,5}$/;

function validateItems(items: any): string | null {
  if (!Array.isArray(items) || items.length === 0) {
    return 'items must be a non-empty array';
  }
  const seen = new Set<string>();
  for (const it of items) {
    if (!it || typeof it.hcpcs !== 'string' || !HCPCS_RE.test(it.hcpcs)) {
      return 'Invalid HCPCS code format';
    }
    if (seen.has(it.hcpcs)) return `Duplicate hcpcs in items: ${it.hcpcs}`;
    seen.add(it.hcpcs);
    const q = Number(it.quantity);
    if (!Number.isInteger(q) || q < 1 || q > 1000) {
      return 'Quantity must be an integer between 1 and 1000';
    }
  }
  return null;
}

function validateName(name: any): string | null {
  if (typeof name !== 'string') return 'name is required';
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return 'name must be 1-100 characters';
  }
  return null;
}

async function hydrateItems(rawItems: { hcpcs: string; quantity: number }[]): Promise<FavoriteGroupItem[]> {
  const out: FavoriteGroupItem[] = [];
  for (const it of rawItems) {
    const code = await getRVUCodeByHCPCS(it.hcpcs);
    out.push({
      hcpcs: it.hcpcs,
      quantity: it.quantity,
      description: code?.description,
      status_code: code?.status_code,
      work_rvu: code?.work_rvu,
    });
  }
  return out;
}

export const GET = withAuth(async (_req: NextRequest, userId: string) => {
  try {
    const groupsRes = await sql`
      SELECT id, user_id, name, sort_order, created_at, updated_at
      FROM favorite_groups
      WHERE user_id = ${userId}
      ORDER BY sort_order ASC, created_at ASC;
    `;
    const groups = groupsRes.rows;
    if (groups.length === 0) return NextResponse.json([]);

    const ids = groups.map(g => Number(g.id));
    const idArray = `{${ids.join(',')}}`;
    const itemsRes = await sql`
      SELECT group_id, hcpcs, quantity, sort_order
      FROM favorite_group_items
      WHERE group_id = ANY(${idArray}::int[])
      ORDER BY sort_order ASC, id ASC;
    `;

    const itemsByGroup = new Map<number, { hcpcs: string; quantity: number }[]>();
    for (const row of itemsRes.rows) {
      const arr = itemsByGroup.get(row.group_id) || [];
      arr.push({ hcpcs: row.hcpcs, quantity: row.quantity });
      itemsByGroup.set(row.group_id, arr);
    }

    const result: FavoriteGroup[] = [];
    for (const g of groups) {
      const raw = itemsByGroup.get(g.id) || [];
      const hydrated = await hydrateItems(raw);
      result.push({ ...(g as any), items: hydrated });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch favorite groups:', error);
    return apiError('Failed to fetch favorite groups', 500);
  }
});

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const { name, items } = body || {};
  const nameErr = validateName(name);
  if (nameErr) return apiError(nameErr, 400);
  const itemsErr = validateItems(items);
  if (itemsErr) return apiError(itemsErr, 400);

  const trimmedName = name.trim();

  try {
    const dup = await sql`
      SELECT id FROM favorite_groups
      WHERE user_id = ${userId} AND name = ${trimmedName}
    `;
    if (dup.rows.length > 0) {
      return apiError('A group with that name already exists', 409);
    }

    const maxRes = await sql`
      SELECT COALESCE(MAX(sort_order), -1) as max_order
      FROM favorite_groups
      WHERE user_id = ${userId}
    `;
    const nextOrder = (maxRes.rows[0]?.max_order ?? -1) + 1;

    const insertGroup = await sql`
      INSERT INTO favorite_groups (user_id, name, sort_order)
      VALUES (${userId}, ${trimmedName}, ${nextOrder})
      RETURNING id, user_id, name, sort_order, created_at, updated_at;
    `;
    const group = insertGroup.rows[0];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      await sql`
        INSERT INTO favorite_group_items (group_id, hcpcs, quantity, sort_order)
        VALUES (${group.id}, ${it.hcpcs}, ${it.quantity}, ${i});
      `;
    }

    const hydrated = await hydrateItems(items);
    return NextResponse.json({ ...group, items: hydrated }, { status: 201 });
  } catch (error) {
    console.error('Failed to create favorite group:', error);
    return apiError('Failed to create favorite group', 500);
  }
});

export const PATCH = withAuth(async (req: NextRequest, userId: string) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }
  const { groups } = body || {};
  if (!Array.isArray(groups)) {
    return apiError('Invalid request: groups must be an array', 400);
  }

  try {
    for (let i = 0; i < groups.length; i++) {
      const id = Number(groups[i]?.id);
      if (!Number.isInteger(id)) continue;
      await sql`
        UPDATE favorite_groups
        SET sort_order = ${i}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId} AND id = ${id};
      `;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder favorite groups:', error);
    return apiError('Failed to reorder favorite groups', 500);
  }
});
