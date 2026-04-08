import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native'
import React from 'react'
import Header from '../components/Header'

const ForumScreen = () => {
  return (
    <SafeAreaView style={styles.safeareacontainer}>
      <Header title="Forum" />
      <View style={styles.container}>
        <Text>ForumScreen</Text>
      </View>
    </SafeAreaView>
  )
}

export default ForumScreen

const styles = StyleSheet.create({
  safeareacontainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});