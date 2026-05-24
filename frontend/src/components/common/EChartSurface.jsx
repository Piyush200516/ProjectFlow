import React from 'react';
import ReactECharts from 'echarts-for-react';
import '../../lib/echarts';

const EChartSurface = ({ option, style, className }) => (
  <ReactECharts
    option={option}
    notMerge
    lazyUpdate
    className={className}
    style={style}
  />
);

export default EChartSurface;
