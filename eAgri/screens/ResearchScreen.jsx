import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  TextInput,
  ScrollView
} from 'react-native';
import Header from '../components/Header';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/api';

const CATEGORIES = ['All', 'Agriculture', 'Farming Technology', 'Crop Science', 'Soil Science', 'Other'];

const ResearchScreen = () => {
  const [researchPapers, setResearchPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchResearchPapers = async () => {
    try {
      const { data } = await api.get('/research');
      console.log(data); 
      setResearchPapers(data);
      setFilteredPapers(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error fetching research papers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResearchPapers();
  }, []);

  useEffect(() => {
    filterPapers();
  }, [searchQuery, selectedCategory, researchPapers]);

  const filterPapers = () => {
    let filtered = [...researchPapers];
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(paper => paper.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(paper => 
        paper.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPapers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchResearchPapers();
  };

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert("Can't open this URL");
      }
    } catch (err) {
      alert('Error opening the link');
    }
  };

  const renderResearchPaper = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => openLink(item.link)}
    >
      <View style={styles.cardContent}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="article" size={24} color="#4CAF50" />
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <View style={styles.metaContainer}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.date}>
            {new Date(item.publishedDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.linkContainer}>
          <MaterialIcons name="link" size={20} color="#666" />
          <Text style={styles.linkText} numberOfLines={1}>
            {item.link}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContentContainer}
    >
      {CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.selectedCategoryButton,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.selectedCategoryButtonText,
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
  

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Research Papers" />
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search research papers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>
      {renderCategoryFilter()}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
          <FlatList
            data={filteredPapers}
            keyExtractor={(item) => item._id}
            renderItem={renderResearchPaper}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery || selectedCategory !== 'All' 
                    ? 'No matching research papers found'
                    : 'No research papers available'}
                </Text>
              </View>
            }
          />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  categoryContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
    height: 50, // Fixed height for consistency
    backgroundColor: '#F5F5F5', // Optional for clarity
  },
  categoryContentContainer: {
    alignItems: 'center', // Center items vertically
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6, // Reduced padding for smaller height
    marginHorizontal: 4,
    borderRadius: 16, // Adjusted to match smaller height
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedCategoryButton: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  category: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
  },
  linkText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#D32F2F',
    textAlign: 'center',
    margin: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});


export default ResearchScreen;
