import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from '@expo/vector-icons'
import Icon from 'react-native-vector-icons/Ionicons'
import React from 'react'

const Header = ({title}) => {
    const navigation = useNavigation();
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <AntDesign name="back" size={24} color="#555" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity>
                {/* <Icon name="create-outline" size={24} color="#555" /> */}
            </TouchableOpacity>
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "#fff",
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#555",
      },
})