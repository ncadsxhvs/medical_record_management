import { NextResponse } from 'next/server';
import spec from './spec.json';

export async function GET() {
  return NextResponse.json(spec);
}
