import React, { useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const LESSONS = [
  { id: '1', title: 'How to Save for a Visa', completed: false },
  { id: '2', title: 'Understanding US Taxes', completed: false },
  { id: '3', title: 'Building Credit', completed: false },
];

export default function LiteracyHubScreen() {
  const [selected, setSelected] = useState(null);
  const [lessons, setLessons] = useState(LESSONS);

  const markComplete = (id) => {
    setLessons(lessons.map(l => l.id === id ? { ...l, completed: true } : l));
    setSelected(null);
  };

  if (selected) {
    const lesson = lessons.find(l => l.id === selected);
    return (
      <ScrollView style={styles.container}>
        <View style={styles.lessonContainer}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonContent}>
            This is a detailed lesson about {lesson.title.toLowerCase()}. The content will include
            important information, examples, and practical tips to help you understand and apply
            the concepts in your financial journey.
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="Mark as Complete" onPress={() => markComplete(lesson.id)} />
            <Button title="Back to Lessons" onPress={() => setSelected(null)} />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Literacy Hub</Text>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Progress: {lessons.filter(l => l.completed).length} / {lessons.length} lessons completed
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(lessons.filter(l => l.completed).length / lessons.length) * 100}%` }
            ]} 
          />
        </View>
      </View>
      <FlatList
        style={styles.list}
        data={lessons}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.lessonCard}
            onPress={() => setSelected(item.id)}
          >
            <View style={styles.lessonHeader}>
              <Text style={styles.lessonCardTitle}>{item.title}</Text>
              {item.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.lessonDescription}>
              Learn about {item.title.toLowerCase()} and how it affects your financial future.
            </Text>
            <Button title="Start Lesson" onPress={() => setSelected(item.id)} />
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
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  list: {
    flex: 1,
  },
  lessonCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lessonCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  completedBadge: {
    backgroundColor: '#4caf50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lessonDescription: {
    color: '#666',
    marginBottom: 10,
  },
  lessonContainer: {
    padding: 20,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  lessonContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 10,
  },
});