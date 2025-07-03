import React, { useState, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "../services/api";

const UpdatePost = ({ route, navigation }) => {
  const { post } = route.params;
  const [postText, setPostText] = useState(post.text);
  const [postImage, setPostImage] = useState(post.imagePublicId ? 
    `https://res.cloudinary.com/dfm7lhrwz/image/upload/${post.imagePublicId}` : null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [originalImageId, setOriginalImageId] = useState(post.imagePublicId);

  React.useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Current token:', token);
      if (!token) {
        Alert.alert(
          'Authentication Required',
          'Please login to create a post',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login') // Make sure you have this route
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking token:', error);
    }
  };

  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to make this work!'
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      // Check permissions again before picking
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
          'Please grant camera roll permissions in your device settings to select images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
        allowsMultipleSelection: false,
        exif: true,
    });

      console.log('Image picker result:', result);

    if (!result.canceled) {
        // Verify the image exists
        const imageUri = result.assets[0].uri;
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        
        console.log('File info:', fileInfo);

        if (!fileInfo.exists) {
          throw new Error('Selected image file does not exist');
        }

        // Check if the file is accessible
        try {
          await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        } catch (error) {
          console.error('Error reading file:', error);
          throw new Error('Cannot access the selected image');
        }

        setPostImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to load the selected image. Please try another image.'
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      const hasUnsavedChanges = () => {
        // Don't check for unsaved changes if we're in the process of posting
        if (isUpdating) return false;
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
    }, [navigation, postText, postImage, isUpdating]) // Added isPosting to dependencies
  );

  const testAuth = async () => {
    try {
      const response = await api.get('/test-auth');
      console.log('Auth test response:', response.data);
      return true;
    } catch (error) {
      console.error('Auth test failed:', error.response?.data);
      return false;
    }
  };

  const handleUpdate = async () => {
    if (!postText.trim()) {
      Alert.alert('Error', 'Post text cannot be empty!');
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('text', postText.trim());

      // Check if image was changed
      if (postImage && !postImage.includes('cloudinary')) {
        const imageUriParts = postImage.split('/');
        const fileName = imageUriParts[imageUriParts.length - 1];
        
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(postImage);
        
        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(postImage, {
          encoding: FileSystem.EncodingType.Base64,
        });

        formData.append('image', {
          uri: postImage,
          type: 'image/jpeg',
          name: fileName,
        });
      }

      // Add original image ID to handle image updates/deletions
      if (originalImageId) {
        formData.append('originalImageId', originalImageId);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
        timeout: 30000, // Increase timeout to 30 seconds
      };

      const response = await api.put(`/posts/${post._id}`, formData, config);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Post updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (route.params?.onUpdateSuccess) {
                  route.params.onUpdateSuccess();
                }
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error updating post:', error);
      let errorMessage = 'Failed to update post. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const removeImage = () => {
    setPostImage(null);
  };

  const ImagePreview = () => {
    if (!postImage) return null;

    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: postImage }}
          style={styles.previewImage}
          onError={(error) => {
            console.error('Image loading error:', error);
            Alert.alert(
              'Error',
              'Failed to load image preview. Please try selecting the image again.'
            );
            setPostImage(null);
          }}
        />
        <TouchableOpacity 
          style={styles.removeImageButton} 
          onPress={() => setPostImage(null)}
        >
          <Text style={styles.removeImageButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Update Post"/>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Update your post..."
          multiline
          value={postText}
          onChangeText={setPostText}
        />

        {postImage && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: postImage }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removeImageButton} 
              onPress={() => {
                setPostImage(null);
                setOriginalImageId(null);
              }}
            >
              <Text style={styles.removeImageButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.imageButton} 
          onPress={pickImage}
        >
          <Text style={styles.imageButtonText}>
            {postImage ? 'Change Image' : 'Add Image'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.updateButton, isUpdating && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Update Post</Text>
          )}
        </TouchableOpacity>

        {isUpdating && (
          <View style={styles.progressContainer}>
            <ActivityIndicator color="#32CD32" />
            <Text style={styles.progressText}>
              {uploadProgress > 0 ? `Updating... ${uploadProgress}%` : 'Processing...'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f5f5',
    paddingTop: Platform.OS === "android" ? 40 : 0,
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 16,
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
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7
  },
  progressContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  progressText: {
    marginTop: 10,
    color: '#32CD32',
    fontWeight: 'bold',
  }
});

export default UpdatePost;