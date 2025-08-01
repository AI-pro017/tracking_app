import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyNutrition, nutritionMetrics } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const metricId = searchParams.get('metricId');

    // Build where conditions
    const conditions = [];
    if (date) {
      conditions.push(eq(dailyNutrition.date, date));
    }
    if (metricId) {
      conditions.push(eq(dailyNutrition.metricId, parseInt(metricId)));
    }

    let query = db.select({
      id: dailyNutrition.id,
      metricId: dailyNutrition.metricId,
      value: dailyNutrition.value,
      date: dailyNutrition.date,
      metricName: nutritionMetrics.name,
      metricUnit: nutritionMetrics.unit,
    })
    .from(dailyNutrition)
    .leftJoin(nutritionMetrics, eq(dailyNutrition.metricId, nutritionMetrics.id));

    // Execute query with conditional where clause
    const entries = await (conditions.length > 0 
      ? query.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : query
    ).orderBy(asc(dailyNutrition.date));
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch daily nutrition' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { metricId, value, date } = await request.json();
    
    if (!metricId || !value || !date) {
      return NextResponse.json({ error: 'MetricId, value, and date are required' }, { status: 400 });
    }

    // Check if entry already exists for this metric and date
    const existing = await db.select()
      .from(dailyNutrition)
      .where(and(
        eq(dailyNutrition.metricId, metricId),
        eq(dailyNutrition.date, date)
      ));

    if (existing.length > 0) {
      // Update existing entry
      const [entry] = await db.update(dailyNutrition)
        .set({ value, updatedAt: new Date() })
        .where(eq(dailyNutrition.id, existing[0].id))
        .returning();
      return NextResponse.json(entry);
    } else {
      // Create new entry
      const [entry] = await db.insert(dailyNutrition)
        .values({ metricId, value, date })
        .returning();
      return NextResponse.json(entry, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save daily nutrition' }, { status: 500 });
  }
}