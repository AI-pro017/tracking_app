'use client';

import { useState, useEffect } from 'react';

import { TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { calculateAverage } from '@/lib/utils';

interface NutritionMetric {
  id: number;
  name: string;
  unit: string;
}

interface NutritionGoal {
  id: number;
  metricId: number;
  operator: '>' | '<';
  targetValue: string;
  metricName: string;
  metricUnit: string;
}

interface DailyNutrition {
  id: number;
  metricId: number;
  value: string;
  date: string;
  metricName: string;
  metricUnit: string;
}

interface DashboardStats {
  daysWithinTarget: number;
  missedTargetDays: number;
  dailyAverage: number;
  dailyDeficit: number;
  totalDays: number;
  targetValue: number;
  operator: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [goals, setGoals] = useState<NutritionGoal[]>([]);
  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);
  const [dailyData, setDailyData] = useState<DailyNutrition[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedMetricId) {
      fetchDailyData();
    }
  }, [selectedMetricId, dateRange]);

  const fetchInitialData = async () => {
    try {
      const [metricsResponse, goalsResponse] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/goals')
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
        if (metricsData.length > 0 && !selectedMetricId) {
          setSelectedMetricId(metricsData[0].id);
        }
      }

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyData = async () => {
    if (!selectedMetricId) return;

    try {
      const response = await fetch(`/api/daily-nutrition?metricId=${selectedMetricId}`);
      if (response.ok) {
        const data = await response.json();
        setDailyData(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily data:', error);
    }
  };

  const calculateStats = (data: DailyNutrition[]) => {
    if (!selectedMetricId || data.length === 0) {
      setStats(null);
      return;
    }

    const goal = goals.find(g => g.metricId === selectedMetricId);
    if (!goal) {
      setStats(null);
      return;
    }

    const recentData = data
      .filter(d => {
        const daysDiff = Math.floor((new Date().getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= dateRange;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const values = recentData.map(d => parseFloat(d.value));
    const targetValue = parseFloat(goal.targetValue);
    
    const daysWithinTarget = recentData.filter(d => {
      const value = parseFloat(d.value);
      return goal.operator === '>' ? value >= targetValue : value <= targetValue;
    }).length;

    const missedTargetDays = recentData.length - daysWithinTarget;
    const dailyAverage = calculateAverage(values);
    const dailyDeficit = goal.operator === '>' 
      ? Math.max(0, targetValue - dailyAverage)
      : Math.max(0, dailyAverage - targetValue);

    setStats({
      daysWithinTarget,
      missedTargetDays,
      dailyAverage,
      dailyDeficit,
      totalDays: recentData.length,
      targetValue,
      operator: goal.operator
    });
  };

  const getChartData = () => {
    if (!dailyData.length) return [];
    
    const filteredData = dailyData.filter(d => {
      const daysDiff = Math.floor((new Date().getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= dateRange;
    });
    
    const sortedData = filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const chartData = sortedData.map((d, index) => {
      // Handle both string and number values from database
      let numericValue: number;
      if (typeof d.value === 'string') {
        numericValue = parseFloat(d.value);
      } else {
        numericValue = Number(d.value);
      }
      
      const cleanValue = isNaN(numericValue) ? 0 : numericValue;
      
      return {
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: cleanValue,
        target: stats?.targetValue || 0
      };
    });
    return chartData;
  };

  const getPieChartData = () => {
    if (!stats || stats.totalDays === 0) return [];
    
    const data = [];
    if (stats.daysWithinTarget > 0) {
      data.push({ name: 'Within Target', value: stats.daysWithinTarget, color: '#10b981' });
    }
    if (stats.missedTargetDays > 0) {
      data.push({ name: 'Missed Target', value: stats.missedTargetDays, color: '#ef4444' });
    }
    
    return data;
  };

  const selectedMetric = metrics.find(m => m.id === selectedMetricId);
  const selectedGoal = goals.find(g => g.metricId === selectedMetricId);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nutrition Tracking Dashboard</h1>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>

        {metrics.length === 0 && !loading && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              No nutrition metrics found. Please add some metrics and goals first to view the dashboard.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading dashboard...</span>
            </div>
          </div>
        )}

        {metrics.length > 0 && !loading && (
          <>
            <div className="mb-6">
              <label htmlFor="metric-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Nutrition Metric:
              </label>
              <select
                id="metric-select"
                value={selectedMetricId || ''}
                onChange={(e) => setSelectedMetricId(parseInt(e.target.value))}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 w-full max-w-md"
              >
                {metrics.map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.name} ({metric.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedMetric && (
              <>
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                      <div className="flex items-center">
                        <Target className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Days Within Target</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.daysWithinTarget}/{stats.totalDays}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                      <div className="flex items-center">
                        <TrendingDown className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Missed Target Days</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.missedTargetDays}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Average</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.dailyAverage.toFixed(2)} {selectedMetric.unit}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Deficit/Excess</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.dailyDeficit.toFixed(2)} {selectedMetric.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedGoal && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Goal:</strong> {selectedMetric.name} should be{' '}
                      {selectedGoal.operator === '>' ? 'greater than' : 'less than'}{' '}
                      {selectedGoal.targetValue} {selectedMetric.unit}
                    </p>
        </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {selectedMetric.name} Trend (Last {dateRange} days)
                    </h3>
                                        {getChartData().length > 0 ? (
                      <div className="relative">
                                                
                        <div className="w-full h-[300px] bg-gray-800 rounded-lg p-4">
                          {(() => {
                            const data = getChartData();
                            if (data.length === 0) return <div className="flex items-center justify-center h-full text-gray-400">No data available</div>;
                            
                            const maxValue = Math.max(...data.map(d => d.value), stats?.targetValue || 0);
                            const minValue = 0;
                            const chartWidth = 600;
                            const chartHeight = 240;
                            const margin = { top: 40, right: 50, left: 80, bottom: 60 };
                            
                            const plotWidth = chartWidth - margin.left - margin.right;
                            const plotHeight = chartHeight - margin.top - margin.bottom;
                            const xStep = plotWidth / (data.length - 1);
                            const yScale = plotHeight / (maxValue - minValue);
                            
                            // Generate path for the line
                            const linePath = data.map((d, i) => {
                              const x = margin.left + (i * xStep);
                              const y = margin.top + plotHeight - ((d.value - minValue) * yScale);
                              return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                            }).join(' ');
                            
                            // Generate target line if exists
                            const targetValue = stats?.targetValue || 0;
                            const targetY = margin.top + plotHeight - ((targetValue - minValue) * yScale);
                            
                            // Y-axis ticks
                            const yTicks = [];
                            const tickStep = Math.ceil(maxValue / 6 / 500) * 500;
                            for (let i = 0; i <= Math.ceil(maxValue / tickStep); i++) {
                              yTicks.push(i * tickStep);
                            }
                            
                            return (
                              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                                {/* Chart border */}
                                <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} fill="none" stroke="#4b5563" strokeWidth="1" />
                                
                                {/* Grid lines and Y-axis labels */}
                                {yTicks.map(tick => {
                                  const y = margin.top + plotHeight - ((tick - minValue) * yScale);
                                  return (
                                    <g key={tick}>
                                      <line x1={margin.left} y1={y} x2={margin.left + plotWidth} y2={y} stroke="#374151" strokeDasharray="2 2" opacity={0.4} />
                                      <text x={margin.left - 15} y={y + 4} fill="#9ca3af" fontSize="12" textAnchor="end" fontFamily="monospace">
                                        {tick.toLocaleString()}
                                      </text>
                                    </g>
                                  );
                                })}
                                
                                {/* X-axis grid and labels */}
                                {data.map((d, i) => {
                                  const x = margin.left + (i * xStep);
                                  return (
                                    <g key={i}>
                                      <line x1={x} y1={margin.top} x2={x} y2={margin.top + plotHeight} stroke="#374151" strokeDasharray="2 2" opacity={0.2} />
                                      <text x={x} y={margin.top + plotHeight + 20} fill="#9ca3af" fontSize="12" textAnchor="middle" fontFamily="sans-serif">
                                        {d.date}
                                      </text>
                                    </g>
                                  );
                                })}
                                
                                {/* Target line */}
                                {targetValue > 0 && targetY >= margin.top && targetY <= margin.top + plotHeight && (
                                  <line x1={margin.left} y1={targetY} x2={margin.left + plotWidth} y2={targetY} stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 4" />
                                )}
                                
                                {/* Data line */}
                                <path d={linePath} stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                
                                {/* Data points and value labels */}
                                {data.map((d, i) => {
                                  const x = margin.left + (i * xStep);
                                  const y = margin.top + plotHeight - ((d.value - minValue) * yScale);
                                  return (
                                    <g key={i}>
                                      <circle cx={x} cy={y} r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="3" />
                                      <circle cx={x} cy={y} r="10" fill="none" stroke="#3b82f6" strokeWidth="1" opacity={0.3} />
                                      <text x={x} y={y - 15} fill="#e5e7eb" fontSize="13" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                                        {d.value.toLocaleString()}
                                      </text>
                                    </g>
                                  );
                                })}
                                
                                {/* Y-axis label */}
                                <text x={20} y={margin.top + plotHeight / 2} fill="#9ca3af" fontSize="13" textAnchor="middle" transform={`rotate(-90 20 ${margin.top + plotHeight / 2})`} fontWeight="500">
                                  {selectedMetric.name} ({selectedMetric.unit})
                                </text>
                                
                                {/* X-axis label */}
                                <text x={margin.left + plotWidth / 2} y={chartHeight - 15} fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">
                                  Date
                                </text>
                                
                                {/* Chart title */}
                                <text x={margin.left + plotWidth / 2} y={20} fill="#f3f4f6" fontSize="15" textAnchor="middle" fontWeight="600">
                                  {selectedMetric.name} Trend Over Time
                                </text>
                              </svg>
                            );
                          })()}
                        </div>
                        <div className="mt-4 flex justify-center items-center space-x-6 text-xs">
                          <div className="flex items-center">
                            <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
                            <span className="text-gray-600 dark:text-gray-400">Actual {selectedMetric.name}</span>
                          </div>
                          {stats && stats.targetValue > 0 && (
                            <div className="flex items-center">
                              <div className="w-4 h-0.5 border-t-2 border-dashed border-orange-500 mr-2"></div>
                              <span className="text-gray-600 dark:text-gray-400">Target ({stats.targetValue} {selectedMetric.unit})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <div className="text-lg mb-2">No data available</div>
                          <div className="text-sm">Add some daily nutrition data to see the trend</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Goal Achievement (Last {dateRange} days)
                    </h3>
                    {stats && stats.totalDays > 0 ? (
                      <div className="h-[240px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="grid grid-cols-2 gap-8 mb-6">
                            <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-lg">
                              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                                {stats.daysWithinTarget}
                              </div>
                              <div className="text-base text-green-700 dark:text-green-300 mt-2">
                                Days Within Target
                              </div>
                              <div className="text-sm text-green-600 dark:text-green-400 mt-2 font-semibold">
                                {((stats.daysWithinTarget / stats.totalDays) * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg">
                              <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                                {stats.missedTargetDays}
                              </div>
                              <div className="text-base text-red-700 dark:text-red-300 mt-2">
                                Missed Target Days
                              </div>
                              <div className="text-sm text-red-600 dark:text-red-400 mt-2 font-semibold">
                                {((stats.missedTargetDays / stats.totalDays) * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          <div className="text-base text-gray-600 dark:text-gray-400 font-medium">
                            Total tracked days: {stats.totalDays}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <div className="text-lg mb-2">No data available</div>
                          <div className="text-sm">
                            {(!stats || stats.totalDays === 0)
                              ? 'No nutrition data found for the selected period'
                              : 'Add some daily nutrition data to see goal achievement'
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {dailyData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Recent {selectedMetric.name} Values
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Value ({selectedMetric.unit})
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {dailyData
                            .filter(d => {
                              const daysDiff = Math.floor((new Date().getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24));
                              return daysDiff <= dateRange;
                            })
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 10)
                            .map((entry) => {
                              const value = parseFloat(entry.value);
                              const isWithinTarget = selectedGoal ? 
                                (selectedGoal.operator === '>' ? value >= parseFloat(selectedGoal.targetValue) : value <= parseFloat(selectedGoal.targetValue))
                                : null;
                              
                              return (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {new Date(entry.date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                    {entry.value}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {isWithinTarget !== null && (
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        isWithinTarget 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                      }`}>
                                        {isWithinTarget ? 'Within Target' : 'Missed Target'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}