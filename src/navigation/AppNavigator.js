import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Image, View, Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ChannelScreen from '../screens/ChannelScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.background,
                        borderBottomColor: colors.border,
                        borderBottomWidth: 1,
                        shadowColor: 'transparent',
                    },
                    headerTintColor: colors.primary,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        color: colors.text,
                    },
                    cardStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        headerTitle: () => (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Image
                                    source={require('../../assets/icon.png')}
                                    style={{ width: 30, height: 30, marginRight: 10, borderRadius: 5 }}
                                />
                                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }}>codeRed X</Text>
                            </View>
                        ),
                        title: 'codeRed X' // Fallback
                    }}
                />
                <Stack.Screen
                    name="Channel"
                    component={ChannelScreen}
                    options={{
                        title: '',
                        headerShown: true,
                        headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
                        headerLeft: () => null // Hides the back button
                    }}
                />
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: 'Configuration' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
