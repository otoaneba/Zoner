import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
    <Stack.Screen options={{ title: 'Oops!' }} />
    <ThemedView style={styles.container}>
      <Text>This page doesn't exist.</Text>
      <Link href="/">Go to home screen</Link>
    </ThemedView>
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
