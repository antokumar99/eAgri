import React, { useState, useCallback } from "react";
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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const AddPostScreen = () => {
  const navigation = useNavigation();
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false); // New state to track posting status
  const [uploadProgress, setUploadProgress] = useState(0);

  React.useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("Current token:", token);
      if (!token) {
        Alert.alert(
          "Authentication Required",
          "Please login to create a post",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"), // Make sure you have this route
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error checking token:", error);
    }
  };

  React.useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to make this work!"
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      // Check permissions again before picking
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions in your device settings to select images."
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

      console.log("Image picker result:", result);

      if (!result.canceled) {
        // Verify the image exists
        const imageUri = result.assets[0].uri;
        const fileInfo = await FileSystem.getInfoAsync(imageUri);

        console.log("File info:", fileInfo);

        if (!fileInfo.exists) {
          throw new Error("Selected image file does not exist");
        }

        // Check if the file is accessible
        try {
          await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (error) {
          console.error("Error reading file:", error);
          throw new Error("Cannot access the selected image");
        }

        setPostImage(imageUri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(
        "Error",
        "Failed to load the selected image. Please try another image."
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      const hasUnsavedChanges = () => {
        // Don't check for unsaved changes if we're in the process of posting
        if (isPosting) return false;
        return postText.trim() !== "" || postImage !== null;
      };

      const handleBackPress = () => {
        if (hasUnsavedChanges()) {
          Alert.alert(
            "Unsaved Changes",
            "You have unsaved changes. Are you sure you want to leave?",
            [
              { text: "Stay", style: "cancel" },
              {
                text: "Leave",
                onPress: () => {
                  navigation.removeListener("beforeRemove", handleBeforeRemove);
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

      navigation.addListener("beforeRemove", handleBeforeRemove);

      return () => {
        navigation.removeListener("beforeRemove", handleBeforeRemove);
      };
    }, [navigation, postText, postImage, isPosting]) // Added isPosting to dependencies
  );

  const testAuth = async () => {
    try {
      const response = await api.get("/test-auth");
      console.log("Auth test response:", response.data);
      return true;
    } catch (error) {
      console.error("Auth test failed:", error.response?.data);
      return false;
    }
  };

  const handlePost = async () => {
    if (!postText.trim()) {
      Alert.alert("Error", "Post text cannot be empty!");
      return;
    }

    setIsPosting(true);

    try {
      // Test authentication first
      const isAuthenticated = await testAuth();
      if (!isAuthenticated) {
        throw new Error("Authentication failed");
      }

      const token = await AsyncStorage.getItem("token");
      console.log("Current token before posting:", token);

      if (!token) {
        Alert.alert(
          "Authentication Required",
          "Please login to create a post",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
        return;
      }

      const formData = new FormData();
      formData.append("text", postText.trim());

      if (postImage) {
        const imageUriParts = postImage.split("/");
        const fileName = imageUriParts[imageUriParts.length - 1];
        const fileType = postImage.endsWith("png") ? "image/png" : "image/jpeg";

        try {
          const fileInfo = await FileSystem.getInfoAsync(postImage);
          console.log("File size:", fileInfo.size / (1024 * 1024), "MB");

          // Check file size before uploading (optional)
          if (fileInfo.size > 10 * 1024 * 1024) {
            // 10MB limit
            throw new Error("Image size must be less than 10MB");
          }

          formData.append("image", {
            uri: postImage,
            type: fileType,
            name: fileName,
          });
        } catch (fileError) {
          console.error("File system error:", fileError);
          if (fileError.message.includes("10MB")) {
            throw fileError;
          }
          // If there's an error getting file info, try to upload anyway
          formData.append("image", {
            uri: postImage,
            type: fileType,
            name: fileName,
          });
        }
      }

      const response = await api.postFormData("/posts", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log("Upload progress:", percentCompleted, "%");
          setUploadProgress(percentCompleted);

          // If upload is complete, show success message
          if (percentCompleted === 100) {
            setTimeout(() => {
              Alert.alert("Success", "Post created successfully!", [
                {
                  text: "OK",
                  onPress: () => navigation.navigate("Main"),
                },
              ]);
            }, 500);
          }
        },
      });

      if (response.data.success) {
        setPostText("");
        setPostImage(null);
        navigation.navigate("Main");
      }
    } catch (error) {
      console.error("Error details:", error.response?.data || error.message);

      // Don't show error if upload completed successfully
      if (uploadProgress !== 100) {
        let errorMessage = "Failed to create post. Please try again.";

        if (error.message === "Please login to create a post") {
          navigation.navigate("Login");
          return;
        }

        if (error.message.includes("10MB")) {
          errorMessage =
            "The image file is too large. Please choose a smaller image (less than 10MB).";
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsPosting(false);
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
            console.error("Image loading error:", error);
            Alert.alert(
              "Error",
              "Failed to load image preview. Please try selecting the image again."
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          <Header title="Create Post" />

          <View style={styles.mainContent}>
            {postImage ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: postImage }}
                  style={styles.selectedImage}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setPostImage(null)}
                >
                  <MaterialIcons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <MaterialIcons
                  name="add-photo-alternate"
                  size={40}
                  color="#723CEB"
                />
                <Text style={styles.uploadText}>Add Photo</Text>
                <Text style={styles.uploadSubText}>Share your moments</Text>
              </TouchableOpacity>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="What's on your mind about farming?"
                placeholderTextColor="#666"
                multiline
                value={postText}
                onChangeText={setPostText}
                textAlignVertical="top"
              />
            </View>

            {isPosting && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color="#723CEB" />
                <Text style={styles.progressText}>
                  Creating your post... {uploadProgress}%
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.postButtonContainer,
                !postText && !postImage && styles.disabledButton,
              ]}
              onPress={handlePost}
              disabled={(!postText && !postImage) || isPosting}
            >
              <LinearGradient
                colors={["#7CFC00", "#55DD33", "#ADFF2F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <MaterialIcons name="post-add" size={24} color="#043927" />
                <Text style={styles.postButtonText}>Share with Community</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: 20,
    marginTop: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedImage: {
    width: "100%",
    height: 250,
    borderRadius: 15,
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 144, 47, 0.9)",
    borderRadius: 20,
    padding: 8,
    elevation: 3,
  },
  uploadButton: {
    height: 200,
    backgroundColor: "rgba(114, 60, 235, 0.05)",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#723CEB",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  uploadText: {
    marginTop: 10,
    fontSize: 18,
    color: "#723CEB",
    fontWeight: "600",
  },
  uploadSubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  inputContainer: {
    backgroundColor: "rgba(114, 60, 235, 0.03)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(114, 60, 235, 0.2)",
    minHeight: 200,
  },
  textInput: {
    fontSize: 16,
    color: "#06090F",
    lineHeight: 24,
    height: 180,
  },
  postButtonContainer: {
    marginTop: 135,
    overflow: "hidden",
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  postButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  progressContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -75 }, { translateY: -75 }],
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 150,
    height: 150,
    justifyContent: "center",
  },
  progressText: {
    marginTop: 15,
    color: "#723CEB",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});

export default AddPostScreen;
