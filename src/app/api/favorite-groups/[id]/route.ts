import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

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

export const PUT = withAuth(async (
  req: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return apiError('Invalid id', 400);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }
  const { name, items } = body || {};

  // Verify ownership
  const owned = await sql`
    SELECT id FROM favorite_groups WHERE id = ${id} AND user_id = ${userId}
  `;
  if (owned.rows.length === 0) return apiError('Group not found', 404);

  if (name !== undefined) {
    if (typeof name !== 'string') return apiError('name must be a string', 400);
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      return apiError('name must be 1-100 characters', 400);
    }
    const dup = await sql`
      SELECT id FROM favorite_groups
      WHERE user_id = ${userId} AND name = ${trimmed} AND id <> ${id}
    `;
    if (dup.rows.length > 0) {
      return apiError('A group with that name already exists', 409);
    }
  }

  if (items !== undefined) {
    const itemsErr = validateItems(items);
    if (itemsErr) return apiError(itemsErr, 400);
  }

  try {
    if (name !== undefined) {
      await sql`
        UPDATE favorite_groups
        SET name = ${name.trim()}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${userId};
      `;
    }
    if (items !== undefined) {
      await sql`DELETE FROM favorite_group_items WHERE group_id = ${id};`;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await sql`
          INSERT INTO favorite_group_items (group_id, hcpcs, quantity, sort_order)
          VALUES (${id}, ${it.hcpcs}, ${it.quantity}, ${i});
        `;
      }
      await sql`
        UPDATE favorite_groups SET updated_at = CURRENT_TIMESTAMP WHERE id = ${id};
      `;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update favorite group:', error);
    return apiError('Failed to update favorite group', 500);
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return apiError('Invalid id', 400);
  try {
    const result = await sql`
      DELETE FROM favorite_groups
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id;
    `;
    if (result.rows.length === 0) return apiError('Group not found', 404);
    return NextResponse.json({ message: 'Group deleted' });
  } catch (error) {
    console.error('Failed to delete favorite group:', error);
    return apiError('Failed to delete favorite group', 500);
  }
});
