import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const HOURS = Array.from({ length: 24 }, (_, i) => ((i + 7) % 24));

function getLastWeekDays() {
  const today = new Date();
  const days = [];
  
  // Go back 6 days to show last week's data
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayStr = date.toLocaleDateString('en-US', { 
      weekday: 'short',
      day: 'numeric'
    });
    days.push(dayStr);
  }
  
  return days;
}

const DAYS = getLastWeekDays();

export default function Trends() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleActive}>Daily</Text>
          <Text style={styles.toggle}>Weekly</Text>
        </View>
      </View>
      
      <ScrollView style={styles.timelineContainer}>
        <View style={styles.timeline}>
          {/* Days header */}
          <View style={styles.daysHeader}>
            <View style={styles.timeColumn} />
            {DAYS.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={styles.dayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Time rows */}
          {HOURS.map((hour) => (
            <View key={hour} style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{`${hour}am`}</Text>
              </View>
              {DAYS.map((_, dayIndex) => (
                <View key={dayIndex} style={styles.timeBlock} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  toggle: {
    padding: 8,
    color: '#666',
  },
  toggleActive: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    color: '#000',
  },
  timelineContainer: {
    flex: 1,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 10,
  },
  daysHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    color: '#666',
  },
  timeRow: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
  },
  timeColumn: {
    width: 50,
    paddingRight: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  timeBlock: {
    flex: 1,
    height: 38,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
}); 