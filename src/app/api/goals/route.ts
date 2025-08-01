import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nutritionGoals, nutritionMetrics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const goals = await db.select({
      id: nutritionGoals.id,
      metricId: nutritionGoals.metricId,
      operator: nutritionGoals.operator,
      targetValue: nutritionGoals.targetValue,
      metricName: nutritionMetrics.name,
      metricUnit: nutritionMetrics.unit,
    })
    .from(nutritionGoals)
    .leftJoin(nutritionMetrics, eq(nutritionGoals.metricId, nutritionMetrics.id));
    
    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { metricId, operator, targetValue } = await request.json();
    
    if (!metricId || !operator || !targetValue) {
      return NextResponse.json({ error: 'MetricId, operator, and targetValue are required' }, { status: 400 });
    }

    const [goal] = await db.insert(nutritionGoals)
      .values({ metricId, operator, targetValue })
      .returning();

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, metricId, operator, targetValue } = await request.json();
    
    if (!id || !metricId || !operator || !targetValue) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const [goal] = await db.update(nutritionGoals)
      .set({ metricId, operator, targetValue, updatedAt: new Date() })
      .where(eq(nutritionGoals.id, id))
      .returning();

    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.delete(nutritionGoals)
      .where(eq(nutritionGoals.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}