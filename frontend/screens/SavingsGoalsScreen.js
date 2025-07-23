import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

function ProgressBar({ progress }) {
  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarBackground]}>
        <View style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

export default function SavingsGoalsScreen() {
  const [goalName, setGoalName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [goals, setGoals] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
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
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (user) {
      try {
        const res = await api.get(`/goals?userId=${user.id}`);
        const data = Array.isArray(res?.data) ? res.data : [];
        const processedGoals = data
          .map(processGoalData)
          .filter(goal => goal.id && goal.goalName);
        setGoals(processedGoals);
      } catch (err) {
        console.error(err);
        setGoals([]);
      }
    }
  };

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
      resetForm();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const startEditing = (goal) => {
    setEditingGoal(goal);
    setGoalName(goal.goalName);
    setTarget(goal.target.toString());
    setSaved(goal.saved.toString());
  };

  const cancelEditing = () => {
    setEditingGoal(null);
    resetForm();
  };

  const resetForm = () => {
    setGoalName('');
    setTarget('');
    setSaved('');
  };

  const updateGoal = async () => {
    if (!editingGoal || !goalName || !target) return;
    const parsedTarget = parseFloat(target);
    const parsedSaved = parseFloat(saved || '0');
    if (isNaN(parsedTarget) || parsedTarget <= 0) return;
    if (isNaN(parsedSaved) || parsedSaved < 0) return;

    const updatedGoal = {
      ...editingGoal,
      goalName: goalName.trim(),
      target: parsedTarget,
      saved: parsedSaved,
    };
    try {
      await api.put(`/goals?id=${editingGoal.id}`, updatedGoal);
      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === editingGoal.id ? updatedGoal : goal
        )
      );
      setEditingGoal(null);
      resetForm();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const deleteGoal = async (goal) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/goals?id=${goal.id}`);
              setGoals(prevGoals =>
                prevGoals.filter(g => g.id !== goal.id)
              );
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Savings Goals</Text>
      <View style={styles.card}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Goal Name"
            value={goalName}
            onChangeText={setGoalName}
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            placeholder="Target Amount"
            value={target}
            onChangeText={setTarget}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            placeholder="Amount Saved (optional)"
            value={saved}
            onChangeText={setSaved}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
          <View style={styles.buttonContainer}>
            {editingGoal ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton]}
                  onPress={updateGoal}
                >
                  <Text style={styles.buttonText}>Update Goal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={cancelEditing}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={addGoal}
              >
                <Text style={styles.buttonText}>Add Goal</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.subtitle}>Your Goals:</Text>
      <FlatList
        style={styles.list}
        data={goals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>{item.goalName}</Text>
              <View style={styles.goalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => startEditing(item)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteGoal(item)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.goalDetails}>
              <Text style={styles.savedText}>
                ${item.saved.toFixed(2)} saved of ${item.target.toFixed(2)}
              </Text>
              <ProgressBar progress={item.saved / item.target} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  list: {
    flex: 1,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  goalDetails: {
    gap: 8,
  },
  savedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    minWidth: 40,
  },
});