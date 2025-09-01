import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { OCR_CONFIG } from '../config/ocrConfig';
import BillScanService from '../services/billScanService';
import SpeechTextInput from '../components/SpeechTextInput';

export default function SpendingTrackerScreen() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const { user } = useContext(AuthContext);

  const processEntryData = (entry) => ({
    id: String(entry.id || Date.now()),
    userId: String(entry.userId),
    amount: Number(entry.amount) || 0,
    category: String(entry.category || ''),
    description: String(entry.description || ''),
    date: entry.date || new Date().toISOString()
  });

  useEffect(() => {
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (user) {
      try {
        const res = await api.get(`/spending?userId=${user.id}`);
        const data = Array.isArray(res?.data) ? res.data : [];
        const processedEntries = data
          .map(processEntryData)
          .filter(entry => entry.id && entry.category);
        setEntries(processedEntries);
      } catch (err) {
        console.error(err);
        setEntries([]);
      }
    }
  };

  const addEntry = async () => {
    if (!amount || !category || !user) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;

    const newEntry = processEntryData({
      userId: user.id,
      amount: parsedAmount,
      category: category.trim(),
      description: description.trim(),
      date: new Date().toISOString(),
      id: String(Date.now())
    });
    try {
      await api.post('/spending', newEntry);
      setEntries(prevEntries => [newEntry, ...prevEntries]);
      setAmount('');
      setCategory('');
      setDescription('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add entry');
    }
  };

  const startEditing = (entry) => {
    setEditingEntry(entry);
    setAmount(entry.amount.toString());
    setCategory(entry.category);
    setDescription(entry.description || '');
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setAmount('');
    setCategory('');
    setDescription('');
  };

  const updateEntry = async () => {
    if (!editingEntry || !amount || !category) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;

    const updatedEntry = {
      ...editingEntry,
      amount: parsedAmount,
      category: category.trim(),
      description: description.trim(),
    };
    try {
      await api.put(`/spending?id=${editingEntry.id}`, updatedEntry);
      setEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === editingEntry.id ? updatedEntry : entry
        )
      );
      setEditingEntry(null);
      setAmount('');
      setCategory('');
      setDescription('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update entry');
    }
  };

  const deleteEntry = async (entry) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this spending entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/spending?id=${entry.id}&userId=${entry.userId}`);
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

  const getTotalSpending = () => {
    return entries.reduce((total, entry) => total + (entry.amount || 0), 0);
  };

  const getSpendingByCategory = () => {
    const categoryTotals = {};
    entries.forEach(entry => {
      if (entry.category) {
        categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.amount;
      }
    });
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 categories
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

  const getCategoryIcon = (category) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('food') || lowerCategory.includes('restaurant') || lowerCategory.includes('grocery')) return 'restaurant';
    if (lowerCategory.includes('transport') || lowerCategory.includes('gas') || lowerCategory.includes('car')) return 'directions-car';
    if (lowerCategory.includes('entertainment') || lowerCategory.includes('movie') || lowerCategory.includes('game')) return 'movie';
    if (lowerCategory.includes('shopping') || lowerCategory.includes('clothes') || lowerCategory.includes('retail')) return 'shopping-bag';
    if (lowerCategory.includes('health') || lowerCategory.includes('medical') || lowerCategory.includes('doctor')) return 'local-hospital';
    if (lowerCategory.includes('utility') || lowerCategory.includes('bill') || lowerCategory.includes('rent')) return 'receipt';
    return 'payment';
  };

  // OCR and Bill Scanning Functions
  const requestCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to scan bills');
      return false;
    }
    return true;
  };

  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required to select images');
      return false;
    }
    return true;
  };

  const processBillImage = async (imageUri) => {
    setIsScanning(true);
    try {
      // Use the comprehensive bill processing method
      const result = await BillScanService.processBillImage(imageUri, user.id);
      
      if (result.success) {
        console.log("Successful result");
        // Auto-fill the form with processed data
        setAmount(result.data.amount.toString());
        setCategory(result.data.category);
        setDescription(result.data.description);
        
        Alert.alert(
          'Bill Scanned Successfully!',
          result.message + '\n\nThe form has been auto-filled. Please review and submit.'
        );
      } else {
        // Handle processing failure
        Alert.alert(
          'Scan Error', 
          result.error + '\n\nPlease enter the details manually.'
        );
      }
    } catch (error) {
      console.error('Bill processing error:', error);
      Alert.alert(
        'Scan Error', 
        'Failed to process the bill image. Please try again or enter manually.'
      );
    } finally {
      setIsScanning(false);
      setShowScanOptions(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: OCR_CONFIG.IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets[0]) {
        await processBillImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: OCR_CONFIG.IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets[0]) {
        await processBillImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Gallery Error', 'Failed to select image. Please try again.');
    }
  };

  const showScanOptionsModal = () => {
    setShowScanOptions(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Spending Tracker</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Spent</Text>
              <Text style={styles.totalAmount}>-${getTotalSpending().toFixed(2)}</Text>
            </View>
            {getSpendingByCategory().length > 0 && (
              <View style={styles.categoryCard}>
                <Text style={styles.categoryCardTitle}>Top Categories</Text>
                {getSpendingByCategory().map(([category, amount], index) => (
                  <View key={category} style={styles.categoryItem}>
                    <MaterialIcons name={getCategoryIcon(category)} size={16} color="#ff6b6b" />
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.addEntryCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="add-circle" size={24} color="#ff6b6b" />
            <Text style={styles.cardTitle}>Add New Expense</Text>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
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
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Category</Text>
                <SpeechTextInput
                  inputStyle={styles.input}
                  placeholder="e.g., Food, Gas, Shopping"
                  value={category}
                  onChangeText={setCategory}
                  placeholderTextColor="#88a2b6"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <SpeechTextInput
                inputStyle={styles.input}
                placeholder="What did you buy?"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#88a2b6"
                multiline={true}
                numberOfLines={2}
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
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.scanButton]}
                    onPress={showScanOptionsModal}
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                    ) : (
                      <MaterialIcons name="camera-alt" size={20} color="white" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.buttonText}>
                      {isScanning ? 'Scanning...' : 'Scan Bill'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.addButton]}
                    onPress={addEntry}
                  >
                    <MaterialIcons name="add" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Add Expense</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.entriesSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt-long" size={24} color="#cfe0ee" />
            <Text style={styles.sectionTitle}>Spending History</Text>
          </View>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="shopping-cart" size={48} color="#88a2b6" />
              <Text style={styles.emptyStateText}>No spending entries yet</Text>
              <Text style={styles.emptyStateSubtext}>Track your first expense above</Text>
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
                    <View style={styles.entryLeft}>
                      <View style={styles.categoryContainer}>
                        <MaterialIcons 
                          name={getCategoryIcon(item.category)} 
                          size={20} 
                          color="#ff6b6b" 
                          style={styles.categoryIcon}
                        />
                        <Text style={styles.entryCategory}>{item.category}</Text>
                      </View>
                      <Text style={styles.entryDate}>{formatDate(item.date)} at {formatTime(item.date)}</Text>
                    </View>
                    <View style={styles.entryRight}>
                      <Text style={styles.entryAmount}>
                        -${typeof item.amount === 'number' ? item.amount.toFixed(2) : '0.00'}
                      </Text>
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
                  </View>
                  {item.description ? (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Description</Text>
                      <Text style={styles.entryDescription}>{item.description}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Scan Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showScanOptions}
        onRequestClose={() => setShowScanOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Bill</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowScanOptions(false)}
              >
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Choose how you'd like to scan your bill
            </Text>
            <View style={styles.scanOptionsContainer}>
              <TouchableOpacity
                style={styles.scanOption}
                onPress={takePhoto}
              >
                <MaterialIcons name="camera-alt" size={32} color="#ff6b6b" />
                <Text style={styles.scanOptionTitle}>Take Photo</Text>
                <Text style={styles.scanOptionSubtitle}>Use camera to capture bill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanOption}
                onPress={pickFromGallery}
              >
                <MaterialIcons name="photo-library" size={32} color="#ff6b6b" />
                <Text style={styles.scanOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.scanOptionSubtitle}>Select existing photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 8,
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
  summaryContainer: {
    gap: 12,
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
    color: '#ff6b6b',
    letterSpacing: 0.5,
  },
  categoryCard: {
    backgroundColor: '#0f2a3a',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#cfe0ee',
    marginLeft: 8,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b6b',
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
  inputRow: {
    flexDirection: 'row',
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
    backgroundColor: '#ff6b6b',
  },
  scanButton: {
    backgroundColor: '#3B82F6',
  },
  updateButton: {
    backgroundColor: '#ff6b6b',
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
  entryLeft: {
    flex: 1,
    marginRight: 16,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIcon: {
    marginRight: 8,
  },
  entryCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  entryDate: {
    fontSize: 14,
    color: '#cfe0ee',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    letterSpacing: 0.5,
    marginBottom: 8,
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
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a5f7b',
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#cfe0ee',
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryDescription: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f2a3a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#cfe0ee',
    marginBottom: 24,
  },
  scanOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  scanOption: {
    flex: 1,
    backgroundColor: '#1f4a62',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a5f7b',
  },
  scanOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  scanOptionSubtitle: {
    fontSize: 14,
    color: '#cfe0ee',
    textAlign: 'center',
  },
});
