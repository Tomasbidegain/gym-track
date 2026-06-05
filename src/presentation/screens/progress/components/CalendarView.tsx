import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import type { WorkoutSession } from '../../../../domain/entities/WorkoutSession';

interface CalendarViewProps {
  sessions: WorkoutSession[];
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export function CalendarView({ sessions }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const completedSessions = useMemo(() => {
    return sessions.filter((s) => s.isCompleted);
  }, [sessions]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    completedSessions.forEach((session) => {
      const date = session.completedAt || session.startedAt;
      const dateStr = date.toISOString().split('T')[0];
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(session);
    });
    return map;
  }, [completedSessions]);

  const monthYear = currentMonth.toLocaleString('es', {
    month: 'long',
    year: 'numeric',
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const today = new Date().toISOString().split('T')[0];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = sessionsByDate.get(dateStr) || [];
      
      days.push({
        type: 'day',
        day,
        dateStr,
        sessions: daySessions,
        isToday: dateStr === today,
      });
    }
    
    return days;
  }, [currentMonth, sessionsByDate, today]);

  const screenWidth = Dimensions.get('window').width;
  const cellSize = Math.floor((screenWidth - 32 - 6 * 4) / 7); // 32 padding, 4 gap

  return (
    <View style={styles.container}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>{monthYear}</Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((item, index) => {
          if (item.type === 'empty') {
            return (
              <View key={item.key} style={[styles.dayCell, { width: cellSize }]} />
            );
          }

          const { day, dateStr, sessions: daySessions = [], isToday } = item;
          const hasWorkout = daySessions.length > 0;
          const totalVolume = daySessions.reduce((sum, s) => sum + s.totalVolume, 0);
          
          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.dayCell,
                { width: cellSize, height: cellSize },
                isToday && styles.todayCell,
                hasWorkout && styles.workoutCell,
              ]}
              activeOpacity={hasWorkout ? 0.7 : 1}
              disabled={!hasWorkout}
            >
              <Text
                style={[
                  styles.dayNumber,
                  isToday && styles.todayText,
                  hasWorkout && styles.workoutText,
                ]}
              >
                {day}
              </Text>
              {hasWorkout && (
                <View style={styles.workoutIndicator}>
                  <Text style={styles.workoutVolume}>
                    {totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2f95dc',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    width: 36,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 4,
  },
  dayCell: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#2f95dc',
    backgroundColor: '#e3f2fd',
  },
  workoutCell: {
    backgroundColor: '#4caf50',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  todayText: {
    color: '#2f95dc',
    fontWeight: '700',
  },
  workoutText: {
    color: '#fff',
  },
  workoutIndicator: {
    marginTop: 2,
  },
  workoutVolume: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
});
