import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { napPredictor } from '@/app/utils/napPredictor';
import { Svg, Path, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import ActionModal from './ActionModal';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;
const CENTER = CIRCLE_SIZE / 2;
const STROKE_WIDTH = 20;
const PADDING = STROKE_WIDTH / 2;

export interface NapEntry {
  startTime: string;
  endTime: string;
  ageInMonths: number;
}

interface SleepWindow {
  bedtime: string;
  wakeTime: string;
}

export default function SleepTracker() {
  const [kidSleepActive, setKidSleepActive] = useState<boolean>(false);
  const [parentSleepActive, setParentSleepActive] = useState<boolean>(false);
  const [kidStartTime, setKidStartTime] = useState<Date | null>(null);
  const [parentStartTime, setParentStartTime] = useState<Date | null>(null);
  const [kidSleepTotal, setKidSleepTotal] = useState<number>(0);
  const [parentSleepTotal, setParentSleepTotal] = useState<number>(0);
  const [kidGoal, setKidGoal] = useState<number>(10);
  const [parentGoal, setParentGoal] = useState<number>(6);
  const [napHistory, setNapHistory] = useState<NapEntry[]>([]);
  const [babyAge, setBabyAge] = useState<number>(6);
  const [nextNapTime, setNextNapTime] = useState<string | null>(null);
  const [nighttimeSleep, setNighttimeSleep] = useState<SleepWindow | null>(null);
  const [isInNighttimeSleep, setIsInNighttimeSleep] = useState<boolean>(false);
  const [isNursing, setIsNursing] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'sleep' | 'nursing'>('sleep');

  // Adjust the arc path to use the full circle size
  const arcPath = `
    M ${STROKE_WIDTH/2}, ${CENTER}
    A ${(CIRCLE_SIZE/2 - STROKE_WIDTH/2)} ${(CIRCLE_SIZE/2 - STROKE_WIDTH/2)} 0 0 1 ${CIRCLE_SIZE - STROKE_WIDTH/2} ${CENTER}
  `;

  const isNighttime = new Date().getHours() >= 19 || new Date().getHours() < 7;

  useEffect(() => {
    const loadGoals = async () => {
      const savedKidGoal = await AsyncStorage.getItem('kidGoal');
      const savedParentGoal = await AsyncStorage.getItem('parentGoal');
      const savedBabyAge = await AsyncStorage.getItem('babyAge');
      if (savedKidGoal) setKidGoal(parseFloat(savedKidGoal));
      if (savedParentGoal) setParentGoal(parseFloat(savedParentGoal));
      if (savedBabyAge) setBabyAge(parseFloat(savedBabyAge));
    };
    loadGoals();
    loadData();
    loadNapHistory();
  }, []);

  useEffect(() => {
    // Predict nighttime sleep
    const sleepWindow = napPredictor.predictNighttimeSleep(babyAge);
    setNighttimeSleep(sleepWindow);

    // Parse bedtime and wakeTime into Date objects
    const now = new Date();
    const bedtime = new Date(now);
    const wakeTime = new Date(now);

    // Parse the time strings (e.g., "06:00 PM")
    const [bedtimeHours, bedtimeMinutes] = sleepWindow.bedtime
      .match(/(\d+):(\d+)/)!
      .slice(1)
      .map(Number);
    const bedtimePeriod = sleepWindow.bedtime.includes('PM') ? 'PM' : 'AM';
    const wakeTimeMatch = sleepWindow.wakeTime.match(/(\d+):(\d+)/)!;
    const [wakeTimeHours, wakeTimeMinutes] = wakeTimeMatch.slice(1).map(Number);
    const wakeTimePeriod = sleepWindow.wakeTime.includes('PM') ? 'PM' : 'AM';

    // Convert 12-hour format to 24-hour for bedtime
    let bedtimeHour24 = bedtimeHours;
    if (bedtimePeriod === 'PM' && bedtimeHours !== 12) bedtimeHour24 += 12;
    if (bedtimePeriod === 'AM' && bedtimeHours === 12) bedtimeHour24 = 0;
    bedtime.setHours(bedtimeHour24, bedtimeMinutes, 0, 0);

    // Convert 12-hour format to 24-hour for wakeTime
    let wakeTimeHour24 = wakeTimeHours;
    if (wakeTimePeriod === 'PM' && wakeTimeHours !== 12) wakeTimeHour24 += 12;
    if (wakeTimePeriod === 'AM' && wakeTimeHours === 12) wakeTimeHour24 = 0;
    wakeTime.setHours(wakeTimeHour24, wakeTimeMinutes, 0, 0);

    // Adjust dates: if wakeTime is before bedtime, it means wakeTime is the next day
    if (wakeTime <= bedtime) {
      wakeTime.setDate(wakeTime.getDate() + 1);
    }

    // If bedtime is in the past, move it to today or tomorrow
    if (bedtime < now) {
      bedtime.setDate(bedtime.getDate() + 1);
      wakeTime.setDate(wakeTime.getDate() + 1);
    }

    // Check if current time is within nighttime sleep window
    const isNighttime = now >= bedtime && now <= wakeTime;
    setIsInNighttimeSleep(isNighttime);

    // Predict next nap time
    let predictedWakeWindow: number;
    let nextNap: Date;

    if (napHistory.length > 0) {
      const data = napPredictor.prepareData(napHistory, babyAge);
      napPredictor.fit(data);

      const lastNap = napHistory[napHistory.length - 1];
      const lastEnd = new Date(lastNap.endTime);
      const lastStart = new Date(lastNap.startTime);
      const lastNapDuration = (lastEnd.getTime() - lastStart.getTime()) / (1000 * 60 * 60);

      let lastWakeWindow = lastNapDuration;
      if (napHistory.length > 1) {
        const prevNap = napHistory[napHistory.length - 2];
        const prevEnd = new Date(prevNap.endTime);
        lastWakeWindow = (lastStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);
      }

      predictedWakeWindow = napPredictor.predict(babyAge, lastWakeWindow, lastNapDuration);
      nextNap = new Date(lastEnd.getTime() + predictedWakeWindow * 60 * 60 * 1000);
    } else if (kidSleepActive && kidStartTime) {
      predictedWakeWindow = napPredictor.predict(babyAge, 0, 0, true);
      const currentTime = new Date();
      nextNap = new Date(currentTime.getTime() + predictedWakeWindow * 60 * 60 * 1000);
    } else {
      predictedWakeWindow = napPredictor.predict(babyAge, 0, 0, true);
      // If we're in nighttime sleep, start nap prediction from wakeTime
      const startTime = isNighttime ? wakeTime : now;
      nextNap = new Date(startTime.getTime() + predictedWakeWindow * 60 * 60 * 1000);
    }

    const formattedTime = nextNap.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNextNapTime(formattedTime);
  }, [napHistory, babyAge, kidSleepActive, kidStartTime]);

  const loadData = async () => {
    try {
      const savedKidTotal = await AsyncStorage.getItem('kidSleepTotal');
      const savedParentTotal = await AsyncStorage.getItem('parentSleepTotal');
      if (savedKidTotal) setKidSleepTotal(parseFloat(savedKidTotal));
      if (savedParentTotal) setParentSleepTotal(parseFloat(savedParentTotal));
    } catch (e) {
      console.log('Error loading data', e);
    }
  };

  const loadNapHistory = async () => {
    try {
      const savedNapHistory = await AsyncStorage.getItem('napHistory');
      if (savedNapHistory) setNapHistory(JSON.parse(savedNapHistory));
    } catch (e) {
      console.log('Error loading nap history', e);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('kidSleepTotal', kidSleepTotal.toString());
      await AsyncStorage.setItem('parentSleepTotal', parentSleepTotal.toString());
      await AsyncStorage.setItem('napHistory', JSON.stringify(napHistory));
    } catch (e) {
      console.log('Error saving data', e);
    }
  };

  const toggleKidSleep = () => {
    if (!kidSleepActive) {
      setKidStartTime(new Date());
    } else {
      const endTime = new Date();
      const hoursSlept = (endTime.getTime() - (kidStartTime?.getTime() ?? 0)) / (1000 * 60 * 60);
      setKidSleepTotal(kidSleepTotal + hoursSlept);
      if (kidStartTime) {
        setNapHistory((prev) => [
          ...prev,
          {
            startTime: kidStartTime.toISOString(),
            endTime: endTime.toISOString(),
            ageInMonths: babyAge,
          },
        ]);
      }
      setKidStartTime(null);
    }
    setKidSleepActive(!kidSleepActive);
    saveData();
  };

  const toggleParentSleep = () => {
    if (!parentSleepActive) {
      setParentStartTime(new Date());
    } else {
      const endTime = new Date();
      const hoursSlept = (endTime.getTime() - (parentStartTime?.getTime() ?? 0)) / (1000 * 60 * 60);
      setParentSleepTotal(parentSleepTotal + hoursSlept);
      setParentStartTime(null);
    }
    setParentSleepActive(!parentSleepActive);
    saveData();
  };

  const kidScore = Math.min((kidSleepTotal / kidGoal) * 100, 100).toFixed(0);
  const parentScore = Math.min((parentSleepTotal / parentGoal) * 100, 100).toFixed(0);

  const getCurrentDuration = () => {
    if (!kidStartTime) return `Total Sleep: ${kidSleepTotal.toFixed(1)} hrs`;
    
    const now = new Date();
    const duration = (now.getTime() - kidStartTime.getTime()) / (1000 * 60 * 60);
    
    if (kidSleepActive) {
      return `Sleeping: ${duration.toFixed(1)} hrs`;
    } else {
      return `Awake: ${duration.toFixed(1)} hrs`;
    }
  };

  const formatDuration = (startTime: Date | null) => {
    if (!startTime) return '00:00';
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleSleepPress = () => {
    setModalType('sleep');
    setIsModalVisible(true);
  };

  const handleNursingPress = () => {
    setModalType('nursing');
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Svg 
          width={CIRCLE_SIZE} 
          height={CIRCLE_SIZE/2 + 20}
        >
          <Path
            d={arcPath}
            stroke="#ccc"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
          />
          
          <G x={0} y={CENTER}>
            <Text style={{
                position: 'absolute',
                left: STROKE_WIDTH/2 - 20,
                top: CENTER + 10,
                fontSize: 14,
                color: '#666'
              }}>
              7:00 AM
            </Text>
          </G>
          <G x={CIRCLE_SIZE} y={CENTER}>
            <Text style={{
                position: 'absolute',
                right: STROKE_WIDTH/2 - 20,
                top: CENTER + 10,
                fontSize: 14,
                color: '#666'
              }}>
                7:00 PM
              </Text>
          </G>
        </Svg>

        <View style={styles.centerContent}>
          <Ionicons 
            name={isNighttime ? "moon" : "sunny"} 
            size={60} 
            color={isNighttime ? "#666" : "#FFB800"}
          />
          <Text style={styles.statText}>
            {getCurrentDuration()}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.circleButton,
                kidSleepActive && styles.sleepButtonActive
              ]}
              onPress={handleSleepPress}
            >
              <Ionicons 
                name={kidSleepActive ? "sunny" : "moon"} 
                size={24} 
                color="#fff"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.circleButton,
                isNursing && styles.nursingButtonActive
              ]}
              onPress={handleNursingPress}
            >
              <Ionicons 
                name="water" 
                size={24} 
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ActionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        type={modalType}
        isActive={modalType === 'sleep' ? kidSleepActive : isNursing}
        onStart={() => {
          if (modalType === 'sleep') {
            toggleKidSleep();
          } else {
            setIsNursing(true);
          }
          setIsModalVisible(false);
        }}
        onStop={() => {
          if (modalType === 'sleep') {
            toggleKidSleep();
          } else {
            setIsNursing(false);
          }
          setIsModalVisible(false);
        }}
        duration={modalType === 'sleep' ? 
          formatDuration(kidStartTime) : 
          formatDuration(kidStartTime)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE/2 + 100,
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: CIRCLE_SIZE/4 - 30,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    position: 'absolute',
  },
  leftTime: {
    transform: [{translateX: 10}],
  },
  rightTime: {
    transform: [{translateX: -60}],
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
  },
  circleButton: {
    backgroundColor: '#3B4252',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sleepButtonActive: {
    backgroundColor: '#BF616A',
  },
  nursingButtonActive: {
    backgroundColor: '#5E81AC',
  },
  statText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});