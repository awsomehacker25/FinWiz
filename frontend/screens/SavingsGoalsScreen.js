import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

function ProgressBar({ progress }) {
  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
    </View>
  );
}

export default function SavingsGoalsScreen() {
  const [goalName, setGoalName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [goals, setGoals] = useState([]);
  const { user } = useContext(AuthContext);

  const processGoalData = (goal) => ({
    id: String(goal.id || Date.now()),
    userId: String(goal.userId),
    goalName: String(goal.goalName || ''),
    target: Number(goal.target) || 0,
    saved: Number(goal.saved) || 0,
    createdAt: goal.createdAt || new Date().toISOString()
  });

  useEffect(() => {
    if (user) {
      api.get(`/goals?userId=${user.id}`)
        .then(res => {
          // Initialize with empty array if res.data is undefined
          const data = Array.isArray(res?.data) ? res.data : [];
          const processedGoals = data
            .map(processGoalData)
            .filter(goal => goal.id && goal.goalName);
          setGoals(processedGoals);
        })
        .catch(err => {
          console.error(err);
          setGoals([]); // Set empty array on error
        });
    }
  }, [user]);

  const addGoal = async () => {
    if (!goalName || !target || !user) return;
    const parsedTarget = parseFloat(target);
    const parsedSaved = parseFloat(saved || '0');
    if (isNaN(parsedTarget) || parsedTarget <= 0) return;
    if (isNaN(parsedSaved) || parsedSaved < 0) return;

    const newGoal = processGoalData({
      id: String(Date.now()),
      userId: user.id,
      goalName: goalName.trim(),
      target: parsedTarget,
      saved: parsedSaved,
      createdAt: new Date().toISOString(),
    });
    try {
      await api.post('/goals', newGoal);
      setGoals(prevGoals => [newGoal, ...prevGoals]);
      setGoalName('');
      setTarget('');
      setSaved('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Savings Goals</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Goal Name"
          value={goalName}
          onChangeText={setGoalName}
        />
        <TextInput
          style={styles.input}
          placeholder="Target Amount"
          value={target}
          onChangeText={setTarget}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Amount Saved (optional)"
          value={saved}
          onChangeText={setSaved}
          keyboardType="numeric"
        />
        <Button title="Add Goal" onPress={addGoal} />
      </View>
      <Text style={styles.subtitle}>Your Goals:</Text>
      <FlatList
        style={styles.list}
        data={goals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.goalItem}>
            <Text style={styles.goalName}>{item.goalName}</Text>
            <Text style={styles.goalAmount}>
              ${item.saved} / ${item.target}
            </Text>
            <ProgressBar progress={item.saved / item.target} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  inputContainer: {
    gap: 10,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  list: {
    flex: 1,
  },
  goalItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
  },
  goalName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  goalAmount: {
    color: '#666',
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    marginVertical: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#4caf50',
    borderRadius: 5,
  },
});