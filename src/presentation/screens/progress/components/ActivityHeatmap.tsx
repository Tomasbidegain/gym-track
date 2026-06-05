import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { WorkoutSession } from '../../../../domain/entities/WorkoutSession';

interface ActivityHeatmapProps {
  sessions: WorkoutSession[];
  days?: number;
}

export function ActivityHeatmap({ sessions, days = 90 }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const now = new Date();
    
    // Calcular el inicio del período (incluyendo hoy)
    const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    
    // Encontrar el domingo anterior al inicio para que el grid empiece en domingo
    const startDay = startDate.getDay();
    const adjustedStart = new Date(startDate.getTime() - startDay * 24 * 60 * 60 * 1000);
    
    // Generar matriz de días (7 filas por semana)
    const weeks = [];
    let currentWeek = [];
    
    // Loop hasta hoy (inclusive) - days + startDay para cubrir desde adjustedStart hasta hoy
    const totalIterations = days + startDay;
    
    for (let i = 0; i < totalIterations; i++) {
      const date = new Date(adjustedStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Buscar sesiones de ese día
      const daySessions = sessions.filter((s) => {
        if (!s.isCompleted) return false;
        const sDate = s.completedAt || s.startedAt;
        const sDateStr = sDate.toISOString().split('T')[0];
        return sDateStr === dateStr;
      });
      
      const totalVolume = daySessions.reduce((sum, s) => sum + s.totalVolume, 0);
      
      // Solo incluir días dentro del período solicitado
      if (date >= startDate) {
        currentWeek.push({
          date,
          volume: totalVolume,
          hasActivity: daySessions.length > 0,
          sessionsCount: daySessions.length,
        });
        
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }
    }
    
    // Agregar semana incompleta si existe
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [sessions, days]);
  
  // Calcular volumen máximo para la escala de colores
  const maxVolume = useMemo(() => {
    let max = 0;
    heatmapData.forEach((week) => {
      week.forEach((day) => {
        if (day.volume > max) max = day.volume;
      });
    });
    return max;
  }, [heatmapData]);
  
  const getIntensityColor = (volume: number) => {
    if (volume === 0) return '#ebedf0';
    const intensity = maxVolume > 0 ? volume / maxVolume : 0;
    
    if (intensity <= 0.25) return '#9be9a8';
    if (intensity <= 0.5) return '#40c463';
    if (intensity <= 0.75) return '#30a14e';
    return '#216e39';
  };
  
  const getMonthLabels = () => {
    const labels: Array<{ label: string; index: number }> = [];
    heatmapData.forEach((week, weekIndex) => {
      if (week.length > 0 && week[0].date.getDate() <= 7) {
        const month = week[0].date.toLocaleString('es', { month: 'short' });
        labels.push({ label: month, index: weekIndex });
      }
    });
    return labels;
  };
  
  const monthLabels = getMonthLabels();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actividad (últimos {days} días)</Text>
      
      {/* Month labels */}
      <View style={styles.monthLabels}>
        {monthLabels.map((m, i) => (
          <Text key={i} style={styles.monthLabel}>
            {m.label}
          </Text>
        ))}
      </View>
      
      {/* Heatmap grid */}
      <View style={styles.heatmapContainer}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          <Text style={styles.dayLabel}>D</Text>
          <Text style={styles.dayLabel}>L</Text>
          <Text style={styles.dayLabel}>M</Text>
          <Text style={styles.dayLabel}>M</Text>
          <Text style={styles.dayLabel}>J</Text>
          <Text style={styles.dayLabel}>V</Text>
          <Text style={styles.dayLabel}>S</Text>
        </View>
        
        {/* Weeks - scrollable horizontally */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weeksScrollContainer}
        >
          <View style={styles.weeksContainer}>
            {heatmapData.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((day, dayIndex) => {
                  const isToday = day.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                  return (
                    <View
                      key={dayIndex}
                      style={[
                        styles.dayCell,
                        { backgroundColor: getIntensityColor(day.volume) },
                        isToday && styles.todayCell,
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Menos</Text>
        <View style={[styles.legendCell, { backgroundColor: '#ebedf0' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#9be9a8' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#40c463' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#30a14e' }]} />
        <View style={[styles.legendCell, { backgroundColor: '#216e39' }]} />
        <Text style={styles.legendLabel}>Más</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  monthLabels: {
    flexDirection: 'row',
    marginLeft: 28,
    marginBottom: 4,
    gap: 2,
  },
  monthLabel: {
    fontSize: 10,
    color: '#888',
    width: 12,
    textAlign: 'center',
  },
  heatmapContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: 4,
    justifyContent: 'space-between',
    height: 98,
  },
  dayLabel: {
    fontSize: 9,
    color: '#888',
    height: 12,
    lineHeight: 12,
  },
  weeksScrollContainer: {
    paddingRight: 8,
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  week: {
    gap: 2,
  },
  dayCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: '#2f95dc',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: '#888',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
