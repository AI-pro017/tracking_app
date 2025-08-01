import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const defaultNutritionMetrics = [
  { name: 'Carbs', unit: 'g' },
  { name: 'Fibre', unit: 'g' },
  { name: 'Protein', unit: 'g' },
  { name: 'Fat', unit: 'g' },
  { name: 'Calories', unit: 'kcal' },
  { name: 'Vitamin B1', unit: 'mg' },
  { name: 'Calcium (Ca)', unit: 'mg' },
  { name: 'Chromium (Cr)', unit: 'μg' },
  { name: 'Chloride (Cl)', unit: 'mg' },
  { name: 'Copper (Cu)', unit: 'mg' },
  { name: 'Fluoride (F)', unit: 'mg' },
  { name: 'Iodine (I)', unit: 'μg' },
  { name: 'Iron (Fe)', unit: 'mg' },
  { name: 'Magnesium (Mg)', unit: 'mg' },
  { name: 'Manganese (Mn)', unit: 'mg' },
  { name: 'Molybdenum (Mo)', unit: 'μg' },
  { name: 'Phosphorus (P)', unit: 'mg' },
  { name: 'Potassium (K)', unit: 'mg' },
  { name: 'Selenium (Se)', unit: 'μg' },
  { name: 'Sodium (Na)', unit: 'mg' },
  { name: 'Sulphur (S)', unit: 'mg' },
  { name: 'Zinc (Zn)', unit: 'mg' },
  { name: 'Vitamin A retinol equivalents', unit: 'μg' },
  { name: 'Thiamin (B1)', unit: 'mg' },
  { name: 'Riboflavin (B2)', unit: 'mg' },
  { name: 'Niacin (B3)', unit: 'mg' },
  { name: 'Pantothenic acid (B5)', unit: 'mg' },
  { name: 'Pyridoxine (B6)', unit: 'mg' },
  { name: 'Biotin (B7)', unit: 'μg' },
  { name: 'Cobalamin (B12)', unit: 'μg' },
  { name: 'Folate, natural', unit: 'μg' },
  { name: 'Dietary folate equivalents', unit: 'μg' },
  { name: 'Vitamin C', unit: 'mg' },
  { name: 'Vitamin D3 equivalents', unit: 'μg' },
  { name: 'Vitamin E', unit: 'mg' },
];

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function calculateDaysWithinTarget(dailyValues: any[], goal: any): number {
  return dailyValues.filter(day => {
    const value = parseFloat(day.value);
    const target = parseFloat(goal.targetValue);
    return goal.operator === '>' ? value >= target : value <= target;
  }).length;
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}