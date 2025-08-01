'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { defaultNutritionMetrics } from '@/lib/utils';

interface NutritionMetric {
  id?: number;
  name: string;
  unit: string;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<NutritionMetric>({ name: '', unit: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<NutritionMetric>({ name: '', unit: '' });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

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

  const initializeDefaultMetrics = async () => {
    if (metrics.length > 0) {
      alert('Default metrics have already been initialized!');
      return;
    }
    
    setInitializing(true);
    try {
      for (const metric of defaultNutritionMetrics) {
        await fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric),
        });
      }
      await fetchMetrics();
      alert('Default metrics have been successfully initialized!');
    } catch (error) {
      console.error('Failed to initialize metrics:', error);
      alert('Failed to initialize metrics. Please try again.');
    } finally {
      setInitializing(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.unit) return;

    try {
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      if (response.ok) {
        setAddForm({ name: '', unit: '' });
        setIsAdding(false);
        fetchMetrics();
      }
    } catch (error) {
      console.error('Failed to add metric:', error);
    }
  };

  const handleEdit = (metric: NutritionMetric) => {
    setEditingId(metric.id!);
    setEditForm({ name: metric.name, unit: metric.unit });
  };

  const handleSave = async () => {
    if (!editForm.name || !editForm.unit) return;

    try {
      const response = await fetch('/api/metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditForm({ name: '', unit: '' });
        fetchMetrics();
      }
    } catch (error) {
      console.error('Failed to update metric:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this metric?')) return;

    try {
      const response = await fetch(`/api/metrics?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMetrics();
      }
    } catch (error) {
      console.error('Failed to delete metric:', error);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nutrition Metrics</h1>
          <div className="space-x-2">
            {metrics.length === 0 && !loading && (
              <Button 
                onClick={initializeDefaultMetrics} 
                disabled={initializing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400"
              >
                {initializing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Initializing...
                  </>
                ) : (
                  'Initialize Default Metrics'
                )}
              </Button>
            )}
            <Button 
              onClick={() => setIsAdding(true)} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isAdding}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Metric
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isAdding && (
                <tr className="bg-blue-50 dark:bg-blue-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Input
                      type="text"
                      placeholder="Metric name"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Input
                      type="text"
                      placeholder="Unit (e.g., g, mg, kcal)"
                      value={addForm.unit}
                      onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="space-x-2">
                      <Button 
                        onClick={handleAdd} 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!addForm.name || !addForm.unit}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsAdding(false);
                          setAddForm({ name: '', unit: '' });
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {metrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === metric.id ? (
                      <Input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{metric.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === metric.id ? (
                      <Input
                        type="text"
                        value={editForm.unit}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{metric.unit}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === metric.id ? (
                      <div className="space-x-2">
                        <Button 
                          onClick={handleSave} 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          disabled={!editForm.name || !editForm.unit}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({ name: '', unit: '' });
                          }}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <Button 
                          onClick={() => handleEdit(metric)} 
                          variant="outline" 
                          size="sm"
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(metric.id!)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {metrics.length === 0 && !isAdding && !loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-lg">No nutrition metrics found</div>
                      <div className="text-sm">Click "Initialize Default Metrics" to get started with 35 pre-defined nutrition metrics</div>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span>Loading metrics...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}