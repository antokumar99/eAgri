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


//         {/* Title */}
//         <Text style={styles.title}>Sign up</Text>


//         {/* Sign Up Button */}
//         <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
//           <Text style={styles.signUpButtonText}>Sign Up</Text>
//         </TouchableOpacity>


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
    if (
      !name ||
      !email ||
      !phoneNumber ||
      !city ||
      !country ||
      !password ||
      !rePassword
    ) {
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

      const response = await api.post("/register", user);

      if (response.data.success) {
        const { emailSent, verified } = response.data;

        // The server reports whether the verification mail actually went out.
        // It used to only ever say "check your email", which was misleading
        // when SMTP was down and left no obvious way forward.
        Alert.alert(
          verified ? "Account Created" : "Almost There",
          response.data.message ||
            "Registration successful. Please check your email to verify.",
          verified || emailSent
            ? [{ text: "OK", onPress: () => navigation.navigate("Login") }]
            : [
                {
                  text: "Resend Email",
                  onPress: () => resendVerification(email.trim().toLowerCase()),
                },
                {
                  text: "Go to Login",
                  onPress: () => navigation.navigate("Login"),
                },
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
      console.log("Registration error:", error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Registration failed. Please try again.";

      // An account that already exists is almost always a half-finished signup,
      // so offer the recovery path instead of a bare error.
      if (error.response?.status === 400 && /already exists/i.test(errorMessage)) {
        Alert.alert("Email Already Registered", errorMessage, [
          {
            text: "Resend Verification",
            onPress: () => resendVerification(email.trim().toLowerCase()),
          },
          { text: "Go to Login", onPress: () => navigation.navigate("Login") },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }

      Alert.alert("Error", errorMessage);
    }
  };

  const resendVerification = async (targetEmail) => {
    try {
      const { data } = await api.post("/resend-verification", {
        email: targetEmail,
      });
      Alert.alert(
        data.emailSent ? "Email Sent" : "Could Not Send Email",
        data.message,
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Could not resend the verification email."
      );
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
            <Text style={[styles.bottomText, { color: "#00a064" }]}>
              Log in
            </Text>
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
