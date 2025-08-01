'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface NutritionMetric {
  id: number;
  name: string;
  unit: string;
}

interface DailyNutritionEntry {
  metricId: number;
  value: string;
}

export default function DailyInputPage() {
  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [entries, setEntries] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (selectedDate && metrics.length > 0) {
      fetchDailyEntries();
    }
  }, [selectedDate, metrics]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyEntries = async () => {
    try {
      const response = await fetch(`/api/daily-nutrition?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        const entriesMap: { [key: number]: string } = {};
        data.forEach((entry: any) => {
          entriesMap[entry.metricId] = entry.value;
        });
        setEntries(entriesMap);
      }
    } catch (error) {
      console.error('Failed to fetch daily entries:', error);
    }
  };

  const handleValueChange = (metricId: number, value: string) => {
    setEntries(prev => ({
      ...prev,
      [metricId]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(entries).map(([metricId, value]) => {
        if (value && value.trim() !== '') {
          return fetch('/api/daily-nutrition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metricId: parseInt(metricId),
              value: parseFloat(value),
              date: selectedDate
            }),
          });
        }
        return null;
      }).filter(Boolean);

      await Promise.all(promises);
      alert('Daily nutrition data saved successfully!');
    } catch (error) {
      console.error('Failed to save daily nutrition:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Save all entries that have values
      const promises = metrics.map(async (metric) => {
        const value = entries[metric.id];
        if (value && value.trim() !== '') {
          return fetch('/api/daily-nutrition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metricId: metric.id,
              value: parseFloat(value),
              date: selectedDate
            }),
          });
        }
        return null;
      }).filter(Boolean);

      await Promise.all(promises);
      alert('All nutrition data saved successfully!');
    } catch (error) {
      console.error('Failed to save nutrition data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Nutrition Input</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
            </div>
            <Button 
              onClick={handleSaveAll} 
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
          </div>
        </div>

        {metrics.length === 0 && !loading && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              No nutrition metrics found. Please add some metrics first before inputting daily data.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading metrics...</span>
            </div>
          </div>
        )}

        {!loading && metrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{metric.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unit: {metric.unit}</p>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`Enter value in ${metric.unit}`}
                    value={entries[metric.id] || ''}
                    onChange={(e) => handleValueChange(metric.id, e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && metrics.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => {
                const value = entries[metric.id];
                return (
                  <div key={metric.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {value ? `${value} ${metric.unit}` : 'Not set'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}