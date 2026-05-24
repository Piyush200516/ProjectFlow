import { useMemo } from 'react';
import '../lib/echarts';

export const useHodStatsChartOptions = (stats) => {
  return useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 12, top: 16, bottom: 24 },
    xAxis: {
      type: 'category',
      data: ['Forms', 'Published', 'Submissions', 'Approved', 'Rejected'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    series: [{
      type: 'bar',
      data: [
        stats?.totalForms || 0,
        stats?.publishedForms || 0,
        stats?.totalSubmissions || 0,
        stats?.approvedProjects || 0,
        stats?.rejectedProjects || 0,
      ],
      itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] },
      barMaxWidth: 28,
    }],
  }), [stats]);
};
