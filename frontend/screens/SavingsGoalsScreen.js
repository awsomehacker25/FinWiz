import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
 
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
          <Text style={styles.title}>🎯 Savings Goals</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: '#B0BEC5' }]}>Total Saved</Text>
                <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>${getTotalSavings().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: '#B0BEC5' }]}>Total Target</Text>
                <Text style={[styles.summaryTarget, { color: '#64B5F6' }]}>${getTotalTarget().toFixed(2)}</Text>
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
          <Text style={styles.cardTitle}>➕ Add New Goal</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Emergency Fund, Vacation"
                value={goalName}
                onChangeText={setGoalName}
                placeholderTextColor="#B0BEC5"
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
                placeholderTextColor="#B0BEC5"
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
                placeholderTextColor="#B0BEC5"
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
                  <Text style={styles.buttonText}>➕ Add Goal</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
 
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>📊 Your Goals</Text>
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
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
    backgroundColor: '#244662',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: '#1A237E',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
    color: '#B0BEC5',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  summaryTarget: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64B5F6',
    letterSpacing: 0.5,
  },
  overallProgress: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3F51B5',
  },
  overallProgressText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addGoalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 16,
    letterSpacing: 0.5,
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
    color: '#1A237E',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButton: {
    backgroundColor: '#3F51B5',
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  goalsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
    marginRight: 16,
  },
  goalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 14,
    color: '#546E7A',
    fontWeight: '500',
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#546E7A',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  targetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  remainingAmount: {
    fontSize: 18,
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
    height: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#1A237E',
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
});