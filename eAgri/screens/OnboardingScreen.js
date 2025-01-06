import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function OnboardingScreen({ navigation }) {
  const handleCompleteOnboarding = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Onboarding Screen!</Text>
      <Button title="Complete Onboarding" onPress={handleCompleteOnboarding} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
});
