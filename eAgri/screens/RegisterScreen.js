// // RegisterScreen.jsx
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
// } from "react-native";
// import api from '../services/api';



// export default function RegisterScreen({ navigation }) {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [password, setPassword] = useState("");
//   const [rePassword, setRePassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showRePassword, setShowRePassword] = useState(false);

//   const handleSignUp = async () => {
//     if (!name || !email || !phoneNumber || !password || !rePassword) {
//       Alert.alert("Error", "All fields are required.");
//       return;
//     }

//     if (password !== rePassword) {
//       Alert.alert("Error", "Passwords do not match.");
//       return;
//     }

//     try {
//       const user = {
//         username: name,
//         email: email,
//         phone: phoneNumber,
//         password: password,
//       };

//       const response = await api.post("/register", user);

//       if (response.status !== 500) {
//         Alert.alert("Success", "Registration successful.");
//         setName("");
//         setEmail("");
//         setPhoneNumber("");
//         setPassword("");
//         setRePassword("");
//         navigation.navigate("Login");
//       } else {
//         Alert.alert("Error", "Registration failed.");
//       }
//     } catch (error) {
//       Alert.alert("Error", error.response?.data?.error || "Something went wrong.");
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//       >
//         {/* Image */}
//         <Image
//           source={require("../assets/register.jpg")}
//           style={styles.registerImage}
//           resizeMode="contain"
//         />

//         {/* Title */}
//         <Text style={styles.title}>Sign up</Text>

//         {/* Name */}
//         <TextInput
//           style={styles.input}
//           placeholder="Name"
//           keyboardType="default"
//           value={name}
//           onChangeText={setName}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Email"
//           keyboardType="email-address"
//           value={email}
//           onChangeText={setEmail}
//         />
//         {/* Phone Number */}
//         <TextInput
//           style={styles.input}
//           placeholder="Phone number"
//           keyboardType="phone-pad"
//           value={phoneNumber}
//           onChangeText={setPhoneNumber}
//         />

//         {/* Password */}
//         <View style={styles.passwordContainer}>
//           <TextInput
//             style={[styles.input, { flex: 1, textAlignVertical: "center" }]}
//             placeholder="Password"
//             secureTextEntry={!showPassword}
//             value={password}
//             onChangeText={setPassword}
//           />
//           <TouchableOpacity
//             style={styles.eyeIcon}
//             onPress={() => setShowPassword(!showPassword)}
//           >
//             <Text style={{ color: "#999", fontSize: 14 }}>
//               {showPassword ? "Hide" : "Show"}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Re-enter Password */}
//         <View style={styles.passwordContainer}>
//           <TextInput
//             style={[styles.input, { flex: 1, textAlignVertical: "center" }]}
//             placeholder="Re-enter password"
//             secureTextEntry={!showRePassword}
//             value={rePassword}
//             onChangeText={setRePassword}
//           />
//           <TouchableOpacity
//             style={styles.eyeIcon}
//             onPress={() => setShowRePassword(!showRePassword)}
//           >
//             <Text style={{ color: "#999", fontSize: 14 }}>
//               {showRePassword ? "Hide" : "Show"}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Sign Up Button */}
//         <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
//           <Text style={styles.signUpButtonText}>Sign Up</Text>
//         </TouchableOpacity>

//         {/* Navigate to Login */}
//         <View style={styles.bottomTextContainer}>
//           <Text style={styles.bottomText}>Already have an account? </Text>
//           <TouchableOpacity onPress={() => navigation.navigate("Login")}>
//             <Text style={[styles.bottomText, { color: "#00a064" }]}>Log in</Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   container: {
//     flex: 1,
//     paddingHorizontal: 24,
//     justifyContent: "center",
//   },
//   registerImage: {
//     width: "100%",
//     height: 180,
//     marginBottom: 16,
//     alignSelf: "center",
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "600",
//     marginBottom: 24,
//     textAlign: "center",
//     color: "#000",
//   },
//   input: {
//     height: 40,
//     backgroundColor: "#f4f4f4",
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     marginBottom: 16,
//     textAlignVertical: "center",
//   },
//   passwordContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//     backgroundColor: "#f4f4f4",
//     borderRadius: 8,
//     paddingHorizontal: 16,
//   },
//   eyeIcon: {
//     marginLeft: 8,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   signUpButton: {
//     height: 48,
//     backgroundColor: "#00a064",
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 12,
//   },
//   signUpButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   bottomTextContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 16,
//   },
//   bottomText: {
//     color: "#666",
//     fontSize: 14,
//   },
// });



import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import api from "../services/api";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !phoneNumber || !city || !country || !password || !rePassword) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    if (password !== rePassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      // Build the user payload
      const user = {
        name,
        email,
        phone: phoneNumber,
        password,
        address: {
          city,
          country,
        },
      };

      console.log('Sending registration request:', user); // Add this for debugging

      const response = await api.post("/register", user);

      console.log('Registration response:', response.data); // Add this for debugging

      if (response.data.success) {
        Alert.alert(
          "Success",
          response.data.message || "Registration successful. Please check your email to verify.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        );

        // Clear input fields
        setName("");
        setEmail("");
        setPhoneNumber("");
        setCity("");
        setCountry("");
        setPassword("");
        setRePassword("");
      } else {
        Alert.alert("Error", response.data.message || "Registration failed");
      }
    } catch (error) {
      console.log('Registration error:', error.response || error); // Add this for debugging

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || "Registration failed. Please try again.";

      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Image */}
        <Image
          source={require("../assets/register.jpg")}
          style={styles.registerImage}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>Sign up</Text>

        {/* Name */}
        <TextInput
          style={styles.input}
          placeholder="Name"
          keyboardType="default"
          value={name}
          onChangeText={setName}
        />

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* Phone Number */}
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        {/* City */}
        <TextInput
          style={styles.input}
          placeholder="City"
          keyboardType="default"
          value={city}
          onChangeText={setCity}
        />

        {/* Country */}
        <TextInput
          style={styles.input}
          placeholder="Country"
          keyboardType="default"
          value={country}
          onChangeText={setCountry}
        />

        {/* Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, textAlignVertical: "center" }]}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ color: "#999", fontSize: 14 }}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Re-enter Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, textAlignVertical: "center" }]}
            placeholder="Re-enter password"
            secureTextEntry={!showRePassword}
            value={rePassword}
            onChangeText={setRePassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowRePassword(!showRePassword)}
          >
            <Text style={{ color: "#999", fontSize: 14 }}>
              {showRePassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Navigate to Login */}
        <View style={styles.bottomTextContainer}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.bottomText, { color: "#00a064" }]}>Log in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  registerImage: {
    width: "100%",
    height: 180,
    marginBottom: 16,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
    color: "#000",
  },
  input: {
    height: 40,
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlignVertical: "center",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  eyeIcon: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  signUpButton: {
    height: 48,
    backgroundColor: "#00a064",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  bottomText: {
    color: "#666",
    fontSize: 14,
  },
});
