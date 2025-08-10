import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function IncomeTrackerScreen() {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const { user } = useContext(AuthContext);

  const processEntryData = (entry) => ({
    id: String(entry.id || Date.now()),
    userId: String(entry.userId),
    amount: Number(entry.amount) || 0,
    source: String(entry.source || ''),
    date: entry.date || new Date().toISOString()
  });

  useEffect(() => {
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (user) {
      try {
        const res = await api.get(`/income?userId=${user.id}`);
        const data = Array.isArray(res?.data) ? res.data : [];
        const processedEntries = data
          .map(processEntryData)
          .filter(entry => entry.id && entry.source);
        setEntries(processedEntries);
      } catch (err) {
        console.error(err);
        setEntries([]);
      }
    }
  };

  const addEntry = async () => {
    if (!amount || !source || !user) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;

    const newEntry = processEntryData({
      userId: user.id,
      amount: parsedAmount,
      source: source.trim(),
      date: new Date().toISOString(),
      id: String(Date.now())
    });
    try {
      await api.post('/income', newEntry);
      setEntries(prevEntries => [newEntry, ...prevEntries]);
      setAmount('');
      setSource('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add entry');
    }
  };

  const startEditing = (entry) => {
    setEditingEntry(entry);
    setAmount(entry.amount.toString());
    setSource(entry.source);
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setAmount('');
    setSource('');
  };

  const updateEntry = async () => {
    if (!editingEntry || !amount || !source) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;

    const updatedEntry = {
      ...editingEntry,
      amount: parsedAmount,
      source: source.trim(),
    };
    try {
      await api.put(`/income?id=${editingEntry.id}`, updatedEntry);
      setEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === editingEntry.id ? updatedEntry : entry
        )
      );
      setEditingEntry(null);
      setAmount('');
      setSource('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update entry');
    }
  };

  const deleteEntry = async (entry) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/income?id=${entry.id}&userId=${entry.userId}`);
              setEntries(prevEntries =>
                prevEntries.filter(e => e.id !== entry.id)
              );
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  };
  const getTotalIncome = () => {
    return entries.reduce((total, entry) => total + (entry.amount || 0), 0);
  };
 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
 
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
 
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>💰 Income Tracker</Text>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Income</Text>
            <Text style={styles.totalAmount}>${getTotalIncome().toFixed(2)}</Text>
          </View>
        </View>
 
        <View style={styles.addEntryCard}>
          <Text style={styles.cardTitle}>➕ Add New Entry</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#8BA3B3"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📝 Source</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Uber, Cash, Salary"
                value={source}
                onChangeText={setSource}
                placeholderTextColor="#8BA3B3"
              />
            </View>
            <View style={styles.buttonContainer}>
              {editingEntry ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.updateButton]}
                    onPress={updateEntry}
                  >
                    <Text style={styles.buttonText}>Update Entry</Text>
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
                  onPress={addEntry}
                >
                  <Text style={styles.buttonText}>➕ Add Entry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
 
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>📊 Income History</Text>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No income entries yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your first income entry above</Text>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              data={entries}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryDateContainer}>
                      <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
                      <Text style={styles.entryTime}>{formatTime(item.date)}</Text>
                    </View>
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => startEditing(item)}
                      >
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteEntry(item)}
                      >
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.entryDetails}>
                    <View style={styles.sourceContainer}>
                      <Text style={styles.sourceLabel}>Source</Text>
                      <Text style={styles.entrySource}>
                        {item.source || 'Unknown source'}
                      </Text>
                    </View>
                    <View style={styles.amountContainer}>
                      <Text style={styles.amountLabel}>Amount</Text>
                      <Text style={styles.entryAmount}>
                        ${typeof item.amount === 'number' ? item.amount.toFixed(2) : '0.00'}
                      </Text>
                    </View>
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
  totalCard: {
    backgroundColor: '#1A237E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#B0BEC5',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#64B5F6',
    letterSpacing: 1,
  },
  addEntryCard: {
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
    backgroundColor: '#3F51B5',
  },
  cancelButton: {
    backgroundColor: '#546E7A',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  entriesSection: {
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
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    color: '#1A237E',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  entryTime: {
    color: '#546E7A',
    fontSize: 14,
    fontWeight: '500',
  },
  entryActions: {
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
    backgroundColor: '#3F51B5',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sourceContainer: {
    flex: 1,
    marginRight: 16,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  sourceLabel: {
    fontSize: 12,
    color: '#546E7A',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountLabel: {
    fontSize: 12,
    color: '#546E7A',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entrySource: {
    fontSize: 18,
    color: '#1A237E',
    fontWeight: '600',
  },
  entryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
});