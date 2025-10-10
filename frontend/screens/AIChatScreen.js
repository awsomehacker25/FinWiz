import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function AIChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: '1',
        text: "Hi! I'm your AI financial advisor. I can help you with savings strategies, investment advice, tax planning, credit building, and more. What would you like to know?",
        isUser: false,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.post('/aiSuggestions', {
        userId: user?.id,
        query: inputText.trim(),
        context: {
          // Add any additional context here
        }
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.advice,
        isUser: false,
        timestamp: new Date().toISOString(),
        sources: response.data.sources
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "How can I save more money?",
    "What's the best way to build credit?",
    "Should I invest in stocks?",
    "How much should I save for emergencies?",
    "What are tax-saving strategies?"
  ];

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isUser ? styles.userMessageText : styles.aiMessageText
      ]}>
        {item.text}
      </Text>
      {item.sources && item.sources.length > 0 && (
        <View style={styles.sourcesContainer}>
          <Text style={styles.sourcesTitle}>Sources:</Text>
          {item.sources.slice(0, 2).map((source, index) => (
            <Text key={index} style={styles.sourceText}>
              • {source.category}: {source.content.substring(0, 100)}...
            </Text>
          ))}
        </View>
      )}
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI Financial Advisor</Text>
        <Text style={styles.subtitle}>Get personalized financial advice</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#9C27B0" />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          ) : null
        }
      />

      {messages.length === 1 && (
        <View style={styles.quickQuestionsContainer}>
          <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
          <View style={styles.quickQuestionsGrid}>
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(question)}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything about your finances..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#9C27B0',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#9C27B0',
    borderRadius: 18,
    padding: 12,
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 12,
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#2c3e50',
  },
  sourcesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  quickQuestionsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  quickQuestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickQuestionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickQuestionText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
