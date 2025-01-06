import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Linking,
  Platform
} from 'react-native';
import axios from 'axios';
import Header from '../components/Header';

const ResearchScreen = () => {
  const [researchPosts, setResearchPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResearchPosts = async () => {
      try {
        // Replace with your own endpoint
        const { data } = await axios.get('http://your-api-endpoint.com/api/research');
        setResearchPosts(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching research posts.');
        setLoading(false);
      }
    };

    fetchResearchPosts();
  }, []);

  // Function to open links in the device’s default browser
  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open link:', err);
    }
  };

  // Render for each item in the FlatList
  const renderPost = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Title / Link */}
        <TouchableOpacity onPress={() => openLink(item.link)}>
          <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>

        {/* Image (if available) */}
        {item.image ? (
          <Image 
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}

        {/* Category */}
        <Text style={styles.category}>
          <Text style={{ fontWeight: 'bold' }}>Category:</Text> {item.category}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading research posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (researchPosts.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No research posts available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Research and Innovation" />
      {/* <Text style={styles.heading}></Text> */}
      <FlatList
        data={researchPosts}
        keyExtractor={(item) => item._id} // or whatever unique ID field your data uses
        renderItem={renderPost}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default ResearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F7F7F7',
    paddingTop: Platform.OS === "android" ? 40 : 0, 
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    color: '#0077cc',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 8,
    borderRadius: 4,
  },
  category: {
    fontSize: 14,
    color: '#555',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
  },
});
