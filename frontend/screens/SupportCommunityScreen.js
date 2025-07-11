import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Button, FlatList, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function SupportCommunityScreen() {
  const [threads, setThreads] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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
    api.get('/community')
      .then(res => {
        const data = Array.isArray(res?.data) ? res.data : [];
        const processedThreads = data
          .map(processThreadData)
          .filter(thread => thread.id && thread.title);
        setThreads(processedThreads);
      })
      .catch(err => {
        console.error(err);
        setThreads([]);
      });
  }, []);

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
      setTitle('');
      setBody('');
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support & Community</Text>
      
      {isCreating ? (
        <View style={styles.createThreadContainer}>
          <Text style={styles.subtitle}>Create New Thread</Text>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="What's on your mind?"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#666"
          />
          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="Thread Body"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
          />
          <View style={styles.buttonContainer}>
            <Button title="Post Thread" onPress={addThread} />
            <Button title="Cancel" onPress={() => setIsCreating(false)} color="gray" />
          </View>
        </View>
      ) : (
        <Button
          title="Create New Thread"
          onPress={() => setIsCreating(true)}
        />
      )}

      <FlatList
        style={styles.list}
        data={threads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.threadCard} activeOpacity={0.7}>
            <Text style={styles.threadTitle}>{item.title}</Text>
            <Text style={styles.threadBody} numberOfLines={3}>{item.body}</Text>
            <View style={styles.threadFooter}>
              <View style={styles.metaContainer}>
                <Text style={styles.authorText}>
                  By: {item.userId}
                </Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.replyBadge}>
                <Text style={styles.replyCount}>
                  {item.replies?.length || 0}
                </Text>
                <Text style={styles.replyLabel}>
                  {(item.replies?.length || 0) === 1 ? 'reply' : 'replies'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
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
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#34495e',
  },
  createThreadContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  titleInput: {
    height: 45,
    fontSize: 16,
  },
  bodyInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  threadCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  threadBody: {
    color: '#4a4a4a',
    marginBottom: 12,
    lineHeight: 20,
    fontSize: 15,
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    color: '#666',
    fontSize: 13,
  },
  dotSeparator: {
    color: '#666',
    marginHorizontal: 6,
    fontSize: 13,
  },
  dateText: {
    color: '#666',
    fontSize: 13,
  },
  replyBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyCount: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 13,
  },
  replyLabel: {
    color: '#4caf50',
    fontSize: 13,
  },
});