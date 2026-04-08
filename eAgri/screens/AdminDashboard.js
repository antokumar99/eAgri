import React from 'react';
import { View, Text, Button } from 'react-native';

const AdminDashboard = ({ route, navigation }) => {
  const { token } = route.params;

  const handleLogout = () => {
    navigation.navigate('AdminLogin');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Admin Dashboard</Text>
      <Text style={{ marginVertical: 20 }}>Token: {token}</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default AdminDashboard;
