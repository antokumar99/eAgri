import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logInImage from "../assets/login.jpg"; // <-- Adjust this import to your actual file
import api from "../services/api";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // const handleLogin = async () => {
  //   try {
  //     const user = {
  //       email: email,
  //       password: password,
  //     };

  //     const response = await api.post("/login", user);

  //     if (response.status === 200) {
  //       Alert.alert("Success", "User logged in.");
  //       setEmail("");
  //       setPassword("");
  //       navigation.replace("Main");
  //     } else {
  //       Alert.alert("Error", response.data.msg || "Invalid credentials.");
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     Alert.alert("Error", "An error occurred while logging in.");
  //   }
  // };
  const handleLogin = async () => {
    try {
      const user = {
        email: email,
        password: password,
      };
  
      const response = await api.post("/login", user);
  
      if (response.status === 200 && response.data.success) { // use if (response.data.success) { if gives error
        // Login successful
        Alert.alert("Success", response.data.message || "User logged in.");
  
        // Optionally store the token if needed for authentication
        const token = response.data.token;
        await AsyncStorage.setItem("token", token); // Save token to AsyncStorage
  
        // Reset input fields
        setEmail("");
        setPassword("");
  
        // Navigate to Home or Main screen
        navigation.replace("Main");
      }
    } catch (error) {
      console.error(error);
  
      // Handle specific error codes
      if (error.response) {
        if (error.response.status === 403) {
          Alert.alert("Email Not Verified", error.response.data.message || "Please verify your email before logging in.");
        } else if (error.response.status === 404) {
          Alert.alert("User Not Found", error.response.data.message || "User not found. Please check your email and try again.");
        } else if (error.response.status === 401) {
          Alert.alert("Incorrect Password", error.response.data.message || "The password you entered is incorrect.");
        } else {
          Alert.alert("Error", error.response.data.message || "An unexpected error occurred. Please try again.");
        }
      } else {
        // General error
        Alert.alert("Error", "Unable to connect to the server. Please try again later.");
      }
    }
  };
  
  const handleForgotPassword = () => {
    console.log("Navigating to Forgot Password screen...");
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
  };

  const handleSignUp = () => {
    navigation.navigate("RegisterScreen");
  };

  return (
    <View style={styles.container}>
      <Image source={logInImage} style={styles.image} resizeMode="contain" />

      <Text style={styles.title}>Login</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rememberMeContainer}>
          <BouncyCheckbox
            size={20}
            fillColor="green"
            iconStyle={{ borderColor: "green" }}
            innerIconStyle={{ borderWidth: 2 }}
            textStyle={styles.rememberMeText}
            text="Remember Me"
            isChecked={rememberMe}
            onPress={(isChecked) => setRememberMe(isChecked)}
          />
        </View>

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotPasswordContainer}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>Or login with</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signUpContainer}>
        <Text>Don’t have an account? </Text>
        <TouchableOpacity onPress={handleSignUp}>
          <Text style={styles.signUpText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  image: {
    width: "80%",
    height: 180,
    alignSelf: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 48,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "60%",
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "green",
  },
  forgotPasswordContainer: {
    marginLeft: "auto",
  },
  loginButton: {
    backgroundColor: "green",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: "#666",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginHorizontal: 5,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgb(255, 164, 36)",
  },
  socialButtonText: {
    fontSize: 17,
    color: "white",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  signUpText: {
    color: "green",
    fontWeight: "600",
  },
});






// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   Image,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import BouncyCheckbox from "react-native-bouncy-checkbox";
// import { useNavigation } from "@react-navigation/native";
// import logInImage from "../assets/login.jpg"; // <-- Adjust this import to your actual file
// import api from "../services/api";

// const LoginScreen = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const navigation = useNavigation();

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Please fill in all fields');
//       return;
//     }

//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;
//       console.log('Logged in user:', user.email);
//       navigation.replace('Home');
//     } catch (error) {
//       console.error(error);
//       Alert.alert('Error', error.message);
//     }
//   };

//   const handleGoogleLogin = () => {
//     // Implement Google login
//     console.log('Google login pressed');
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.container}
//       >
//         <ScrollView contentContainerStyle={styles.scrollContainer}>
//           <View style={styles.formContainer}>
//             <Text style={styles.title}>Welcome Back!</Text>
//             <Text style={styles.subtitle}>Sign in to continue</Text>

//             <TextInput
//               style={styles.input}
//               placeholder="Email"
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//             />

//             <TextInput
//               style={styles.input}
//               placeholder="Password"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry
//             />

//             <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
//               <Text style={styles.loginButtonText}>Login</Text>
//             </TouchableOpacity>

//             <View style={styles.dividerContainer}>
//               <View style={styles.line} />
//               <Text style={styles.dividerText}>OR</Text>
//               <View style={styles.line} />
//             </View>

//             <View style={styles.socialContainer}>
//               <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
//                 <Text style={styles.socialButtonText}>Continue with Google</Text>
//               </TouchableOpacity>
//             </View>

//             <View style={styles.signUpContainer}>
//               <Text>Don't have an account? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//                 <Text style={styles.signUpText}>Sign Up</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     paddingHorizontal: 24,
//     paddingTop: 50,
//   },
//   image: {
//     width: "80%",
//     height: 180,
//     alignSelf: "center",
//     marginBottom: 30,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "600",
//     marginBottom: 20,
//   },
//   inputContainer: {
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 10,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 14,
//   },
//   input: {
//     flex: 1,
//     height: 48,
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginVertical: 8,
//   },
//   rememberMeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     maxWidth: "60%",
//   },
//   rememberMeText: {
//     marginLeft: 8,
//     fontSize: 14,
//   },
//   forgotPasswordText: {
//     fontSize: 14,
//     color: "green",
//   },
//   forgotPasswordContainer: {
//     marginLeft: "auto",
//   },
//   loginButton: {
//     backgroundColor: "green",
//     borderRadius: 10,
//     paddingVertical: 14,
//     alignItems: "center",
//     marginTop: 16,
//   },
//   loginButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   dividerContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 20,
//   },
//   dividerText: {
//     marginHorizontal: 8,
//     fontSize: 14,
//     color: "#666",
//   },
//   line: {
//     flex: 1,
//     height: 1,
//     backgroundColor: "#ddd",
//   },
//   socialContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   socialButton: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 10,
//     marginHorizontal: 5,
//     paddingVertical: 14,
//     alignItems: "center",
//     backgroundColor: "rgb(255, 164, 36)",
//   },
//   socialButtonText: {
//     fontSize: 17,
//     color: "white",
//   },
//   signUpContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 30,
//   },
//   signUpText: {
//     color: "green",
//     fontWeight: "600",
//   },
// });