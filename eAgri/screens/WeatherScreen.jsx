// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Button,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   SafeAreaView
// } from "react-native";
// import { MaterialIcons } from "@expo/vector-icons";
// import Header from "../components/Header";

// const WeatherScreen = () => {
//   const [city, setCity] = useState("");
//   const [coordinates, setCoordinates] = useState(null);
//   const [weather, setWeather] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchCoordinates = async () => {
//     setLoading(true);
//     try {
//       const url =
//         "https://nominatim.openstreetmap.org/search?" +
//         `q=${encodeURIComponent(city)}` +
//         "&format=geojson" +
//         "&limit=1";

//       console.log("Nominatim URL:", url);

//       const response = await fetch(url, {
//         headers: {
//           "User-Agent": "YourAppName/1.0 (email@domain.com)",
//         },
//       });

//       if (!response.ok) {
//         throw new Error(
//           `Nominatim request failed with status ${response.status}`
//         );
//       }

//       const data = await response.json();
//       console.log("Nominatim Response JSON:", data);

//       if (!data.features || data.features.length === 0) {
//         throw new Error("No results found. Please check the city name.");
//       }

//       const [lon, lat] = data.features[0].geometry.coordinates;
//       setCoordinates({ lat, lon });
//       setError(null);

//       // Fetch weather data once coordinates are retrieved
//       fetchWeather(lat, lon);
//     } catch (err) {
//       console.error("Error fetching coordinates:", err.message);
//       setError(err.message);
//       setCoordinates(null);
//       setWeather(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchWeather = async (lat, lon) => {
//     setLoading(true);
//     try {
//       const apiKey = "qFD+pfm69W7ZbdZSK1FvOQ==7NiePne5lcjijkC7"; // Replace with your actual API key
//       const weatherUrl = `https://api.api-ninjas.com/v1/weather?lat=${lat}&lon=${lon}`;

//       console.log("Weather API URL:", weatherUrl);

