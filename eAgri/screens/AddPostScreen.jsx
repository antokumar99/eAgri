import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';

const AddPostScreen = () => {
  const navigation = useNavigation();
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false); // New state to track posting status

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera roll permissions to make this work!'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPostImage(result.assets[0].uri);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const hasUnsavedChanges = () => {
        // Don't check for unsaved changes if we're in the process of posting
        if (isPosting) return false;
        return postText.trim() !== '' || postImage !== null;
      };

      const handleBackPress = () => {
        if (hasUnsavedChanges()) {
          Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. Are you sure you want to leave?',
            [
              { text: 'Stay', style: 'cancel' },
              {
                text: 'Leave',
                onPress: () => {
                  navigation.removeListener('beforeRemove', handleBeforeRemove);
                  navigation.goBack();
                },
              },
            ]
          );
          return true;
        }
        navigation.goBack();
        return false;
      };

      const handleBeforeRemove = (e) => {
        if (hasUnsavedChanges()) {
          e.preventDefault();
          handleBackPress();
        }
      };

      navigation.addListener('beforeRemove', handleBeforeRemove);

      return () => {
        navigation.removeListener('beforeRemove', handleBeforeRemove);
      };
    }, [navigation, postText, postImage, isPosting]) // Added isPosting to dependencies
  );

  const handlePost = () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Post text cannot be empty!');
      return;
    }

    setIsPosting(true); // Set posting flag before showing success alert

    setTimeout(() => {
      Alert.alert(
        'Success',
        'Post submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setPostText('');
              setPostImage(null);
              navigation.goBack();
            }
          }
        ]
      );
    }, 800);
  };

  const removeImage = () => {
    setPostImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Add Your Post" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <Text style={styles.header}>Create a Post</Text>

        <TextInput
          style={styles.textInput}
          placeholder="Share your thoughts..."
          multiline
          value={postText}
          onChangeText={setPostText}
        />

        {postImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: postImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <Text style={styles.removeImageButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Pick an Image</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postButton} onPress={handlePost}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddPostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 20,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#fff',
    padding: 16,
    fontSize: 16,
    borderRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageButton: {
    backgroundColor: '#1e90ff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  postButton: {
    backgroundColor: '#32CD32',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});