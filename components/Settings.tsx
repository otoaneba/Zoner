import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings() {
  const [kidGoal, setKidGoal] = useState<string>('10');
  const [parentGoal, setParentGoal] = useState<string>('6');

  useEffect(() => {
    const loadGoals = async () => {
      const savedKidGoal = await AsyncStorage.getItem('kidGoal');
      const savedParentGoal = await AsyncStorage.getItem('parentGoal');
      if (savedKidGoal) setKidGoal(savedKidGoal);
      if (savedParentGoal) setParentGoal(savedParentGoal);
    };
    loadGoals();
  }, []);

  const saveGoals = async () => {
    try {
      await AsyncStorage.setItem('kidGoal', kidGoal);
      await AsyncStorage.setItem('parentGoal', parentGoal);
    } catch (e) {
      console.log('Error saving goals', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text>Kid's Sleep Goal (hrs):</Text>
      <TextInput
        style={styles.input}
        value={kidGoal}
        onChangeText={setKidGoal}
        keyboardType="numeric"
      />
      <Text>Parent's Sleep Goal (hrs):</Text>
      <TextInput
        style={styles.input}
        value={parentGoal}
        onChangeText={setParentGoal}
        keyboardType="numeric"
      />
      <Button title="Save Goals" onPress={saveGoals} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, marginVertical: 10 },
});