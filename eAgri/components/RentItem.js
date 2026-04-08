import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native-gesture-handler";

const RentItem = ({ rentItem }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log("Card Pressed!");
        }}
      >
        <Image
          source={{
            uri: rentItem.image,
          }}
          style={styles.cardImage}
        />
        <View style={styles.cardDetails}>
          <Text style={styles.cardTitle}>{rentItem.title}</Text>
          <Text style={styles.cardOwner}>{rentItem.owner}</Text>
          <Text style={styles.cardLocation}>{rentItem.location}</Text>
          <Text style={styles.cardPrice}>{rentItem.price}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default RentItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    elevation: 3,
    borderWidth: 1,

  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardDetails: {
    flex: 1,
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardOwner: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  cardLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
});
