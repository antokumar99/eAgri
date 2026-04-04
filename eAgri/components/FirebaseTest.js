import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import chatService from '../services/chatService';
import { chatColors } from '../utils/chatUtils';

const FirebaseTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { 
      test, 
      success, 
      message, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runConnectionTest = async () => {
    setIsRunning(true);
    addResult('Connection Test', null, 'Starting Firebase connection test...');

    try {
      // Test 1: Initialize User
      addResult('Initialize User', null, 'Testing user initialization...');
      const user = await chatService.initializeUser();
      if (user) {
        setCurrentUser(user);
        addResult('Initialize User', true, `User initialized: ${user.username} (${user._id})`);
      } else {
        addResult('Initialize User', false, 'Failed to initialize user');
        setIsRunning(false);
        return;
      }

      // Test 2: Create Chat Room
      addResult('Create Chat Room', null, 'Testing chat room creation...');
      const testTargetUser = 'firebase-test-user-' + Date.now();
      const chatId = await chatService.getOrCreateChatRoom(testTargetUser);
      if (chatId) {
        addResult('Create Chat Room', true, `Chat room created: ${chatId}`);
      } else {
        addResult('Create Chat Room', false, 'Failed to create chat room');
        setIsRunning(false);
        return;
      }

      // Test 3: Send Test Message
      addResult('Send Message', null, 'Testing message sending...');
      const testMessage = `Test message from Firebase test - ${new Date().toLocaleString()}`;
      const messageId = await chatService.sendMessage(chatId, testMessage);
      if (messageId) {
        addResult('Send Message', true, `Message sent with ID: ${messageId}`);
      } else {
        addResult('Send Message', false, 'Failed to send message');
      }

      // Test 4: Subscribe to Messages
      addResult('Message Subscription', null, 'Testing message subscription...');
      let messageReceived = false;
      
      const unsubscribe = chatService.subscribeToMessages(chatId, (messages) => {
        if (messages && messages.length > 0 && !messageReceived) {
          messageReceived = true;
          addResult('Message Subscription', true, `Received ${messages.length} messages via subscription`);
          
          // Show the latest message
          const latestMessage = messages[messages.length - 1];
          addResult('Latest Message', true, `"${latestMessage.text}" from ${latestMessage.senderName}`);
          
          // Clean up subscription
          if (unsubscribe) {
            unsubscribe();
          }
        }
      });

      // Wait a bit for the subscription to receive the message
      setTimeout(() => {
        if (!messageReceived) {
          addResult('Message Subscription', false, 'No messages received via subscription');
        }
        setIsRunning(false);
      }, 3000);

    } catch (error) {
      console.error('Firebase test error:', error);
      addResult('Error', false, `Test failed: ${error.message}`);
      setIsRunning(false);
    }
  };

  const testPresenceUpdate = async () => {
    try {
      addResult('Presence Test', null, 'Testing presence update...');
      await chatService.updateUserPresence(true);
      addResult('Presence Test', true, 'Presence updated to online');
    } catch (error) {
      addResult('Presence Test', false, `Presence test failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[chatColors.primary, chatColors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Firebase Chat Test</Text>
        {currentUser && (
          <Text style={styles.userInfo}>User: {currentUser.username}</Text>
        )}
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, isRunning && styles.disabledButton]} 
            onPress={runConnectionTest}
            disabled={isRunning}
          >
            <Text style={styles.buttonText}>
              {isRunning ? 'Running Tests...' : 'Run Connection Test'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={testPresenceUpdate}
          >
            <Text style={styles.buttonText}>Test Presence</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={clearResults}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <View key={index} style={[
              styles.resultItem,
              result.success === true && styles.successResult,
              result.success === false && styles.errorResult
            ]}>
              <Text style={styles.resultTest}>{result.test}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: chatColors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: chatColors.accent,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: chatColors.text.hint,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: chatColors.surface,
    borderRadius: 10,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: chatColors.text.primary,
    marginBottom: 15,
  },
  resultItem: {
    backgroundColor: chatColors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: chatColors.text.hint,
  },
  successResult: {
    borderLeftColor: chatColors.status.online,
  },
  errorResult: {
    borderLeftColor: '#FF5252',
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '600',
    color: chatColors.text.primary,
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    color: chatColors.text.secondary,
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 12,
    color: chatColors.text.hint,
  },
});

export default FirebaseTest;