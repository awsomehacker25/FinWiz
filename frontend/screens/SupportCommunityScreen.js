import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function SupportCommunityScreen() {
  const [threads, setThreads] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingThread, setEditingThread] = useState(null);
  const { user } = useContext(AuthContext);

  const processThreadData = (thread) => ({
    id: String(thread.id || Date.now()),
    userId: String(thread.userId || user?.id || 'anonymous'),
    title: String(thread.title || ''),
    body: String(thread.body || ''),
    createdAt: thread.createdAt || new Date().toISOString(),
    replies: Array.isArray(thread.replies) ? thread.replies : [],
  });

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const res = await api.get('/community');
      const data = Array.isArray(res?.data) ? res.data : [];
      const processedThreads = data
        .map(processThreadData)
        .filter(thread => thread.id && thread.title);
      setThreads(processedThreads);
    } catch (err) {
      console.error(err);
      setThreads([]);
    }
  };

  const addThread = async () => {
    if (!title || !body || !user) return;
    const newThread = processThreadData({
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      title: title.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    });
    try {
      await api.post('/community', newThread);
      setThreads(prevThreads => [newThread, ...prevThreads]);
      resetForm();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create thread');
    }
  };

  const startEditing = (thread) => {
    setEditingThread(thread);
    setTitle(thread.title);
    setBody(thread.body);
    setIsCreating(true);
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setIsCreating(false);
    setEditingThread(null);
  };

  const updateThread = async () => {
    if (!editingThread || !title || !body) return;

    const updatedThread = {
      ...editingThread,
      title: title.trim(),
      body: body.trim(),
    };

    try {
      await api.put(`/community/${editingThread.id}`, updatedThread);
      setThreads(prevThreads =>
        prevThreads.map(thread =>
          thread.id === editingThread.id ? updatedThread : thread
        )
      );
      resetForm();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update thread');
    }
  };

  const deleteThread = async (thread) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this thread?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/community/${thread.id}`);
              setThreads(prevThreads =>
                prevThreads.filter(t => t.id !== thread.id)
              );
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete thread');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support & Community</Text>
      
      {!isCreating ? (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsCreating(true)}
        >
          <Text style={styles.createButtonText}>Start New Discussion</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {editingThread ? 'Edit Discussion' : 'Start New Discussion'}
          </Text>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#666"
          />
          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="Share your thoughts..."
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            placeholderTextColor="#666"
          />
          <View style={styles.buttonContainer}>
            {editingThread ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton]}
                  onPress={updateThread}
                >
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={resetForm}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.postButton]}
                  onPress={addThread}
                >
                  <Text style={styles.buttonText}>Post</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      <FlatList
        style={styles.list}
        data={threads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.threadCard}>
            <View style={styles.threadHeader}>
              <View style={styles.threadMeta}>
                <Text style={styles.threadDate}>
                  {formatDate(item.createdAt)}
                </Text>
                {item.userId === user?.id && (
                  <View style={styles.threadActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => startEditing(item)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteThread(item)}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.threadTitle}>{item.title}</Text>
              <Text style={styles.threadBody}>{item.body}</Text>
            </View>
            <View style={styles.threadFooter}>
              <Text style={styles.replyCount}>
                {item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}
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
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 8,
  },
  titleInput: {
    fontWeight: '500',
  },
  bodyInput: {
    height: 120,
    textAlignVertical: 'top',
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
  postButton: {
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
  list: {
    flex: 1,
  },
  threadCard: {
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
  threadHeader: {
    gap: 8,
  },
  threadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadDate: {
    color: '#666',
    fontSize: 14,
  },
  threadActions: {
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
  threadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  threadBody: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 22,
  },
  threadFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  replyCount: {
    color: '#666',
    fontSize: 14,
  },
});