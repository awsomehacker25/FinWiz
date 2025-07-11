import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function IncomeTrackerScreen() {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [entries, setEntries] = useState([]);
  const { user } = useContext(AuthContext);

  const processEntryData = (entry) => ({
    id: String(entry.id || Date.now()),
    userId: String(entry.userId),
    amount: Number(entry.amount) || 0,
    source: String(entry.source || ''),
    date: entry.date || new Date().toISOString()
  });

  useEffect(() => {
    if (user) {
      api.get(`/income?userId=${user.id}`)
        .then(res => {
          // Initialize with empty array if res.data is undefined
          const data = Array.isArray(res?.data) ? res.data : [];
          const processedEntries = data
            .map(processEntryData)
            .filter(entry => entry.id && entry.source);
          setEntries(processedEntries);
        })
        .catch(err => {
          console.error(err);
          setEntries([]); // Set empty array on error
        });
    }
  }, [user]);

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
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Income Tracker</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Source (e.g., Uber, Cash)"
          value={source}
          onChangeText={setSource}
        />
        <Button title="Add Entry" onPress={addEntry} />
      </View>
      <Text style={styles.subtitle}>Past Entries:</Text>
      <FlatList
        style={styles.list}
        data={entries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryItem}>
            <Text style={styles.entryDate}>
              {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
            </Text>
            <Text style={styles.entrySource}>
              {item.source || 'Unknown source'}
            </Text>
            <Text style={styles.entryAmount}>
              ${typeof item.amount === 'number' ? item.amount.toFixed(2) : '0.00'}
            </Text>
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
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  entryDate: {
    color: '#666',
  },
  entrySource: {
    flex: 1,
    marginHorizontal: 10,
  },
  entryAmount: {
    fontWeight: 'bold',
  },
});