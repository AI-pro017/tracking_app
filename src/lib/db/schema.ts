import { pgTable, serial, varchar, decimal, timestamp, text, integer } from 'drizzle-orm/pg-core';

export const nutritionMetrics = pgTable('nutrition_metrics', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const nutritionGoals = pgTable('nutrition_goals', {
  id: serial('id').primaryKey(),
  metricId: integer('metric_id').references(() => nutritionMetrics.id),
  operator: varchar('operator', { length: 2 }).notNull(), // '>' or '<'
  targetValue: decimal('target_value', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dailyNutrition = pgTable('daily_nutrition', {
  id: serial('id').primaryKey(),
  metricId: integer('metric_id').references(() => nutritionMetrics.id),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type NutritionMetric = typeof nutritionMetrics.$inferSelect;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type DailyNutrition = typeof dailyNutrition.$inferSelect;
export type InsertNutritionMetric = typeof nutritionMetrics.$inferInsert;
export type InsertNutritionGoal = typeof nutritionGoals.$inferInsert;
export type InsertDailyNutrition = typeof dailyNutrition.$inferInsert;