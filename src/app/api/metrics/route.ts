import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nutritionMetrics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const metrics = await db.select().from(nutritionMetrics);
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, unit } = await request.json();
    
    if (!name || !unit) {
      return NextResponse.json({ error: 'Name and unit are required' }, { status: 400 });
    }

    const [metric] = await db.insert(nutritionMetrics)
      .values({ name, unit })
      .returning();

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create metric' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, unit } = await request.json();
    
    if (!id || !name || !unit) {
      return NextResponse.json({ error: 'ID, name, and unit are required' }, { status: 400 });
    }

    const [metric] = await db.update(nutritionMetrics)
      .set({ name, unit, updatedAt: new Date() })
      .where(eq(nutritionMetrics.id, id))
      .returning();

    return NextResponse.json(metric);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update metric' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.delete(nutritionMetrics)
      .where(eq(nutritionMetrics.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete metric' }, { status: 500 });
  }
}