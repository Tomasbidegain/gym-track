import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../../context/ThemeContext';

interface SparklineChartProps {
  data: number[];
  width: number;
  height?: number;
  color?: string;
}

export function SparklineChart({
  data,
  width,
  height = 60,
  color: lineColor,
}: SparklineChartProps) {
  const { theme } = useTheme();
  const actualColor = lineColor || theme.colors.primary;

  if (data.length < 2) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={[styles.singlePoint, { backgroundColor: actualColor }]} />
      </View>
    );
  }

  return (
    <LineChart
      data={{
        labels: [],
        datasets: [
          {
            data,
          },
        ],
      }}
      width={width}
      height={height}
      withInnerLines={false}
      withOuterLines={false}
      withVerticalLabels={false}
      withHorizontalLabels={false}
      withDots={false}
      chartConfig={{
        backgroundColor: theme.colors.surface,
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        color: (opacity = 1) => {
          const hex = actualColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        },
        strokeWidth: 2,
        propsForBackgroundLines: {
          strokeWidth: 0,
        },
      }}
      bezier
      style={styles.chart}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  singlePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chart: {
    marginVertical: 0,
    paddingRight: 0,
  },
});