//       const response = await fetch(weatherUrl, {
//         headers: {
//           "X-Api-Key": apiKey,
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Weather API request failed with status ${response.status}`);
//       }

//       const weatherData = await response.json();
//       console.log("Weather Data:", weatherData);

//       setWeather(weatherData);
//       setError(null);
//     } catch (err) {
//       console.error("Error fetching weather:", err.message);
//       setError(err.message);
//       setWeather(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Header title="Weather Forecast" />
//       <Text style={styles.header}>Weather App</Text>

//       <View style={styles.inputContainer}>
//         <TextInput
//           style={styles.input}
//           placeholder="Enter city name"
//           value={city}
//           onChangeText={(text) => setCity(text)}
//         />
//         <Button title="Search" onPress={fetchCoordinates} />
//       </View>

//       {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

//       {error && <Text style={styles.errorText}>Error: {error}</Text>}

//       {coordinates && !loading && (
//         <View style={styles.resultContainer}>
//           <Text style={styles.resultText}>
//             Coordinates for <Text style={styles.boldText}>{city}</Text>:
//           </Text>
//           <Text style={styles.resultText}>Latitude: {coordinates.lat}</Text>
//           <Text style={styles.resultText}>Longitude: {coordinates.lon}</Text>
//         </View>
//       )}

//       {weather && !loading && (
//         <View style={styles.resultContainer}>
//           <Text style={styles.resultText}>Weather for {city}:</Text>
//           <View style={styles.weatherDetailContainer}>
//             <MaterialIcons name="thermostat" size={24} color="black" />
//             <Text style={styles.resultText}>Temperature: {weather.temp}°C</Text>
//           </View>
//           <View style={styles.weatherDetailContainer}>
//             <MaterialIcons name="water-drop" size={24} color="black" />
//             <Text style={styles.resultText}>Humidity: {weather.humidity}%</Text>
//           </View>
//           <View style={styles.weatherDetailContainer}>
//             <MaterialIcons name="air" size={24} color="black" />
//             <Text style={styles.resultText}>Wind Speed: {(weather.wind_speed * 3.6).toFixed(2)} km/h</Text>
//           </View>
//           <View style={styles.weatherDetailContainer}>
//             <MaterialIcons name="wb-sunny" size={24} color="black" />
//             <Text style={styles.resultText}>Sunrise: {new Date(weather.sunrise * 1000).toLocaleTimeString()}</Text>
//           </View>
//           <View style={styles.weatherDetailContainer}>
//             <MaterialIcons name="nightlight-round" size={24} color="black" />
//             <Text style={styles.resultText}>Sunset: {new Date(weather.sunset * 1000).toLocaleTimeString()}</Text>
//           </View>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f0f8ff",
//   },
//   header: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 20,
//     color: "#333",
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   input: {
//     flex: 1,
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginRight: 10,
//     backgroundColor: "#fff",
//   },
//   loader: {
//     marginVertical: 20,
//   },
//   errorText: {
//     color: "red",
//     marginTop: 10,
//     fontSize: 16,
//   },
//   resultContainer: {
//     marginTop: 20,
//     alignItems: "center",
//     backgroundColor: "#e6f7ff",
//     padding: 20,
//     borderRadius: 10,
//     width: "90%",
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     elevation: 5,
//   },
//   resultText: {
//     fontSize: 18,
//     marginVertical: 5,
//     color: "#333",
//   },
//   boldText: {
//     fontWeight: "bold",
//   },
//   weatherDetailContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 5,
//   },
// });

// export default WeatherScreen;


import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
  FlatList,
  Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import Header from "../components/Header";

// Using custom chart implementation (no external dependencies needed)

const WeatherScreen = () => {
  const [city, setCity] = useState("Dhaka");
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = "07c774a8e416591ff63adaa7fd7be489";
  const BASE_URL = "https://pro.openweathermap.org/data/2.5";

  // Weather condition to icon mapping
  const getWeatherIcon = (condition) => {
    const iconMap = {
      'clear': 'wb-sunny',
      'clouds': 'cloud',
      'rain': 'grain',
      'drizzle': 'grain',
      'thunderstorm': 'flash-on',
      'snow': 'ac-unit',
      'mist': 'foggy',
      'fog': 'foggy',
      'haze': 'foggy',
    };
    
    const key = condition.toLowerCase();
    return iconMap[key] || 'wb-sunny';
  };

  // Get weather condition colors for cards
  const getWeatherColors = (condition) => {
    const colorMap = {
      'clear': ['#87CEEB', '#4A90E2'],
      'clouds': ['#B0C4DE', '#778899'],
      'rain': ['#4682B4', '#2F4F4F'],
      'drizzle': ['#4682B4', '#2F4F4F'],
      'thunderstorm': ['#483D8B', '#2F2F2F'],
      'snow': ['#F0F8FF', '#B0C4DE'],
      'mist': ['#D3D3D3', '#A9A9A9'],
      'fog': ['#D3D3D3', '#A9A9A9'],
      'haze': ['#D3D3D3', '#A9A9A9'],
    };
    
    const key = condition.toLowerCase();
    return colorMap[key] || ['#87CEEB', '#4A90E2'];
  };

  // Get dynamic background colors based on weather and time
  const getBackgroundColors = (condition) => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;
    const isEvening = hour >= 16 && hour <= 18;
    const isMorning = hour >= 6 && hour <= 10;
    
    const backgroundMap = {
      'clear': {
        day: ['#87CEEB', '#E0F6FF', '#F5F7FA'], // Sky blue to light blue
        morning: ['#FFE4B5', '#87CEEB', '#E0F6FF'], // Golden morning
        evening: ['#FF7F50', '#FF6347', '#FFE4E1'], // Sunset colors
        night: ['#0674a1', '#0b4a9c', '#054175'], // Deep night blue
      },
      'clouds': {
        day: ['#B0C4DE', '#D3D3D3', '#F0F0F0'], // Steel blue to light gray
        morning: ['#D3D3D3', '#E6E6FA', '#F0F0F0'], // Light morning clouds
        evening: ['#B0C4DE', '#D3D3D3', '#F0F0F0'], // Same as day
        night: ['#2F4F4F', '#708090', '#A9A9A9'], // Dark cloudy night
      },
      'rain': {
        day: ['#4682B4', '#6495ED', '#B0C4DE'], // Dark blue to lighter blue
        morning: ['#4682B4', '#6495ED', '#B0C4DE'], // Same as day
        evening: ['#2F4F4F', '#4682B4', '#6495ED'], // Darker evening rain
        night: ['#191970', '#2F4F4F', '#4682B4'], // Dark rainy night
      },
      'drizzle': {
        day: ['#4682B4', '#6495ED', '#B0C4DE'], // Similar to rain
        morning: ['#4682B4', '#6495ED', '#B0C4DE'],
        evening: ['#2F4F4F', '#4682B4', '#6495ED'],
        night: ['#191970', '#2F4F4F', '#4682B4'],
      },
      'thunderstorm': {
        day: ['#2F2F2F', '#483D8B', '#696969'], // Dark gray to slate blue
        morning: ['#2F2F2F', '#483D8B', '#696969'],
        evening: ['#000000', '#2F2F2F', '#483D8B'], // Darker evening storm
        night: ['#000000', '#191970', '#2F2F2F'], // Very dark stormy night
      },
      'snow': {
        day: ['#F0F8FF', '#FFFFFF', '#F5F5F5'], // Alice blue to white
        morning: ['#E6E6FA', '#F0F8FF', '#FFFFFF'], // Lavender morning snow
        evening: ['#D3D3D3', '#F0F8FF', '#FFFFFF'], // Gray evening snow
        night: ['#483D8B', '#B0C4DE', '#F0F8FF'], // Blue-tinted night snow
      },
      'mist': {
        day: ['#D3D3D3', '#E6E6FA', '#F5F5F5'], // Light gray to lavender
        morning: ['#E6E6FA', '#F0F8FF', '#F5F5F5'], // Misty morning
        evening: ['#D3D3D3', '#E6E6FA', '#F5F5F5'],
        night: ['#2F4F4F', '#708090', '#D3D3D3'], // Dark misty night
      },
      'fog': {
        day: ['#D3D3D3', '#E6E6FA', '#F5F5F5'], // Similar to mist
        morning: ['#E6E6FA', '#F0F8FF', '#F5F5F5'],
        evening: ['#D3D3D3', '#E6E6FA', '#F5F5F5'],
        night: ['#2F4F4F', '#708090', '#D3D3D3'],
      },
      'haze': {
        day: ['#D3D3D3', '#E6E6FA', '#F5F5F5'], // Similar to mist
        morning: ['#E6E6FA', '#F0F8FF', '#F5F5F5'],
        evening: ['#D3D3D3', '#E6E6FA', '#F5F5F5'],
        night: ['#2F4F4F', '#708090', '#D3D3D3'],
      },
    };
    
    const key = condition?.toLowerCase() || 'clear';
    const weatherColors = backgroundMap[key] || backgroundMap['clear'];
    
    // Return colors based on time of day
    if (isNight) return weatherColors.night;
    if (isEvening) return weatherColors.evening;
    if (isMorning) return weatherColors.morning;
    return weatherColors.day;
  };

  // Format date for display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      day: days[date.getDay()],
      date: `${months[date.getMonth()]} ${date.getDate()}`,
      full: date.toLocaleDateString()
    };
  };

  const fetchCurrentWeather = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`,
        {
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CITY_NOT_FOUND');
        } else if (response.status === 401) {
          throw new Error('INVALID_API_KEY');
        } else {
          throw new Error(`Weather API request failed with status ${response.status}`);
        }
      }

      const data = await response.json();
      setCurrentWeather(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching current weather:", err.message);
      
      // Check for network errors
      if (err.name === 'TypeError' && err.message.includes('Network')) {
        throw new Error('Network request failed');
      } else if (err.name === 'AbortError' || err.message.includes('timeout')) {
        throw new Error('Network request timeout');
      }
      
      throw err; // Re-throw to handle in searchWeather
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`,
        {
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CITY_NOT_FOUND');
        } else if (response.status === 401) {
          throw new Error('INVALID_API_KEY');
        } else {
          throw new Error(`Forecast API request failed with status ${response.status}`);
        }
      }

      const data = await response.json();
      
      // Process forecast data to get daily forecasts (4 days, excluding today)
      const dailyForecasts = [];
      const processedDates = new Set();
      const today = new Date().toDateString();
      
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        // Skip today, only get next 4 days
        if (date !== today && !processedDates.has(date) && dailyForecasts.length < 4) {
          processedDates.add(date);
          dailyForecasts.push({
            ...item,
            date: formatDate(item.dt)
          });
        }
      });
      
      // If we don't have 4 days, include today's data to ensure we have enough
      if (dailyForecasts.length < 4) {
        data.list.forEach(item => {
          const date = new Date(item.dt * 1000).toDateString();
          if (!processedDates.has(date) && dailyForecasts.length < 4) {
            processedDates.add(date);
            dailyForecasts.push({
              ...item,
              date: formatDate(item.dt)
            });
          }
        });
      }

      setForecast(dailyForecasts);
      setError(null);
    } catch (err) {
      console.error("Error fetching forecast:", err.message);
      
      // Check for network errors
      if (err.name === 'TypeError' && err.message.includes('Network')) {
        throw new Error('Network request failed');
      } else if (err.name === 'AbortError' || err.message.includes('timeout')) {
        throw new Error('Network request timeout');
      }
      
      throw err; // Re-throw to handle in searchWeather
    }
  };

  const searchWeather = async () => {
    if (!city.trim()) {
      Alert.alert(
        "Invalid Input",
        "Please enter a city name to search for weather information.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([fetchCurrentWeather(), fetchForecast()]);
    } catch (err) {
      console.error("Search weather error:", err.message);
      
      // Handle different types of errors with specific popup messages
      if (err.message === 'CITY_NOT_FOUND') {
        Alert.alert(
          "City Not Found",
          `Sorry, we couldn't find weather information for "${city}". Please check the spelling and try again.`,
          [
            { 
              text: "Try Again", 
              style: "default",
              onPress: () => {
                // Clear the input to let user try again
                setCity("");
              }
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
      } else if (err.message === 'INVALID_API_KEY') {
        Alert.alert(
          "Service Error",
          "There's an issue with the weather service. Please try again later.",
          [{ text: "OK", style: "default" }]
        );
      } else if (err.message.includes('Network') || err.message.includes('timeout')) {
        Alert.alert(
          "Connection Error",
          "Please check your internet connection and try again.",
          [
            { 
              text: "Retry", 
              style: "default",
              onPress: () => searchWeather()
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
      } else {
        Alert.alert(
          "Weather Service Error",
          "Unable to fetch weather data at the moment. Please try again later.",
          [
            { 
              text: "Retry", 
              style: "default",
              onPress: () => searchWeather()
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
      }
      
      setError("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  // Load default weather on component mount with error handling
  useEffect(() => {
    const loadInitialWeather = async () => {
      try {
        await searchWeather();
      } catch (err) {
        // Silent fail on initial load, user can manually search
        console.log("Initial weather load failed, user can search manually");
      }
    };
    
    loadInitialWeather();
  }, []);

  // Custom temperature chart (no external dependencies)
  const renderTemperatureChart = () => {
    if (!forecast) return null;

    const maxTemp = Math.max(...forecast.map(item => item.main.temp));
    const minTemp = Math.min(...forecast.map(item => item.main.temp));
    const tempRange = maxTemp - minTemp || 10;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>4-Day Temperature Trend</Text>
        <View style={styles.fallbackChart}>
          {forecast.map((item, index) => {
            const temp = item.main.temp;
            const height = ((temp - minTemp) / tempRange) * 100 + 30;
            
            return (
              <View key={index} style={styles.chartBar}>
                <Text style={styles.chartTemp}>{Math.round(temp)}°</Text>
                <View 
                  style={[
                    styles.temperatureBar, 
                    { height: height }
                  ]} 
                />
                <Text style={styles.chartDay}>{item.date.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };



  // Render forecast card
  const renderForecastCard = ({ item, index }) => {
    const condition = item.weather[0].main.toLowerCase();
    const colors = getWeatherColors(condition);
    
    return (
      <LinearGradient
        colors={colors}
        style={styles.forecastCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.forecastDay}>{item.date.day}</Text>
        <Text style={styles.forecastDate}>{item.date.date}</Text>
        
        <MaterialIcons 
          name={getWeatherIcon(condition)} 
          size={40} 
          color="#fff" 
          style={styles.forecastIcon}
        />
        
        <Text style={styles.forecastTemp}>{Math.round(item.main.temp)}°C</Text>
        <Text style={styles.forecastCondition}>{item.weather[0].description}</Text>
        
        <View style={styles.forecastDetails}>
          <View style={styles.forecastDetailItem}>
            <MaterialIcons name="water-drop" size={16} color="#fff" />
            <Text style={styles.forecastDetailText}>{item.main.humidity}%</Text>
          </View>
          <View style={styles.forecastDetailItem}>
            <MaterialIcons name="air" size={16} color="#fff" />
            <Text style={styles.forecastDetailText}>{Math.round(item.wind.speed * 3.6)} km/h</Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  // Get current weather condition for dynamic background
  const currentCondition = currentWeather?.weather[0]?.main || 'clear';
  const backgroundColors = getBackgroundColors(currentCondition);

  return (
    <LinearGradient
      colors={backgroundColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.transparentContainer}>
      <Header title="Weather Forecast" />
      <ScrollView contentContainerStyle={styles.scrollView}>

        {/* Search Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter city name"
            value={city}
            onChangeText={setCity}
            returnKeyType="search"
            onSubmitEditing={searchWeather}
          />
          <TouchableOpacity style={styles.searchButton} onPress={searchWeather}>
            <MaterialIcons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
        )}

        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color="#ff4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Current Weather */}
        {currentWeather && !loading && (
          <LinearGradient
            colors={getWeatherColors(currentWeather.weather[0].main)}
            style={styles.currentWeatherCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.currentCity}>{currentWeather.name}</Text>
            <Text style={styles.currentTemp}>{Math.round(currentWeather.main.temp)}°C</Text>
            <Text style={styles.currentCondition}>{currentWeather.weather[0].description}</Text>
            
            <MaterialIcons 
              name={getWeatherIcon(currentWeather.weather[0].main)} 
              size={80} 
              color="#fff" 
              style={styles.currentIcon}
            />
            
            <View style={styles.currentDetails}>
              <View style={styles.currentDetailItem}>
                <MaterialIcons name="thermostat" size={20} color="#fff" />
                <Text style={styles.currentDetailText}>Feels like {Math.round(currentWeather.main.feels_like)}°C</Text>
            </View>
              <View style={styles.currentDetailItem}>
                <MaterialIcons name="water-drop" size={20} color="#fff" />
                <Text style={styles.currentDetailText}>Humidity {currentWeather.main.humidity}%</Text>
            </View>
              <View style={styles.currentDetailItem}>
                <MaterialIcons name="air" size={20} color="#fff" />
                <Text style={styles.currentDetailText}>Wind {Math.round(currentWeather.wind.speed * 3.6)} km/h</Text>
            </View>
            </View>
          </LinearGradient>
        )}

        {/* Temperature Chart */}
        {forecast && !loading && renderTemperatureChart()}

        {/* 4-Day Forecast */}
        {forecast && !loading && (
          <View style={styles.forecastContainer}>
            <Text style={styles.forecastTitle}>4-Day Forecast</Text>
            <FlatList
              data={forecast}
              renderItem={renderForecastCard}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forecastList}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  transparentContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: "rgba(225, 232, 237, 0.8)",
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  searchButton: {
    backgroundColor: "#4A90E2",
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loader: {
    marginVertical: 30,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE6E6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  
  // Current Weather Styles
  currentWeatherCard: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  currentCity: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  currentTemp: {
    fontSize: 64,
    fontWeight: "300",
    color: "#fff",
    marginBottom: 5,
  },
  currentCondition: {
    fontSize: 18,
    color: "#fff",
    textTransform: "capitalize",
    marginBottom: 15,
  },
  currentIcon: {
    marginBottom: 15,
  },
  currentDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  currentDetailItem: {
    alignItems: "center",
    flex: 1,
  },
  currentDetailText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },

  // Chart Styles
  chartContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  chart: {
    borderRadius: 16,
  },
  
  // Fallback Chart Styles
  fallbackChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 180,
    paddingVertical: 10,
    paddingTop: 30,
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  chartTemp: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    position: "absolute",
    top: -25,
  },
  temperatureBar: {
    width: 18,
    backgroundColor: "#4A90E2",
    borderRadius: 9,
    marginBottom: 8,
    minHeight: 30,
  },
  chartDay: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },

  // Forecast Styles
  forecastContainer: {
    marginBottom: 20,
  },
  forecastTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  forecastList: {
    paddingLeft: 5,
  },
  forecastCard: {
    width: 160,
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  forecastDay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  forecastDate: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 15,
  },
  forecastIcon: {
    marginBottom: 10,
  },
  forecastTemp: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  forecastCondition: {
    fontSize: 12,
    color: "#fff",
    textTransform: "capitalize",
    textAlign: "center",
    marginBottom: 15,
    opacity: 0.9,
  },
  forecastDetails: {
    width: "100%",
  },
  forecastDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  forecastDetailText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 5,
  },
});

export default WeatherScreen;
