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


import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Header from "../components/Header";

const WeatherScreen = () => {
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCoordinates = async () => {
    setLoading(true);
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        `q=${encodeURIComponent(city)}` +
        "&format=geojson" +
        "&limit=1";

        console.log("Nominatim URL:", url);

        const response = await fetch(url, {
          headers: {
            "User-Agent": "YourAppName/1.0 (email@domain.com)",
          },
        });

      if (!response.ok) {
        throw new Error(
          `Nominatim request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Nominatim Response JSON:", data);

      if (!data.features || data.features.length === 0) {
        throw new Error("No results found. Please check the city name.");
      }

      const [lon, lat] = data.features[0].geometry.coordinates;
      setCoordinates({ lat, lon });
      setError(null);

      fetchWeather(lat, lon);
    } catch (err) {
      console.error("Error fetching coordinates:", err.message);
      setError(err.message);
      setCoordinates(null);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    try {
      const apiKey = "qFD+pfm69W7ZbdZSK1FvOQ==7NiePne5lcjijkC7"; // Replace with your actual API key
      const weatherUrl = `https://api.api-ninjas.com/v1/weather?lat=${lat}&lon=${lon}`;

      const response = await fetch(weatherUrl, {
        headers: {
          "X-Api-Key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Weather API request failed with status ${response.status}`);
      }

      const weatherData = await response.json();

      setWeather(weatherData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Weather Forecast" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* <Text style={styles.header}>Weather App</Text> */}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter city name"
            value={city}
            onChangeText={(text) => setCity(text)}
          />
          <TouchableOpacity style={styles.searchButton} onPress={fetchCoordinates}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
        )}

        {error && <Text style={styles.errorText}>Error: {error}</Text>}

        {coordinates && !loading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Coordinates for {city}:</Text>
            <Text style={styles.cardText}>Latitude: {coordinates.lat}</Text>
            <Text style={styles.cardText}>Longitude: {coordinates.lon}</Text>
          </View>
        )}

        {weather && !loading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weather for {city}:</Text>

            <View style={styles.detailRow}>
              <MaterialIcons name="thermostat" size={24} color="#333" />
              <Text style={styles.cardText}>Temperature: {weather.temp}°C</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="water-drop" size={24} color="#333" />
              <Text style={styles.cardText}>Humidity: {weather.humidity}%</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="air" size={24} color="#333" />
              <Text style={styles.cardText}>
                Wind Speed: {(weather.wind_speed * 3.6).toFixed(2)} km/h
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="wb-sunny" size={24} color="#333" />
              <Text style={styles.cardText}>
                Sunrise: {new Date(weather.sunrise * 1000).toLocaleTimeString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="nightlight-round" size={24} color="#333" />
              <Text style={styles.cardText}>
                Sunset: {new Date(weather.sunset * 1000).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: Platform.OS === "android" ? 40 : 0, // SafeAreaView padding for Android
  },
  scrollView: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
  },
  searchButton: {
    backgroundColor: "#4A90E2",
    marginLeft: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 100,
  },
  searchButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 20,
    fontSize: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});

export default WeatherScreen;