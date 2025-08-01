'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface NutritionMetric {
  id: number;
  name: string;
  unit: string;
}

interface NutritionGoal {
  id?: number;
  metricId: number;
  operator: '>' | '<';
  targetValue: string;
  metricName?: string;
  metricUnit?: string;
}

export default function GoalsPage() {
  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [goals, setGoals] = useState<NutritionGoal[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<NutritionGoal>({ 
    metricId: 0, 
    operator: '>', 
    targetValue: '' 
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<NutritionGoal>({ 
    metricId: 0, 
    operator: '>', 
    targetValue: '' 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsResponse, goalsResponse] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/goals')
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.metricId || !addForm.targetValue) return;

    setSaving(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      if (response.ok) {
        setAddForm({ metricId: 0, operator: '>', targetValue: '' });
        setIsAdding(false);
        fetchData();
        alert('Goal added successfully!');
      } else {
        alert('Failed to add goal. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add goal:', error);
      alert('Failed to add goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (goal: NutritionGoal) => {
    setEditingId(goal.id!);
    setEditForm({ 
      metricId: goal.metricId, 
      operator: goal.operator, 
      targetValue: goal.targetValue 
    });
  };

  const handleSave = async () => {
    if (!editForm.metricId || !editForm.targetValue) return;

    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditForm({ metricId: 0, operator: '>', targetValue: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`/api/goals?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const getMetricName = (metricId: number) => {
    const metric = metrics.find(m => m.id === metricId);
    return metric ? `${metric.name} (${metric.unit})` : 'Unknown Metric';
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nutrition Goals</h1>
          <Button 
            onClick={() => setIsAdding(true)} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isAdding || metrics.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {metrics.length === 0 && !loading && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              No nutrition metrics found. Please add some metrics first before setting goals.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nutrition Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Target Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isAdding && metrics.length > 0 && (
                <tr className="bg-blue-50 dark:bg-blue-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={addForm.metricId}
                      onChange={(e) => setAddForm({ ...addForm, metricId: parseInt(e.target.value) })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value={0}>Select a metric</option>
                      {metrics.map((metric) => (
                        <option key={metric.id} value={metric.id}>
                          {metric.name} ({metric.unit})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={addForm.operator}
                      onChange={(e) => setAddForm({ ...addForm, operator: e.target.value as '>' | '<' })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value=">">Greater than (&gt;)</option>
                      <option value="<">Less than (&lt;)</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Target value"
                      value={addForm.targetValue}
                      onChange={(e) => setAddForm({ ...addForm, targetValue: e.target.value })}
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="space-x-2">
                      <Button 
                        onClick={handleAdd} 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        disabled={saving || !addForm.metricId || !addForm.targetValue}
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsAdding(false);
                          setAddForm({ metricId: 0, operator: '>', targetValue: '' });
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        disabled={saving}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {goals.map((goal) => (
                <tr key={goal.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === goal.id ? (
                      <select
                        value={editForm.metricId}
                        onChange={(e) => setEditForm({ ...editForm, metricId: parseInt(e.target.value) })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {metrics.map((metric) => (
                          <option key={metric.id} value={metric.id}>
                            {metric.name} ({metric.unit})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {goal.metricName} ({goal.metricUnit})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === goal.id ? (
                      <select
                        value={editForm.operator}
                        onChange={(e) => setEditForm({ ...editForm, operator: e.target.value as '>' | '<' })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value=">">Greater than (&gt;)</option>
                        <option value="<">Less than (&lt;)</option>
                      </select>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {goal.operator === '>' ? 'Greater than (>)' : 'Less than (<)'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === goal.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.targetValue}
                        onChange={(e) => setEditForm({ ...editForm, targetValue: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{goal.targetValue}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === goal.id ? (
                      <div className="space-x-2">
                        <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({ metricId: 0, operator: '>', targetValue: '' });
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <Button onClick={() => handleEdit(goal)} variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(goal.id!)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {goals.length === 0 && !isAdding && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-lg">No nutrition goals set</div>
                      <div className="text-sm">Click "Add Goal" to create your first goal</div>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span>Loading goals...</span>
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