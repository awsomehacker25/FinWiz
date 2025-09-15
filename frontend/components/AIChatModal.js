import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { gatherUserBehaviorData, askFinancialCoach } from '../services/financialCoach';
import { AI_CONFIG } from '../config/aiConfig';
import { useTranslation } from 'react-i18next';

const AIChatModal = ({ visible, onClose }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const scrollViewRef = useRef();

  const handleSendMessage = async () => {
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion('');
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userQuestion,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

  try {
      // Gather user behavior data
      const userBehaviorData = await gatherUserBehaviorData(
        user.id || user.email, 
        user.email
      );

      // Call the financial coach API
      const response = await askFinancialCoach(
        userBehaviorData, 
        userQuestion, 
        AI_CONFIG.FASTAPI_ENDPOINT
      );

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.advice,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, aiMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error getting financial advice:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: error.message || (t('ai_error_fallback') || 'Sorry, I encountered an error. Please try again.'),
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      t('clear_chat') || 'Clear Chat',
      t('clear_chat_confirm') || 'Are you sure you want to clear the chat history?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('clear') || 'Clear', 
          style: 'destructive',
          onPress: () => setChatHistory([])
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.aiMessage,
          isError && styles.errorMessage
        ]}
      >
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {!isUser && !isError && (
            <View style={styles.aiIcon}>
              <MaterialIcons name="smart-toy" size={16} color="#ffffff" />
            </View>
          )}
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {message.content}
          </Text>
        </View>
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                  <View style={styles.aiAvatar}>
                    <MaterialIcons name="smart-toy" size={24} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>{t('ai_coach_title') || 'AI Financial Coach'}</Text>
                    <Text style={styles.headerSubtitle}>{t('ai_coach_subtitle') || 'Get personalized financial advice'}</Text>
                  </View>
                </View>
              <View style={styles.headerRight}>
                {chatHistory.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearChat}
                  >
                    <MaterialIcons name="delete" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <MaterialIcons name="close" size={24} color="#88a2b6" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Chat Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContent}
            >
              {chatHistory.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <MaterialIcons name="chat" size={48} color="#88a2b6" />
                  <Text style={styles.welcomeText}>
                    {t('ai_welcome_title') || 'Ask me anything about your finances!'}
                  </Text>
                  <Text style={styles.welcomeSubtext}>
                    {t('ai_welcome_subtext') || 'I can help with budgeting, savings goals, spending habits, and more.'}
                  </Text>
                </View>
              ) : (
                chatHistory.map(renderMessage)
              )}
              
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.loadingText}>{t('ai_thinking') || 'Thinking...'}</Text>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={question}
                onChangeText={setQuestion}
                placeholder={t('ai_placeholder') || 'Ask about your finances...'}
                placeholderTextColor="#88a2b6"
                multiline
                maxLength={AI_CONFIG.MAX_MESSAGE_LENGTH}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!question.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!question.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialIcons name="send" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#17384a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#0f2a3a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#88a2b6',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 60,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#88a2b6',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  errorMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#3B82F6',
  },
  aiBubble: {
    backgroundColor: '#0f2a3a',
  },
  aiIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
    color: '#88a2b6',
    marginTop: 4,
    marginLeft: 8,
  },
  userTimestamp: {
    marginLeft: 0,
    marginRight: 8,
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#88a2b6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#0f2a3a',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0f2a3a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
    backgroundColor: '#0f2a3a',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#88a2b6',
  },
});

export default AIChatModal;
