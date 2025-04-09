import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Define a type for nap history entries
interface NapEntry {
  startTime: string; // ISO string
  endTime: string; // ISO string
  ageInMonths: number; // Baby's age at the time of the nap
}

export default function SleepTracker() {
  const [kidSleepActive, setKidSleepActive] = useState<boolean>(false);
  const [parentSleepActive, setParentSleepActive] = useState<boolean>(false);
  const [kidStartTime, setKidStartTime] = useState<Date | null>(null);
  const [parentStartTime, setParentStartTime] = useState<Date | null>(null);
  const [kidSleepTotal, setKidSleepTotal] = useState<number>(0);
  const [parentSleepTotal, setParentSleepTotal] = useState<number>(0);
  const [cryCount, setCryCount] = useState<number>(0);
  const [kidGoal, setKidGoal] = useState<number>(10);
  const [parentGoal, setParentGoal] = useState<number>(6);
  const [showKidPicker, setShowKidPicker] = useState<boolean>(false);
  const [manualKidStart, setManualKidStart] = useState<Date>(new Date());
  const [manualKidEnd, setManualKidEnd] = useState<Date>(new Date());
  const [isStartPicker, setIsStartPicker] = useState<boolean>(true);
  const [napHistory, setNapHistory] = useState<NapEntry[]>([]);
  const [babyAge, setBabyAge] = useState<number>(6); // Default to 6 months, adjust in settings

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

  const loadData = async () => {
    try {
      const savedKidTotal = await AsyncStorage.getItem('kidSleepTotal');
      const savedParentTotal = await AsyncStorage.getItem('parentSleepTotal');
      const savedCryCount = await AsyncStorage.getItem('cryCount');
      if (savedKidTotal) setKidSleepTotal(parseFloat(savedKidTotal));
      if (savedParentTotal) setParentSleepTotal(parseFloat(savedParentTotal));
      if (savedCryCount) setCryCount(parseInt(savedCryCount));
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
      await AsyncStorage.setItem('cryCount', cryCount.toString());
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
      // Add to nap history
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

  const addCry = () => {
    setCryCount(cryCount + 1);
    saveData();
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowKidPicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (isStartPicker) {
        setManualKidStart(selectedDate);
      } else {
        setManualKidEnd(selectedDate);
        const hoursSlept = (selectedDate.getTime() - manualKidStart.getTime()) / (1000 * 60 * 60);
        if (hoursSlept > 0) {
          setKidSleepTotal(kidSleepTotal + hoursSlept);
          // Add manual entry to nap history
          setNapHistory((prev) => [
            ...prev,
            {
              startTime: manualKidStart.toISOString(),
              endTime: selectedDate.toISOString(),
              ageInMonths: babyAge,
            },
          ]);
          saveData();
        }
      }
    }
  };

  const showPicker = (isStart: boolean) => {
    setIsStartPicker(isStart);
    setShowKidPicker(true);
  };

  const kidScore = Math.min((kidSleepTotal / kidGoal) * 100, 100).toFixed(0);
  const parentScore = Math.min((parentSleepTotal / parentGoal) * 100, 100).toFixed(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleep Tracker</Text>
      <View style={styles.buttonContainer}>
        <Button
          title={kidSleepActive ? "Kid's Awake" : "Kid's Asleep"}
          onPress={toggleKidSleep}
          color={kidSleepActive ? '#ff4444' : '#203454'}
        />
        <Button
          title="Set Kid's Sleep Times"
          onPress={() => showPicker(true)}
          color="#8888ff"
        />
        {showKidPicker && (
          <DateTimePicker
            value={isStartPicker ? manualKidStart : manualKidEnd}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
        <Button
          title={parentSleepActive ? "I'm Up" : "I'm in Bed"}
          onPress={toggleParentSleep}
          color={parentSleepActive ? '#ff4444' : '#203454'}
        />
        {/* <Button title="+ Cry" onPress={addCry} color="#ffaa00" /> */}
      </View>
      <Text style={styles.summary}>
        Kid: {kidSleepTotal.toFixed(1)}/{kidGoal} hrs ({kidScore}%)
      </Text>
      <Text style={styles.summary}>
        You: {parentSleepTotal.toFixed(1)}/{parentGoal} hrs ({parentScore}%)
      </Text>
      <Text style={styles.summary}>Wake-ups: {cryCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  buttonContainer: { flexDirection: 'column', gap: 10, marginBottom: 20 },
  summary: { fontSize: 18, marginTop: 10 },
});