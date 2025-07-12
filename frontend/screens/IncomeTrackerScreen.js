import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
      await api.put(`/income/${editingEntry.id}`, updatedEntry);
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
              await api.delete(`/income/${entry.id}`);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Income Tracker</Text>
      <View style={styles.card}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            placeholder="Source (e.g., Uber, Cash)"
            value={source}
            onChangeText={setSource}
            placeholderTextColor="#666"
          />
          <View style={styles.buttonContainer}>
            {editingEntry ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton]}
                  onPress={updateEntry}
                >
                  <Text style={styles.buttonText}>Update</Text>
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
                <Text style={styles.buttonText}>Add Entry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.subtitle}>Past Entries:</Text>
      <FlatList
        style={styles.list}
        data={entries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>
                {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
              </Text>
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
              <Text style={styles.entrySource}>
                {item.source || 'Unknown source'}
              </Text>
              <Text style={styles.entryAmount}>
                ${typeof item.amount === 'number' ? item.amount.toFixed(2) : '0.00'}
              </Text>
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
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    color: '#666',
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
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entrySource: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});