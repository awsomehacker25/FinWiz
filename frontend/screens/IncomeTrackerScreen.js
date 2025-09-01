import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import SpeechTextInput from '../components/SpeechTextInput';

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
          <Text style={styles.title}>Income Tracker</Text>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Income</Text>
            <Text style={styles.totalAmount}>${getTotalIncome().toFixed(2)}</Text>
          </View>
        </View>
 
        <View style={styles.addEntryCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="add-circle" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>Add New Entry</Text>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <SpeechTextInput
                inputStyle={styles.input}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#88a2b6"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Source</Text>
              <SpeechTextInput
                inputStyle={styles.input}
                placeholder="e.g., Uber, Cash, Salary"
                value={source}
                onChangeText={setSource}
                placeholderTextColor="#88a2b6"
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
                  <MaterialIcons name="add" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Add Entry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.entriesSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={24} color="#cfe0ee" />
            <Text style={styles.sectionTitle}>Income History</Text>
          </View>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-balance-wallet" size={48} color="#88a2b6" />
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
                        <MaterialIcons name="edit" size={16} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteEntry(item)}
                      >
                        <MaterialIcons name="delete" size={16} color="white" />
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
    backgroundColor: '#17384a',
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingTop: 8, // Reduced top padding for closer spacing to nav bar
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
  totalCard: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#cfe0ee',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  addEntryCard: {
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
  entriesSection: {
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
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  entryTime: {
    color: '#cfe0ee',
    fontSize: 14,
  },
  entryActions: {
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
    color: '#cfe0ee',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountLabel: {
    fontSize: 12,
    color: '#cfe0ee',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entrySource: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
});