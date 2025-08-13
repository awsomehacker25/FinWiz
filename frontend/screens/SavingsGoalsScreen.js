import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
 
function ProgressBar({ progress }) {
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
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
 
  const getTotalSavings = () => {
    return goals.reduce((total, goal) => total + (goal.saved || 0), 0);
  };
 
  const getTotalTarget = () => {
    return goals.reduce((total, goal) => total + (goal.target || 0), 0);
  };
 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Savings Goals</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Saved</Text>
                <Text style={styles.summaryAmount}>${getTotalSavings().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Target</Text>
                <Text style={styles.summaryTarget}>${getTotalTarget().toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.overallProgress}>
              <Text style={styles.overallProgressText}>
                {getTotalTarget() > 0 ? Math.round((getTotalSavings() / getTotalTarget()) * 100) : 0}% Complete
              </Text>
            </View>
          </View>
        </View>
 
        <View style={styles.addGoalCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="add-circle" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>Add New Goal</Text>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Emergency Fund, Vacation"
                value={goalName}
                onChangeText={setGoalName}
                placeholderTextColor="#88a2b6"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter target amount"
                value={target}
                onChangeText={setTarget}
                keyboardType="numeric"
                placeholderTextColor="#88a2b6"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount Saved (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount already saved"
                value={saved}
                onChangeText={setSaved}
                keyboardType="numeric"
                placeholderTextColor="#88a2b6"
              />
            </View>
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
                  <MaterialIcons name="add" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Add Goal</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="trending-up" size={24} color="#cfe0ee" />
            <Text style={styles.sectionTitle}>Your Goals</Text>
          </View>
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="savings" size={48} color="#88a2b6" />
              <Text style={styles.emptyStateText}>No savings goals yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first savings goal above</Text>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              data={goals}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{item.goalName}</Text>
                      <Text style={styles.goalDate}>Created {formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => startEditing(item)}
                      >
                        <MaterialIcons name="edit" size={16} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteGoal(item)}
                      >
                        <MaterialIcons name="delete" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                 
                  <View style={styles.goalDetails}>
                    <View style={styles.amountRow}>
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Saved</Text>
                        <Text style={styles.savedAmount}>${item.saved.toFixed(2)}</Text>
                      </View>
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Target</Text>
                        <Text style={styles.targetAmount}>${item.target.toFixed(2)}</Text>
                      </View>
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Remaining</Text>
                        <Text style={styles.remainingAmount}>${(item.target - item.saved).toFixed(2)}</Text>
                      </View>
                    </View>
                    <ProgressBar progress={item.saved / item.target} />
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17384a',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#cfe0ee',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  summaryTarget: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  overallProgress: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#224459',
  },
  overallProgressText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  addGoalCard: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  inputContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cfe0ee',
  },
  input: {
    backgroundColor: '#1f4a62',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a5f7b',
    padding: 12,
    fontSize: 16,
    color: '#e9f2f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#3B82F6',
  },
  updateButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButton: {
    backgroundColor: '#546E7A',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  goalsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#cfe0ee',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  goalCard: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalInfo: {
    flex: 1,
    marginRight: 16,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 14,
    color: '#cfe0ee',
    fontWeight: '500',
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  goalDetails: {
    gap: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountItem: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#cfe0ee',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  targetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#224459',
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
    color: '#cfe0ee',
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
});