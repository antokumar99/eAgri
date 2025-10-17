import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#134E5E', '#71B280']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat with {userName || 'User'}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <MaterialIcons name="chat-bubble-outline" size={60} color="#74A588" />
          <Text style={styles.messagingTitle}>Messaging Feature</Text>
          <Text style={styles.messagingText}>
            Chat functionality is coming soon! You'll be able to send messages to {userName || 'this user'} directly from here.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={20} color="#2AAF62" />
              <Text style={styles.featureText}>Real-time messaging</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={20} color="#2AAF62" />
              <Text style={styles.featureText}>Image sharing</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={20} color="#2AAF62" />
              <Text style={styles.featureText}>Message history</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.backToProfileButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#2AAF62', '#1E8449']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <MaterialIcons name="person" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Back to Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    elevation: 3,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    maxWidth: '100%',
  },
  messagingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  messagingText: {
    fontSize: 16,
    color: '#74A588',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#2D6A4F',
    marginLeft: 12,
    fontWeight: '500',
  },
  backToProfileButton: {
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
});