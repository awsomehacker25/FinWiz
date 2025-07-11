import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.buttonContainer}>
        <Button title="Income Tracker" onPress={() => navigation.navigate('IncomeTracker')} />
        <Button title="Savings Goals" onPress={() => navigation.navigate('SavingsGoals')} />
        <Button title="Literacy Hub" onPress={() => navigation.navigate('LiteracyHub')} />
        <Button title="Support & Community" onPress={() => navigation.navigate('SupportCommunity')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
});