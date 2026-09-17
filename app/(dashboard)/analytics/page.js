'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (e) {
        console.error('Failed to fetch tasks for analytics', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, []);

  // Process data for Consistency Chart (Line Chart)
  // Number of tasks done on each day
  const getConsistencyData = () => {
    const dailyCounts = {};
    
    tasks.forEach(task => {
      // For one-off tasks
      if (!task.isRegular && task.completed && task.completedAt) {
        // Get date string (YYYY-MM-DD)
        const dateStr = new Date(task.completedAt).toISOString().split('T')[0];
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      }
      
      // For regular tasks (habits), use the history array
      if (task.isRegular && task.history && task.history.length > 0) {
        task.history.forEach(dateStr => {
          dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        });
      }
    });

    // Sort dates
    const sortedDates = Object.keys(dailyCounts).sort();
    
    // Fill in missing days between min and max date for a better line graph
    if (sortedDates.length === 0) return [];
    
    const minDate = new Date(sortedDates[0]);
    const maxDate = new Date(sortedDates[sortedDates.length - 1]);
    
    const data = [];
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      data.push({
        date: dateStr,
        // Format to something nicer like "Jul 17"
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: dailyCounts[dateStr] || 0
      });
    }
    return data;
  };

  // Process data for Points Chart (Spider / Radar Chart)
  // Health, Wealth, Knowledge points based on followed daily habits
  const getPointsData = () => {
    const points = { Health: 0, Wealth: 0, Knowledge: 0 };
    
    tasks.forEach(task => {
      if (task.isRegular && task.history && task.history.length > 0) {
        if (points[task.category] !== undefined) {
          points[task.category] += task.history.length; // 1 point per completed daily habit day
        }
      }
    });

    // Find the max value to set a reasonable domain for the radar chart
    const maxPoints = Math.max(...Object.values(points), 5); // Minimum scale of 5

    return {
      data: [
        { subject: 'Health', A: points.Health, fullMark: maxPoints },
        { subject: 'Wealth', A: points.Wealth, fullMark: maxPoints },
        { subject: 'Knowledge', A: points.Knowledge, fullMark: maxPoints },
      ],
      maxPoints
    };
  };

  const consistencyData = getConsistencyData();
  const pointsInfo = getPointsData();

  return (
    <>
      <Header title="Analytics" subtitle="Performance Overview" showDate={false} />
      
      <main className="px-4 py-6 flex flex-col gap-6 max-w-7xl mx-auto w-full flex-1">
        <div className="flex justify-between items-center">
          <h2 className="font-headline-md text-[24px] font-bold text-on-surface">Your Progress</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
            
            <section className="glass-panel p-6 rounded-xl border border-on-surface/10 shadow-lg flex flex-col min-h-[400px]">
              <div className="mb-6">
                <h3 className="font-title-sm text-[18px] font-semibold flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">monitoring</span> Consistency
                </h3>
                <p className="text-sm text-on-surface-variant">Number of tasks completed per day</p>
              </div>
              
              <div className="flex-1 w-full min-h-[300px]">
                {consistencyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={consistencyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
                      <XAxis 
                        dataKey="displayDate" 
                        stroke="var(--color-outline)" 
                        tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="var(--color-outline)" 
                        tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--color-surface-container-highest)', border: '1px solid var(--color-outline-variant)', borderRadius: '8px' }}
                        itemStyle={{ color: '#8AB4F8' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#8AB4F8" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#8AB4F8', strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: 'rgba(138, 180, 248, 0.3)', strokeWidth: 4 }}
                        name="Tasks Done"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-on-surface-variant italic opacity-70">No completion data available yet.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Points Chart Section */}
            <section className="glass-panel p-6 rounded-xl border border-on-surface/10 shadow-lg flex flex-col min-h-[400px]">
              <div className="mb-6">
                <h3 className="font-title-sm text-[18px] font-semibold flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">radar</span> Habit Points
                </h3>
                <p className="text-sm text-on-surface-variant">Points gained from followed daily habits</p>
              </div>
              
              <div className="flex-1 w-full min-h-[300px] flex justify-center items-center relative">
                {pointsInfo.data.some(d => d.A > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pointsInfo.data}>
                      <PolarGrid stroke="var(--color-outline-variant)" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: 'var(--color-on-surface)', fontSize: 14, fontWeight: 'bold' }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, pointsInfo.maxPoints]} 
                        tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }}
                        tickCount={5}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--color-surface-container-highest)', border: '1px solid var(--color-outline-variant)', borderRadius: '8px' }}
                      />
                      <Radar 
                        name="Points" 
                        dataKey="A" 
                        stroke="#8AB4F8" 
                        fill="#8AB4F8" 
                        fillOpacity={0.5} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-on-surface-variant italic opacity-70">Complete some daily habits to earn points.</p>
                  </div>
                )}
              </div>
            </section>

          </div>
        )}
      </main>
    </>
  );
}
